### 趋势线 / 通道 与 回踩（Trendlines & Channels with Retest）

自动拟合支撑/阻力趋势线，构造平行通道，检测“突破+回踩确认”，输出通道斜率/宽度与入场提示。

#### 目录与核心文件
- `src/analysis/trendline/trendlineConfig.ts`：参数配置与 `updateTrendlineConfig`
- `src/analysis/trendline/trendlineTypes.ts`：类型定义
- `src/analysis/trendline/trendlineDetector.ts`：最小二乘拟合、通道构造、突破+回踩检测
- `src/analysis/trendline/multiTimeTrendlines.ts`：多周期编排
- `src/analysis/trendline/formatTrendline.ts`：格式化输出

#### 输入/输出
- 输入：日/小时蜡烛
- 输出：`TrendlineChannelAnalysisResult`（支撑/阻力拟合、通道、突破回踩、摘要）

#### 算法要点（MVP）
- 以低点/高点序列做最小二乘直线，统计容差内触达数
- 从支撑线平移构造上边界与中轴，得到通道宽度与斜率
- 在最近 N 根内检测突破阈值与回踩触达
- 质量分基于：斜率显著性、通道宽度是否合理、回踩是否发生

#### 配置
`trendlineConfig` 提供触点数、容差、斜率阈值、回踩窗口与权重等，可通过 `updateTrendlineConfig` 动态调整。

#### 与综合分析的集成
- 若发生“突破+回踩确认”，按方向与质量计入总分；通道边界加入动态关键位；入场条件与确认信号添加“回踩”提示。

#### 运行示例
```
node scripts/run-mtf-trendlines.mjs TSLA
```


