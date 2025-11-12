/**
 * Enhanced Agent - Next-level bot with all advanced systems integrated
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

/**
 * Create an enhanced bot with all next-level features
 */
async function createEnhancedAgent(config) {
  const {
    name,
    host = "localhost",
    port = 25565,
    username = name,
    capabilities = ["mining", "building", "farming", "combat"]
  } = config;

  console.log(`[EnhancedAgent] Creating ${name} with capabilities: ${capabilities.join(", ")}`);

  // Create bot
  const bot = mineflayer.createBot({
    host,
    port,
    username,
    version: false // Auto-detect
  });

  // Wait for spawn
  await new Promise((resolve, reject) => {
    bot.once("spawn", resolve);
    bot.once("error", reject);
    setTimeout(() => reject(new Error("Spawn timeout")), 30000);
  });

  console.log(`[EnhancedAgent] ${name} spawned successfully`);

  // Load pathfinder
  bot.loadPlugin(pathfinder);

  // Attach base runtime
  attachAgentRuntime(bot, name);

  // Initialize advanced systems
  const combat = new CombatSystem(bot, name);
  const farming = new FarmingSystem(bot, name);
  const building = new BuildingSystem(bot, name);
  const perception = new PerceptionSystem(bot, name);
  const inventory = new InventoryManager(bot, name);

  // Register with coordinators
  teamCoordinator.registerBot(name, bot, capabilities);
  realtimeCoordinator.registerBot(name, bot);

  // Create enhanced bot interface
  const enhancedBot = {
    bot,
    name,
    capabilities,

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
        console.log(`[${name}] Task ${taskId} not found`);
        return false;
      }

      console.log(`[${name}] Executing task: ${task.type}`);

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
            console.log(`[${name}] Unknown task type: ${task.type}`);
            result = false;
        }

        if (result) {
          teamCoordinator.completeTask(taskId, { success: true });
        } else {
          teamCoordinator.failTask(taskId, "Execution failed");
        }

        return result;

      } catch (err) {
        console.error(`[${name}] Task execution error:`, err.message);
        teamCoordinator.failTask(taskId, err.message);
        return false;
      }
    },

    async mineResource(resourceType, amount = 1) {
      console.log(`[${name}] Mining ${amount}x ${resourceType}`);

      const resource = perception.findNearestResource(resourceType);
      if (!resource) {
        console.log(`[${name}] ${resourceType} not found nearby`);
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
          console.log(`[${name}] Mined ${resourceType}`);

          logEvent(name, "mining", { resource: resourceType });
          return true;
        }

        return false;

      } catch (err) {
        console.error(`[${name}] Mining failed:`, err.message);
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
          console.log(`[${name}] Danger detected (level ${summary.dangerLevel}), entering combat mode`);
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
      console.log(`[${name}] Starting autonomous mode (tick every ${intervalMs}ms)`);

      const autonomousInterval = setInterval(async () => {
        try {
          await this.autonomousTick();
        } catch (err) {
          console.error(`[${name}] Autonomous tick error:`, err.message);
        }
      }, intervalMs);

      // Store interval for cleanup
      this.autonomousInterval = autonomousInterval;
    },

    stopAutonomousMode() {
      if (this.autonomousInterval) {
        clearInterval(this.autonomousInterval);
        console.log(`[${name}] Stopped autonomous mode`);
      }
    }
  };

  // Set up coordination event handlers
  realtimeCoordinator.on("help_request", async (message) => {
    if (message.data.from === name) return;

    // Check if we can help
    const botData = teamCoordinator.bots.get(name);
    if (botData?.status === "idle" && message.data.urgency >= 7) {
      console.log(`[${name}] Responding to help request from ${message.data.from}`);
      realtimeCoordinator.respondToHelp(name, message.data.from, true);
    }
  });

  realtimeCoordinator.on("danger_alert", (message) => {
    if (message.data.severity >= 8) {
      console.log(`[${name}] High danger alert from ${message.data.from}: ${message.data.dangerType}`);
      // Could implement retreat logic here
    }
  });

  realtimeCoordinator.on("resource_found", (message) => {
    console.log(`[${name}] ${message.data.finder} found ${message.data.resourceType}`);
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
    bots = []
  } = squadConfig;

  const squad = [];

  for (const botConfig of bots) {
    try {
      const bot = await createEnhancedAgent({
        ...botConfig,
        host,
        port
      });

      squad.push(bot);

      // Stagger bot creation to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      console.error(`Failed to create bot ${botConfig.name}:`, err.message);
    }
  }

  console.log(`[EnhancedSquad] Created ${squad.length}/${bots.length} bots`);

  // Start all bots in autonomous mode
  squad.forEach(bot => bot.startAutonomousMode());

  return squad;
}

module.exports = {
  createEnhancedAgent,
  createEnhancedSquad
};
