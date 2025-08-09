import type { Candle } from '../../types.js';

export type ZoneType = 'supply' | 'demand';
export type ZoneStatus = 'fresh' | 'tested' | 'broken';

export interface Zone {
  type: ZoneType;
  timeframe: 'weekly' | 'daily' | '1hour';
  startIndex: number;
  endIndex: number;
  low: number;
  high: number;
  status: ZoneStatus;
  lastTouchIndex?: number;
}

export interface SdAnalysisResult {
  symbol: string;
  timeframe: 'weekly' | 'daily' | '1hour';
  zones: Zone[];
  recentEffectiveZones: Zone[]; // 最近有效（fresh/tested未破）的供需区
  premiumDiscount: {
    basisLow: number;
    basisHigh: number;
    currentPrice: number;
    position: number; // 0-100：折价到溢价区间位置
  };
}

export interface MultiTimeSdAnalysis {
  symbol: string;
  results: SdAnalysisResult[];
  overlaps: Zone[]; // 跨周期重叠区（聚合）
}


