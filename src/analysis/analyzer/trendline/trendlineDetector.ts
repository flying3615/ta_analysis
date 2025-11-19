import type { Candle } from '../../../types.js';
import { calculateATR } from '../../../util/taUtil.js';
import { trendlineConfig } from './trendlineConfig.js';
import type {
  FittedLine,
  Channel,
  BreakoutRetest,
  TrendlineChannelAnalysisResult,
} from './trendlineTypes.js';
import type { PivotPoint } from '../sr/srDetector.js';

export type { TrendlineChannelAnalysisResult };

function fitLine(points: Array<{ x: number; y: number }>): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  let sumX = 0,
    sumY = 0,
    sumXX = 0,
    sumXY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXX += p.x * p.x;
    sumXY += p.x * p.y;
  }
  const denom = n * sumXX - sumX * sumX || 1e-8;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function countTouches(
  data: Candle[],
  line: { slope: number; intercept: number },
  kind: 'support' | 'resistance',
  tol: number,
  start: number,
  end: number
): number {
  let count = 0;
  for (let i = start; i <= end; i++) {
    const price = line.slope * i + line.intercept;
    const ref = kind === 'support' ? data[i].low : data[i].high;
    if (Math.abs(ref - price) / price <= tol) count++;
  }
  return count;
}

function buildChannelFromSupport(
  data: Candle[],
  support: FittedLine
): Channel | undefined {
  const start = support.startIndex,
    end = support.endIndex;
  // 以支持线平移到最高点构建上边界
  let maxDelta = -Infinity;
  for (let i = start; i <= end; i++) {
    const base = support.slope * i + support.intercept;
    maxDelta = Math.max(maxDelta, data[i].high - base);
  }
  const upper = {
    ...support,
    kind: 'resistance' as const,
    intercept: support.intercept + maxDelta,
  };
  const mid = {
    slope: support.slope,
    intercept: support.intercept + maxDelta / 2,
    startIndex: start,
    endIndex: end,
    touches: 0,
    kind: 'mid' as const,
  };
  const width = maxDelta;
  return {
    upper,
    lower: support,
    mid,
    width,
    slope: mid.slope,
    touchesUpper: countTouches(
      data,
      upper,
      'resistance',
      trendlineConfig.priceTolerancePercent,
      start,
      end
    ),
    touchesLower: support.touches,
  };
}

function buildChannelFromResistance(
  data: Candle[],
  resistance: FittedLine
): Channel | undefined {
  const start = resistance.startIndex,
    end = resistance.endIndex;
  // 以阻力线平移到最低点构建下边界
  let maxDelta = -Infinity;
  for (let i = start; i <= end; i++) {
    const base = resistance.slope * i + resistance.intercept;
    maxDelta = Math.max(maxDelta, base - data[i].low);
  }
  const lower = {
    ...resistance,
    kind: 'support' as const,
    intercept: resistance.intercept - maxDelta,
  };
  const mid = {
    slope: resistance.slope,
    intercept: resistance.intercept - maxDelta / 2,
    startIndex: start,
    endIndex: end,
    touches: 0,
    kind: 'mid' as const,
  };
  const width = maxDelta;
  return {
    upper: resistance,
    lower,
    mid,
    width,
    slope: mid.slope,
    touchesUpper: resistance.touches,
    touchesLower: countTouches(
      data,
      lower,
      'support',
      trendlineConfig.priceTolerancePercent,
      start,
      end
    ),
  };
}

function detectBreakoutRetest(
  data: Candle[],
  ch: Channel
): BreakoutRetest | undefined {
  const lastIndex = data.length - 1;
  const last = data[lastIndex];
  const upperNow = ch.upper.slope * lastIndex + ch.upper.intercept;
  const lowerNow = ch.lower.slope * lastIndex + ch.lower.intercept;
  const brokeUp =
    last.close > upperNow * (1 + trendlineConfig.breakoutThresholdPercent);
  const brokeDown =
    last.close < lowerNow * (1 - trendlineConfig.breakoutThresholdPercent);
  if (!brokeUp && !brokeDown) return;
  const dir = brokeUp ? ('up' as const) : ('down' as const);

  // 回踩窗口
  const start = Math.max(0, lastIndex - trendlineConfig.retestWindowBars + 1);
  let retested = false;
  let retestIndex: number | undefined = undefined;
  for (let i = start; i <= lastIndex; i++) {
    const bound =
      dir === 'up'
        ? ch.upper.slope * i + ch.upper.intercept
        : ch.lower.slope * i + ch.lower.intercept;
    const tol = bound * trendlineConfig.retestTolerancePercent;
    if (dir === 'up') {
      if (data[i].low <= bound + tol) {
        retested = true;
        retestIndex = i;
        break;
      }
    } else {
      if (data[i].high >= bound - tol) {
        retested = true;
        retestIndex = i;
        break;
      }
    }
  }

  // 简单质量评分：触达回踩 + 斜率显著性 + 通道宽度合理性
  const atr = calculateATR(data, Math.min(14, data.length));
  const slopeScore = Math.min(100, Math.abs(ch.slope) * 1e4);
  const widthAtr = ch.width / Math.max(1e-8, atr);
  const widthScore =
    widthAtr >= trendlineConfig.channelWidthAtrMin &&
    widthAtr <= trendlineConfig.channelWidthAtrMax
      ? 100
      : 40;
  const retestScore = retested ? 100 : 40;
  const qualityScore = Math.round(
    trendlineConfig.scoreWeights.slope * (slopeScore / 100) +
      trendlineConfig.scoreWeights.retest * (retestScore / 100) +
      trendlineConfig.scoreWeights.touches *
        ((ch.touchesUpper + ch.touchesLower) / 6) +
      trendlineConfig.scoreWeights.follow * (widthScore / 100)
  );

  return {
    direction: dir,
    breakoutIndex: lastIndex,
    retested,
    retestIndex,
    qualityScore,
  };
}

