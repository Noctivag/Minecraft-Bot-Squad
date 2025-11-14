/**
 * Enhanced Reconnect System - Improved connection handling with better error handling
 * Supports automatic reconnection with exponential backoff and detailed logging
 */

const EventEmitter = require("events");

/**
 * Reconnect error types
 */
const ReconnectErrorType = {
  NETWORK: "network",
  AUTH: "authentication",
  KICKED: "kicked",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown"
};

/**
 * Enhanced Reconnect Manager
 */
class ReconnectManager extends EventEmitter {
  constructor(createBotFn, options = {}) {
    super();

    this.createBotFn = createBotFn;
    this.options = {
      baseDelayMs: options.baseDelayMs || 1000,
      maxDelayMs: options.maxDelayMs || 60000,
      factor: options.factor || 2,
      jitter: options.jitter !== false,
      maxAttempts: options.maxAttempts || -1, // -1 = unlimited
      enabled: options.enabled !== false,
      ...options
    };

    this.currentBot = null;
    this.attemptCount = 0;
    this.reconnecting = false;
    this.reconnectTimeout = null;
    this.lastError = null;
    this.totalReconnects = 0;
    this.successfulConnections = 0;

    // Statistics
    this.stats = {
      totalReconnects: 0,
      successfulReconnects: 0,
      failedReconnects: 0,
      lastReconnectTime: null,
      averageReconnectDelay: 0
    };
  }

  /**
   * Calculate next reconnect delay with exponential backoff
   */
  _calculateDelay() {
    const delay = Math.min(
      this.options.maxDelayMs,
      this.options.baseDelayMs * Math.pow(this.options.factor, this.attemptCount)
    );

    if (this.options.jitter) {
      // Add ±30% jitter
      const jitterRange = delay * 0.3;
      return Math.floor(delay + (Math.random() * jitterRange * 2 - jitterRange));
    }

    return delay;
  }

  /**
   * Classify error type
   */
  _classifyError(error) {
    const errorMessage = error?.message?.toLowerCase() || "";

    if (errorMessage.includes("econnrefused") || errorMessage.includes("enotfound") || errorMessage.includes("etimedout")) {
      return ReconnectErrorType.NETWORK;
    }

    if (errorMessage.includes("invalid credentials") || errorMessage.includes("authentication") || errorMessage.includes("session")) {
      return ReconnectErrorType.AUTH;
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      return ReconnectErrorType.TIMEOUT;
    }

    return ReconnectErrorType.UNKNOWN;
  }

  /**
   * Attach reconnect handlers to bot
   */
  attachToBot(bot, botName) {
    this.currentBot = bot;
    this.botName = botName;

    // Reset on successful connection
    bot.once("spawn", () => {
      this.attemptCount = 0;
      this.successfulConnections++;
      this.emit("connected", { botName, attempts: this.attemptCount });
      console.log(`[Reconnect] ${botName} connected successfully`);
    });

    // Handle disconnection
    bot.on("end", (reason) => {
      if (!this.options.enabled) {
        console.log(`[Reconnect] ${botName} disconnected (reconnect disabled)`);
        return;
      }

      console.warn(`[Reconnect] ${botName} disconnected: ${reason || "Unknown reason"}`);
      this._scheduleReconnect(ReconnectErrorType.NETWORK, reason);
    });

    // Handle kicks
    bot.on("kicked", (reason) => {
      const kickReason = typeof reason === "string" ? reason : JSON.stringify(reason);
      console.warn(`[Reconnect] ${botName} kicked: ${kickReason}`);

      this.lastError = { type: ReconnectErrorType.KICKED, reason: kickReason };
      this.emit("kicked", { botName, reason: kickReason });

      if (this.options.enabled) {
        // Check if kick is permanent (ban)
        const lowerReason = kickReason.toLowerCase();
        if (lowerReason.includes("banned") || lowerReason.includes("permanent")) {
          console.error(`[Reconnect] ${botName} permanently banned, not attempting reconnect`);
          this.emit("permanentBan", { botName, reason: kickReason });
          return;
        }

        this._scheduleReconnect(ReconnectErrorType.KICKED, kickReason);
      }
    });

    // Handle errors
    bot.on("error", (err) => {
      const errorType = this._classifyError(err);
      this.lastError = { type: errorType, error: err };

      console.error(`[Reconnect] ${botName} error (${errorType}):`, err.message);
      this.emit("error", { botName, error: err, errorType });

      // Auth errors should not trigger reconnect
      if (errorType === ReconnectErrorType.AUTH) {
        console.error(`[Reconnect] ${botName} authentication failed, please check credentials`);
        this.emit("authError", { botName, error: err });
        return;
      }
    });

    // Handle login success
    bot.on("login", () => {
      console.log(`[Reconnect] ${botName} logged in`);
      this.emit("login", { botName });
    });
  }

