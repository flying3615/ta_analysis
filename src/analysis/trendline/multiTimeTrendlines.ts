import type { Candle } from '../../types.js';
import { analyzeTrendlinesAndChannels } from './trendlineDetector.js';
import type { TrendlineChannelAnalysisResult } from './trendlineTypes.js';

export function multiTimeTrendlines(
  symbol: string,
  daily: Candle[],
  hourly: Candle[]
): {
  daily: TrendlineChannelAnalysisResult;
  hourly: TrendlineChannelAnalysisResult;
  summary: string;
} {
  const dailyRes = analyzeTrendlinesAndChannels(symbol, daily, 'daily');
  const hourlyRes = analyzeTrendlinesAndChannels(symbol, hourly, '1hour');
  const summary = `日线: ${dailyRes.summary} ｜ 小时线: ${hourlyRes.summary}`;
  return { daily: dailyRes, hourly: hourlyRes, summary };
}
