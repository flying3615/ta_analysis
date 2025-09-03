/**
 * 策略: IntegrationSignal 综合分析离线信号
 * 来源: analysis/integration/IntegratedOrchestrator.executeOfflineAnalysis
 * 核心流程:
 * - 每一步以可用日线切片聚合成周线（小时线留空），调用编排器的离线分析；
 * - 编排器内部并行执行筹码/形态/BBSR/结构/供需/区间/趋势线/波动量能等模块，聚合方向与计划；
 * - 以 tradePlan 的方向(Long/Short/Neutral) 生成回测信号。
 *
 * 入场:
 * - tradePlan.direction 为 Long -> 做多；为 Short -> 做空；否则观望
 * - 可使用 tradePlan 的出场位(止损/止盈)作为提示，但实际出场由 Backtester 控制
 *
 * 计算成本:
 * - 每步触发一次综合分析，成本较高；适合低频或配合缓存/抽稀调用
 *
 * 出场与风控: Backtester 统一管理（止损/止盈/追踪止损、滑点与手续费）。
 * 前视说明: 仅使用 history[0..i] 的切片作为输入进行离线分析，避免前视。
 */
import type { Candle } from '../../../types.js';
import type { Strategy, Signal } from '../Backtester.js';
import { IntegratedOrchestrator } from '../../integration/IntegratedOrchestrator.js';
import type { IntegrationConfig } from '../../integration/IntegrationConfig.js';
import { analyzeRange } from '../../analyzer/range/rangeDetector.js';
import { analyzeMarketStructure } from '../../analyzer/structure/structureDetector.js';
import { backtestStrategiesConfig } from '../strategyConfig.js';
import { aggregateDailyToWeekly } from '../../../util/util.js';
import { TradeDirection } from '../../../types.js';

/**
 * Strategy that queries the IntegratedOrchestrator on each step using the available history.
 * This version is corrected to use an offline analysis method to prevent lookahead bias.
 */
export function IntegrationSignalStrategy(
  symbol: string,
  timeframe: 'daily', // This strategy is designed to work with daily data slices
  config?: IntegrationConfig
): Strategy {
  // Instantiate the orchestrator once to be reused
  const orchestrator = new IntegratedOrchestrator(config);

  return {
    name: `IntegrationSignalStrategy_${timeframe}`,

    async generateSignal(history: Candle[], i: number): Promise<Signal | null> {
      // We need a sufficient amount of data to perform meaningful analysis
      if (history.length < 60) {
        return null; // Not enough data yet
      }

      // The history slice represents the daily data available at step `i`
      const dailyData = history;

      // Aggregate daily data to weekly data for multi-timeframe analysis
      const weeklyData = aggregateDailyToWeekly(dailyData);

      // Hourly data cannot be derived from daily data, so we pass an empty array.
      // The orchestrator's fallback mechanism will handle missing hourly analysis.
      const hourlyData: Candle[] = [];

      try {
        // Execute the offline analysis to avoid lookahead bias
        const result = await orchestrator.executeOfflineAnalysis(
          symbol,
          dailyData,
          weeklyData,
          hourlyData,
          config
        );

        const direction = result.tradePlan.direction;
        const currentPrice = dailyData[dailyData.length - 1].close;

        // 额外过滤：要求 Range/Structure 同向确认（可配置）
        const filterCfg = backtestStrategiesConfig.integrationFilter;
        // 冷静期：限制最近 N 根内的重复信号（以生成信号的索引记忆，集成在闭包）
        // 由于本策略无 lastSignalIndex 状态，改为用最近N根内共现判断即可。
        if (filterCfg.requireRangeConfirm || filterCfg.requireStructureConfirm) {
          const recentWindow = dailyData.slice(-Math.max(200, filterCfg.confirmWithinBars + 50));
          let rangeOk = true;
          let structureOk = true;

          if (filterCfg.requireRangeConfirm) {
            const rg = analyzeRange(symbol, recentWindow, 'daily');
            if (rg.breakout) {
              const wantUp = direction === 'long';
              const breakoutUp = rg.breakout.direction === 'up';
              const dirMatch = (wantUp && breakoutUp) || (!wantUp && !breakoutUp);
              const within = recentWindow.length - 1 - rg.breakout.breakoutIndex <= filterCfg.confirmWithinBars;
              rangeOk = dirMatch && within && (rg.breakout.qualityScore ?? 0) >= filterCfg.rangeMinQuality;
            } else {
              rangeOk = false;
            }
          }

          if (filterCfg.requireStructureConfirm) {
            const st = analyzeMarketStructure(recentWindow, 'daily');
            if (
              st.lastEvent &&
              (st.lastEvent.direction === 'bullish' || st.lastEvent.direction === 'bearish') &&
              (filterCfg.structureEventType === 'any' || st.lastEvent.type === filterCfg.structureEventType)
            ) {
              const wantUp = direction === 'long';
              const evtUp = st.lastEvent.direction === 'bullish';
              const evtMatch = (wantUp && evtUp) || (!wantUp && !evtUp);
              const within = recentWindow.length - 1 - st.lastEvent.index <= filterCfg.confirmWithinBars;
              structureOk = evtMatch && within;
            } else {
              structureOk = false;
            }
          }

          if (!(rangeOk && structureOk)) {
            return null; // 不满足确认条件则不发信号
          }
        }

        // Create a signal based on the trade plan's direction
        const signal: Signal = {
          timestamp: new Date(history[i].timestamp),
          direction: 'flat', // Default to flat
          reason: result.tradePlan.summary,
          entry: currentPrice,
          stop: result.tradePlan.exitStrategy.stopLossLevels[0]?.price,
          targets: result.tradePlan.exitStrategy.takeProfitLevels.map(
            l => l.price
          ),
        };

        if (direction === TradeDirection.Long) {
          signal.direction = 'long';
        } else if (direction === TradeDirection.Short) {
          signal.direction = 'short';
        } else {
          signal.direction = 'flat';
        }

        return signal;
      } catch (error) {
        console.error(
          `Error in IntegrationSignalStrategy at step ${i}:`,
          error
        );
        return null; // Return no signal on error
      }
    },
  };
}
