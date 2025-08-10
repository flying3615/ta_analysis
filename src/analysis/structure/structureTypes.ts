import type { Candle } from '../../types.js';

export type StructureTrend = 'up' | 'down' | 'sideways';

export interface PivotPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
}

export interface Swing {
  startIndex: number;
  endIndex: number;
  high: number;
  low: number;
}

export interface StructureEvent {
  type: 'BOS' | 'CHOCH' | 'EqualHighs' | 'EqualLows';
  direction: 'bullish' | 'bearish' | 'neutral';
  index: number;
  price: number;
  timeframe: 'weekly' | 'daily' | '1hour';
}

export interface StructureResult {
  timeframe: 'weekly' | 'daily' | '1hour';
  trend: StructureTrend;
  lastEvent?: StructureEvent;
  keyLevels: number[]; // 关键结构位（最近HL/LH、区间边界、中位线）
  summary: string; // 一句话摘要
}

export interface MultiTimeframeStructureAnalysis {
  symbol: string;
  results: StructureResult[];
  combinedTrend: StructureTrend;
  consistency: 'strong' | 'medium' | 'weak' | 'mixed';
  combinedSummary: string;
}
