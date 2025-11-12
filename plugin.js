/**
 * MINECRAFT BOT SQUAD - MAIN PLUGIN
 * The ultimate autonomous bot plugin for Minecraft
 *
 * Features:
 * - Beat the game (Nether, End, Ender Dragon)
 * - Collect all items
 * - Build beautiful structures
 * - Create redstone contraptions
 * - Fully autonomous operation
 */

const { createEnhancedAgent } = require("./src/agents/enhancedAgent");
const { EndGameSystem } = require("./src/gameProgression/endGameSystem");
const { ItemCollectionSystem } = require("./src/gameProgression/itemCollectionSystem");
const { AchievementSystem } = require("./src/gameProgression/achievementSystem");
const { AdvancedBuildingSystem } = require("./src/agents/behaviors/advancedBuildingSystem");
const { RedstoneSystem } = require("./src/agents/behaviors/redstoneSystem");
const { StorageManager } = require("./src/agents/behaviors/storageManager");
const { BaseExpansion } = require("./src/agents/behaviors/baseExpansion");
const { systemOptimizer } = require("./src/utils/optimizer");
const { teamCoordinator } = require("./src/coordination/teamCoordinator");

class MinecraftBotSquadPlugin {
  constructor(config = {}) {
    this.config = {
      serverHost: config.host || process.env.MC_HOST || "localhost",
      serverPort: config.port || process.env.MC_PORT || 25565,
      botCount: config.botCount || 5,
      autoStart: config.autoStart !== false,
      enableOptimizations: config.enableOptimizations !== false,
      gameGoal: config.gameGoal || "beat_game", // Options: beat_game, collect_all, build_base, automate_all
      ...config
    };

    this.bots = [];
    this.isRunning = false;
  }

  /**
   * Initialize the plugin
   */
  async initialize() {
    console.log("\n" + "=".repeat(70));
    console.log("  🤖 MINECRAFT BOT SQUAD PLUGIN");
    console.log("  The Ultimate Autonomous Bot System");
    console.log("=".repeat(70) + "\n");

    // Initialize optimizations
    if (this.config.enableOptimizations) {
      systemOptimizer.initialize();
      console.log("✅ Performance optimizations enabled\n");
    }

    // Create bot squad
    console.log(`Creating ${this.config.botCount} bots...\n`);

    const botConfigs = this.generateBotConfigs();

    for (const botConfig of botConfigs) {
      try {
        const bot = await this.createBot(botConfig);
        this.bots.push(bot);

        console.log(`✅ ${botConfig.name} online (${botConfig.role})`);

        await new Promise(resolve => setTimeout(resolve, 3000)); // Stagger spawns

      } catch (err) {
        console.error(`❌ Failed to create ${botConfig.name}:`, err.message);
      }
    }

    console.log(`\n✅ ${this.bots.length}/${this.config.botCount} bots created successfully!\n`);

    // Start monitoring
    if (this.config.enableOptimizations) {
      systemOptimizer.startMonitoring(5);
    }

    this.isRunning = true;
    return true;
  }

  /**
   * Generate bot configurations with roles
   */
  generateBotConfigs() {
    const roles = [
      { name: "Alex", role: "Leader", capabilities: ["mining", "building", "combat"], priority: "game_progression" },
      { name: "Blaze", role: "Builder", capabilities: ["building", "farming"], priority: "building" },
      { name: "Cora", role: "Miner", capabilities: ["mining", "combat"], priority: "mining" },
      { name: "Dune", role: "Explorer", capabilities: ["mining", "combat", "farming"], priority: "exploration" },
      { name: "Eli", role: "Farmer", capabilities: ["farming", "building"], priority: "farming" },
      { name: "Fiona", role: "Redstone Engineer", capabilities: ["building"], priority: "redstone" },
      { name: "Gabe", role: "Collector", capabilities: ["mining", "farming", "combat"], priority: "collection" },
      { name: "Hope", role: "Decorator", capabilities: ["building"], priority: "decoration" }
    ];

    return roles.slice(0, this.config.botCount).map(role => ({
      ...role,
      host: this.config.serverHost,
      port: this.config.serverPort
    }));
  }

