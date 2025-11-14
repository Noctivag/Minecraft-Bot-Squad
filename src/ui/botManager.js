/**
 * Bot Manager - Integrates bot system with UI
 * Manages bot lifecycle and provides UI updates
 */

const { createEnhancedAgent } = require("../agents/enhancedAgent");
const { UIServer } = require("./server");
const { ConfigManager } = require("../bot/config");

class BotManager {
  constructor(options = {}) {
    this.bots = new Map();
    this.config = options.config || new ConfigManager();
    this.uiServer = null;
    this.defaultCapabilities = options.defaultCapabilities || ["mining", "building", "farming", "combat"];
  }

  /**
   * Initialize the bot manager with UI server
   */
  async init(uiOptions = {}) {
    this.uiServer = new UIServer({
      ...uiOptions,
      config: this.config
    });

    // Set up UI callbacks
    this.uiServer.onBotStart = async (name, options) => {
      await this.startBot(name, options);
    };

    this.uiServer.onBotStop = async (name) => {
      await this.stopBot(name);
    };

    await this.uiServer.start();
    console.log("[BotManager] UI Server initialized");
  }

  /**
   * Start a new bot
   */
  async startBot(name, options = {}) {
    if (this.bots.has(name)) {
      throw new Error(`Bot ${name} is already running`);
    }

    console.log(`[BotManager] Starting bot: ${name}`);

    try {
      // Get server config
      const serverConfig = this.config.get("server");
      const authConfig = this.config.get("authentication");
      const networkConfig = this.config.get("network");

      // Create bot configuration
      const botConfig = {
        name,
        host: serverConfig.host,
        port: serverConfig.port,
        username: name,
        capabilities: options.capabilities || this.defaultCapabilities,
        authType: authConfig.type,
        credentials: authConfig.credentials,
        backendServer: networkConfig.isProxy ? networkConfig.backendServer : null,
        autoJoinBackend: networkConfig.autoJoinBackend,
        reconnectOptions: this.config.get("reconnect")
      };

      // Create enhanced bot
      const bot = await createEnhancedAgent(botConfig);

      // Store bot
      this.bots.set(name, {
        bot,
        config: botConfig,
        startTime: Date.now()
      });

      // Register with UI server
      if (this.uiServer) {
        this.uiServer.registerBot(bot, name);
        this.uiServer.updateBot(name, {
          status: "online",
          capabilities: botConfig.capabilities,
          startTime: Date.now()
        });
      }

      // Set up task tracking
      this.setupTaskTracking(bot, name);

      console.log(`[BotManager] Bot ${name} started successfully`);

      return bot;
    } catch (err) {
      console.error(`[BotManager] Failed to start bot ${name}:`, err);

      if (this.uiServer) {
        this.uiServer.addLog({
          botName: name,
          level: "error",
          message: `Failed to start: ${err.message}`
        });
      }

      throw err;
    }
  }

  /**
   * Stop a bot
   */
  async stopBot(name) {
    const botData = this.bots.get(name);
    if (!botData) {
      throw new Error(`Bot ${name} is not running`);
    }

    console.log(`[BotManager] Stopping bot: ${name}`);

    try {
      botData.bot.quit("Stopped by manager");
      this.bots.delete(name);

      if (this.uiServer) {
        this.uiServer.updateBot(name, {
          status: "offline"
        });
        this.uiServer.addLog({
          botName: name,
          level: "info",
          message: "Bot stopped by manager"
        });
      }

      console.log(`[BotManager] Bot ${name} stopped successfully`);
    } catch (err) {
      console.error(`[BotManager] Error stopping bot ${name}:`, err);
      throw err;
    }
  }

  /**
   * Start multiple bots
   */
  async startBots(names, options = {}) {
    const results = [];

    for (const name of names) {
      try {
        const bot = await this.startBot(name, options);
        results.push({ name, success: true, bot });
      } catch (err) {
        results.push({ name, success: false, error: err.message });
      }

      // Add delay between bot starts to avoid rate limiting
      if (options.startDelay) {
        await this.sleep(options.startDelay);
      }
    }

    return results;
  }

