/**
 * Storage Management System
 * Maintains stocked chests with essential items for autonomous operation
 */

const { logEvent } = require("../../memory/store");
const Vec3 = require("vec3");

class StorageManager {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Storage locations organized by category
    this.storageLocations = new Map();

    // Stock levels to maintain
    this.stockRequirements = {
      // Food items
      food: {
        "cooked_beef": { min: 32, ideal: 64 },
        "bread": { min: 16, ideal: 32 },
        "cooked_porkchop": { min: 32, ideal: 64 },
        "golden_apple": { min: 4, ideal: 8 }
      },

      // Tools (always have backups)
      tools: {
        "diamond_pickaxe": { min: 2, ideal: 3 },
        "diamond_axe": { min: 1, ideal: 2 },
        "diamond_shovel": { min: 1, ideal: 2 },
        "iron_pickaxe": { min: 3, ideal: 5 },
        "iron_axe": { min: 2, ideal: 3 }
      },

      // Weapons and armor
      combat: {
        "diamond_sword": { min: 1, ideal: 2 },
        "bow": { min: 1, ideal: 2 },
        "arrow": { min: 64, ideal: 256 },
        "shield": { min: 1, ideal: 2 },
        "diamond_helmet": { min: 1, ideal: 2 },
        "diamond_chestplate": { min: 1, ideal: 2 },
        "diamond_leggings": { min: 1, ideal: 2 },
        "diamond_boots": { min: 1, ideal: 2 }
      },

      // Building materials
      building: {
        "oak_planks": { min: 128, ideal: 512 },
        "cobblestone": { min: 256, ideal: 1024 },
        "stone": { min: 128, ideal: 512 },
        "glass": { min: 64, ideal: 256 },
        "oak_log": { min: 64, ideal: 256 },
        "dirt": { min: 64, ideal: 256 }
      },

      // Redstone components
      redstone: {
        "redstone": { min: 32, ideal: 128 },
        "repeater": { min: 16, ideal: 64 },
        "comparator": { min: 8, ideal: 32 },
        "piston": { min: 8, ideal: 32 },
        "sticky_piston": { min: 8, ideal: 32 },
        "hopper": { min: 16, ideal: 64 },
        "dispenser": { min: 8, ideal: 32 },
        "observer": { min: 8, ideal: 32 }
      },

      // Essential resources
      resources: {
        "coal": { min: 64, ideal: 256 },
        "iron_ingot": { min: 64, ideal: 256 },
        "gold_ingot": { min: 32, ideal: 128 },
        "diamond": { min: 16, ideal: 64 },
        "emerald": { min: 8, ideal: 32 },
        "lapis_lazuli": { min: 32, ideal: 128 }
      },

      // Farming supplies
      farming: {
        "wheat_seeds": { min: 64, ideal: 128 },
        "carrot": { min: 32, ideal: 64 },
        "potato": { min: 32, ideal: 64 },
        "bone_meal": { min: 64, ideal: 256 },
        "water_bucket": { min: 2, ideal: 4 }
      },

      // Utility items
      utility: {
        "torch": { min: 128, ideal: 512 },
        "ladder": { min: 32, ideal: 128 },
        "chest": { min: 16, ideal: 64 },
        "crafting_table": { min: 2, ideal: 4 },
        "furnace": { min: 4, ideal: 8 },
        "bed": { min: 1, ideal: 3 },
        "ender_pearl": { min: 12, ideal: 32 }
      }
    };

