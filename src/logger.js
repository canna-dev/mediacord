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
  }

  _log(emoji, level, ...args) {
    if (this.levels[this.level] >= this.levels[level]) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const prefixStr = this.prefix ? `[${this.prefix}]` : '';
      console[level === 'debug' ? 'log' : level](`${emoji} ${timestamp} ${prefixStr}`, ...args);
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
}

// Create default logger
export const logger = new Logger(process.env.LOG_LEVEL || 'info', 'MediaCord');

// Create logger factory for components
export function createLogger(component, level) {
  return new Logger(level || process.env.LOG_LEVEL || 'info', component);
}
