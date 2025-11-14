/**
 * Enhanced Agent - Next-level bot with all advanced systems integrated
 * Now includes: Server network support, authentication, improved reconnection, and logging
 */

const mineflayer = require("mineflayer");
const { pathfinder } = require("mineflayer-pathfinder");
const { CombatSystem } = require("./behaviors/combatSystem");
const { FarmingSystem } = require("./behaviors/farmingSystem");
const { BuildingSystem } = require("./behaviors/buildingSystem");
const { PerceptionSystem } = require("./behaviors/perceptionSystem");
const { InventoryManager } = require("./behaviors/inventoryManager");
const { teamCoordinator } = require("../coordination/teamCoordinator");
const { realtimeCoordinator } = require("../coordination/realtimeCoordinator");
const { logEvent } = require("../memory/store");
const { attachAgentRuntime } = require("./agentRuntime");
const {
  createLogger,
  attachServerNetwork,
  setupReconnect,
  createSecureBotConfig,
  AuthType
} = require("../bot");

/**
 * Create an enhanced bot with all next-level features
 */
async function createEnhancedAgent(config) {
  const {
    name,
    host = "localhost",
    port = 25565,
    username = name,
    capabilities = ["mining", "building", "farming", "combat"],
    authType = AuthType.OFFLINE,
    credentials = {},
    backendServer = null,
    autoJoinBackend = true,
    reconnectOptions = { enabled: true }
  } = config;

  // Create logger
  const logger = createLogger(name);
  logger.info(`Creating enhanced agent with capabilities: ${capabilities.join(", ")}`);

  // Create secure bot configuration
  let botConfig;
  try {
    botConfig = createSecureBotConfig({
      host,
      port,
      username,
      authType,
      credentials,
      version: false // Auto-detect
    });
  } catch (err) {
    logger.error(`Failed to create bot config: ${err.message}`);
    throw err;
  }

  // Create bot
  const bot = mineflayer.createBot(botConfig);
  bot.logger = logger;

  // Set up server network if backend server specified
  if (backendServer) {
    logger.info(`Configuring backend server join: ${backendServer}`);
    attachServerNetwork(bot, {
      name,
      targetServer: backendServer,
      autoJoinServer: autoJoinBackend
    });
  }

  // Wait for spawn
  await new Promise((resolve, reject) => {
    bot.once("spawn", () => {
      logger.info("Bot spawned successfully", {
        position: bot.entity?.position,
        gameMode: bot.game?.gameMode
      });
      resolve();
    });
    bot.once("error", (err) => {
      logger.error(`Spawn error: ${err.message}`);
      reject(err);
    });
    setTimeout(() => reject(new Error("Spawn timeout")), 30000);
  });

  // Load pathfinder
  bot.loadPlugin(pathfinder);

  // Attach base runtime
  attachAgentRuntime(bot, name);

  // Initialize advanced systems
  logger.debug("Initializing behavior systems");
  const combat = new CombatSystem(bot, name);
  const farming = new FarmingSystem(bot, name);
  const building = new BuildingSystem(bot, name);
  const perception = new PerceptionSystem(bot, name);
  const inventory = new InventoryManager(bot, name);

  // Register with coordinators
  logger.debug("Registering with team coordinators");
  teamCoordinator.registerBot(name, bot, capabilities);
  realtimeCoordinator.registerBot(name, bot);

  // Set up reconnection if enabled
  if (reconnectOptions.enabled) {
    const reconnectManager = setupReconnect(
      bot,
      () => createEnhancedAgent(config),
      reconnectOptions
    );
    bot.reconnectManager = reconnectManager;
    logger.info("Reconnection enabled");
  }

  // Create enhanced bot interface
  const enhancedBot = {
    bot,
    name,
    capabilities,
    logger,

    // Systems
    combat,
    farming,
    building,
    perception,
    inventory,

    // Convenience methods
    async executeTask(taskId) {
      const task = teamCoordinator.taskQueue.find(t => t.id === taskId);
      if (!task) {
        logger.warn(`Task ${taskId} not found`);
        return false;
      }

      logger.info(`Executing task: ${task.type}`, { taskId, data: task.data });

      try {
        let result = false;

        switch (task.type) {
          case "mine":
            // Mining task
            result = await this.mineResource(task.data.resource, task.data.amount);
            break;

          case "build":
            // Building task
            result = await building.buildFromBlueprint(
              task.data.blueprint,
              task.data.origin
            );
            break;

          case "farm":
            // Farming task
            if (task.data.action === "plant") {
              await farming.plantSeeds(task.data.farmId, task.data.seedType);
              result = true;
            } else if (task.data.action === "harvest") {
              result = await farming.harvestCrops(task.data.farmId) > 0;
            }
            break;

          case "patrol":
            // Set up guard patrol
            combat.setGuardMode(task.data.position, task.data.radius);
            result = true;
            break;

          case "collect":
            // Collect items
            result = await farming.collectProducts(task.data.productType) > 0;
            break;

          case "deposit":
            // Deposit items
            result = await inventory.depositItems();
            break;

          default:
            logger.warn(`Unknown task type: ${task.type}`);
            result = false;
        }

        if (result) {
          teamCoordinator.completeTask(taskId, { success: true });
          logger.info("Task completed successfully", { taskId, type: task.type });
        } else {
          teamCoordinator.failTask(taskId, "Execution failed");
          logger.warn("Task execution failed", { taskId, type: task.type });
        }

        return result;

      } catch (err) {
        logger.error(`Task execution error: ${err.message}`, { taskId, type: task.type });
        teamCoordinator.failTask(taskId, err.message);
        return false;
      }
    },

    async mineResource(resourceType, amount = 1) {
      logger.info(`Mining ${amount}x ${resourceType}`);

      const resource = perception.findNearestResource(resourceType);
      if (!resource) {
        logger.warn(`${resourceType} not found nearby`);
        return false;
      }

      try {
        const { goals } = require("mineflayer-pathfinder");
        await bot.pathfinder.goto(new goals.GoalBlock(
          resource.position.x,
          resource.position.y,
          resource.position.z
        ));

        const block = bot.blockAt(resource.position);
        if (block && block.name === resourceType) {
          await bot.dig(block);
          logger.info(`Mined ${resourceType}`);

          logEvent(name, "mining", { resource: resourceType });
          return true;
        }

        return false;

      } catch (err) {
        logger.error(`Mining failed: ${err.message}`);
        return false;
      }
    },

    requestHelp(reason, urgency = 5) {
      realtimeCoordinator.requestHelp(name, reason, urgency);
    },

    shareResource(resourceType, position, amount) {
      realtimeCoordinator.shareResource(name, resourceType, position, amount);
    },

    getStatus() {
      return {
        name,
        capabilities,
        position: bot.entity?.position,
        health: bot.health,
        food: bot.food,
        combat: combat.getStatus(),
        farming: farming.getStatus(),
        building: building.getStatus(),
        perception: perception.getSummary(),
        inventory: inventory.getInventoryReport()
      };
    },

    // Autonomous behavior loop
    async autonomousTick() {
      // Update heartbeat
      realtimeCoordinator.heartbeat(name);
      teamCoordinator.updateBotStatus(name, {
        position: bot.entity?.position,
        health: bot.health
      });

      // Check for assigned tasks
      const botData = teamCoordinator.bots.get(name);
      if (botData?.currentTask) {
        await this.executeTask(botData.currentTask);
        return;
      }

      // Auto-deposit if inventory full
      if (inventory.isInventoryFull()) {
        await inventory.autoDeposit();
      }

      // Check for danger
      const summary = perception.getSummary();
      if (summary.dangerLevel > 30) {
        // Combat mode
        if (combat.combatMode !== "passive") {
          logger.warn(`Danger detected (level ${summary.dangerLevel}), entering combat mode`);
        }
      } else {
        // Look for opportunities
        const opportunities = perception.detectOpportunities();

        if (opportunities.length > 0) {
          const opp = opportunities[0];

          if (opp.type === "mining" && capabilities.includes("mining")) {
            // Mine nearby resource
            await this.mineResource(opp.resource);
          }
        }
      }
    },

    startAutonomousMode(intervalMs = 5000) {
      logger.info(`Starting autonomous mode (tick every ${intervalMs}ms)`);

      const autonomousInterval = setInterval(async () => {
        try {
          await this.autonomousTick();
        } catch (err) {
          logger.error(`Autonomous tick error: ${err.message}`);
        }
      }, intervalMs);

      // Store interval for cleanup
      this.autonomousInterval = autonomousInterval;
    },

    stopAutonomousMode() {
      if (this.autonomousInterval) {
        clearInterval(this.autonomousInterval);
        logger.info("Stopped autonomous mode");
      }
    }
  };

  // Set up coordination event handlers
  realtimeCoordinator.on("help_request", async (message) => {
    if (message.data.from === name) return;

    // Check if we can help
    const botData = teamCoordinator.bots.get(name);
    if (botData?.status === "idle" && message.data.urgency >= 7) {
      logger.info(`Responding to help request from ${message.data.from}`, {
        urgency: message.data.urgency
      });
      realtimeCoordinator.respondToHelp(name, message.data.from, true);
    }
  });

  realtimeCoordinator.on("danger_alert", (message) => {
    if (message.data.severity >= 8) {
      logger.warn(`High danger alert from ${message.data.from}: ${message.data.dangerType}`, {
        severity: message.data.severity
      });
      // Could implement retreat logic here
    }
  });

  realtimeCoordinator.on("resource_found", (message) => {
    logger.info(`${message.data.finder} found ${message.data.resourceType}`, {
      position: message.data.position
    });
    // Could navigate to shared resource location
  });

  logEvent(name, "agent", { action: "created", capabilities });

  return enhancedBot;
}

