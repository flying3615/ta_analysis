import type { Candle } from '../../../types.js';
import { calculateATR } from '../../../util/taUtil.js';
import { rangeConfig } from './rangeConfig.js';
import type {
  RangeAnalysisResult,
  RangeBox,
  BreakoutAssessment,
} from './rangeTypes.js';

function findRecentRange(data: Candle[]): RangeBox | undefined {
  const config = rangeConfig;
  const atr = calculateATR(data, config.atrPeriod);
  const rangeMaxHeight = atr * config.rangeAtrMaxMultiplier;

  const latestAllowedEnd = data.length - 2; // 留出至少1根用于突破判断
  let bestRange: RangeBox | undefined = undefined;

  for (let end = latestAllowedEnd; end >= config.minBarsInRange; end--) {
    for (let start = end - config.minBarsInRange; start >= 0; start--) {
      const len = end - start + 1;
      if (len < config.minBarsInRange) continue;

      const slice = data.slice(start, end + 1);
      const high = Math.max(...slice.map(c => c.high));
      const low = Math.min(...slice.map(c => c.low));
      const height = high - low;

      if (height <= rangeMaxHeight) {
        // 统计 NR4/NR7
        const nr4s = slice.filter(
          (c, i) =>
            i > 0 &&
            c.high - c.low < data[start + i - 1].high - data[start + i - 1].low
        ).length;
        const nr7s = slice.filter(
          (c, i) =>
            i > 0 &&
            c.high - c.low < data[start + i - 1].high - data[start + i - 1].low
        ).length; // Simplified, should be last 7

        const currentRange = {
          startIndex: start,
          endIndex: end,
          high,
          low,
          nr4Count: nr4s,
          nr7Count: nr7s,
        };

        // 选择结束位置更靠后的区间作为最近区间
        if (!bestRange || currentRange.endIndex > bestRange.endIndex) {
          bestRange = currentRange;
        }
        // 如果找到一个就跳出内层循环，加速寻找最近的
        break;
      }
    }
    // 如果已经找到了一个range，就不需要再往前找了，因为我们需要最近的
    if (bestRange) break;
  }
  return bestRange;
}

function assessBreakout(
  data: Candle[],
  box: RangeBox
): BreakoutAssessment | undefined {
  const config = rangeConfig;
  const boxSlice = data.slice(box.startIndex, box.endIndex + 1);
  const avgBoxVolume =
    boxSlice.reduce((s, c) => s + c.volume, 0) / boxSlice.length;

  // 在区间末尾附近寻找首次有效突破点（最后 retestBars+followThroughBars 范围内）
  const searchEnd = Math.min(
    data.length - 1,
    box.endIndex + config.retestBars + config.followThroughBars
  );
  let breakoutIndex = -1;
  let direction: 'up' | 'down' | undefined = undefined;

  for (let i = box.endIndex + 1; i <= searchEnd; i++) {
    const c = data[i];
    if (c.close > box.high * (1 + config.breakoutThresholdPercent)) {
      breakoutIndex = i;
      direction = 'up';
      break;
    }
    if (c.close < box.low * (1 - config.breakoutThresholdPercent)) {
      breakoutIndex = i;
      direction = 'down';
      break;
    }
  }

  if (breakoutIndex === -1) {
    return undefined;
  }

  const breakoutCandle = data[breakoutIndex];

  // 成交量扩张（相对区间均量）
  const volumeExpansion =
    breakoutCandle.volume > avgBoxVolume * config.volumeExpansionRatio;

  // 跟随：突破后接下来的 N 根是否累计延续 >= 阈值
  let followThrough = false;
  if (breakoutIndex + config.followThroughBars < data.length) {
    const followSlice = data.slice(
      breakoutIndex + 1,
      breakoutIndex + 1 + config.followThroughBars
    );
    const lastFollowCandle = followSlice[followSlice.length - 1];
    if (direction === 'up') {
      followThrough =
        lastFollowCandle.close >
        breakoutCandle.close * (1 + config.followThroughMinPercent);
    } else {
      followThrough =
        lastFollowCandle.close <
        breakoutCandle.close * (1 - config.followThroughMinPercent);
    }
  }

  // 回测：突破后N根内是否回踩区间边界
  let retested = false;
  const retestSlice = data.slice(
    breakoutIndex + 1,
    breakoutIndex + 1 + config.retestBars
  );
  for (const c of retestSlice) {
    if (direction === 'up' && c.low <= box.high) {
      retested = true;
      break;
    }
    if (direction === 'down' && c.high >= box.low) {
      retested = true;
      break;
    }
  }

  // 质量评分：扩张(40)+延续(40)+回测(20)
  const qualityScore =
    (volumeExpansion ? 40 : 0) + (followThrough ? 40 : 0) + (retested ? 20 : 0);

  return {
    direction: direction!,
    breakoutIndex,
    volumeExpansion,
    followThrough,
    retested,
    qualityScore,
  };
}

export function analyzeRange(
  symbol: string,
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): RangeAnalysisResult {
  const box = findRecentRange(data);

  if (!box) {
    return { symbol, timeframe, compressionScore: 0 };
  }

  const breakout = assessBreakout(data, box);

  // 收缩强度：NR4/NR7命中 + 区间宽度越小越高
  const atr = calculateATR(data, rangeConfig.atrPeriod);
  const compressionScore = Math.max(
    0,
    (1 - (box.high - box.low) / (atr * rangeConfig.rangeAtrMaxMultiplier)) *
      80 +
      (box.nr4Count > 0 ? 10 : 0) +
      (box.nr7Count > 0 ? 10 : 0)
  );

  return {
    symbol,
    timeframe,
    range: box,
    compressionScore,
    breakout,
  };
}
