import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { Backtester } from '../src/analysis/backtest/Backtester.js';
import { TrendlineBreakoutStrategy } from '../src/analysis/backtest/strategies/TrendlineBreakoutStrategy.js';

function makeUpChannelBreakout(): Candle[] {
	const out: Candle[] = [];
	let price = 100;
	let t = new Date('2024-01-01T00:00:00Z').getTime();
	const day = 86400000;
	for (let i = 0; i < 250; i++) {
		// mild uptrend channel
		const drift = 0.05;
		price += drift + (i % 10 === 0 ? -0.2 : 0.1);
		const open = price - 0.2;
		const close = price + 0.2;
		out.push({ symbol: 'T', open, high: Math.max(open, close) + 0.3, low: Math.min(open, close) - 0.3, close, volume: 1000 + (i % 20) * 10, timestamp: new Date(t) });
		t += day;
	}
	return out;
}

describe('backtester + trendline strategy', () => {
	it('runs without errors and produces metrics', () => {
		const data = makeUpChannelBreakout();
		const bt = new Backtester({ initialCapital: 10000, positionSizing: 0.5 });
		const strat = TrendlineBreakoutStrategy('T', 'daily');
		const res = bt.run(data, strat);
		expect(res.metrics.tradeCount).toBeGreaterThanOrEqual(0);
		expect(Number.isFinite(res.metrics.maxDrawdown)).toBe(true);
		expect(Number.isFinite(res.metrics.sharpe)).toBe(true);
	});
});