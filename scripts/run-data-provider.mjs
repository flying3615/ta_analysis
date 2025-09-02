import { DataProvider } from '../dist/index.js';

async function main() {
  const today = new Date();
  const startDateHourly = new Date(today);
  startDateHourly.setDate(today.getDate() - 60);

  const dataProvider = new DataProvider();

  const getCachedStockData = dataProvider.getCachedStockData.bind(dataProvider);
  const getCachedBinanceData =
    dataProvider.getCachedBinanceData.bind(dataProvider);

  const hourlyCOINData = await getCachedStockData(
    'COIN',
    startDateHourly,
    today,
    '1hour'
  );

  const hourlyBTCData = await getCachedBinanceData(
    'BTC-USD',
    startDateHourly,
    today,
    '1hour'
  );

  console.log(hourlyCOINData);
  console.log(hourlyBTCData);
}

main().catch(err => {
  console.error('run-data-provider failed:', err);
  process.exit(1);
});
