/**
 * 策略: SupplyDemandRetest 供需区回踩
 * 来源: analyzer/supplyDemand/sdDetector.analyzeSupplyDemandZone
 * 核心流程:
 * - 识别近期的供需区（基底+推进判定），并维护 fresh/tested/broken 状态；
 * - 按参数过滤区间宽度、是否必须 tested，是否允许 fresh 首触；
 * - 当价格回到供需区间内(回踩)时触发信号：需求区做多，供给区做空。
 *
 * 入场:
 * - demand 区: 当前价位于 [low, high] 内 -> 做多
 * - supply 区: 当前价位于 [low, high] 内 -> 做空
 *
 * 出场与风控: Backtester 统一控制（固定止损/止盈、追踪止损、滑点/手续费）。
 * 前视说明: 使用 history[0..i] 判定，实际成交在 i+1 开盘。
 *
 * 关键参数:
 * - requireTested: 仅在 tested 时入场
 * - allowFreshEntry: 是否允许 fresh 首触入场
 * - minZoneWidthPercent: 过滤窄区间（避免噪声）
 * - coolDownBars: 冷静期
 */
import type { Candle } from '../../../types.js';
import { backtestStrategiesConfig } from '../strategyConfig.js';
import { analyzeSupplyDemandZone } from '../../analyzer/supplyDemand/sdDetector.js';
import type { Strategy, Signal } from '../Backtester.js';

export interface SupplyDemandParams {
  minZoneWidthPercent?: number; // 最小区间宽度百分比过滤
  allowFreshEntry?: boolean; // 允许首次触达(fresh)立刻参与
  requireTested?: boolean; // 仅在tested回踩时触发
  coolDownBars?: number; // 冷静期，防止重复进出
}

export function SupplyDemandRetestStrategy(
  symbol: string,
  timeframe: 'weekly' | 'daily' | '1hour',
  params: SupplyDemandParams = {}
): Strategy {
  const {
    minZoneWidthPercent = backtestStrategiesConfig.supplyDemandRetest.minZoneWidthPercent,
    allowFreshEntry = backtestStrategiesConfig.supplyDemandRetest.allowFreshEntry,
    requireTested = backtestStrategiesConfig.supplyDemandRetest.requireTested,
    coolDownBars = backtestStrategiesConfig.supplyDemandRetest.coolDownBars,
  } = params;

  let lastSignalIndex = -1;
  let lastDirection: 'long' | 'short' | 'flat' | undefined = undefined;

  return {
    name: 'SupplyDemandRetest',
    generateSignal(history: Candle[], i: number): Signal | null {
      if (i < 60) return null;
      if (i - lastSignalIndex < coolDownBars) return null;

      const window = history.slice(Math.max(0, i - 300), i + 1);
      const res = analyzeSupplyDemandZone(symbol, window, timeframe);

      const current = window[window.length - 1].close;
      const candidate = res.recentEffectiveZones
        .filter(z => (z.high - z.low) / Math.max(1e-8, z.low) >= minZoneWidthPercent)
        .slice(-1)[0];

      if (!candidate) return null;

      // 状态过滤
      if (requireTested && candidate.status !== 'tested') return null;
      if (!allowFreshEntry && candidate.status === 'fresh') return null;

      // 在供需区内触发回踩
      const isInside = current >= candidate.low && current <= candidate.high;
      if (!isInside) return null;

      let signal: Signal | null = null;
      if (candidate.type === 'demand') {
        signal = {
          timestamp: history[i].timestamp,
          direction: 'long',
          strength: candidate.status === 'tested' ? 80 : 65,
          reason: `${timeframe} 需求区回踩 (${candidate.low.toFixed(2)} - ${candidate.high.toFixed(2)}) 触发`,
        };
      } else if (candidate.type === 'supply') {
        signal = {
          timestamp: history[i].timestamp,
          direction: 'short',
          strength: candidate.status === 'tested' ? 80 : 65,
          reason: `${timeframe} 供给区回踩 (${candidate.low.toFixed(2)} - ${candidate.high.toFixed(2)}) 触发`,
        };
      }

      // 避免短时间内方向反转噪声
      if (
        signal &&
        lastDirection &&
        signal.direction !== lastDirection &&
        i - lastSignalIndex < coolDownBars * 2 &&
        (signal.strength ?? 0) < 80
      ) {
        return null;
      }

      if (signal) {
        lastSignalIndex = i;
        lastDirection = signal.direction;
      }

      return signal;
    },
  };
}


