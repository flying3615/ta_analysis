/**
 * 随机入场对照（null model）。
 *
 * 用来回答：唐奇安突破的收益，是来自"突破"这个入场信号，还是只是股票池本身在上涨。
 * - 入场：空仓时每根K线以概率 probability 随机做多（只做多，与回测基准一致）
 * - 出场：与唐奇安完全相同（donchianExitSignal：收盘价跌破之前 20 根的最低价）
 * - 风险单位：与唐奇安相同，2 × 最近 56 根K线的 Wilder ATR，只用于换算 R
 * - 随机数由 seed 和股票代码共同决定，同样的输入总是得到同样的入场
 */
import type { Candle } from '../../../types.js';
import type { Signal, Strategy } from '../Backtester.js';
import {
  ENTRY_CHANNEL_SESSIONS,
  donchianAtr,
  donchianExitSignal,
} from './DonchianStrategy.js';

export interface RandomEntryParams {
  probability: number; // 空仓时每根K线入场的概率
  seed: number;
  symbol: string; // 参与随机数种子，让不同股票的入场相互独立
  riskAtrMultiple?: number; // 默认 2
}

/** 32 位 FNV-1a 字符串哈希 */
function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let k = 0; k < text.length; k++) {
    h ^= text.charCodeAt(k);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32：小而快的确定性伪随机数生成器，返回 [0, 1) */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function RandomEntryStrategy(params: RandomEntryParams): Strategy {
  const { probability, seed, symbol, riskAtrMultiple = 2 } = params;
  const random = mulberry32(hashString(`${seed}:${symbol}`));

  return {
    name: 'RandomEntry',
    generateSignal(history: Candle[], i, position): Signal | null {
      if (position) return donchianExitSignal(history, i, position);
      if (i < ENTRY_CHANNEL_SESSIONS) return null;
      // 每根有资格的空仓K线都抽一次随机数，保证入场序列只由种子决定
      if (random() >= probability) return null;
      const atr = donchianAtr(history.slice(i - ENTRY_CHANNEL_SESSIONS, i + 1));
      if (atr === undefined) return null;
      return {
        timestamp: history[i].timestamp,
        direction: 'long',
        riskPerShare: riskAtrMultiple * atr,
        reason: '随机入场（对照）',
      };
    },
  };
}
