export interface ChipDistribution {
  price: number;
  weight: number;
  percentage: number;
}

export interface ChipPeak {
  price: number;
  weight: number;
  percentage: number;
  peakType: 'major' | 'secondary' | 'minor';
  distance: number; // 距离当前价格的百分比
}

export interface ChipAnalysisResult {
  // 基本信息
  symbol: string;
  currentPrice: number;

  // 筹码集中度分析
  concentrationIndex: number; // 0-100，越高越集中
  concentrationLevel: string; // 高/中/低
  isEasyToPush: boolean;
  concentrationComment: string;
  entropyValue: number;
  bullBearRatio: number;

  // 上方套牢盘
  trappedChipsAbove: number;
  resistanceLevel: string; // 强/中/弱
  isPushingDifficult: boolean;
  resistanceComment: string;

  // 获利盘
  profitChipsPercentage: number;
  profitTakingRisk: string; // 高/中/低
  isRiskyToChase: boolean;
  profitComment: string;

  // 筹码峰
  chipPeaks: ChipPeak[];
  majorPeaks: ChipPeak[];
  peakDistribution: string;
  peakComment: string;

  // 形态
  chipShape: string;
  shapeBuySignal: boolean;
  shapeComment: string;

  // 成交量趋势
  recentVolumeChange: number;
  volumeTrend: string;
  volumeComment: string;

  // 筹码迁移
  chipMigrationDirection: string;
  chipMigrationSpeed: number;
  migrationComment: string;

  // 买入
  buySignalStrength: number; // 0-100
  buyRecommendation: string;
  buyComment: string;

  // 做空
  shortSignalStrength: number; // 0-100
  shortRecommendation: string;
  shortComment: string;
  isShortRecommended: boolean;

  // 综合建议
  overallRecommendation: string;
  positionSuggestion: string;
  overallComment: string;

  // 关键位
  majorSupportLevels: number[];
  majorResistanceLevels: number[];
  giniCoefficient: number;
  strongSupportLevels: number[];
  moderateSupportLevels: number[];
  strongResistanceLevels: number[];
  moderateResistanceLevels: number[];

  // CDF
  cumulativeDistribution: { price: number; cumulativePercentage: number }[];

  // 技术指标
  macdSignal: string;
  rsiLevel: number;
  bollingerStatus: string;
  technicalSignal: string;
}
