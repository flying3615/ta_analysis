/**
 * 唐奇安突破的过滤器。
 *
 * 每个过滤器在突破当天（信号K线）评估，只使用该K线及之前的数据，给出：
 * - pass：通过
 * - fail：不通过（跳过这次突破）
 * - undecided：数据不足或分析失败，无法判断。用于回测时按"通过"处理，并单独计数
 *
 * 过滤器只描述突破当天的情况，所以入场计划模式也在突破当天（创建计划时）评估。
 */
import type { Candle } from '../../types.js';
import { analyzeMarketStructure } from '../analyzer/structure/structureDetector.js';
import { analyzeSupplyDemandZone } from '../analyzer/supplyDemand/sdDetector.js';
import type { Zone } from '../analyzer/supplyDemand/sdTypes.js';
import { calculateVolatilityAnalysis } from '../analyzer/volatility/volatilityAnalysis.js';
import {
  ATR_SESSIONS,
  ENTRY_CHANNEL_SESSIONS,
  donchianAtr,
  type DonchianFilter,
} from './strategies/DonchianStrategy.js';

export type FilterVerdict = 'pass' | 'fail' | 'undecided';
export type FilterName = 'volume' | 'structure' | 'zone' | 'volatility';
type Direction = 'long' | 'short';

/* eslint-disable no-unused-vars -- 函数类型参数名的误报 */
export interface BreakoutFilter {
  name: FilterName;
  label: string;
  evaluate: (
    history: Candle[],
    i: number,
    direction: Direction
  ) => FilterVerdict;
}
/* eslint-enable no-unused-vars */

/** 截至第 i 根（含）的最近 size 根K线，保证不会用到未来数据 */
function windowUpTo(history: Candle[], i: number, size: number): Candle[] {
  return history.slice(Math.max(0, i - size + 1), i + 1);
}

/** 放量突破：突破当天成交量 ≥ multiple × 前 lookback 日平均成交量 */
export function volumeFilter(
  options: { multiple?: number; lookback?: number } = {}
): BreakoutFilter {
  const { multiple = 1.5, lookback = 20 } = options;
  return {
    name: 'volume',
    label: '放量突破',
    evaluate(history, i) {
      if (i < lookback) return 'undecided';
      const prior = history.slice(i - lookback, i);
      const avg = prior.reduce((s, c) => s + c.volume, 0) / lookback;
      const volume = history[i].volume;
      if (!(avg > 0) || !(volume > 0)) return 'undecided';
      return volume >= multiple * avg ? 'pass' : 'fail';
    },
  };
}

/** 结构趋势一致：市场结构模块的趋势与突破方向相同 */
export function structureFilter(
  options: { window?: number } = {}
): BreakoutFilter {
  const { window = 300 } = options;
  return {
    name: 'structure',
    label: '结构趋势一致',
    evaluate(history, i, direction) {
      try {
        const { trend } = analyzeMarketStructure(
          windowUpTo(history, i, window),
          'daily'
        );
        return trend === (direction === 'long' ? 'up' : 'down')
          ? 'pass'
          : 'fail';
      } catch {
        return 'undecided';
      }
    },
  };
}

/**
 * 上方无供给区（做空：下方无需求区）：
 * 从收盘价往突破方向 atrMultiple × ATR 的范围内，没有未被突破的反向区域；
 * 收盘价位于反向区域内部也算不通过。
 */
export function zoneFilter(
  options: {
    atrMultiple?: number;
    window?: number;
    // eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
    analyze?: (data: Candle[]) => Zone[];
  } = {}
): BreakoutFilter {
  const {
    atrMultiple = 2,
    window = 300,
    analyze = data => analyzeSupplyDemandZone('X', data, 'daily').zones,
  } = options;
  return {
    name: 'zone',
    label: '上方无供给区',
    evaluate(history, i, direction) {
      if (i < ATR_SESSIONS + 1) return 'undecided';
      const atr = donchianAtr(
        windowUpTo(history, i, ENTRY_CHANNEL_SESSIONS + 1)
      );
      if (atr === undefined) return 'undecided';
      let zones: Zone[];
      try {
        zones = analyze(windowUpTo(history, i, window));
      } catch {
        return 'undecided';
      }
      const close = history[i].close;
      const band = atrMultiple * atr;
      const blocked = zones.some(z => {
        if (z.status === 'broken') return false;
        return direction === 'long'
          ? z.type === 'supply' && z.high > close && z.low <= close + band
          : z.type === 'demand' && z.low < close && z.high >= close - band;
      });
      return blocked ? 'fail' : 'pass';
    },
  };
}

/** 波动率不极端：波动率模块的状态不是 extreme */
export function volatilityFilter(
  options: {
    window?: number;
    // eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
    regime?: (data: Candle[]) => string;
  } = {}
): BreakoutFilter {
  const {
    window = 252,
    regime = data => calculateVolatilityAnalysis(data).volatilityRegime,
  } = options;
  return {
    name: 'volatility',
    label: '波动率不极端',
    evaluate(history, i) {
      const data = windowUpTo(history, i, window);
      if (data.length < 30) return 'undecided';
      try {
        return regime(data) === 'extreme' ? 'fail' : 'pass';
      } catch {
        return 'undecided';
      }
    },
  };
}

/** 4 个预先确定的过滤器 */
export const BREAKOUT_FILTERS: Record<FilterName, BreakoutFilter> = {
  volume: volumeFilter(),
  structure: structureFilter(),
  zone: zoneFilter(),
  volatility: volatilityFilter(),
};

/**
 * 组合成 DonchianStrategy 的 filter：所有过滤器都通过才算通过；
 * undecided 按通过处理，并在 undecidedCounts 中按过滤器名计数。
 */
export function toDonchianFilter(
  filters: BreakoutFilter[],
  undecidedCounts: Record<string, number> = {}
): DonchianFilter {
  return (history, i, direction) =>
    filters.every(f => {
      const verdict = f.evaluate(history, i, direction);
      if (verdict === 'undecided') {
        undecidedCounts[f.name] = (undecidedCounts[f.name] ?? 0) + 1;
        return true;
      }
      return verdict === 'pass';
    });
}
