/**
 * 策略: 唐奇安 System 2（与 stock-scanner-tauri 的 Rust 实现保持一致）
 *
 * 通道与突破（对应 domain/donchian/evaluator.rs）:
 * - 入场通道：被评估K线之前 55 根的最高价 / 最低价（不含当前K线）
 * - 出场通道：之前 20 根的最低价（做多）/ 最高价（做空）
 * - 突破：收盘价严格高于入场通道高点（做多）/ 严格低于低点（做空）
 * - 过热：已突破且收盘价离出场线超过 overheatPct（默认 15%）时，不算突破
 * - ATR：只用最近 56 根K线；前 14 个真实波幅取平均作为种子，其余按 Wilder 平滑
 * - 比较使用 1e-9 的容差，恰好落在边界上的值不会被浮点误差推到另一侧
 *
 * 模式:
 * - breakout：突破当天收盘后发出信号，回测器在下一根K线开盘成交
 * - entryPlan：突破后创建入场计划（对应 domain/donchian/entry_plan.rs）
 *   - 每根K线按顺序检查：反向突破 → 作废；到期 → 结束；回撤 → 确认
 *   - 回撤：收盘价 ≤ 信号线 + pullbackAtr × ATR（做多）
 *   - 确认：在回撤之后的另一根K线，收盘价 ≥ 信号线（做多）
 *   - 到期：信号后第 planExpiryBars 根K线（默认 15）
 *   - 反向突破：反方向的严格突破（不检查过热）
 *
 * 回测中的约定（Rust app 由人工创建计划，这里必须定一个规则）:
 * - 没有持仓且没有活动计划时，突破当天自动创建计划
 * - 计划活动期间的连续突破不会创建新计划
 * - 计划结束后，需要先出现一根"非突破"收盘，同方向才能再创建计划
 *
 * 出场: 持仓时收盘价严格越过出场线（做多：低于 20 日低点）发出 flat 信号。
 * 风险单位: riskPerShare = riskAtrMultiple × ATR（默认 2 × ATR），只用于计算 R，不执行止损。
 * 无法离线复现的部分: 流动性/市值/风险筛选和新闻催化剂检查。
 */
import type { Candle } from '../../../types.js';
import type { PositionContext, Signal, Strategy } from '../Backtester.js';

export const ENTRY_CHANNEL_SESSIONS = 55;
export const EXIT_CHANNEL_SESSIONS = 20;
export const ATR_SESSIONS = 14;
const COMPARISON_EPSILON = 1e-9;

type Direction = 'long' | 'short';

/** value > threshold，对表示误差有容差 */
const exceeds = (value: number, threshold: number) =>
  value > threshold + COMPARISON_EPSILON;
const atMost = (value: number, threshold: number) =>
  value <= threshold + COMPARISON_EPSILON;
const atLeast = (value: number, threshold: number) =>
  value + COMPARISON_EPSILON >= threshold;

export function trueRange(previous: Candle, current: Candle): number {
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close)
  );
}

/**
 * 与 Rust wilder_atr 相同：用窗口内前 14 个真实波幅的平均值作为种子，
 * 之后每个真实波幅按 Wilder 方式平滑。ATR 不为正或数据不足时返回 undefined。
 */
export function donchianAtr(window: Candle[]): number | undefined {
  if (window.length < ATR_SESSIONS + 1) return undefined;
  let atr = 0;
  for (let k = 1; k <= ATR_SESSIONS; k++) {
    atr += trueRange(window[k - 1], window[k]) / ATR_SESSIONS;
  }
  for (let k = ATR_SESSIONS + 1; k < window.length; k++) {
    atr =
      (atr * (ATR_SESSIONS - 1)) / ATR_SESSIONS +
      trueRange(window[k - 1], window[k]) / ATR_SESSIONS;
  }
  return Number.isFinite(atr) && atr > 0 ? atr : undefined;
}

export interface DonchianEvaluation {
  state: 'breakout' | 'overheated' | 'none' | 'insufficient';
  entryLine: number; // 做多：55 日高点；做空：55 日低点
  exitLine: number; // 做多：20 日低点；做空：20 日高点
  atr?: number;
}

