/**
 * Achievement Tracking and Completion System
 * Tracks all Minecraft achievements and executes plans to complete them
 */

const { logEvent } = require("../memory/store");

class AchievementSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;

    // All Minecraft achievements with completion criteria
    this.achievements = {
      // Basic achievements
      "minecraft:story/mine_stone": {
        name: "Stone Age",
        description: "Mine stone with a pickaxe",
        category: "story",
        completed: false,
        action: { type: "mine", block: "stone", tool: "wooden_pickaxe" }
      },
      "minecraft:story/upgrade_tools": {
        name: "Getting an Upgrade",
        description: "Construct a better pickaxe",
        category: "story",
        completed: false,
        action: { type: "craft", item: "stone_pickaxe" }
      },
      "minecraft:story/smelt_iron": {
        name: "Acquire Hardware",
        description: "Smelt an iron ingot",
        category: "story",
        completed: false,
        action: { type: "smelt", item: "iron_ingot", from: "raw_iron" }
      },
      "minecraft:story/iron_tools": {
        name: "Isn't It Iron Pick",
        description: "Upgrade to an iron pickaxe",
        category: "story",
        completed: false,
        action: { type: "craft", item: "iron_pickaxe" }
      },
      "minecraft:story/lava_bucket": {
        name: "Hot Stuff",
        description: "Fill a bucket with lava",
        category: "story",
        completed: false,
        action: { type: "collect", item: "lava_bucket" }
      },
      "minecraft:story/obtain_armor": {
        name: "Suit Up",
        description: "Protect yourself with a piece of iron armor",
        category: "story",
        completed: false,
        action: { type: "craft_or_find", item: "iron_chestplate" }
      },
      "minecraft:story/mine_diamond": {
        name: "Diamonds!",
        description: "Acquire diamonds",
        category: "story",
        completed: false,
        action: { type: "mine", block: "diamond_ore", tool: "iron_pickaxe" }
      },
      "minecraft:story/enter_the_nether": {
        name: "We Need to Go Deeper",
        description: "Build, light and enter a Nether Portal",
        category: "story",
        completed: false,
        action: { type: "build_and_enter", structure: "nether_portal" }
      },
      "minecraft:story/shiny_gear": {
        name: "Cover Me With Diamonds",
        description: "Diamond armor saves lives",
        category: "story",
        completed: false,
        action: { type: "equip", items: ["diamond_helmet", "diamond_chestplate", "diamond_leggings", "diamond_boots"] }
      },
      "minecraft:story/enchant_item": {
        name: "Enchanter",
        description: "Enchant an item at an Enchanting Table",
        category: "story",
        completed: false,
        action: { type: "enchant", item: "any" }
      },
      "minecraft:story/cure_zombie_villager": {
        name: "Zombie Doctor",
        description: "Weaken and then cure a Zombie Villager",
        category: "story",
        completed: false,
        action: { type: "cure", target: "zombie_villager" }
      },
      "minecraft:story/follow_ender_eye": {
        name: "Eye Spy",
        description: "Follow an Eye of Ender",
        category: "story",
        completed: false,
        action: { type: "use", item: "ender_eye" }
      },
      "minecraft:story/enter_the_end": {
        name: "The End?",
        description: "Enter the End Portal",
        category: "story",
        completed: false,
        action: { type: "enter", portal: "end_portal" }
      },

      // Nether achievements
      "minecraft:nether/return_to_sender": {
        name: "Return to Sender",
        description: "Destroy a Ghast with a fireball",
        category: "nether",
        completed: false,
        action: { type: "deflect_fireball", target: "ghast" }
      },
      "minecraft:nether/find_bastion": {
        name: "Those Were the Days",
        description: "Enter a Bastion Remnant",
        category: "nether",
        completed: false,
        action: { type: "explore", structure: "bastion_remnant" }
      },
      "minecraft:nether/obtain_ancient_debris": {
        name: "Hidden in the Depths",
        description: "Obtain Ancient Debris",
        category: "nether",
        completed: false,
        action: { type: "mine", block: "ancient_debris", tool: "diamond_pickaxe", location: "nether" }
      },
      "minecraft:nether/netherite_armor": {
        name: "Cover Me in Debris",
        description: "Get a full suit of Netherite armor",
        category: "nether",
        completed: false,
        action: { type: "upgrade", items: ["netherite_helmet", "netherite_chestplate", "netherite_leggings", "netherite_boots"] }
      },
      "minecraft:nether/fast_travel": {
        name: "Subspace Bubble",
        description: "Use the Nether to travel 7km in the Overworld",
        category: "nether",
        completed: false,
        action: { type: "travel", distance: 7000, method: "nether_portal" }
      },
      "minecraft:nether/find_fortress": {
        name: "A Terrible Fortress",
        description: "Break your way into a Nether Fortress",
        category: "nether",
        completed: false,
        action: { type: "explore", structure: "nether_fortress" }
      },
      "minecraft:nether/obtain_blaze_rod": {
        name: "Into Fire",
        description: "Relieve a Blaze of its rod",
        category: "nether",
        completed: false,
        action: { type: "kill", mob: "blaze", drop: "blaze_rod" }
      },
      "minecraft:nether/get_wither_skull": {
        name: "Spooky Scary Skeleton",
        description: "Obtain a Wither Skeleton's skull",
        category: "nether",
        completed: false,
        action: { type: "kill", mob: "wither_skeleton", drop: "wither_skeleton_skull" }
      },
      "minecraft:nether/summon_wither": {
        name: "Withering Heights",
        description: "Summon the Wither",
        category: "nether",
        completed: false,
        action: { type: "summon", boss: "wither" }
      },
      "minecraft:nether/brew_potion": {
        name: "Local Brewery",
        description: "Brew a potion",
        category: "nether",
        completed: false,
        action: { type: "brew", item: "potion" }
      },

      // The End achievements
      "minecraft:end/kill_dragon": {
        name: "Free the End",
        description: "Good luck",
        category: "end",
        completed: false,
        action: { type: "kill", boss: "ender_dragon" }
      },
      "minecraft:end/dragon_egg": {
        name: "The Next Generation",
        description: "Hold the Dragon Egg",
        category: "end",
        completed: false,
        action: { type: "collect", item: "dragon_egg" }
      },
      "minecraft:end/enter_end_gateway": {
        name: "Remote Getaway",
        description: "Escape the island",
        category: "end",
        completed: false,
        action: { type: "enter", portal: "end_gateway" }
      },
      "minecraft:end/find_end_city": {
        name: "The City at the End of the Game",
        description: "Go into the End City",
        category: "end",
        completed: false,
        action: { type: "explore", structure: "end_city" }
      },
      "minecraft:end/elytra": {
        name: "Sky's the Limit",
        description: "Find elytra",
        category: "end",
        completed: false,
        action: { type: "collect", item: "elytra" }
      },
      "minecraft:end/levitate": {
        name: "Great View From Up Here",
        description: "Levitate up 50 blocks from attacks of a Shulker",
        category: "end",
        completed: false,
        action: { type: "get_effect", effect: "levitation", duration: 10 }
      },

      // Adventure achievements
      "minecraft:adventure/voluntary_exile": {
        name: "Voluntary Exile",
        description: "Kill a raid captain",
        category: "adventure",
        completed: false,
        action: { type: "kill", mob: "pillager_captain" }
      },
      "minecraft:adventure/hero_of_the_village": {
        name: "Hero of the Village",
        description: "Successfully defend a village from a raid",
        category: "adventure",
        completed: false,
        action: { type: "defend", event: "raid" }
      },
      "minecraft:adventure/trade": {
        name: "What a Deal!",
        description: "Successfully trade with a Villager",
        category: "adventure",
        completed: false,
        action: { type: "trade", target: "villager" }
      },
      "minecraft:adventure/honey_block_slide": {
        name: "Sticky Situation",
        description: "Slide down a honey block to slow your fall",
        category: "adventure",
        completed: false,
        action: { type: "slide", block: "honey_block" }
      },
      "minecraft:adventure/totem_of_undying": {
        name: "Postmortal",
        description: "Use a Totem of Undying to cheat death",
        category: "adventure",
        completed: false,
        action: { type: "use", item: "totem_of_undying" }
      },
      "minecraft:adventure/summon_iron_golem": {
        name: "Hired Help",
        description: "Summon an Iron Golem to help defend a village",
        category: "adventure",
        completed: false,
        action: { type: "summon", mob: "iron_golem" }
      },

      // Husbandry achievements
      "minecraft:husbandry/breed_an_animal": {
        name: "The Parrots and the Bats",
        description: "Breed two animals together",
        category: "husbandry",
        completed: false,
        action: { type: "breed", animals: "any" }
      },
      "minecraft:husbandry/tame_an_animal": {
        name: "Best Friends Forever",
        description: "Tame an animal",
        category: "husbandry",
        completed: false,
        action: { type: "tame", animal: "wolf" }
      },
      "minecraft:husbandry/fishy_business": {
        name: "Fishy Business",
        description: "Catch a fish",
        category: "husbandry",
        completed: false,
        action: { type: "fish", item: "cod" }
      },
      "minecraft:husbandry/silk_touch_nest": {
        name: "Total Beelocation",
        description: "Move a Bee Nest with 3 bees inside using Silk Touch",
        category: "husbandry",
        completed: false,
        action: { type: "mine", block: "bee_nest", tool: "silk_touch_pickaxe" }
      },
      "minecraft:husbandry/plant_seed": {
        name: "A Seedy Place",
        description: "Plant a seed and watch it grow",
        category: "husbandry",
        completed: false,
        action: { type: "plant", item: "wheat_seeds" }
      },
      "minecraft:husbandry/balanced_diet": {
        name: "A Balanced Diet",
        description: "Eat everything that is edible",
        category: "husbandry",
        completed: false,
        action: { type: "eat_all", items: "all_food" }
      }
    };

    // Track completion
    this.completedCount = 0;
    this.totalCount = Object.keys(this.achievements).length;

    // Current achievement goal
    this.currentGoal = null;
  }

  /**
   * Mark achievement as completed
   */
  completeAchievement(achievementId) {
    const achievement = this.achievements[achievementId];

    if (achievement && !achievement.completed) {
      achievement.completed = true;
      achievement.completedAt = Date.now();
      this.completedCount++;

      console.log(`[${this.agentName}] 🏆 Achievement unlocked: ${achievement.name}!`);
      console.log(`[${this.agentName}] "${achievement.description}"`);
      console.log(`[${this.agentName}] Progress: ${this.completedCount}/${this.totalCount} (${this.getCompletionPercent()}%)`);

      logEvent(this.agentName, "achievement", {
        id: achievementId,
        name: achievement.name
      });

      return true;
    }

    return false;
  }

  /**
   * Get next achievement to work on
   */
  getNextAchievement() {
    // Prioritize by category: story > nether > end > adventure > husbandry
    const priorities = ["story", "nether", "end", "adventure", "husbandry"];

    for (const category of priorities) {
      for (const [id, achievement] of Object.entries(this.achievements)) {
        if (!achievement.completed && achievement.category === category) {
          return { id, ...achievement };
        }
      }
    }

    return null;
  }

  /**
   * Get action plan for an achievement
   */
  getActionPlan(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.completed) {
      return null;
    }

    const action = achievement.action;
    const plan = {
      achievementId,
      name: achievement.name,
      steps: []
    };

    // Generate step-by-step plan based on action type
    switch (action.type) {
      case "mine":
        plan.steps = [
          { action: "craft_or_find", item: action.tool },
          { action: "find", block: action.block },
          { action: "mine", block: action.block }
        ];
        break;

      case "craft":
        plan.steps = [
          { action: "gather_materials", recipe: action.item },
          { action: "craft", item: action.item }
        ];
        break;

      case "smelt":
        plan.steps = [
          { action: "mine", block: action.from },
          { action: "gather", item: "coal" },
          { action: "smelt", item: action.item }
        ];
        break;

      case "kill":
        plan.steps = [
          { action: "prepare_combat", target: action.mob || action.boss },
          { action: "find", mob: action.mob || action.boss },
          { action: "kill", target: action.mob || action.boss }
        ];
        break;

      case "build_and_enter":
        plan.steps = [
          { action: "gather_materials", structure: action.structure },
          { action: "build", structure: action.structure },
          { action: "enter", structure: action.structure }
        ];
        break;

      case "collect":
        plan.steps = [
          { action: "find", item: action.item },
          { action: "collect", item: action.item }
        ];
        break;

      case "enchant":
        plan.steps = [
          { action: "build", structure: "enchanting_table" },
          { action: "gather", item: "lapis_lazuli" },
          { action: "enchant", item: action.item }
        ];
        break;

      case "breed":
        plan.steps = [
          { action: "find", animals: action.animals },
          { action: "gather", item: "wheat" },
          { action: "breed", animals: action.animals }
        ];
        break;

      case "tame":
        plan.steps = [
          { action: "find", animal: action.animal },
          { action: "gather", item: "bone" },
          { action: "tame", animal: action.animal }
        ];
        break;

      default:
        plan.steps = [
          { action: "custom", details: action }
        ];
    }

    return plan;
  }

  /**
   * Auto-detect completed achievements based on inventory/state
   */
  autoDetectCompletions() {
    const inventory = this.bot.inventory.items();
    const inventoryNames = inventory.map(i => i.name);

    // Check simple collection achievements
    if (inventoryNames.includes("stone")) {
      this.completeAchievement("minecraft:story/mine_stone");
    }

    if (inventoryNames.includes("stone_pickaxe")) {
      this.completeAchievement("minecraft:story/upgrade_tools");
    }

    if (inventoryNames.includes("iron_ingot")) {
      this.completeAchievement("minecraft:story/smelt_iron");
    }

    if (inventoryNames.includes("iron_pickaxe")) {
      this.completeAchievement("minecraft:story/iron_tools");
    }

    if (inventoryNames.includes("lava_bucket")) {
      this.completeAchievement("minecraft:story/lava_bucket");
    }

    if (inventoryNames.includes("diamond")) {
      this.completeAchievement("minecraft:story/mine_diamond");
    }

    // Check armor achievements
    const armorSlots = ["head", "torso", "legs", "feet"];
    const equipment = armorSlots.map(slot => this.bot.inventory.slots[this.bot.getEquipmentDestSlot(slot)]);

    const hasIronArmor = equipment.some(item => item && item.name.includes("iron_"));
    if (hasIronArmor) {
      this.completeAchievement("minecraft:story/obtain_armor");
    }

    const hasDiamondArmor = equipment.every(item => item && item.name.includes("diamond_"));
    if (hasDiamondArmor) {
      this.completeAchievement("minecraft:story/shiny_gear");
    }

    // Nether achievements
    if (inventoryNames.includes("blaze_rod")) {
      this.completeAchievement("minecraft:nether/obtain_blaze_rod");
    }

    if (inventoryNames.includes("wither_skeleton_skull")) {
      this.completeAchievement("minecraft:nether/get_wither_skull");
    }

    if (inventoryNames.includes("ancient_debris")) {
      this.completeAchievement("minecraft:nether/obtain_ancient_debris");
    }

    // End achievements
    if (inventoryNames.includes("dragon_egg")) {
      this.completeAchievement("minecraft:end/dragon_egg");
    }

    if (inventoryNames.includes("elytra")) {
      this.completeAchievement("minecraft:end/elytra");
    }

    // Husbandry
    if (inventoryNames.includes("cod") || inventoryNames.includes("salmon")) {
      this.completeAchievement("minecraft:husbandry/fishy_business");
    }
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category) {
    return Object.entries(this.achievements)
      .filter(([id, ach]) => ach.category === category)
      .map(([id, ach]) => ({ id, ...ach }));
  }

  /**
   * Get completion statistics
   */
  getStats() {
    const byCategory = {};

    for (const [id, achievement] of Object.entries(this.achievements)) {
      if (!byCategory[achievement.category]) {
        byCategory[achievement.category] = { completed: 0, total: 0 };
      }

      byCategory[achievement.category].total++;
      if (achievement.completed) {
        byCategory[achievement.category].completed++;
      }
    }

    return {
      completed: this.completedCount,
      total: this.totalCount,
      percent: this.getCompletionPercent(),
      byCategory
    };
  }

  /**
   * Get completion percentage
   */
  getCompletionPercent() {
    return ((this.completedCount / this.totalCount) * 100).toFixed(1);
  }

  /**
   * List incomplete achievements
   */
  getIncompleteAchievements() {
    return Object.entries(this.achievements)
      .filter(([id, ach]) => !ach.completed)
      .map(([id, ach]) => ({ id, ...ach }));
  }

  /**
   * Get priority achievement to work on
   */
  getPriorityAchievement() {
    const next = this.getNextAchievement();
    if (next) {
      this.currentGoal = next;
    }
    return this.currentGoal;
  }
}

module.exports = { AchievementSystem };
