### 区间 & 突破质量（Range & Breakout Quality）

检测最近震荡区间、统计 NR4/NR7、评估突破方向与质量（扩量/延续/回测）。

#### 目录与核心文件
- `src/analysis/analyzer/range/rangeConfig.ts`、`rangeTypes.ts`
- `src/analysis/analyzer/range/rangeDetector.ts`: 区间检测与突破质量评估
- `src/analysis/analyzer/range/formatRange.ts`: 输出格式化

#### 输入/输出
- 输入：日/小时蜡烛
- 输出：`RangeAnalysisResult`（区间、压缩分、突破质量）

#### 算法要点
- 在回看窗口内寻找宽度不超过 ATR 阈值的区间，统计 NR4/NR7
- 突破时基于扩量、延续、回测三维构建质量分

#### 配置
`rangeConfig` 支持 ATR 周期、lookback（只在最近 lookback 根K线内找区间）、阈值等，`updateRangeConfig` 可外部调整。突破距今超过 `maxBreakoutAgeBars`（默认 10）根时不再作为当前信号；结果中的 `breakout.barsSinceBreakout` 给出突破距今的根数。

#### 与综合分析的集成
- 作为附加方向评分参与总分，并在 `summaries` 中提供一句话概述；区间边界进入关键位。


