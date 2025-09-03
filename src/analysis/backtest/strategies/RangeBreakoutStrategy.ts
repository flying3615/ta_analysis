/**
 * 策略: RangeBreakout 区间突破
 * 来源: analyzer/range/rangeDetector
 * 核心流程:
 * 1) 在最近约200根K线中识别“收缩区间”(range)；
 * 2) 评估是否发生有效突破（突破阈值、量能扩张、跟随延续、是否回踩）并计算质量分；
 * 3) 符合条件则在下一根开盘按 Backtester 规则入场。
 *
 * 入场:
 * - 多头: 上沿突破，qualityScore >= minQuality；若 requireRetest=true 则需回踩确认
 * - 空头: 下沿突破，规则对称
 *
 * 出场与风控: 由 Backtester 统一执行（固定止损/止盈、追踪止损、滑点与手续费），仓位比例由 positionSizing 决定。
 * 前视说明: 本策略仅使用 history[0..i] 判定，成交在 i+1 的开盘价，避免前视偏差。
 *
 * 关键参数:
 * - minQuality (0-100): 突破质量阈值
 * - requireRetest: 是否要求突破后的回踩确认
 */
import type { Candle } from '../../../types.js';
import { backtestStrategiesConfig } from '../strategyConfig.js';
import { analyzeRange } from '../../analyzer/range/rangeDetector.js';
import type { Strategy, Signal } from '../Backtester.js';

export interface RangeBreakoutParams {
  minQuality?: number; // 0-100
  requireRetest?: boolean;
}

export function RangeBreakoutStrategy(
  symbol: string,
  timeframe: 'weekly' | 'daily' | '1hour',
  params: RangeBreakoutParams = {}
): Strategy {
  const {
    minQuality = backtestStrategiesConfig.rangeBreakout.minQuality,
    requireRetest = backtestStrategiesConfig.rangeBreakout.requireRetest,
  } = params;

  return {
    name: 'RangeBreakout',
    generateSignal(history: Candle[], i: number): Signal | null {
      if (i < 60) return null;
      const window = history.slice(Math.max(0, i - 200), i + 1);
      const res = analyzeRange(symbol, window, timeframe);
      if (!res.breakout) return null;
      if (requireRetest && !res.breakout.retested) return null;
      if ((res.breakout.qualityScore ?? 0) < minQuality) return null;
      return {
        timestamp: history[i].timestamp,
        direction: res.breakout.direction === 'up' ? 'long' : 'short',
        strength: res.breakout.qualityScore,
        reason: 'Range breakout' + (requireRetest ? ' with retest' : ''),
      };
    },
  };
}
