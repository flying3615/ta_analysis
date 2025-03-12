import {
  detectTrendReversal,
  TrendReversalSignal,
} from './multiTimeFrameTrendReversal.js';
import { Candle } from '../../types.js';
import { getStockDataForTimeframe } from '../../util/util.js';

/**
 * 检查股票是否出现小时对日线的顺势逆转信号 - 增强版，含目标价位
 *
 * @param hourlyData 小时级别K线数据
 * @param dailyData 日线级别K线数据
 * @param signalThreshold 信号强度阈值，只有超过此值才被认为是有效信号，默认为40
 * @returns 包含判断结果和详细信号信息的对象，含目标价位
 */
function hasTrendReversalSignal(
  hourlyData: Candle[],
  dailyData: Candle[],
  signalThreshold: number = 40
): {
  hasSignal: boolean;
  primarySignal?: TrendReversalSignal;
  summary: string;
} {
  // 只检查小时对日线的逆转
  const hourlyVsDailySignal = detectTrendReversal(
    hourlyData,
    dailyData,
    '1hour',
    'daily'
  );

  // 检查是否有效信号
  const isValidSignal =
    hourlyVsDailySignal.isReversal &&
    hourlyVsDailySignal.reversalStrength >= signalThreshold;

  // 判断是否存在有效信号
  const hasSignal = isValidSignal;

  // 设置主要信号
  const primarySignal = hasSignal ? hourlyVsDailySignal : undefined;

  // 生成摘要描述
  let summary = '';
  if (hasSignal) {
    const signal = primarySignal!;
    const directionText = signal.direction > 0 ? '上涨' : '下跌';
    const actionText = signal.direction > 0 ? '做多' : '做空';

    summary = `检测到小时线对日线的顺势逆转信号，小时线从逆势调整转为顺应日线${directionText}趋势，信号强度: ${signal.reversalStrength.toFixed(1)}/100，建议${actionText}`;

    if (signal.entryPrice) {
      summary += `，入场价: ${signal.entryPrice.toFixed(2)}`;
    }

    // 添加目标价位信息
    if (signal.targets) {
      summary += `，目标价1: ${signal.targets.target1.toFixed(2)}`;
      summary += `，目标价2: ${signal.targets.target2.toFixed(2)}`;
      summary += `，目标价3: ${signal.targets.target3.toFixed(2)}`;
    }
  } else {
    // 检查是否有弱信号
    if (
      hourlyVsDailySignal.isReversal &&
      hourlyVsDailySignal.reversalStrength < signalThreshold
    ) {
      summary = `检测到弱小时线对日线顺势逆转信号，但强度不足${signalThreshold}，建议等待更明确的信号`;
    } else {
      summary = '未检测到小时线对日线的顺势逆转信号';
    }
  }

  return {
    hasSignal,
    primarySignal,
    summary,
  };
}

/**
 * 快速检查单个股票是否存在小时对日线的顺势逆转信号
 * 此函数会自动获取数据并进行分析
 *
 * @param symbol 股票代码
 * @param signalThreshold 信号强度阈值
 * @returns 包含判断结果和详细信号信息的对象
 */
async function checkStockForReversalSignal(
  symbol: string,
  signalThreshold: number
): Promise<{
  symbol: string;
  hasSignal: boolean;
  primarySignal?: TrendReversalSignal;
  summary: string;
}> {
  try {
    // 获取不同时间周期的数据
    const today = new Date();

    const startDateWeekly = new Date();
    startDateWeekly.setDate(today.getDate() - 365); // 获取一年的数据

    const startDateDaily = new Date();
    startDateDaily.setDate(today.getDate() - 90); // 获取三个月的数据

    const startDateHourly = new Date();
    startDateHourly.setDate(today.getDate() - 30); // 获取一个月的数据

    // 获取日线和小时线数据

    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDateDaily,
      today,
      'daily'
    );

    const hourlyData = await getStockDataForTimeframe(
      symbol,
      startDateHourly,
      today,
      '1hour'
    );

    // 只检查小时对日线的顺势逆转信号
    const result = hasTrendReversalSignal(
      hourlyData,
      dailyData,
      signalThreshold
    );

    return {
      symbol,
      ...result,
    };
  } catch (error) {
    console.error(`分析${symbol}时出错:`, error);
    return {
      symbol,
      hasSignal: false,
      summary: `分析${symbol}时发生错误: ${error.message}`,
    };
  }
}

/**
 * 批量检查多个股票是否存在顺势逆转信号
 *
 * @param symbols 股票代码列表
 * @param signalThreshold 信号强度阈值
 * @returns 每个股票的检查结果
 */
async function batchCheckForReversalSignals(
  symbols: string[],
  signalThreshold: number = 40
): Promise<
  Array<{
    symbol: string;
    hasSignal: boolean;
    primarySignal?: TrendReversalSignal;
    allSignals: TrendReversalSignal[];
    summary: string;
  }>
