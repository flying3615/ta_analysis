/**
 * 关键位合并与管理模块
 * 负责从各个分析模块收集关键位，进行合并和去重处理
 */

import type { KeyLevel } from '../../types.js';
import type {
  AnalysisInputData,
  KeyLevelMergeResult,
  IntegrationContext,
} from './IntegrationTypes.js';
import type { IntegrationConfig } from './IntegrationConfig.js';

export class KeyLevelManager {
  constructor(private config: IntegrationConfig) {}

  /**
   * 从所有分析结果中提取并合并关键位
   */
  extractAndMergeKeyLevels(
    input: AnalysisInputData,
    context: IntegrationContext
  ): KeyLevelMergeResult {
    const allLevels: KeyLevel[] = [];

    // 从各个模块提取关键位
    allLevels.push(...this.extractChipKeyLevels(input.analyses.chip));
    allLevels.push(...this.extractPatternKeyLevels(input.analyses.pattern));
    allLevels.push(...this.extractBBSRKeyLevels(input.analyses.bbsr));
    allLevels.push(...this.extractStructureKeyLevels(input.analyses.structure));
    allLevels.push(
      ...this.extractSupplyDemandKeyLevels(input.analyses.supplyDemand)
    );
    allLevels.push(...this.extractRangeKeyLevels(input.analyses.range));
    allLevels.push(...this.extractTrendlineKeyLevels(input.analyses.trendline));

    const originalCount = allLevels.length;

    // 排序关键位
    const sortedLevels = this.sortKeyLevels(allLevels);

    // 合并相近的关键位
    const mergedLevels = this.mergeNearbyLevels(sortedLevels);

    const mergedCount = mergedLevels.length;
    const compressionRatio =
      originalCount > 0 ? mergedCount / originalCount : 1;

    return {
      mergedLevels,
      originalCount,
      mergedCount,
      compressionRatio,
    };
  }

  /**
   * 从筹码分析提取关键位
   */
  private extractChipKeyLevels(
    chipAnalysis: AnalysisInputData['analyses']['chip']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];
    const timeframe = chipAnalysis.primaryTimeframe;

    // 使用聚合的支撑/阻力位
    chipAnalysis.aggregatedSupportLevels?.forEach((price, index) => {
      levels.push({
        price,
        type: 'support',
        strength: index < 2 ? 'strong' : 'moderate',
        source: 'chip',
        timeframe,
        description: `筹码聚合支撑位 #${index + 1}`,
      });
    });

    chipAnalysis.aggregatedResistanceLevels?.forEach((price, index) => {
      levels.push({
        price,
        type: 'resistance',
        strength: index < 2 ? 'strong' : 'moderate',
        source: 'chip',
        timeframe,
        description: `筹合聚合阻力位 #${index + 1}`,
      });
    });

