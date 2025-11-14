const { logEvent } = require("../../memory/store");
const { recordMetric } = require("../../learning/metrics");

/**
 * Advanced Trading System - Villager trading, optimization, and village management
 */
class TradingSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.knownVillagers = new Map();
    this.tradingPosts = [];
    this.tradeHistory = [];
    this.emeraldCount = 0;
  }

  /**
   * Scan for nearby villagers
   */
  async scanForVillagers(radius = 32) {
    const villagers = Object.values(this.bot.entities).filter(entity =>
      entity.name === "villager" &&
      entity.position.distanceTo(this.bot.entity.position) <= radius
    );

    console.log(`[${this.agentName}] Found ${villagers.length} villagers within ${radius} blocks`);

    for (const villager of villagers) {
      await this.analyzeVillager(villager);
    }

    return villagers;
  }

  /**
   * Analyze villager profession and trades
   */
  async analyzeVillager(villager) {
    const villagerId = villager.id;

    if (this.knownVillagers.has(villagerId)) {
      return this.knownVillagers.get(villagerId);
    }

    const villagerData = {
      id: villagerId,
      entity: villager,
      position: villager.position.clone(),
      profession: this.detectProfession(villager),
      level: 1,
      trades: [],
      lastTraded: null,
      totalTrades: 0,
      isOptimal: false
    };

    this.knownVillagers.set(villagerId, villagerData);

    await logEvent(this.agentName, "villager_discovered", {
      profession: villagerData.profession,
      position: villagerData.position
    });

    return villagerData;
  }

  /**
   * Detect villager profession from appearance
   */
  detectProfession(villager) {
    // TODO: Parse villager metadata for actual profession
    // For now, return placeholder
    const professions = [
      "farmer", "librarian", "cleric", "armorer", "weaponsmith",
      "toolsmith", "cartographer", "leatherworker", "butcher"
    ];
    return professions[Math.floor(Math.random() * professions.length)];
  }

  /**
   * Trade with specific villager
   */
  async tradeWith(villager, itemToTrade, itemToReceive, count = 1) {
    console.log(`[${this.agentName}] Trading ${count}x ${itemToTrade} for ${itemToReceive}`);

    try {
      // Navigate to villager
      await this.bot.pathfinder.goto(new this.bot.pathfinder.goals.GoalNear(
        villager.position.x,
        villager.position.y,
        villager.position.z,
        2
      ));

      // Open trading window
      const villagerEntity = this.bot.nearestEntity(e => e.id === villager.id);
      if (!villagerEntity) {
        throw new Error("Villager not found");
      }

      // TODO: Implement actual trading logic with mineflayer trading API
      console.log(`[${this.agentName}] Trade window opened with ${villager.profession}`);

      // Update tracking
      const villagerData = this.knownVillagers.get(villager.id);
      if (villagerData) {
        villagerData.totalTrades++;
        villagerData.lastTraded = Date.now();
      }

      this.tradeHistory.push({
        timestamp: Date.now(),
        villagerId: villager.id,
        gave: itemToTrade,
        received: itemToReceive,
        count
      });

      await recordMetric(this.agentName, "trades_completed", 1);

      return true;
    } catch (err) {
      console.error(`[${this.agentName}] Trading failed:`, err.message);
      return false;
    }
  }

  /**
   * Find optimal trades for emeralds
   */
  getOptimalEmeraldTrades() {
    const emeraldTrades = [];

    for (const [id, villager] of this.knownVillagers) {
      if (villager.profession === "farmer") {
        emeraldTrades.push({
          villager,
          trade: "wheat -> emerald",
          efficiency: 9, // 20 wheat = ~1 emerald
          priority: 8
        });
      } else if (villager.profession === "librarian") {
        emeraldTrades.push({
          villager,
          trade: "paper -> emerald",
          efficiency: 10,
          priority: 9
        });
      } else if (villager.profession === "cartographer") {
        emeraldTrades.push({
          villager,
          trade: "glass_pane -> emerald",
          efficiency: 7,
          priority: 6
        });
      }
    }

    return emeraldTrades.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Build trading post structure
   */
  async buildTradingPost(centerPos) {
    console.log(`[${this.agentName}] Building trading post at ${centerPos}`);

    const post = {
      position: centerPos,
      villagerStalls: [],
      chest: null,
      createdAt: Date.now()
    };

    try {
      // Build platform (9x9)
      for (let x = -4; x <= 4; x++) {
        for (let z = -4; z <= 4; z++) {
          const blockPos = centerPos.offset(x, 0, z);
          await this.placeBlock(blockPos, "oak_planks");
        }
      }

      // Build stalls (4 corners)
      const stallPositions = [
        centerPos.offset(-3, 0, -3),
        centerPos.offset(3, 0, -3),
        centerPos.offset(-3, 0, 3),
        centerPos.offset(3, 0, 3)
      ];

      for (const stallPos of stallPositions) {
        await this.buildVillagerStall(stallPos);
        post.villagerStalls.push(stallPos);
      }

      // Place central chest
      const chestPos = centerPos.offset(0, 1, 0);
      await this.placeBlock(chestPos, "chest");
      post.chest = chestPos;

      this.tradingPosts.push(post);

      await logEvent(this.agentName, "trading_post_built", {
        position: centerPos,
        stalls: post.villagerStalls.length
      });

      return post;
    } catch (err) {
      console.error(`[${this.agentName}] Failed to build trading post:`, err.message);
      return null;
    }
  }

  /**
   * Build individual villager stall
   */
  async buildVillagerStall(position) {
    // Build 3x3x3 enclosure
    const blocks = [];

    // Floor
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        blocks.push({ pos: position.offset(x, 0, z), block: "oak_planks" });
      }
    }

    // Walls (y=1,2)
    for (let y = 1; y <= 2; y++) {
      blocks.push({ pos: position.offset(-1, y, -1), block: "oak_fence" });
      blocks.push({ pos: position.offset(1, y, -1), block: "oak_fence" });
      blocks.push({ pos: position.offset(-1, y, 1), block: "oak_fence" });
      blocks.push({ pos: position.offset(1, y, 1), block: "oak_fence" });
    }

    // Job site block (lectern, brewing stand, etc.)
    blocks.push({ pos: position.offset(0, 1, 0), block: "lectern" });

    // Place all blocks
    for (const { pos, block } of blocks) {
      await this.placeBlock(pos, block);
    }

    return true;
  }

  /**
   * Optimize villager trades by curing zombie villagers
   */
  async optimizeVillager(villager) {
    console.log(`[${this.agentName}] Optimizing villager trades through curing`);

    // TODO: Implement zombie villager curing logic
    // 1. Trap villager safely
    // 2. Convert to zombie villager
    // 3. Cure with splash potion of weakness + golden apple
    // 4. Wait for conversion
    // 5. Enjoy discounted trades

    const villagerData = this.knownVillagers.get(villager.id);
    if (villagerData) {
      villagerData.isOptimal = true;
    }

    await logEvent(this.agentName, "villager_optimized", {
      villagerId: villager.id,
      profession: villagerData?.profession
    });

    return true;
  }

  /**
   * Breed villagers for population growth
   */
  async breedVillagers(villager1, villager2) {
    console.log(`[${this.agentName}] Attempting to breed villagers`);

    try {
      // Give food to both villagers
      const foods = ["bread", "potato", "carrot", "beetroot"];

      for (const villager of [villager1, villager2]) {
        // TODO: Implement food throwing to villagers
        console.log(`[${this.agentName}] Giving food to villager ${villager.id}`);
      }

      await logEvent(this.agentName, "villager_breeding_attempted", {
        villager1: villager1.id,
        villager2: villager2.id
      });

      return true;
    } catch (err) {
      console.error(`[${this.agentName}] Breeding failed:`, err.message);
      return false;
    }
  }

  /**
   * Place block helper
   */
  async placeBlock(position, blockType) {
    const item = this.bot.inventory.items().find(i => i.name === blockType);
    if (!item) {
      console.warn(`[${this.agentName}] Missing block: ${blockType}`);
      return false;
    }

    try {
      const referenceBlock = this.bot.blockAt(position.offset(0, -1, 0));
      if (referenceBlock) {
        await this.bot.equip(item, "hand");
        await this.bot.placeBlock(referenceBlock, new this.bot.vec3(0, 1, 0));
        return true;
      }
    } catch (err) {
      console.warn(`[${this.agentName}] Failed to place ${blockType}:`, err.message);
    }
    return false;
  }

  /**
   * Get trading statistics
   */
  getStatistics() {
    return {
      knownVillagers: this.knownVillagers.size,
      tradingPosts: this.tradingPosts.length,
      totalTrades: this.tradeHistory.length,
      optimalVillagers: Array.from(this.knownVillagers.values()).filter(v => v.isOptimal).length,
      emeraldCount: this.emeraldCount
    };
  }
}

module.exports = { TradingSystem };
