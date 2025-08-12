export type LogLevel = 'silent' | 'normal' | 'verbose';

export interface LoggerOptions {
  level: LogLevel;
  prefix?: string;
}

export class Logger {
  private level: LogLevel;
  private prefix?: string;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.prefix = options.prefix;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private fmt(msg: any): any {
    if (!this.prefix) return msg;
    if (typeof msg === 'string') return `${this.prefix} ${msg}`;
    return msg;
  }

  log(...args: any[]) {
    if (this.level === 'silent') return;
    // normal 与 verbose 都输出 log
    console.log(...args.map(a => this.fmt(a)));
  }

  info(...args: any[]) {
    if (this.level === 'silent') return;
    console.log(...args.map(a => this.fmt(a)));
  }

  verbose(...args: any[]) {
    if (this.level !== 'verbose') return;
    console.log(...args.map(a => this.fmt(a)));
  }

  warn(...args: any[]) {
    if (this.level === 'silent') return;
    console.warn(...args.map(a => this.fmt(a)));
  }

  error(...args: any[]) {
    console.error(...args.map(a => this.fmt(a)));
  }
}

export function createLogger(level: LogLevel = 'normal', prefix?: string) {
  return new Logger({ level, prefix });
}

function readEnvLevel(): LogLevel {
  const raw = (
    process.env.TA_LOG_LEVEL ||
    process.env.LOG_LEVEL ||
    ''
  ).toLowerCase();
  if (raw === 'silent' || raw === 'normal' || raw === 'verbose') return raw;
  return 'normal';
}

export const globalLogger = createLogger(readEnvLevel(), '[TA]');

export function setGlobalLogLevel(level: LogLevel) {
  globalLogger.setLevel(level);
}
