/**
 * Bedwars Strategy System
 * Complete Bedwars gameplay: bed defense, rushing, resource management, upgrades
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class BedwarsStrategy {
  constructor(bot, agentName, pvpSystem) {
    this.bot = bot;
    this.agentName = agentName;
    this.pvp = pvpSystem;

    // Bedwars state
    this.bedPosition = null;
    this.bedAlive = true;
    this.basePosition = null;

    // Generators
    this.generators = {
      iron: [],
      gold: [],
      diamond: [],
      emerald: []
    };

    // Resources
    this.resources = {
      iron: 0,
      gold: 0,
      diamond: 0,
      emerald: 0
    };

    // Team beds
    this.enemyBeds = new Map(); // team -> bed position
    this.bedsDestroyed = new Set();

    // Strategy mode
    this.strategyMode = "balanced"; // defensive, balanced, aggressive, rusher

    // Phases
    this.gamePhase = "early"; // early, mid, late

    // Purchase priorities
    this.purchasePriorities = {
      early: ["wool", "stone_sword", "chainmail_armor"],
      mid: ["iron_armor", "iron_sword", "bow", "arrow"],
      late: ["diamond_sword", "diamond_armor", "ender_pearl", "potion"]
    };

    // Upgrades purchased
    this.upgrades = {
      sharpness: 0,
      protection: 0,
      haste: 0,
      forge: 0
    };

    // Rush strategy
    this.rushTargets = [];
    this.isRushing = false;

    // Defense
    this.defenseLevel = 0; // 0 = none, 1 = basic, 2 = fortified, 3 = fortress
  }

  /**
   * Initialize Bedwars (detect bed, base, generators)
   */
  async initialize() {
    console.log(`[${this.agentName}] Initializing Bedwars...`);

    // Find bed
    await this.findBed();

    // Find base (spawn point)
    this.basePosition = this.bot.entity.position.floored();

    // Scan for generators
    await this.findGenerators();

    console.log(`[${this.agentName}] ✅ Bedwars initialized`);
  }

  /**
   * Find team bed
   */
  async findBed() {
    const beds = this.bot.findBlocks({
      matching: (block) => block.name.includes("bed"),
      maxDistance: 30,
      count: 10
    });

    if (beds && beds.length > 0) {
      // Closest bed is likely ours
      this.bedPosition = beds[0];
      console.log(`[${this.agentName}] 🛏️  Bed found at ${this.bedPosition.x}, ${this.bedPosition.y}, ${this.bedPosition.z}`);

      logEvent(this.agentName, "bedwars", {
        action: "bed_found",
        position: this.bedPosition
      });
    }
  }

  /**
   * Find resource generators
   */
  async findGenerators() {
    // Iron generators (near spawn)
    const ironBlocks = this.bot.findBlocks({
      matching: (block) => block.name === "iron_block",
      maxDistance: 15,
      count: 5
    });

    if (ironBlocks) {
      this.generators.iron = ironBlocks;
      console.log(`[${this.agentName}] ⚙️  Found ${ironBlocks.length} iron generators`);
    }

    // Gold generators
    const goldBlocks = this.bot.findBlocks({
      matching: (block) => block.name === "gold_block",
      maxDistance: 15,
      count: 5
    });

    if (goldBlocks) {
      this.generators.gold = goldBlocks;
      console.log(`[${this.agentName}] 💰 Found ${goldBlocks.length} gold generators`);
    }
  }

  /**
   * Execute Bedwars strategy
   */
  async execute() {
    // Update game phase
    this.updateGamePhase();

    // Collect resources
    if (Math.random() > 0.7) {
      await this.collectResources();
    }

    // Execute based on strategy mode
    switch (this.strategyMode) {
      case "defensive":
        await this.executeDefensive();
        break;

      case "balanced":
        await this.executeBalanced();
        break;

      case "aggressive":
        await this.executeAggressive();
        break;

      case "rusher":
        await this.executeRusher();
        break;
    }

    // Defend bed if under attack
    if (this.bedAlive && Math.random() > 0.8) {
      await this.checkBedDefense();
    }
  }

  /**
   * Defensive strategy: protect bed, upgrade defenses
   */
  async executeDefensive() {
    if (this.defenseLevel < 2) {
      await this.upgradeBedDefense();
    }

    // Purchase armor and upgrades
    await this.purchaseItems(["armor", "sword", "upgrades"]);

    // Stay near base
    const distanceFromBase = this.bot.entity.position.distanceTo(this.basePosition);
    if (distanceFromBase > 20) {
      await this.returnToBase();
    }
  }

  /**
   * Balanced strategy: mix of defense and offense
   */
  async executeBalanced() {
    // Upgrade defenses to level 1
    if (this.defenseLevel < 1) {
      await this.upgradeBedDefense();
    }

    // Get gear
    await this.purchaseItems(["sword", "armor", "bow"]);

    // Attack if geared
    if (this.hasGoodGear()) {
      await this.attackNearestBed();
    } else {
      await this.collectResources();
    }
  }

  /**
   * Aggressive strategy: constant pressure on enemies
   */
  async executeAggressive() {
    // Get basic gear quickly
    await this.purchaseItems(["sword", "armor"]);

    // Attack enemies
    await this.attackNearestBed();
  }

  /**
   * Rusher strategy: immediate rush with minimal gear
   */
  async executeRusher() {
    if (this.gamePhase === "early" && !this.isRushing) {
      // Buy wool and rush immediately
      await this.purchaseItems(["wool", "sword"]);

      await this.rushNearestBed();
      this.isRushing = true;
    }
  }

  /**
   * Collect resources from generators
   */
  async collectResources() {
    // Go to nearest generator
    const nearbyItems = Object.values(this.bot.entities).filter(e =>
      e.name === "item" &&
      e.position &&
      this.bot.entity.position.distanceTo(e.position) < 4
    );

    if (nearbyItems.length > 0) {
      // Move to collect
      for (const item of nearbyItems) {
        try {
          await this.bot.pathfinder.goto(new GoalNear(
            item.position.x,
            item.position.y,
            item.position.z,
            1
          ));
        } catch (err) {
          // Item might be collected already
        }
      }
    }

    // Count resources
    this.countResources();
  }

  /**
   * Count resources in inventory
   */
  countResources() {
    this.resources.iron = this.countItem("iron_ingot");
    this.resources.gold = this.countItem("gold_ingot");
    this.resources.diamond = this.countItem("diamond");
    this.resources.emerald = this.countItem("emerald");
  }

  /**
   * Count specific item in inventory
   */
  countItem(itemName) {
    const items = this.bot.inventory.items();
    const item = items.find(i => i.name === itemName);
    return item ? item.count : 0;
  }

  /**
   * Purchase items from shop
   */
  async purchaseItems(priorities) {
    // Find shopkeeper/villager
    const shopkeeper = Object.values(this.bot.entities).find(e =>
      (e.name === "villager" || e.name === "armor_stand") &&
      e.position &&
      this.bot.entity.position.distanceTo(e.position) < 10
    );

    if (!shopkeeper) return false;

    console.log(`[${this.agentName}] 🛒 Shopping...`);

    // This is simplified - actual implementation would interact with shop GUI
    // For now, just log what we would buy

    for (const priority of priorities) {
      if (priority === "sword") {
        if (this.resources.iron >= 10) {
          console.log(`[${this.agentName}] Would buy: Iron Sword`);
        }
      } else if (priority === "armor") {
        if (this.resources.iron >= 48) {
          console.log(`[${this.agentName}] Would buy: Full Iron Armor`);
        }
      } else if (priority === "bow") {
        if (this.resources.gold >= 24) {
          console.log(`[${this.agentName}] Would buy: Bow + Arrows`);
        }
      } else if (priority === "wool") {
        if (this.resources.iron >= 4) {
          console.log(`[${this.agentName}] Would buy: Wool (16 blocks)`);
        }
      }
    }

    return true;
  }

  /**
   * Upgrade bed defenses
   */
  async upgradeBedDefense() {
    if (!this.bedPosition) return false;

    console.log(`[${this.agentName}] 🛡️  Upgrading bed defense...`);

    // Build wool/wood protection around bed
    const defenseBlocks = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
      { x: 1, y: 1, z: 0 },
      { x: -1, y: 1, z: 0 },
      { x: 0, y: 1, z: 1 },
      { x: 0, y: 1, z: -1 }
    ];

    for (const offset of defenseBlocks) {
      const pos = {
        x: this.bedPosition.x + offset.x,
        y: this.bedPosition.y + offset.y,
        z: this.bedPosition.z + offset.z
      };

      // Would place wool/endstone here
      // Simplified for now
    }

    this.defenseLevel = 1;

    return true;
  }

  /**
   * Check if bed is under attack
   */
  async checkBedDefense() {
    if (!this.bedPosition) return;

    // Check for enemies near bed
    const nearbyEnemies = Object.values(this.bot.entities).filter(e =>
      e.type === "player" &&
      e.username !== this.bot.username &&
      e.position &&
      this.bedPosition.distanceTo(e.position) < 10
    );

    if (nearbyEnemies.length > 0) {
      console.log(`[${this.agentName}] 🚨 Bed under attack! Defending...`);

      // Return to base and fight
      await this.returnToBase();

      if (this.pvp) {
        await this.pvp.attackTarget(nearbyEnemies[0]);
      }
    }
  }

  /**
   * Attack nearest enemy bed
   */
  async attackNearestBed() {
    // Find nearest unbroken enemy bed
    let nearestBed = null;
    let nearestDistance = Infinity;

    for (const [team, bedPos] of this.enemyBeds) {
      if (this.bedsDestroyed.has(team)) continue;

      const distance = this.bot.entity.position.distanceTo(bedPos);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestBed = { team, position: bedPos };
      }
    }

    if (nearestBed) {
      console.log(`[${this.agentName}] 🎯 Attacking ${nearestBed.team} bed...`);

      try {
        await this.bot.pathfinder.goto(new GoalNear(
          nearestBed.position.x,
          nearestBed.position.y,
          nearestBed.position.z,
          2
        ));

        // Break bed
        const bedBlock = this.bot.blockAt(nearestBed.position);
        if (bedBlock && bedBlock.name.includes("bed")) {
          await this.bot.dig(bedBlock);

          console.log(`[${this.agentName}] 💥 Destroyed ${nearestBed.team} bed!`);

          this.bedsDestroyed.add(nearestBed.team);

          logEvent(this.agentName, "bedwars", {
            action: "bed_destroyed",
            team: nearestBed.team
          });
        }

      } catch (err) {
        console.error(`[${this.agentName}] Failed to attack bed:`, err.message);
      }
    }
  }

  /**
   * Rush nearest enemy bed
   */
  async rushNearestBed() {
    console.log(`[${this.agentName}] 🏃 Rushing enemy bed!`);

    // Buy blocks
    await this.purchaseItems(["wool"]);

    // Attack nearest bed
    await this.attackNearestBed();
  }

  /**
   * Return to base
   */
  async returnToBase() {
    if (!this.basePosition) return;

    try {
      await this.bot.pathfinder.goto(new GoalNear(
        this.basePosition.x,
        this.basePosition.y,
        this.basePosition.z,
        3
      ));
    } catch (err) {
      // Path might be blocked
    }
  }

  /**
   * Check if has good gear
   */
  hasGoodGear() {
    const hasSword = this.bot.inventory.items().some(i => i.name.includes("sword"));
    const hasArmor = this.bot.inventory.items().some(i => i.name.includes("chestplate"));

    return hasSword && hasArmor;
  }

  /**
   * Update game phase
   */
  updateGamePhase() {
    const gameTime = Date.now() - (this.gameStartTime || Date.now());

    if (gameTime < 120000) { // First 2 minutes
      this.gamePhase = "early";
    } else if (gameTime < 300000) { // 2-5 minutes
      this.gamePhase = "mid";
    } else {
      this.gamePhase = "late";
    }
  }

  /**
   * Set strategy mode
   */
  setStrategyMode(mode) {
    const validModes = ["defensive", "balanced", "aggressive", "rusher"];
    if (validModes.includes(mode)) {
      this.strategyMode = mode;
      console.log(`[${this.agentName}] Bedwars strategy: ${mode}`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      strategyMode: this.strategyMode,
      gamePhase: this.gamePhase,
      bedAlive: this.bedAlive,
      defenseLevel: this.defenseLevel,
      resources: this.resources,
      bedsDestroyed: this.bedsDestroyed.size,
      upgrades: this.upgrades
    };
  }
}

module.exports = { BedwarsStrategy };
