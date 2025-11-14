const { retrieve } = require("../knowledge/retriever");
const { generate, OLLAMA_ENABLED } = require("../llm/ollamaClient");
const { planCraft } = require("../crafting/planner");
const { logEvent } = require("../memory/store");
const { executePlan } = require("./tools/skillsRegistry");

// Erweiterte Task-Generatoren
const taskGenerators = {
  async generateEndlessTasks(agentName, perception) {
    const inv = perception.inventory || {};
    const tasks = [];

    // Phase-basierte Progression
    const phase = this.determinePhase(inv, perception);
    
    // Immer: Resource Gathering
    tasks.push(...this.generateResourceTasks(inv, phase));
    
    // Immer: Building Projects
    tasks.push(...this.generateBuildingTasks(phase));
    
    // Mid-Game+: Automation
    if (["mid_game", "late_game", "endgame", "post_game"].includes(phase)) {
      tasks.push(...this.generateAutomationTasks(phase));
    }
    
    // Late-Game+: Exploration & Combat
    if (["late_game", "endgame", "post_game"].includes(phase)) {
      tasks.push(...this.generateExplorationTasks(phase));
    }
    
    // Post-Game: Mega Projects
    if (phase === "post_game") {
      tasks.push(...this.generateMegaProjects());
    }

    return tasks.slice(0, 5);
  },

  determinePhase(inv, perception) {
    const hasItem = (name) => inv[name] > 0;
    
    if (hasItem("netherite_sword") || hasItem("elytra")) return "post_game";
    if (hasItem("ender_pearl") && inv.ender_pearl >= 12) return "endgame";
    if (hasItem("diamond_pickaxe") || hasItem("enchanting_table")) return "late_game";
    if (hasItem("iron_pickaxe") && hasItem("iron_ingot")) return "mid_game";
    return "early_game";
  },

  generateResourceTasks(inv, phase) {
    const tasks = [];
    const targets = {
      early_game: [
        { item: "oak_log", amount: 64, task: "gather_wood" },
        { item: "cobblestone", amount: 256, task: "mine_stone" },
        { item: "coal", amount: 64, task: "mine_coal" }
      ],
      mid_game: [
        { item: "iron_ore", amount: 64, task: "mine_iron" },
        { item: "gold_ore", amount: 32, task: "mine_gold" },
        { item: "diamond", amount: 8, task: "mine_diamonds" }
      ],
      late_game: [
        { item: "ancient_debris", amount: 16, task: "mine_netherite" },
        { item: "ender_pearl", amount: 16, task: "hunt_endermen" },
        { item: "blaze_rod", amount: 10, task: "farm_blazes" }
      ]
    };

    const phaseTargets = targets[phase] || targets.early_game;
    for (const { item, amount, task } of phaseTargets) {
      if ((inv[item] || 0) < amount / 2) {
        tasks.push({
          task: `${task} x${amount}`,
          reason: `Need more ${item} for progression`,
          priority: 8,
          type: "resource_gathering"
        });
      }
    }

    return tasks;
  },

  generateBuildingTasks(phase) {
    const projects = {
      early_game: [
        { task: "build_shelter 5x5", reason: "Basic protection", priority: 10 },
        { task: "build_storage_room", reason: "Organize items", priority: 8 },
        { task: "create_crop_farm 9x9", reason: "Food sustainability", priority: 9 }
      ],
      mid_game: [
        { task: "build_enchanting_room", reason: "Gear upgrades", priority: 9 },
        { task: "build_nether_portal", reason: "Access nether", priority: 10 },
        { task: "build_villager_trading_hall", reason: "Trading system", priority: 7 }
      ],
      late_game: [
        { task: "build_end_portal_room", reason: "Prepare for dragon", priority: 10 },
        { task: "build_mob_farm", reason: "Automated XP/drops", priority: 8 },
        { task: "build_beacon_pyramid", reason: "Status effects", priority: 7 }
      ],
      post_game: [
        { task: "build_mega_base", reason: "Ultimate showcase", priority: 6 },
        { task: "terraform_island", reason: "Landscape design", priority: 5 },
        { task: "build_railway_network", reason: "Fast travel", priority: 6 }
      ]
    };

    return projects[phase] || projects.early_game;
  },

  generateAutomationTasks(phase) {
    return [
      { task: "build_auto_smelter", reason: "Automated ore processing", priority: 7, type: "automation" },
      { task: "build_item_sorter", reason: "Storage organization", priority: 6, type: "automation" },
      { task: "build_auto_farm_wheat", reason: "Passive food generation", priority: 7, type: "automation" },
      { task: "build_iron_farm", reason: "Iron automation", priority: 9, type: "automation" },
      { task: "build_guardian_farm", reason: "XP and prismarine", priority: 8, type: "automation" }
    ];
  },

  generateExplorationTasks(phase) {
    return [
      { task: "explore_find_village", reason: "Villager trading", priority: 8, type: "exploration" },
      { task: "explore_ocean_monument", reason: "Prismarine and sponges", priority: 7, type: "exploration" },
      { task: "explore_nether_fortress", reason: "Blaze rods", priority: 9, type: "exploration" },
      { task: "explore_end_cities", reason: "Elytra and shulker boxes", priority: 10, type: "exploration" },
      { task: "map_10000_blocks", reason: "World knowledge", priority: 5, type: "exploration" }
    ];
  },

  generateMegaProjects() {
    return [
      { task: "build_castle_mega", reason: "Epic medieval castle", priority: 5, type: "mega_project" },
      { task: "create_redstone_computer", reason: "Ultimate redstone", priority: 6, type: "mega_project" },
      { task: "build_underwater_city", reason: "Aquatic base", priority: 5, type: "mega_project" },
      { task: "max_all_advancements", reason: "Complete the game", priority: 7, type: "mega_project" },
      { task: "automate_everything", reason: "Full automation", priority: 8, type: "mega_project" }
    ];
  }
};

