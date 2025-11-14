/**
 * Authentication Module - Handles Microsoft and Mojang account authentication
 * Provides secure login for bots with proper account credentials
 */

/**
 * Authentication types supported
 */
const AuthType = {
  OFFLINE: "offline",      // No authentication (cracked servers)
  MICROSOFT: "microsoft",  // Microsoft account (required for most servers)
  MOJANG: "mojang"        // Legacy Mojang account (deprecated but still supported)
};

/**
 * Create authentication configuration for bot
 */
function createAuthConfig(authType, credentials = {}) {
  const config = {
    version: false, // Auto-detect version
    hideErrors: false
  };

  switch (authType) {
    case AuthType.OFFLINE:
      // No auth required for offline/cracked servers
      config.auth = "offline";
      break;

    case AuthType.MICROSOFT:
      // Microsoft account authentication
      config.auth = "microsoft";

      // For Microsoft auth, we need to use mineflayer's built-in authentication
      // The user needs to provide a Microsoft account token or use interactive auth
      if (credentials.microsoftAccount) {
        config.microsoftAccount = credentials.microsoftAccount;
      }

      // Optional: Cache directory for auth tokens
      if (credentials.authCacheDir) {
        config.authCacheDir = credentials.authCacheDir;
      }

      break;

    case AuthType.MOJANG:
      // Legacy Mojang account (email + password)
      config.auth = "mojang";

      if (credentials.password) {
        config.password = credentials.password;
      }

      break;

    default:
      console.warn(`Unknown auth type: ${authType}, defaulting to offline`);
      config.auth = "offline";
  }

  return config;
}

/**
 * Validate authentication credentials
 */
function validateAuthCredentials(authType, credentials) {
  switch (authType) {
    case AuthType.OFFLINE:
      return { valid: true };

    case AuthType.MICROSOFT:
      if (!credentials.microsoftAccount && !credentials.authCacheDir) {
        return {
          valid: false,
          error: "Microsoft authentication requires either microsoftAccount or authCacheDir"
        };
      }
      return { valid: true };

    case AuthType.MOJANG:
      if (!credentials.password) {
        return {
          valid: false,
          error: "Mojang authentication requires password"
        };
      }
      return { valid: true };

    default:
      return {
        valid: false,
        error: `Unknown authentication type: ${authType}`
      };
  }
}

/**
 * Get authentication info for logging (without sensitive data)
 */
function getAuthInfo(authConfig) {
  return {
    type: authConfig.auth || "offline",
    hasMicrosoftAccount: !!authConfig.microsoftAccount,
    hasPassword: !!authConfig.password,
    authCacheDir: authConfig.authCacheDir || null
  };
}

/**
 * Create a secure bot configuration with authentication
 */
function createSecureBotConfig(baseConfig) {
  const {
    host,
    port = 25565,
    username,
    authType = AuthType.OFFLINE,
    credentials = {},
    ...otherOptions
  } = baseConfig;

  // Validate credentials
  const validation = validateAuthCredentials(authType, credentials);
  if (!validation.valid) {
    throw new Error(`Authentication validation failed: ${validation.error}`);
  }

  // Create auth config
  const authConfig = createAuthConfig(authType, credentials);

  // Merge configurations
  const botConfig = {
    host,
    port,
    username,
    ...authConfig,
    ...otherOptions
  };

  return botConfig;
}

/**
 * Authentication helper for Microsoft accounts
 * Provides user-friendly interface for Microsoft auth
 */
class MicrosoftAuthHelper {
  constructor(cacheDirPath = "./auth_cache") {
    this.cacheDirPath = cacheDirPath;
  }

  /**
   * Create Microsoft auth configuration with cache
   */
  createAuthConfig(accountOptions = {}) {
    return {
      authCacheDir: this.cacheDirPath,
      ...accountOptions
    };
  }

  /**
   * Check if cached authentication exists
   */
  hasCachedAuth() {
    const fs = require("fs");
    const path = require("path");

    if (!fs.existsSync(this.cacheDirPath)) {
      return false;
    }

    const files = fs.readdirSync(this.cacheDirPath);
    return files.length > 0;
  }

  /**
   * Clear cached authentication
   */
  clearCache() {
    const fs = require("fs");
    const path = require("path");

    if (fs.existsSync(this.cacheDirPath)) {
      const files = fs.readdirSync(this.cacheDirPath);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.cacheDirPath, file));
      });
      console.log(`[Auth] Cleared authentication cache: ${this.cacheDirPath}`);
    }
  }
}

module.exports = {
  AuthType,
  createAuthConfig,
  validateAuthCredentials,
  getAuthInfo,
  createSecureBotConfig,
  MicrosoftAuthHelper
};