> {
  const results = [];

  for (const symbol of symbols) {
    console.log(`正在分析 ${symbol}...`);
    try {
      const result = await checkStockForReversalSignal(symbol, signalThreshold);
      results.push(result);

      // 如果发现信号，打印详细信息
      if (result.hasSignal) {
        console.log(`✓ ${symbol}: ${result.summary}`);
      } else {
        console.log(`✗ ${symbol}: 无顺势逆转信号`);
      }
    } catch (error) {
      console.error(`分析 ${symbol} 时出错:`, error);
      results.push({
        symbol,
        hasSignal: false,
        allSignals: [],
        summary: `分析时发生错误: ${error.message}`,
      });
    }
  }

  return results;
}

/**
 * 生成顺势逆转信号的摘要报告 (仅小时对日线) - 增强版，含目标价位
 *
 * @param results 批量检查的结果
 * @returns 格式化的摘要报告
 */
function generateReversalReport(
  results: Array<{
    symbol: string;
    hasSignal: boolean;
    primarySignal?: TrendReversalSignal;
    allSignals?: TrendReversalSignal[];
    summary: string;
  }>
): string {
  // 创建分隔线
  const separator = '='.repeat(80);

  // 准备输出内容
  let output = '';

  // 标题
  output += `${separator}\n`;
  output += `小时对日线顺势逆转信号扫描报告 | ${new Date().toLocaleString()}\n`;
  output += `${separator}\n\n`;

  // 统计信息
  const totalStocks = results.length;
  const stocksWithSignalsSize = results.filter(r => r.hasSignal).length;

  output += `扫描股票总数: ${totalStocks}\n`;
  output += `检测到信号的股票数: ${stocksWithSignalsSize}\n`;
  output += `波段交易模式: 仅分析小时对日线的顺势逆转(忽略日线对周线)\n\n`;

  // 有信号的股票详细信息
  output += `【检测到小时线对日线顺势逆转信号的股票】\n`;

  const stocksWithSignals = results.filter(r => r.hasSignal);
  if (stocksWithSignalsSize > 0) {
    // 按信号强度排序
    stocksWithSignals.sort(
      (a, b) =>
        (b.primarySignal?.reversalStrength || 0) -
        (a.primarySignal?.reversalStrength || 0)
    );

    stocksWithSignals.forEach((stock, index) => {
      const signal = stock.primarySignal!;
      const directionText = signal.direction > 0 ? '看涨' : '看跌';

      output += `${index + 1}. ${stock.symbol} - ${directionText} | 信号强度: ${signal.reversalStrength.toFixed(1)}/100\n`;
      output += `   ${stock.summary}\n`;

      if (signal.entryPrice && signal.stopLoss) {
        output += `   建议入场价: ${signal.entryPrice.toFixed(2)} | 止损价: ${signal.stopLoss.toFixed(2)}\n`;

        // 添加目标价位信息
        if (signal.targets) {
          output += `   目标价1: ${signal.targets.target1.toFixed(2)} | 风险回报比: ${signal.targets.riskRewardRatio1.toFixed(2)}\n`;
          output += `   目标价2: ${signal.targets.target2.toFixed(2)} | 风险回报比: ${signal.targets.riskRewardRatio2.toFixed(2)}\n`;
          output += `   目标价3: ${signal.targets.target3.toFixed(2)} | 风险回报比: ${signal.targets.riskRewardRatio3.toFixed(2)}\n`;
        }
      }
      output += '\n';
    });
  } else {
    output += `   未检测到任何股票有小时线对日线的顺势逆转信号\n\n`;
  }

  // 无信号的股票列表
  output += `【未检测到小时线对日线顺势逆转信号的股票】\n`;
  const stocksWithoutSignals = results.filter(r => !r.hasSignal);
  if (stocksWithoutSignals.length > 0) {
    // 按代码排序
    stocksWithoutSignals.sort((a, b) => a.symbol.localeCompare(b.symbol));

    const stockGroups = [];
    for (let i = 0; i < stocksWithoutSignals.length; i += 5) {
      stockGroups.push(
        stocksWithoutSignals
          .slice(i, i + 5)
          .map(s => s.symbol)
          .join(', ')
      );
    }

    stockGroups.forEach(group => {
      output += `   ${group}\n`;
    });
  } else {
    output += `   所有扫描的股票都检测到了小时线对日线的顺势逆转信号\n`;
  }

  output += `\n${separator}\n`;

  return output;
}

export {
  hasTrendReversalSignal,
  checkStockForReversalSignal,
  batchCheckForReversalSignals,
  generateReversalReport,
};

/**
 * 示例: 批量检查多个股票的小时对日线逆转信号
 */
async function main() {
  // 要检查的股票列表
  const symbols = ['COIN'];

  console.log(`正在分析 ${symbols.length} 只股票的小时对日线逆转信号...`);
  console.log(`波段交易模式: 仅分析小时对日线的顺势逆转(忽略日线对周线)`);

  // 批量检查
  const results = await batchCheckForReversalSignals(symbols);

  // 生成报告
  const report = generateReversalReport(results);

  // 打印报告
  console.log(report);
}

// 加入到active stock里面， 关注是否到了阻力位或支撑位附近
main();
