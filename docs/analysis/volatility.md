### 波动率 & 量能（Volatility & Volume）

结合 ATR、布林带宽度、历史波动率与量价关系，输出波动环境与量能结论，并提供机器可解析摘要字段。

#### 目录与核心文件
- `src/analysis/volatility/volatilityAnalysis.ts`: 综合波动率分析与汇总
- `src/analysis/volatility/volumeVolatilityAnalysis.ts`: 量能子模块类型
- `src/analysis/FormatTradePlan.ts`: `vvInsights` 输出集成与 JSON 摘要

#### 输入/输出
- 输入：小时蜡烛
- 输出：波动率摘要、量能摘要、合成总结

#### 算法要点
- ATR%、布林带宽度、HV 百分位、量价背离与 AD/OBV/MFI 等综合
- 形成“方向修饰因子”，作用于综合信号强度与置信度

#### 配置
见 `volatilityConfig`（若存在）或在模块内部默认参数。

#### 与综合分析的集成
- 影响最终信号强度与置信度；`vvSummary` 与 `vvInsights` 进入统一输出

#### 运行示例
```
node scripts/run-mtf-volatility.mjs TSLA
```


