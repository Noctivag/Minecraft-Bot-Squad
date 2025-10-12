const Database = require("better-sqlite3");
const { bus, Topics } = require("../comms/bus");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function withDb(fn) {
  const db = new Database(DB_PATH);
  try { return fn(db); } finally { db.close(); }
}

function defaultPolicyFor(agent) {
  return {
    version: 1,
    movement: { preferred_arm: "balanced" },
    skill_weights: { gather: 1.0, craft: 1.0, build: 1.0, explore: 1.0 },
    risk: { avoid_water: true, avoid_lava: true, prefer_safe_paths: true },
    chat: { style: "brief", smalltalk_rate: 0.02 }
  };
}

function getCurrentPolicy(agent) {
  return withDb(db => {
    const cur = db.prepare("SELECT policy_id FROM current_policy WHERE agent = ?").get(agent);
    if (!cur?.policy_id) {
      const p = defaultPolicyFor(agent);
      const { lastInsertRowid: id } = db.prepare(
        "INSERT INTO policies (agent, version, policy_json, created_at) VALUES (?, ?, ?, ?)"
      ).run(agent, p.version, JSON.stringify(p), Date.now());
      db.prepare("INSERT OR REPLACE INTO current_policy (agent, policy_id) VALUES (?, ?)").run(agent, id);
      return p;
    }
    const row = db.prepare("SELECT policy_json FROM policies WHERE id = ?").get(cur.policy_id);
    return JSON.parse(row.policy_json);
  });
}

function setNewPolicy(agent, policyObj) {
  return withDb(db => {
    const version = (policyObj.version || 1) + 1;
    policyObj.version = version;
    const { lastInsertRowid: id } = db.prepare(
      "INSERT INTO policies (agent, version, policy_json, created_at) VALUES (?, ?, ?, ?)"
    ).run(agent, version, JSON.stringify(policyObj), Date.now());
    db.prepare("INSERT OR REPLACE INTO current_policy (agent, policy_id) VALUES (?, ?)").run(agent, id);
    bus.publish(Topics.PLAN_FEEDBACK, { type: "policy_updated", agent, policy: policyObj });
    return policyObj;
  });
}

function structuredMerge(base, patch) {
  if (Array.isArray(base) || Array.isArray(patch)) return patch;
  if (typeof base !== "object" || typeof patch !== "object" || !base || !patch) return patch;
  const out = { ...base };
  for (const k of Object.keys(patch)) out[k] = structuredMerge(base[k], patch[k]);
  return out;
}

function clampPolicy(p) {
  p.chat = p.chat || {};
  if (typeof p.chat.smalltalk_rate === "number") {
    p.chat.smalltalk_rate = Math.max(0, Math.min(0.2, p.chat.smalltalk_rate));
  }
  p.skill_weights = p.skill_weights || {};
  for (const k of Object.keys(p.skill_weights)) {
    p.skill_weights[k] = Math.max(0, Math.min(2, Number(p.skill_weights[k]) || 0));
  }
}

function patchPolicy(agent, jsonPatch) {
  const cur = getCurrentPolicy(agent);
  const merged = structuredMerge(cur, jsonPatch);
  clampPolicy(merged);
  return setNewPolicy(agent, merged);
}

module.exports = { getCurrentPolicy, setNewPolicy, patchPolicy };