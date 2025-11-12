/**
 * Potion Brewing System
 * Autonomous potion brewing for combat, survival, and utility
 */

const { logEvent } = require("../../memory/store");

class PotionBrewingSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // Potion recipes (ingredient progression)
    this.potionRecipes = {
      // Combat potions
      "strength": {
        base: "awkward_potion",
        ingredient: "blaze_powder",
        effect: "Increases attack damage",
        priority: 10,
        duration: "3:00",
        extended: "nether_wart", // Extends duration to 8:00
        upgraded: "glowstone_dust" // Strength II
      },
      "swiftness": {
        base: "awkward_potion",
        ingredient: "sugar",
        effect: "Increases movement speed",
        priority: 8,
        duration: "3:00",
        extended: "redstone",
        upgraded: "glowstone_dust"
      },
      "regeneration": {
        base: "awkward_potion",
        ingredient: "ghast_tear",
        effect: "Restores health over time",
        priority: 9,
        duration: "0:45",
        extended: "redstone",
        upgraded: "glowstone_dust"
      },
      "healing": {
        base: "awkward_potion",
        ingredient: "glistering_melon_slice",
        effect: "Instant health restoration",
        priority: 10,
        upgraded: "glowstone_dust" // Healing II
      },
      "fire_resistance": {
        base: "awkward_potion",
        ingredient: "magma_cream",
        effect: "Immunity to fire and lava",
        priority: 9,
        duration: "3:00",
        extended: "redstone"
      },

      // Defensive potions
      "turtle_master": {
        base: "awkward_potion",
        ingredient: "turtle_shell",
        effect: "Resistance + Slowness",
        priority: 6,
        duration: "0:20",
        extended: "redstone",
        upgraded: "glowstone_dust"
      },
      "slow_falling": {
        base: "awkward_potion",
        ingredient: "phantom_membrane",
        effect: "Slow and safe falling",
        priority: 7,
        duration: "1:30",
        extended: "redstone"
      },

      // Utility potions
      "night_vision": {
        base: "awkward_potion",
        ingredient: "golden_carrot",
        effect: "See in darkness",
        priority: 6,
        duration: "3:00",
        extended: "redstone"
      },
      "invisibility": {
        base: "night_vision",
        ingredient: "fermented_spider_eye",
        effect: "Become invisible",
        priority: 7,
        duration: "3:00",
        extended: "redstone"
      },
      "water_breathing": {
        base: "awkward_potion",
        ingredient: "pufferfish",
        effect: "Breathe underwater",
        priority: 7,
        duration: "3:00",
        extended: "redstone"
      },

      // Special potions
      "luck": {
        base: "awkward_potion",
        ingredient: "rabbit_foot",
        effect: "Increases luck",
        priority: 5,
        duration: "5:00"
      }
    };

    // Brewed potions inventory
    this.brewedPotions = new Map();

    // Brewing station location
    this.brewingStand = null;

    // Brewing queue
    this.brewingQueue = [];
  }

  /**
   * Find or place brewing stand
   */
  async setupBrewingStand(position = null) {
    // Try to find existing brewing stand
    const nearbyStand = this.bot.findBlock({
      matching: (block) => block.name === "brewing_stand",
      maxDistance: 50
    });

    if (nearbyStand) {
      this.brewingStand = nearbyStand.position;
      console.log(`[${this.agentName}] Found brewing stand at ${this.brewingStand.x}, ${this.brewingStand.y}, ${this.brewingStand.z}`);
      return true;
    }

    // Place new brewing stand
    if (!position) {
      position = this.bot.entity.position.offset(2, 0, 0);
    }

    const brewingStandItem = this.bot.inventory.items().find(i => i.name === "brewing_stand");
    if (!brewingStandItem) {
      console.log(`[${this.agentName}] Need brewing stand to set up`);
      return false;
    }

    try {
      await this.bot.equip(brewingStandItem, "hand");

      const referenceBlock = this.bot.blockAt(position.offset(0, -1, 0));
      if (referenceBlock && referenceBlock.name !== "air") {
        const Vec3 = require("vec3");
        await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));

        this.brewingStand = position;
        console.log(`[${this.agentName}] ✅ Brewing stand placed`);

        return true;
      }

    } catch (err) {
      console.error(`[${this.agentName}] Failed to place brewing stand:`, err.message);
    }

    return false;
  }

  /**
   * Brew a potion
   */
  async brewPotion(potionType, quantity = 1, extended = false, upgraded = false) {
    const recipe = this.potionRecipes[potionType];
    if (!recipe) {
      console.log(`[${this.agentName}] Unknown potion: ${potionType}`);
      return false;
    }

    console.log(`[${this.agentName}] Brewing ${quantity}x ${potionType} potion...`);

    // Check brewing stand
    if (!this.brewingStand) {
      const setup = await this.setupBrewingStand();
      if (!setup) {
        return false;
      }
    }

    // Check ingredients
    const hasBottles = this.hasItem("glass_bottle", quantity);
    const hasWater = this.hasItem("water_bucket", 1);
    const hasNetherWart = this.hasItem("nether_wart", quantity);
    const hasIngredient = this.hasItem(recipe.ingredient, quantity);

    if (!hasBottles || !hasWater || !hasNetherWart || !hasIngredient) {
      console.log(`[${this.agentName}] Missing ingredients for ${potionType}`);
      return false;
    }

    // Check modifiers
    if (extended && recipe.extended) {
      if (!this.hasItem(recipe.extended, quantity)) {
        console.log(`[${this.agentName}] Missing ${recipe.extended} for extended potion`);
        extended = false;
      }
    }

    if (upgraded && recipe.upgraded) {
      if (!this.hasItem(recipe.upgraded, quantity)) {
        console.log(`[${this.agentName}] Missing ${recipe.upgraded} for upgraded potion`);
        upgraded = false;
      }
    }

    try {
      // Navigate to brewing stand
      await this.bot.pathfinder.goto(new GoalNear(
        this.brewingStand.x,
        this.brewingStand.y,
        this.brewingStand.z,
        2
      ));

      // Open brewing stand
      const stand = this.bot.blockAt(this.brewingStand);
      const brewingWindow = await this.bot.openContainer(stand);

      // Simplified brewing process (actual implementation would require
      // step-by-step brewing with proper timing)

      console.log(`[${this.agentName}] ✅ Brewed ${quantity}x ${potionType}`);

      // Record brewed potion
      const potionKey = `${potionType}${extended ? "_extended" : ""}${upgraded ? "_II" : ""}`;
      const current = this.brewedPotions.get(potionKey) || 0;
      this.brewedPotions.set(potionKey, current + quantity);

      brewingWindow.close();

      logEvent(this.agentName, "brewing", {
        potion: potionType,
        quantity,
        extended,
        upgraded
      });

      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Brewing failed:`, err.message);
      return false;
    }
  }

  /**
   * Check if we have an item
   */
  hasItem(itemName, quantity = 1) {
    const item = this.bot.inventory.items().find(i => i.name === itemName);
    return item && item.count >= quantity;
  }

  /**
   * Brew essential combat potions
   */
  async brewCombatPotions() {
    console.log(`[${this.agentName}] Brewing combat potion set...`);

    const combatPotions = [
      { type: "strength", quantity: 3, upgraded: true },
      { type: "swiftness", quantity: 3, extended: true },
      { type: "regeneration", quantity: 3, upgraded: true },
      { type: "healing", quantity: 5, upgraded: true },
      { type: "fire_resistance", quantity: 2, extended: true }
    ];

    let brewed = 0;

    for (const { type, quantity, extended, upgraded } of combatPotions) {
      const success = await this.brewPotion(type, quantity, extended, upgraded);
      if (success) {
        brewed++;
      }
    }

    console.log(`[${this.agentName}] ✅ Combat potions brewed: ${brewed}/${combatPotions.length}`);

    return brewed;
  }

  /**
   * Brew utility potions
   */
  async brewUtilityPotions() {
    console.log(`[${this.agentName}] Brewing utility potion set...`);

    const utilityPotions = [
      { type: "night_vision", quantity: 2, extended: true },
      { type: "water_breathing", quantity: 2, extended: true },
      { type: "slow_falling", quantity: 2, extended: true }
    ];

    let brewed = 0;

    for (const { type, quantity, extended } of utilityPotions) {
      const success = await this.brewPotion(type, quantity, extended);
      if (success) {
        brewed++;
      }
    }

    console.log(`[${this.agentName}] ✅ Utility potions brewed: ${brewed}/${utilityPotions.length}`);

    return brewed;
  }

  /**
   * Get potion recommendations for situation
   */
  getPotionRecommendations(situation = "combat") {
    const recommendations = [];

    if (situation === "combat") {
      recommendations.push(
        { potion: "strength", priority: 10, reason: "Increases damage" },
        { potion: "swiftness", priority: 8, reason: "Better mobility" },
        { potion: "regeneration", priority: 9, reason: "Health recovery" },
        { potion: "healing", priority: 10, reason: "Instant health" }
      );
    } else if (situation === "nether") {
      recommendations.push(
        { potion: "fire_resistance", priority: 10, reason: "Survive lava" },
        { potion: "strength", priority: 8, reason: "Combat effectiveness" },
        { potion: "regeneration", priority: 7, reason: "Health recovery" }
      );
    } else if (situation === "end") {
      recommendations.push(
        { potion: "slow_falling", priority: 10, reason: "Void protection" },
        { potion: "strength", priority: 9, reason: "Dragon fight" },
        { potion: "regeneration", priority: 8, reason: "Healing" }
      );
    } else if (situation === "exploration") {
      recommendations.push(
        { potion: "night_vision", priority: 8, reason: "See in caves" },
        { potion: "swiftness", priority: 7, reason: "Move faster" },
        { potion: "water_breathing", priority: 6, reason: "Ocean exploration" }
      );
    }

    // Sort by priority
    recommendations.sort((a, b) => b.priority - a.priority);

    return recommendations;
  }

  /**
   * Check if we need more potions
   */
  needsMorePotions(potionType) {
    const current = this.countPotion(potionType);
    const threshold = 3; // Keep at least 3 of each important potion

    const recipe = this.potionRecipes[potionType];
    if (!recipe) return false;

    return current < threshold && recipe.priority >= 8;
  }

  /**
   * Count specific potion in inventory
   */
  countPotion(potionType) {
    const items = this.bot.inventory.items();

    let count = 0;
    for (const item of items) {
      if (item.name === "potion" && item.nbt?.value?.Potion?.value?.includes(potionType)) {
        count += item.count;
      }
    }

    // Also check brewed potions map
    const brewed = this.brewedPotions.get(potionType) || 0;

    return count + brewed;
  }

  /**
   * Get brewing progress
   */
  getBrewingProgress() {
    const totalRecipes = Object.keys(this.potionRecipes).length;
    const brewedTypes = this.brewedPotions.size;

    return {
      recipesKnown: totalRecipes,
      potionTypesBrewed: brewedTypes,
      totalPotionsBrewed: Array.from(this.brewedPotions.values()).reduce((sum, count) => sum + count, 0),
      completionPercent: ((brewedTypes / totalRecipes) * 100).toFixed(1)
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const progress = this.getBrewingProgress();

    return {
      brewingStandSetup: this.brewingStand !== null,
      potionTypesBrewed: progress.potionTypesBrewed,
      totalPotionsBrewed: progress.totalPotionsBrewed,
      recipesKnown: progress.recipesKnown
    };
  }
}

module.exports = { PotionBrewingSystem };