  /**
   * Stop all bots
   */
  async stopAllBots() {
    const names = Array.from(this.bots.keys());
    const results = [];

    for (const name of names) {
      try {
        await this.stopBot(name);
        results.push({ name, success: true });
      } catch (err) {
        results.push({ name, success: false, error: err.message });
      }
    }

    return results;
  }

  /**
   * Get bot by name
   */
  getBot(name) {
    const botData = this.bots.get(name);
    return botData ? botData.bot : null;
  }

  /**
   * Get all bots
   */
  getAllBots() {
    return Array.from(this.bots.entries()).map(([name, data]) => ({
      name,
      bot: data.bot,
      config: data.config,
      startTime: data.startTime
    }));
  }

  /**
   * Set up task tracking for a bot
   */
  setupTaskTracking(bot, name) {
    // Track tasks from agent runtime
    if (bot.runtime && bot.runtime.taskQueue) {
      // Monitor task queue changes
      const originalAddTask = bot.runtime.taskQueue.add?.bind(bot.runtime.taskQueue);
      if (originalAddTask) {
        bot.runtime.taskQueue.add = (...args) => {
          const result = originalAddTask(...args);
          this.updateBotTasks(name);
          return result;
        };
      }

      // Periodic task updates
      setInterval(() => {
        this.updateBotTasks(name);
      }, 5000);
    }

    // Track behavior-specific tasks
    if (bot.behaviors) {
      Object.keys(bot.behaviors).forEach(behaviorName => {
        const behavior = bot.behaviors[behaviorName];
        if (behavior && behavior.on) {
          behavior.on("taskUpdate", () => {
            this.updateBotTasks(name);
          });
        }
      });
    }
  }

  /**
   * Update bot tasks in UI
   */
  updateBotTasks(name) {
    const botData = this.bots.get(name);
    if (!botData || !this.uiServer) return;

    const bot = botData.bot;
    const tasks = [];

    // Get tasks from runtime
    if (bot.runtime && bot.runtime.taskQueue) {
      const queueTasks = bot.runtime.taskQueue.tasks || [];
      queueTasks.forEach(task => {
        tasks.push({
          name: task.name || task.type || "Unknown Task",
          status: task.status || "pending",
          content: task.description || task.name
        });
      });
    }

    // Get current behavior state
    if (bot.currentBehavior) {
      tasks.push({
        name: `Current: ${bot.currentBehavior}`,
        status: "in-progress",
        content: bot.currentBehavior
      });
    }

    // Get mining tasks
    if (bot.mining && bot.mining.currentTask) {
      tasks.push({
        name: "Mining",
        status: "in-progress",
        content: `Mining ${bot.mining.currentTask.blockType || "block"}`
      });
    }

    // Get pathfinding state
    if (bot.pathfinder && bot.pathfinder.isMoving && bot.pathfinder.isMoving()) {
      tasks.push({
        name: "Moving",
        status: "in-progress",
        content: "Pathfinding to destination"
      });
    }

    this.uiServer.updateBotTasks(name, tasks);
  }

  /**
   * Send command to bot
   */
  async sendCommand(name, command) {
    const bot = this.getBot(name);
    if (!bot) {
      throw new Error(`Bot ${name} not found`);
    }

    // Execute command
    if (bot.chat) {
      bot.chat(command);
    }

    if (this.uiServer) {
      this.uiServer.addLog({
        botName: name,
        level: "info",
        message: `Command sent: ${command}`
      });
    }
  }

  /**
   * Shutdown bot manager
   */
  async shutdown() {
    console.log("[BotManager] Shutting down...");

    // Stop all bots
    await this.stopAllBots();

    // Stop UI server
    if (this.uiServer) {
      await this.uiServer.stop();
    }

    console.log("[BotManager] Shutdown complete");
  }

  // Utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BotManager };
