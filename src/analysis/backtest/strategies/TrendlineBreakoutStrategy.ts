/**
 * 策略: TrendlineBreakout 趋势线/通道自适应
 * 来源: analyzer/trendline/trendlineDetector
 * 核心流程:
 * - 在窗口内拟合支撑/阻力，构建通道(上/下/中线)，并检测突破-回踩质量；
 * - 结合价格在通道中的相对位置、动量与成交量，生成做多/做空信号；
 * - 设置冷静期与“避免与强动量作对”的降噪逻辑，减少频繁反向信号。
 *
 * 入场(示例):
 * - 上升通道: 接近下轨且具备上行动量 -> 做多；顶部过充且无强动量且出现向上突破回踩 -> 反转做空
 * - 下降通道: 接近上轨且具备下行动量 -> 做空；底部过充且无强动量且出现向下突破回踩 -> 反转做多
 * - 水平通道: 底部配合阳线或放量 -> 做多；顶部配合阴线或放量 -> 做空
 *
 * 降噪:
 * - 强动量与信号方向相反时，弱化或取消信号；
 * - 与上一信号方向相反且间隔过短，且强度不足时，过滤。
 *
 * 出场与风控: 由 Backtester 管理（止损/止盈/追踪止损、滑点/手续费），仓位按 positionSizing。
 * 前视说明: 仅使用 history[0..i] 判定，在 i+1 开盘成交。
 */
import type { Candle } from '../../../types.js';
import { backtestStrategiesConfig } from '../strategyConfig.js';
import { analyzeTrendlinesAndChannels } from '../../analyzer/trendline/trendlineDetector.js';
import type { Strategy, Signal } from '../Backtester.js';

