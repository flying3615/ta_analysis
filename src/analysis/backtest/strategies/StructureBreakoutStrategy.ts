/**
 * 策略: StructureBreakout 市场结构突破
 * 来源: analyzer/structure/structureDetector.analyzeMarketStructure
 * 核心流程:
 * - 在滑动窗口内识别 swing/结构，检测结构事件(lastEvent)，如 BOS/CHOCH；
 * - 可选择仅在结构趋势与事件方向一致时交易(confirmTrend)；
 * - 设置最小回看长度与冷静期，避免过度交易。
 *
 * 入场:
 * - 事件向上(bullish) -> 做多；事件向下(bearish) -> 做空；
 * - preferEvent: 仅交易 BOS / CHOCH / 任意(any)。
 *
 * 出场与风控: Backtester 统一处理（固定止损/止盈、追踪止损、佣金/滑点）。
 * 前视说明: 判定仅用 history[0..i]，在 i+1 开盘成交。
 *
 * 关键参数:
 * - preferEvent: 'BOS' | 'CHOCH' | 'any'
 * - confirmTrend: 是否要求与结构趋势一致
 * - minLookback: 最小历史长度门槛
 * - coolDownBars: 信号冷静期
 */
import type { Candle } from '../../../types.js';
import { backtestStrategiesConfig } from '../strategyConfig.js';
import { analyzeMarketStructure } from '../../analyzer/structure/structureDetector.js';
import type { Strategy, Signal } from '../Backtester.js';

export interface StructureStrategyParams {
  preferEvent?: 'BOS' | 'CHOCH' | 'any';
  confirmTrend?: boolean;
  minLookback?: number;
  coolDownBars?: number;
}

export function StructureBreakoutStrategy(
  symbol: string,
  timeframe: 'weekly' | 'daily' | '1hour',
  params: StructureStrategyParams = {}
): Strategy {
  const {
    preferEvent = backtestStrategiesConfig.structureBreakout.preferEvent,
    confirmTrend = backtestStrategiesConfig.structureBreakout.confirmTrend,
    minLookback = backtestStrategiesConfig.structureBreakout.minLookback,
    coolDownBars = backtestStrategiesConfig.structureBreakout.coolDownBars,
  } = params;

  let lastSignalIndex = -1;
  let lastDirection: 'long' | 'short' | 'flat' | undefined = undefined;

  return {
    name: 'StructureBreakout',
    generateSignal(history: Candle[], i: number): Signal | null {
      if (i < minLookback) return null;
      if (i - lastSignalIndex < coolDownBars) return null;

      const window = history.slice(Math.max(0, i - 300), i + 1);
      const res = analyzeMarketStructure(window, timeframe);

      const evt = res.lastEvent;
      if (!evt) return null;

      // 事件过滤
      if (preferEvent !== 'any' && evt.type !== preferEvent) return null;

      // 趋势一致性过滤
      if (confirmTrend) {
        if (evt.direction === 'bullish' && res.trend !== 'up') return null;
        if (evt.direction === 'bearish' && res.trend !== 'down') return null;
      }

      let signal: Signal | null = null;
      if (evt.direction === 'bullish') {
        signal = {
          timestamp: history[i].timestamp,
          direction: 'long',
          strength: evt.type === 'BOS' ? 85 : 70,
          reason: `${timeframe} 结构事件: ${evt.type} 向上 (${res.summary})`,
        };
      } else if (evt.direction === 'bearish') {
        signal = {
          timestamp: history[i].timestamp,
          direction: 'short',
          strength: evt.type === 'BOS' ? 85 : 70,
          reason: `${timeframe} 结构事件: ${evt.type} 向下 (${res.summary})`,
        };
      }

      // 避免短时间内方向反转噪声
      if (
        signal &&
        lastDirection &&
        signal.direction !== lastDirection &&
        i - lastSignalIndex < coolDownBars * 2 &&
        (signal.strength ?? 0) < 80
      ) {
        return null;
      }

      if (signal) {
        lastSignalIndex = i;
        lastDirection = signal.direction;
      }

      return signal;
    },
  };
}


