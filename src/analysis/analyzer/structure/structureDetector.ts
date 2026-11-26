import type { Candle } from '../../../types.js';
import { structureConfig } from './structureConfig.js';
import type {
  StructureEvent,
  StructureResult,
  StructureTrend,
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

interface PivotPoint {
  index: number;
  price: number;
}

/**
 * 把拐点数组整理成按时间排序、高低交替的高点和低点序列：
 * - 与上一个反向拐点的距离小于 minSwingDistancePercent 的拐点视为噪音，丢弃
 * - 连续两个同向拐点只保留更极端的一个（更高的高点 / 更低的低点）
 */
function collectPivotPoints(pivots: {
  highs: (number | null)[];
  lows: (number | null)[];
}): { highs: PivotPoint[]; lows: PivotPoint[] } {
  const minMove = structureConfig.thresholds.minSwingDistancePercent;
  const kept: (PivotPoint & { type: 'high' | 'low' })[] = [];

  const consider = (type: 'high' | 'low', index: number, price: number) => {
    const last = kept[kept.length - 1];
    if (!last) {
      kept.push({ type, index, price });
      return;
    }
    if (last.type === type) {
      const moreExtreme =
        type === 'high' ? price > last.price : price < last.price;
      if (moreExtreme) kept[kept.length - 1] = { type, index, price };
      return;
    }
    if (Math.abs(price - last.price) / last.price >= minMove) {
      kept.push({ type, index, price });
    }
  };

  for (let i = 0; i < pivots.highs.length; i++) {
    const h = pivots.highs[i];
    const l = pivots.lows[i];
    if (h != null) consider('high', i, h);
    if (l != null) consider('low', i, l);
  }

  const strip = ({ index, price }: PivotPoint): PivotPoint => ({
    index,
    price,
  });
  return {
    highs: kept.filter(p => p.type === 'high').map(strip),
    lows: kept.filter(p => p.type === 'low').map(strip),
  };
}

/** 最近两个高点和两个低点同时抬高为上升，同时降低为下降，否则为震荡 */
function determineTrend(
  highs: PivotPoint[],
  lows: PivotPoint[]
): StructureTrend {
  if (highs.length < 2 || lows.length < 2) return 'sideways';
  const [h1, h2] = highs.slice(-2);
  const [l1, l2] = lows.slice(-2);
  if (h2.price > h1.price && l2.price > l1.price) return 'up';
  if (h2.price < h1.price && l2.price < l1.price) return 'down';
  return 'sideways';
}

/**
 * 检测结构事件：
 * - 收盘价突破最近的拐点高点/低点：顺势为 BOS，逆势（打破原趋势）为 CHOCH
 * - 最近两个拐点高点/低点几乎相等：EqualHighs / EqualLows
 */
function detectStructureEvents(
  data: Candle[],
  highs: PivotPoint[],
  lows: PivotPoint[],
  trend: StructureTrend,
  timeframe: 'weekly' | 'daily' | '1hour'
): StructureEvent | undefined {
  if (highs.length === 0 || lows.length === 0) return;
  const { breakThresholdPercent, equalTolerancePercent } =
    structureConfig.thresholds;
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  const close = data[data.length - 1].close;
  const index = data.length - 1;

  const brokeHigh = close > lastHigh.price * (1 + breakThresholdPercent);
  const brokeLow = close < lastLow.price * (1 - breakThresholdPercent);

  if (brokeHigh) {
    return {
      type: trend === 'down' ? 'CHOCH' : 'BOS',
      direction: 'bullish',
      index,
      price: close,
      timeframe,
    };
  }
  if (brokeLow) {
    return {
      type: trend === 'up' ? 'CHOCH' : 'BOS',
      direction: 'bearish',
      index,
      price: close,
      timeframe,
    };
  }

  // Equal highs/lows
  if (highs.length >= 2) {
    const prevHigh = highs[highs.length - 2];
    if (
      Math.abs(lastHigh.price - prevHigh.price) / prevHigh.price <
      equalTolerancePercent
    ) {
      return {
        type: 'EqualHighs',
        direction: 'neutral',
        index: lastHigh.index,
        price: lastHigh.price,
        timeframe,
      };
    }
  }
  if (lows.length >= 2) {
    const prevLow = lows[lows.length - 2];
    if (
      Math.abs(lastLow.price - prevLow.price) / prevLow.price <
      equalTolerancePercent
    ) {
      return {
        type: 'EqualLows',
        direction: 'neutral',
        index: lastLow.index,
        price: lastLow.price,
        timeframe,
      };
    }
  }
  return undefined;
}

export function analyzeMarketStructure(
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): StructureResult {
  const { highs, lows } = collectPivotPoints(findPivots(data));
  const trend = determineTrend(highs, lows);
  const evt = detectStructureEvents(data, highs, lows, trend, timeframe);

  // 关键位：[最近高点, 最近低点, 前一高点, 前一低点]（formatStructure 依赖此顺序）
  const keyLevels: number[] = [];
  const lastHigh = highs.at(-1);
  const lastLow = lows.at(-1);
  if (lastHigh && lastLow) {
    keyLevels.push(lastHigh.price, lastLow.price);
    const prevHigh = highs.at(-2);
    const prevLow = lows.at(-2);
    if (prevHigh && prevLow) keyLevels.push(prevHigh.price, prevLow.price);
  }

  const summary = evt
    ? `${timeframe} 结构: ${trend}，检测到 ${evt.type}${evt.direction !== 'neutral' ? ' ' + evt.direction : ''}`
    : `${timeframe} 结构: ${trend}`;

  return { timeframe, trend, lastEvent: evt, keyLevels, summary };
}