/**
 * Create a full squad of enhanced bots
 */
async function createEnhancedSquad(squadConfig) {
  const {
    host = "localhost",
    port = 25565,
    bots = [],
    authType = AuthType.OFFLINE,
    credentials = {},
    backendServer = null,
    autoJoinBackend = true,
    reconnectOptions = { enabled: true },
    staggerDelay = 2000
  } = squadConfig;

  const squadLogger = createLogger("Squad");
  squadLogger.info(`Creating squad with ${bots.length} bots`);

  const squad = [];

  for (const botConfig of bots) {
    try {
      squadLogger.info(`Creating bot: ${botConfig.name}`);

      const bot = await createEnhancedAgent({
        ...botConfig,
        host,
        port,
        authType: botConfig.authType || authType,
        credentials: botConfig.credentials || credentials,
        backendServer: botConfig.backendServer || backendServer,
        autoJoinBackend: botConfig.autoJoinBackend !== undefined ? botConfig.autoJoinBackend : autoJoinBackend,
        reconnectOptions: botConfig.reconnectOptions || reconnectOptions
      });

      squad.push(bot);

      // Stagger bot creation to avoid overwhelming server
      if (staggerDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, staggerDelay));
      }

    } catch (err) {
      squadLogger.error(`Failed to create bot ${botConfig.name}: ${err.message}`);
    }
  }

  squadLogger.info(`Created ${squad.length}/${bots.length} bots successfully`);

  // Start all bots in autonomous mode
  squad.forEach(bot => {
    bot.startAutonomousMode();
  });

  return squad;
}

module.exports = {
  createEnhancedAgent,
  createEnhancedSquad
};
