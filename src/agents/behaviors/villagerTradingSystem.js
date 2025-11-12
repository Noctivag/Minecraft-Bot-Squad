/**
 * Villager Trading System
 * Autonomous villager trading, trading hall construction, and emerald economy
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class VillagerTradingSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Discovered villagers
    this.villagers = new Map();

    // Trading goals (items to acquire via trading)
    this.tradingGoals = {
      // Enchanted books
      "enchanted_book": {
        priority: 10,
        profession: "librarian",
        emeraldCost: 5-64,
        desiredEnchantments: [
          "mending", "unbreaking", "fortune", "efficiency",
          "sharpness", "protection", "feather_falling", "silk_touch"
        ]
      },

      // Tools and weapons
      "diamond_pickaxe": { priority: 7, profession: "toolsmith", emeraldCost: 10-25 },
      "diamond_axe": { priority: 7, profession: "toolsmith", emeraldCost: 10-25 },
      "diamond_sword": { priority: 7, profession: "weaponsmith", emeraldCost: 10-25 },
      "diamond_chestplate": { priority: 8, profession: "armorer", emeraldCost: 15-30 },
      "diamond_helmet": { priority: 8, profession: "armorer", emeraldCost: 10-25 },
      "diamond_leggings": { priority: 8, profession: "armorer", emeraldCost: 15-30 },
      "diamond_boots": { priority: 8, profession: "armorer", emeraldCost: 10-25 },

      // Food
      "cooked_beef": { priority: 4, profession: "butcher", emeraldCost: 1 },
      "bread": { priority: 4, profession: "farmer", emeraldCost: 1 },
      "golden_carrot": { priority: 5, profession: "farmer", emeraldCost: 3 },

      // Resources
      "glowstone": { priority: 6, profession: "cleric", emeraldCost: 4 },
      "ender_pearl": { priority: 9, profession: "cleric", emeraldCost: 5 },
      "redstone": { priority: 5, profession: "cleric", emeraldCost: 1-4 },
      "lapis_lazuli": { priority: 5, profession: "cleric", emeraldCost: 1 },
      "bottle_o_enchanting": { priority: 6, profession: "cleric", emeraldCost: 3 },

      // Special items
      "name_tag": { priority: 6, profession: "librarian", emeraldCost: 20 },
      "saddle": { priority: 5, profession: "leatherworker", emeraldCost: 6 },
      "bell": { priority: 4, profession: "armorer", emeraldCost: 36 },
      "lantern": { priority: 4, profession: "librarian", emeraldCost: 1 }
    };

    // Items to sell for emeralds
    this.emeraldTrades = [
      { item: "wheat", emeralds: 1, amount: 20, profession: "farmer" },
      { item: "potato", emeralds: 1, amount: 26, profession: "farmer" },
      { item: "carrot", emeralds: 1, amount: 22, profession: "farmer" },
      { item: "beetroot", emeralds: 1, amount: 15, profession: "farmer" },
      { item: "coal", emeralds: 1, amount: 15, profession: "toolsmith" },
      { item: "iron_ingot", emeralds: 1, amount: 4, profession: "armorer" },
      { item: "gold_ingot", emeralds: 1, amount: 3, profession: "cleric" },
      { item: "string", emeralds: 1, amount: 20, profession: "fletcher" },
      { item: "feather", emeralds: 1, amount: 24, profession: "fletcher" },
      { item: "stick", emeralds: 1, amount: 32, profession: "fletcher" },
      { item: "paper", emeralds: 1, amount: 24, profession: "librarian" },
      { item: "book", emeralds: 1, amount: 4, profession: "librarian" }
    ];

    // Emerald count
    this.emeraldBalance = 0;

    // Trading hall location
    this.tradingHall = null;

    this.lastVillagerScan = 0;
    this.scanInterval = 60000; // Scan every minute
  }

  /**
   * Discover villagers in area
   */
  async discoverVillagers(radius = 50) {
    const now = Date.now();
    if (now - this.lastVillagerScan < this.scanInterval) {
      return this.villagers.size;
    }

    this.lastVillagerScan = now;

    const entities = Object.values(this.bot.entities);
    let foundCount = 0;

    for (const entity of entities) {
      if (entity.name === "villager" && entity.position) {
        const distance = this.bot.entity.position.distanceTo(entity.position);

        if (distance <= radius) {
          if (!this.villagers.has(entity.id)) {
            this.villagers.set(entity.id, {
              id: entity.id,
              position: entity.position.clone(),
              profession: entity.metadata?.[16] || "unknown", // Villager profession
              level: entity.metadata?.[17] || 1, // Villager level
              lastTrade: 0,
              trades: []
            });

            foundCount++;
          }
        }
      }
    }

    if (foundCount > 0) {
      console.log(`[${this.agentName}] Discovered ${foundCount} new villagers (total: ${this.villagers.size})`);
    }

    return this.villagers.size;
  }

  /**
   * Find villager by profession
   */
  findVillagerByProfession(profession) {
    for (const [id, villager] of this.villagers) {
      if (villager.profession === profession) {
        const entity = this.bot.entities[id];
        if (entity) {
          return { id, villager, entity };
        }
      }
    }
    return null;
  }

  /**
   * Trade with a villager
   */
  async tradeWithVillager(villagerEntity, tradeIndex = 0) {
    try {
      // Move close to villager
      await this.bot.pathfinder.goto(new GoalNear(
        villagerEntity.position.x,
        villagerEntity.position.y,
        villagerEntity.position.z,
        2
      ));

      // Open trading window
      const villagerWindow = await this.bot.openVillager(villagerEntity);

      if (!villagerWindow || !villagerWindow.trades || villagerWindow.trades.length === 0) {
        console.log(`[${this.agentName}] No trades available from this villager`);
        villagerWindow?.close();
        return false;
      }

      // Get the trade
      const trade = villagerWindow.trades[tradeIndex];
      if (!trade) {
        console.log(`[${this.agentName}] Trade index ${tradeIndex} not available`);
        villagerWindow.close();
        return false;
      }

      // Check if we can afford the trade
      const canAfford = this.canAffordTrade(trade);
      if (!canAfford) {
        console.log(`[${this.agentName}] Cannot afford trade`);
        villagerWindow.close();
        return false;
      }

      // Execute trade
      await villagerWindow.trade(trade, 1);

      console.log(`[${this.agentName}] ✅ Traded for ${trade.outputItem.name}`);

      villagerWindow.close();

      logEvent(this.agentName, "trading", {
        item: trade.outputItem.name,
        cost: trade.inputItem1?.name
      });

      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Trade failed:`, err.message);
      return false;
    }
  }

  /**
   * Check if we can afford a trade
   */
  canAffordTrade(trade) {
    const has1 = trade.inputItem1 ?
      this.bot.inventory.items().find(i => i.type === trade.inputItem1.type)?.count >= trade.inputItem1.count :
      true;

    const has2 = trade.inputItem2 ?
      this.bot.inventory.items().find(i => i.type === trade.inputItem2.type)?.count >= trade.inputItem2.count :
      true;

    return has1 && has2;
  }

  /**
   * Get emeralds by selling items to villagers
   */
  async getEmeralds(targetAmount = 10) {
    console.log(`[${this.agentName}] Acquiring ${targetAmount} emeralds...`);

    const currentEmeralds = this.countEmeralds();
    if (currentEmeralds >= targetAmount) {
      return currentEmeralds;
    }

    const needed = targetAmount - currentEmeralds;
    let acquired = 0;

    // Try each emerald trade
    for (const emeraldTrade of this.emeraldTrades) {
      if (acquired >= needed) break;

      // Check if we have the item
      const item = this.bot.inventory.items().find(i => i.name === emeraldTrade.item);
      if (!item || item.count < emeraldTrade.amount) {
        continue; // Don't have enough of this item
      }

      // Find villager with this profession
      const villagerData = this.findVillagerByProfession(emeraldTrade.profession);
      if (!villagerData) {
        continue; // No villager of this profession
      }

      // Trade
      const success = await this.tradeWithVillager(villagerData.entity);
      if (success) {
        acquired += emeraldTrade.emeralds;
        console.log(`[${this.agentName}] Acquired ${emeraldTrade.emeralds} emeralds (${acquired}/${needed})`);
      }
    }

    const finalCount = this.countEmeralds();
    console.log(`[${this.agentName}] Total emeralds: ${finalCount}`);

    return finalCount;
  }

  /**
   * Count emeralds in inventory
   */
  countEmeralds() {
    const emeralds = this.bot.inventory.items().find(i => i.name === "emerald");
    this.emeraldBalance = emeralds ? emeralds.count : 0;
    return this.emeraldBalance;
  }

  /**
   * Buy specific item from villager
   */
  async buyItem(itemName) {
    const goal = this.tradingGoals[itemName];
    if (!goal) {
      console.log(`[${this.agentName}] No trading goal for ${itemName}`);
      return false;
    }

    // Find villager with required profession
    const villagerData = this.findVillagerByProfession(goal.profession);
    if (!villagerData) {
      console.log(`[${this.agentName}] No ${goal.profession} villager found`);
      return false;
    }

    // Ensure we have enough emeralds
    const emeralds = this.countEmeralds();
    const costEstimate = typeof goal.emeraldCost === "number" ? goal.emeraldCost : goal.emeraldCost.split("-")[0];

    if (emeralds < costEstimate) {
      console.log(`[${this.agentName}] Need ${costEstimate} emeralds, have ${emeralds}`);
      await this.getEmeralds(costEstimate);
    }

    // Trade for the item
    return await this.tradeWithVillager(villagerData.entity);
  }

  /**
   * Build a trading hall
   */
  async buildTradingHall(position) {
    console.log(`[${this.agentName}] Building trading hall...`);

    const blocks = [];

    // 20x10x20 hall
    const width = 20;
    const height = 10;
    const length = 20;

    // Floor
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < length; z++) {
        blocks.push({ x, y: 0, z, block: "stone_bricks" });
      }
    }

    // Walls
    for (let x = 0; x < width; x++) {
      for (let y = 1; y < height; y++) {
        blocks.push({ x, y, z: 0, block: "stone_bricks" });
        blocks.push({ x, y, z: length - 1, block: "stone_bricks" });
      }
    }

    for (let z = 0; z < length; z++) {
      for (let y = 1; y < height; y++) {
        blocks.push({ x: 0, y, z, block: "stone_bricks" });
        blocks.push({ x: width - 1, y, z, block: "stone_bricks" });
      }
    }

    // Roof
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < length; z++) {
        blocks.push({ x, y: height, z, block: "stone_bricks" });
      }
    }

    // Trading stalls (5x4 grid)
    for (let stallX = 0; stallX < 5; stallX++) {
      for (let stallZ = 0; stallZ < 4; stallZ++) {
        const baseX = 2 + stallX * 4;
        const baseZ = 2 + stallZ * 4;

        // Job site block (lectern for librarian, etc.)
        blocks.push({ x: baseX, y: 1, z: baseZ, block: "lectern" });

        // Bed for villager
        blocks.push({ x: baseX, y: 1, z: baseZ + 1, block: "bed" });

        // Walls around stall
        blocks.push({ x: baseX - 1, y: 1, z: baseZ, block: "oak_fence" });
        blocks.push({ x: baseX + 1, y: 1, z: baseZ, block: "oak_fence" });
        blocks.push({ x: baseX, y: 1, z: baseZ - 1, block: "oak_fence" });
      }
    }

    // Lighting
    for (let x = 4; x < width; x += 4) {
      for (let z = 4; z < length; z += 4) {
        blocks.push({ x, y: height - 1, z, block: "glowstone" });
      }
    }

    // Place all blocks
    let placed = 0;
    for (const { x, y, z, block } of blocks) {
      try {
        await this.placeBlock({
          x: position.x + x,
          y: position.y + y,
          z: position.z + z
        }, block);
        placed++;
      } catch (err) {
        continue;
      }
    }

    this.tradingHall = position;

    console.log(`[${this.agentName}] Trading hall built: ${placed} blocks`);
    return true;
  }

  /**
   * Place a block
   */
  async placeBlock(position, blockType) {
    const item = this.bot.inventory.items().find(i => i.name === blockType);
    if (!item) return false;

    try {
      await this.bot.equip(item, "hand");

      const existingBlock = this.bot.blockAt(position);
      if (existingBlock && existingBlock.name !== "air") {
        return false;
      }

      const referencePos = position.offset(0, -1, 0);
      const referenceBlock = this.bot.blockAt(referencePos);

      if (referenceBlock && referenceBlock.name !== "air") {
        await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
      }
    } catch (err) {
      return false;
    }

    return false;
  }

  /**
   * Get priority trading goal
   */
  getPriorityTradingGoal() {
    let bestGoal = null;
    let bestPriority = -1;

    for (const [item, goal] of Object.entries(this.tradingGoals)) {
      // Check if we already have this item
      const hasItem = this.bot.inventory.items().find(i => i.name === item);
      if (hasItem) continue;

      if (goal.priority > bestPriority) {
        bestPriority = goal.priority;
        bestGoal = { item, ...goal };
      }
    }

    return bestGoal;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      villagersDiscovered: this.villagers.size,
      emeraldBalance: this.countEmeralds(),
      tradingHallBuilt: this.tradingHall !== null,
      tradingGoals: Object.keys(this.tradingGoals).length,
      emeraldTradeOptions: this.emeraldTrades.length
    };
  }
}

module.exports = { VillagerTradingSystem };
