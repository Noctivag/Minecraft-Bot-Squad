const { logEvent } = require("../../memory/store");

/**
 * Inventory Management System - Smart storage, sorting, and item management
 */
class InventoryManager {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.storageChests = new Map(); // position -> { type, priority, items }
    this.itemPriorities = this.initializeItemPriorities();
    this.reservedSlots = 9; // Keep 9 slots for tools/equipment
  }

  /**
   * Initialize item priority system
   */
  initializeItemPriorities() {
    return {
      // Tools (highest priority - always keep)
      "diamond_pickaxe": 100,
      "iron_pickaxe": 95,
      "diamond_sword": 100,
      "iron_sword": 95,
      "bow": 90,
      "shield": 85,

      // Building materials (high priority)
      "oak_planks": 70,
      "cobblestone": 65,
      "dirt": 60,

      // Food (medium-high priority)
      "cooked_beef": 75,
      "bread": 70,
      "golden_apple": 95,

      // Ores and valuables (high priority)
      "diamond": 100,
      "iron_ingot": 85,
      "gold_ingot": 80,
      "coal": 70,

      // Seeds and farming (medium priority)
      "wheat_seeds": 60,
      "carrot": 65,

      // Junk (low priority)
      "cobweb": 10,
      "rotten_flesh": 15,
      "poisonous_potato": 10
    };
  }

  /**
   * Register a storage chest
   */
  registerChest(position, type = "general", priority = 50) {
    const key = `${position.x},${position.y},${position.z}`;

    this.storageChests.set(key, {
      position,
      type, // "general", "tools", "food", "materials", "valuables"
      priority,
      lastAccessed: Date.now()
    });

    console.log(`[${this.agentName}] Registered ${type} chest at (${position.x}, ${position.y}, ${position.z})`);
    logEvent(this.agentName, "inventory", { action: "register_chest", type, position });
  }

  /**
   * Get item priority
   */
  getItemPriority(itemName) {
    return this.itemPriorities[itemName] || 50; // Default priority
  }

  /**
   * Check if inventory is full
   */
  isInventoryFull() {
    const emptySlots = this.bot.inventory.emptySlotCount();
    return emptySlots <= this.reservedSlots;
  }

  /**
   * Get inventory utilization percentage
   */
  getUtilization() {
    const total = 36; // Player inventory slots
    const used = total - this.bot.inventory.emptySlotCount();
    return (used / total * 100).toFixed(1);
  }

  /**
   * Organize inventory by priority
   */
  async organizeInventory() {
    console.log(`[${this.agentName}] Organizing inventory...`);

    const items = this.bot.inventory.items();

    // Sort items by priority (high to low)
    const sortedItems = items.sort((a, b) => {
      const prioA = this.getItemPriority(a.name);
      const prioB = this.getItemPriority(b.name);
      return prioB - prioA;
    });

    // Move low-priority items to hotbar last
    // (This is a simplified version - full implementation would rearrange slots)

    logEvent(this.agentName, "inventory", {
      action: "organize",
      items: items.length,
      utilization: this.getUtilization()
    });

    console.log(`[${this.agentName}] Inventory organized (${items.length} items, ${this.getUtilization()}% full)`);
  }

  /**
   * Deposit items to nearest appropriate chest
   */
  async depositItems(itemFilter = null) {
    if (this.storageChests.size === 0) {
      console.log(`[${this.agentName}] No storage chests registered`);
      return false;
    }

    // Find nearest chest
    const nearestChest = this.findNearestChest();
    if (!nearestChest) {
      console.log(`[${this.agentName}] No accessible chests found`);
      return false;
    }

    console.log(`[${this.agentName}] Depositing items to chest at (${nearestChest.position.x}, ${nearestChest.position.y}, ${nearestChest.position.z})`);

    try {
      // Navigate to chest
      const { goals } = require("mineflayer-pathfinder");
      await this.bot.pathfinder.goto(new goals.GoalBlock(
        nearestChest.position.x,
        nearestChest.position.y,
        nearestChest.position.z
      ));

      // Open chest
      const chestBlock = this.bot.blockAt(nearestChest.position);
      if (!chestBlock) {
        console.log(`[${this.agentName}] Chest not found at position`);
        return false;
      }

      const chest = await this.bot.openContainer(chestBlock);

      // Deposit items
      let deposited = 0;
      const items = this.bot.inventory.items();

      for (const item of items) {
        // Skip if item doesn't match filter
        if (itemFilter && !itemFilter(item)) continue;

        // Skip high-priority items (tools, weapons, food)
        const priority = this.getItemPriority(item.name);
        if (priority >= 85) continue;

        try {
          await chest.deposit(item.type, null, item.count);
          deposited += item.count;
          console.log(`[${this.agentName}] Deposited ${item.count}x ${item.name}`);
        } catch (err) {
          // Chest might be full
          console.log(`[${this.agentName}] Could not deposit ${item.name}: ${err.message}`);
        }
      }

      chest.close();

      logEvent(this.agentName, "inventory", {
        action: "deposit",
        itemsDeposited: deposited,
        chestLocation: nearestChest.position
      });

      console.log(`[${this.agentName}] Deposited ${deposited} items`);
      return deposited > 0;

    } catch (err) {
      console.error(`[${this.agentName}] Failed to deposit items:`, err.message);
      return false;
    }
  }

  /**
   * Withdraw specific item from storage
   */
  async withdrawItem(itemName, count = 1) {
    if (this.storageChests.size === 0) {
      console.log(`[${this.agentName}] No storage chests registered`);
      return false;
    }

    // Find chest that might contain the item
    const nearestChest = this.findNearestChest();
    if (!nearestChest) return false;

    try {
      // Navigate to chest
      const { goals } = require("mineflayer-pathfinder");
      await this.bot.pathfinder.goto(new goals.GoalBlock(
        nearestChest.position.x,
        nearestChest.position.y,
        nearestChest.position.z
      ));

      // Open chest
      const chestBlock = this.bot.blockAt(nearestChest.position);
      const chest = await this.bot.openContainer(chestBlock);

      // Find item in chest
      const item = chest.containerItems().find(i => i.name === itemName);

      if (item) {
        const withdrawCount = Math.min(count, item.count);
        await chest.withdraw(item.type, null, withdrawCount);

        console.log(`[${this.agentName}] Withdrew ${withdrawCount}x ${itemName}`);

        logEvent(this.agentName, "inventory", {
          action: "withdraw",
          item: itemName,
          count: withdrawCount
        });

        chest.close();
        return true;
      } else {
        console.log(`[${this.agentName}] ${itemName} not found in chest`);
        chest.close();
        return false;
      }

    } catch (err) {
      console.error(`[${this.agentName}] Failed to withdraw item:`, err.message);
      return false;
    }
  }

  /**
   * Find nearest accessible chest
   */
  findNearestChest(type = null) {
    let nearest = null;
    let minDist = Infinity;

    for (const [key, chest] of this.storageChests) {
      if (type && chest.type !== type) continue;

      const dist = this.bot.entity.position.distanceTo(chest.position);

      if (dist < minDist) {
        minDist = dist;
        nearest = chest;
      }
    }

    return nearest;
  }

  /**
   * Auto-deposit when inventory is full
   */
  async autoDeposit() {
    if (this.isInventoryFull()) {
      console.log(`[${this.agentName}] Inventory full, auto-depositing...`);

      // Deposit low-priority items
      const lowPriorityFilter = (item) => this.getItemPriority(item.name) < 70;
      await this.depositItems(lowPriorityFilter);
    }
  }

  /**
   * Count specific item in inventory
   */
  countItem(itemName) {
    const items = this.bot.inventory.items().filter(i => i.name === itemName);
    return items.reduce((sum, item) => sum + item.count, 0);
  }

  /**
   * Check if bot has item
   */
  hasItem(itemName, minCount = 1) {
    return this.countItem(itemName) >= minCount;
  }

  /**
   * Drop unwanted items
   */
  async dropJunk() {
    const junkItems = ["cobweb", "rotten_flesh", "poisonous_potato", "spider_eye"];

    let dropped = 0;

    for (const junkName of junkItems) {
      const items = this.bot.inventory.items().filter(i => i.name === junkName);

      for (const item of items) {
        try {
          await this.bot.toss(item.type, null, item.count);
          dropped += item.count;
          console.log(`[${this.agentName}] Dropped ${item.count}x ${item.name}`);
        } catch (err) {
          console.error(`[${this.agentName}] Failed to drop ${item.name}`);
        }
      }
    }

    if (dropped > 0) {
      logEvent(this.agentName, "inventory", {
        action: "drop_junk",
        count: dropped
      });
    }

    return dropped;
  }

  /**
   * Try to eat food to restore health/hunger
   */
  async tryEat() {
    const foods = [
      "cooked_beef", "cooked_porkchop", "cooked_chicken", "cooked_mutton",
      "bread", "apple", "golden_apple", "carrot", "potato", "beetroot",
      "cooked_cod", "cooked_salmon", "baked_potato"
    ];

    for (const foodName of foods) {
      const food = this.bot.inventory.items().find(item => item.name === foodName);
      if (food) {
        try {
          await this.bot.equip(food, "hand");
          await this.bot.consume();
          console.log(`[${this.agentName}] Ate ${foodName}`);

          logEvent(this.agentName, "inventory", {
            action: "eat",
            food: foodName
          });

          return true;
        } catch (err) {
          console.error(`[${this.agentName}] Failed to eat ${foodName}:`, err.message);
        }
      }
    }

    console.log(`[${this.agentName}] No food available to eat`);
    return false;
  }

  /**
   * Scan nearby chests and register them
   */
  async scanAndRegisterChests(radius = 32) {
    console.log(`[${this.agentName}] Scanning for chests within ${radius} blocks...`);

    const pos = this.bot.entity.position;
    let found = 0;

    for (let x = -radius; x <= radius; x += 2) {
      for (let y = -10; y <= 10; y += 2) {
        for (let z = -radius; z <= radius; z += 2) {
          const blockPos = pos.offset(x, y, z);
          const block = this.bot.blockAt(blockPos);

          if (block && (block.name === "chest" || block.name === "barrel")) {
            const key = `${blockPos.x},${blockPos.y},${blockPos.z}`;

            if (!this.storageChests.has(key)) {
              this.registerChest(blockPos, "general", 50);
              found++;
            }
          }
        }
      }
    }

    console.log(`[${this.agentName}] Found and registered ${found} new chests`);
    return found;
  }

  /**
   * Get inventory report
   */
  getInventoryReport() {
    const items = this.bot.inventory.items();
    const report = [];

    report.push(`=== Inventory Report for ${this.agentName} ===`);
    report.push(`Utilization: ${this.getUtilization()}% (${items.length} stacks)`);
    report.push(`Registered Chests: ${this.storageChests.size}`);
    report.push("");

    // Group items by category
    const categories = {
      tools: [],
      weapons: [],
      food: [],
      materials: [],
      other: []
    };

    for (const item of items) {
      if (item.name.includes("pickaxe") || item.name.includes("axe") || item.name.includes("shovel")) {
        categories.tools.push(item);
      } else if (item.name.includes("sword") || item.name.includes("bow")) {
        categories.weapons.push(item);
      } else if (this.getItemPriority(item.name) >= 70 && item.name.includes("cooked")) {
        categories.food.push(item);
      } else if (item.name.includes("planks") || item.name.includes("stone") || item.name.includes("ingot")) {
        categories.materials.push(item);
      } else {
        categories.other.push(item);
      }
    }

    // Print categories
    for (const [category, items] of Object.entries(categories)) {
      if (items.length > 0) {
        report.push(`${category.toUpperCase()}:`);
        items.forEach(item => {
          report.push(`  - ${item.count}x ${item.name}`);
        });
        report.push("");
      }
    }

    return report.join("\n");
  }

  /**
   * Smart transfer - share items with team members
   */
  async shareItems(targetBot, itemName, count) {
    // This would require coordination with another bot
    // Implementation depends on bot-to-bot interaction system
    console.log(`[${this.agentName}] Sharing ${count}x ${itemName} with ${targetBot}`);

    logEvent(this.agentName, "inventory", {
      action: "share",
      target: targetBot,
      item: itemName,
      count
    });
  }
}

module.exports = { InventoryManager };
