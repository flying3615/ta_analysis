### 支撑/阻力 + 关键位形态（BBSR）

识别关键支撑/阻力与其附近的多空形态信号（如锤子、吞没等），用于确认或否定交易方向。

#### 目录与核心文件
- `src/analysis/sr/srConfig.ts`、`srTypes.ts`: 配置与类型
- `src/analysis/sr/BullBearOnSupportResistAnalysis.ts`: 关键位附近信号检测
- `src/analysis/sr/multiTimeFrameBBSRAnalysis.ts`: 多周期编排
- `src/analysis/sr/formatSrAnalysis.ts`: 输出格式化

#### 输入/输出
- 输入：日/小时蜡烛
- 输出：`MultiTimeFrameBBSRAnalysisResult`（日/周线关键位与信号）

#### 算法要点
- 枢轴点检测、是否接近关键位阈值判定
- 在接近关键位处检测多空形态并赋分

#### 配置
通过 `srConfig` 与 `updateSrConfig` 调整 pivot、阈值与窗口。

#### 与综合分析的集成
- 提供关键位说明，参与总分；其日/周线信号也进入“支阻位的牛熊信号分析”。

#### 运行示例
```
node scripts/run-mtf-bbsr.mjs TSLA
```


