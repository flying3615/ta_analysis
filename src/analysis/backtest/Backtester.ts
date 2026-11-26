import { Candle } from '../../types.js';

export type SignalDirection = 'long' | 'short' | 'flat';

export interface Signal {
  timestamp: Date;
  direction: SignalDirection;
  strength?: number; // 0-100
  entry?: number; // optional suggested entry
  stop?: number; // optional stop loss
  targets?: number[]; // optional take profit targets
  reason?: string;
}

export interface Strategy {
  name: string;
  // Given slice of candles up to index i (inclusive), return signal for next bar
  generateSignal: (
    history: Candle[],
    i: number
  ) => Promise<Signal | null> | Signal | null;
}

export interface BacktestConfig {
  initialCapital: number;
  positionSizing: number; // 0-1 fraction per trade
  maxConcurrentPositions: number;
  commissionPerTrade: number; // fixed commission
  slippageBps: number; // basis points of price on entry/exit
  allowShort: boolean;
  periodsPerYear?: number; // Sharpe 年化周期数；不填时根据K线间隔推断
  exitParams?: {
    takeProfitPercent?: number;
    stopLossPercent?: number;
    trailingStopPercent?: number;
  };
}

export interface Trade {
  entryIdx: number;
  exitIdx: number;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
}

export interface BacktestResult {
  trades: Trade[];
  totalPnL: number;
  returns: number[]; // per-step returns for equity curve
  equity: number[];
  metrics: {
    winRate: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    sharpe: number;
    tradeCount: number;
  };
}

function calcSharpe(returns: number[], periodsPerYear: number): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const varr =
    returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  const std = Math.sqrt(Math.max(varr, 0));
  if (std === 0) return 0;
  return (mean * Math.sqrt(periodsPerYear)) / std;
}

/**
 * 根据K线时间间隔推断每年的周期数：
 * 周线 52；日线按交易日数（有周末K线时 365，否则 252）；
 * 日内按"每天的K线数 × 交易日数"。
 */
export function inferPeriodsPerYear(candles: Candle[]): number {
  if (candles.length < 2) return 252;
  const gaps: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    gaps.push(
      candles[i].timestamp.getTime() - candles[i - 1].timestamp.getTime()
    );
  }
  gaps.sort((a, b) => a - b);
  const medianGap = gaps[Math.floor(gaps.length / 2)];
  const day = 86400000;
  if (medianGap >= 4 * day) return 52;

  // 出现周末K线说明是全年交易的市场（如加密货币）
  const hasWeekend = candles.some(c => {
    const d = c.timestamp.getUTCDay();
    return d === 0 || d === 6;
  });
  const tradingDays = hasWeekend ? 365 : 252;
  if (medianGap >= 0.5 * day) return tradingDays;

  // 日内：统计每个 UTC 日期的K线数，取中位数
  const perDay = new Map<string, number>();
  for (const c of candles) {
    const key = c.timestamp.toISOString().slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const counts = [...perDay.values()].sort((a, b) => a - b);
  const barsPerDay = counts[Math.floor(counts.length / 2)];
  return tradingDays * barsPerDay;
}

