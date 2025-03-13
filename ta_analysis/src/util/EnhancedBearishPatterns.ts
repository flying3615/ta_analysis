import { Candle } from '../types.js';
import {
  bearishengulfingpattern,
  bearishhammerstick,
  bearishharami,
  bearishharamicross,
  bearishinvertedhammerstick,
  bearishmarubozu,
  eveningdojistar,
  eveningstar,
  hangingman,
  hangingmanunconfirmed,
  shootingstar,
  shootingstarunconfirmed,
  threeblackcrows,
  tweezertop,
} from 'technicalindicators';

const bearishPatterns = [
  bearishengulfingpattern,
  bearishharami,
  bearishharamicross,
  eveningdojistar,
  eveningstar,
  bearishmarubozu,
  threeblackcrows,
  bearishhammerstick,
  bearishinvertedhammerstick,
  hangingman,
  hangingmanunconfirmed,
  shootingstar,
  shootingstarunconfirmed,
  tweezertop,
];

export default class EnhancedBearishPatterns {
  hasPattern(windowCandles: Candle[]): string[] {
    const data = {
      open: windowCandles.map(candle => candle.open),
      high: windowCandles.map(candle => candle.high),
      low: windowCandles.map(candle => candle.low),
      close: windowCandles.map(candle => candle.close),
      timestamp: windowCandles.map(candle => candle.timestamp),
    };
    return bearishPatterns
      .filter(pattern => pattern(data))
      .map(pattern => pattern.name);
  }
}

export function bullish(windowCandles: Candle[]) {
  return new EnhancedBearishPatterns().hasPattern(windowCandles);
}
