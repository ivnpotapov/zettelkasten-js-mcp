type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export const logLevels: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
};

const logLevelsNames: Record<LogLevel, LogLevel> = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
};

type LogData = {
  logLevelScore: number;
  moduleName: string;
  message: string;
  error?: Error;
};

/**
 * Format a log message with timestamp and level
 */
function formatMessage(level: string, name: string, message: string): string {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  return `${timestamp} [${level}] ${name}: ${message}`;
}

/**
 * Log a debug message
 */
export function debug({ logLevelScore, moduleName, message }: LogData): void {
  if (logLevelScore > logLevels.DEBUG) {
    return;
  }

  console.error(formatMessage(logLevelsNames.DEBUG, moduleName, message));
}

/**
 * Log an info message
 */
export function info({ logLevelScore, moduleName, message }: LogData): void {
  if (logLevelScore > logLevels.INFO) {
    return;
  }

  console.error(formatMessage(logLevelsNames.INFO, moduleName, message));
}

/**
 * Log a warning message
 */
export function warning({ logLevelScore, moduleName, message }: LogData): void {
  if (logLevelScore > logLevels.WARNING) {
    return;
  }

  console.error(formatMessage(logLevelsNames.WARNING, moduleName, message));
}

/**
 * Log an error message
 */
export function error({ moduleName, message, error }: LogData): void {
  console.error(formatMessage(logLevelsNames.ERROR, moduleName, message));

  if (error) {
    console.error(error.stack || error.message);
  }
}

/**
 * Create a scoped logger for a specific module
 */
export function createLogger(moduleName: string, currentLogLevel: string) {
  const logLevelScore = logLevels[currentLogLevel as LogLevel];

  return {
    debug: (message: string) => debug({ logLevelScore, moduleName, message }),
    info: (message: string) => info({ logLevelScore, moduleName, message }),
    warning: (message: string) =>
      warning({ logLevelScore, moduleName, message }),
    error: (message: string, err?: Error) =>
      error({ logLevelScore, moduleName, message, error: err }),
  };
}
