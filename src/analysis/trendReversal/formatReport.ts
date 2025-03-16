import { Candle } from '../../types.js';
import {
  determineTrendDirection,
  EnhancedPatternAnalysis,
} from './multiTimeFrameTrendReversal.js';
import {
  formatAndPrintPatternAnalysis,
  PatternDirection,
} from '../patterns/multiTimeFramePatternAnalysis.js';

/**
 * 获取趋势方向描述文本
 */
function getTrendText(direction: number): string {
  if (direction > 0) return '上涨';
  if (direction < 0) return '下跌';
  return '盘整';
}

/**
 * 格式化并打印增强版形态分析结果 (仅展示小时对日线的逆转信号)
 */
export function formatAndPrintEnhancedPatternAnalysis(
  analysisResult: EnhancedPatternAnalysis,
  symbol: string = '',
  hourlyData: Candle[],
  dailyData: Candle[],
  weeklyData: Candle[]
): void {
  // 首先调用原始的打印函数显示基础分析
  formatAndPrintPatternAnalysis(analysisResult, symbol);

  // 添加小周期顺势逆转信号部分
  console.log('\n===== 小时对日线顺势逆转信号分析 =====');
  console.log('波段交易模式: 仅分析小时对日线的顺势逆转(忽略日线对周线)');

  if (analysisResult.reversalSignals.length > 0) {
    // 获取小时对日线的逆转信号
    const signal = analysisResult.reversalSignals[0];
    const directionText = signal.direction > 0 ? '上涨' : '下跌';
    const actionText = signal.direction > 0 ? '做多' : '做空';

    console.log(`\n----- 小时对日线周期逆转信号 -----`);
    console.log(`日线趋势: ${directionText}`);
    console.log(`信号强度: ${signal.reversalStrength.toFixed(1)}/100`);

    console.log('逆转特征:');
    console.log(`• 小时周期从逆势调整转为顺应日线周期大趋势`);
    console.log(`• 建议操作: ${actionText}`);

    if (signal.entryPrice) {
      console.log(`• 建议入场价: ${signal.entryPrice.toFixed(2)}`);
    }

    if (signal.stopLoss) {
      console.log(`• 建议止损价: ${signal.stopLoss.toFixed(2)}`);
    }

    // 判断是否适合当前介入
    if (signal.reversalStrength > 70) {
      console.log('\n✓ 强烈逆转信号，非常适合当前介入');
    } else if (signal.reversalStrength > 50) {
      console.log('\n✓ 中等强度逆转信号，适合当前介入');
    } else {
      console.log('\n⚠ 弱逆转信号，建议等待更多确认后再介入');
    }

    // 结合形态分析，找出符合逆转方向的小周期形态
    const patternDirection =
      signal.direction > 0
        ? PatternDirection.Bullish
        : PatternDirection.Bearish;
    const smallTimeframeAnalysis = analysisResult.timeframeAnalyses.find(
      a => a.timeframe === '1hour'
    );

    if (smallTimeframeAnalysis) {
      const alignedPatterns = smallTimeframeAnalysis.patterns.filter(
        p => p.direction === patternDirection
      );

      if (alignedPatterns.length > 0) {
        console.log(`\n与小时周期逆转信号一致的形态:`);
        alignedPatterns.slice(0, 3).forEach(p => {
          console.log(`• ${p.patternType} - ${p.description}`);
        });
      }
    }

    // 交易策略建议
    console.log('\n===== 波段交易策略建议 =====');

    const actionStrategy = signal.direction > 0 ? '做多' : '做空';
    console.log(`1. 交易方向: ${actionStrategy} (顺应日线周期趋势)`);
    console.log(`2. 入场时机: 当小时周期出现逆转并与日线周期趋势一致时`);

    if (signal.direction > 0) {
      // 做多策略
      console.log('3. 做多策略:');
      console.log('   • 在小时周期支撑位附近买入');
      console.log('   • 止损设置在最近小时周期低点下方');
      console.log('   • 目标价位可参考日线周期的阻力位或形态目标价');
    } else {
      // 做空策略
      console.log('3. 做空策略:');
      console.log('   • 在小时周期阻力位附近卖出');
      console.log('   • 止损设置在最近小时周期高点上方');
      console.log('   • 目标价位可参考日线周期的支撑位或形态目标价');
    }

    console.log('4. 风险管理:');
    console.log(
      `   • 仓位控制建议: 根据信号强度(${signal.reversalStrength.toFixed(1)}/100)调整仓位大小`
    );
    console.log('   • 建议持仓时间: 3-10个交易日 (波段交易)');
    console.log('   • 波段交易止盈建议: 在达到5-15%收益时分批减仓');
  } else {
    console.log('未检测到小时线对日线的顺势逆转信号');
    console.log('\n当前趋势状态:');
    console.log(
      `• 小时周期趋势: ${getTrendText(determineTrendDirection(hourlyData))}`
    );
    console.log(
      `• 日线周期趋势: ${getTrendText(determineTrendDirection(dailyData))}`
    );
    console.log('\n建议等待小时周期调整后再寻找顺势入场机会');
  }
}
