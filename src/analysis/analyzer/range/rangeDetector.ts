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
  for (
    let len = rangeConfig.lookback;
    len >= rangeConfig.minBarsInRange;
    len--
  ) {
    const i0 = data.length - len;
    if (i0 < start) break;
    const window = data.slice(i0, i0 + len);
    const high = Math.max(...window.map(c => c.high));
    const low = Math.min(...window.map(c => c.low));
    if (high - low <= maxWidth) {
      // 统计 NR4/NR7
      const trueRanges = window.map((c, i) => c.high - c.low);
      const nr4 = window.filter(
        (_, i) =>
          i >= 3 && trueRanges[i] < Math.min(...trueRanges.slice(i - 3, i))
      ).length;
      const nr7 = window.filter(
        (_, i) =>
          i >= 6 && trueRanges[i] < Math.min(...trueRanges.slice(i - 6, i))
      ).length;
      return {
        startIndex: i0,
        endIndex: i0 + len - 1,
        high,
        low,
        nr4Count: nr4,
        nr7Count: nr7,
      };
    }
  }
}

function assessBreakout(
  data: Candle[],
  box: RangeBox
): BreakoutAssessment | undefined {
  const last = data[data.length - 1];
  const brokeUp =
    last.close > box.high * (1 + rangeConfig.breakoutThresholdPercent);
  const brokeDown =
    last.close < box.low * (1 - rangeConfig.breakoutThresholdPercent);
  if (!brokeUp && !brokeDown) return;
  const dir: 'up' | 'down' = brokeUp ? 'up' : 'down';

  // 成交量扩张（相对区间均量）
  const window = data.slice(box.startIndex, box.endIndex + 1);
  const avgVol = window.reduce((s, c) => s + c.volume, 0) / window.length;
  const volumeExpansion =
    last.volume > avgVol * rangeConfig.volumeExpansionRatio;

  // 跟随：接下来的 N 根是否累计延续 >= 阈值
  const follow = data.slice(-rangeConfig.followThroughBars);
  const followThrough =
    dir === 'up'
      ? (follow[follow.length - 1].close - last.close) / last.close >=
        rangeConfig.followThroughMinPercent
      : (last.close - follow[follow.length - 1].close) / last.close >=
        rangeConfig.followThroughMinPercent;

  // 回测：N 根内是否回踩区间边界后反向
  const future = data.slice(-rangeConfig.retestBars);
  let retested = false;
  for (const c of future) {
    if (dir === 'up' && c.low <= box.high) {
      retested = true;
      break;
    }
    if (dir === 'down' && c.high >= box.low) {
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
    direction: dir,
    breakoutIndex: data.length - 1,
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
