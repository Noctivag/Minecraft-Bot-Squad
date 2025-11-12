const EventEmitter = require('events');
const path = require('path');
const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');

// Import bot plugin
const BotPlugin = require('../plugin');

class BotLauncher extends EventEmitter {
  constructor(settings) {
    super();
    this.settings = settings;
    this.bots = new Map();
    this.logs = [];
    this.maxLogs = 1000;
  }

  // Update settings
  updateSettings(settings) {
    this.settings = settings;
    this.log('info', 'Settings updated');
  }

  // Log message
  log(level, message, botName = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      bot: botName
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.emit('log', logEntry);
  }

  // Get logs
  getLogs(botName = null) {
    if (botName) {
      return this.logs.filter(log => log.bot === botName);
    }
    return this.logs;
  }

  // Clear logs
  clearLogs(botName = null) {
    if (botName) {
      this.logs = this.logs.filter(log => log.bot !== botName);
    } else {
      this.logs = [];
    }
    return true;
  }

  // Create bot instance
  async createBot(botConfig) {
    const { name, role } = botConfig;
    const { server } = this.settings;

    this.log('info', `Creating bot: ${name} (${role})`, name);

    try {
      // Create mineflayer bot
      const bot = mineflayer.createBot({
        host: server.host,
        port: server.port,
        username: name,
        version: server.version,
        auth: server.auth,
        hideErrors: false
      });

      // Load pathfinder
      bot.loadPlugin(pathfinder);

      // Track bot instance
      const botInstance = {
        name,
        role,
        bot,
        status: 'connecting',
        health: 0,
        food: 0,
        position: { x: 0, y: 0, z: 0 },
        dimension: 'overworld',
        inventory: [],
        experience: 0,
        deaths: 0,
        startTime: Date.now(),
        lastUpdate: Date.now()
      };

      this.bots.set(name, botInstance);

      // Setup bot event handlers
      this.setupBotHandlers(botInstance);

      // Initialize bot plugin with settings
      await this.initializeBotPlugin(botInstance);

      return botInstance;
    } catch (error) {
      this.log('error', `Failed to create bot ${name}: ${error.message}`, name);
      throw error;
    }
  }

  // Setup bot event handlers
  setupBotHandlers(botInstance) {
    const { bot, name } = botInstance;

    bot.on('spawn', () => {
      botInstance.status = 'online';
      this.log('success', `${name} spawned in the world`, name);
      this.emitStatus();
    });

    bot.on('chat', (username, message) => {
      if (this.settings.behavior.chatMessages) {
        this.log('chat', `[${username}] ${message}`, name);
      }
    });

    bot.on('health', () => {
      botInstance.health = bot.health;
      botInstance.food = bot.food;
      this.emitStatus();
    });

    bot.on('move', () => {
      if (bot.entity) {
        botInstance.position = bot.entity.position;
      }
    });

    bot.on('experience', () => {
      botInstance.experience = bot.experience.points;
    });

    bot.on('death', () => {
      botInstance.deaths++;
      this.log('warning', `${name} died! Deaths: ${botInstance.deaths}`, name);

      if (this.settings.behavior.reconnectOnDeath) {
        setTimeout(() => {
          if (this.bots.has(name)) {
            this.log('info', `Respawning ${name}...`, name);
          }
        }, this.settings.behavior.reconnectDelay);
      }

      this.emitStatus();
    });

    bot.on('kicked', (reason) => {
      this.log('error', `${name} was kicked: ${reason}`, name);
      botInstance.status = 'kicked';
      this.emitStatus();
    });

    bot.on('error', (error) => {
      this.log('error', `${name} error: ${error.message}`, name);
    });

    bot.on('end', () => {
      this.log('info', `${name} disconnected`, name);
      botInstance.status = 'offline';
      this.emitStatus();
    });

    // Update status periodically
    setInterval(() => {
      botInstance.lastUpdate = Date.now();
      this.updateBotStats(botInstance);
    }, 1000);
  }

  // Initialize bot plugin with features based on settings
  async initializeBotPlugin(botInstance) {
    const { bot, name, role } = botInstance;

    try {
      // Wait for spawn
      await new Promise((resolve, reject) => {
        bot.once('spawn', resolve);
        bot.once('error', reject);
        bot.once('end', reject);
        setTimeout(() => reject(new Error('Spawn timeout')), 30000);
      });

      // Create plugin configuration
      const config = {
        name,
        role,
        settings: this.settings
      };

      // Load bot plugin
      const plugin = BotPlugin.plugin;
      if (typeof plugin === 'function') {
        plugin(bot, config);
        this.log('success', `Plugin loaded for ${name}`, name);
      }

      // Configure features based on settings
      this.configureBotFeatures(botInstance);

    } catch (error) {
      this.log('error', `Failed to initialize plugin for ${name}: ${error.message}`, name);
      throw error;
    }
  }

