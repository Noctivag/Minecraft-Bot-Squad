/**
 * Complete Item Collection System
 * Track and obtain every item in Minecraft!
 */

const { logEvent } = require("../memory/store");

/**
 * All Minecraft Items categorized
 */
const ALL_ITEMS = {
  // Tools
  tools: [
    "wooden_pickaxe", "wooden_axe", "wooden_shovel", "wooden_hoe", "wooden_sword",
    "stone_pickaxe", "stone_axe", "stone_shovel", "stone_hoe", "stone_sword",
    "iron_pickaxe", "iron_axe", "iron_shovel", "iron_hoe", "iron_sword",
    "golden_pickaxe", "golden_axe", "golden_shovel", "golden_hoe", "golden_sword",
    "diamond_pickaxe", "diamond_axe", "diamond_shovel", "diamond_hoe", "diamond_sword",
    "netherite_pickaxe", "netherite_axe", "netherite_shovel", "netherite_hoe", "netherite_sword",
    "bow", "crossbow", "trident", "fishing_rod", "shears", "flint_and_steel",
    "bucket", "water_bucket", "lava_bucket", "milk_bucket", "powder_snow_bucket",
    "compass", "clock", "spyglass", "shield"
  ],

  // Armor
  armor: [
    "leather_helmet", "leather_chestplate", "leather_leggings", "leather_boots",
    "chainmail_helmet", "chainmail_chestplate", "chainmail_leggings", "chainmail_boots",
    "iron_helmet", "iron_chestplate", "iron_leggings", "iron_boots",
    "golden_helmet", "golden_chestplate", "golden_leggings", "golden_boots",
    "diamond_helmet", "diamond_chestplate", "diamond_leggings", "diamond_boots",
    "netherite_helmet", "netherite_chestplate", "netherite_leggings", "netherite_boots",
    "turtle_helmet", "elytra"
  ],

  // Blocks - Building
  blocks: [
    "stone", "granite", "diorite", "andesite", "cobblestone", "mossy_cobblestone",
    "oak_planks", "spruce_planks", "birch_planks", "jungle_planks", "acacia_planks", "dark_oak_planks",
    "oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log",
    "glass", "white_stained_glass", "black_stained_glass",
    "sandstone", "red_sandstone", "smooth_stone", "stone_bricks",
    "bricks", "nether_bricks", "end_stone_bricks", "prismarine", "dark_prismarine",
    "obsidian", "crying_obsidian", "netherrack", "soul_sand", "soul_soil",
    "concrete", "terracotta", "glazed_terracotta", "wool"
  ],

  // Ores and Minerals
  ores: [
    "coal_ore", "iron_ore", "copper_ore", "gold_ore", "redstone_ore",
    "lapis_ore", "diamond_ore", "emerald_ore",
    "coal", "raw_iron", "raw_copper", "raw_gold", "iron_ingot", "copper_ingot",
    "gold_ingot", "diamond", "emerald", "lapis_lazuli", "redstone",
    "quartz", "netherite_scrap", "netherite_ingot",
    "amethyst_shard", "prismarine_shard", "prismarine_crystals"
  ],

  // Food
  food: [
    "apple", "golden_apple", "enchanted_golden_apple",
    "bread", "cookie", "cake", "pumpkin_pie",
    "beef", "cooked_beef", "porkchop", "cooked_porkchop",
    "chicken", "cooked_chicken", "mutton", "cooked_mutton",
    "cod", "cooked_cod", "salmon", "cooked_salmon",
    "potato", "baked_potato", "poisonous_potato",
    "carrot", "golden_carrot", "beetroot", "beetroot_soup",
    "melon_slice", "sweet_berries", "glow_berries",
    "honey_bottle", "suspicious_stew", "mushroom_stew", "rabbit_stew"
  ],

  // Mob Drops
  mobDrops: [
    "bone", "string", "spider_eye", "gunpowder", "slime_ball",
    "ender_pearl", "blaze_rod", "ghast_tear", "magma_cream",
    "phantom_membrane", "shulker_shell", "dragon_breath",
    "leather", "rabbit_hide", "rabbit_foot",
    "feather", "egg", "ink_sac", "glow_ink_sac",
    "prismarine_crystals", "nautilus_shell", "heart_of_the_sea",
    "nether_star", "dragon_egg", "elytra"
  ],

  // Farming
  farming: [
    "wheat_seeds", "wheat", "beetroot_seeds", "beetroot",
    "carrot", "potato", "pumpkin_seeds", "pumpkin",
    "melon_seeds", "melon", "cocoa_beans",
    "sugar_cane", "bamboo", "cactus",
    "sweet_berries", "glow_berries", "chorus_fruit"
  ],

  // Redstone
  redstone: [
    "redstone", "redstone_torch", "redstone_block",
    "repeater", "comparator", "observer",
    "piston", "sticky_piston", "slime_block", "honey_block",
    "hopper", "dropper", "dispenser",
    "lever", "button", "pressure_plate", "tripwire_hook",
    "redstone_lamp", "daylight_detector",
    "note_block", "jukebox", "target"
  ],

  // Potions and Brewing
  potions: [
    "potion", "splash_potion", "lingering_potion",
    "potion_of_healing", "potion_of_fire_resistance", "potion_of_regeneration",
    "potion_of_strength", "potion_of_swiftness", "potion_of_night_vision",
    "potion_of_invisibility", "potion_of_water_breathing", "potion_of_leaping",
    "potion_of_slow_falling", "potion_of_turtle_master",
    "brewing_stand", "cauldron", "blaze_powder",
    "nether_wart", "fermented_spider_eye", "glistering_melon_slice"
  ],

  // Enchanting
  enchanting: [
    "enchanting_table", "bookshelf", "book", "enchanted_book",
    "anvil", "grindstone", "lapis_lazuli", "experience_bottle"
  ],

  // Transportation
  transportation: [
    "minecart", "chest_minecart", "furnace_minecart", "hopper_minecart", "tnt_minecart",
    "rail", "powered_rail", "detector_rail", "activator_rail",
    "boat", "oak_boat", "spruce_boat", "birch_boat",
    "saddle", "horse_armor", "lead", "name_tag"
  ],

  // Decorative
  decorative: [
    "painting", "item_frame", "glow_item_frame",
    "flower_pot", "banner", "carpet", "bed",
    "torch", "lantern", "soul_lantern", "campfire", "soul_campfire",
    "candle", "sea_pickle", "end_rod",
    "lectern", "barrel", "chest", "trapped_chest", "ender_chest",
    "crafting_table", "furnace", "blast_furnace", "smoker",
    "loom", "stonecutter", "smithing_table", "fletching_table",
    "cartography_table", "composter", "beehive", "bee_nest"
  ],

  // Music Discs
  musicDiscs: [
    "music_disc_13", "music_disc_cat", "music_disc_blocks",
    "music_disc_chirp", "music_disc_far", "music_disc_mall",
    "music_disc_mellohi", "music_disc_stal", "music_disc_strad",
    "music_disc_ward", "music_disc_11", "music_disc_wait",
    "music_disc_pigstep", "music_disc_otherside"
  ],

  // End Game Items
  endGame: [
    "dragon_egg", "elytra", "shulker_box", "end_crystal",
    "nether_star", "beacon", "conduit", "totem_of_undying",
    "trident", "heart_of_the_sea"
  ]
};

class ItemCollectionSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.collectedItems = new Set();
    this.itemGoals = new Map(); // item -> { priority, howToGet }
    this.loadProgress();
  }

  /**
   * Load progress from storage
   */
  loadProgress() {
    // TODO: Load from database
    console.log(`[${this.agentName}] Item collection system initialized`);
  }

  /**
   * Update collected items from inventory
   */
  updateCollectedItems() {
    const items = this.bot.inventory.items();

    let newItems = 0;
    for (const item of items) {
      if (!this.collectedItems.has(item.name)) {
        this.collectedItems.add(item.name);
        newItems++;

        logEvent(this.agentName, "item_collected", {
          item: item.name,
          totalUnique: this.collectedItems.size
        });

        console.log(`[${this.agentName}] 🎉 New item collected: ${item.name}!`);
      }
    }

    return newItems;
  }

  /**
   * Get collection statistics
   */
  getCollectionStats() {
    const totalItems = this.getTotalItemCount();
    const collected = this.collectedItems.size;
    const percentage = (collected / totalItems * 100).toFixed(2);

    const byCategory = {};
    for (const [category, items] of Object.entries(ALL_ITEMS)) {
      const categoryCollected = items.filter(item => this.collectedItems.has(item)).length;
      byCategory[category] = {
        collected: categoryCollected,
        total: items.length,
        percentage: (categoryCollected / items.length * 100).toFixed(1)
      };
    }

    return {
      collected,
      total: totalItems,
      percentage,
      byCategory
    };
  }

  /**
   * Get total number of collectible items
   */
  getTotalItemCount() {
    return Object.values(ALL_ITEMS).reduce((sum, items) => sum + items.length, 0);
  }

  /**
   * Get missing items by category
   */
  getMissingItems(category = null) {
    if (category) {
      const items = ALL_ITEMS[category] || [];
      return items.filter(item => !this.collectedItems.has(item));
    }

    const missing = {};
    for (const [cat, items] of Object.entries(ALL_ITEMS)) {
      missing[cat] = items.filter(item => !this.collectedItems.has(item));
    }
    return missing;
  }

  /**
   * Get next item to collect based on priority
   */
  getNextItemGoal() {
    const stats = this.getCollectionStats();

    // Prioritize categories with low completion
    const categories = Object.entries(stats.byCategory)
      .sort((a, b) => parseFloat(a[1].percentage) - parseFloat(b[1].percentage));

    for (const [category, stat] of categories) {
      if (stat.collected < stat.total) {
        const missing = this.getMissingItems(category);
        if (missing.length > 0) {
          return {
            item: missing[0],
            category,
            howToGet: this.getItemAcquisitionMethod(missing[0])
          };
        }
      }
    }

    return null;
  }

  /**
   * Determine how to acquire an item
   */
  getItemAcquisitionMethod(itemName) {
    // Tools - craft
    if (itemName.includes("pickaxe") || itemName.includes("axe") || itemName.includes("sword")) {
      return { method: "craft", materials: this.getCraftingMaterials(itemName) };
    }

    // Ores - mine
    if (itemName.includes("ore") || ["diamond", "emerald", "coal", "iron_ingot"].includes(itemName)) {
      return { method: "mine", biome: this.getBestMiningBiome(itemName) };
    }

    // Food - farm or kill
    if (ALL_ITEMS.food.includes(itemName)) {
      if (itemName.includes("cooked")) {
        return { method: "cook", rawItem: itemName.replace("cooked_", "") };
      }
      if (itemName.includes("beef") || itemName.includes("porkchop") || itemName.includes("chicken")) {
        return { method: "kill", mob: this.getMobForDrop(itemName) };
      }
      return { method: "farm", crop: itemName };
    }

    // Mob drops - kill mobs
    if (ALL_ITEMS.mobDrops.includes(itemName)) {
      return { method: "kill", mob: this.getMobForDrop(itemName) };
    }

    // Default: craft
    return { method: "craft", materials: [] };
  }

  /**
   * Get crafting materials for an item
   */
  getCraftingMaterials(itemName) {
    const materialMap = {
      "wooden_pickaxe": ["oak_planks:3", "stick:2"],
      "stone_pickaxe": ["cobblestone:3", "stick:2"],
      "iron_pickaxe": ["iron_ingot:3", "stick:2"],
      "diamond_pickaxe": ["diamond:3", "stick:2"],
      "iron_sword": ["iron_ingot:2", "stick:1"],
      "diamond_sword": ["diamond:2", "stick:1"],
      // Add more as needed
    };

    return materialMap[itemName] || [];
  }

  /**
   * Get best biome for mining specific ore
   */
  getBestMiningBiome(itemName) {
    const biomeMap = {
      "diamond_ore": "y_level:-59",
      "iron_ore": "y_level:16",
      "coal_ore": "y_level:96",
      "gold_ore": "badlands",
      "emerald_ore": "mountains"
    };

    return biomeMap[itemName] || "any";
  }

  /**
   * Get mob that drops specific item
   */
  getMobForDrop(itemName) {
    const mobMap = {
      "beef": "cow",
      "cooked_beef": "cow",
      "porkchop": "pig",
      "cooked_porkchop": "pig",
      "chicken": "chicken",
      "cooked_chicken": "chicken",
      "bone": "skeleton",
      "string": "spider",
      "gunpowder": "creeper",
      "ender_pearl": "enderman",
      "blaze_rod": "blaze",
      "ghast_tear": "ghast"
    };

    return mobMap[itemName] || "unknown";
  }

  /**
   * Print collection progress report
   */
  printCollectionReport() {
    const stats = this.getCollectionStats();

    console.log(`\n${"=".repeat(60)}`);
    console.log(`         ITEM COLLECTION PROGRESS - ${this.agentName}`);
    console.log("=".repeat(60));
    console.log(`\nOverall: ${stats.collected}/${stats.total} (${stats.percentage}%)`);
    console.log(`\nBy Category:`);

    for (const [category, stat] of Object.entries(stats.byCategory)) {
      const bar = "█".repeat(Math.floor(parseFloat(stat.percentage) / 5));
      const empty = "░".repeat(20 - bar.length);
      console.log(`  ${category.padEnd(15)} [${bar}${empty}] ${stat.collected}/${stat.total} (${stat.percentage}%)`);
    }

    const nextGoal = this.getNextItemGoal();
    if (nextGoal) {
      console.log(`\n🎯 Next Goal: ${nextGoal.item} (${nextGoal.category})`);
      console.log(`   Method: ${nextGoal.howToGet.method}`);
    }

    console.log("=".repeat(60) + "\n");
  }
}

module.exports = { ItemCollectionSystem, ALL_ITEMS };
