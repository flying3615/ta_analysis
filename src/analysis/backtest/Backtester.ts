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

function calcSharpe(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const varr =
    returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  const std = Math.sqrt(Math.max(varr, 0));
  if (std === 0) return 0;
  return (mean * Math.sqrt(252)) / std;
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
    let cash = this.config.initialCapital;
    let positionQty = 0;
    let positionSide: 'long' | 'short' | null = null;
    let entryPrice = 0;
    let peakOrTroughPrice = 0; // For trailing stop
    const trades: Trade[] = [];
    const equity: number[] = [];
    const stepReturns: number[] = [];

    for (let i = 50; i < candles.length - 1; i++) {
      const signal = await strategy.generateSignal(candles.slice(0, i + 1), i);
      const nextOpen = candles[i + 1].open;
      const slip = nextOpen * (this.config.slippageBps / 10000);
      const portfolioValue = positionSide
        ? positionSide === 'long'
          ? positionQty * candles[i].close // 多头持仓市值
          : positionQty * (2 * entryPrice - candles[i].close) // 空头持仓市值（简化）
        : 0;
      const currentEquity = cash + portfolioValue;
      equity.push(currentEquity);

      const lastEquity =
        equity.length > 1
          ? equity[equity.length - 2]
          : this.config.initialCapital;
      const dailyReturn = (currentEquity - lastEquity) / lastEquity;
      stepReturns.push(dailyReturn);

      // 1. 出场逻辑 (Exit Logic)
      // ----------------------------------------------------------------
      if (positionSide) {
        const currentPrice = candles[i].close;
        const pnlRatio =
          positionSide === 'long'
            ? (currentPrice - entryPrice) / entryPrice
            : (entryPrice - currentPrice) / entryPrice;

        const tp = this.config.exitParams?.takeProfitPercent;
        const sl = this.config.exitParams?.stopLossPercent;
        const ts = this.config.exitParams?.trailingStopPercent;

        let shouldExit = false;

        // 固定止盈/止损
        if (tp && pnlRatio >= tp / 100) shouldExit = true;
        if (sl && pnlRatio <= -sl / 100) shouldExit = true;

        // 追踪止损逻辑
        if (ts && !shouldExit) {
          if (positionSide === 'long') {
            peakOrTroughPrice = Math.max(peakOrTroughPrice, candles[i].high);
            const trailingStopLevel = peakOrTroughPrice * (1 - ts / 100);
            if (candles[i].low <= trailingStopLevel) {
              shouldExit = true;
            }
          } else {
            // short
            peakOrTroughPrice = Math.min(peakOrTroughPrice, candles[i].low);
            const trailingStopLevel = peakOrTroughPrice * (1 + ts / 100);
            if (candles[i].high >= trailingStopLevel) {
              shouldExit = true;
            }
          }
        }

        // 来自策略的平仓信号
        if (signal && signal.direction === 'flat') shouldExit = true;

        if (shouldExit) {
          const exitPrice = nextOpen - (positionSide === 'long' ? slip : -slip);
          const pnl =
            positionSide === 'long'
              ? (exitPrice - entryPrice) * positionQty
              : (entryPrice - exitPrice) * positionQty;
          cash += pnl - this.config.commissionPerTrade;
          trades.push({
            entryIdx:
              trades.length > 0 ? trades[trades.length - 1].exitIdx : 50, // Approximate
            exitIdx: i + 1,
            direction: positionSide,
            entryPrice,
            exitPrice,
            qty: positionQty,
            pnl,
          });
          positionQty = 0;
          positionSide = null;
          peakOrTroughPrice = 0; // Reset trailing stop tracker
          continue; // Exit processed, skip to next candle
        }
      }

      // 如果没有信号，则跳过入场逻辑
      if (!signal) continue;

      // exit logic
      if (positionSide && signal.direction === 'flat') {
        const exitPrice = nextOpen - (positionSide === 'long' ? slip : -slip);
        const pnl =
          positionSide === 'long'
            ? (exitPrice - entryPrice) * positionQty
            : (entryPrice - exitPrice) * positionQty;
        cash += pnl - this.config.commissionPerTrade;
        trades.push({
          entryIdx: i,
          exitIdx: i + 1,
          direction: positionSide,
          entryPrice,
          exitPrice,
          qty: positionQty,
          pnl,
        });
        positionQty = 0;
        positionSide = null;
        continue;
      }

      // entry logic
      if (!positionSide) {
        if (signal.direction === 'long') {
          const entry = nextOpen + slip;
          const qty = (cash * this.config.positionSizing) / entry;
          positionQty = qty;
          positionSide = 'long';
          entryPrice = entry;
          peakOrTroughPrice = entry; // Initialize for trailing stop
          cash -= this.config.commissionPerTrade;
        } else if (signal.direction === 'short' && this.config.allowShort) {
          const entry = nextOpen - slip;
          const qty = (cash * this.config.positionSizing) / entry;
          positionQty = qty;
          positionSide = 'short';
          entryPrice = entry;
          peakOrTroughPrice = entry; // Initialize for trailing stop
          cash -= this.config.commissionPerTrade;
        }
      }
    }

    // 在回测结束时，清算所有未平仓头寸
    if (positionSide) {
      const lastPrice = candles[candles.length - 1].close;
      const slip = lastPrice * (this.config.slippageBps / 10000);
      const exitPrice = lastPrice - (positionSide === 'long' ? slip : -slip);
      const pnl =
        positionSide === 'long'
          ? (exitPrice - entryPrice) * positionQty
          : (entryPrice - exitPrice) * positionQty;

      cash += pnl - this.config.commissionPerTrade;

      trades.push({
        entryIdx: trades.length > 0 ? trades[trades.length - 1].exitIdx : 50, // Approximate entry index
        exitIdx: candles.length - 1,
        direction: positionSide,
        entryPrice,
        exitPrice,
        qty: positionQty,
        pnl,
      });

      // 更新最终权益
      const finalEquity = cash;
      equity.push(finalEquity);

      positionQty = 0;
      positionSide = null;
    }

    // final equity mark
    if (equity.length === 0) equity.push(this.config.initialCapital);
    const totalPnL = equity[equity.length - 1] - this.config.initialCapital;

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
    const sharpe = calcSharpe(stepReturns);

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
