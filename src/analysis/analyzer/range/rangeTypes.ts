import type { Candle } from '../../../types.js';

export interface RangeBox {
  startIndex: number;
  endIndex: number;
  high: number;
  low: number;
  nr4Count: number;
  nr7Count: number;
}

export interface BreakoutAssessment {
  direction: 'up' | 'down';
  breakoutIndex: number;
  barsSinceBreakout: number; // 突破K线距最后一根K线的根数
  volumeExpansion: boolean;
  followThrough: boolean;
  retested: boolean;
  qualityScore: number; // 0-100
}

export interface RangeAnalysisResult {
  symbol: string;
  timeframe: 'weekly' | 'daily' | '1hour';
  range?: RangeBox;
  compressionScore: number; // 收缩强度 0-100
  breakout?: BreakoutAssessment;
}
