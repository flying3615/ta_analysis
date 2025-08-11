/**
 * 集成分析配置
 * 统一管理所有集成相关的配置参数
 */

export interface IntegrationWeights {
  chip: number;
  pattern: number;
  volume: number;
  bbsr: number;
  // 附加权重（不计入100%基础权重）
  structure?: number;
  supplyDemand?: number;
  range?: number;
  trendline?: number;
  // 插件权重：按插件ID配置，可选
  plugins?: Record<string, number>;
}

export interface IntegrationThresholds {
  scoreLong: number;
  scoreShort: number;
  volatilityAdjustedScoreStrong: number;
  volatilityAdjustedScoreModerate: number;
  volatilityAdjustedScoreWeak: number;
  chipDirectionThreshold: number; // 筹码方向判断阈值
}

export interface DataTimeframes {
  weekly: {
    lookbackDays: number;
  };
  daily: {
    lookbackDays: number;
  };
  hourly: {
    lookbackDays: number;
  };
}

export interface IntegrationOptions {
  enableParallelAnalysis?: boolean;
  enableFallbackStrategy?: boolean;
  logLevel?: 'silent' | 'normal' | 'verbose';
  outputFormat?: 'console' | 'json' | 'both';
  // 若为 true，聚合器仅通过插件机制计算权重与方向（开闭原则更彻底）
  usePluginsOnly?: boolean;
}

export interface IntegrationConfig {
  weights: IntegrationWeights;
  thresholds: IntegrationThresholds;
  timeframes: DataTimeframes;
  options: IntegrationOptions;
}

// 默认配置
export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  weights: {
    chip: 0.25,
    pattern: 0.35,
    volume: 0.25,
    bbsr: 0.15,
    // 附加权重
    structure: 0.1,
    supplyDemand: 0.1,
    range: 0.1,
    trendline: 0.1,
    plugins: {},
  },
  thresholds: {
    scoreLong: 15,
    scoreShort: -15,
    volatilityAdjustedScoreStrong: 60,
    volatilityAdjustedScoreModerate: 40,
    volatilityAdjustedScoreWeak: 20,
    chipDirectionThreshold: 20,
  },
  timeframes: {
    weekly: {
      lookbackDays: 365,
    },
    daily: {
      lookbackDays: 90,
    },
    hourly: {
      lookbackDays: 60,
    },
  },
  options: {
    enableParallelAnalysis: true,
    enableFallbackStrategy: true,
    logLevel: 'normal',
    outputFormat: 'both',
    usePluginsOnly: false,
  },
};

// 配置更新函数
export function updateIntegrationConfig(
  updates: Partial<IntegrationConfig>
): IntegrationConfig {
  return {
    ...DEFAULT_INTEGRATION_CONFIG,
    ...updates,
    weights: {
      ...DEFAULT_INTEGRATION_CONFIG.weights,
      ...updates.weights,
    },
    thresholds: {
      ...DEFAULT_INTEGRATION_CONFIG.thresholds,
      ...updates.thresholds,
    },
    timeframes: {
      ...DEFAULT_INTEGRATION_CONFIG.timeframes,
      ...updates.timeframes,
    },
    options: {
      ...DEFAULT_INTEGRATION_CONFIG.options,
      ...updates.options,
    },
  };
}

// 权重归一化函数
export function normalizeWeights(
  weights: IntegrationWeights
): IntegrationWeights {
  const totalWeight =
    weights.chip + weights.pattern + weights.volume + weights.bbsr;

  if (totalWeight === 0) {
    throw new Error('权重总和不能为0');
  }

  return {
    chip: weights.chip / totalWeight,
    pattern: weights.pattern / totalWeight,
    volume: weights.volume / totalWeight,
    bbsr: weights.bbsr / totalWeight,
    // 附加权重保持不变
    structure: weights.structure,
    supplyDemand: weights.supplyDemand,
    range: weights.range,
    trendline: weights.trendline,
  };
}

// 验证配置函数
export function validateConfig(config: IntegrationConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查权重
  const totalMainWeight =
    config.weights.chip +
    config.weights.pattern +
    config.weights.volume +
    config.weights.bbsr;
  if (totalMainWeight <= 0) {
    errors.push('主要权重(chip+pattern+volume+bbsr)总和必须大于0');
  }

  // 检查阈值
  if (config.thresholds.scoreLong <= config.thresholds.scoreShort) {
    errors.push('做多阈值必须大于做空阈值');
  }

  // 检查时间范围
  if (
    config.timeframes.weekly.lookbackDays < config.timeframes.daily.lookbackDays
  ) {
    errors.push('周线回看天数应该大于等于日线回看天数');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