export function TrendlineBreakoutStrategy(
  symbol: string,
  timeframe: 'weekly' | 'daily' | '1hour'
): Strategy {
  // 追踪先前的信号，用于减少信号频率和避免连续相反信号
  let lastSignalIndex = -1;
  let lastSignalDirection: 'long' | 'short' | 'flat' | undefined = undefined;

  // 追踪趋势强度
  let trendStrengthCount = 0;

  return {
    name: 'TrendlineAdaptiveStrategy',
    generateSignal(history: Candle[], i: number): Signal | null {
      const cfg = backtestStrategiesConfig.trendline;
      if (i < cfg.minLookbackBars) return null;

      // 避免频繁信号
      if (i - lastSignalIndex < cfg.coolDownMinGap) return null;

      const window = history.slice(Math.max(0, i - 200), i + 1);
      const res = analyzeTrendlinesAndChannels(symbol, window, timeframe);

      // 如果没有有效通道，不生成信号
      if (!res.channel) return null;

      const candle = history[i];
      const prevCandle = i > 0 ? history[i - 1] : null;
      const lastIndex = window.length - 1;

      // 计算价格在通道中的相对位置 (0 = 下边界, 1 = 上边界)
      const upperNow =
        res.channel.upper.slope * lastIndex + res.channel.upper.intercept;
      const lowerNow =
        res.channel.lower.slope * lastIndex + res.channel.lower.intercept;
      const midNow =
        res.channel.mid.slope * lastIndex + res.channel.mid.intercept;
      const channelHeight = upperNow - lowerNow;

      // 避免除以零
      if (channelHeight <= 0) return null;

      const relativePosition = (candle.close - lowerNow) / channelHeight;

      // 定义价格区域位置
      const isNearLower = relativePosition < 0.25; // 更严格的底部区域
      const isNearUpper = relativePosition > 0.75; // 更严格的顶部区域
      const isInMiddle = !isNearLower && !isNearUpper;

      // 获取通道斜率和方向
      const channelSlope = res.channel.slope;
      const isRisingChannel = channelSlope > cfg.risingChannelSlopeMin;
      const isFallingChannel = channelSlope < cfg.fallingChannelSlopeMax;

      // 计算动量指标 - 使用收盘价的20日变化率
      const momentumPeriod = cfg.momentumPeriod;
      const momentumIndex = Math.max(0, i - momentumPeriod);
      const priceChange =
        (candle.close - history[momentumIndex].close) /
        history[momentumIndex].close;
      const strongUpMomentum = priceChange > cfg.momentumUpThreshold;
      const strongDownMomentum = priceChange < cfg.momentumDownThreshold;

      // 计算交易量趋势
      const volPeriod = cfg.volumePeriod;
      let avgVol = 0;
      for (let j = i - volPeriod + 1; j <= i; j++) {
        if (j >= 0) avgVol += history[j].volume;
      }
      avgVol /= volPeriod;
      const highVolume = candle.volume > avgVol * cfg.highVolumeFactor;

      // 强势趋势确认 - 连续的价格方向
      if (prevCandle && candle.close > prevCandle.close) {
        trendStrengthCount =
          trendStrengthCount > 0 ? trendStrengthCount + 1 : 1;
      } else if (prevCandle && candle.close < prevCandle.close) {
        trendStrengthCount =
          trendStrengthCount < 0 ? trendStrengthCount - 1 : -1;
      }

      const isStrongUptrend = trendStrengthCount >= cfg.trendStrengthConsecutive;
      const isStrongDowntrend = trendStrengthCount <= -cfg.trendStrengthConsecutive;

      let signal: Signal | null = null;

      // 基于通道斜率、价格位置和动量的策略逻辑
      if (isRisingChannel) {
        // 上升通道策略
        if (isNearLower && (strongUpMomentum || isStrongUptrend)) {
          // 上升通道底部且具有强上升动量 - 做多信号
          signal = {
            timestamp: history[i].timestamp,
            direction: 'long',
            strength: 85 + Math.min(15, Math.abs(channelSlope) * 10000),
            reason: '上升通道底部+强动量支撑',
          };
        } else if (
          isNearUpper &&
          !strongUpMomentum &&
          res.breakoutRetest &&
          res.breakoutRetest.direction === 'up'
        ) {
          // 上升通道顶部、无强上升动量且有向上突破后回踩 - 做空信号 (通道过充反转)
          signal = {
            timestamp: history[i].timestamp,
            direction: 'short',
            strength: 60 + Math.min(20, Math.abs(channelSlope) * 10000),
            reason: '上升通道顶部过充区域',
          };
        }
      } else if (isFallingChannel) {
        // 下降通道策略
        if (isNearUpper && (strongDownMomentum || isStrongDowntrend)) {
          // 下降通道顶部且具有强下降动量 - 做空信号
          signal = {
            timestamp: history[i].timestamp,
            direction: 'short',
            strength: 85 + Math.min(15, Math.abs(channelSlope) * 10000),
            reason: '下降通道顶部+强动量压力',
          };
        } else if (
          isNearLower &&
          !strongDownMomentum &&
          res.breakoutRetest &&
          res.breakoutRetest.direction === 'down'
        ) {
          // 下降通道底部、无强下降动量且有向下突破后回踩 - 做多信号 (通道过充反转)
          signal = {
            timestamp: history[i].timestamp,
            direction: 'long',
            strength: 60 + Math.min(20, Math.abs(channelSlope) * 10000),
            reason: '下降通道底部过充区域',
          };
        }
      } else {
        // 水平通道策略 - 增加额外的筛选条件
        if (isNearLower && (candle.close > candle.open || highVolume)) {
          signal = {
            timestamp: history[i].timestamp,
            direction: 'long',
            strength: 75,
            reason: '水平通道底部支撑+成交量确认',
          };
        } else if (isNearUpper && (candle.close < candle.open || highVolume)) {
          signal = {
            timestamp: history[i].timestamp,
            direction: 'short',
            strength: 75,
            reason: '水平通道顶部压力+成交量确认',
          };
        }
      }

      // 避免在强势趋势中做反向交易
      if (signal) {
        if (
          (strongUpMomentum && signal.direction === 'short') ||
          (strongDownMomentum && signal.direction === 'long')
        ) {
          // 不与强动量作对
          if (Math.abs(priceChange) > cfg.strongMomentumCancelAbs) {
            // 15%以上的超强动量
            signal = null; // 取消信号
          } else {
            // 降低信号强度
            signal.strength = Math.max(50, signal.strength - 20);
            signal.reason += ' (注意:与强动量相反)';
          }
        }
      }

      // 如果没有根据位置生成信号，但有高质量的突破回踩信号，则考虑使用
      if (
        !signal &&
        res.breakoutRetest &&
        res.breakoutRetest.qualityScore > 80
      ) {
        // 重要调整：强动量环境下，不反转突破方向
        const shouldReverseSignal = !(
          (res.breakoutRetest.direction === 'up' && strongUpMomentum) ||
          (res.breakoutRetest.direction === 'down' && strongDownMomentum)
        );

        if (shouldReverseSignal) {
          // 通常情况下反转信号方向
          signal = {
            timestamp: history[i].timestamp,
            direction: res.breakoutRetest.direction === 'up' ? 'short' : 'long',
            strength: res.breakoutRetest.qualityScore,
            reason: 'Trendline breakout + retest fakeout reversal',
          };
        } else {
          // 在强动量环境下，保持突破方向一致
          signal = {
            timestamp: history[i].timestamp,
            direction: res.breakoutRetest.direction === 'up' ? 'long' : 'short',
            strength: res.breakoutRetest.qualityScore,
            reason:
              'Trendline breakout + retest continuation (strong momentum)',
          };
        }
      }

      // 避免连续相反方向的信号
      if (
        signal &&
        lastSignalDirection &&
        signal.direction !== lastSignalDirection &&
        i - lastSignalIndex < cfg.reverseMinGap
      ) {
        // 如果信号不够强，就取消它
        if (signal.strength < cfg.reverseSignalStrengthMin) {
          signal = null;
        } else {
          signal.reason += ' (方向反转:高置信度)';
        }
      }

      // 更新信号追踪
      if (signal) {
        lastSignalIndex = i;
        lastSignalDirection = signal.direction;
      }

      return signal;
    },
  };
}
