# TA Analysis

`@gabriel3615/ta_analysis` 是一个用 TypeScript 编写的技术分析库，面向股票和加密货币。

它从 Yahoo Finance（股票）或 Binance（加密货币）获取周线、日线、小时线数据，用 10 类分析方法分别给出判断，再把结果合成为一份带入场、止盈、止损和仓位建议的交易计划。库中还包含回测引擎和参数网格搜索。

> 从 3.x 升级到 4.0.0 有不兼容变化，请先阅读 [CHANGELOG.md](CHANGELOG.md)。

## 目录

1. [安装与构建](#安装与构建)
2. [快速开始](#快速开始)
3. [数据来源](#数据来源)
4. [分析工具](#分析工具)
5. [综合分析流程](#综合分析流程)
6. [回测与参数搜索](#回测与参数搜索)
7. [配置](#配置)
8. [输出格式](#输出格式)
9. [命令行脚本](#命令行脚本)
10. [开发](#开发)

## 安装与构建

```bash
npm install @gabriel3615/ta_analysis
```

从源码构建：

```bash
npm ci
npm run build   # 输出到 dist/
npm test        # vitest，离线运行，不访问网络
```

需要 Node.js 18 或更高版本（数据层使用全局 `fetch`）。

## 快速开始

### 综合分析（推荐入口）

```ts
import {
  executeIntegratedAnalysisV2,
  formatTradePlanOutput,
  buildMachineReadableSummary,
} from '@gabriel3615/ta_analysis';

const plan = await executeIntegratedAnalysisV2('TSLA');

console.log(formatTradePlanOutput(plan)); // 中文报告
console.log(buildMachineReadableSummary(plan)); // 单行 JSON
```

加密货币使用 `executeIntegratedCryptoAnalysisV2('BTC-USD')`。多个标的使用 `executeBatchAnalysis(['TSLA', 'NVDA'])`。

### 使用自己的数据（离线分析）

```ts
import { IntegratedOrchestrator } from '@gabriel3615/ta_analysis';

const result = await new IntegratedOrchestrator().executeOfflineAnalysis(
  'MY_SYMBOL',
  dailyCandles, // Candle[]，必需
  weeklyCandles, // Candle[]
  hourlyCandles // Candle[]，可以为 []
);
console.log(result.tradePlan);
```

`Candle` 的结构为 `{ symbol, open, high, low, close, volume, timestamp: Date }`。

## 数据来源

| 标的                                                      | 数据源                            | 说明                                                                         |
| --------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| 股票，例如 `TSLA`                                         | Yahoo Finance（`yahoo-finance2`） | 周线、日线、小时线各请求 1 次                                                |
| 加密货币，例如 `BTC-USD`、`BTCUSD`、`BTCUSDT`、`btc/usdt` | Binance 现货                      | 代码会统一转换为 `BTCUSDT` 的形式；每次请求最多 1000 根 K 线，超出时自动分页 |

数据层的规则：

1. 日线是必需的。日线获取失败时，分析会抛出错误，不会生成交易计划。
2. 周线和小时线是可选的。获取失败时记录警告，并按空数据继续分析。
3. 数据源出错时会抛出带有标的、周期和 HTTP 状态的错误，不会静默返回空数组或部分数据。
4. 同一天内对同一标的和周期的请求会命中缓存。小时线缓存 5 分钟，日线和周线缓存 30 分钟。
5. 周线由日线合成时，按 UTC 日期分周（周一到周日），结果不随运行环境的时区变化。

默认回看长度：周线 365 天，日线 365 天，小时线 60 天。可以通过配置 `timeframes` 修改。

## 分析工具

下表列出了 10 类分析方法。每一类都可以单独调用，也会被综合分析使用。各模块的详细说明见 `docs/analysis/`。

| #   | 分析方法                    | 识别内容                                                                                                                            | 主要输出                                                     | 入口函数                                                                                              | 文档                                               |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | K 线形态                    | 吞没、锤子线、倒锤子线、孕线、十字孕线、早晨/黄昏星、刺透线、光头光脚线、红三兵/三只乌鸦、流星线、上吊线、镊子顶/底、下降跳空并列线 | 多周期看涨/看跌形态，以及入场、止损、目标价                  | `multiTimeCandleAnalysis`                                                                             | [candle.md](docs/analysis/candle.md)               |
| 2   | 图表形态                    | 头肩顶/底、双顶/双底、三角形、楔形、旗形/三角旗、圆弧顶/底、杯柄、买入/卖出高潮                                                     | 形态状态（形成中、已完成、已确认突破、失败）、可靠性、目标价 | `analyzeMultiTimeframePatterns`、`analyzeAllPatterns`                                                 | [patterns.md](docs/analysis/patterns.md)           |
| 3   | 趋势逆转                    | 小周期回调结束、重新顺从大周期趋势的信号                                                                                            | 逆转强度、入场价、止损、3 个量度目标                         | `detectTrendReversal`、`checkStockForReversalSignal`                                                  | [patterns.md](docs/analysis/patterns.md)           |
| 4   | 筹码分布                    | 筹码集中度、获利/套牢比例、筹码峰、多空比                                                                                           | 多周期买入/做空强度、支撑和阻力位                            | `multiTimeFrameChipDistAnalysis`                                                                      | [chip.md](docs/analysis/chip.md)                   |
| 5   | 支撑阻力 + 近期形态（BBSR） | 价格在支撑/阻力附近时出现的看涨/看跌 K 线形态                                                                                       | 日线和周线信号、关键价位、强度                               | `analyzeMultiTimeBBSR`                                                                                | [bbsr.md](docs/analysis/bbsr.md)                   |
| 6   | 市场结构                    | 拐点高低点、趋势（上升/下降/震荡）、BOS、CHOCH、等高/等低                                                                           | 趋势、最近的结构事件、关键位                                 | `runMultiTimeStructure`                                                                               | [structure.md](docs/analysis/structure.md)         |
| 7   | 供需区                      | "盘整 → 冲击"结构形成的需求区和供给区                                                                                               | 区域及状态（新鲜、已测试、已突破）、溢价/折价位置            | `analyzeSupplyDemandZone`、`multiTimeSupplyDemand`                                                    | [supply-demand.md](docs/analysis/supply-demand.md) |
| 8   | 区间与突破                  | 最近的窄幅震荡区间、NR4/NR7、突破方向                                                                                               | 压缩评分、突破质量（放量、延续、回踩）、突破距今根数         | `analyzeRange`                                                                                        | [range.md](docs/analysis/range.md)                 |
| 9   | 趋势线与通道                | 支撑/阻力趋势线、包络通道、通道突破和回踩                                                                                           | 通道上下沿、斜率、宽度、突破方向和质量                       | `analyzeTrendlinesAndChannels`、`multiTimeTrendlines`                                                 | [trendlines.md](docs/analysis/trendlines.md)       |
| 10  | 波动率与量能                | ATR、布林带宽度、历史波动率、A/D 线、OBV、MFI、蔡金摆动指标、量价背离                                                               | 波动率状态（低、中、高、极端）、资金流向、背离               | `calculateVolatilityAnalysis`、`calculateAccumulationDistribution`、`analyzeVolumeVolatilityCombined` | [volatility.md](docs/analysis/volatility.md)       |

各方法的关键规则：

1. **图表形态**：突破需要在形态结束后出现收盘价越过突破位的 K 线，并有后续 K 线确认，才算"已确认突破"。只在最后一根 K 线越过时，状态为"已完成"。
2. **市场结构**：趋势由最近两个拐点高点和两个低点判断。顺势突破最近拐点为 BOS，逆势突破为 CHOCH。小于 `minSwingDistancePercent` 的波动会被过滤。
3. **区间与突破**：只在最近 `lookback` 根 K 线内找区间。突破超过 `maxBreakoutAgeBars`（默认 10）根后，不再算作当前信号。
4. **趋势线与通道**：通道只用最近 `breakoutWindowBars`（默认 5）根之前的 K 线拟合，上下沿都至少被触及 `minChannelTouches`（默认 2）次才算有效。最近的 K 线收盘越过通道边界才算突破。
5. **筹码多空比**：取值 0 到 10，1 表示多空平衡；大于 3 为强势看多，小于 0.5 为强势看空。
6. **波动率**：始终基于日线计算，年化按 √252。`historicalVolatility` 的单位是百分数。
7. **A/D 趋势**：窗口内 A/D 变化量除以窗口总成交量，超过 ±0.1 才算有方向。成交量放大才算对价格趋势的确认。

## 综合分析流程

`IntegratedOrchestrator` 把 10 类分析组合成一份交易计划：

```
获取数据（周线 / 日线 / 小时线）
  → 并行运行各分析模块（单个模块失败时使用降级结果）
  → 信号聚合：8 个模块加权打分，得出方向、强度、置信度
  → 关键位合并：汇总各模块的支撑和阻力，合并相近价位
  → 策略生成：入场、止盈、止损、仓位、风险回报比
  → 交易计划（IntegratedTradePlan）
```

### 信号聚合

参与打分的 8 个模块及默认权重：

| 模块               | 默认权重 | 归一化后 |
| ------------------ | -------- | -------- |
| 形态（含趋势逆转） | 0.5      | 33%      |
| 量能               | 0.2      | 13%      |
| 区间               | 0.2      | 13%      |
| 结构               | 0.2      | 13%      |
| 筹码               | 0.1      | 7%       |
| BBSR               | 0.1      | 7%       |
| 供需               | 0.1      | 7%       |
| 趋势线             | 0.1      | 7%       |

打分规则：

1. 每个模块给出方向和 0 到 100 的置信度，乘以归一化权重后相加，得到 −100 到 100 的综合分。
2. 综合分高于 `scoreLong`（默认 15）为做多，低于 `scoreShort`（默认 −15）为做空，否则为观望。
3. 按默认权重，除形态模块外，任何单个模块都无法独自越过方向阈值。
4. 信号强度分为强、中、弱、中性。只要越过方向阈值，强度至少为"弱"；方向为观望时，强度一定为"中性"。
5. 置信度由综合分、信号强度和波动率共同决定。
6. 交易计划中的 `*AnalysisContribution` 是各模块自身的得分：正数看多，负数看空，0 为中性。
7. 自定义插件可以通过 `SignalAggregator.registerPlugin` 加入打分。插件出错时，错误会记录在 `pluginErrors` 中。

### 策略生成

1. **入场**：根据支撑/阻力和形态，给出理想入场价、入场区间和确认条件。
2. **止盈**：取入场价上方（做空时为下方）的阻力位和形态目标价，最多 3 档，分别分配仓位比例。
3. **止损**：主止损位于最近支撑位下方 1%（做空时位于最近阻力位上方 1%），其余止损按离入场价从近到远排列。离入场价不到 0.5% 的止损会被丢弃。
4. **仓位**：按信号强度确定基础仓位（强 20%、中 15%、弱 10%、中性 5%），再按波动率、置信度和入场风险调整，最终限制在 5% 到 30%。仓位不超过 10% 时，建议最大亏损为账户的 1%，否则为 2%。
5. **风险回报比**：按主止损计算风险，按各止盈档的加权平均计算收益。

## 回测与参数搜索

### Backtester

```ts
import {
  Backtester,
  TrendlineBreakoutStrategy,
} from '@gabriel3615/ta_analysis';

const result = await new Backtester({
  initialCapital: 100000,
  positionSizing: 0.2,
  commissionPerTrade: 1,
  slippageBps: 5,
  exitParams: {
    stopLossPercent: 5,
    takeProfitPercent: 10,
    trailingStopPercent: 7,
  },
}).run(dailyCandles, TrendlineBreakoutStrategy('TSLA', 'daily'));

console.log(result.metrics); // 胜率、平均盈亏、最大回撤、夏普比率、交易次数
```

回测规则：

1. 策略在第 i 根 K 线只能看到 `candles[0..i]`，信号在第 i+1 根的开盘价成交，不存在前视。
2. 持仓按未实现盈亏计入权益。
3. 支持固定百分比止盈止损、移动止损，以及策略信号自带的 `stop` 和 `targets`。
4. 手续费和滑点在开仓、平仓两端都计算。
5. 夏普比率按 K 线频率年化：周线 52；日线 252（数据含周末 K 线时为 365）；日内按"每天 K 线数 × 交易日数"。也可以用 `periodsPerYear` 指定。

### 内置策略

| 策略                         | 信号来源                                   |
| ---------------------------- | ------------------------------------------ |
| `TrendlineBreakoutStrategy`  | 通道位置、动量、趋势线突破回踩             |
| `RangeBreakoutStrategy`      | 区间突破质量                               |
| `StructureBreakoutStrategy`  | 市场结构 BOS / CHOCH（同一事件只触发一次） |
| `SupplyDemandRetestStrategy` | 回踩已测试的供需区（同一区域只触发一次）   |
| `PatternConsensusStrategy`   | 多周期图表形态共识                         |
| `IntegrationSignalStrategy`  | 综合分析的交易计划方向（计算量较大）       |

前 3 个可以从包入口直接导入。其余策略位于 `dist/analysis/backtest/strategies/`。策略参数的默认值集中在 `backtestStrategiesConfig`。

### 唐奇安 System 2 离线回测

`DonchianStrategy` 复现了 stock-scanner-tauri 中唐奇安 System 2 的规则，用于离线回测：

| 规则                        | 说明                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| 入场通道                    | 被评估K线之前 55 根的最高价 / 最低价（不含当前K线）                                               |
| 出场                        | 收盘价严格越过之前 20 根的最低价（做多）/ 最高价（做空）                                          |
| 突破                        | 收盘价严格高于 55 日高点（做多）/ 低于 55 日低点（做空）                                          |
| 过热                        | 收盘价离出场线超过 15% 时不算突破                                                                 |
| ATR                         | 最近 56 根K线的 14 日 Wilder ATR                                                                  |
| 入场计划（`donchian-plan`） | 回撤到信号线 + 0.25 ATR 以内，之后另一天收盘重新站回信号线；信号后第 15 根K线到期；反向突破时作废 |
| 风险单位                    | 2 × ATR，只用于把盈亏换算成 R 倍数，不作为止损执行                                                |

无法离线复现的部分：流动性、市值、风险筛选和新闻催化剂检查。回测中计划的创建规则（Rust app 由人工创建）写在 `src/analysis/backtest/strategies/DonchianStrategy.ts` 的文件注释中。

**第 1 步：在 Mac 上导出数据**（以只读方式打开 stock-scanner 的数据库）：

```bash
DB="$HOME/Library/Application Support/com.flying3615.stock-scanner/stock-scanner.sqlite"
ls -l "$DB"   # 路径不对时会在这里报错

# 先看数据量：股票数、日期范围、行数
sqlite3 -readonly "$DB" \
  "SELECT COUNT(DISTINCT symbol), MIN(trading_date), MAX(trading_date), COUNT(*) FROM daily_bars;"

# 导出
sqlite3 -readonly -header -csv "$DB" \
  "SELECT symbol, trading_date, source, open, high, low, close, volume, adjusted_close, is_complete, missing_reason
   FROM daily_bars ORDER BY symbol, trading_date;" > bars.csv
```

**第 2 步：运行回测**（完全离线）：

```bash
npm run build
npm run backtest -- --data bars.csv --long-only --split-date 2023-01-01 --out trades.csv
npm run backtest -- --data bars.csv --strategy donchian-plan --long-only --split-date 2023-01-01
```

| 选项                                      | 作用                                           |
| ----------------------------------------- | ---------------------------------------------- |
| `--strategy donchian\|donchian-plan`      | 突破入场，或突破 + 入场计划（默认 `donchian`） |
| `--long-only`                             | 只做多                                         |
| `--commission <n>` / `--slippage-bps <n>` | 每次开仓/平仓的手续费；滑点（基点，默认 5）    |
| `--risk-atr <n>`                          | 风险单位的 ATR 倍数（默认 2）                  |
| `--split-date YYYY-MM-DD`                 | 按入场日期分别报告样本内和样本外               |
| `--adjust`                                | 按 `adjusted_close / close` 缩放价格           |
| `--symbols A,B`                           | 只回测这些股票                                 |
| `--out trades.csv`                        | 导出每笔交易                                   |

数据处理规则：

1. 同一天有多个数据源时优先使用 Yahoo，并跳过不完整的行。
2. 单日涨跌超过 30% 的K线会在报告中列出。stock-scanner 重新拉取数据时只覆盖同一天的行，所以拆股前拉取的旧价格可能与拆股后的新价格混在一起，形成假的大跳空。这种情况 `--adjust` 无法修正：请在 stock-scanner 中重新拉取该股票的完整历史，或用 `--symbols` 排除它。
3. 相邻K线相隔超过 7 天的数据缺口也会列出。跨缺口计算的通道和 ATR 不可靠；入场计划的到期按K线数计算，缺口也会让它偏移。
4. `--adjust` 按 `adjusted_close / close` 缩放价格（含分红调整）。不加这个选项时，价格与 stock-scanner 评估唐奇安信号时使用的价格一致。

报告按 R 统计：交易数、胜率、平均 R（期望值）、R 中位数、累计 R、盈亏比、最长连亏、累计 R 曲线的最大回撤（按出场日期累计，没有考虑同时持仓，是近似值），以及各股票的明细。

#### 过滤器对比

4 个过滤器在看到任何数据之前确定，都在突破当天评估，只使用当天及之前的数据：

| 名称         | 过滤器       | 做多时通过的条件（做空对称）                                                                                                     |
| ------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `volume`     | 放量突破     | 突破当天成交量 ≥ 前 20 日平均成交量的 1.5 倍                                                                                     |
| `structure`  | 结构趋势一致 | 市场结构模块判断的趋势为"上升"                                                                                                   |
| `zone`       | 上方无供给区 | 收盘价往上 2 × ATR 范围内没有未被突破的供给区，收盘价也不在供给区内部                                                            |
| `volatility` | 波动率不极端 | 波动率模块的状态不是"极端"（阈值按绝对 ATR% 设定；在 517 只美股 10 年的数据上，8003 次突破中只有 10 次被判为极端，几乎不起作用） |

数据不足或分析失败时，过滤器给出"无法判断"，回测中按通过处理，并在报告中计数。入场计划模式也在突破当天（创建计划时）评估过滤器，而不是在确认日。

```bash
# 对比 4 个过滤器（主要看"拆分基准交易"的样本外结果）
npm run backtest -- --data bars.csv --long-only --compare --split-date 2023-01-01
npm run backtest -- --data bars.csv --long-only --compare --split-date 2023-01-01 --strategy donchian-plan

# 使用某个过滤器组合跑完整报告
npm run backtest -- --data bars.csv --long-only --filter structure,zone
```

`--compare` 的主要对比是**拆分基准交易**：对基准的每笔交易，在突破日判断过滤器是否通过，比较通过组和不通过组的平均 R，并给出 Welch t 值。报告也附上"实际过滤后运行"的结果，但那不是基准交易的子集：过滤器拒绝一次突破后，策略可能做一笔基准当时因持仓而错过的交易，所以只作参考。

**判断标准（在看到数据之前确定）**：一个过滤器值得移植到 stock-scanner 的 Rust 代码，需要同时满足：

1. 样本外：差值 > 0，且 t > 2；
2. 样本内：差值也 > 0；
3. 全部交易中的保留比例 ≥ 30%。

4 个过滤器 × 2 种模式 × 2 段样本里，凭运气出现一个"好看"的结果并不罕见，所以只满足其中一项不算数。

#### 随机入场对照

在研究过滤器之前，先要确认唐奇安突破本身有没有优势：股票池如果整体在上涨（再加上幸存者偏差），随便什么时候买入都可能赚钱。

```bash
npm run backtest -- --data bars-all.csv --long-only --null-model 20 --split-date 2023-01-01
npm run backtest -- --data bars-all.csv --long-only --null-model 20 --split-date 2023-01-01 --strategy donchian-plan
```

- 随机入场策略在空仓时，每根K线以固定概率随机做多；概率会校准到让随机交易数接近基准交易数。
- 出场规则（20 日出场线）和风险单位（2 × ATR）与唐奇安完全相同，只有入场不同。
- 随机数由种子和股票代码决定，结果可以复现。
- 报告给出基准平均 R 在随机结果中的位置（随机均值、标准差、范围、随机 ≥ 基准的个数、z 值），按全部、样本内、样本外和每个入场年份分别统计。
- 每个种子都要完整回测一次。517 只股票、10 年数据时，20 个种子大约需要几分钟；进度输出到 stderr。

**判断标准（在看到数据之前确定）**：样本内和样本外都满足"随机 ≥ 基准的比例 ≤ 5%"（20 个种子时最多 1 个），才说明突破本身有优势；否则基准的收益主要来自股票池上涨和幸存者偏差，研究过滤器的意义不大。

在代码中使用：

```ts
import {
  runPortfolioBacktest,
  DonchianStrategy,
} from '@gabriel3615/ta_analysis';

const result = await runPortfolioBacktest(
  dataBySymbol, // Record<string, Candle[]>
  () =>
    DonchianStrategy({
      mode: 'entryPlan',
      longOnly: true,
      filter: (history, i, direction) => true, // 过滤器：返回 false 时跳过这次突破
    }),
  { warmupBars: 56, allowShort: false, splitDate: new Date('2023-01-01') }
);
console.log(result.overall, result.outOfSample);
```

### 网格搜索

```ts
import { runGridSearch, RangeBreakoutStrategy } from '@gabriel3615/ta_analysis';

const out = await runGridSearch(
  dailyCandles,
  { minQuality: [50, 60, 70] },
  params => RangeBreakoutStrategy('TSLA', 'daily', params),
  undefined,
  { testRatio: 0.3 } // 前 70% 调参，后 30% 做样本外验证
);

console.log(out.summary.bestBySharpe); // 样本内最优
console.log(out.summary.outOfSample?.bySharpe); // 同一组参数在样本外的结果
```

`bestByMaxDrawdown` 只在有交易的参数组合中选择。

## 配置

各模块都提供配置对象和更新函数，例如：

| 模块     | 配置对象                     | 更新函数                            |
| -------- | ---------------------------- | ----------------------------------- |
| 综合分析 | `DEFAULT_INTEGRATION_CONFIG` | `updateIntegrationConfig`（深合并） |
| K 线形态 | `candleConfig`               | `updateCandleConfig`                |
| 图表形态 | `patternConfig`              | `updatePatternConfig`               |
| 趋势逆转 | `trendReversalConfig`        | `updateTrendReversalConfig`         |
| 筹码     | `chipConfig`                 | `updateChipConfig`                  |
| BBSR     | `srConfig`                   | `updateSrConfig`                    |
| 市场结构 | `structureConfig`            | `updateStructureConfig`             |
| 供需区   | `sdConfig`                   | `updateSdConfig`                    |
| 区间     | `rangeConfig`                | `updateRangeConfig`                 |
| 趋势线   | `trendlineConfig`            | `updateTrendlineConfig`             |
| 波动率   | `volatilityConfig`           | `updateVolatilityConfig`            |
| 回测策略 | `backtestStrategiesConfig`   | `updateBacktestStrategiesConfig`    |

综合分析的配置也可以在每次调用时传入，只会影响这一次调用，并与默认配置深合并：

```ts
await executeIntegratedAnalysisV2('TSLA', {
  weights: { structure: 0.1 }, // 其他权重保持默认
  thresholds: { scoreLong: 20, scoreShort: -20 },
});
```

注意：除综合分析配置外，其他模块的配置对象是进程内共享的单例，修改后对之后的所有调用生效。

环境变量：

| 变量                | 作用                                          |
| ------------------- | --------------------------------------------- |
| `TA_LOG_LEVEL`      | 日志级别：`silent`、`normal`、`verbose`       |
| `CHART_IMG_API_KEY` | `fetchChartData` 使用的 chart-img.com API key |

## 输出格式

1. `formatTradePlanOutput(plan)`：中文报告，包括综合信号、各模块要点、入场、出场、风险管理、关键价位、多周期分析、波动率与量能、交易理由、失效条件、警告和分析构成。
2. `buildMachineReadableSummary(plan)`：单行 JSON，包括方向、置信度、入场价、所用止损、加权止盈、风险、风险回报比、各模块得分和摘要，适合程序读取。
3. 各单项分析也提供 `formatAndPrint*` 函数，输出该模块的中文报告。

## 命令行脚本

构建后，可以直接运行 `dist/scripts/` 下的脚本。股票代码作为第一个参数传入：

```bash
node dist/scripts/run-mtf-integrated.js TSLA     # 综合分析
node dist/scripts/run-mtf-all.js TSLA            # 依次运行各单项分析
node dist/scripts/run-mtf-chip.js TSLA           # 筹码
node dist/scripts/run-mtf-candle.js TSLA         # K 线形态
node dist/scripts/run-mtf-bbsr.js TSLA           # BBSR
node dist/scripts/run-mtf-structure.js TSLA      # 市场结构
node dist/scripts/run-mtf-supply-demand.js TSLA  # 供需区
node dist/scripts/run-mtf-range.js TSLA          # 区间与突破
node dist/scripts/run-mtf-trendlines.js TSLA     # 趋势线与通道
node dist/scripts/run-mtf-volatility.js TSLA     # 波动率与量能
node dist/scripts/run-mtf-trendreversal.js TSLA  # 趋势逆转

SYMBOL=BTC-USD npm run run:crypto                # 加密货币综合分析
SYMBOL=BTCUSDT npm run run:binance               # Binance 现货数据
```

这些脚本会请求实盘数据。Yahoo 可能对频繁请求限流（返回 `Too Many Requests`），这时脚本会报错退出。

## 开发

```bash
npm test          # 单元测试（离线）
npm run lint      # ESLint
npm run build     # TypeScript 编译（strict 模式）
```

- 代码在 TypeScript `strict` 模式下编译。
- 测试使用合成数据和 mock，不访问网络。
- 发布由推送 `v*` 标签触发，CI 会先运行构建、测试和 lint，再发布到 npm。

许可证：MIT
