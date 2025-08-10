import type { ChipAnalysisResult } from './chipTypes.js';
import { findPriceAtCumulativePercentage } from '../../util/taUtil.js';

export function printChipAnalysis(analysis: ChipAnalysisResult) {
  console.log('====== 筹码分布分析结果 ======');
  console.log(`股票代码: ${analysis.symbol}`);
  console.log(`当前价格: ${analysis.currentPrice}`);

  console.log('\n--- 筹码集中度分析 ---');
  console.log(analysis.concentrationComment);
  console.log(`筹码集中指数: ${analysis.concentrationIndex}/100`);
  console.log(`集中度评级: ${analysis.concentrationLevel}`);
  console.log(`是否易于拉升: ${analysis.isEasyToPush ? '是' : '否'}`);
  console.log(`筹码分布熵值: ${analysis.entropyValue.toFixed(4)}`);
  console.log(`多空比率: ${analysis.bullBearRatio.toFixed(2)}`);

  console.log('\n--- 上方套牢盘分析 ---');
  console.log(analysis.resistanceComment);
  console.log(`上方套牢盘占比: ${analysis.trappedChipsAbove.toFixed(2)}%`);
  console.log(`阻力评级: ${analysis.resistanceLevel}`);
  console.log(`拉升是否困难: ${analysis.isPushingDifficult ? '是' : '否'}`);

  console.log('\n--- 获利盘分析 ---');
  console.log(analysis.profitComment);
  console.log(`获利筹码占比: ${analysis.profitChipsPercentage.toFixed(2)}%`);
  console.log(`获利风险评级: ${analysis.profitTakingRisk}`);
  console.log(`追高是否有风险: ${analysis.isRiskyToChase ? '是' : '否'}`);

  console.log('\n--- 筹码峰分析 ---');
  console.log(analysis.peakComment);
  console.log(`筹码形态: ${analysis.chipShape}`);
  console.log(`筹码分布特征: ${analysis.peakDistribution}`);
  console.log(`主要筹码峰数量: ${analysis.majorPeaks.length}`);

  console.log('\n--- 成交量趋势分析 ---');
  console.log(analysis.volumeComment);
  console.log(`近期成交量变化: ${analysis.recentVolumeChange}%`);
  console.log(`成交量趋势: ${analysis.volumeTrend}`);

  console.log('\n--- 筹码迁移分析 ---');
  console.log(analysis.migrationComment);
  console.log(`筹码迁移方向: ${analysis.chipMigrationDirection}`);
  console.log(`迁移速度指数: ${analysis.chipMigrationSpeed}/100`);

  console.log('\n--- 技术指标分析 ---');
  console.log(`MACD信号: ${analysis.macdSignal}`);
  console.log(`RSI水平: ${analysis.rsiLevel}`);
  console.log(`布林带状态: ${analysis.bollingerStatus}`);
  console.log(`综合技术信号: ${analysis.technicalSignal}`);

  console.log('\n--- 买入建议 ---');
  console.log(`买入信号强度: ${analysis.buySignalStrength}/100`);
  console.log(`买入建议: ${analysis.buyRecommendation}`);
  console.log(analysis.buyComment);

  console.log('\n--- 卖出建议 ---');
  console.log(`卖出信号强度: ${analysis.shortSignalStrength}/100`);
  console.log(`卖出建议: ${analysis.shortRecommendation}`);
  console.log(analysis.shortComment);

  console.log('\n--- 综合建议 ---');
  console.log(analysis.overallRecommendation);
  console.log(analysis.positionSuggestion);
  console.log(analysis.overallComment);

  console.log('\n--- 关键价位 ---');
  console.log(
    `主要支撑位: ${analysis.majorSupportLevels.map(p => p.toFixed(2)).join(', ')}`
  );
  console.log(
    `主要阻力位: ${analysis.majorResistanceLevels.map(p => p.toFixed(2)).join(', ')}`
  );
  console.log(
    `强支撑位: ${analysis.strongSupportLevels.map(p => p.toFixed(2)).join(', ')}`
  );
  console.log(
    `强阻力位: ${analysis.strongResistanceLevels.map(p => p.toFixed(2)).join(', ')}`
  );

  console.log('\n--- 累积分布分析 ---');
  console.log(
    `25%筹码价格: ${findPriceAtCumulativePercentage(analysis.cumulativeDistribution, 25).toFixed(2)}`
  );
  console.log(
    `50%筹码价格: ${findPriceAtCumulativePercentage(analysis.cumulativeDistribution, 50).toFixed(2)}`
  );
  console.log(
    `75%筹码价格: ${findPriceAtCumulativePercentage(analysis.cumulativeDistribution, 75).toFixed(2)}`
  );
}