  /**
   * Create an enhanced bot with all systems
   */
  async createBot(config) {
    // Create enhanced agent
    const bot = await createEnhancedAgent(config);

    // Add game progression system
    bot.endGame = new EndGameSystem(bot.bot, config.name);

    // Add item collection system
    bot.itemCollection = new ItemCollectionSystem(bot.bot, config.name);

    // Add achievement tracking system
    bot.achievements = new AchievementSystem(bot.bot, config.name);

    // Replace building system with advanced version
    bot.building = new AdvancedBuildingSystem(bot.bot, config.name);

    // Add redstone system
    bot.redstone = new RedstoneSystem(bot.bot, config.name);

    // Add storage management system
    bot.storage = new StorageManager(bot.bot, config.name);

    // Add base expansion system
    bot.baseExpansion = new BaseExpansion(bot.bot, config.name, bot.building);

    // Add role and priority
    bot.role = config.role;
    bot.priority = config.priority;

    // Start autonomous mode based on role
    this.setupRoleBasedBehavior(bot);

    return bot;
  }

  /**
   * Setup role-based autonomous behavior
   */
  setupRoleBasedBehavior(bot) {
    bot.startAutonomousMode(5000);

    // Override autonomous tick for role-specific behavior
    const originalTick = bot.autonomousTick.bind(bot);

    bot.autonomousTick = async function() {
      // Call original tick
      await originalTick();

      // Auto-detect achievement completions
      if (Math.random() > 0.9) {
        bot.achievements.autoDetectCompletions();
      }

      // Check and restock storage periodically
      if (Math.random() > 0.95) {
        const tasks = await bot.storage.getRestockingTasks();
        if (tasks.length > 0) {
          console.log(`[${bot.name}] Storage needs restocking: ${tasks.length} items low`);
        }
      }

      // Role-specific behaviors
      switch (bot.priority) {
        case "game_progression":
          // Game progression and achievements
          await bot.endGame.assessGameStage();
          const milestone = bot.endGame.getNextMilestone();
          if (milestone) {
            console.log(`[${bot.name}] Next milestone: ${milestone.id}`);
          }

          // Work on achievements
          const achievement = bot.achievements.getPriorityAchievement();
          if (achievement && Math.random() > 0.98) {
            console.log(`[${bot.name}] Working on: ${achievement.name}`);
          }
          break;

        case "collection":
          // Item collection
          bot.itemCollection.updateCollectedItems();
          const nextItem = bot.itemCollection.getNextItemGoal();
          if (nextItem && Math.random() > 0.95) {
            console.log(`[${bot.name}] Targeting: ${nextItem.item}`);
          }

          // Deposit excess items to storage
          if (bot.bot.inventory.items().length > 30) {
            await bot.storage.depositItems();
          }
          break;

        case "building":
          // Base expansion
          if (Math.random() > 0.98) {
            await bot.baseExpansion.autoExpand();
          }
          break;

        case "redstone":
          // Focus on automation and storage organization
          if (Math.random() > 0.97) {
            await bot.storage.organizeStorage();
          }
          break;

        case "farming":
          // Already handled by farming system
          // But also manage food storage
          const foodItems = bot.bot.inventory.items().filter(i =>
            i.name.includes("cooked") || i.name.includes("bread")
          );
          if (foodItems.length > 10) {
            await bot.storage.depositItems(foodItems);
          }
          break;

        case "decoration":
          // Build decorative elements
          if (Math.random() > 0.98) {
            const decorativePlots = Array.from(bot.baseExpansion.cityGrid.values())
              .filter(p => !p.occupied && p.district === "decorative");

            if (decorativePlots.length > 0) {
              const plot = decorativePlots[0];
              await bot.baseExpansion.buildStructureAtPlot("fountain", plot);
            }
          }
          break;
      }
    };
  }