function calcMaxDrawdown(equity: number[]): number {
  let peak = equity[0];
  let maxDd = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

export class Backtester {
  private config: BacktestConfig;
  constructor(config?: Partial<BacktestConfig>) {
    this.config = {
      initialCapital: 100000,
      positionSizing: 0.2,
      maxConcurrentPositions: 1,
      commissionPerTrade: 0,
      slippageBps: 5,
      allowShort: true,
      ...config,
    };
  }

  async run(candles: Candle[], strategy: Strategy): Promise<BacktestResult> {
    // 现金只记录已实现盈亏（开仓不扣本金），持仓按未实现盈亏计入权益
    let cash = this.config.initialCapital;
    let positionQty = 0;
    let positionSide: 'long' | 'short' | null = null;
    let entryPrice = 0;
    let entryIdx = 0;
    let stopPrice: number | undefined; // 来自策略信号的止损价
    let targetPrice: number | undefined; // 来自策略信号的第一目标价
    let peakOrTroughPrice = 0; // For trailing stop
    const trades: Trade[] = [];
    const equity: number[] = [];
    const stepReturns: number[] = [];

    const unrealisedPnL = (price: number): number => {
      if (!positionSide) return 0;
      return positionSide === 'long'
        ? (price - entryPrice) * positionQty
        : (entryPrice - price) * positionQty;
    };

    const pushEquity = (value: number): void => {
      const lastEquity =
        equity.length > 0
          ? equity[equity.length - 1]
          : this.config.initialCapital;
      equity.push(value);
      stepReturns.push((value - lastEquity) / lastEquity);
    };

    const closePosition = (exitPrice: number, exitIdx: number): void => {
      if (!positionSide) return;
      const pnl = unrealisedPnL(exitPrice);
      cash += pnl - this.config.commissionPerTrade;
      trades.push({
        entryIdx,
        exitIdx,
        direction: positionSide,
        entryPrice,
        exitPrice,
        qty: positionQty,
        pnl,
      });
      positionQty = 0;
      positionSide = null;
      stopPrice = undefined;
      targetPrice = undefined;
      peakOrTroughPrice = 0; // Reset trailing stop tracker
    };

    for (let i = 50; i < candles.length - 1; i++) {
      const signal = await strategy.generateSignal(candles.slice(0, i + 1), i);
      const nextOpen = candles[i + 1].open;
      const slip = nextOpen * (this.config.slippageBps / 10000);
      pushEquity(cash + unrealisedPnL(candles[i].close));

      // 1. 出场逻辑 (Exit Logic)
      // ----------------------------------------------------------------
      if (positionSide) {
        const currentPrice = candles[i].close;
        const isLong = positionSide === 'long';
        const pnlRatio = isLong
          ? (currentPrice - entryPrice) / entryPrice
          : (entryPrice - currentPrice) / entryPrice;

        const tp = this.config.exitParams?.takeProfitPercent;
        const sl = this.config.exitParams?.stopLossPercent;
        const ts = this.config.exitParams?.trailingStopPercent;

        let shouldExit = false;

        // 固定止盈/止损
        if (tp && pnlRatio >= tp / 100) shouldExit = true;
        if (sl && pnlRatio <= -sl / 100) shouldExit = true;

        // 策略信号给出的止损/目标价
        if (stopPrice !== undefined) {
          if (isLong ? currentPrice <= stopPrice : currentPrice >= stopPrice)
            shouldExit = true;
        }
        if (targetPrice !== undefined) {
          if (
            isLong ? currentPrice >= targetPrice : currentPrice <= targetPrice
          )
            shouldExit = true;
        }

        // 追踪止损逻辑：先用此前的峰值（谷值）判断本根K线是否触发，
        // 再用本根K线更新峰值。同一根K线内无法知道高低点的先后顺序。
        if (ts && !shouldExit) {
          if (isLong) {
            const trailingStopLevel = peakOrTroughPrice * (1 - ts / 100);
            if (candles[i].low <= trailingStopLevel) {
              shouldExit = true;
            }
          } else {
            // short
            const trailingStopLevel = peakOrTroughPrice * (1 + ts / 100);
            if (candles[i].high >= trailingStopLevel) {
              shouldExit = true;
            }
          }
        }
        if (ts) {
          peakOrTroughPrice = isLong
            ? Math.max(peakOrTroughPrice, candles[i].high)
            : Math.min(peakOrTroughPrice, candles[i].low);
        }

        // 来自策略的平仓信号
        if (signal && signal.direction === 'flat') shouldExit = true;

        if (shouldExit) {
          closePosition(nextOpen - (isLong ? slip : -slip), i + 1);
          continue; // Exit processed, skip to next candle
        }
      }

      // 如果没有信号或已有持仓，则跳过入场逻辑
      if (!signal || positionSide) continue;

      const isLongEntry = signal.direction === 'long';
      const isShortEntry =
        signal.direction === 'short' && this.config.allowShort;
      if (!isLongEntry && !isShortEntry) continue;

      const entry = isLongEntry ? nextOpen + slip : nextOpen - slip;
      positionQty = (cash * this.config.positionSizing) / entry;
      positionSide = isLongEntry ? 'long' : 'short';
      entryPrice = entry;
      entryIdx = i + 1;
      peakOrTroughPrice = entry; // Initialize for trailing stop
      // 只接受位于入场价正确一侧的止损/目标价
      stopPrice =
        signal.stop !== undefined &&
        (isLongEntry ? signal.stop < entry : signal.stop > entry)
          ? signal.stop
          : undefined;
      const firstTarget = signal.targets?.[0];
      targetPrice =
        firstTarget !== undefined &&
        (isLongEntry ? firstTarget > entry : firstTarget < entry)
          ? firstTarget
          : undefined;
      cash -= this.config.commissionPerTrade;
    }

    // 在回测结束时，清算所有未平仓头寸
    if (positionSide) {
      const lastPrice = candles[candles.length - 1].close;
      const slip = lastPrice * (this.config.slippageBps / 10000);
      closePosition(
        lastPrice - (positionSide === 'long' ? slip : -slip),
        candles.length - 1
      );
    }

    // 最终权益：所有头寸已平仓，权益等于现金
    pushEquity(cash);
    const totalPnL = cash - this.config.initialCapital;

    // metrics
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);
    const winRate = trades.length ? wins.length / trades.length : 0;
    const avgWin = wins.length
      ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length
      : 0;
    const avgLoss = losses.length
      ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length
      : 0;
    const maxDrawdown = calcMaxDrawdown(equity);
    const sharpe = calcSharpe(
      stepReturns,
      this.config.periodsPerYear ?? inferPeriodsPerYear(candles)
    );

    return {
      trades,
      totalPnL,
      returns: stepReturns,
      equity,
      metrics: {
        winRate,
        avgWin,
        avgLoss,
        maxDrawdown,
        sharpe,
        tradeCount: trades.length,
      },
    };
  }
}