/** 按 Rust 的带符号距离（百分比）：做多为 (close − line) / line，做空相反 */
function signedDistancePct(direction: Direction, close: number, line: number) {
  return direction === 'long'
    ? ((close - line) / line) * 100
    : ((line - close) / line) * 100;
}

/**
 * 评估 data[idx] 这根已收盘K线在某个方向上的唐奇安状态。
 * overheatPct 为 Infinity 时不检查过热（用于判断反向信号）。
 */
export function evaluateDonchian(
  data: Candle[],
  idx: number,
  direction: Direction,
  overheatPct = 15
): DonchianEvaluation {
  if (idx < ENTRY_CHANNEL_SESSIONS || idx >= data.length) {
    return { state: 'insufficient', entryLine: NaN, exitLine: NaN };
  }
  const prior = data.slice(idx - ENTRY_CHANNEL_SESSIONS, idx);
  const exitWindow = prior.slice(-EXIT_CHANNEL_SESSIONS);
  const close = data[idx].close;

  const entryLine =
    direction === 'long'
      ? Math.max(...prior.map(b => b.high))
      : Math.min(...prior.map(b => b.low));
  const exitLine =
    direction === 'long'
      ? Math.min(...exitWindow.map(b => b.low))
      : Math.max(...exitWindow.map(b => b.high));
  const atr = donchianAtr(data.slice(idx - ENTRY_CHANNEL_SESSIONS, idx + 1));

  const brokenOut = exceeds(signedDistancePct(direction, close, entryLine), 0);
  let state: DonchianEvaluation['state'] = 'none';
  if (brokenOut) {
    state = exceeds(signedDistancePct(direction, close, exitLine), overheatPct)
      ? 'overheated'
      : 'breakout';
  }
  return { state, entryLine, exitLine, atr };
}

/** 突破过滤器：返回 false 时跳过这次突破 */
// 基础规则 no-unused-vars 会把函数类型里的参数名误报为未使用
/* eslint-disable no-unused-vars */
export type DonchianFilter = (
  history: Candle[],
  i: number,
  direction: Direction
) => boolean;
/* eslint-enable no-unused-vars */

/**
 * 唐奇安出场：持仓时收盘价严格越过之前 20 根的出场线（做多：低于最低价）时发出 flat 信号。
 * 随机入场对照也使用这个函数，保证两者的出场完全相同。
 */
export function donchianExitSignal(
  history: Candle[],
  i: number,
  position: PositionContext
): Signal | null {
  const ev = evaluateDonchian(history, i, position.side);
  if (ev.state === 'insufficient') return null;
  const close = history[i].close;
  const exitTriggered =
    position.side === 'long' ? close < ev.exitLine : close > ev.exitLine;
  return exitTriggered
    ? {
        timestamp: history[i].timestamp,
        direction: 'flat',
        reason: `收盘价越过 20 日出场线 ${ev.exitLine}`,
      }
    : null;
}

export interface DonchianParams {
  mode?: 'breakout' | 'entryPlan';
  longOnly?: boolean; // 只做多（回测器的 allowShort 也会拦截做空）
  riskAtrMultiple?: number; // 风险单位 = 倍数 × ATR，默认 2
  overheatPct?: number; // 默认 15
  pullbackAtr?: number; // 回撤区宽度（ATR 倍数），默认 0.25
  planExpiryBars?: number; // 计划有效K线数，默认 15
  /** 过滤器：返回 false 时跳过这次突破（breakout 模式在入场时、entryPlan 模式在创建计划时调用） */
  filter?: DonchianFilter;
}

interface EntryPlan {
  direction: Direction;
  signalIdx: number;
  signalLine: number;
  atr: number;
  pullbackUpper: number;
  pullbackLower: number;
  confirmationPrice: number;
  expiresIdx: number;
  pullbackSeenIdx?: number;
}

export type DonchianStrategyInstance = Strategy & {
  /** 本次回测中创建过的入场计划数量（便于检查规则） */
  plansCreated: () => number;
};