async function brainTick(agentName, perception) {
  const inv = perception.inventory || {};
  const goal = perception.goal || "Verbessere die Basis mit sinnvollen Bauwerken.";

  let tasks = [];

  if (!OLLAMA_ENABLED) {
    // Erweiterte Fallback-Logik mit Endless-Task-Generator
    console.log(`[${agentName}] LLM nicht verfügbar - verwende erweiterte Basis-Logik`);
    tasks = await taskGenerators.generateEndlessTasks(agentName, perception);
  } else {
    const snippets = await retrieve(`Minecraft Tipps: ${goal} Inventar:${JSON.stringify(inv).slice(0,200)}`, 4);

  const prompt = [
    "Rolle: Du bist ein strategischer Koordinator für ein SMP-Bot-Team.",
    `Kontext: Ziel="${goal}", Inventar=${JSON.stringify(inv)}`,
    "Wissen (Snippets):",
    ...snippets.map((s, i) => `Snippet ${i+1}: ${s}`),
    "",
    "Aufgabe: Schlage 3 Mid-Level-Aufgaben vor (kurz, präzise), die jetzt sinnvoll sind.",
    "Format (JSON): [{\"task\":\"...\",\"reason\":\"...\"}]",
  ].join("\n");

  const out = await generate({ prompt, system: "Gib NUR valides JSON zurück." });
  try { tasks = JSON.parse(out); } catch { tasks = []; }
  }

  const plans = [];
  for (const t of tasks) {
    const m = /craft\s+([a-zA-Z0-9_]+)(?:\s*x?(\d+))?/i.exec(t.task || "");
    if (m) {
      const item = m[1];
      const count = Number(m[2] || 1);
      const plan = planCraft(item, count, { items: inv }, perception.bot);
      plans.push({ task: t.task, plan });
    }
  }

  if (plans[0]?.plan?.length) {
    const res = await executePlan({ worldOrInventory: { inventory: inv } }, plans[0].plan);
    await logEvent(agentName, "plan_execution", { task: plans[0].task, result: res });
  } else {
    await logEvent(agentName, "plan_proposed", { tasks });
  }

  return { tasks, plans };
}

module.exports = { brainTick };