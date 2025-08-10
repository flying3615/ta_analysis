import type { Candle } from '../../types.js';
import { structureConfig } from './structureConfig.js';
import type {
  StructureEvent,
  StructureResult,
  StructureTrend,
  Swing,
} from './structureTypes.js';

function findPivots(data: Candle[]): {
  highs: (number | null)[];
  lows: (number | null)[];
} {
  const { leftBars, rightBars } = structureConfig.pivot;
  const highs: (number | null)[] = Array(data.length).fill(null);
  const lows: (number | null)[] = Array(data.length).fill(null);

  for (let i = leftBars; i < data.length - rightBars; i++) {
    let isHigh = true;
    for (let j = i - leftBars; j < i + rightBars + 1; j++) {
      if (data[j].high > data[i].high) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) highs[i] = data[i].high;

    let isLow = true;
    for (let j = i - leftBars; j < i + rightBars + 1; j++) {
      if (data[j].low < data[i].low) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows[i] = data[i].low;
  }
  return { highs, lows };
}

function buildExternalSwings(
  data: Candle[],
  pivots: { highs: (number | null)[]; lows: (number | null)[] }
): Swing[] {
  const swings: Swing[] = [];
  const minMove = structureConfig.thresholds.minSwingDistancePercent;
  let lastIndex = -1;
  let lastHigh = -Infinity;
  let lastLow = Infinity;

  for (let i = 0; i < data.length; i++) {
    const h = pivots.highs[i];
    const l = pivots.lows[i];
    if (h != null) {
      if (lastIndex >= 0) {
        const move = Math.abs((h - lastLow) / lastLow);
        if (move >= minMove)
          swings.push({
            startIndex: lastIndex,
            endIndex: i,
            high: h,
            low: lastLow,
          });
      }
      lastIndex = i;
      lastHigh = h;
      lastLow = data[i].low;
    }
    if (l != null) {
      if (lastIndex >= 0) {
        const move = Math.abs((lastHigh - l) / lastHigh);
        if (move >= minMove)
          swings.push({
            startIndex: lastIndex,
            endIndex: i,
            high: lastHigh,
            low: l,
          });
      }
      lastIndex = i;
      lastLow = l;
      lastHigh = data[i].high;
    }
  }
  return swings;
}

function detectStructureEvents(
  data: Candle[],
  swings: Swing[],
  timeframe: 'weekly' | 'daily' | '1hour'
): StructureEvent | undefined {
  if (swings.length < 2) return;
  const { breakThresholdPercent, equalTolerancePercent } =
    structureConfig.thresholds;
  const lastSwing = swings[swings.length - 1];
  const prevSwing = swings[swings.length - 2];
  const close = data[data.length - 1].close;

  // BOS upward
  const brokeHigh = close > lastSwing.high * (1 + breakThresholdPercent);
  const brokeLow = close < lastSwing.low * (1 - breakThresholdPercent);

  if (brokeHigh) {
    return {
      type: 'BOS',
      direction: 'bullish',
      index: data.length - 1,
      price: close,
      timeframe,
    };
  }
  if (brokeLow) {
    return {
      type: 'BOS',
      direction: 'bearish',
      index: data.length - 1,
      price: close,
      timeframe,
    };
  }

  // Equal highs/lows
  const eqHigh =
    Math.abs(lastSwing.high - prevSwing.high) / prevSwing.high <
    equalTolerancePercent;
  const eqLow =
    Math.abs(lastSwing.low - prevSwing.low) / prevSwing.low <
    equalTolerancePercent;
  if (eqHigh)
    return {
      type: 'EqualHighs',
      direction: 'neutral',
      index: lastSwing.endIndex,
      price: lastSwing.high,
      timeframe,
    };
  if (eqLow)
    return {
      type: 'EqualLows',
      direction: 'neutral',
      index: lastSwing.endIndex,
      price: lastSwing.low,
      timeframe,
    };

  // CHOCH: 简化 - 最近一段与前段方向相反并逼近另一侧边界
  const wasUp =
    prevSwing.high >= lastSwing.high && prevSwing.low < lastSwing.low;
  const wasDown =
    prevSwing.low <= lastSwing.low && prevSwing.high > lastSwing.high;
  if (wasUp && brokeLow)
    return {
      type: 'CHOCH',
      direction: 'bearish',
      index: data.length - 1,
      price: close,
      timeframe,
    };
  if (wasDown && brokeHigh)
    return {
      type: 'CHOCH',
      direction: 'bullish',
      index: data.length - 1,
      price: close,
      timeframe,
    };
}

function determineTrend(swings: Swing[]): StructureTrend {
  if (swings.length < 3) return 'sideways';
  const last = swings.slice(-3);
  const highs = last.map(s => s.high);
  const lows = last.map(s => s.low);
  const up =
    highs[2] > highs[1] &&
    highs[1] > highs[0] &&
    lows[2] > lows[1] &&
    lows[1] > lows[0];
  const down =
    highs[2] < highs[1] &&
    highs[1] < highs[0] &&
    lows[2] < lows[1] &&
    lows[1] < lows[0];
  return up ? 'up' : down ? 'down' : 'sideways';
}

export function analyzeStructure(
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): StructureResult {
  const pivots = findPivots(data);
  const swings = buildExternalSwings(data, pivots);
  const trend = determineTrend(swings);
  const evt = detectStructureEvents(data, swings, timeframe);

  const last = swings.at(-1);
  const prev = swings.at(-2);
  const keyLevels: number[] = [];
  if (last) {
    keyLevels.push(last.high, last.low);
    if (prev) keyLevels.push(prev.high, prev.low);
  }

  const summary = evt
    ? `${timeframe} 结构: ${trend}，检测到 ${evt.type}${evt.direction !== 'neutral' ? ' ' + evt.direction : ''}`
    : `${timeframe} 结构: ${trend}`;

  return { timeframe, trend, lastEvent: evt, keyLevels, summary };
}
