import type { Candle } from '../../types.js';
import { findPivotPoints, type PivotPoint } from '../analyzer/sr/srDetector.js';
import {
  analyzeTrendlinesAndChannels,
  type TrendlineChannelAnalysisResult,
} from '../analyzer/trendline/trendlineDetector.js';
import {
  analyzeSupplyDemandZone,
  type SdAnalysisResult,
} from '../analyzer/supplyDemand/sdDetector.js';
import type { Zone } from '../analyzer/supplyDemand/sdTypes.js';

/**
 * 统一分析结果的类型定义
 */
export interface UnifiedAnalysisResult {
  symbol: string;
  timeframe: string;
  pivots: PivotPoint[];
  trendAnalysis: TrendlineChannelAnalysisResult;
  sdAnalysis: SdAnalysisResult;
  tradingSignals: TradingSignal[];
  summary: string;
}

/**
 * 交易信号的类型定义
 */
export interface TradingSignal {
  type: 'long' | 'short';
  quality: 'high' | 'medium' | 'low';
  reason: string;
  entryZone: Zone;
  // 未来可以添加止损、止盈建议
}

/**
 * 运行统一的量化分析
 * @param symbol - 交易对标识
 * @param data - K线数据
 * @param timeframe - 时间周期
 * @returns UnifiedAnalysisResult - 统一分析结果
 */
export function runUnifiedAnalysis(
  symbol: string,
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): UnifiedAnalysisResult {
  // 1. 基础结构分析：找出所有摆动点
  const pivots = findPivotPoints(data, { leftBars: 5, rightBars: 5 });

  // 2. 趋势分析：传入摆动点来绘制更精确的趋势线
  const trendAnalysis = analyzeTrendlinesAndChannels(
    symbol,
    data,
    timeframe,
    pivots
  );

  // 3. 供需区分析
  const sdAnalysis = analyzeSupplyDemandZone(symbol, data, timeframe);

  // 4. 综合与筛选：基于规则生成交易信号
  const tradingSignals: TradingSignal[] = [];
  const mainTrend =
    trendAnalysis.channel && trendAnalysis.channel.slope > 0
      ? 'up'
      : trendAnalysis.channel && trendAnalysis.channel.slope < 0
      ? 'down'
      : 'ranging';

  for (const zone of sdAnalysis.recentEffectiveZones) {
    if (zone.status === 'broken') continue;

    // 规则 1: 顺势交易 - 在上升趋势中寻找需求区
    if (mainTrend === 'up' && zone.type === 'demand') {
      let quality: 'high' | 'medium' = 'medium';
      const reasons: string[] = ['顺应上升趋势'];

      // 规则 2: 区域汇合 (Confluence) - 检查是否与结构点或趋势线重合
      const isAtPivotLow = pivots.some(
        p => p.type === 'low' && Math.abs(p.price - zone.high) < zone.high - zone.low
      );
      const isAtTrendlineSupport =
        trendAnalysis.channel &&
        Math.abs(
          trendAnalysis.channel.lower.slope * zone.endIndex +
            trendAnalysis.channel.lower.intercept -
            zone.low
        ) <
          zone.high - zone.low;

      if (isAtPivotLow) reasons.push('与前期摆动低点汇合');
      if (isAtTrendlineSupport) reasons.push('与趋势线支撑位汇合');

      if (isAtPivotLow || isAtTrendlineSupport) {
        quality = 'high';
      }

      tradingSignals.push({
        type: 'long',
        quality,
        reason: `做多信号 (${quality}): ${reasons.join(', ')}.`,
        entryZone: zone,
      });
    }

    // 规则 1: 顺势交易 - 在下降趋势中寻找供应区
    if (mainTrend === 'down' && zone.type === 'supply') {
      let quality: 'high' | 'medium' = 'medium';
      const reasons: string[] = ['顺应下降趋势'];

      // 规则 2: 区域汇合 (Confluence)
      const isAtPivotHigh = pivots.some(
        p => p.type === 'high' && Math.abs(p.price - zone.low) < zone.high - zone.low
      );
      const isAtTrendlineResistance =
        trendAnalysis.channel &&
        Math.abs(
          trendAnalysis.channel.upper.slope * zone.endIndex +
            trendAnalysis.channel.upper.intercept -
            zone.high
        ) <
          zone.high - zone.low;

      if (isAtPivotHigh) reasons.push('与前期摆动高点汇合');
      if (isAtTrendlineResistance) reasons.push('与趋势线阻力位汇合');

      if (isAtPivotHigh || isAtTrendlineResistance) {
        quality = 'high';
      }

      tradingSignals.push({
        type: 'short',
        quality,
        reason: `做空信号 (${quality}): ${reasons.join(', ')}.`,
        entryZone: zone,
      });
    }
  }

  const summary = `主趋势: ${mainTrend}. 发现 ${sdAnalysis.recentEffectiveZones.length} 个有效供需区, 生成 ${tradingSignals.length} 个交易信号.`;

  return {
    symbol,
    timeframe,
    pivots,
    trendAnalysis,
    sdAnalysis,
    tradingSignals,
    summary,
  };
}
