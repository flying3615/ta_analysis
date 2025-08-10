import { toEDTString } from '../util/util.js';
import { IntegratedTradePlan } from '../types.js';

// Common separator constants
const SEPARATOR = '='.repeat(80);
const SECTION_SEPARATOR = '-'.repeat(80);

/**
 * Helper function to build a section of the output
 */
function buildSection(
  title: string,
  content: string,
  useSeparator: boolean = true
): string {
  let output = '';
  if (useSeparator) {
    output += `\n${SECTION_SEPARATOR}\n`;
  }
  output += `\n【${title}】\n`;
  output += content;
  return output;
}

/**
 * 格式化交易计划输出结果
 * 将IntegratedTradePlan对象转换为更简洁高效的格式化字符串输出
 * @param tradePlan 综合交易计划对象
 * @param combinedVolumeVolatilitySummary
 * @param volumeAnalysisReason
 * @param volatilityAnalysisReason
 * @returns 格式化的输出字符串
 */
function formatTradePlanOutput(
  tradePlan: IntegratedTradePlan,
  combinedVolumeVolatilitySummary: string,
  volumeAnalysisReason: string,
  volatilityAnalysisReason: string
): string {
  // 初始化输出字符串
  let output = '';

  // 1. 标题和基本信息 - 简洁显示
  output += `${SEPARATOR}\n`;
  output += `交易计划 | ${tradePlan.symbol} | ${new Date(tradePlan.date).toLocaleString()} ｜ ${tradePlan.currentPrice}\n`;

  // 2. 核心信息 - 信号、方向和总结
  output += buildSection(
    '综合信号',
    `方向: ${formatDirection(tradePlan.direction)} | 强度: ${formatSignalStrength(tradePlan.signalStrength)} | 确信度: ${tradePlan.confidenceScore.toFixed(1)}/100\n` +
      `${tradePlan.summary}\n`,
    false
  );

  // 2.1 各子分析关键建议摘要
  output += buildSection(
    '各子分析关键建议',
    `筹码: ${tradePlan.summaries.chipSummary}\n` +
      `形态/逆转: ${tradePlan.summaries.patternSummary}\n` +
      `支阻位: ${tradePlan.summaries.bbsrSummary}\n` +
      `波动率/量能: ${tradePlan.summaries.vvSummary}\n` +
      `结构: ${tradePlan.summaries.structureSummary || '—'}\n` +
      `供需区: ${tradePlan.summaries.supplyDemandSummary || '—'}\n` +
      `区间/突破: ${tradePlan.summaries.rangeSummary || '—'}\n`
  );

  // 3. 入场策略 - 合并为简洁格式
  const criticalConditions = tradePlan.entryStrategy.entryConditions
    .filter(c => c.priority === 'critical' || c.priority === 'important')
    .map(c => `${formatPriority(c.priority)} ${c.description}`)
    .join('\n  ');

  output += buildSection(
    '入场策略',
    `价格: ${tradePlan.currentPrice.toFixed(2)} ➔ ${tradePlan.entryStrategy.idealEntryPrice.toFixed(2)} (${formatEntryType(tradePlan.entryStrategy.entryType)})\n` +
      `区间: ${tradePlan.entryStrategy.priceZones.ideal[0].toFixed(2)}-${tradePlan.entryStrategy.priceZones.ideal[1].toFixed(2)} | 风险: ${formatRiskLevel(tradePlan.entryStrategy.riskLevel)}\n` +
      `条件:\n  ${criticalConditions}\n`
  );

  // 4. 出场策略 - 合并为简洁格式
  let exitContent = `止盈目标:\n`;
  tradePlan.exitStrategy.takeProfitLevels.forEach((level, i) => {
    const percent = (
      ((level.price - tradePlan.entryStrategy.idealEntryPrice) /
        tradePlan.entryStrategy.idealEntryPrice) *
      100
    ).toFixed(1);
    const sign =
      level.price > tradePlan.entryStrategy.idealEntryPrice ? '+' : '';
    exitContent += `  ${i + 1}. ${level.price.toFixed(2)} (${sign}${percent}%) | ${(level.proportion * 100).toFixed(0)}%仓位\n`;
  });

  exitContent += `止损位置:\n`;
  tradePlan.exitStrategy.stopLossLevels.forEach((level, i) => {
    const percent = (
      ((level.price - tradePlan.entryStrategy.idealEntryPrice) /
        tradePlan.entryStrategy.idealEntryPrice) *
      100
    ).toFixed(1);
    const sign =
      level.price > tradePlan.entryStrategy.idealEntryPrice ? '+' : '';
    exitContent += `  ${i + 1}. ${level.price.toFixed(2)} (${sign}${percent}%) | ${level.type === 'fixed' ? '固定' : '追踪'}\n`;
  });

  exitContent += `退出时间: ${tradePlan.exitStrategy.maximumHoldingPeriod}\n`;
  output += buildSection('出场策略', exitContent);

  // 5. 风险管理 - 更简洁的布局
  output += buildSection(
    '风险管理',
    `建议仓位: ${(tradePlan.riskManagement.suggestionPosition * 100).toFixed(1)}% | 风险回报比: ${tradePlan.riskManagement.riskRewardRatio.toFixed(2)}\n` +
      `最大损失: ${tradePlan.riskManagement.maxLoss} | 波动性: ${tradePlan.riskManagement.volatilityConsideration}\n`
  );

  // 6. 关键价位 - 分为支撑和阻力两组
  const strongSupportLevels = tradePlan.keyLevels
    .filter(level => level.type === 'support' && level.strength === 'strong')
    .sort((a, b) => b.price - a.price);

  const strongResistanceLevels = tradePlan.keyLevels
    .filter(level => level.type === 'resistance' && level.strength === 'strong')
    .sort((a, b) => a.price - b.price);

  let keyLevelContent = `支撑位:\n`;
  if (strongSupportLevels.length > 0) {
    strongSupportLevels.slice(0, 3).forEach(level => {
      keyLevelContent += `  ${level.price.toFixed(2)} | ${formatLevelSource(level.source)}\n`;
    });
  } else {
    keyLevelContent += `  未检测到强支撑位\n`;
  }

  keyLevelContent += `阻力位:\n`;
  if (strongResistanceLevels.length > 0) {
    strongResistanceLevels.slice(0, 3).forEach(level => {
      keyLevelContent += `  ${level.price.toFixed(2)} | ${formatLevelSource(level.source)}\n`;
    });
  } else {
    keyLevelContent += `  未检测到强阻力位\n`;
  }

  output += buildSection('关键价位', keyLevelContent);

  // 7. 支撑阻力位的牛熊信号分析 (如果有数据)
  if (
    tradePlan.bbsrAnalysis.dailyBBSRResult ||
    tradePlan.bbsrAnalysis.weeklyBBSRResult
  ) {
    let bbsrContent = '';
    if (tradePlan.bbsrAnalysis.dailyBBSRResult) {
      bbsrContent += `日线关键位: ${tradePlan.bbsrAnalysis.dailyBBSRResult.SRLevel.toFixed(2)}\n`;
      bbsrContent += `日期: ${toEDTString(tradePlan.bbsrAnalysis.dailyBBSRResult.signalDate)}\n`;
      bbsrContent += `名称: ${tradePlan.bbsrAnalysis.dailyBBSRResult.signal.patternNames.join(',')}\n`;
    }

    if (tradePlan.bbsrAnalysis.weeklyBBSRResult) {
      bbsrContent += `周线关键位: ${tradePlan.bbsrAnalysis.weeklyBBSRResult.SRLevel.toFixed(2)}\n`;
      bbsrContent += `日期: ${toEDTString(tradePlan.bbsrAnalysis.weeklyBBSRResult.signalDate)}\n`;
      bbsrContent += `名称: ${tradePlan.bbsrAnalysis.weeklyBBSRResult.signal.patternNames.join(',')}\n`;
    }
    output += buildSection('支撑阻力位的牛熊信号分析', bbsrContent);
  }

  // 8. 时间周期分析
  output += buildSection(
    '时间周期分析',
    `主要周期: ${formatTimeframe(tradePlan.primaryTimeframe)} | 一致性: ${tradePlan.timeframeConsistency}\n` +
      `短期: ${tradePlan.shortTermOutlook} | 中期: ${tradePlan.mediumTermOutlook} | 长期: ${tradePlan.longTermOutlook}\n`
  );

  // 9. 波动率量能分析
  output += buildSection(
    '波动率量能分析',
    `${volumeAnalysisReason}\n` + `${volatilityAnalysisReason}\n`
  );

  // 10. 趋势逆转信号 (如果存在)
  if (
    tradePlan.trendReversalInfo &&
    tradePlan.trendReversalInfo.hasReversalSignal
  ) {
    let reversalContent = '';
    if (tradePlan.trendReversalInfo.primaryReversalSignal) {
      const signal = tradePlan.trendReversalInfo.primaryReversalSignal;
      const direction = signal.direction > 0 ? '上涨' : '下跌';

      reversalContent += `检测到${formatTimeframe(signal.smallTimeframe)}对${formatTimeframe(signal.largeTimeframe)}的顺势逆转\n`;
      reversalContent += `方向: ${direction} | 强度: ${signal.reversalStrength.toFixed(1)}/100\n`;

      if (signal.entryPrice && signal.stopLoss) {
        reversalContent += `入场价: ${signal.entryPrice.toFixed(2)} | 止损价: ${signal.stopLoss.toFixed(2)}\n`;
      }

      if (signal.reversalStrength > 70) {
        reversalContent += `评价: ✓ 强烈逆转信号，适合介入\n`;
      } else if (signal.reversalStrength > 50) {
        reversalContent += `评价: ✓ 中等强度逆转信号，可以考虑\n`;
      } else {
        reversalContent += `评价: ⚠ 弱逆转信号，建议等待确认\n`;
      }
    } else {
      reversalContent += `${tradePlan.trendReversalInfo.description}\n`;
    }
    output += buildSection('趋势逆转信号', reversalContent);
  }

  // 11. 交易理由
  output += buildSection(
    '交易理由',
    `${tradePlan.primaryRationale}\n` +
      `${tradePlan.secondaryRationale}\n` +
      combinedVolumeVolatilitySummary
  );

  // 11.1 机器可解析摘要（单行JSON）
  const jsonSummary = {
    symbol: tradePlan.symbol,
    direction: tradePlan.direction,
    confidence: Number(tradePlan.confidenceScore.toFixed(1)),
    entry: Number(tradePlan.entryStrategy.idealEntryPrice.toFixed(4)),
    stopLoss: tradePlan.exitStrategy.stopLossLevels[0]?.price ?? null,
    takeProfit: tradePlan.exitStrategy.takeProfitLevels[0]?.price ?? null,
    riskReward: Number(tradePlan.riskManagement.riskRewardRatio.toFixed(2)),
    votes: {
      chip: tradePlan.chipAnalysisContribution,
      pattern: tradePlan.patternAnalysisContribution,
      volume: tradePlan.volumeAnalysisContribution,
      bbsr: tradePlan.bbsrAnalysisContribution,
    },
    summaries: tradePlan.summaries,
  };
  output += buildSection('机器可解析摘要', JSON.stringify(jsonSummary));

  // 12. 无效信号条件
  let invalidationContent = '';
  tradePlan.invalidationConditions
    .filter(c => c.priority === 'critical' || c.priority === 'important')
    .forEach(condition => {
      invalidationContent += `  ${formatPriority(condition.priority)} ${condition.description}\n`;
    });
  output += buildSection('无效信号条件', invalidationContent);

  // 13. 警告信息
  if (tradePlan.warnings.length > 0) {
    let warningContent = '';
    tradePlan.warnings.forEach(warning => {
      warningContent += `  ⚠️ ${warning}\n`;
    });
    output += buildSection('警告信息', warningContent);
  }

  // 14. 分析构成
  output += buildSection(
    '分析构成',
    `筹码分析: ${(tradePlan.chipAnalysisWeight * 100).toFixed(0)}% (得分:${tradePlan.chipAnalysisContribution.toFixed(1)}/100)\n` +
      `形态分析: ${(tradePlan.patternAnalysisWeight * 100).toFixed(0)}% (得分:${tradePlan.patternAnalysisContribution.toFixed(1)}/100)\n` +
      `量价分析: ${(tradePlan.volumeAnalysisWeight * 100).toFixed(0)}% (得分:${tradePlan.volumeAnalysisContribution.toFixed(1)}/100)\n` +
      `支阻位分析: ${(tradePlan.bbsrAnalysisWeight * 100).toFixed(0)}% (得分:${tradePlan.bbsrAnalysisContribution.toFixed(1)}/100)\n`
  );

  // 结尾分隔线
  output += `\n${SEPARATOR}\n`;

  return output;
}

