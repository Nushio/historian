import { logger } from "firebase-functions/v1";

enum LogLevel {
  INFO = 0,
  WARN = 1,
  ERROR = 2,
  SILENT = 3,
}

const getLogLevel = (): LogLevel => {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  switch (level) {
    case "INFO":
      return LogLevel.INFO;
    case "WARN":
      return LogLevel.WARN;
    case "ERROR":
      return LogLevel.ERROR;
    case "SILENT":
      return LogLevel.SILENT;
    default:
      return LogLevel.INFO;
  }
};

const shouldLog = (level: LogLevel): boolean => {
  return level >= getLogLevel();
};

export const loggerAdapter = {
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
};

export const logInfo = (message: string, ...args: unknown[]) => {
  if (shouldLog(LogLevel.INFO)) {
    loggerAdapter.info(message, ...args);
  }
};

export const logWarn = (message: string, ...args: unknown[]) => {
  if (shouldLog(LogLevel.WARN)) {
    loggerAdapter.warn(message, ...args);
  }
};

export const logError = (message: string, ...args: unknown[]) => {
  if (shouldLog(LogLevel.ERROR)) {
    loggerAdapter.error(message, ...args);
  }
};