    this.lastStockCheck = 0;
    this.stockCheckInterval = 300000; // Check every 5 minutes
  }

  /**
   * Register a storage location for a category
   */
  registerStorage(category, position, chestBlock) {
    if (!this.storageLocations.has(category)) {
      this.storageLocations.set(category, []);
    }

    this.storageLocations.get(category).push({
      position: new Vec3(position.x, position.y, position.z),
      block: chestBlock,
      lastAccessed: 0
    });

    console.log(`[${this.agentName}] Registered ${category} storage at ${position.x}, ${position.y}, ${position.z}`);
  }

  /**
   * Auto-discover storage chests near spawn/base
   */
  async discoverStorage(centerPos, radius = 50) {
    console.log(`[${this.agentName}] Discovering storage locations...`);

    const chests = [];

    // Find all chests in range
    for (let x = -radius; x <= radius; x += 4) {
      for (let y = -10; y <= 10; y++) {
        for (let z = -radius; z <= radius; z += 4) {
          const pos = centerPos.offset(x, y, z);
          const block = this.bot.blockAt(pos);

          if (block && (block.name === "chest" || block.name === "barrel")) {
            chests.push({ position: pos, block });
          }
        }
      }
    }

    console.log(`[${this.agentName}] Found ${chests.length} storage containers`);

    // Auto-categorize based on position
    // (In practice, you'd analyze contents or use signs)
    const categories = Object.keys(this.stockRequirements);
    chests.forEach((chest, index) => {
      const category = categories[index % categories.length];
      this.registerStorage(category, chest.position, chest.block);
    });

    return chests.length;
  }

  /**
   * Check current stock levels across all storage
   */
  async checkStockLevels() {
    const now = Date.now();
    if (now - this.lastStockCheck < this.stockCheckInterval) {
      return null; // Too soon
    }

    this.lastStockCheck = now;

    const stockStatus = {};

    for (const [category, requirements] of Object.entries(this.stockRequirements)) {
      stockStatus[category] = {};

      for (const [itemName, levels] of Object.entries(requirements)) {
        const currentStock = await this.countItemInStorage(category, itemName);

        stockStatus[category][itemName] = {
          current: currentStock,
          min: levels.min,
          ideal: levels.ideal,
          status: currentStock >= levels.ideal ? "stocked" :
                  currentStock >= levels.min ? "low" : "critical"
        };
      }
    }

    return stockStatus;
  }

  /**
   * Count specific item across category storage
   */
  async countItemInStorage(category, itemName) {
    const storageList = this.storageLocations.get(category);
    if (!storageList || storageList.length === 0) {
      return 0;
    }

    let total = 0;

    for (const storage of storageList) {
      try {
        const block = this.bot.blockAt(storage.position);
        if (!block) continue;

        const chest = await this.bot.openContainer(block);

        for (const item of chest.containerItems()) {
          if (item.name === itemName) {
            total += item.count;
          }
        }

        chest.close();

      } catch (err) {
        // Chest might be in use or unreachable
        continue;
      }
    }

    return total;
  }

  /**
   * Get priority restocking tasks
   */
  async getRestockingTasks() {
    const stockStatus = await this.checkStockLevels();
    if (!stockStatus) return [];

    const tasks = [];

    for (const [category, items] of Object.entries(stockStatus)) {
      for (const [itemName, status] of Object.entries(items)) {
        if (status.status === "critical" || status.status === "low") {
          const needed = status.ideal - status.current;

          tasks.push({
            priority: status.status === "critical" ? 10 : 5,
            category,
            item: itemName,
            needed,
            current: status.current,
            action: this.getRestockAction(category, itemName)
          });
        }
      }
    }

    // Sort by priority (critical first)
    tasks.sort((a, b) => b.priority - a.priority);

    return tasks;
  }

  /**
   * Determine how to restock an item
   */
  getRestockAction(category, itemName) {
    // Food - hunt, farm, or cook
    if (category === "food") {
      if (itemName.includes("cooked")) {
        return { type: "cook", source: itemName.replace("cooked_", "") };
      }
      return { type: "farm_or_hunt", source: itemName };
    }

    // Tools - craft from resources
    if (category === "tools" || category === "combat") {
      return { type: "craft", recipe: itemName };
    }

    // Building materials - gather or mine
    if (category === "building") {
      if (itemName.includes("planks")) {
        return { type: "craft", recipe: itemName, source: "logs" };
      }
      return { type: "gather", source: itemName };
    }

    // Resources - mine
    if (category === "resources") {
      const oreMap = {
        "coal": "coal_ore",
        "iron_ingot": "iron_ore",
        "gold_ingot": "gold_ore",
        "diamond": "diamond_ore",
        "emerald": "emerald_ore",
        "lapis_lazuli": "lapis_ore"
      };

      const ore = oreMap[itemName];
      if (ore) {
        return { type: "mine", ore };
      }
    }

    // Redstone - mine or craft
    if (category === "redstone") {
      if (itemName === "redstone") {
        return { type: "mine", ore: "redstone_ore" };
      }
      return { type: "craft", recipe: itemName };
    }

    // Farming - plant and harvest
    if (category === "farming") {
      return { type: "farm", crop: itemName };
    }

    // Utility - craft or gather
    if (category === "utility") {
      return { type: "craft_or_gather", item: itemName };
    }

    return { type: "unknown" };
  }

  /**
   * Deposit items into appropriate storage
   */
  async depositItems(items = null) {
    if (!items) {
      items = this.bot.inventory.items();
    }

    let deposited = 0;

    for (const item of items) {
      const category = this.categorizeItem(item.name);
      if (!category) continue;

      const storageList = this.storageLocations.get(category);
      if (!storageList || storageList.length === 0) continue;

      // Find a chest with space
      for (const storage of storageList) {
        try {
          const block = this.bot.blockAt(storage.position);
          if (!block) continue;

          await this.bot.pathfinder.goto(new GoalNear(storage.position.x, storage.position.y, storage.position.z, 4));

          const chest = await this.bot.openContainer(block);

          await chest.deposit(item.type, null, item.count);
          deposited += item.count;

          chest.close();

          console.log(`[${this.agentName}] Deposited ${item.count}x ${item.name} to ${category} storage`);

          break; // Item deposited, move to next

        } catch (err) {
          continue; // Try next chest
        }
      }
    }

    if (deposited > 0) {
      logEvent(this.agentName, "storage", {
        action: "deposit",
        itemsDeposited: deposited
      });
    }

    return deposited;
  }

  /**
   * Withdraw items from storage
   */
  async withdrawItem(itemName, amount = 1) {
    const category = this.categorizeItem(itemName);
    if (!category) return false;

    const storageList = this.storageLocations.get(category);
    if (!storageList || storageList.length === 0) return false;

    let remaining = amount;

    for (const storage of storageList) {
      if (remaining <= 0) break;

      try {
        const block = this.bot.blockAt(storage.position);
        if (!block) continue;

        await this.bot.pathfinder.goto(new GoalNear(storage.position.x, storage.position.y, storage.position.z, 4));

        const chest = await this.bot.openContainer(block);

        const item = chest.containerItems().find(i => i.name === itemName);
        if (item) {
          const toWithdraw = Math.min(item.count, remaining);
          await chest.withdraw(item.type, null, toWithdraw);
          remaining -= toWithdraw;

          console.log(`[${this.agentName}] Withdrew ${toWithdraw}x ${itemName}`);
        }

        chest.close();

      } catch (err) {
        continue;
      }
    }

    return remaining === 0;
  }

  /**
   * Categorize an item for storage
   */
  categorizeItem(itemName) {
    for (const [category, items] of Object.entries(this.stockRequirements)) {
      if (itemName in items) {
        return category;
      }
    }

    // Fallback categorization
    if (itemName.includes("pickaxe") || itemName.includes("axe") || itemName.includes("shovel")) {
      return "tools";
    }
    if (itemName.includes("sword") || itemName.includes("helmet") || itemName.includes("chestplate")) {
      return "combat";
    }
    if (itemName.includes("planks") || itemName.includes("stone") || itemName.includes("cobblestone")) {
      return "building";
    }
    if (itemName.includes("_ore") || itemName.includes("ingot") || itemName === "diamond") {
      return "resources";
    }

    return "utility"; // Default
  }

  /**
   * Organize storage - sort items into correct chests
   */
  async organizeStorage() {
    console.log(`[${this.agentName}] Organizing storage...`);

    let organized = 0;

    // Go through all storage locations
    for (const [category, storageList] of this.storageLocations) {
      for (const storage of storageList) {
        try {
          const block = this.bot.blockAt(storage.position);
          if (!block) continue;

          const chest = await this.bot.openContainer(block);

          // Find items that don't belong here
          for (const item of chest.containerItems()) {
            const correctCategory = this.categorizeItem(item.name);

            if (correctCategory && correctCategory !== category) {
              // Withdraw and re-deposit to correct location
              await chest.withdraw(item.type, null, item.count);
              chest.close();

              await this.depositItems([item]);
              organized++;

              break; // Re-open chest after modification
            }
          }

          chest.close();

        } catch (err) {
          continue;
        }
      }
    }

    console.log(`[${this.agentName}] Organized ${organized} items`);
    return organized;
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const totalLocations = Array.from(this.storageLocations.values())
      .reduce((sum, list) => sum + list.length, 0);

    return {
      categories: this.storageLocations.size,
      totalLocations,
      itemTypes: Object.values(this.stockRequirements)
        .reduce((sum, cat) => sum + Object.keys(cat).length, 0)
    };
  }
}

module.exports = { StorageManager };
