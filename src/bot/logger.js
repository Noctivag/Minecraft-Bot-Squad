/**
 * Enhanced Logging System - Structured logging with multiple levels and outputs
 * Provides consistent logging across all bot systems
 */

const fs = require("fs");
const path = require("path");

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

/**
 * Log level names
 */
const LogLevelNames = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR"
};

/**
 * ANSI color codes for console output
 */
const Colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m"
};

/**
 * Enhanced Logger
 */
class Logger {
  constructor(options = {}) {
    this.botName = options.botName || "Bot";
    this.level = this._parseLogLevel(options.level || "info");
    this.logFile = options.logFile || null;
    this.logChat = options.logChat !== false;
    this.logEvents = options.logEvents !== false;
    this.useColors = options.useColors !== false;
    this.includeTimestamp = options.includeTimestamp !== false;

    this.fileStream = null;

    // Initialize file logging if specified
    if (this.logFile) {
      this._initFileLogging();
    }
  }

  /**
   * Parse log level from string
   */
  _parseLogLevel(level) {
    const levelStr = level.toUpperCase();
    return LogLevel[levelStr] !== undefined ? LogLevel[levelStr] : LogLevel.INFO;
  }

  /**
   * Initialize file logging
   */
  _initFileLogging() {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      this.fileStream = fs.createWriteStream(this.logFile, { flags: "a" });
      this.info(`[Logger] File logging initialized: ${this.logFile}`);
    } catch (err) {
      console.error(`[Logger] Failed to initialize file logging: ${err.message}`);
      this.fileStream = null;
    }
  }

  /**
   * Get current timestamp
   */
  _getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Format log message
   */
  _formatMessage(level, message, meta = {}) {
    const parts = [];

    if (this.includeTimestamp) {
      parts.push(this._getTimestamp());
    }

    parts.push(`[${this.botName}]`);
    parts.push(`[${LogLevelNames[level]}]`);
    parts.push(message);

    if (Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }

    return parts.join(" ");
  }

  /**
   * Format colored console message
   */
  _formatColoredMessage(level, message, meta = {}) {
    if (!this.useColors) {
      return this._formatMessage(level, message, meta);
    }

    const timestamp = this.includeTimestamp
      ? `${Colors.gray}${this._getTimestamp()}${Colors.reset} `
      : "";

    let levelColor;
    switch (level) {
      case LogLevel.DEBUG:
        levelColor = Colors.cyan;
        break;
      case LogLevel.INFO:
        levelColor = Colors.green;
        break;
      case LogLevel.WARN:
        levelColor = Colors.yellow;
        break;
      case LogLevel.ERROR:
        levelColor = Colors.red;
        break;
      default:
        levelColor = Colors.white;
    }

    const levelName = `${levelColor}${Colors.bright}[${LogLevelNames[level]}]${Colors.reset}`;
    const botName = `${Colors.blue}[${this.botName}]${Colors.reset}`;

    const metaStr = Object.keys(meta).length > 0
      ? ` ${Colors.dim}${JSON.stringify(meta)}${Colors.reset}`
      : "";

    return `${timestamp}${botName} ${levelName} ${message}${metaStr}`;
  }

  /**
   * Write to log file
   */
  _writeToFile(message) {
    if (this.fileStream && this.fileStream.writable) {
      this.fileStream.write(message + "\n");
    }
  }

  /**
   * Log message with specific level
   */
  _log(level, message, meta = {}) {
    if (level < this.level) {
      return; // Below minimum log level
    }

    // Console output
    const coloredMessage = this._formatColoredMessage(level, message, meta);
    const plainMessage = this._formatMessage(level, message, meta);

    switch (level) {
      case LogLevel.ERROR:
        console.error(coloredMessage);
        break;
      case LogLevel.WARN:
        console.warn(coloredMessage);
        break;
      default:
        console.log(coloredMessage);
    }

    // File output (without colors)
    this._writeToFile(plainMessage);
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    this._log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    this._log(LogLevel.INFO, message, meta);
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    this._log(LogLevel.WARN, message, meta);
  }

  /**
   * Error level logging
   */
  error(message, meta = {}) {
    this._log(LogLevel.ERROR, message, meta);
  }

  /**
   * Log chat message
   */
  chat(username, message) {
    if (!this.logChat) return;

    const formatted = `${Colors.magenta}<${username}>${Colors.reset} ${message}`;
    console.log(
      `${this.includeTimestamp ? Colors.gray + this._getTimestamp() + Colors.reset + " " : ""}` +
      `${Colors.blue}[${this.botName}]${Colors.reset} ${formatted}`
    );

    this._writeToFile(`[${this.botName}] CHAT <${username}> ${message}`);
  }

  /**
   * Log game event
   */
  event(eventName, data = {}) {
    if (!this.logEvents) return;

    this.debug(`Event: ${eventName}`, data);
  }

  /**
   * Set log level
   */
  setLevel(level) {
    this.level = this._parseLogLevel(level);
    this.info(`Log level set to: ${LogLevelNames[this.level]}`);
  }

  /**
   * Create child logger with specific context
   */
  child(context) {
    return new Logger({
      botName: `${this.botName}:${context}`,
      level: LogLevelNames[this.level].toLowerCase(),
      logFile: this.logFile,
      logChat: this.logChat,
      logEvents: this.logEvents,
      useColors: this.useColors,
      includeTimestamp: this.includeTimestamp
    });
  }

  /**
   * Close file stream
   */
  close() {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }
}

/**
 * Global logger manager
 */
class LoggerManager {
  constructor() {
    this.loggers = new Map();
    this.globalOptions = {
      level: "info",
      logFile: null,
      logChat: true,
      logEvents: true,
      useColors: true,
      includeTimestamp: true
    };
  }

  /**
   * Set global logging options
   */
  setGlobalOptions(options) {
    Object.assign(this.globalOptions, options);
  }

  /**
   * Create or get logger for bot
   */
  getLogger(botName, options = {}) {
    if (this.loggers.has(botName)) {
      return this.loggers.get(botName);
    }

    const logger = new Logger({
      botName,
      ...this.globalOptions,
      ...options
    });

    this.loggers.set(botName, logger);
    return logger;
  }

  /**
   * Remove logger
   */
  removeLogger(botName) {
    const logger = this.loggers.get(botName);
    if (logger) {
      logger.close();
      this.loggers.delete(botName);
    }
  }

  /**
   * Close all loggers
   */
  closeAll() {
    this.loggers.forEach(logger => logger.close());
    this.loggers.clear();
  }

  /**
   * Get all logger names
   */
  getLoggerNames() {
    return Array.from(this.loggers.keys());
  }
}

// Global logger manager instance
const loggerManager = new LoggerManager();

/**
 * Create logger for bot
 */
function createLogger(botName, options = {}) {
  return loggerManager.getLogger(botName, options);
}

/**
 * Configure global logging
 */
function configureLogging(options) {
  loggerManager.setGlobalOptions(options);
}

module.exports = {
  Logger,
  LoggerManager,
  LogLevel,
  LogLevelNames,
  createLogger,
  configureLogging,
  loggerManager
};
