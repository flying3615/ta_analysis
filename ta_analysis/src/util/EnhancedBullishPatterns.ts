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
      .map(pattern => pattern.name);
  }
}

export function bullish(windowCandles: Candle[]) {
  return new EnhancedBullishPatterns().hasPattern(windowCandles);
}
