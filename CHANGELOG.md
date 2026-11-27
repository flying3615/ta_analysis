# 更新日志

## 未发布

### 新增

1. `DonchianStrategy`：唐奇安 System 2 策略，规则与 stock-scanner-tauri 一致，支持突破和入场计划两种模式，以及过滤器钩子。
2. `runPortfolioBacktest` 和 `computeRMetrics`：多股票回测与按 R 统计的指标，支持按日期切分样本内/样本外。
3. `npm run backtest`：读取 stock-scanner 的 `daily_bars` 导出文件，离线运行回测并输出报告。
4. 回测器：策略可以拿到当前持仓（`generateSignal` 的第 3 个可选参数）；交易记录入场/出场日期、持有根数、净盈亏和 R 倍数；信号可以带 `riskPerShare`；新增 `warmupBars` 配置。

## 4.0.0

这个版本修复了回测、信号聚合、各分析模块和数据层中的大量正确性问题。许多输出数值会因此变化，部分公开接口也有不兼容变化，所以升级为主版本。

### 不兼容变化

升级前请逐条检查。

#### 数据层

1. `getStockData`、`getStockDataForTimeframe` 和 `BinanceProvider.getKlines` 出错时会抛出异常，不再返回空数组或部分数据。
2. `getStockData` 的 `interval` 参数类型从 `string` 改为 `ChartInterval`（新增导出）。
3. `DataProvider` 要求日线获取成功，否则抛错。周线和小时线失败时记录警告并返回 `[]`。
4. 加密货币代码（`BTC-USD`、`BTCUSD`、`BTCUSDT`、`btc/usdt` 等）统一走 Binance，包括 `getMultiTimeframeCryptoData`（原来使用 Yahoo）。
5. 依赖中移除了 `lodash` 和 `uuid`；`eslint` 等开发工具移到 `devDependencies`。
6. npm 包只包含 `dist/`，不再包含 `src/`、测试和 K 线形态图片。

#### 综合分析

1. 8 个模块的权重一起归一化，综合分范围从约 ±170 变为 ±100。公开的 `normalizeWeights` 使用同样的规则。
2. 结构模块的默认权重从 0.3 改为 0.2。
3. `updateIntegrationConfig`、`updateConfig` 和每次调用传入的配置改为深合并；每次调用传入的配置会真正参与打分。
4. 交易计划中的 `*AnalysisWeight` 改为归一化后的实际权重。新增 `trendlineAnalysisWeight`，以及结构、供需、区间、趋势线 4 个模块的 `*AnalysisContribution`。
5. `contributions.*` 和 `*AnalysisContribution` 带上方向符号，取值从 0 到 100 改为 −100 到 100（正数看多，负数看空）。JSON 摘要中的 `votes` 同样变化。
6. 综合分越过方向阈值时，信号强度至少为"弱"；方向为观望时，强度一定为"中性"。
7. 风险回报比和 JSON 摘要中的 `stopLossUsed` 改用主止损计算（新增导出 `selectRiskStop`）。
8. 离入场价不到 0.5% 的止损会被丢弃，其余止损按离入场价从近到远排列。
9. 波动率模块始终使用日线数据；`historicalVolatility` 的单位改为百分数。
10. `SignalAggregationResult` 新增 `pluginErrors`；权重为 0 的插件不再执行。
11. `TradeCondition.type` 新增 `'chip'` 和 `'volatility'`。

#### 分析模块

1. `calculateBullBearRatio` 返回原始多空比（0 到 10，1 为平衡），不再经过 `5r/(1+4r)` 映射。
2. `isValidBreakout` 的第二个参数改为"从哪根 K 线开始寻找突破"，形态状态现在可以达到"已确认突破"。
3. 市场结构的趋势和 BOS/CHOCH 改为基于拐点高低点判断，能输出上升/下降趋势和 CHOCH 事件。
4. `BreakoutAssessment` 新增必填字段 `barsSinceBreakout`；区间配置新增 `maxBreakoutAgeBars`，`lookback` 开始生效。
5. 趋势线通道的拟合、包络和突破判断都改变了；新增配置 `breakoutWindowBars`、`minChannelTouches`，通道新增 `upperAtLast`、`lowerAtLast`。
6. `checkBullBearNearSupportResistance` 的返回类型改为 `SRSignal | undefined`，空数据时返回 `undefined`。
7. `calculateATR` 改用 Wilder 平滑，与 `calculateATRSeries` 一致。
8. 价格不变时，RSI 和 MFI 返回 50。
9. 下降跳空并列线从看涨列表移到看跌列表。
10. 趋势逆转新增配置 `trendDirection.minRelativeSlope`；结果总是包含 `allSignals`。
11. `AnalyzeMultiTimeframePatterns` 新增 `dataLength`。

#### 回测

1. 回测指标（权益、最大回撤、夏普比率、总盈亏）的计算方式已修正，数值会变化。
2. `BacktestConfig` 新增 `periodsPerYear`；不设置时按 K 线频率推断（新增导出 `inferPeriodsPerYear`）。
3. `runGridSearch` 新增第 5 个参数 `{ testRatio }`；没有任何交易时 `bestByMaxDrawdown` 可能为 `null`。
4. 结构和供需策略对同一事件只触发一次；`requireAllAligned` 只比较有数据的周期。
5. AverageDown 模拟器的 `finalAvgCost` 改为摊薄成本；RollingUp 的收益率分母包含预留现金。

### 主要修复

#### 回测

- 持仓本金被重复计入权益，导致零盈亏交易也产生约 16.7% 的回撤。
- 最后一轮平仓没有计入总盈亏；交易的入场下标记录错误。
- 策略信号自带的止损和目标价被忽略。
- 移动止损在同一根 K 线内先更新峰值再判断，上涨的 K 线也会触发止损。
- 网格搜索在同一份数据上调参和评估，没有样本外验证。

#### 综合分析

- 小时线为空时生成入场价为 0 的交易计划。
- BBSR 模块收到的"周线"实际是小时线。
- 部分配置更新导致权重变成 `undefined`，置信度变成 `NaN`。
- 关键位管理器读取不存在的字段，结构和趋势线不产生关键位。
- 插件异常被吞掉，与中性信号无法区分。

#### 分析模块

- 三角形、头肩、双顶/双底永远无法进入"已确认突破"状态；`isPatternFailed` 符号错误。
- 11–27 根低波动 K 线时形态分析崩溃；最新 K 线上的三根 K 线形态检测不到。
- 筹码多空比上限约 1.25，看多阈值无法触发；波动率调整后的仓位被覆盖。
- 市场结构永远判为震荡，CHOCH 无法触发。
- 供需区"最近区域"取的是数组末尾；BBSR 依赖系统时间，历史数据和回测中永远为空。
- 区间突破和趋势线突破不检查时效；随机游走上约 35% 的窗口被误报为趋势线突破（修复后约 3%）。
- 楔形收敛点、旗形旗杆、三角旗方向、买卖高潮的重要性量级、周期匹配系数等多处计算错误。
- A/D 趋势受历史长度影响；量价确认逻辑反了；背离比较的拐点没有对齐。

#### 数据层与安全

- 缓存键包含毫秒时间戳，缓存永远不命中。
- 周线聚合受运行环境时区影响。
- 图表接口出错时把包含 API key 的请求头写进日志。

#### 工程

- 开启 TypeScript `strict` 模式。
- CI 在发布前运行测试和 lint。
- 运行时依赖的已知漏洞已修复（`npm audit --omit=dev` 为 0）。
- 测试从 4 个增加到 163 个，全部离线运行。
