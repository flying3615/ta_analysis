### 市场结构（Market Structure）

识别摆动高低点、BOS、CHOCH、等高/等低与总体趋势。

#### 目录与核心文件
- `src/analysis/structure/structureConfig.ts`、`structureTypes.ts`
- `src/analysis/structure/structureDetector.ts`: 枢轴/摆动/事件检测
- `src/analysis/structure/multiTimeStructure.ts`: 多周期汇总
- `src/analysis/structure/formatStructure.ts`: 输出格式

#### 输入/输出
- 输入：日/小时蜡烛
- 输出：`StructureResult` 与多周期汇总

#### 算法要点
- 通过窗口化 pivot 检测摆动点
- 以 swing 序列识别 BOS/CHOCH，推导趋势 up/down/sideways

#### 配置
`structureConfig` 配置 pivot 窗口、幅度阈值、事件判定阈值等，可通过 `updateStructureConfig` 调整。

#### 与综合分析的集成
- 作为附加方向评分参与总分（单独不计入“分析构成”权重），并在 `summaries` 中给出一句话结论。


