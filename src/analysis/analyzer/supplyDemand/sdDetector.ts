import type { Candle } from '../../../types.js';
import { calculateATR } from '../../../util/taUtil.js';
import { sdConfig } from './sdConfig.js';
import type {
  SdAnalysisResult,
  Zone,
  ZoneStatus,
  ZoneType,
} from './sdTypes.js';

export type { SdAnalysisResult };

function detectBaseZones(
  data: Candle[],
  type: ZoneType,
  timeframe: 'weekly' | 'daily' | '1hour'
): Zone[] {
  const zones: Zone[] = [];
  const config = sdConfig;
  const atr = calculateATR(data, 14);
  const baseMaxRange = atr * config.baseRangeAtrMultiplier;

  for (let i = config.baseWindow; i < data.length - config.impulseWindow; i++) {
    const window = data.slice(i - config.baseWindow, i);
    const high = Math.max(...window.map(c => c.high));
    const low = Math.min(...window.map(c => c.low));
    const range = high - low;
    if (range <= 0 || range > baseMaxRange) continue;

    // 检查后续是否有对应方向的推进
    const next = data.slice(i, i + config.impulseWindow);
    const nextMoveUp = next[next.length - 1].close - next[0].open;

    if (type === 'demand' && nextMoveUp > atr * config.impulseAtrMultiplier) {
      zones.push({
        type,
        timeframe,
        startIndex: i - config.baseWindow,
        endIndex: i - 1,
        low,
        high,
        status: 'fresh',
      });
    }
    if (type === 'supply' && nextMoveUp < -atr * config.impulseAtrMultiplier) {
      zones.push({
        type,
        timeframe,
        startIndex: i - config.baseWindow,
        endIndex: i - 1,
        low,
        high,
        status: 'fresh',
      });
    }
  }
  return zones;
}

function updateZoneStatus(data: Candle[], zones: Zone[]): Zone[] {
  const current = data[data.length - 1].close;
  return zones.map(z => {
    const broken =
      z.type === 'demand'
        ? current < z.low * (1 - sdConfig.breakThresholdPercent)
        : current > z.high * (1 + sdConfig.breakThresholdPercent);
    if (broken) return { ...z, status: 'broken' as ZoneStatus };

    // 测试（触达）
    const touched =
      z.type === 'demand'
        ? current <= z.high && current >= z.low
        : current >= z.low && current <= z.high;
    if (touched && z.status === 'fresh')
      return {
        ...z,
        status: 'tested' as ZoneStatus,
        lastTouchIndex: data.length - 1,
      };
    return z;
  });
}

function computePremiumDiscount(data: Candle[]) {
  const closes = data.map(c => c.close);
  const slice = closes.slice(-sdConfig.recentRangeLookback);
  const basisLow = Math.min(...slice);
  const basisHigh = Math.max(...slice);
  const currentPrice = closes[closes.length - 1];
  const denom =
    Math.abs(basisHigh - basisLow) < 1e-8 ? 1e-8 : basisHigh - basisLow;
  const position = ((currentPrice - basisLow) / denom) * 100;
  return { basisLow, basisHigh, currentPrice, position };
}

export function analyzeSupplyDemandZone(
  symbol: string,
  data: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): SdAnalysisResult {
  const config = sdConfig;
  const demandZones = detectBaseZones(data, 'demand', timeframe);
  const supplyZones = detectBaseZones(data, 'supply', timeframe);
  const zones = updateZoneStatus(data, [...demandZones, ...supplyZones]).filter(
    z => (z.high - z.low) / z.low >= config.minZoneWidthPercent
  );

  const recentEffectiveZones = zones
    .filter(z => z.status !== 'broken')
    .slice(-5);
  const premiumDiscount = computePremiumDiscount(data);

  return { symbol, timeframe, zones, recentEffectiveZones, premiumDiscount };
}
