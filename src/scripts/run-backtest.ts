// 离线回测：读取 stock-scanner-tauri 的 daily_bars 导出文件，不访问网络。
// 用法见 CLI_USAGE，或运行：npm run backtest -- --data bars.csv
import { readFileSync, writeFileSync } from 'node:fs';
import { runBacktestCli } from '../analysis/backtest/cli.js';

runBacktestCli(process.argv.slice(2), {
  readFile: path => readFileSync(path, 'utf8'),
  writeFile: (path, text) => writeFileSync(path, text, 'utf8'),
  progress: message => process.stderr.write(`${message}\n`),
})
  .then(report => process.stdout.write(report))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
