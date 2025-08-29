// 新架构模块导入
import { IntegratedOrchestrator } from './integration/IntegratedOrchestrator.js';
import type { IntegrationConfig } from './integration/IntegrationConfig.js';

// === 新架构快捷入口 ===

/**
 * 新架构快捷入口函数
 * 使用新的集成编排器执行分析
 */
export async function executeIntegratedAnalysisV2(
  symbol: string,
  config?: Partial<IntegrationConfig>
) {
  const orchestrator = new IntegratedOrchestrator();
  const result = await orchestrator.executeIntegratedAnalysis(symbol, config);
  return result.tradePlan; // 返回交易计划，保持向后兼容
}

/**
 * 新架构快捷入口函数（加密货币）
 * 使用 tmai-api 获取加密货币 OHLCV 后走统一编排
 */
export async function executeIntegratedCryptoAnalysisV2(
  symbol: string,
  apiKey: string,
  config?: Partial<IntegrationConfig>
) {
  const orchestrator = new IntegratedOrchestrator();
  const result = await orchestrator.executeIntegratedCryptoAnalysis(symbol, apiKey, config);
  return result.tradePlan;
}

/**
 * 批量分析多个股票
 */
export async function executeBatchAnalysis(
  symbols: string[],
  config?: Partial<IntegrationConfig>,
  parallelLimit?: number
) {
  const orchestrator = new IntegratedOrchestrator();
  if (config) {
    orchestrator.updateConfig(config);
  }
  return await orchestrator.executeBatchAnalysis({
    symbols,
    parallelLimit,
  });
}
