import { ChartImg, TimeFrameConfig } from '../types.js';
import axios from 'axios';
import { globalLogger } from '../util/logger.js';
import imageToBase64 from 'image-to-base64';

/** 生成不含请求配置（如 API key）的错误描述 */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const status = (error as { response?: { status?: number } }).response?.status;
  return status ? `HTTP ${status} - ${error.message}` : error.message;
}

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
        timeout: 30_000,
      });
      const imageBase64 = await imageToBase64(response.data.url);

      chartData.push({
        title: `${symbol}-${timeFrameConfig.interval}`,
        url: response.data.url,
        size: response.data.size,
        expireAt: response.data.expireAt,
        createdAt: response.data.createdAt,
        media_type: 'image/png',
        imageBase64,
      });
    } catch (error) {
      // 只记录消息和状态码：完整的 AxiosError 含有请求头里的 x-api-key
      globalLogger.error(
        `Error fetching chart data (${symbol} ${timeFrameConfig.interval}): ${describeError(error)}`
      );
    }
  }

  return chartData;
}
