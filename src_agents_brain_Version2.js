const { retrieve } = require("../knowledge/retriever");
const { generate } = require("../llm/ollamaClient");
const { planCraft } = require("../crafting/planner");
const { logEvent } = require("../memory/store");
const { executePlan } = require("./tools/skillsRegistry");

async function brainTick(agentName, perception) {
  const inv = perception.inventory || {};
  const goal = perception.goal || "Verbessere die Basis mit sinnvollen Bauwerken.";

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
  let tasks;
  try { tasks = JSON.parse(out); } catch { tasks = []; }

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