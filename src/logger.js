/**
 * Simple Logger for MediaCord
 * Provides leveled logging with emoji indicators
 */

export class Logger {
  constructor(level = 'info', prefix = '') {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.level = level;
    this.prefix = prefix;
    this.logBuffer = [];
    this.maxBuffer = 20;
  }

  _log(emoji, level, ...args) {
    if (this.levels[this.level] >= this.levels[level]) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const prefixStr = this.prefix ? `[${this.prefix}]` : '';
      const msg = `${emoji} ${timestamp} ${prefixStr} ${args.join(' ')}`;
      this.logBuffer.push({ level, msg, time: Date.now() });
      if (this.logBuffer.length > this.maxBuffer) this.logBuffer.shift();
      console[level === 'debug' ? 'log' : level](msg);
    }
  }

  error(...args) {
    this._log('❌', 'error', ...args);
  }

  warn(...args) {
    this._log('⚠️ ', 'warn', ...args);
  }

  info(...args) {
    this._log('ℹ️ ', 'info', ...args);
  }

  debug(...args) {
    this._log('🔍', 'debug', ...args);
  }

  success(...args) {
    this._log('✅', 'info', ...args);
  }

  getRecentLogs() {
    return this.logBuffer.slice(-this.maxBuffer);
  }
}

// Create default logger
export const logger = new Logger(process.env.LOG_LEVEL || 'info', 'MediaCord');

// Create logger factory for components
export function createLogger(component, level) {
  return new Logger(level || process.env.LOG_LEVEL || 'info', component);
}
