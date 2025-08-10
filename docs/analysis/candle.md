### 蜡烛形态（Candle Patterns）

检测多周期（周/日/小时）的常见 K 线形态并给出方向与入场/止损/止盈建议。

#### 目录与核心文件
- `src/analysis/candle/candleConfig.ts`: 配置（检测窗口、权重、止损比例）
- `src/analysis/candle/candleUtils.ts`: 风险回报与价格计算工具
- `src/analysis/candle/BullOrBearDetector.ts`: 形态检测基础库
- `src/analysis/candle/formatCandleAnalysis.ts`: 中文格式化输出
- `src/analysis/candle/multiTImeFrameCandleAnalysis.ts`: 编排入口

#### 输入/输出
- 输入：`weekly/daily/1hour` 蜡烛
- 输出：多周期形态信号、方向与建议价格区间

#### 算法要点
- 在滚动窗口内调用形态检测器，计算强度与最近形态
- 基于最近形态推导入场/止损/止盈，并计算 RR

#### 配置
使用 `candleConfig`，可通过 `updateCandleConfig` 动态调整窗口/止损/权重。

#### 与综合分析的集成
- 提供方向与关键位（突破/目标），参与总分与关键信号

#### 运行示例
```
node scripts/run-mtf-candle.mjs TSLA
```


