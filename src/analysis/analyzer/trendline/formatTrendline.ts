import type { TrendlineChannelAnalysisResult } from './trendlineTypes.js';

export function formatAndPrintTrendlines(
  result: TrendlineChannelAnalysisResult
) {
  console.log(
    `\n===== ${result.symbol} 趋势线/通道 (${result.timeframe}) =====`
  );
  console.log(result.summary);
  if (result.channel) {
    const ch = result.channel;
    const slopeStr = ch.slope > 0 ? '向上' : ch.slope < 0 ? '向下' : '水平';
    console.log(
      `中轴斜率: ${slopeStr} | 宽度: ${ch.width.toFixed(2)} | 上触达:${ch.touchesUpper} 下触达:${ch.touchesLower}`
    );
  }
  if (result.breakoutRetest) {
    const b = result.breakoutRetest;
    console.log(
      `突破: ${b.direction === 'up' ? '向上' : '向下'} | 回踩确认: ${b.retested ? '是' : '否'} | 质量: ${b.qualityScore}/100`
    );
    if (b.retested) {
      console.log('建议: 回踩确认后顺势介入，止损放在边界外一档容差');
    } else {
      console.log('建议: 未见回踩确认，谨慎追涨/杀跌');
    }
  }
}
