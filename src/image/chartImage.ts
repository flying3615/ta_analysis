import { ChartImg, TimeFrameConfig } from '../types.js';
import axios from 'axios';
import imageToBase64 from 'image-to-base64';

export async function fetchChartData(
  symbol: string,
  timeFrameConfigs: TimeFrameConfig[]
) {
  const apiKey = process.env.CHART_IMG_API_KEY;

  if (!apiKey) {
    throw new Error('No API key provided for ChartImg');
  }

  const url = 'https://api.chart-img.com/v2/tradingview/advanced-chart/storage';
  const chartData: ChartImg[] = [];

  for (const timeFrameConfig of timeFrameConfigs) {
    const data = {
      symbol,
      interval: timeFrameConfig.interval,
      studies: timeFrameConfig.studies,
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
        responseType: 'json', // Optional, but good practice to specify expected response type
      });

      // const imageBase64 = await imageToBase64(response.data.url);

      chartData.push({
        title: `${symbol}-${timeFrameConfig.interval}`,
        url: response.data.url,
        size: response.data.size,
        expireAt: response.data.expireAt,
        createdAt: response.data.createdAt,
        media_type: 'image/png',
        // imageBase64,
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  }

  return chartData;
}