export function DonchianStrategy(
  params: DonchianParams = {}
): DonchianStrategyInstance {
  const {
    mode = 'breakout',
    longOnly = false,
    riskAtrMultiple = 2,
    overheatPct = 15,
    pullbackAtr = 0.25,
    planExpiryBars = 15,
    filter,
  } = params;
  const directions: Direction[] = longOnly ? ['long'] : ['long', 'short'];

  let plan: EntryPlan | undefined;
  let plansCreated = 0;
  // 某方向是否允许创建新计划：创建后关闭，出现一根非突破收盘后重新打开
  const armed: Record<Direction, boolean> = { long: true, short: true };

  const entrySignal = (
    history: Candle[],
    i: number,
    direction: Direction,
    atr: number | undefined,
    reason: string
  ): Signal => ({
    timestamp: history[i].timestamp,
    direction,
    riskPerShare: atr !== undefined ? riskAtrMultiple * atr : undefined,
    reason,
  });

  /** 按 Rust 的顺序推进计划：反向突破 → 到期 → 回撤 → 确认 */
  const advancePlan = (history: Candle[], i: number): Signal | null => {
    if (!plan || i <= plan.signalIdx) return null;
    const p = plan;
    const close = history[i].close;
    const opposite: Direction = p.direction === 'long' ? 'short' : 'long';

    if (evaluateDonchian(history, i, opposite, Infinity).state === 'breakout') {
      plan = undefined; // INVALIDATED
      return null;
    }
    if (i >= p.expiresIdx) {
      plan = undefined; // EXPIRED
      return null;
    }
    if (p.pullbackSeenIdx === undefined) {
      const reached =
        p.direction === 'long'
          ? atMost(close, p.pullbackUpper)
          : atLeast(close, p.pullbackLower);
      if (reached) p.pullbackSeenIdx = i;
      return null;
    }
    if (i > p.pullbackSeenIdx) {
      const confirmed =
        p.direction === 'long'
          ? atLeast(close, p.confirmationPrice)
          : atMost(close, p.confirmationPrice);
      if (confirmed) {
        plan = undefined; // DECISION_REQUIRED → 回测中视为入场
        return {
          ...entrySignal(
            history,
            i,
            p.direction,
            p.atr,
            `唐奇安入场计划：回撤后重新站回信号线 ${p.signalLine}`
          ),
          // 信号K线是突破当天（创建计划的K线），不是确认日
          signalIdx: p.signalIdx,
        };
      }
    }
    return null;
  };

  return {
    name: mode === 'entryPlan' ? 'DonchianEntryPlan' : 'DonchianBreakout',
    plansCreated: () => plansCreated,

    generateSignal(history, i, position) {
      if (position) {
        plan = undefined; // 持仓期间不保留计划
        return donchianExitSignal(history, i, position);
      }

      const evaluations = directions.map(direction => ({
        direction,
        ev: evaluateDonchian(history, i, direction, overheatPct),
      }));

      if (mode === 'breakout') {
        for (const { direction, ev } of evaluations) {
          if (ev.state !== 'breakout') continue;
          if (filter && !filter(history, i, direction)) continue;
          return entrySignal(
            history,
            i,
            direction,
            ev.atr,
            `唐奇安突破：收盘价越过 55 日通道 ${ev.entryLine}`
          );
        }
        return null;
      }

      // entryPlan 模式
      const fromPlan = advancePlan(history, i);
      if (fromPlan) return fromPlan;

      for (const { direction, ev } of evaluations) {
        if (ev.state !== 'breakout') {
          armed[direction] = true;
          continue;
        }
        if (plan || !armed[direction] || ev.atr === undefined) continue;
        if (filter && !filter(history, i, direction)) continue;
        const zone = pullbackAtr * ev.atr;
        plan = {
          direction,
          signalIdx: i,
          signalLine: ev.entryLine,
          atr: ev.atr,
          pullbackUpper: ev.entryLine + zone,
          pullbackLower: ev.entryLine - zone,
          confirmationPrice: ev.entryLine,
          expiresIdx: i + planExpiryBars,
        };
        armed[direction] = false;
        plansCreated++;
      }
      return null;
    },
  };
}
