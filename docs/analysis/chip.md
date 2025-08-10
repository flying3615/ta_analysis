### 筹码分布（Chip Distribution）

本模块用于从不同时间周期（周/日/小时）评估筹码集中度、获利/套牢筹码比例、筹码峰迁移与成交量趋势，输出多周期合成的方向建议与关键价位。

#### 目录与核心文件
- `src/analysis/chip/chipTypes.ts`: 类型定义（`ChipDistribution`, `ChipPeak`, `ChipAnalysisResult`）
- `src/analysis/chip/chipConfig.ts`: 配置与 `updateChipConfig`
- `src/analysis/chip/chipSignals.ts`: 买入/做空信号打分与建议构建
- `src/analysis/chip/combineTimeframes.ts`: 多周期合成、关键位判定
- `src/analysis/chip/formatChipAnalysis.ts` 与 `chipFormat.ts`: 输出格式化
- `src/analysis/chip/chipDistributionAnalysis.ts`: 单周期核心计算
- `src/analysis/chip/multiTimeFrameChipDistributionAnalysis.ts`: 多周期编排入口

#### 输入/输出
- 输入：`weekly/daily/1hour` 蜡烛数组、时间周期权重、主周期
- 输出：`MultiTimeframeAnalysisResult`
  - 包含各周期 `ChipAnalysisResult`、合成方向/强度、聚合支撑/阻力等

#### 算法要点
- 计算价格-成交量分布，识别筹码峰、迁移方向与集中度
- 统计获利/套牢比例，结合成交量趋势加权
- 多周期合成时，基于权重与一致性生成综合方向与强度

#### 配置
通过 `chipConfig` 调整阈值/比例，外部可用 `updateChipConfig(partial)` 覆盖。

#### 与综合分析的集成
- 提供：方向建议、关键位（支撑/阻力），计入总分与“分析构成”
- 在 `IntegratedAnalysis` 中作为主要方向来源之一

#### 运行示例
```
node scripts/run-mtf-chip.mjs TSLA
```


