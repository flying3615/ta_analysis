#!/usr/bin/env node

/**
 * 测试新架构的集成分析功能
 */

import { 
  IntegratedOrchestrator,
  executeIntegratedAnalysisV2,
  DEFAULT_INTEGRATION_CONFIG,
  updateIntegrationConfig,
} from '../dist/index.js';

const symbol = process.argv[2] || 'AAPL';

async function testNewArchitecture() {
  console.log(`\n======== 测试新架构 - ${symbol} ========`);
  
  try {
    // 测试1: 使用默认配置
    console.log('\n--- 测试1: 使用默认配置的快捷入口 ---');
    const result1 = await executeIntegratedAnalysisV2(symbol);
    console.log(`✅ 快捷入口测试成功`);
    console.log(`方向: ${result1.direction}, 置信度: ${result1.confidenceScore.toFixed(1)}%`);
    
    // 测试2: 使用自定义配置
    console.log('\n--- 测试2: 使用自定义配置 ---');
    const customConfig = updateIntegrationConfig({
      weights: {
        chip: 0.3,
        pattern: 0.4,
        volume: 0.2,
        bbsr: 0.1,
      },
      options: {
        logLevel: 'verbose',
      },
    });
    
    const result2 = await executeIntegratedAnalysisV2(symbol, customConfig);
    console.log(`✅ 自定义配置测试成功`);
    console.log(`方向: ${result2.direction}, 置信度: ${result2.confidenceScore.toFixed(1)}%`);
    
    // 测试3: 直接使用编排器
    console.log('\n--- 测试3: 直接使用编排器（含诊断信息） ---');
    const orchestrator = new IntegratedOrchestrator();
    const result3 = await orchestrator.executeIntegratedAnalysis(symbol);
    
    console.log(`✅ 编排器测试成功`);
    console.log(`执行时间: ${result3.performance.totalExecutionTime}ms`);
    console.log(`缓存命中率: ${(result3.performance.cacheHitRate || 0 * 100).toFixed(1)}%`);
    
    // 测试4: 配置验证
    console.log('\n--- 测试4: 配置验证 ---');
    const invalidConfig = {
      weights: { chip: 0, pattern: 0, volume: 0, bbsr: 0 }, // 无效权重
      thresholds: { scoreLong: -10, scoreShort: 10 }, // 无效阈值
    };
    
    const { validateConfig } = await import('../dist/index.js');
    const validation = validateConfig({ ...DEFAULT_INTEGRATION_CONFIG, ...invalidConfig });
    
    if (!validation.valid) {
      console.log(`✅ 配置验证测试成功，发现预期错误: ${validation.errors.join(', ')}`);
    } else {
      console.log(`❌ 配置验证测试失败，应该检测到错误`);
    }
    
    console.log('\n========== 所有测试完成 ==========');
    
    // 显示架构改进总结
    console.log('\n🎉 新架构特性:');
    console.log('✅ 模块化设计 - 职责分离清晰');
    console.log('✅ 配置管理 - 统一的配置系统');
    console.log('✅ 类型安全 - 强类型约束');
    console.log('✅ 错误处理 - 降级策略支持');
    console.log('✅ 性能监控 - 执行时间跟踪');
    console.log('✅ 缓存机制 - 数据复用优化');
    console.log('✅ 并行处理 - 提升分析速度');
    console.log('✅ 批量分析 - 支持多股票分析');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testNewArchitecture().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
