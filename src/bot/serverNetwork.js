/**
 * Server Network Module - Handles backend server joins in proxy networks
 * Supports BungeeCord and Velocity proxy networks
 */

class ServerNetworkManager {
  constructor(bot, options = {}) {
    this.bot = bot;
    this.botName = options.name || bot.username;
    this.targetServer = options.targetServer || null;
    this.autoJoinServer = options.autoJoinServer !== false;
    this.joinDelay = options.joinDelay || 2000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000;

    this.currentServer = null;
    this.hasJoinedBackend = false;
    this.retryCount = 0;
    this.joinTimeout = null;

    this._setupEventListeners();
  }

  /**
   * Set up event listeners for server network handling
   */
  _setupEventListeners() {
    // Listen for spawn event to join backend server
    this.bot.once("spawn", () => {
      if (this.targetServer && this.autoJoinServer) {
        console.log(`[${this.botName}] Spawned on proxy, joining backend server: ${this.targetServer}`);
        this._scheduleBackendJoin();
      }
    });

    // Listen for chat messages to detect server switches
    this.bot.on("message", (message) => {
      this._handleServerMessage(message.toString());
    });

    // Listen for system messages (JSON format)
    this.bot.on("systemMessage", (message) => {
      this._handleServerMessage(message.toString());
    });
  }

  /**
   * Schedule backend server join after delay
   */
  _scheduleBackendJoin() {
    if (this.joinTimeout) {
      clearTimeout(this.joinTimeout);
    }

    this.joinTimeout = setTimeout(() => {
      this.joinBackendServer(this.targetServer);
    }, this.joinDelay);
  }

  /**
   * Handle server-related messages
   */
  _handleServerMessage(message) {
    const msg = message.toLowerCase();

    // Detect successful server switch
    if (msg.includes("connected to") ||
        msg.includes("verbunden mit") ||
        msg.includes("you have been connected to") ||
        msg.includes("sending you to")) {

      const serverMatch = message.match(/(?:to|mit)\s+(\w+)/i);
      if (serverMatch) {
        this.currentServer = serverMatch[1];
        this.hasJoinedBackend = true;
        this.retryCount = 0;
        console.log(`[${this.botName}] Successfully joined backend server: ${this.currentServer}`);
      }
    }

    // Detect server join failures
    if (msg.includes("can't connect to server") ||
        msg.includes("server not found") ||
        msg.includes("server offline") ||
        msg.includes("unable to connect")) {

      console.warn(`[${this.botName}] Failed to join backend server: ${this.targetServer}`);
      this._handleJoinFailure();
    }
  }

  /**
   * Join a backend server in a proxy network
   */
  async joinBackendServer(serverName) {
    if (!serverName) {
      console.error(`[${this.botName}] No server name provided`);
      return false;
    }

    try {
      console.log(`[${this.botName}] Attempting to join backend server: ${serverName}`);

      // Send server switch command
      this.bot.chat(`/server ${serverName}`);

      // Wait for confirmation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return true;
    } catch (err) {
      console.error(`[${this.botName}] Error joining backend server:`, err.message);
      this._handleJoinFailure();
      return false;
    }
  }

  /**
   * Handle backend server join failure
   */
  _handleJoinFailure() {
    this.retryCount++;

    if (this.retryCount < this.maxRetries) {
      console.log(`[${this.botName}] Retrying backend join (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms`);

      setTimeout(() => {
        this.joinBackendServer(this.targetServer);
      }, this.retryDelay);
    } else {
      console.error(`[${this.botName}] Failed to join backend server after ${this.maxRetries} attempts`);
    }
  }

  /**
   * Switch to a different backend server
   */
  async switchServer(serverName) {
    if (!serverName) {
      console.error(`[${this.botName}] No server name provided for switch`);
      return false;
    }

    console.log(`[${this.botName}] Switching from ${this.currentServer} to ${serverName}`);
    this.targetServer = serverName;
    this.hasJoinedBackend = false;
    this.retryCount = 0;

    return await this.joinBackendServer(serverName);
  }

  /**
   * Get current server information
   */
  getServerInfo() {
    return {
      currentServer: this.currentServer,
      targetServer: this.targetServer,
      hasJoinedBackend: this.hasJoinedBackend,
      retryCount: this.retryCount
    };
  }

  /**
   * Check if bot is on the target backend server
   */
  isOnTargetServer() {
    return this.hasJoinedBackend && this.currentServer === this.targetServer;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.joinTimeout) {
      clearTimeout(this.joinTimeout);
      this.joinTimeout = null;
    }
  }
}

/**
 * Create and attach server network manager to a bot
 */
function attachServerNetwork(bot, options = {}) {
  const manager = new ServerNetworkManager(bot, options);
  bot.serverNetwork = manager;
  return manager;
}

module.exports = {
  ServerNetworkManager,
  attachServerNetwork
};
