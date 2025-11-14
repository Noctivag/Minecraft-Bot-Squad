const { logEvent } = require("../../memory/store");
const { OLLAMA_ENABLED } = require("../../llm/ollamaClient");

/**
 * Endless Task Generator - Ensures bots always have meaningful goals
 * Progressive complexity with procedural generation
 */
class EndlessTaskGenerator {
  constructor(bot, agentName) {
    this.bot = bot;
    this.agentName = agentName;
    this.completedTasks = new Set();
    this.currentPhase = "early_game"; // early_game, mid_game, late_game, endgame, post_game
    this.milestones = {
      early_game: 0,
      mid_game: 0,
      late_game: 0,
      endgame: 0,
      post_game: 0
    };
    this.activeGoals = [];
    this.loadPhaseDefinitions();
  }

  /**
   * Define progression phases
   */
  loadPhaseDefinitions() {
    this.phases = {
      early_game: {
        name: "Early Game - Survival Basics",
        milestones: [
          "gather_wood", "craft_tools", "build_shelter", "mine_stone",
          "craft_furnace", "smelt_iron", "create_farm", "get_food"
        ],
        threshold: 6
      },
      mid_game: {
        name: "Mid Game - Resource Expansion",
        milestones: [
          "mine_diamonds", "create_enchanting_setup", "build_iron_farm",
          "explore_villages", "trade_with_villagers", "build_nether_portal",
          "gather_blaze_rods", "brew_potions", "create_storage_system"
        ],
        threshold: 6
      },
      late_game: {
        name: "Late Game - Advanced Automation",
        milestones: [
          "create_mob_farm", "build_guardian_farm", "make_beacon",
          "gather_wither_skulls", "fight_wither", "max_enchant_gear",
          "build_ender_pearl_farm", "create_item_sorter", "build_villager_breeder"
        ],
        threshold: 6
      },
      endgame: {
        name: "Endgame - Dragon & Beyond",
        milestones: [
          "locate_stronghold", "activate_end_portal", "fight_ender_dragon",
          "build_end_base", "create_shulker_farm", "get_elytra",
          "explore_end_cities", "gather_shulker_boxes", "build_end_gateway_hub"
        ],
        threshold: 5
      },
      post_game: {
        name: "Post Game - Mega Projects",
        milestones: [
          "create_mega_base", "terraform_biome", "build_monument_replica",
          "create_full_beacon_pyramid", "build_flying_machine",
          "automate_all_farms", "create_redstone_computer", "build_castle",
          "max_all_villager_trades", "complete_advancement_tree"
        ],
        threshold: Infinity // Never ends
      }
    };
  }

  /**
   * Check current game state and determine phase
   */
  async assessGameState() {
    const inventory = this.getInventorySnapshot();
    const achievements = await this.checkAchievements();

    // Determine phase based on progress
    if (this.milestones.endgame >= this.phases.endgame.threshold) {
      this.currentPhase = "post_game";
    } else if (this.milestones.late_game >= this.phases.late_game.threshold) {
      this.currentPhase = "endgame";
    } else if (this.milestones.mid_game >= this.phases.mid_game.threshold) {
      this.currentPhase = "late_game";
    } else if (this.milestones.early_game >= this.phases.early_game.threshold) {
      this.currentPhase = "mid_game";
    }

    return {
      phase: this.currentPhase,
      progress: this.milestones,
      inventory,
      achievements
    };
  }

  /**
   * Generate endless tasks based on current phase
   */
  async generateTasks(count = 5) {
    const state = await this.assessGameState();
    const tasks = [];

    // Get phase-specific tasks
    const phaseTasks = this.getPhaseSpecificTasks(state);
    tasks.push(...phaseTasks.slice(0, 3));

    // Add expansion tasks
    tasks.push(...this.generateExpansionTasks(state, 2));

    // Add creative/building tasks
    if (this.currentPhase !== "early_game") {
      tasks.push(...this.generateCreativeTasks(state, 2));
    }

    // Add automation tasks (mid-game+)
    if (["mid_game", "late_game", "endgame", "post_game"].includes(this.currentPhase)) {
      tasks.push(...this.generateAutomationTasks(state, 2));
    }

    // Add exploration tasks
    tasks.push(...this.generateExplorationTasks(state, 2));

    // Add resource gathering (always needed)
    tasks.push(...this.generateResourceTasks(state, 3));

    // Shuffle and deduplicate
    const uniqueTasks = [...new Set(tasks)];
    return this.shuffleArray(uniqueTasks).slice(0, count);
  }

  /**
   * Get phase-specific milestone tasks
   */
  getPhaseSpecificTasks(state) {
    const phase = this.phases[this.currentPhase];
    const tasks = [];

    for (const milestone of phase.milestones) {
      if (!this.completedTasks.has(milestone)) {
        tasks.push({
          id: `milestone_${milestone}`,
          type: "milestone",
          description: this.getMilestoneDescription(milestone),
          priority: 10,
          phase: this.currentPhase,
          estimatedTime: this.estimateTaskTime(milestone),
          rewards: this.getTaskRewards(milestone)
        });
      }
    }

    return tasks;
  }

