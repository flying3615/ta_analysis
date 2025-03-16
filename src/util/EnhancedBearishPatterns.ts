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

const patternNameZhMap = [
  { name: '看跌吞没', pattern: bearishengulfingpattern },
  { name: '看跌孕线', pattern: bearishharami },
  { name: '看跌十字孕线', pattern: bearishharamicross },
  { name: '黄昏十字星', pattern: eveningdojistar },
  { name: '黄昏星', pattern: eveningstar },
  { name: '看跌光头光脚阴线', pattern: bearishmarubozu },
  { name: '三黑鸦', pattern: threeblackcrows },
  { name: '看跌锤子线', pattern: bearishhammerstick },
  {
    name: '看跌倒锤子线',
    pattern: bearishinvertedhammerstick,
  },
  { name: '上吊线', pattern: hangingman },
  { name: '未确认上吊线', pattern: hangingmanunconfirmed },
  { name: '流星', pattern: shootingstar },
  { name: '未确认流星', pattern: shootingstarunconfirmed },
  { name: '镊子顶', pattern: tweezertop },
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
      .map(
        pattern => patternNameZhMap.find(n => n.pattern === pattern)?.name ?? ''
      );
  }
}

export function bullish(windowCandles: Candle[]) {
  return new EnhancedBearishPatterns().hasPattern(windowCandles);
}
