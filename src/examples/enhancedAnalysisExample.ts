import { getStockDataForTimeframe } from '../util/util.js';
import { executeEnhancedCombinedAnalysis } from '../analysis/volatility/enhancedVolatilityAnalysis.js';
import { executeCombinedAnalysis } from '../analysis/volatility/volumeVolatilityAnalysis.js';

/**
 * 演示增强版波动率分析与原版分析的对比
 */
async function compareVolatilityAnalysis(symbol: string) {
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
    const originalAnalysis = executeCombinedAnalysis(data);
    console.log(originalAnalysis.combinedAnalysisSummary);

    // 执行增强版分析
    console.log('\n=== 增强版波动率量能分析 ===');
    const enhancedAnalysis = executeEnhancedCombinedAnalysis(data);
    console.log(enhancedAnalysis.enhancedCombinedAnalysisSummary);

    // 对比底部反转信号
    console.log('\n=== 底部反转信号分析 ===');
    if (
      enhancedAnalysis.volatilityAnalysis.volatilityAnalysis.bottomSignals
        .potentialBottomReversal
    ) {
      console.log(
        `检测到底部反转信号，强度: ${enhancedAnalysis.volatilityAnalysis.volatilityAnalysis.bottomSignals.reversalStrength.toFixed(0)}/100`
      );

      if (
        enhancedAnalysis.volatilityAnalysis.volatilityAnalysis.bottomSignals
          .reversalStrength > 70
      ) {
        console.log('底部反转信号强烈，买入机会显著');
      } else if (
        enhancedAnalysis.volatilityAnalysis.volatilityAnalysis.bottomSignals
          .reversalStrength > 50
      ) {
        console.log('底部反转信号明显，可以考虑逐步建仓');
      } else {
        console.log('底部反转信号初步显现，可以观察跟踪');
      }
    } else {
      console.log('未检测到明显的底部反转信号');
    }
  } catch (error) {
    console.error('分析过程中出错:', error);
  }
}

// 使用示例
// 可以替换为自己想要分析的股票代码
// compareVolatilityAnalysis('AAPL').catch(console.error);