  /**
   * Command: Build structure
   */
  async buildStructure(botName, structureType, position) {
    const bot = this.bots.find(b => b.name === botName);
    if (!bot) {
      console.log(`Bot ${botName} not found`);
      return false;
    }

    console.log(`[${botName}] Building ${structureType}...`);

    try {
      const success = await bot.building.buildFromBlueprint(structureType, position);

      if (success) {
        console.log(`[${botName}] ✅ ${structureType} completed!`);
      } else {
        console.log(`[${botName}] ❌ Failed to build ${structureType}`);
      }

      return success;

    } catch (err) {
      console.error(`[${botName}] Build error:`, err.message);
      return false;
    }
  }

  /**
   * Command: Build redstone contraption
   */
  async buildRedstone(botName, contraptionType, position) {
    const bot = this.bots.find(b => b.name === botName);
    if (!bot) {
      console.log(`Bot ${botName} not found`);
      return false;
    }

    console.log(`[${botName}] Building ${contraptionType}...`);

    const methods = {
      "item_sorter": () => bot.redstone.buildItemSorter(position),
      "auto_smelter": () => bot.redstone.buildAutoSmelter(position),
      "mob_grinder": () => bot.redstone.buildMobGrinder(position),
      "auto_farm": () => bot.redstone.buildAutoHarvester(position),
      "piston_door": () => bot.redstone.buildPistonDoor(position),
      "elevator": () => bot.redstone.buildElevator(position),
      "animal_farm": () => bot.redstone.buildAnimalFarm(position)
    };

    const buildMethod = methods[contraptionType];
    if (!buildMethod) {
      console.log(`Unknown contraption: ${contraptionType}`);
      return false;
    }

    return await buildMethod();
  }

  /**
   * Command: Show progress
   */
  showProgress(botName = null) {
    if (botName) {
      const bot = this.bots.find(b => b.name === botName);
      if (bot) {
        this.printBotProgress(bot);
      }
    } else {
      // Show all bots
      console.log("\n" + "=".repeat(70));
      console.log("  📊 SQUAD PROGRESS REPORT");
      console.log("=".repeat(70));

      this.bots.forEach(bot => {
        this.printBotProgress(bot);
      });

      console.log("=".repeat(70) + "\n");
    }
  }

  /**
   * Print individual bot progress
   */
  printBotProgress(bot) {
    const gameProgress = bot.endGame.getProgressionStatus();
    const itemStats = bot.itemCollection.getCollectionStats();

    console.log(`\n${bot.name} (${bot.role})`);
    console.log(`  Game Stage: ${gameProgress.currentStage} (${gameProgress.progressPercent.toFixed(1)}%)`);
    console.log(`  Items: ${itemStats.collected}/${itemStats.total} (${itemStats.percentage}%)`);
    console.log(`  Milestones: ${gameProgress.completedMilestones}`);
    console.log(`  Next Goal: ${gameProgress.nextMilestone}`);
  }

  /**
   * Command: List available buildings
   */
  listBuildings() {
    console.log("\n📐 Available Buildings:");

    const bot = this.bots[0];
    if (bot) {
      const blueprints = bot.building.listBlueprints();

      const grouped = {};
      for (const bp of blueprints) {
        const category = bp.id.includes("house") ? "Houses" :
                        bp.id.includes("farm") ? "Farms" :
                        bp.id.includes("redstone") ? "Redstone" : "Utility";

        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(bp);
      }

      for (const [category, items] of Object.entries(grouped)) {
        console.log(`\n  ${category}:`);
        items.forEach(bp => {
          console.log(`    - ${bp.name} (${bp.size.x}x${bp.size.y}x${bp.size.z})`);
        });
      }
    }

    console.log("");
  }