  /**
   * Generate expansion tasks (scale up existing systems)
   */
  generateExpansionTasks(state, count) {
    const tasks = [];
    const expansions = [
      { task: "expand_farm", desc: "Expand crop farm by 16x16", type: "farming" },
      { task: "build_second_base", desc: "Build outpost 1000 blocks away", type: "building" },
      { task: "create_tree_farm", desc: "Automated tree farm with saplings", type: "automation" },
      { task: "double_storage", desc: "Add 10 more double chests to storage", type: "organization" },
      { task: "breed_animals", desc: "Breed 20 cows and 20 chickens", type: "farming" },
      { task: "mine_ancient_debris", desc: "Collect 64 ancient debris", type: "mining" },
      { task: "create_villager_hall", desc: "Build hall for 10 villagers", type: "building" },
      { task: "enchant_full_set", desc: "Get full diamond armor with Protection IV", type: "progression" }
    ];

    const available = expansions.filter(e => this.isTaskRelevant(e.task, state));
    return available.slice(0, count);
  }

  /**
   * Generate creative building projects
   */
  generateCreativeTasks(state, count) {
    const projects = [
      { task: "build_castle", desc: "Medieval castle with towers", scale: "mega" },
      { task: "build_lighthouse", desc: "Functional lighthouse on coast", scale: "large" },
      { task: "build_bridge", desc: "Bridge across ravine or river", scale: "medium" },
      { task: "build_statue", desc: "Large statue or monument", scale: "large" },
      { task: "build_garden", desc: "Decorative garden with paths", scale: "medium" },
      { task: "build_railway", desc: "Minecart railway system (500+ blocks)", scale: "large" },
      { task: "build_arena", desc: "PvP or mob fighting arena", scale: "medium" },
      { task: "build_pyramid", desc: "Egyptian-style pyramid", scale: "mega" },
      { task: "build_underwater_base", desc: "Glass dome underwater base", scale: "large" },
      { task: "build_sky_base", desc: "Base at build height with elytra access", scale: "mega" }
    ];

    const suitable = projects.filter(p => {
      if (p.scale === "mega") return this.currentPhase === "post_game";
      if (p.scale === "large") return ["late_game", "endgame", "post_game"].includes(this.currentPhase);
      return true;
    });

    return this.shuffleArray(suitable).slice(0, count);
  }

  /**
   * Generate automation tasks
   */
  generateAutomationTasks(state, count) {
    const automations = [
      { task: "auto_smelter", desc: "Automated smelting system with hoppers", tech: "redstone" },
      { task: "auto_farm_wheat", desc: "Observer-based auto wheat farm", tech: "redstone" },
      { task: "auto_farm_sugarcane", desc: "Observer-based sugarcane farm", tech: "redstone" },
      { task: "auto_chicken_cooker", desc: "Automatic chicken farm with cooking", tech: "redstone" },
      { task: "item_sorter", desc: "Item sorting system for storage", tech: "redstone" },
      { task: "mob_grinder", desc: "Spawner-based mob grinder", tech: "basic" },
      { task: "iron_farm", desc: "Villager-based iron farm", tech: "advanced" },
      { task: "guardian_farm", desc: "Ocean monument guardian farm", tech: "advanced" },
      { task: "creeper_farm", desc: "Gunpowder farm with cats", tech: "advanced" },
      { task: "slime_farm", desc: "Slime chunk farm for slime balls", tech: "basic" }
    ];

    const techLevel = this.getTechLevel(state);
    const available = automations.filter(a => {
      if (a.tech === "advanced") return ["late_game", "endgame", "post_game"].includes(this.currentPhase);
      return true;
    });

    return available.slice(0, count);
  }

  /**
   * Generate exploration tasks
   */
  generateExplorationTasks(state, count) {
    const explorations = [
      { task: "find_village", desc: "Locate and map a village", biome: "plains" },
      { task: "find_desert_temple", desc: "Find and loot desert temple", biome: "desert" },
      { task: "find_jungle_temple", desc: "Find and loot jungle temple", biome: "jungle" },
      { task: "find_ocean_monument", desc: "Locate ocean monument", biome: "ocean" },
      { task: "find_woodland_mansion", desc: "Find woodland mansion", biome: "dark_forest" },
      { task: "find_stronghold", desc: "Use eyes of ender to find stronghold", phase: "endgame" },
      { task: "map_nether", desc: "Map 1000x1000 area of Nether", phase: "mid_game" },
      { task: "find_nether_fortress", desc: "Locate nether fortress", phase: "mid_game" },
      { task: "find_bastion", desc: "Find piglin bastion", phase: "mid_game" },
      { task: "explore_end", desc: "Explore 5 outer End islands", phase: "endgame" }
    ];

    const relevant = explorations.filter(e => {
      if (e.phase) return this.isPhaseReached(e.phase);
      return true;
    });

    return this.shuffleArray(relevant).slice(0, count);
  }

