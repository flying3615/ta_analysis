import { getStockDataForTimeframe } from '../../../util/util.js';
import { analyzeMarketStructure } from './structureDetector.js';
import type { MultiTimeframeStructureAnalysis } from './structureTypes.js';

export async function runMultiTimeStructure(
  symbol: string
): Promise<MultiTimeframeStructureAnalysis> {
  const today = new Date();
  const startW = new Date();
  startW.setDate(today.getDate() - 365);
  const startD = new Date();
  startD.setDate(today.getDate() - 120);
  const startH = new Date();
  startH.setDate(today.getDate() - 60);

  const [weekly, daily, hourly] = await Promise.all([
    getStockDataForTimeframe(symbol, startW, today, 'weekly'),
    getStockDataForTimeframe(symbol, startD, today, 'daily'),
    getStockDataForTimeframe(symbol, startH, today, '1hour'),
  ]);

  const rW = analyzeMarketStructure(weekly, 'weekly');
  const rD = analyzeMarketStructure(daily, 'daily');
  const rH = analyzeMarketStructure(hourly, '1hour');

  const all = [rW, rD, rH];
  const up = all.filter(r => r.trend === 'up').length;
  const down = all.filter(r => r.trend === 'down').length;
  const combinedTrend = up > down ? 'up' : down > up ? 'down' : 'sideways';
  const consistency =
    up === 3 || down === 3 ? 'strong' : up + down >= 2 ? 'medium' : 'mixed';
  const combinedSummary = `多周期趋势: ${combinedTrend}, up=${up}, down=${down}`;

  return { symbol, results: all, combinedTrend, consistency, combinedSummary };
}
