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
const HumanBehavior = require("./behaviors/humanBehavior");
const IdleBehavior = require("./behaviors/idleBehavior");
const ChatSystem = require("./behaviors/chatSystem");
const { teamCoordinator } = require("../coordination/teamCoordinator");
const { realtimeCoordinator } = require("../coordination/realtimeCoordinator");
const advancedCoordination = require("../coordination/advancedCoordination");
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

  // Initialize NEW enhanced systems
  logger.debug("Initializing enhanced systems (human behavior, idle, chat)");
  bot.capabilities = capabilities; // Make capabilities accessible
  const humanBehavior = new HumanBehavior(bot);
  const idleBehavior = new IdleBehavior(bot);
  const chatSystem = new ChatSystem(bot);

  // Register with coordinators
  logger.debug("Registering with team coordinators");
  teamCoordinator.registerBot(name, bot, capabilities);
  realtimeCoordinator.registerBot(name, bot);
  advancedCoordination.registerBot(bot);

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

    // Original systems
    combat,
    farming,
    building,
    perception,
    inventory,

    // NEW enhanced systems
    humanBehavior,
    idleBehavior,
    chatSystem,

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

        // Nutze menschliches Bewegungsverhalten
        const goal = new goals.GoalBlock(
          resource.position.x,
          resource.position.y,
          resource.position.z
        );

        await humanBehavior.moveWithVariation(goal, bot.pathfinder);

        // Warte auf Ankunft
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!bot.pathfinder.isMoving()) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 15000);
        });

        const block = bot.blockAt(resource.position);
        if (block && block.name === resourceType) {
          // Nutze menschliches Dig-Verhalten
          await humanBehavior.digBlock(block, bot.pathfinder);

          logger.info(`Mined ${resourceType}`);

          // Teile Ressource mit anderen Bots
          advancedCoordination.shareResource(name, resourceType, resource.position, 1);

          // Kommentiere Fund
          if (Math.random() < 0.4) {
            await chatSystem.commentOnActivity('found_resource', { resource: resourceType });
          }

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
      advancedCoordination.requestHelp(name, reason, urgency);
    },

    shareResource(resourceType, position, amount) {
      realtimeCoordinator.shareResource(name, resourceType, position, amount);
      advancedCoordination.shareResource(name, resourceType, position, amount);
    },

    // Erweiterte Koordinations-Methoden
    async createGroup(objective, requiredBots = 2) {
      logger.info(`Creating group for: ${objective}`);
      const groupId = await advancedCoordination.createGroup(objective, requiredBots, name);
      return groupId;
    },

    async executeGroupObjective(groupId) {
      await advancedCoordination.executeGroupObjective(groupId);
    },

    getAvailableResources() {
      return advancedCoordination.getAvailableResources(name);
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
        inventory: inventory.getInventoryReport(),
        // NEW enhanced systems status
        humanBehavior: humanBehavior.getStats(),
        idleBehavior: idleBehavior.getStatus(),
        chatSystem: chatSystem.getStatus(),
        coordination: advancedCoordination.getStatus()
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

      // Gelegentlich menschliches Idle-Verhalten zeigen
      if (Math.random() < 0.1) {
        await humanBehavior.performIdleHumanBehavior();
      }

      // Gelegentlich umschauen (natürliches Verhalten)
      if (Math.random() < 0.15) {
        await humanBehavior.lookAround();
      }

      // Check for assigned tasks
      const botData = teamCoordinator.bots.get(name);
      if (botData?.currentTask) {
        // Stoppe Idle-Verhalten während Tasks
        if (idleBehavior.isActive) {
          idleBehavior.stop();
        }
        await this.executeTask(botData.currentTask);
        return;
      }

      // Auto-deposit if inventory full
      if (inventory.isInventoryFull()) {
        if (idleBehavior.isActive) {
          idleBehavior.stop();
        }
        await inventory.autoDeposit();
        return;
      }

      // Check for danger
      const summary = perception.getSummary();
      if (summary.dangerLevel > 30) {
        // Stoppe Idle während Gefahr
        if (idleBehavior.isActive) {
          idleBehavior.stop();
        }

        // Combat mode
        if (combat.combatMode !== "passive") {
          logger.warn(`Danger detected (level ${summary.dangerLevel}), entering combat mode`);
        }

        // Kommentiere Gefahr
        if (Math.random() < 0.3) {
          await chatSystem.commentOnActivity('combat', { dangerLevel: summary.dangerLevel });
        }
      } else {
        // Look for opportunities
        const opportunities = perception.detectOpportunities();

        if (opportunities.length > 0) {
          const opp = opportunities[0];

          if (opp.type === "mining" && capabilities.includes("mining")) {
            // Stoppe Idle für Mining
            if (idleBehavior.isActive) {
              idleBehavior.stop();
            }

            // Kommentiere Mining-Aktivität
            if (Math.random() < 0.3) {
              await chatSystem.commentOnActivity('mining', { resource: opp.resource });
            }

            // Mine nearby resource
            await this.mineResource(opp.resource);
            return;
          } else if (opp.type === "farming" && capabilities.includes("farming")) {
            if (idleBehavior.isActive) {
              idleBehavior.stop();
            }

            if (Math.random() < 0.3) {
              await chatSystem.commentOnActivity('farming');
            }
          }
        }

        // Keine Tasks und keine Gefahren - starte Idle-Verhalten
        if (!idleBehavior.isActive) {
          logger.debug("No tasks assigned, starting idle behavior");
          idleBehavior.start();
        }
      }

      // Gelegentliche zufällige Pause
      if (Math.random() < 0.05) {
        await humanBehavior.takeRandomPause();
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

      // Nutze advancedCoordination für Hilfe
      await advancedCoordination.requestHelp(message.data.from, message.data.reason, message.data.urgency);
    }
  });

  realtimeCoordinator.on("danger_alert", (message) => {
    if (message.data.severity >= 8) {
      logger.warn(`High danger alert from ${message.data.from}: ${message.data.dangerType}`, {
        severity: message.data.severity
      });

      // Reagiere mit Chat
      if (Math.random() < 0.5) {
        setTimeout(() => {
          enhancedBot.bot.chat(`Vorsicht! ${message.data.from} meldet Gefahr!`);
        }, 1000 + Math.random() * 2000);
      }
    }
  });

  realtimeCoordinator.on("resource_found", (message) => {
    logger.info(`${message.data.finder} found ${message.data.resourceType}`, {
      position: message.data.position
    });

    // Reagiere mit Chat
    if (Math.random() < 0.3) {
      setTimeout(() => {
        const responses = [
          `Gut gemacht, ${message.data.finder}!`,
          `Nice Fund, ${message.data.finder}!`,
          `Super, ${message.data.finder}!`
        ];
        enhancedBot.bot.chat(responses[Math.floor(Math.random() * responses.length)]);
      }, 500 + Math.random() * 1500);
    }
  });

  // Erweiterte Koordinations-Events
  bot.on('health', () => {
    // Bei niedriger Gesundheit Hilfe anfordern
    if (bot.health < 6 && bot.health > 0) {
      advancedCoordination.requestHelp(name, 'Low health, need assistance!', 8);
    }
  });

  bot.on('playerJoined', (player) => {
    // Nutze ChatSystem für Begrüßung (wird dort automatisch gehandhabt)
    logger.info(`${player.username} joined the server`);
  });

  bot.on('playerLeft', (player) => {
    logger.info(`${player.username} left the server`);
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