  /**
   * Command: List redstone contraptions
   */
  listRedstone() {
    console.log("\n⚙️  Available Redstone Contraptions:");
    console.log("  - item_sorter: Automatic item sorting system");
    console.log("  - auto_smelter: Automatic furnace array");
    console.log("  - mob_grinder: Mob farm and grinder");
    console.log("  - auto_farm: Automatic crop harvester");
    console.log("  - piston_door: Hidden piston entrance");
    console.log("  - elevator: Water elevator");
    console.log("  - animal_farm: Automatic animal breeder\n");
  }

  /**
   * Command: Assign task to bot
   */
  assignTask(botName, taskType, taskData) {
    const bot = this.bots.find(b => b.name === botName);
    if (!bot) {
      console.log(`Bot ${botName} not found`);
      return false;
    }

    const taskId = teamCoordinator.addTask(taskType, taskData, 8, bot.capabilities);

    console.log(`[${botName}] Assigned task: ${taskType} (ID: ${taskId})`);
    return taskId;
  }

  /**
   * Command: Initialize base at location
   */
  async initializeBase(botName, position = null) {
    const bot = this.bots.find(b => b.name === botName);
    if (!bot) {
      console.log(`Bot ${botName} not found`);
      return false;
    }

    console.log(`[${botName}] Initializing base...`);
    const baseCenter = await bot.baseExpansion.initializeBase(position);

    // Discover storage in area
    await bot.storage.discoverStorage(baseCenter);

    console.log(`[${botName}] Base initialized at ${baseCenter.x}, ${baseCenter.y}, ${baseCenter.z}`);
    return baseCenter;
  }

  /**
   * Command: Expand base
   */
  async expandBase(botName) {
    const bot = this.bots.find(b => b.name === botName);
    if (!bot) {
      console.log(`Bot ${botName} not found`);
      return false;
    }

    console.log(`[${botName}] Executing base expansion...`);
    return await bot.baseExpansion.executeExpansionPhase();
  }

  /**
   * Command: Show achievements
   */
  showAchievements(botName = null) {
    if (botName) {
      const bot = this.bots.find(b => b.name === botName);
      if (bot) {
        this.printAchievements(bot);
      }
    } else {
      // Show achievements from leader bot
      const leader = this.bots.find(b => b.priority === "game_progression");
      if (leader) {
        this.printAchievements(leader);
      }
    }
  }

  /**
   * Print achievement progress
   */
  printAchievements(bot) {
    const stats = bot.achievements.getStats();

    console.log("\n" + "=".repeat(70));
    console.log("  🏆 ACHIEVEMENT PROGRESS");
    console.log("=".repeat(70));
    console.log(`\nOverall: ${stats.completed}/${stats.total} (${stats.percent}%)\n`);

    for (const [category, data] of Object.entries(stats.byCategory)) {
      const percent = ((data.completed / data.total) * 100).toFixed(0);
      console.log(`${category.toUpperCase()}: ${data.completed}/${data.total} (${percent}%)`);
    }

    console.log("\nNext to complete:");
    const next = bot.achievements.getNextAchievement();
    if (next) {
      console.log(`  📌 ${next.name}`);
      console.log(`     ${next.description}`);
    }

    console.log("=".repeat(70) + "\n");
  }

  /**
   * Command: Show storage status
   */
  async showStorage(botName = null) {
    const bot = botName ? this.bots.find(b => b.name === botName) : this.bots[0];
    if (!bot) {
      console.log("No bots available");
      return;
    }

    console.log("\n" + "=".repeat(70));
    console.log("  📦 STORAGE STATUS");
    console.log("=".repeat(70));

    const stockLevels = await bot.storage.checkStockLevels();
    if (!stockLevels) {
      console.log("\nStorage check on cooldown...\n");
      return;
    }

    for (const [category, items] of Object.entries(stockLevels)) {
      console.log(`\n${category.toUpperCase()}:`);

      for (const [itemName, status] of Object.entries(items)) {
        const statusIcon = status.status === "stocked" ? "✅" :
                          status.status === "low" ? "⚠️" : "❌";

        console.log(`  ${statusIcon} ${itemName}: ${status.current}/${status.ideal}`);
      }
    }

    console.log("\n" + "=".repeat(70) + "\n");
  }

