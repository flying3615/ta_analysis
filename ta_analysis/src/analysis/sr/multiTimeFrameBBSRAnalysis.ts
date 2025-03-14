import { getStockDataForTimeframe } from '../../util/util.js';
import { Candle } from '../../types.js';
import { checkBullBearNearSupportResistance } from './BullBearOnSupportResistAnalysis.js';

const multiTimeBBSRAnalysis = async (
  symbol: string,
  dailyCandles: Candle[],
  weeklyCandles: Candle[]
) => {
  const weeklyBBSRResult = checkBullBearNearSupportResistance(
    symbol,
    weeklyCandles
  );
  const dailyBBSRResult = checkBullBearNearSupportResistance(
    symbol,
    dailyCandles
  );

  return {
    weeklyBBSRResult,
    dailyBBSRResult,
  };
};

export { multiTimeBBSRAnalysis };

const main = async (symbol: string) => {
  const today = new Date();
  console.log('正在获取数据与分析筹码分布...');

  const startDate = new Date();
  startDate.setDate(today.getDate() - 365); // 获取一年的数据

  const weeklyData = await getStockDataForTimeframe(
    symbol,
    startDate,
    today,
    'weekly'
  ); // 获取周线数据

  const dailyData = await getStockDataForTimeframe(
    symbol,
    startDate,
    today,
    'daily'
  ); // 获取日线数据

  const result = await multiTimeBBSRAnalysis(symbol, dailyData, weeklyData);
  console.log(result);
};

main('MSTR');
