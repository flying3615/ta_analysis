import type { SdAnalysisResult, Zone } from './sdTypes.js';
import { sdConfig } from './sdConfig.js';

export function formatAndPrintSupplyDemand(result: SdAnalysisResult) {
  console.log(`\n===== ${result.symbol} 供需区 (${result.timeframe}) =====`);
  const pd = result.premiumDiscount;
  console.log(
    `溢价/折价位置: ${pd.position.toFixed(1)}% （区间: ${pd.basisLow.toFixed(2)} - ${pd.basisHigh.toFixed(2)}，现价: ${pd.currentPrice.toFixed(2)}）`
  );

  // 一句话交易建议
  const suggestion = buildSuggestion(result);
  if (suggestion) {
    console.log(`建议: ${suggestion}`);
  }

  const renderZone = (z: Zone) =>
    `${z.type === 'demand' ? '需求区' : '供应区'} ${z.low.toFixed(2)} - ${z.high.toFixed(2)} | 状态: ${translateStatus(z.status)}`;

  const effective = result.recentEffectiveZones;
  if (effective.length === 0) {
    console.log('最近无有效供需区');
  } else {
    console.log('最近有效供需区:');
    effective.forEach(z => console.log('  ' + renderZone(z)));
  }
}

function translateStatus(s: string) {
  return s === 'fresh' ? '新鲜' : s === 'tested' ? '已测试' : '被突破';
}

function buildSuggestion(r: SdAnalysisResult): string | null {
  const price = r.premiumDiscount.currentPrice;
  const zones = r.recentEffectiveZones;
  if (!zones.length) return null;

  const demandCandidates = zones.filter(z => z.type === 'demand');
  const supplyCandidates = zones.filter(z => z.type === 'supply');

  const nearestDemand = demandCandidates
    .map(z => ({ z, dist: Math.max(0, price - z.high) }))
    .sort((a, b) => a.dist - b.dist)[0]?.z;
  const nearestSupply = supplyCandidates
    .map(z => ({ z, dist: Math.max(0, z.low - price) }))
    .sort((a, b) => a.dist - b.dist)[0]?.z;

  // 选择更近的区带作为主建议
  let chosen: Zone | undefined;
  let side: 'long' | 'short' | undefined;
  const demandDist = nearestDemand
    ? Math.max(0, price - nearestDemand.high)
    : Number.POSITIVE_INFINITY;
  const supplyDist = nearestSupply
    ? Math.max(0, nearestSupply.low - price)
    : Number.POSITIVE_INFINITY;

  if (demandDist <= supplyDist) {
    chosen = nearestDemand;
    side = 'long';
  } else {
    chosen = nearestSupply;
    side = 'short';
  }
  if (!chosen || !side) return null;

  // 入场/止损/目标
  const entry =
    clamp(price, chosen.low, chosen.high) ?? mid(chosen.low, chosen.high);
  let stop: number;
  let target: number | undefined;

  if (side === 'long') {
    stop = chosen.low * (1 - sdConfig.breakThresholdPercent);
    // 目标优先选择最近供应区下沿，否则用最近区间高点
    const opp = supplyCandidates
      .map(z => ({ z, dist: Math.max(0, z.low - entry) }))
      .filter(x => x.dist > 0)
      .sort((a, b) => a.dist - b.dist)[0]?.z;
    target = opp ? opp.low : r.premiumDiscount.basisHigh;
    const rr = computeRR(entry, stop, target);
    return `在需求区 ${chosen.low.toFixed(2)}-${chosen.high.toFixed(2)} 内做多，入场 ${entry.toFixed(2)}，止损 ${stop.toFixed(2)}，目标 ${target.toFixed(2)}，RR≈${rr.toFixed(2)}`;
  } else {
    stop = chosen.high * (1 + sdConfig.breakThresholdPercent);
    const opp = demandCandidates
      .map(z => ({ z, dist: Math.max(0, entry - z.high) }))
      .filter(x => x.dist > 0)
      .sort((a, b) => a.dist - b.dist)[0]?.z;
    target = opp ? opp.high : r.premiumDiscount.basisLow;
    const rr = computeRRShort(entry, stop, target);
    return `在供应区 ${chosen.low.toFixed(2)}-${chosen.high.toFixed(2)} 附近做空，入场 ${entry.toFixed(2)}，止损 ${stop.toFixed(2)}，目标 ${target.toFixed(2)}，RR≈${rr.toFixed(2)}`;
  }
}

function clamp(x: number, a: number, b: number) {
  if (x < a) return a;
  if (x > b) return b;
  return x;
}
function mid(a: number, b: number) {
  return (a + b) / 2;
}
function computeRR(entry: number, stop: number, target: number) {
  const risk = Math.max(1e-8, entry - stop);
  const reward = Math.max(0, target - entry);
  return reward / risk;
}
function computeRRShort(entry: number, stop: number, target: number) {
  const risk = Math.max(1e-8, stop - entry);
  const reward = Math.max(0, entry - target);
  return reward / risk;
}
