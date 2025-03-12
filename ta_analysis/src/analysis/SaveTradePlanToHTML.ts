import {
  executeIntegratedAnalysis,
  IntegratedTradePlan,
  SignalStrength,
} from './IntegratedAnalysis.js';
import { formatTradePlanOutput } from './FormatTradePlan.js';
import fs from 'fs';
import path from 'path';

/**
 * 将交易计划保存为文本文件
 * @param tradePlan 综合交易计划对象
 * @param outputDir 输出目录，默认为当前目录
 * @returns 生成的文件路径
 */
export async function saveTradePlanToFile(
  tradePlan: IntegratedTradePlan,
  outputDir: string = './'
): Promise<string> {
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 创建文件名 (格式: SYMBOL_YYYYMMDD_HHMMSS.txt)
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];

  const fileName = `${tradePlan.symbol}_${timestamp}.txt`;
  const filePath = path.join(outputDir, fileName);

  // 获取格式化后的文本内容
  const textContent = formatTradePlanOutput(tradePlan);

  // 简单地将内容写入文本文件
  try {
    fs.writeFileSync(filePath, textContent, 'utf8');
    console.log(`交易计划已保存到文件: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('保存文件失败:', error);
    throw error;
  }
}

/**
 * 尝试使用简单的HTML格式保存交易计划
 * 这个方法生成一个可以在浏览器中查看的HTML文件
 */
export async function saveTradePlanToHtml(
  tradePlan: IntegratedTradePlan,
  outputDir: string = './'
): Promise<string> {
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 创建文件名
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];

  const fileName = `${tradePlan.symbol}_${timestamp}.html`;
  const filePath = path.join(outputDir, fileName);

  // 获取格式化后的文本内容
  const textContent = formatTradePlanOutput(tradePlan);

  // 转换为HTML格式
  const htmlContent = convertToHtml(tradePlan, textContent);

  // 写入HTML文件
  try {
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log(`交易计划已保存到HTML文件: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('保存HTML文件失败:', error);
    throw error;
  }
}

/**
 * 将交易计划转换为HTML格式
 */
function convertToHtml(
  tradePlan: IntegratedTradePlan,
  textContent: string
): string {
  // 分割文本为各个部分
  const parts = textContent.split(/【(.+?)】\n/g);
  // 移除第一个空元素
  if (parts.length > 0 && parts[0].trim() === '') {
    parts.shift();
  }

  let htmlSections = '';

  for (let i = 0; i < parts.length; i += 2) {
    if (i + 1 >= parts.length) break;

    const sectionTitle = parts[i];
    const sectionContent = parts[i + 1].trim().replace(/\n/g, '<br>');

    htmlSections += `
      <div class="section">
        <h2>【${sectionTitle}】</h2>
        <div class="content">
          ${sectionContent}
        </div>
      </div>
    `;
  }

  // 创建完整的HTML文档
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>交易计划: ${tradePlan.symbol}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        h1 {
          color: #444;
        }
        .date {
          color: #666;
          font-style: italic;
        }
        .section {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        h2 {
          color: #0066cc;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .content {
          padding-left: 15px;
        }
        footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>交易计划: ${tradePlan.symbol}</h1>
        <div class="date">日期: ${new Date(tradePlan.date).toLocaleString()}</div>
      </header>
      
      ${htmlSections}
      
      <footer>
        生成时间: ${new Date().toLocaleString()}
      </footer>
    </body>
    </html>
  `;
}

/**
 * 分析并保存为HTML格式
 */
export async function analyzeAndSaveToHtml(
  symbol: string,
  outputDir: string = './reports',
  customWeights: { chip: number; pattern: number } = { chip: 0.6, pattern: 0.4 }
): Promise<string> {
  try {
    console.log(`======== 开始执行 ${symbol} 综合分析 ========`);

    // 导入executeIntegratedAnalysis函数

    // 执行综合分析
    const integratedResult = await executeIntegratedAnalysis(
      symbol,
      customWeights
    );

    if (integratedResult.signalStrength !== SignalStrength.Strong) {
      console.log(`${symbol} 综合分析结果不是强信号，无法生成交易计划`);
      return '';
    }

    // 保存结果到HTML文件
    const htmlPath = await saveTradePlanToHtml(integratedResult, outputDir);

    console.log(`======== ${symbol} 分析完成并保存为HTML ========`);
    console.log(`HTML文件路径: ${htmlPath}`);

    return htmlPath;
  } catch (error) {
    console.error('分析和保存HTML失败:', error);
    throw error;
  }
}
async function main() {
  try {
    // 设置股票代码
    const symbol = 'PRCH'; // 可以修改为你想分析的股票代码

    // 设置输出目录
    const outputDir = './trading-reports';

    // 设置分析权重
    const weights = {
      chip: 0.4, // 筹码分析权重
      pattern: 0.45, // 形态分析权重
    };

    console.log(`开始分析 ${symbol} 并生成PDF报告...`);

    // 执行分析并生成PDF
    const pdfPath = await analyzeAndSaveToHtml(symbol, outputDir, weights);

    console.log(`分析完成！PDF报告已保存到: ${pdfPath}`);
  } catch (error) {
    console.error('执行过程中出错:', error);
  }
}

// 执行主函数
// main().catch(console.error);
