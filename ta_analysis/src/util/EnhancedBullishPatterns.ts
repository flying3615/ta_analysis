import { Candle } from '../types.js';
import {
  bullishengulfingpattern,
  bullishhammerstick,
  bullishharami,
  bullishharamicross,
  bullishinvertedhammerstick,
  bullishmarubozu,
  downsidetasukigap,
  hammerpattern,
  hammerpatternunconfirmed,
  morningdojistar,
  morningstar,
  piercingline,
  threewhitesoldiers,
  tweezerbottom,
} from 'technicalindicators';

const bullishPatterns = [
  bullishengulfingpattern,
  downsidetasukigap,
  bullishharami,
  bullishharamicross,
  morningdojistar,
  morningstar,
  bullishmarubozu,
  piercingline,
  threewhitesoldiers,
  bullishhammerstick,
  bullishinvertedhammerstick,
  hammerpattern,
  hammerpatternunconfirmed,
  tweezerbottom,
];

const patternNameZhMap = [
  { name: '看涨吞没', pattern: bullishengulfingpattern },
  { name: '下降跳空缺口', pattern: downsidetasukigap },
  { name: '看涨孕线', pattern: bullishharami },
  { name: '看涨十字星', pattern: bullishharamicross },
  { name: '晨星十字星', pattern: morningdojistar },
  { name: '晨星', pattern: morningstar },
  { name: '看涨光脚实体', pattern: bullishmarubozu },
  { name: '刺透线', pattern: piercingline },
  { name: '三只白兵', pattern: threewhitesoldiers },
  { name: '看涨锤子线', pattern: bullishhammerstick },
  { name: '锤子线', pattern: hammerpattern },
  { name: '倒锤子线', pattern: bullishinvertedhammerstick },
  { name: '锤子线（未确认）', pattern: hammerpatternunconfirmed },
  { name: '镊子底', pattern: tweezerbottom },
];

export default class EnhancedBullishPatterns {
  hasPattern(windowCandles: Candle[]): string[] {
    const data = {
      open: windowCandles.map(candle => candle.open),
      high: windowCandles.map(candle => candle.high),
      low: windowCandles.map(candle => candle.low),
      close: windowCandles.map(candle => candle.close),
      timestamp: windowCandles.map(candle => candle.timestamp),
    };
    return bullishPatterns
      .filter(pattern => pattern(data))
      .map(
        pattern => patternNameZhMap.find(n => n.pattern === pattern)?.name ?? ''
      );
  }
}

export function bullish(windowCandles: Candle[]) {
  return new EnhancedBullishPatterns().hasPattern(windowCandles);
}