  /**
   * Generate resource gathering tasks
   */
  generateResourceTasks(state, count) {
    const resources = [
      { item: "oak_log", amount: 256, priority: 8 },
      { item: "cobblestone", amount: 1024, priority: 7 },
      { item: "iron_ore", amount: 128, priority: 9 },
      { item: "coal", amount: 256, priority: 7 },
      { item: "gold_ore", amount: 64, priority: 6 },
      { item: "diamond", amount: 16, priority: 10 },
      { item: "redstone", amount: 256, priority: 6 },
      { item: "lapis_lazuli", amount: 128, priority: 5 },
      { item: "emerald", amount: 32, priority: 7 },
      { item: "ancient_debris", amount: 16, priority: 10 },
      { item: "ender_pearl", amount: 12, priority: 9 },
      { item: "blaze_rod", amount: 10, priority: 9 },
      { item: "slime_ball", amount: 32, priority: 6 }
    ];

    const needed = resources.filter(r => {
      const current = this.getItemCount(r.item);
      return current < r.amount / 2;
    });

    return needed.slice(0, count).map(r => ({
      task: `gather_${r.item}`,
      desc: `Collect ${r.amount} ${r.item.replace(/_/g, " ")}`,
      type: "resource_gathering",
      priority: r.priority,
      target: { item: r.item, amount: r.amount }
    }));
  }

  /**
   * Mark task as completed and update milestones
   */
  async completeTask(taskId) {
    this.completedTasks.add(taskId);

    // Update milestone progress
    if (taskId.startsWith("milestone_")) {
      const milestone = taskId.replace("milestone_", "");
      const phase = this.findTaskPhase(milestone);
      if (phase) {
        this.milestones[phase]++;
        console.log(`[${this.agentName}] Milestone completed: ${milestone} (${phase}: ${this.milestones[phase]}/${this.phases[phase].threshold})`);
      }
    }

    await logEvent(this.agentName, "task_completed", {
      taskId,
      phase: this.currentPhase,
      totalCompleted: this.completedTasks.size
    });

    // Check for phase advancement
    await this.assessGameState();
  }

  /**
   * Get next recommended task
   */
  async getNextTask() {
    const tasks = await this.generateTasks(10);
    if (tasks.length === 0) {
      // Fallback: generate random creative task
      return {
        task: "creative_project",
        desc: "Build something creative and unique",
        type: "freeform",
        priority: 5
      };
    }

    // Sort by priority and return highest
    tasks.sort((a, b) => (b.priority || 5) - (a.priority || 5));
    return tasks[0];
  }

  // Helper methods
  getInventorySnapshot() {
    return this.bot.inventory.items().reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.count;
      return acc;
    }, {});
  }

  async checkAchievements() {
    // TODO: Integrate with actual advancement system
    return {};
  }

  getItemCount(itemName) {
    const items = this.bot.inventory.items().filter(i => i.name === itemName);
    return items.reduce((sum, item) => sum + item.count, 0);
  }

  isTaskRelevant(task, state) {
    // Simple relevance check based on phase
    return true; // TODO: Implement smart filtering
  }

  getTechLevel(state) {
    if (this.currentPhase === "early_game") return "basic";
    if (this.currentPhase === "mid_game") return "intermediate";
    return "advanced";
  }

  isPhaseReached(phase) {
    const order = ["early_game", "mid_game", "late_game", "endgame", "post_game"];
    return order.indexOf(this.currentPhase) >= order.indexOf(phase);
  }

  findTaskPhase(milestone) {
    for (const [phase, data] of Object.entries(this.phases)) {
      if (data.milestones.includes(milestone)) return phase;
    }
    return null;
  }

  getMilestoneDescription(milestone) {
    const descriptions = {
      gather_wood: "Collect 64 wood logs",
      craft_tools: "Craft wooden pickaxe, axe, and shovel",
      build_shelter: "Build a basic shelter with door",
      mine_stone: "Mine 128 cobblestone",
      craft_furnace: "Craft a furnace",
      smelt_iron: "Smelt 16 iron ingots",
      create_farm: "Create 9x9 crop farm",
      get_food: "Have 64 food items",
      mine_diamonds: "Mine 5 diamonds",
      create_enchanting_setup: "Build enchanting table with bookshelves",
      build_iron_farm: "Create iron golem farm",
      // Add more descriptions as needed
    };
    return descriptions[milestone] || `Complete: ${milestone.replace(/_/g, " ")}`;
  }

  estimateTaskTime(milestone) {
    // Estimate in minutes
    const timings = {
      gather_wood: 5,
      craft_tools: 2,
      build_shelter: 15,
      mine_stone: 10,
      mine_diamonds: 30,
      build_iron_farm: 60,
      fight_ender_dragon: 120
    };
    return timings[milestone] || 20;
  }

  getTaskRewards(milestone) {
    return {
      experience: 100,
      progression: 1
    };
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = { EndlessTaskGenerator };
