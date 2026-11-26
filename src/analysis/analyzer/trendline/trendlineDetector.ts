import type { Candle } from '../../../types.js';
import { calculateATR } from '../../../util/taUtil.js';
import { trendlineConfig } from './trendlineConfig.js';
import type {
  FittedLine,
  Channel,
  BreakoutRetest,
  TrendlineChannelAnalysisResult,
} from './trendlineTypes.js';

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

/**
 * 以给定斜率构建包络通道：上沿平移到区间内最高点，下沿平移到区间内最低点。
 * 两侧都是包络线，所以向上和向下突破的判定是对称的。
 */
function buildEnvelopeChannel(
  data: Candle[],
  base: FittedLine
): Channel | undefined {
  const start = base.startIndex,
    end = base.endIndex;
  let maxAbove = -Infinity;
  let maxBelow = -Infinity;
  for (let i = start; i <= end; i++) {
    const line = base.slope * i + base.intercept;
    maxAbove = Math.max(maxAbove, data[i].high - line);
    maxBelow = Math.max(maxBelow, line - data[i].low);
  }
  const upper: FittedLine = {
    ...base,
    kind: 'resistance',
    intercept: base.intercept + maxAbove,
  };
  const lower: FittedLine = {
    ...base,
    kind: 'support',
    intercept: base.intercept - maxBelow,
  };
  const width = upper.intercept - lower.intercept;
  const mid: FittedLine = {
    slope: base.slope,
    intercept: lower.intercept + width / 2,
    startIndex: start,
    endIndex: end,
    touches: 0,
    kind: 'mid',
  };
  const tol = trendlineConfig.priceTolerancePercent;
  const touchesUpper = countTouches(data, upper, 'resistance', tol, start, end);
  const touchesLower = countTouches(data, lower, 'support', tol, start, end);
  return {
    upper: { ...upper, touches: touchesUpper },
    lower: { ...lower, touches: touchesLower },
    mid,
    width,
    slope: base.slope,
    touchesUpper,
    touchesLower,
  };
}

/**
 * 在通道拟合区间之后的最近K线里检测突破：
 * 最后一根收盘价越过通道边界才算突破；突破K线是窗口内第一根越过边界的K线，
 * 回踩只在突破K线之后判断。
 */
function detectBreakoutRetest(
  data: Candle[],
  ch: Channel,
  fitEnd: number
): BreakoutRetest | undefined {
  const lastIndex = data.length - 1;
  const th = trendlineConfig.breakoutThresholdPercent;
  const upperAt = (i: number) => ch.upper.slope * i + ch.upper.intercept;
  const lowerAt = (i: number) => ch.lower.slope * i + ch.lower.intercept;
  const isBeyond = (i: number, dir: 'up' | 'down') =>
    dir === 'up'
      ? data[i].close > upperAt(i) * (1 + th)
      : data[i].close < lowerAt(i) * (1 - th);

  const dir: 'up' | 'down' | undefined = isBeyond(lastIndex, 'up')
    ? 'up'
    : isBeyond(lastIndex, 'down')
      ? 'down'
      : undefined;
  if (!dir) return;

  let breakoutIndex = lastIndex;
  for (let i = fitEnd + 1; i <= lastIndex; i++) {
    if (isBeyond(i, dir)) {
      breakoutIndex = i;
      break;
    }
  }

  // 回踩：突破之后的K线回到边界附近
  let retested = false;
  let retestIndex: number | undefined = undefined;
  const retestEnd = Math.min(
    lastIndex,
    breakoutIndex + trendlineConfig.retestWindowBars
  );
  for (let i = breakoutIndex + 1; i <= retestEnd; i++) {
    const bound = dir === 'up' ? upperAt(i) : lowerAt(i);
    const tol = bound * trendlineConfig.retestTolerancePercent;
    if (
      dir === 'up' ? data[i].low <= bound + tol : data[i].high >= bound - tol
    ) {
      retested = true;
      retestIndex = i;
      break;
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
        Math.min(1, (ch.touchesUpper + ch.touchesLower) / 6) +
      trendlineConfig.scoreWeights.follow * (widthScore / 100)
  );

  return {
    direction: dir,
    breakoutIndex,
    retested,
    retestIndex,
    qualityScore,
  };
}

export function analyzeTrendlinesAndChannels(
  symbol: string,
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): TrendlineChannelAnalysisResult {
  const n = data.length;
  const start = Math.max(0, n - trendlineConfig.maxLookbackBars);
  // 通道只用最近 breakoutWindowBars 根之前的K线拟合，最近的K线用来判断突破
  const fitEnd = n - 1 - trendlineConfig.breakoutWindowBars;
  if (fitEnd - start + 1 < trendlineConfig.minTouches * 3) {
    return {
      symbol,
      timeframe,
      summary: '数据不足，未形成稳定通道',
    };
  }

  const pointsSupport: Array<{ x: number; y: number }> = [];
  const pointsResistance: Array<{ x: number; y: number }> = [];
  for (let i = start; i <= fitEnd; i++) {
    pointsSupport.push({ x: i, y: data[i].low });
    pointsResistance.push({ x: i, y: data[i].high });
  }
  const sup = fitLine(pointsSupport);
  const res = fitLine(pointsResistance);
  const tol = trendlineConfig.priceTolerancePercent;

  const supTouches = countTouches(data, sup, 'support', tol, start, fitEnd);
  const resTouches = countTouches(data, res, 'resistance', tol, start, fitEnd);

  const fittedSupport: FittedLine | undefined =
    Math.abs(sup.slope) >= trendlineConfig.minSlopeAbs &&
    supTouches >= trendlineConfig.minTouches
      ? {
          slope: sup.slope,
          intercept: sup.intercept,
          startIndex: start,
          endIndex: fitEnd,
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
          endIndex: fitEnd,
          touches: resTouches,
          kind: 'resistance',
        }
      : undefined;

  // 分别以支撑线和阻力线的斜率构建包络通道，选触达数更多的一个
  const candidates = [fittedSupport, fittedResistance]
    .filter((l): l is FittedLine => !!l)
    .map(l => buildEnvelopeChannel(data, l))
    .filter((c): c is Channel => !!c);
  const channel = candidates.reduce<Channel | undefined>(
    (best, c) =>
      !best ||
      c.touchesUpper + c.touchesLower > best.touchesUpper + best.touchesLower
        ? c
        : best,
    undefined
  );

  const breakoutRetest = channel
    ? detectBreakoutRetest(data, channel, fitEnd)
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
