/**
 * End Game Progression System
 * Takes bots from starter to beating the Ender Dragon!
 */

const { logEvent } = require("../memory/store");
const { recordMetric } = require("../learning/metrics");

/**
 * Game Progression Stages
 */
const GAME_STAGES = {
  EARLY: "early_game",        // Wood, stone tools
  MID: "mid_game",            // Iron, diamonds, enchanting
  NETHER: "nether",           // Nether exploration, blaze rods
  STRONGHOLD: "stronghold",   // Finding stronghold, Eyes of Ender
  END: "end",                 // End dimension, Ender Dragon
  POST_GAME: "post_game"      // Wither, beacons, full completion
};

class EndGameSystem {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.currentStage = GAME_STAGES.EARLY;
    this.completedMilestones = [];
    this.inventory = null;
  }

  /**
   * Check current game stage based on items and progress
   */
  assessGameStage() {
    const items = this.bot.inventory.items().map(i => i.name);

    if (items.includes("dragon_egg") || items.includes("elytra")) {
      this.currentStage = GAME_STAGES.POST_GAME;
    } else if (items.includes("ender_pearl") && items.includes("blaze_powder")) {
      this.currentStage = GAME_STAGES.STRONGHOLD;
    } else if (items.includes("blaze_rod") || items.includes("nether_wart")) {
      this.currentStage = GAME_STAGES.NETHER;
    } else if (items.includes("diamond") || items.includes("enchanting_table")) {
      this.currentStage = GAME_STAGES.MID;
    } else if (items.includes("iron_ingot")) {
      this.currentStage = GAME_STAGES.MID;
    } else {
      this.currentStage = GAME_STAGES.EARLY;
    }

    return this.currentStage;
  }

  /**
   * Get next milestone to achieve
   */
  getNextMilestone() {
    const stage = this.assessGameStage();

    const milestones = {
      [GAME_STAGES.EARLY]: [
        { id: "wooden_tools", items: ["wooden_pickaxe", "wooden_axe"], priority: 10 },
        { id: "stone_tools", items: ["stone_pickaxe", "stone_axe", "stone_sword"], priority: 9 },
        { id: "food_source", items: ["cooked_beef", "bread"], minCount: 20, priority: 9 },
        { id: "shelter", structure: "simple_house", priority: 8 }
      ],
      [GAME_STAGES.MID]: [
        { id: "iron_tools", items: ["iron_pickaxe", "iron_sword", "iron_axe"], priority: 10 },
        { id: "iron_armor", items: ["iron_helmet", "iron_chestplate", "iron_leggings", "iron_boots"], priority: 9 },
        { id: "diamonds", items: ["diamond"], minCount: 5, priority: 10 },
        { id: "diamond_pickaxe", items: ["diamond_pickaxe"], priority: 10 },
        { id: "enchanting_setup", items: ["enchanting_table", "bookshelf"], priority: 8 },
        { id: "bucket", items: ["bucket"], minCount: 3, priority: 7 }
      ],
      [GAME_STAGES.NETHER]: [
        { id: "obsidian", items: ["obsidian"], minCount: 14, priority: 10 },
        { id: "nether_portal", structure: "nether_portal", priority: 10 },
        { id: "fire_resistance", items: ["potion_of_fire_resistance"], minCount: 3, priority: 9 },
        { id: "blaze_rods", items: ["blaze_rod"], minCount: 10, priority: 10 },
        { id: "ender_pearls", items: ["ender_pearl"], minCount: 12, priority: 10 },
        { id: "nether_wart", items: ["nether_wart"], minCount: 32, priority: 7 }
      ],
      [GAME_STAGES.STRONGHOLD]: [
        { id: "eyes_of_ender", items: ["eye_of_ender"], minCount: 12, priority: 10 },
        { id: "find_stronghold", action: "locate_stronghold", priority: 10 },
        { id: "full_diamond_armor", items: ["diamond_helmet", "diamond_chestplate", "diamond_leggings", "diamond_boots"], priority: 9 },
        { id: "diamond_sword", items: ["diamond_sword"], priority: 9 },
        { id: "bow_arrows", items: ["bow", "arrow"], minCount: 128, priority: 8 },
        { id: "golden_apples", items: ["golden_apple"], minCount: 5, priority: 8 }
      ],
      [GAME_STAGES.END]: [
        { id: "beds", items: ["bed"], minCount: 6, priority: 9 },
        { id: "slow_falling", items: ["potion_of_slow_falling"], minCount: 2, priority: 8 },
        { id: "water_buckets", items: ["water_bucket"], minCount: 2, priority: 8 },
        { id: "fight_dragon", action: "ender_dragon", priority: 10 }
      ],
      [GAME_STAGES.POST_GAME]: [
        { id: "nether_stars", items: ["nether_star"], minCount: 4, priority: 9 },
        { id: "beacon", items: ["beacon"], minCount: 1, priority: 8 },
        { id: "elytra", items: ["elytra"], priority: 10 },
        { id: "shulker_boxes", items: ["shulker_box"], minCount: 8, priority: 7 }
      ]
    };

    const stageMilestones = milestones[stage] || [];

    // Find first incomplete milestone
    for (const milestone of stageMilestones) {
      if (!this.completedMilestones.includes(milestone.id)) {
        return milestone;
      }
    }

    return null;
  }

  /**
   * Build Nether Portal
   */
  async buildNetherPortal(position) {
    console.log(`[${this.agentName}] Building Nether Portal...`);

    // Check for obsidian
    const obsidian = this.bot.inventory.items().find(i => i.name === "obsidian");
    if (!obsidian || obsidian.count < 14) {
      console.log(`[${this.agentName}] Need 14 obsidian (have ${obsidian?.count || 0})`);
      return false;
    }

    try {
      // Place obsidian frame (4x5)
      const frame = [
        // Bottom
        {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}, {x: 3, y: 0, z: 0},
        // Left side
        {x: 0, y: 1, z: 0}, {x: 0, y: 2, z: 0}, {x: 0, y: 3, z: 0}, {x: 0, y: 4, z: 0},
        // Right side
        {x: 3, y: 1, z: 0}, {x: 3, y: 2, z: 0}, {x: 3, y: 3, z: 0}, {x: 3, y: 4, z: 0},
        // Top
        {x: 1, y: 4, z: 0}, {x: 2, y: 4, z: 0}
      ];

      for (const offset of frame) {
        const blockPos = {
          x: position.x + offset.x,
          y: position.y + offset.y,
          z: position.z + offset.z
        };

        await this.bot.equip(obsidian, "hand");

        const referenceBlock = this.bot.blockAt(blockPos.offset(0, -1, 0));
        if (referenceBlock) {
          const Vec3 = require("vec3");
          await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Light portal with flint and steel
      const flintSteel = this.bot.inventory.items().find(i => i.name === "flint_and_steel");
      if (flintSteel) {
        await this.bot.equip(flintSteel, "hand");
        const bottomBlock = this.bot.blockAt(position.offset(1, 0, 0));
        if (bottomBlock) {
          await this.bot.activateBlock(bottomBlock);
        }
      }

      logEvent(this.agentName, "milestone", { milestone: "nether_portal_built" });
      this.completedMilestones.push("nether_portal");

      console.log(`[${this.agentName}] Nether Portal built successfully!`);
      return true;

    } catch (err) {
      console.error(`[${this.agentName}] Failed to build portal:`, err.message);
      return false;
    }
  }

  /**
   * Prepare for Nether exploration
   */
  async prepareForNether() {
    console.log(`[${this.agentName}] Preparing for Nether exploration...`);

    const checklist = {
      "iron_armor": 4,
      "iron_sword": 1,
      "food": 32,
      "blocks": 64,
      "pickaxe": 1,
      "bucket": 1
    };

    const missing = [];
    for (const [item, count] of Object.entries(checklist)) {
      const has = this.countItem(item);
      if (has < count) {
        missing.push({ item, need: count - has });
      }
    }

    if (missing.length > 0) {
      console.log(`[${this.agentName}] Missing items for Nether:`);
      missing.forEach(m => console.log(`  - ${m.item}: need ${m.need} more`));
      return false;
    }

    console.log(`[${this.agentName}] Ready for Nether!`);
    return true;
  }

  /**
   * Fight Ender Dragon strategy
   */
  async fightEnderDragon() {
    console.log(`[${this.agentName}] Engaging Ender Dragon!`);

    // Strategy:
    // 1. Destroy End Crystals with bow
    // 2. Wait for dragon to perch
    // 3. Attack with sword when close
    // 4. Use beds to damage dragon (risky but effective)
    // 5. Use water bucket for safety

    logEvent(this.agentName, "boss_fight", { boss: "ender_dragon", status: "engaged" });

    // Find Ender Dragon
    const dragon = Object.values(this.bot.entities).find(e =>
      e.name === "ender_dragon"
    );

    if (!dragon) {
      console.log(`[${this.agentName}] No Ender Dragon found!`);
      return false;
    }

    // TODO: Implement full dragon fight AI
    // This would require:
    // - End crystal targeting
    // - Dragon position prediction
    // - Bed explosion timing
    // - Water bucket clutches
    // - Healing management

    console.log(`[${this.agentName}] Dragon fight AI not yet implemented`);
    return false;
  }

  /**
   * Count specific item in inventory
   */
  countItem(itemName) {
    const items = this.bot.inventory.items().filter(i =>
      i.name.includes(itemName) || itemName.includes(i.name)
    );
    return items.reduce((sum, item) => sum + item.count, 0);
  }

  /**
   * Get game progression status
   */
  getProgressionStatus() {
    const stage = this.assessGameStage();
    const nextMilestone = this.getNextMilestone();

    return {
      currentStage: stage,
      completedMilestones: this.completedMilestones.length,
      nextMilestone: nextMilestone?.id || "complete",
      progressPercent: this.calculateProgress()
    };
  }

  /**
   * Calculate overall game completion percentage
   */
  calculateProgress() {
    const totalMilestones = 30; // Approximate total milestones
    return Math.min(100, (this.completedMilestones.length / totalMilestones) * 100);
  }

  /**
   * Mark milestone as complete
   */
  completeMilestone(milestoneId) {
    if (!this.completedMilestones.includes(milestoneId)) {
      this.completedMilestones.push(milestoneId);

      logEvent(this.agentName, "milestone_complete", {
        milestone: milestoneId,
        totalCompleted: this.completedMilestones.length
      });

      recordMetric(this.agentName, "milestone_completion", 1, { milestone: milestoneId });

      console.log(`[${this.agentName}] ✅ Milestone Complete: ${milestoneId}`);
    }
  }
}

module.exports = { EndGameSystem, GAME_STAGES };
