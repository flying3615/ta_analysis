import type { Candle } from '../../../types.js';

export interface PivotPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
}

/**
 * 查找枢轴点 (Swing High/Low)
 * @param data - K线数据
 * @param leftBars - 左侧K线数量
 * @param rightBars - 右侧K线数量
 * @returns 枢轴点数组
 */
export function findPivotPoints(
  data: Candle[],
  { leftBars, rightBars }: { leftBars: number; rightBars: number }
): PivotPoint[] {
  const pivots: PivotPoint[] = [];

  for (let i = leftBars; i < data.length - rightBars; i++) {
    // 检查高点
    let isHighPivot = true;
    for (let j = i - leftBars; j < i; j++) {
      if (data[j].high >= data[i].high) {
        isHighPivot = false;
        break;
      }
    }
    if (isHighPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (data[j].high >= data[i].high) {
          isHighPivot = false;
          break;
        }
      }
    }
    if (isHighPivot) {
      pivots.push({ index: i, price: data[i].high, type: 'high' });
    }

    // 检查低点
    let isLowPivot = true;
    for (let j = i - leftBars; j < i; j++) {
      if (data[j].low <= data[i].low) {
        isLowPivot = false;
        break;
      }
    }
    if (isLowPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (data[j].low <= data[i].low) {
          isLowPivot = false;
          break;
        }
      }
    }
    if (isLowPivot) {
      pivots.push({ index: i, price: data[i].low, type: 'low' });
    }
  }

  return pivots;
}

