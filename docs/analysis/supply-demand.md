### 供需区（Supply/Demand Zones）

识别基底—冲击—离开结构，标注需求/供应区、状态（新鲜/测试/破坏），并计算 premium/discount。

#### 目录与核心文件
- `src/analysis/supplyDemand/sdConfig.ts`、`sdTypes.ts`
- `src/analysis/supplyDemand/sdDetector.ts`: 区域检测与状态更新
- `src/analysis/supplyDemand/multiTimeSupplyDemand.ts`: 多周期汇总
- `src/analysis/supplyDemand/formatSupplyDemand.ts`: 格式输出

#### 输入/输出
- 输入：日/小时蜡烛
- 输出：最近有效区、最近区间与 premium/discount、建议

#### 算法要点
- 基底压缩程度 + 冲击力度（ATR倍数）作为有效性指标
- 按最近程度与状态筛选“最近有效区”

#### 配置
`sdConfig` 提供窗口与阈值，`updateSdConfig` 可外部覆盖。

#### 与综合分析的集成
- 以“靠近需求/供应区”生成偏多/偏空附加分；最近有效区边界进入关键位。


