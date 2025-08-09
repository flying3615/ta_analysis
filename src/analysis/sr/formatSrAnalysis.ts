import type { MultiTimeFrameBBSRAnalysisResult } from './srTypes.js';

export function formatAndPrintSrAnalysis(result: MultiTimeFrameBBSRAnalysisResult, symbol: string) {
  console.log(`\n===== ${symbol} 支撑/阻力 + 近期多空信号 (BBSR) =====`);

  const render = (title: string, s?: any) => {
    console.log(`\n----- ${title} -----`);
    if (!s) {
      console.log('无信号');
      return;
    }
    console.log(`价格: ${s.currentPrice}`);
    console.log(`关键水平: ${s.SRLevel}`);
    console.log(`信号日期: ${s.signalDate?.toISOString?.() || s.signalDate}`);
    console.log(`强度: ${s.strength}`);
    console.log(`形态: ${s.signal?.patternNames?.join(', ') || '未知'}`);
  };

  render('周线', result.weeklyBBSRResult);
  render('日线', result.dailyBBSRResult);
}


