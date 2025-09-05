import { DataProvider } from '../index.js';
import { BinanceProvider } from '../analysis/integration/BinanceProvider.js';

async function main() {
  const today = new Date();
  const startDateHourly = new Date(today);
  startDateHourly.setDate(today.getDate() - 60);

  const dataProvider = new DataProvider();
  const binance = new BinanceProvider();

  const getCachedStockData = dataProvider.getCachedStockData.bind(dataProvider);

  const hourlyCOINData = await getCachedStockData(
    'COIN',
    startDateHourly,
    today,
    '1hour'
  );

  const hourlyBTCData = await binance.getKlines(
    'BTC-USD',
    '1h',
    startDateHourly,
    today
  );

  console.log(hourlyCOINData);
  console.log(hourlyBTCData);
}

main().catch(err => {
  console.error('run-data-provider failed:', err);
  process.exit(1);
});
