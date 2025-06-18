interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private level: number;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.level = LOG_LEVELS[envLevel as keyof LogLevel] || LOG_LEVELS.INFO;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level}: ${message}`;
    
    if (meta) {
      return `${baseMessage} ${JSON.stringify(meta, null, 2)}`;
    }
    
    return baseMessage;
  }

  private log(level: keyof LogLevel, message: string, meta?: any): void {
    if (LOG_LEVELS[level] <= this.level) {
      const formattedMessage = this.formatMessage(level, message, meta);
      console.log(formattedMessage);
    }
  }

  error(message: string, meta?: any): void {
    this.log('ERROR', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('WARN', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('INFO', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log('DEBUG', message, meta);
  }
}

export const logger = new Logger(); 