  /**
   * Schedule reconnection attempt
   */
  _scheduleReconnect(errorType, reason) {
    if (this.reconnecting) {
      console.log(`[Reconnect] ${this.botName} already reconnecting, skipping`);
      return;
    }

    // Check max attempts
    if (this.options.maxAttempts > 0 && this.attemptCount >= this.options.maxAttempts) {
      console.error(`[Reconnect] ${this.botName} max reconnect attempts (${this.options.maxAttempts}) reached`);
      this.emit("maxAttemptsReached", { botName: this.botName, attempts: this.attemptCount });
      return;
    }

    this.reconnecting = true;
    this.attemptCount++;
    this.totalReconnects++;

    const delay = this._calculateDelay();

    console.warn(
      `[Reconnect] ${this.botName} reconnecting in ${(delay / 1000).toFixed(1)}s ` +
      `(attempt ${this.attemptCount}${this.options.maxAttempts > 0 ? `/${this.options.maxAttempts}` : ""})`
    );

    this.emit("reconnectScheduled", {
      botName: this.botName,
      attempt: this.attemptCount,
      delay,
      errorType,
      reason
    });

    this.reconnectTimeout = setTimeout(() => {
      this._attemptReconnect();
    }, delay);
  }

  /**
   * Attempt to reconnect
   */
  async _attemptReconnect() {
    console.log(`[Reconnect] ${this.botName} attempting to reconnect...`);

    try {
      // Clean up old bot
      if (this.currentBot) {
        try {
          this.currentBot.removeAllListeners();
          if (this.currentBot.end) {
            this.currentBot.end();
          }
        } catch (err) {
          // Ignore cleanup errors
        }
      }

      // Create new bot
      const startTime = Date.now();
      const newBot = await this.createBotFn();
      const reconnectTime = Date.now() - startTime;

      // Update statistics
      this.stats.totalReconnects++;
      this.stats.successfulReconnects++;
      this.stats.lastReconnectTime = reconnectTime;
      this.stats.averageReconnectDelay =
        (this.stats.averageReconnectDelay * (this.stats.successfulReconnects - 1) + reconnectTime) /
        this.stats.successfulReconnects;

      // Attach handlers to new bot
      this.attachToBot(newBot, this.botName);

      this.emit("reconnected", {
        botName: this.botName,
        attempt: this.attemptCount,
        reconnectTime
      });

      console.log(`[Reconnect] ${this.botName} reconnected successfully after ${this.attemptCount} attempts`);

    } catch (err) {
      console.error(`[Reconnect] ${this.botName} reconnect failed:`, err.message);

      this.stats.failedReconnects++;
      this.emit("reconnectFailed", {
        botName: this.botName,
        attempt: this.attemptCount,
        error: err
      });

      // Schedule next attempt
      this.reconnecting = false;
      this._scheduleReconnect(this._classifyError(err), err.message);
    } finally {
      this.reconnecting = false;
    }
  }

  /**
   * Enable reconnection
   */
  enable() {
    this.options.enabled = true;
    console.log(`[Reconnect] ${this.botName} reconnection enabled`);
  }

  /**
   * Disable reconnection
   */
  disable() {
    this.options.enabled = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    console.log(`[Reconnect] ${this.botName} reconnection disabled`);
  }

  /**
   * Force immediate reconnect
   */
  forceReconnect() {
    console.log(`[Reconnect] ${this.botName} forcing immediate reconnect`);

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnecting = false;
    this.attemptCount = 0;
    this._scheduleReconnect(ReconnectErrorType.UNKNOWN, "Manual reconnect");
  }

  /**
   * Get reconnection statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentAttempt: this.attemptCount,
      isReconnecting: this.reconnecting,
      enabled: this.options.enabled,
      successfulConnections: this.successfulConnections,
      totalReconnects: this.totalReconnects
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.attemptCount = 0;
    this.stats = {
      totalReconnects: 0,
      successfulReconnects: 0,
      failedReconnects: 0,
      lastReconnectTime: null,
      averageReconnectDelay: 0
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.removeAllListeners();
  }
}

/**
 * Create and setup reconnect manager
 */
function setupReconnect(bot, createBotFn, options = {}) {
  const manager = new ReconnectManager(createBotFn, options);
  manager.attachToBot(bot, bot.username || "Bot");
  return manager;
}

module.exports = {
  ReconnectManager,
  setupReconnect,
  ReconnectErrorType
};
