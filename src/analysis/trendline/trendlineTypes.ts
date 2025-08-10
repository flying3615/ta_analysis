import type { Candle } from '../../types.js';

export interface FittedLine {
  slope: number; // 每根K线的价格变化斜率
  intercept: number; // y = slope * index + intercept
  startIndex: number;
  endIndex: number;
  touches: number; // 触达次数（在容差内）
  kind: 'support' | 'resistance' | 'mid';
}

export interface Channel {
  upper: FittedLine;
  lower: FittedLine;
  mid: FittedLine;
  width: number; // 价格差
  slope: number; // 以中轴为主
  touchesUpper: number;
  touchesLower: number;
}

export interface BreakoutRetest {
  direction: 'up' | 'down';
  breakoutIndex: number;
  retested: boolean;
  retestIndex?: number;
  qualityScore: number; // 综合质量评分
}

export interface TrendlineChannelAnalysisResult {
  symbol: string;
  timeframe: 'weekly' | 'daily' | '1hour';
  fittedSupport?: FittedLine;
  fittedResistance?: FittedLine;
  channel?: Channel;
  breakoutRetest?: BreakoutRetest;
  summary: string;
}

export type { Candle };
