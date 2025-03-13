export type ConditionOptions = {
  shouldHigherThanAveragePriceDays?: number[];
  priceDeviationWithin?: number;
  closeToHighestWithin?: number;
  turnOverRateRange?: [min: number, max?: number];
  volumeRatioRange?: [min: number, max?: number];
  minVolume?: number;
  higherThanLast120DaysHighest?: boolean;
  maxSharesOutstanding?: number;
  bullish?: boolean;
  breakout?: boolean;
};

export type ConditionOptionsWithSrc = ConditionOptions & {
  sourceIds: string[];
};

export type Position = {
  quantity: number;
  price: number;
};

export type TimeFrameConfig = {
  interval: string;
  studies?: Array<{ name: string }>;
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

export type PullbackEMA20Result = {
  stockCode: string;
  ema20Price: number;
  priceRange: string;
  deviation: string;
};

export interface Analyzer {
  apiKey: string;
  modelName: string;
  withCache?: boolean;
  // eslint-disable-next-line no-unused-vars
  doAnalysis: (data: AnalysisObject) => Promise<string>;
  analysisTrade: (
    report: TradesReport,
    historicalPrices: Candle[]
  ) => Promise<string>;
}

export interface Strategy<T> {
  run(_): T;
}

export interface SupportResistanceResult {
  symbol: string;
  supportLevels: number[];
  resistanceLevels: number[];
  dynamicSupport: number | null;
  dynamicResistance: number | null;
  breakSignals: BreakSignal[];
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
