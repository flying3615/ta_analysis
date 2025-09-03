import { BinanceProvider } from '../analysis/integration/BinanceProvider.js';

const symbol = process.env.SYMBOL || 'BTCUSDT';
const provider = new BinanceProvider();

const today = new Date();
const startW = new Date(today); startW.setDate(startW.getDate() - 365);
const startD = new Date(today); startD.setDate(startD.getDate() - 90);
const startH = new Date(today); startH.setDate(startH.getDate() - 60);

const fmt = (c: any) => c ? `${c.timestamp.toISOString()} O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume}` : 'N/A';

(async () => {
  const [w, d, h] = await Promise.all([
    provider.getKlines(symbol, '1w', startW, today),
    provider.getKlines(symbol, '1d', startD, today),
    provider.getKlines(symbol, '1h', startH, today),
  ]);
  console.log(`weekly:${w.length} daily:${d.length} hourly:${h.length}`);
  console.log('weekly[0/-1]:', fmt(w[0]), '|', fmt(w[w.length - 1]));
  console.log('daily[0/-1]: ', fmt(d[0]), '|', fmt(d[d.length - 1]));
  console.log('hourly[0/-1]:', fmt(h[0]), '|', fmt(h[h.length - 1]));
})().catch(e => { console.error(e); process.exit(1); });