    return levels;
  }

  /**
   * 从形态分析提取关键位
   */
  private extractPatternKeyLevels(
    patternAnalysis: AnalysisInputData['analyses']['pattern']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];
    // 从各时间框架主导形态中提取关键位（突破位、止损位）
    patternAnalysis.timeframeAnalyses?.forEach(tfa => {
      const dp = tfa.dominantPattern;
      if (!dp) return;
      // 突破位作为关键位
      const breakout = dp.component?.breakoutLevel;
      if (typeof breakout === 'number') {
        levels.push({
          price: breakout,
          type: dp.direction === 'bullish' ? 'resistance' : 'support',
          strength: dp.reliability > 70 ? 'strong' : 'moderate',
          source: 'pattern',
          timeframe: tfa.timeframe,
          description: `形态突破位 (${tfa.timeframe})`,
        });
      }
      // 止损位
      if (typeof dp.stopLoss === 'number') {
        levels.push({
          price: dp.stopLoss,
          type: dp.direction === 'bullish' ? 'support' : 'resistance',
          strength: 'moderate',
          source: 'pattern',
          timeframe: tfa.timeframe,
          description: `形态止损位 (${tfa.timeframe})`,
        });
      }
    });

    return levels;
  }

  /**
   * 从BBSR分析提取关键位
   */
  private extractBBSRKeyLevels(
    bbsrAnalysis: AnalysisInputData['analyses']['bbsr']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];

    // 从BBSR日线和周线结果中提取关键位
    const bbsrSignals = [
      bbsrAnalysis.dailyBBSRResult,
      bbsrAnalysis.weeklyBBSRResult,
    ].filter(Boolean);
    bbsrSignals.forEach(signal => {
      levels.push({
        price: signal!.SRLevel,
        type:
          signal!.signal.patternType === 'bullish' ? 'support' : 'resistance',
        strength: signal!.strength > 70 ? 'strong' : 'moderate',
        source: 'bbsr',
        timeframe: 'daily',
        description: `BBSR关键信号位`,
      });
    });

    return levels;
  }

  /**
   * 从结构分析提取关键位
   */
  private extractStructureKeyLevels(
    structureAnalysis: AnalysisInputData['analyses']['structure']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];

    // 结构突破位
    // 部分结构实现可能没有 lastBreakLevel，这里仅基于趋势与基本关键点提取

    // 关键摆动点
    (structureAnalysis as any).swingPoints?.forEach(
      (point: any, index: number) => {
        if (index < 3) {
          // 只取最近3个摆动点
          levels.push({
            price: point.price,
            type: point.type === 'high' ? 'resistance' : 'support',
            strength: 'moderate',
            source: 'structure',
            timeframe: structureAnalysis.timeframe,
            description: `结构摆动${point.type === 'high' ? '高' : '低'}点`,
          });
        }
      }
    );

    return levels;
  }

  /**
   * 从供需分析提取关键位
   */
  private extractSupplyDemandKeyLevels(
    sdAnalysis: AnalysisInputData['analyses']['supplyDemand']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];

    // 供需区域
    sdAnalysis.zones?.forEach((zone, index) => {
      if (zone.status === 'fresh' || zone.status === 'tested') {
        // 区域上边界
        levels.push({
          price: (zone as any).upper ?? zone.high,
          type: zone.type === 'demand' ? 'support' : 'resistance',
          strength: zone.status === 'fresh' ? 'strong' : 'moderate',
          source: 'supplyDemand',
          timeframe: sdAnalysis.timeframe,
          description: `${zone.type === 'demand' ? '需求' : '供应'}区域上边界`,
        });

        // 区域下边界
        levels.push({
          price: (zone as any).lower ?? zone.low,
          type: zone.type === 'demand' ? 'support' : 'resistance',
          strength: zone.status === 'fresh' ? 'strong' : 'moderate',
          source: 'supplyDemand',
          timeframe: sdAnalysis.timeframe,
          description: `${zone.type === 'demand' ? '需求' : '供应'}区域下边界`,
        });
      }
    });

    return levels;
  }

  /**
   * 从区间分析提取关键位
   */
  private extractRangeKeyLevels(
    rangeAnalysis: AnalysisInputData['analyses']['range']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];

    // 区间上下边界
    if (rangeAnalysis.range) {
      levels.push({
        price: (rangeAnalysis.range as any).upper ?? rangeAnalysis.range.high,
        type: 'resistance',
        strength: 'moderate',
        source: 'range',
        timeframe: rangeAnalysis.timeframe,
        description: '区间上边界',
      });

      levels.push({
        price: (rangeAnalysis.range as any).lower ?? rangeAnalysis.range.low,
        type: 'support',
        strength: 'moderate',
        source: 'range',
        timeframe: rangeAnalysis.timeframe,
        description: '区间下边界',
      });
    }

    return levels;
  }

  /**
   * 从趋势线分析提取关键位
   */
  private extractTrendlineKeyLevels(
    trendlineAnalysis: AnalysisInputData['analyses']['trendline']
  ): KeyLevel[] {
    const levels: KeyLevel[] = [];

    // 趋势通道边界
    if (trendlineAnalysis.channel) {
      // trendline types 使用 upper/lower 或者 upperBand/lowerBand，这里兼容
      const upper =
        (trendlineAnalysis.channel as any).upperBand ??
        (trendlineAnalysis.channel as any).upper?.high;
      const lower =
        (trendlineAnalysis.channel as any).lowerBand ??
        (trendlineAnalysis.channel as any).lower?.low;
      if (typeof upper === 'number') {
        levels.push({
          price: upper,
          type: 'resistance',
          strength: 'moderate',
          source: 'trendline',
          timeframe: trendlineAnalysis.timeframe,
          description: '趋势通道上边界',
        });
      }

      if (typeof lower === 'number') {
        levels.push({
          price: lower,
          type: 'support',
          strength: 'moderate',
          source: 'trendline',
          timeframe: trendlineAnalysis.timeframe,
          description: '趋势通道下边界',
        });
      }
    }

    return levels;
  }

  /**
   * 排序关键位（按价格）
   */
  private sortKeyLevels(levels: KeyLevel[]): KeyLevel[] {
    return [...levels].sort((a, b) => a.price - b.price);
  }

  /**
   * 合并相近的关键位
   */
  private mergeNearbyLevels(sortedLevels: KeyLevel[]): KeyLevel[] {
    if (sortedLevels.length === 0) return [];

    const mergedLevels: KeyLevel[] = [];
    const mergeTolerancePercent = 0.01; // 1%的容忍度

    for (let i = 0; i < sortedLevels.length; i++) {
      const currentLevel = sortedLevels[i];

      if (mergedLevels.length === 0) {
        mergedLevels.push({ ...currentLevel });
        continue;
      }

      const lastMerged = mergedLevels[mergedLevels.length - 1];
      const priceDiff = Math.abs(currentLevel.price - lastMerged.price);
      const averagePrice = (currentLevel.price + lastMerged.price) / 2;
      const tolerance = averagePrice * mergeTolerancePercent;

      if (priceDiff <= tolerance) {
        // 合并相近的价位
        this.mergeTwoLevels(lastMerged, currentLevel);
      } else {
        mergedLevels.push({ ...currentLevel });
      }
    }

    return mergedLevels;
  }

  /**
   * 合并两个关键位
   */
  private mergeTwoLevels(target: KeyLevel, source: KeyLevel): void {
    // 使用加权平均价格
    const totalWeight =
      this.getStrengthWeight(target.strength) +
      this.getStrengthWeight(source.strength);
    const targetWeight = this.getStrengthWeight(target.strength) / totalWeight;
    const sourceWeight = this.getStrengthWeight(source.strength) / totalWeight;

    target.price = target.price * targetWeight + source.price * sourceWeight;

    // 如果类型相同，提升强度
    if (target.type === source.type) {
      if (source.strength === 'strong' || target.strength === 'strong') {
        target.strength = 'strong';
      }
    }

    // 合并来源信息
    if (target.source !== source.source) {
      target.source = 'combined';
      target.description = `${target.description} + ${source.description}`;
    }

    // 选择更高级别的时间周期
    if (
      this.getTimeframeRank(source.timeframe) >
      this.getTimeframeRank(target.timeframe)
    ) {
      target.timeframe = source.timeframe;
    }
  }

  /**
   * 获取强度权重
   */
  private getStrengthWeight(strength: string): number {
    switch (strength) {
      case 'strong':
        return 3;
      case 'moderate':
        return 2;
      case 'weak':
        return 1;
      default:
        return 1;
    }
  }

  /**
   * 获取时间周期等级
   */
  private getTimeframeRank(timeframe: string): number {
    switch (timeframe) {
      case 'weekly':
        return 3;
      case 'daily':
        return 2;
      case '1hour':
        return 1;
      default:
        return 1;
    }
  }

  /**
   * 过滤关键位（按距离当前价格的距离）
   */
  filterKeyLevelsByDistance(
    levels: KeyLevel[],
    currentPrice: number,
    maxDistancePercent: number = 0.1
  ): KeyLevel[] {
    return levels.filter(level => {
      const distance = Math.abs(level.price - currentPrice) / currentPrice;
      return distance <= maxDistancePercent;
    });
  }

  /**
   * 获取最强的关键位
   */
  getStrongestLevels(levels: KeyLevel[], count: number = 5): KeyLevel[] {
    return levels
      .sort((a, b) => {
        // 先按强度排序，再按来源权重排序
        const strengthDiff =
          this.getStrengthWeight(b.strength) -
          this.getStrengthWeight(a.strength);
        if (strengthDiff !== 0) return strengthDiff;

        return this.getSourceWeight(b.source) - this.getSourceWeight(a.source);
      })
      .slice(0, count);
  }

  /**
   * 获取来源权重
   */
  private getSourceWeight(source: string): number {
    switch (source) {
      case 'combined':
        return 5;
      case 'chip':
        return 4;
      case 'structure':
        return 4;
      case 'bbsr':
        return 3;
      case 'pattern':
        return 3;
      case 'supplyDemand':
        return 3;
      case 'trendline':
        return 2;
      case 'range':
        return 2;
      default:
        return 1;
    }
  }
}
