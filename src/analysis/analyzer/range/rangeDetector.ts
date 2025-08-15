import type { Candle } from '../../../types.js';
import { calculateATR } from '../../../util/taUtil.js';
import { rangeConfig } from './rangeConfig.js';
import type {
  RangeAnalysisResult,
  RangeBox,
  BreakoutAssessment,
} from './rangeTypes.js';

function findRecentRange(data: Candle[]): RangeBox | undefined {
  const atr = calculateATR(data, rangeConfig.atrPeriod);
  const maxWidth = atr * rangeConfig.rangeAtrMaxMultiplier;
  const start = Math.max(0, data.length - rangeConfig.lookback);
  const latestAllowedEnd = data.length - 2; // 留出至少1根用于突破判断

  let best: RangeBox | undefined = undefined;

  for (let i = start; i <= latestAllowedEnd - rangeConfig.minBarsInRange + 1; i++) {
    for (
      let end = i + rangeConfig.minBarsInRange - 1;
      end <= latestAllowedEnd;
      end++
    ) {
      const window = data.slice(i, end + 1);
      const high = Math.max(...window.map(c => c.high));
      const low = Math.min(...window.map(c => c.low));
      if (high - low <= maxWidth) {
        // 统计 NR4/NR7
        const trueRanges = window.map(c => c.high - c.low);
        const nr4 = window.filter((_, idx) => idx >= 3 && trueRanges[idx] < Math.min(...trueRanges.slice(idx - 3, idx))).length;
        const nr7 = window.filter((_, idx) => idx >= 6 && trueRanges[idx] < Math.min(...trueRanges.slice(idx - 6, idx))).length;
        const candidate: RangeBox = {
          startIndex: i,
          endIndex: end,
          high,
          low,
          nr4Count: nr4,
          nr7Count: nr7,
        };
        // 选择结束位置更靠后的区间作为最近区间
        if (!best || candidate.endIndex > best.endIndex) {
          best = candidate;
        }
      }
    }
  }

  return best;
}

function assessBreakout(
  data: Candle[],
  box: RangeBox
): BreakoutAssessment | undefined {
  // 在区间末尾附近寻找首次有效突破点（最后 retestBars+followThroughBars 范围内）
  const searchStart = Math.max(
    box.endIndex + 1,
    data.length - (rangeConfig.retestBars + rangeConfig.followThroughBars + 10)
  );
  let breakoutIndex: number | null = null;
  let direction: 'up' | 'down' | null = null;

  for (let i = searchStart; i < data.length; i++) {
    const c = data[i];
    const brokeUp = c.close > box.high * (1 + rangeConfig.breakoutThresholdPercent);
    const brokeDown = c.close < box.low * (1 - rangeConfig.breakoutThresholdPercent);
    if (brokeUp || brokeDown) {
      breakoutIndex = i;
      direction = brokeUp ? 'up' : 'down';
      break;
    }
  }

  if (breakoutIndex == null || direction == null) return;

  // 成交量扩张（相对区间均量）
  const window = data.slice(box.startIndex, box.endIndex + 1);
  const avgVol = window.reduce((s, c) => s + c.volume, 0) / window.length;
  const volDenom = Math.max(avgVol, 1e-8);
  const volumeExpansion = data[breakoutIndex].volume > volDenom * rangeConfig.volumeExpansionRatio;

  // 跟随：突破后接下来的 N 根是否累计延续 >= 阈值
  const followEnd = Math.min(data.length, breakoutIndex + 1 + rangeConfig.followThroughBars);
  const followSlice = data.slice(breakoutIndex + 1, followEnd);
  let followThrough = false;
  if (followSlice.length > 0) {
    const lastFollowClose = followSlice[followSlice.length - 1].close;
    const refClose = data[breakoutIndex].close;
    if (direction === 'up') {
      followThrough = (lastFollowClose - refClose) / Math.max(refClose, 1e-8) >= rangeConfig.followThroughMinPercent;
    } else {
      followThrough = (refClose - lastFollowClose) / Math.max(refClose, 1e-8) >= rangeConfig.followThroughMinPercent;
    }
  }

  // 回测：突破后N根内是否回踩区间边界
  const retestEnd = Math.min(data.length, breakoutIndex + 1 + rangeConfig.retestBars);
  const retestSlice = data.slice(breakoutIndex + 1, retestEnd);
  let retested = false;
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
  let score = 0;
  if (volumeExpansion) score += 40;
  if (followThrough) score += 40;
  if (retested) score += 20;
  return {
    direction,
    breakoutIndex,
    volumeExpansion,
    followThrough,
    retested,
    qualityScore: score,
  };
}

export function analyzeRange(
  symbol: string,
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): RangeAnalysisResult {
  const box = findRecentRange(data);
  let compressionScore = 0;
  if (box) {
    // 收缩强度：NR4/NR7命中 + 区间宽度越小越高
    const width = box.high - box.low;
    const atr = calculateATR(data, rangeConfig.atrPeriod);
    const widthScore = Math.max(
      0,
      1 - width / (atr * rangeConfig.rangeAtrMaxMultiplier)
    );
    compressionScore = Math.min(
      100,
      Math.round(box.nr4Count * 5 + box.nr7Count * 8 + widthScore * 50)
    );
  }
  const breakout = box ? assessBreakout(data, box) : undefined;
  return { symbol, timeframe, range: box, compressionScore, breakout };
}
