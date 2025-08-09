#!/usr/bin/env node
/* eslint-disable no-console */

import {
  analyzeMultiTimeframePatterns,
  formatAndPrintPatternAnalysis,
  getStockDataForTimeframe,
} from '../dist/index.js';

async function main() {
  const symbol = process.argv[2] || 'AAPL';
  console.log(`\n======== ${symbol} - 形态分析 ========`);

  const today = new Date();
  const startDateWeekly = new Date();
  startDateWeekly.setDate(today.getDate() - 365);
  const startDateDaily = new Date();
  startDateDaily.setDate(today.getDate() - 120);
  const startDateHourly = new Date();
  startDateHourly.setDate(today.getDate() - 30);

  const [weeklyData, dailyData, hourlyData] = await Promise.all([
    getStockDataForTimeframe(symbol, startDateWeekly, today, 'weekly'),
    getStockDataForTimeframe(symbol, startDateDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startDateHourly, today, '1hour'),
  ]);

  const result = analyzeMultiTimeframePatterns(
    weeklyData,
    dailyData,
    hourlyData,
  );
  formatAndPrintPatternAnalysis(result, symbol);
}

main().catch(err => {
  console.error('run-mtf-patterns failed:', err);
  process.exit(1);
});


