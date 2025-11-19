import {
  runUnifiedAnalysis,
  type UnifiedAnalysisResult,
} from '../analysis/integration/unifiedAnalyzer.js';
import { DataProvider } from '../data/DataProvider.js';
import type { IntegrationConfig } from '../analysis/integration/IntegrationConfig.js';

/**
 * 格式化并打印统一分析结果
 * @param result - 统一分析结果
 */
function formatAndPrintUnifiedAnalysis(result: UnifiedAnalysisResult) {
  console.log(
    `\n======== ${result.symbol} - 统一量化分析 (${result.timeframe}) ========`
  );
  console.log(`分析摘要: ${result.summary}`);

  if (result.tradingSignals.length > 0) {
    console.log('\n===== 交易信号 =====');
    result.tradingSignals
      .sort((a, _) => (a.quality === 'high' ? -1 : 1)) // 高质量信号优先
      .forEach(signal => {
        const color = signal.quality === 'high' ? '\x1b[32m' : '\x1b[33m'; // 绿色/黄色
        const resetColor = '\x1b[0m';
        console.log(
          `${color}[${signal.quality.toUpperCase()}] ${signal.type === 'long' ? '做多' : '做空'}${resetColor}: ${signal.reason}`
        );
        console.log(
          `  - 入场区域: ${signal.entryZone.low.toFixed(2)} - ${signal.entryZone.high.toFixed(2)}`
        );
      });
  } else {
    console.log('\n===== 交易信号 =====');
    console.log('未发现明确的交易信号。');
  }

  console.log('\n===== 趋势分析 =====');
  console.log(result.trendAnalysis.summary);
  if (result.trendAnalysis.breakoutRetest) {
    console.log(
      `  - 突破回踩事件: 方向 ${result.trendAnalysis.breakoutRetest.direction}, 质量 ${result.trendAnalysis.breakoutRetest.qualityScore}`
    );
  }

  console.log(
    '=================================================================='
  );
}

/**
 * 主运行函数
 */
async function run() {
  const symbol = 'BTCUSDT';

  console.log(`正在为 ${symbol} 运行统一分析...`);

  const provider = new DataProvider();
  // 修正: 调用 getMultiTimeframeCryptoData 并提取日线数据
  const multiTimeframeData = await provider.getMultiTimeframeData(symbol, {
    timeframes: {
      weekly: { lookbackDays: 360 },
      daily: { lookbackDays: 120 },
      hourly: { lookbackDays: 30 },
    },
  } as IntegrationConfig);

  // 从返回的对象中获取日线数据
  const { weeklyData, dailyData, hourlyData } = multiTimeframeData;

  const hourly = runUnifiedAnalysis(symbol, hourlyData, '1hour');
  formatAndPrintUnifiedAnalysis(hourly);

  const daily = runUnifiedAnalysis(symbol, dailyData, 'daily');
  formatAndPrintUnifiedAnalysis(daily);

  const weekly = runUnifiedAnalysis(symbol, weeklyData, 'weekly');
  formatAndPrintUnifiedAnalysis(weekly);
}

run().catch(console.error);
