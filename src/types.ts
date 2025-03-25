import { MultiTimeFrameBBSRAnalysisResult } from './analysis/sr/multiTimeFrameBBSRAnalysis.js';
import { TrendReversalSignal } from './analysis/trendReversal/multiTimeFrameTrendReversal.js';

export type Position = {
  quantity: number;
  price: number;
};

export type ChartImg = {
  title: string;
  url: string;
  size?: number;
  expireAt?: string;
  createdAt?: string;
  media_type: string;
};

export type Weight = {
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  volumeRatio: number;
  sharesOutstanding: number;
  breakoutStrength: number;
};

export type AnalysisObject = {
  stockCode: string;
  historicalPrices: string;
  userCapital: number;
  fundamentalData: string;
  imagesData?: ChartImg[];
  position?: Position;
};

export interface Strategy<T> {
  run(_): T;
}

export interface PatternResult {
  date: Date;
  patternType: 'bullish' | 'bearish';
  priceLevel: number;
  strength: number; // 0-100 的强度值
  patternNames: string[]; // 形态名称
}

export interface SRSignal {
  symbol: string;
  SRLevel: number;
  signalDate: Date;
  currentPrice: number;
  strength: number;
  signal: PatternResult;
}

export interface SupportResistanceResult {
  symbol: string;
  dynamicSupport: number | null;
  dynamicResistance: number | null;
}

export interface TradeRecord {
  code: string;
  market: string;
  exchange: string;
  tradeType: string;
  quantity: number;
  price: number;
  amount: number;
  realizedPnL: number;
  tradeTime: string;
  settlementDate: string;
  currency: string;
}

export interface TradesReport {
  trades: TradeRecord[];
  totalPnL: number;
  totalQuantity: number;
}

export interface BreakSignal {
  time: Date;
  type: 'support_break' | 'resistance_break' | 'bull_wick' | 'bear_wick';
  price: number;
  strength: number; // 0-100 based on volume and other factors
  breakPriceLevel: number;
}

export interface PatternFeatures {
  trendType: 'up' | 'down' | 'sideways';
  volatilityLevel: 'high' | 'medium' | 'low';
  volumePattern: 'increasing' | 'decreasing' | 'stable' | 'spikes';
  rsiState: 'overbought' | 'oversold' | 'neutral';
  supportResistanceCount: number;
  maConfiguration: 'above' | 'below' | 'crossing';
  volatilityTrend: 'decreasing' | 'increasing' | 'stable';
  priceVolatilityPattern:
    | 'low_volatility_upper_range'
    | 'low_volatility_lower_range'
    | 'low_volatility_mid_range'
    | 'other';
  priceAction:
    | 'breakout'
    | 'breakdown'
    | 'consolidation'
    | 'pullback'
    | 'other';
  candlePatterns: string[];
  gapPresent: boolean;
  volumePriceRelationship:
    | 'rising_price_rising_volume'
    | 'rising_price_falling_volume'
    | 'falling_price_rising_volume'
    | 'falling_price_falling_volume'
    | 'neutral';
  swingHighsLows:
    | 'higher_highs_higher_lows'
    | 'lower_highs_lower_lows'
    | 'higher_highs_lower_lows'
    | 'lower_highs_higher_lows'
    | 'flat';
  priceChannelType:
    | 'ascending'
    | 'descending'
    | 'horizontal'
    | 'expanding'
    | 'contracting'
    | 'none';
}

export interface PatternMatchResult {
  symbol: string;
  isMatch: boolean;
  matchScore: string;
  featureMatches: {
    [feature: string]: boolean;
  };
  features: PatternFeatures;
}

export interface AnalysisResult {
  trendSlope: number;
  trendDirection: string;
  supportLevels: number[];
  resistanceLevels: number[];
  goldenCrossDates: Date[];
  deathCrossDates: Date[];
  highVolumeDates: Date[];
  avgVolumeRatio: number;
  volatility: number;
  currentRsi: number;
  overboughtDays: number;
  oversoldDays: number;
}

export type Interval =
  | '1m'
  | '2m'
  | '5m'
  | '15m'
  | '30m'
  | '60m'
  | '90m'
  | '1h'
  | '1d'
  | '5d'
  | '1wk'
  | '1mo'
  | '3mo';

export interface Candle {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
}

/**
 * 综合交易信号强度枚举
 */
export enum SignalStrength {
  Strong = 'strong', // 强信号
  Moderate = 'moderate', // 中等信号
  Weak = 'weak', // 弱信号
  Neutral = 'neutral', // 中性信号
  Conflicting = 'conflicting', // 冲突信号
}

