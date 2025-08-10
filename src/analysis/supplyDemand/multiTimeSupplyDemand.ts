import { getStockDataForTimeframe } from '../../util/util.js';
import { analyzeSupplyDemand } from './sdDetector.js';
import type { MultiTimeSdAnalysis, SdAnalysisResult, Zone } from './sdTypes.js';

function intersectZones(a: Zone, b: Zone): Zone | null {
  if (a.type !== b.type) return null;
  if (a.status === 'broken' || b.status === 'broken') return null;
  const low = Math.max(a.low, b.low);
  const high = Math.min(a.high, b.high);
  if (high <= low) return null;
  return {
    type: a.type,
    timeframe: 'daily',
    startIndex: Math.min(a.startIndex, b.startIndex),
    endIndex: Math.max(a.endIndex, b.endIndex),
    low,
    high,
    status: a.status === 'tested' || b.status === 'tested' ? 'tested' : 'fresh',
  };
}

export async function multiTimeSupplyDemand(
  symbol: string
): Promise<MultiTimeSdAnalysis> {
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

  const rW: SdAnalysisResult = analyzeSupplyDemand(symbol, weekly, 'weekly');
  const rD: SdAnalysisResult = analyzeSupplyDemand(symbol, daily, 'daily');
  const rH: SdAnalysisResult = analyzeSupplyDemand(symbol, hourly, '1hour');

  const overlaps: Zone[] = [];
  const pools = [
    rW.recentEffectiveZones,
    rD.recentEffectiveZones,
    rH.recentEffectiveZones,
  ];
  for (let i = 0; i < pools.length; i++) {
    for (let j = i + 1; j < pools.length; j++) {
      for (const a of pools[i]) {
        for (const b of pools[j]) {
          const inter = intersectZones(a, b);
          if (inter) overlaps.push(inter);
        }
      }
    }
  }

  return { symbol, results: [rW, rD, rH], overlaps };
}
