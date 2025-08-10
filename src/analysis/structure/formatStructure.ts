import type {
  MultiTimeframeStructureAnalysis,
  StructureResult,
  StructureEvent,
} from './structureTypes.js';
import { structureConfig } from './structureConfig.js';

export function formatAndPrintStructureResult(
  result: MultiTimeframeStructureAnalysis
) {
  console.log(`\n===== ${result.symbol} 结构分析 =====`);
  console.log(
    `综合趋势: ${translateTrend(result.combinedTrend)} | 一致性: ${result.consistency}`
  );
  console.log(`概述: ${result.combinedSummary}`);

  const printTf = (r: StructureResult) => {
    console.log(`\n----- ${r.timeframe} -----`);
    console.log(
      `趋势: ${translateTrend(r.trend)}${r.lastEvent ? ` | 事件: ${translateEvent(r.lastEvent)}` : ''}`
    );
    const suggestion = buildSuggestion(r);
    if (suggestion) {
      console.log(`建议: ${suggestion}`);
    }
    if (r.keyLevels?.length) {
      console.log(
        `关键结构位: ${r.keyLevels.map(p => p.toFixed(2)).join(', ')}`
      );
    }
    console.log(r.summary);
  };

  result.results.forEach(printTf);
}

function translateTrend(t: string) {
  return t === 'up' ? '上涨' : t === 'down' ? '下跌' : '震荡';
}

function translateEvent(e: StructureEvent) {
  const dir =
    e.direction === 'bullish'
      ? '（看涨）'
      : e.direction === 'bearish'
        ? '（看跌）'
        : '';
  switch (e.type) {
    case 'BOS':
      return `结构突破${dir}`;
    case 'CHOCH':
      return `性格转换${dir}`;
    case 'EqualHighs':
      return '等高';
    case 'EqualLows':
      return '等低';
    default:
      return e.type;
  }
}

function buildSuggestion(r: StructureResult): string | null {
  if (!r.keyLevels || r.keyLevels.length < 2) return null;
  const lastHigh = r.keyLevels[0];
  const lastLow = r.keyLevels[1];
  const offset = structureConfig.thresholds.breakThresholdPercent;

  // 若趋势为震荡但存在事件方向，则用事件方向作为临时趋势
  let trend: 'up' | 'down' | 'sideways' = r.trend as any;
  if (
    trend === 'sideways' &&
    r.lastEvent &&
    r.lastEvent.direction !== 'neutral'
  ) {
    trend = r.lastEvent.direction === 'bullish' ? 'up' : 'down';
  }

  if (trend === 'up') {
    const entry = lastLow;
    const stop = lastLow * (1 - offset);
    const target = lastHigh;
    const rr = computeRR(entry, stop, target);
    if (!isFinite(rr) || rr <= 0) return null;
    return `回踩 ${entry.toFixed(2)} 做多，止损 ${stop.toFixed(2)}，目标 ${target.toFixed(2)}，RR≈${rr.toFixed(2)}`;
  }
  if (trend === 'down') {
    const entry = lastHigh;
    const stop = lastHigh * (1 + offset);
    const target = lastLow;
    const rr = computeRRShort(entry, stop, target);
    if (!isFinite(rr) || rr <= 0) return null;
    return `反弹至 ${entry.toFixed(2)} 做空，止损 ${stop.toFixed(2)}，目标 ${target.toFixed(2)}，RR≈${rr.toFixed(2)}`;
  }
  return null;
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
