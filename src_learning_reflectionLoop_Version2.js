const { generate, OLLAMA_ENABLED } = require("../llm/ollamaClient");
const { getCurrentPolicy, patchPolicy } = require("./policyStore");
const { buildReflectionPrompt } = require("./reflectionPrompt");
const Database = require("better-sqlite3");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function getPerfSnapshot(agent, minutes = 60) {
  const db = new Database(DB_PATH);
  try {
    const since = Date.now() - minutes * 60 * 1000;
    const rows = db.prepare("SELECT kind, value FROM metrics WHERE agent = ? AND ts >= ?").all(agent, since);
    const agg = {};
    for (const r of rows) {
      if (!agg[r.kind]) agg[r.kind] = [];
      agg[r.kind].push(r.value);
    }
    const summary = {};
    for (const k of Object.keys(agg)) {
      const arr = agg[k];
      const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
      summary[k] = { count: arr.length, mean };
    }
    return summary;
  } finally { db.close(); }
}

async function reflectAndPatch(agent) {
  if (!OLLAMA_ENABLED) {
    console.warn(`[${agent}] LLM nicht verfügbar - überspringe Reflection`);
    return { ok: false, error: "llm_disabled", message: "Ollama nicht verfügbar" };
  }

  const current = getCurrentPolicy(agent);
  const perf = getPerfSnapshot(agent, 60);

  const recentSummary = "(episodische Zusammenfassung hier einfügen)";
  const prompt = buildReflectionPrompt({ agent, recentSummary, currentPolicy: current, perfSnapshot: perf });

  const jsonText = await generate({
    system: "Gib NUR valides JSON zurück.",
    prompt,
    temperature: 0.2,
    max_tokens: 800
  });

  let patch;
  try {
    patch = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "invalid_json" };
  }

  const allowed = ["skill_weights", "movement", "chat", "risk"];
  for (const k of Object.keys(patch)) if (!allowed.includes(k)) delete patch[k];

  const updated = patchPolicy(agent, patch);
  return { ok: true, updated, patch };
}

module.exports = { reflectAndPatch };