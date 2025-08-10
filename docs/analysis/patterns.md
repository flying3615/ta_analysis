### 图表形态 + 趋势逆转增强

基于图表形态（双顶/双底、杯柄、三角形、旗形等）检测，并由小周期→大周期的趋势逆转模块进行增强，避免重复计算。

#### 目录与核心文件
- `src/analysis/patterns/patternConfig.ts`: 形态参数与权重
- `src/analysis/patterns/analyzeMultiTimeframePatterns.ts`: 多周期形态分析
- `src/analysis/trendReversal/trendReversalConfig.ts`: 逆转参数
- `src/analysis/trendReversal/multiTimeFrameTrendReversal.ts`: 趋势逆转增强器
- `src/analysis/trendReversal/formatReport.ts`: 报告输出

#### 输入/输出
- 输入：`weekly/daily/1hour` 蜡烛
- 输出：`EnhancedPatternAnalysis`（含组合信号、主导形态、目标等）

#### 算法要点
- 形态评分按时间衰减与一致性加权
- 逆转增强：小周期顺应大周期的 CHOCH/BOS 特征并给出入场/止损

#### 配置
通过 `patternConfig`、`trendReversalConfig` 与对应的 `updateXxxConfig` 动态调整。

#### 与综合分析的集成
- 作为方向核心来源之一，形态目标价与突破位进入关键价位

#### 运行示例
```
node scripts/run-mtf-trendreversal.mjs TSLA
```


