/**
 * Configuration System - Central configuration management for bot squads
 * Handles server settings, authentication, and network configurations
 */

const { AuthType, createAuthConfig } = require("./authentication");

/**
 * Default configuration template
 */
const DEFAULT_CONFIG = {
  server: {
    host: "localhost",
    port: 25565,
    version: false // Auto-detect
  },

  network: {
    isProxy: false,          // Is this a proxy network (BungeeCord/Velocity)?
    backendServer: null,     // Backend server to join after proxy
    autoJoinBackend: true,   // Automatically join backend server
    joinDelay: 2000,         // Delay before joining backend (ms)
    maxRetries: 3,           // Max retries for backend join
    retryDelay: 5000        // Delay between retries (ms)
  },

  authentication: {
    type: AuthType.OFFLINE,  // offline, microsoft, or mojang
    credentials: {}          // Auth credentials (see authentication.js)
  },

  reconnect: {
    enabled: true,
    baseDelayMs: 1000,       // Initial reconnect delay
    maxDelayMs: 60000,       // Maximum reconnect delay
    factor: 2,               // Exponential backoff factor
    jitter: true,            // Add random jitter to delays
    maxAttempts: -1          // -1 = unlimited
  },

  behavior: {
    autoRespawn: true,       // Auto-respawn on death
    sprintByDefault: false,  // Always sprint when moving
    digWithHandIfNoTool: false,  // Dig blocks even without proper tool
    hideErrors: false        // Hide connection errors
  },

  logging: {
    level: "info",           // debug, info, warn, error
    logChat: true,           // Log chat messages
    logEvents: true,         // Log important events
    logFile: null            // Optional log file path
  }
};

/**
 * Configuration Manager
 */
class ConfigManager {
  constructor(customConfig = {}) {
    this.config = this._mergeConfig(DEFAULT_CONFIG, customConfig);
  }

  /**
   * Deep merge configurations
   */
  _mergeConfig(defaultConfig, customConfig) {
    const merged = JSON.parse(JSON.stringify(defaultConfig)); // Deep clone

    for (const key in customConfig) {
      if (typeof customConfig[key] === "object" && !Array.isArray(customConfig[key]) && customConfig[key] !== null) {
        merged[key] = {
          ...(merged[key] || {}),
          ...customConfig[key]
        };
      } else {
        merged[key] = customConfig[key];
      }
    }

    return merged;
  }

  /**
   * Get configuration section
   */
  get(section) {
    return this.config[section] || null;
  }

  /**
   * Set configuration value
   */
  set(section, key, value) {
    if (!this.config[section]) {
      this.config[section] = {};
    }
    this.config[section][key] = value;
  }

  /**
   * Get full configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Create bot configuration from settings
   */
  createBotConfig(botName) {
    const serverConfig = this.config.server;
    const authConfig = this.config.authentication;
    const behaviorConfig = this.config.behavior;

    // Base configuration
    const botConfig = {
      host: serverConfig.host,
      port: serverConfig.port,
      username: botName,
      version: serverConfig.version,
      hideErrors: behaviorConfig.hideErrors
    };

    // Add authentication
    const auth = createAuthConfig(authConfig.type, authConfig.credentials);
    Object.assign(botConfig, auth);

    return botConfig;
  }

  /**
   * Create network configuration for server network manager
   */
  createNetworkConfig(botName) {
    const networkConfig = this.config.network;

    if (!networkConfig.isProxy) {
      return null; // No network configuration needed
    }

    return {
      name: botName,
      targetServer: networkConfig.backendServer,
      autoJoinServer: networkConfig.autoJoinBackend,
      joinDelay: networkConfig.joinDelay,
      maxRetries: networkConfig.maxRetries,
      retryDelay: networkConfig.retryDelay
    };
  }

  /**
   * Create reconnect configuration
   */
  createReconnectConfig() {
    return this.config.reconnect;
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Validate server config
    if (!this.config.server.host) {
      errors.push("Server host is required");
    }
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push("Server port must be between 1 and 65535");
    }

    // Validate network config
    if (this.config.network.isProxy && !this.config.network.backendServer) {
      errors.push("Backend server is required when isProxy is true");
    }

    // Validate auth config
    const validAuthTypes = Object.values(AuthType);
    if (!validAuthTypes.includes(this.config.authentication.type)) {
      errors.push(`Invalid authentication type. Must be one of: ${validAuthTypes.join(", ")}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Load configuration from JSON file
   */
  static loadFromFile(filePath) {
    const fs = require("fs");
    const path = require("path");

    try {
      const fullPath = path.resolve(filePath);
      const fileContent = fs.readFileSync(fullPath, "utf8");
      const customConfig = JSON.parse(fileContent);

      console.log(`[Config] Loaded configuration from: ${filePath}`);
      return new ConfigManager(customConfig);
    } catch (err) {
      if (err.code === "ENOENT") {
        console.warn(`[Config] Configuration file not found: ${filePath}, using defaults`);
        return new ConfigManager();
      }
      throw new Error(`Failed to load configuration: ${err.message}`);
    }
  }

  /**
   * Save configuration to JSON file
   */
  saveToFile(filePath) {
    const fs = require("fs");
    const path = require("path");

    try {
      const fullPath = path.resolve(filePath);
      const dirPath = path.dirname(fullPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(fullPath, JSON.stringify(this.config, null, 2), "utf8");
      console.log(`[Config] Saved configuration to: ${filePath}`);
      return true;
    } catch (err) {
      console.error(`[Config] Failed to save configuration: ${err.message}`);
      return false;
    }
  }

  /**
   * Create example configuration file
   */
  static createExampleConfig(filePath = "./bot-config.example.json") {
    const exampleConfig = {
      ...DEFAULT_CONFIG,
      _comment: "Example bot squad configuration. Copy to bot-config.json and customize.",
      server: {
        ...DEFAULT_CONFIG.server,
        host: "play.example.com",
        port: 25565
      },
      network: {
        ...DEFAULT_CONFIG.network,
        isProxy: true,
        backendServer: "survival"
      },
      authentication: {
        type: "microsoft",
        credentials: {
          authCacheDir: "./auth_cache",
          _note: "For Microsoft auth, the bot will prompt for login on first run"
        }
      }
    };

    const manager = new ConfigManager(exampleConfig);
    manager.saveToFile(filePath);
  }
}

/**
 * Load configuration from environment or file
 */
function loadConfig(options = {}) {
  const { configFile, envPrefix = "BOT_" } = options;

  let config;

  // Try to load from file first
  if (configFile) {
    config = ConfigManager.loadFromFile(configFile);
  } else {
    config = new ConfigManager();
  }

  // Override with environment variables
  if (process.env[`${envPrefix}HOST`]) {
    config.set("server", "host", process.env[`${envPrefix}HOST`]);
  }
  if (process.env[`${envPrefix}PORT`]) {
    config.set("server", "port", parseInt(process.env[`${envPrefix}PORT`]));
  }
  if (process.env[`${envPrefix}BACKEND_SERVER`]) {
    config.set("network", "isProxy", true);
    config.set("network", "backendServer", process.env[`${envPrefix}BACKEND_SERVER`]);
  }

  // Validate
  const validation = config.validate();
  if (!validation.valid) {
    console.error("[Config] Configuration validation failed:");
    validation.errors.forEach(err => console.error(`  - ${err}`));
    throw new Error("Invalid configuration");
  }

  return config;
}

module.exports = {
  ConfigManager,
  loadConfig,
  DEFAULT_CONFIG,
  AuthType
};
