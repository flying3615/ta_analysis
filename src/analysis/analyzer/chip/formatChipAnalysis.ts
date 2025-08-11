import type { MultiTimeframeAnalysisResult } from './chipMultiTypes.js';

/**
 * 将多时间周期筹码分析结果格式化打印
 */
export function formatAndPrintChipAnalysis(
  analysisResult: MultiTimeframeAnalysisResult,
  symbol: string = ''
): void {
  console.log(
    `\n${symbol ? '===== ' + symbol + ' ' : '====='}多时间周期分析（筹码） =====`
  );
  console.log(`股票代码: ${analysisResult.symbol}`);
  console.log(`当前价格: ${analysisResult.currentPrice.toFixed(2)}`);

  console.log('\n----- 信号强度与一致性 -----');
  const buyBarLength = Math.round(analysisResult.combinedBuySignalStrength / 5);
  const shortBarLength = Math.round(
    analysisResult.combinedShortSignalStrength / 5
  );
  const buyBar = '█'.repeat(buyBarLength) + '░'.repeat(20 - buyBarLength);
  const shortBar = '█'.repeat(shortBarLength) + '░'.repeat(20 - shortBarLength);
  console.log(
    `多头信号: ${buyBar} (${analysisResult.combinedBuySignalStrength}/100)`
  );
  console.log(
    `空头信号: ${shortBar} (${analysisResult.combinedShortSignalStrength}/100)`
  );
  console.log(
    `信号差值: ${Math.abs(analysisResult.combinedBuySignalStrength - analysisResult.combinedShortSignalStrength)}`
  );
  console.log(
    `时间周期一致性: ${analysisResult.timeframeAlignment} (${analysisResult.alignmentStrength}%)`
  );

  console.log('\n----- 各时间周期信号强度 -----');
  console.log('时间周期   | 多头信号 | 空头信号 | 信号差值 | 综合建议');
  console.log('----------|----------|----------|----------|--------');

  analysisResult.timeframes.forEach(tf => {
    const timeframeName =
      tf.timeframe === 'weekly'
        ? '周线     '
        : tf.timeframe === 'daily'
          ? '日线     '
          : '小时线   ';
    const buyStrength = tf.analysis.buySignalStrength.toString().padEnd(4);
    const shortStrength = tf.analysis.shortSignalStrength.toString().padEnd(4);
    const diffStrength = Math.abs(
      tf.analysis.buySignalStrength - tf.analysis.shortSignalStrength
    )
      .toString()
      .padEnd(4);
    const recommendation = tf.analysis.overallRecommendation;
    console.log(
      `${timeframeName}| ${buyStrength}    | ${shortStrength}    | ${diffStrength}    | ${recommendation}`
    );
  });

  console.log('\n----- 交易建议 -----');
  console.log(`\n----- 主要建议 -----`);
  console.log(analysisResult.combinedRecommendation);
  console.log(analysisResult.recommendationComment);

  console.log('\n----- 入场策略 -----');
  console.log(analysisResult.entryStrategy);

  console.log('\n----- 出场策略 -----');
  console.log(analysisResult.exitStrategy);

  console.log('\n----- 风险管理 -----');
  if (analysisResult.stopLossLevels.length > 0) {
    console.log(
      `止损位: ${analysisResult.stopLossLevels.map(level => level.toFixed(2)).join(', ')}`
    );
  } else {
    console.log('无明确止损位建议');
  }
  if (analysisResult.takeProfitLevels.length > 0) {
    console.log(
      `止盈位: ${analysisResult.takeProfitLevels.map(level => level.toFixed(2)).join(', ')}`
    );
  } else {
    console.log('无明确止盈位建议');
  }

  if (analysisResult.timeframeConflicts.length > 0) {
    console.log('\n----- 时间周期冲突 -----');
    analysisResult.timeframeConflicts.forEach(conflict => {
      console.log(`⚠️ ${conflict}`);
    });
  }

  console.log('\n----- 时间周期展望 -----');
  console.log(`短期(小时线): ${analysisResult.shortTermOutlook}`);
  // eslint-disable-next-line no-irregular-whitespace
  console.log(`中期(日线)　: ${analysisResult.mediumTermOutlook}`);
  // eslint-disable-next-line no-irregular-whitespace
  console.log(`长期(周线)　: ${analysisResult.longTermOutlook}`);

  console.log('\n----- 关键价位 -----');
  if (analysisResult.aggregatedSupportLevels.length > 0) {
    console.log(
      `支撑位: ${analysisResult.aggregatedSupportLevels.map(level => level.toFixed(2)).join(', ')}`
    );
  } else {
    console.log('未检测到明确的支撑位');
  }
  if (analysisResult.aggregatedResistanceLevels.length > 0) {
    console.log(
      `阻力位: ${analysisResult.aggregatedResistanceLevels.map(level => level.toFixed(2)).join(', ')}`
    );
  } else {
    console.log('未检测到明确的阻力位');
  }
}
