/**
 * 策略: PatternConsensus 多周期形态共识
 * 来源: basic/patterns/analyzeMultiTimeframePatterns
 * 核心流程:
 * - 对 weekly/daily/1hour 三周期识别并综合多个价格形态；
 * - 计算综合方向与信号强度(signalStrength)，可选要求“多周期一致”；
 * - 当综合强度超过阈值时，按方向发出信号。
 *
 * 入场:
 * - combinedSignal 为 Bullish 且 signalStrength >= 阈值 -> 做多
 * - combinedSignal 为 Bearish 且 signalStrength >= 阈值 -> 做空
 * - requireAllAligned 为 true 时，只有三周期一致才入场
 *
 * 数据来源:
 * - 周线近似由日线聚合（当前实现按5日聚合；可替换为 util.aggregateDailyToWeekly 提升精度）
 *
 * 出场与风控: Backtester 统一管理（止损/止盈/追踪止损、滑点/手续费）。
 * 前视说明: 仅使用 history[0..i] 判定，在 i+1 开盘成交。
 *
 * 关键参数:
 * - minSignalStrength: 综合强度阈值
 * - requireAllAligned: 是否要求三周期一致
 * - coolDownBars: 冷静期
 * - lookback: 日线窗口长度
 */
import type { Candle } from '../../../types.js';
import { backtestStrategiesConfig } from '../strategyConfig.js';
import {
  analyzeMultiTimeframePatterns,
  PatternDirection,
  type ComprehensivePatternAnalysis,
} from '../../basic/patterns/analyzeMultiTimeframePatterns.js';
import type { Strategy, Signal } from '../Backtester.js';

export interface PatternConsensusParams {
  minSignalStrength?: number; // 综合信号强度阈值 (0-100)
  requireAllAligned?: boolean; // 是否要求三周期一致
  coolDownBars?: number; // 冷静期
  lookback?: number; // 窗口长度
}

export function PatternConsensusStrategy(
  symbol: string,
  timeframe: 'daily',
  params: PatternConsensusParams = {}
): Strategy {
  const {
    minSignalStrength = backtestStrategiesConfig.patternConsensus
      .minSignalStrength,
    requireAllAligned = backtestStrategiesConfig.patternConsensus
      .requireAllAligned,
    coolDownBars = backtestStrategiesConfig.patternConsensus.coolDownBars,
    lookback = backtestStrategiesConfig.patternConsensus.lookback,
  } = params;

  let lastSignalIndex = -1;
  let lastDirection: 'long' | 'short' | 'flat' | undefined = undefined;

  return {
    name: 'PatternConsensus',
    generateSignal(history: Candle[], i: number): Signal | null {
      if (i < Math.min(120, lookback / 2)) return null;
      if (i - lastSignalIndex < coolDownBars) return null;

      const dailyData = history.slice(Math.max(0, i - lookback + 1), i + 1);

      // 近似聚合周线：每5天取一根（已存在 util.aggregateDailyToWeekly 但此处只需近似）
      const weeklyData: Candle[] = [];
      for (let j = 0; j < dailyData.length; j += 5) {
        const slice = dailyData.slice(j, Math.min(j + 5, dailyData.length));
        if (!slice.length) continue;
        weeklyData.push({
          symbol: slice[0].symbol,
          open: slice[0].open,
          high: Math.max(...slice.map(c => c.high)),
          low: Math.min(...slice.map(c => c.low)),
          close: slice[slice.length - 1].close,
          volume: slice.reduce((s, c) => s + c.volume, 0),
          timestamp: slice[slice.length - 1].timestamp,
        });
      }

      // 小时数据缺失时传空数组，内部不会报错
      const hourlyData: Candle[] = [];

      const analysis: ComprehensivePatternAnalysis =
        analyzeMultiTimeframePatterns(weeklyData, dailyData, hourlyData);

      if (analysis.signalStrength < minSignalStrength) return null;

      const tfa = analysis.timeframeAnalyses;
      const weeklySig = tfa.find(a => a.timeframe === 'weekly')?.patternSignal;
      const dailySig = tfa.find(a => a.timeframe === 'daily')?.patternSignal;
      const hourlySig = tfa.find(a => a.timeframe === '1hour')?.patternSignal;

      const allAligned =
        weeklySig &&
        dailySig &&
        hourlySig &&
        weeklySig === dailySig &&
        dailySig === hourlySig;

      if (requireAllAligned && !allAligned) return null;

      let direction: 'long' | 'short' | 'flat' = 'flat';
      if (analysis.combinedSignal === PatternDirection.Bullish)
        direction = 'long';
      else if (analysis.combinedSignal === PatternDirection.Bearish)
        direction = 'short';

      if (direction === 'flat') return null;

      const signal: Signal = {
        timestamp: history[i].timestamp,
        direction,
        strength: Math.min(95, Math.max(60, analysis.signalStrength)),
        reason: `形态共识(${requireAllAligned ? '三周期一致' : '综合偏向'}) ${analysis.description}`,
      };

      // 避免短时间内方向反转噪声
      if (
        lastDirection &&
        signal.direction !== lastDirection &&
        i - lastSignalIndex < coolDownBars * 2 &&
        (signal.strength ?? 0) < 80
      ) {
        return null;
      }

      lastSignalIndex = i;
      lastDirection = signal.direction;
      return signal;
    },
  };
}