/**
 * 综合交易方向枚举
 */
export enum TradeDirection {
  Long = 'long', // 做多
  Short = 'short', // 做空
  Neutral = 'neutral', // 中性
}

/**
 * 风险等级枚举
 */
export enum RiskLevel {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

/**
 * 时间周期优先级
 */
export enum TimeframePriority {
  Primary = 'primary', // 主要时间周期
  Secondary = 'secondary', // 次要时间周期
  Tertiary = 'tertiary', // 第三时间周期
}

/**
 * 关键价位类型
 */
export interface KeyLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak';
  source: 'chip' | 'pattern' | 'combined';
  timeframe: 'weekly' | 'daily' | '1hour';
  description: string;
}

/**
 * 交易条件接口
 */
export interface TradeCondition {
  type: 'price' | 'pattern' | 'indicator' | 'volume' | 'time';
  description: string;
  priority: 'critical' | 'important' | 'optional';
}

/**
 * 综合交易计划接口
 */
export interface IntegratedTradePlan {
  symbol: string;
  currentPrice: number;
  date: Date;

  // 综合交易方向和信号强度
  direction: TradeDirection;
  signalStrength: SignalStrength;
  confidenceScore: number; // 0-100

  // 各分析方法的权重与贡献
  chipAnalysisWeight: number;
  patternAnalysisWeight: number;
  chipAnalysisContribution: number; // 0-100
  patternAnalysisContribution: number; // 0-100

  // 总体分析描述
  summary: string;
  primaryRationale: string;
  secondaryRationale: string;
  warnings: string[];

  // 时间周期分析结果
  primaryTimeframe: 'weekly' | 'daily' | '1hour';
  timeframeConsistency: string;
  shortTermOutlook: string;
  mediumTermOutlook: string;
  longTermOutlook: string;

  // 入场计划
  entryStrategy: {
    idealEntryPrice: number;
    alternativeEntryPrice: number;
    entryType: 'immediate' | 'pullback' | 'breakout';
    entryConditions: TradeCondition[];
    priceZones: {
      ideal: [number, number];
      acceptable: [number, number];
    };
    timeWindow: string;
    riskLevel: RiskLevel;
  };

  // 出场计划
  exitStrategy: {
    takeProfitLevels: {
      price: number;
      proportion: number; // 0-1, 表示仓位比例
      reasoning: string;
    }[];
    stopLossLevels: {
      price: number;
      type: 'fixed' | 'trailing';
      reasoning: string;
    }[];
    timeBasedExit: string;
    maximumHoldingPeriod: string;
  };

  // 风险管理
  riskManagement: {
    suggestionPosition: number; // 0-1, 表示账户资金比例
    riskRewardRatio: number;
    maxLoss: string;
    volatilityConsideration: string;
    adjustmentTriggers: string[];
  };

  // 关键价位
  keyLevels: KeyLevel[];

  bbsrAnalysis: MultiTimeFrameBBSRAnalysisResult;

  // 确认信号
  confirmationSignals: TradeCondition[];

  // 无效信号条件
  invalidationConditions: TradeCondition[];

  // 趋势逆转信息
  trendReversalInfo?: {
    hasReversalSignal: boolean;
    primaryReversalSignal?: TrendReversalSignal;
    reversalSignalStrength?: number;
    smallTimeframe?: string;
    largeTimeframe?: string;
    reversalDirection?: number;
    entryPrice?: number;
    stopLoss?: number;
    description: string;

    targets?: {
      target1: number; // 目标1 (保守目标)
      target2: number; // 目标2 (标准量度移动目标)
      target3: number; // 目标3 (扩展目标，通常是1.618倍)
      riskRewardRatio1: number; // 目标1的风险回报比
      riskRewardRatio2: number; // 目标2的风险回报比
      riskRewardRatio3: number; // 目标3的风险回报比
    };
  };

  // 综合自筹码和形态分析的关键点
  keyObservations: string[];
}

export interface VolatilityAnalysisResult {
  historicalVolatility: number;
  bollingerBandWidth: number;
  atr: number;
  atrPercent: number;
  volatilityRegime: 'low' | 'medium' | 'high' | 'extreme';
  isVolatilityIncreasing: boolean;
  impliedVolatility?: number; // 如果有期权数据
  volatilityPercentile: number; // 当前波动率在过去N天的百分位
  volatilityTrend: string;
  recentRanges: { daily: number; weekly: number; monthly: number }; // 各时间段的波动范围（%）
  riskMetrics: {
    sharpeRatio?: number; // 在有足够历史数据的情况下
    maxDrawdown: number;
    downsideDeviation: number;
  };
}