  /**
   * Command: Show base expansion progress
   */
  showBaseProgress(botName = null) {
    const bot = botName ? this.bots.find(b => b.name === botName) :
                         this.bots.find(b => b.priority === "building");

    if (!bot) {
      console.log("No builder bot available");
      return;
    }

    const progress = bot.baseExpansion.getProgress();

    console.log("\n" + "=".repeat(70));
    console.log("  🏗️  BASE EXPANSION PROGRESS");
    console.log("=".repeat(70));
    console.log(`\nPhase: ${progress.currentPhase}/${progress.totalPhases} (${progress.completionPercent}%)`);
    console.log(`Structures Built: ${progress.structuresBuilt}`);

    console.log("\nDistricts:");
    for (const district of progress.districts) {
      console.log(`  ${district.name}: ${district.structures.length} structures`);
    }

    console.log("=".repeat(70) + "\n");
  }

  /**
   * Stop all bots
   */
  async shutdown() {
    console.log("\n🛑 Shutting down bot squad...");

    for (const bot of this.bots) {
      bot.stopAutonomousMode();
      bot.bot.quit();
      console.log(`✅ ${bot.name} disconnected`);
    }

    this.isRunning = false;
    console.log("\n✅ All bots shut down successfully\n");
  }

  /**
   * Get plugin status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      botCount: this.bots.length,
      bots: this.bots.map(b => ({
        name: b.name,
        role: b.role,
        health: b.bot.health,
        position: b.bot.entity?.position
      }))
    };
  }
}

module.exports = { MinecraftBotSquadPlugin };

// CLI interface if run directly
if (require.main === module) {
  const plugin = new MinecraftBotSquadPlugin({
    botCount: process.env.BOT_COUNT || 5
  });

  plugin.initialize().then(() => {
    console.log("\n🎮 Bot Squad is running!");
    console.log("\nCommands:");
    console.log("  Ctrl+C - Shutdown");
    console.log("  Type 'progress' to see status\n");

    // Handle commands from stdin
    process.stdin.on("data", async (data) => {
      const command = data.toString().trim();

      if (command === "progress") {
        plugin.showProgress();
      } else if (command === "buildings") {
        plugin.listBuildings();
      } else if (command === "redstone") {
        plugin.listRedstone();
      } else if (command === "status") {
        console.log(plugin.getStatus());
      } else if (command === "achievements") {
        plugin.showAchievements();
      } else if (command === "storage") {
        await plugin.showStorage();
      } else if (command === "base") {
        plugin.showBaseProgress();
      } else if (command === "expand") {
        const builder = plugin.bots.find(b => b.priority === "building");
        if (builder) {
          await plugin.expandBase(builder.name);
        }
      } else if (command === "help") {
        console.log("\n📋 Available Commands:");
        console.log("  progress      - Show bot progress");
        console.log("  achievements  - Show achievement progress");
        console.log("  storage       - Show storage status");
        console.log("  base          - Show base expansion progress");
        console.log("  buildings     - List available buildings");
        console.log("  redstone      - List redstone contraptions");
        console.log("  expand        - Execute next base expansion phase");
        console.log("  status        - Show plugin status");
        console.log("  help          - Show this help message");
        console.log("  Ctrl+C        - Shutdown\n");
      }
    });

    // Handle shutdown
    process.on("SIGINT", async () => {
      await plugin.shutdown();
      process.exit(0);
    });
  }).catch(err => {
    console.error("Failed to initialize plugin:", err);
    process.exit(1);
  });
}