export function analyzeTrendlinesAndChannels(
  symbol: string,
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour',
  pivots?: PivotPoint[]
): TrendlineChannelAnalysisResult {
  const n = data.length;
  const start = Math.max(0, n - trendlineConfig.maxLookbackBars);
  const pointsSupport: Array<{ x: number; y: number }> = [];
  const pointsResistance: Array<{ x: number; y: number }> = [];

  if (pivots && pivots.length > 0) {
    // 优先使用传入的摆动点
    for (const pivot of pivots) {
      if (pivot.index >= start) {
        if (pivot.type === 'low') {
          pointsSupport.push({ x: pivot.index, y: pivot.price });
        } else {
          pointsResistance.push({ x: pivot.index, y: pivot.price });
        }
      }
    }
  } else {
    // 如果没有传入摆动点，则使用旧方法
    for (let i = start; i < n; i++) {
      pointsSupport.push({ x: i, y: data[i].low });
      pointsResistance.push({ x: i, y: data[i].high });
    }
  }

  const sup = fitLine(pointsSupport);
  const res = fitLine(pointsResistance);
  const tol = trendlineConfig.priceTolerancePercent;

  const supTouches = countTouches(data, sup, 'support', tol, start, n - 1);
  const resTouches = countTouches(data, res, 'resistance', tol, start, n - 1);

  const fittedSupport: FittedLine | undefined =
    Math.abs(sup.slope) >= trendlineConfig.minSlopeAbs &&
    supTouches >= trendlineConfig.minTouches
      ? {
          slope: sup.slope,
          intercept: sup.intercept,
          startIndex: start,
          endIndex: n - 1,
          touches: supTouches,
          kind: 'support',
        }
      : undefined;
  const fittedResistance: FittedLine | undefined =
    Math.abs(res.slope) >= trendlineConfig.minSlopeAbs &&
    resTouches >= trendlineConfig.minTouches
      ? {
          slope: res.slope,
          intercept: res.intercept,
          startIndex: start,
          endIndex: n - 1,
          touches: resTouches,
          kind: 'resistance',
        }
      : undefined;

  // 分别从支撑线和阻力线独立构建通道
  let channelFromSupport: Channel | undefined = undefined;
  let channelFromResistance: Channel | undefined = undefined;
  if (fittedSupport) {
    channelFromSupport = buildChannelFromSupport(data, fittedSupport);
  }
  if (fittedResistance) {
    channelFromResistance = buildChannelFromResistance(data, fittedResistance);
  }

  // 选择质量更好的通道（触达数优先），如都无则为undefined
  let channel: Channel | undefined = undefined;
  if (channelFromSupport && channelFromResistance) {
    const supportTouches =
      channelFromSupport.touchesUpper + channelFromSupport.touchesLower;
    const resistanceTouches =
      channelFromResistance.touchesUpper + channelFromResistance.touchesLower;
    channel =
      supportTouches >= resistanceTouches
        ? channelFromSupport
        : channelFromResistance;
  } else {
    channel = channelFromSupport || channelFromResistance;
  }

  const breakoutRetest = channel
    ? detectBreakoutRetest(data, channel)
    : undefined;

  const slopeStr = channel
    ? channel.slope > 0
      ? '向上'
      : channel.slope < 0
        ? '向下'
        : '水平'
    : '—';
  const summary = channel
    ? `通道斜率: ${slopeStr} | 宽度: ${channel.width.toFixed(2)} | 上触达:${channel.touchesUpper} 下触达:${channel.touchesLower}`
    : '未形成稳定通道';

  return {
    symbol,
    timeframe,
    fittedSupport,
    fittedResistance,
    channel,
    breakoutRetest,
    summary,
  };
}
