import type { RangeAnalysisResult } from './rangeTypes.js';

export function formatAndPrintRange(result: RangeAnalysisResult) {
  console.log(`\n===== ${result.symbol} 区间/突破 (${result.timeframe}) =====`);
  if (!result.range) {
    console.log('未检测到稳定震荡区间');
    return;
  }
  const r = result.range;
  console.log(
    `区间: ${r.low.toFixed(2)} - ${r.high.toFixed(2)} | 收缩强度: ${result.compressionScore}/100`
  );
  console.log(`NR4: ${r.nr4Count} | NR7: ${r.nr7Count}`);

  if (result.breakout) {
    const b = result.breakout;
    const dir = b.direction === 'up' ? '向上' : '向下';
    console.log(`突破: ${dir} | 质量评分: ${b.qualityScore}/100`);
    console.log(
      `成交量扩张: ${b.volumeExpansion ? '是' : '否'} | 延续: ${b.followThrough ? '是' : '否'} | 回测: ${b.retested ? '是' : '否'}`
    );

    // 简要策略分支
    if (b.qualityScore >= 70) {
      console.log(
        `建议: 高质量突破，回踩 ${b.direction === 'up' ? r.high.toFixed(2) : r.low.toFixed(2)} 后顺势介入`
      );
    } else if (b.qualityScore <= 30) {
      console.log('建议: 低质量突破，警惕假突破，等待确认或转向信号');
    } else {
      console.log('建议: 中等质量突破，控制仓位并等待回踩确认');
    }
  } else {
    console.log('尚未发生有效突破');
  }
}
