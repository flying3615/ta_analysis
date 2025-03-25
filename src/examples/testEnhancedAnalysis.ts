/**
 * 此文件用于测试增强版波动率量能分析
 */

import { getStockDataForTimeframe } from '../util/util.js';
import { executeCombinedAnalysis } from '../analysis/volatility/volumeVolatilityAnalysis.js';
import { executeEnhancedCombinedAnalysis } from '../analysis/volatility/enhancedVolatilityAnalysis.js';

/**
 * 测试原版分析和增强版分析的差异，特别是对底部反转信号的检测
 */
async function testEnhancedAnalysis(symbol: string) {
  try {
    // 获取历史数据
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 365); // 获取一年的数据

    console.log(`获取 ${symbol} 的历史数据...`);
    const data = await getStockDataForTimeframe(
      symbol,
      startDate,
      today,
      'daily'
    );
    console.log(`获取到 ${data.length} 根K线数据`);

    // 执行原版分析
    console.log('\n=== 原版波动率量能分析 ===');
    const originalResult = executeCombinedAnalysis([...data]);
    console.log(originalResult.combinedAnalysisSummary);

    // 执行增强版分析
    console.log('\n=== 增强版波动率量能分析 ===');
    const enhancedResult = executeEnhancedCombinedAnalysis([...data]);
    console.log(enhancedResult.enhancedCombinedAnalysisSummary);

    // 检查是否识别到底部反转信号
    if (
      enhancedResult.volatilityAnalysis.volatilityAnalysis.bottomSignals
        .potentialBottomReversal
    ) {
      console.log('\n*** 检测到底部反转信号 ***');
      console.log(
        `反转信号强度: ${enhancedResult.volatilityAnalysis.volatilityAnalysis.bottomSignals.reversalStrength.toFixed(0)}/100`
      );
      console.log(
        `价格相对年度低点: ${enhancedResult.volatilityAnalysis.volatilityAnalysis.pricePosition.relativeToYearLow.toFixed(1)}%`
      );
      console.log(
        `波动率状态: ${enhancedResult.volatilityAnalysis.volatilityAnalysis.volatilityRegime}`
      );
    }
  } catch (error) {
    console.error('分析过程中出错:', error);
  }
}

// 可以指定要分析的股票代码
testEnhancedAnalysis('COIN').catch(console.error);
