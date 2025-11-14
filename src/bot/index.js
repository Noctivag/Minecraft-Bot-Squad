/**
 * Bot Module - Central export for all bot-related functionality
 * Provides unified access to authentication, networking, reconnection, logging, and configuration
 */

// Authentication
const {
  AuthType,
  createAuthConfig,
  validateAuthCredentials,
  getAuthInfo,
  createSecureBotConfig,
  MicrosoftAuthHelper
} = require("./authentication");

// Configuration
const {
  ConfigManager,
  loadConfig,
  DEFAULT_CONFIG
} = require("./config");

// Logging
const {
  Logger,
  LoggerManager,
  LogLevel,
  LogLevelNames,
  createLogger,
  configureLogging,
  loggerManager
} = require("./logger");

// Reconnection
const {
  ReconnectManager,
  setupReconnect,
  ReconnectErrorType
} = require("./reconnect");

// Server Network
const {
  ServerNetworkManager,
  attachServerNetwork
} = require("./serverNetwork");

/**
 * Create a fully configured bot with all enhanced features
 */
async function createEnhancedBot(options) {
  const {
    username,
    config,
    onSpawn,
    onError,
    ...otherOptions
  } = options;

  const mineflayer = require("mineflayer");

  // Use provided config or create from options
  const botConfig = config
    ? config.createBotConfig(username)
    : otherOptions;

  // Create logger
  const logger = createLogger(username, config?.get("logging"));

  logger.info("Creating enhanced bot...");
  logger.debug("Bot configuration", { host: botConfig.host, port: botConfig.port });

  try {
    // Create bot
    const bot = mineflayer.createBot(botConfig);

    // Attach logger to bot
    bot.logger = logger;

    // Set up event logging
    bot.on("message", (message) => {
      const text = message.toString();
      if (message.json && message.json.extra) {
        // Try to parse username from chat message
        const extra = message.json.extra;
        if (extra.length > 0 && extra[0].text) {
          const match = extra[0].text.match(/<(.+)>/);
          if (match) {
            logger.chat(match[1], extra.slice(1).map(e => e.text).join(""));
            return;
          }
        }
      }
      logger.info(text);
    });

    bot.on("error", (err) => {
      logger.error("Bot error", { error: err.message });
      if (onError) onError(err);
    });

    bot.on("spawn", () => {
      logger.info("Bot spawned", {
        position: bot.entity.position,
        gameMode: bot.game.gameMode
      });
      if (onSpawn) onSpawn();
    });

    bot.on("death", () => {
      logger.warn("Bot died");
    });

    bot.on("respawn", () => {
      logger.info("Bot respawned");
    });

    bot.on("kicked", (reason) => {
      logger.error("Bot kicked", { reason });
    });

    bot.on("login", () => {
      logger.info("Bot logged in successfully");
    });

    // Set up server network if configured
    if (config) {
      const networkConfig = config.createNetworkConfig(username);
      if (networkConfig) {
        attachServerNetwork(bot, networkConfig);
        logger.info("Server network configured", {
          targetServer: networkConfig.targetServer
        });
      }

      // Set up reconnection
      const reconnectConfig = config.createReconnectConfig();
      if (reconnectConfig.enabled) {
        const reconnectManager = setupReconnect(
          bot,
          () => createEnhancedBot(options),
          reconnectConfig
        );

        bot.reconnectManager = reconnectManager;
        logger.info("Reconnection configured", {
          maxAttempts: reconnectConfig.maxAttempts,
          baseDelay: reconnectConfig.baseDelayMs
        });
      }
    }

    return bot;

  } catch (err) {
    logger.error("Failed to create bot", { error: err.message });
    throw err;
  }
}

module.exports = {
  // Bot creation
  createEnhancedBot,

  // Authentication
  AuthType,
  createAuthConfig,
  validateAuthCredentials,
  getAuthInfo,
  createSecureBotConfig,
  MicrosoftAuthHelper,

  // Configuration
  ConfigManager,
  loadConfig,
  DEFAULT_CONFIG,

  // Logging
  Logger,
  LoggerManager,
  LogLevel,
  LogLevelNames,
  createLogger,
  configureLogging,
  loggerManager,

  // Reconnection
  ReconnectManager,
  setupReconnect,
  ReconnectErrorType,

  // Server Network
  ServerNetworkManager,
  attachServerNetwork
};
