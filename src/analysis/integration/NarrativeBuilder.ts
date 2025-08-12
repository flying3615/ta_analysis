import type {
  AnalysisInputData,
  IntegrationContext,
} from './IntegrationTypes.js';

export class NarrativeBuilder {
  buildSummary(signalResult: any): string {
    const dirText =
      signalResult.direction === 'long'
        ? '做多'
        : signalResult.direction === 'short'
          ? '做空'
          : '中性';
    return `综合信号 ${dirText}｜强度:${signalResult.signalStrength}｜置信度:${signalResult.confidenceScore?.toFixed?.(1) ?? signalResult.confidenceScore}%`;
  }

  buildPrimaryRationale(
    signalResult: any,
    analyses: AnalysisInputData['analyses']
  ): string {
    const ws = signalResult.weightedScores as Record<string, number>;
    const entries = Object.entries(ws).sort(
      (a, b) => Math.abs(b[1]) - Math.abs(a[1])
    );
    const top = entries
      .slice(0, 3)
      .map(([k]) => k)
      .join('/');
    const patternDir = (analyses.pattern as any)?.combinedSignal ?? '-';
    const chip = analyses.chip;
    return `主要由${top} 驱动；形态:${patternDir}；筹码买:${chip.combinedBuySignalStrength}/卖:${chip.combinedShortSignalStrength}`;
  }

  buildSecondaryRationale(analyses: AnalysisInputData['analyses']): string {
    const structure = analyses.structure;
    const sd: any = analyses.supplyDemand;
    const range: any = analyses.range;
    const tl: any = analyses.trendline;
    const parts: string[] = [];
    if (structure?.trend) parts.push(`结构:${structure.trend}`);
    if (sd?.premiumDiscount?.position != null)
      parts.push(`估值位:${Math.round(sd.premiumDiscount.position)}%`);
    if (range?.breakout)
      parts.push(
        `区间突破:${range.breakout.direction}/质量${range.breakout.qualityScore}`
      );
    if (tl?.breakoutRetest)
      parts.push(
        `趋势线突破回踩:${tl.breakoutRetest.direction}/质量${tl.breakoutRetest.qualityScore}`
      );
    return parts.length ? parts.join('；') : '—';
  }

  buildSummariesFromPlugins(
    plugins: ReadonlyArray<{
      id: string;
      summarize?: (input: AnalysisInputData, ctx: IntegrationContext) => string;
    }>,
    analysisData: AnalysisInputData,
    context: IntegrationContext
  ) {
    const get = (id: string, fallback: () => string) => {
      const plugin = plugins.find(p => p.id === id);
      if (plugin?.summarize) {
        try {
          return plugin.summarize(analysisData, context);
        } catch {}
      }
      return fallback();
    };
    return {
      chipSummary: get('chip', () => {
        const chip = analysisData.analyses.chip;
        return `买入强度:${chip.combinedBuySignalStrength} 做空强度:${chip.combinedShortSignalStrength} 主周期:${chip.primaryTimeframe}`;
      }),
      patternSummary: get('pattern', () => {
        const p = analysisData.analyses.pattern as any;
        return `形态综合方向:${p.combinedSignal} 强度:${p.signalStrength?.toFixed?.(1) ?? p.signalStrength}`;
      }),
      bbsrSummary: get('bbsr', () => {
        const b = analysisData.analyses.bbsr as any;
        const d = b.dailyBBSRResult?.strength;
        const w = b.weeklyBBSRResult?.strength;
        return `BBSR(日/周) 强度:${d ?? '-'} / ${w ?? '-'}`;
      }),
      vvSummary: get('volume', () => {
        const vv: any = analysisData.analyses.volatility;
        const regime =
          vv.volatilityAnalysis?.volatilityAnalysis?.volatilityRegime ?? 'low';
        const atrp = vv.volatilityAnalysis?.volatilityAnalysis?.atrPercent ?? 0;
        const volConfirm = vv.volumeAnalysis?.volumeAnalysis
          ?.volumePriceConfirmation
          ? '确认'
          : '未确认';
        return `波动率:${regime} ATR%:${(atrp as any).toFixed?.(2) ?? atrp} 成交量确认:${volConfirm}`;
      }),
      structureSummary: get('structure', () => {
        const s = analysisData.analyses.structure;
        return `结构趋势:${s.trend} 关键位数:${s.keyLevels?.length ?? 0}`;
      }),
      supplyDemandSummary: get('supplyDemand', () => {
        const sd: any = analysisData.analyses.supplyDemand;
        const pos = sd.premiumDiscount?.position ?? 50;
        const zones = sd.recentEffectiveZones?.length ?? 0;
        return `供需位置:${(pos as any).toFixed?.(1) ?? pos} 有效区域:${zones}`;
      }),
      rangeSummary: get('range', () => {
        const r: any = analysisData.analyses.range;
        const comp = r.compressionScore;
        const br = r.breakout
          ? `${r.breakout.direction}/${r.breakout.qualityScore}`
          : '无突破';
        return `压缩:${comp} 突破:${br}`;
      }),
      trendlineSummary: get('trendline', () => {
        const tl: any = analysisData.analyses.trendline;
        const slope = tl.channel?.slope ?? 0;
        return tl.summary || `通道斜率:${(slope as any).toFixed?.(4) ?? slope}`;
      }),
    };
  }

  buildShortTermOutlook(analyses: AnalysisInputData['analyses']): string {
    const pattern = analyses.pattern as any;
    const vv: any = analyses.volatility;
    const tl: any = analyses.trendline;
    const dir = pattern?.combinedSignal ?? '-';
    const regime =
      vv?.volatilityAnalysis?.volatilityAnalysis?.volatilityRegime ?? 'low';
    const slope = tl?.channel?.slope ?? 0;
    return `短期(${dir})，波动率${regime}，通道斜率${typeof slope?.toFixed === 'function' ? slope.toFixed(3) : slope}`;
  }

  buildMediumTermOutlook(analyses: AnalysisInputData['analyses']): string {
    const chip = analyses.chip as any;
    const sd: any = analyses.supplyDemand;
    const pos = sd?.premiumDiscount?.position ?? 50;
    return `中期(筹码买:${chip.combinedBuySignalStrength}/卖:${chip.combinedShortSignalStrength})，估值位置${typeof pos?.toFixed === 'function' ? pos.toFixed(1) : pos}`;
  }

  buildLongTermOutlook(analyses: AnalysisInputData['analyses']): string {
    const structure: any = analyses.structure;
    const range: any = analyses.range;
    const trend = structure?.trend ?? '-';
    const comp = range?.compressionScore ?? '-';
    return `长期(${trend})，压缩度${comp}`;
  }
}