/**
 * 格式化交易方向
 */
function formatDirection(direction: string): string {
  switch (direction) {
    case 'long':
      return '📈 做多';
    case 'short':
      return '📉 做空';
    case 'neutral':
      return '⚖️ 中性';
    default:
      return direction;
  }
}

/**
 * 格式化信号强度
 */
function formatSignalStrength(strength: string): string {
  switch (strength) {
    case 'strong':
      return '🔥 强';
    case 'moderate':
      return '✅ 中等';
    case 'weak':
      return '⚡ 弱';
    case 'neutral':
      return '⚖️ 中性';
    case 'conflicting':
      return '⚠️ 冲突';
    default:
      return strength;
  }
}

/**
 * 格式化时间周期
 */
function formatTimeframe(timeframe: string): string {
  switch (timeframe) {
    case 'weekly':
      return '周线';
    case 'daily':
      return '日线';
    case '1hour':
      return '小时线';
    default:
      return timeframe;
  }
}

/**
 * 格式化入场类型
 */
function formatEntryType(entryType: string): string {
  switch (entryType) {
    case 'immediate':
      return '立即入场';
    case 'pullback':
      return '回调入场';
    case 'breakout':
      return '突破入场';
    default:
      return entryType;
  }
}

/**
 * 格式化风险等级
 */
function formatRiskLevel(riskLevel: string): string {
  switch (riskLevel) {
    case 'high':
      return '🔴 高';
    case 'medium':
      return '🟠 中';
    case 'low':
      return '🟢 低';
    default:
      return riskLevel;
  }
}

/**
 * 格式化优先级
 */
function formatPriority(priority: string): string {
  switch (priority) {
    case 'critical':
      return '[必要]';
    case 'important':
      return '[重要]';
    case 'optional':
      return '[可选]';
    default:
      return priority;
  }
}

/**
 * 格式化价位来源
 */
function formatLevelSource(source: string): string {
  switch (source) {
    case 'chip':
      return '筹码分析';
    case 'pattern':
      return '形态分析';
    case 'combined':
      return '综合分析';
    default:
      return source;
  }
}

export { formatTradePlanOutput };