  // Configure bot features based on settings
  configureBotFeatures(botInstance) {
    const { bot, name } = botInstance;
    const { features } = this.settings;

    // Enable/disable features
    if (bot.combat && features.combat) {
      bot.combat.enabled = features.combat.enabled;
      bot.combat.difficulty = features.combat.difficulty;
    }

    if (bot.building && features.building) {
      bot.building.enabled = features.building.enabled;
      bot.building.autoExpand = features.building.autoExpand;
    }

    if (bot.mining && features.mining) {
      bot.mining.enabled = features.mining.enabled;
      bot.mining.stripMining = features.mining.stripMining;
    }

    if (bot.pvp && features.pvp) {
      bot.pvp.enabled = features.pvp.enabled;
      bot.pvp.combatMode = features.pvp.combatMode;
    }

    if (bot.minigames && features.minigames) {
      bot.minigames.enabled = features.minigames.enabled;
      bot.minigames.autoDetect = features.minigames.autoDetect;
    }

    this.log('info', `Features configured for ${name}`, name);
  }

  // Update bot statistics
  updateBotStats(botInstance) {
    const { bot } = botInstance;

    if (bot.entity) {
      botInstance.position = {
        x: Math.round(bot.entity.position.x),
        y: Math.round(bot.entity.position.y),
        z: Math.round(bot.entity.position.z)
      };
    }

    botInstance.health = bot.health || 0;
    botInstance.food = bot.food || 0;
    botInstance.experience = bot.experience?.points || 0;

    // Get inventory summary
    if (bot.inventory) {
      botInstance.inventory = bot.inventory.items().slice(0, 10).map(item => ({
        name: item.name,
        count: item.count
      }));
    }

    // Detect dimension
    if (bot.game) {
      botInstance.dimension = bot.game.dimension || 'overworld';
    }
  }

  // Start all enabled bots
  async startAll() {
    this.log('info', 'Starting all enabled bots...');

    const enabledBots = this.settings.bots.filter(bot => bot.enabled);

    for (const botConfig of enabledBots) {
      try {
        await this.startBot(botConfig.name);
        // Delay between bot starts to avoid connection spam
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.log('error', `Failed to start ${botConfig.name}: ${error.message}`, botConfig.name);
      }
    }

    this.log('success', `Started ${enabledBots.length} bots`);
  }

  // Stop all bots
  async stopAll() {
    this.log('info', 'Stopping all bots...');

    const stopPromises = Array.from(this.bots.keys()).map(name => this.stopBot(name));
    await Promise.all(stopPromises);

    this.log('success', 'All bots stopped');
  }

  // Start individual bot
  async startBot(botName) {
    // Check if already running
    if (this.bots.has(botName)) {
      const botInstance = this.bots.get(botName);
      if (botInstance.status !== 'offline') {
        this.log('warning', `${botName} is already running`, botName);
        return;
      }
    }

    // Find bot config
    const botConfig = this.settings.bots.find(b => b.name === botName);
    if (!botConfig) {
      throw new Error(`Bot ${botName} not found in configuration`);
    }

    if (!botConfig.enabled) {
      throw new Error(`Bot ${botName} is disabled in settings`);
    }

    await this.createBot(botConfig);
  }

  // Stop individual bot
  async stopBot(botName) {
    const botInstance = this.bots.get(botName);
    if (!botInstance) {
      this.log('warning', `${botName} not found`, botName);
      return;
    }

    this.log('info', `Stopping ${botName}...`, botName);

    try {
      botInstance.bot.quit();
      this.bots.delete(botName);
      this.log('success', `${botName} stopped`, botName);
      this.emitStatus();
    } catch (error) {
      this.log('error', `Error stopping ${botName}: ${error.message}`, botName);
    }
  }

  // Get status of all bots
  getStatus() {
    const bots = Array.from(this.bots.values()).map(botInstance => ({
      name: botInstance.name,
      role: botInstance.role,
      status: botInstance.status,
      health: botInstance.health,
      food: botInstance.food,
      position: botInstance.position,
      dimension: botInstance.dimension,
      experience: botInstance.experience,
      deaths: botInstance.deaths,
      uptime: Date.now() - botInstance.startTime,
      inventory: botInstance.inventory
    }));

    return {
      running: this.bots.size > 0,
      count: this.bots.size,
      bots
    };
  }

  // Emit status update
  emitStatus() {
    this.emit('status-update', this.getStatus());
  }
}

module.exports = BotLauncher;
