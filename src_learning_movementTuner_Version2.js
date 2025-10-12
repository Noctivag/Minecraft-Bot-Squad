const Database = require("better-sqlite3");
const { computeMovementReward } = require("./metrics");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function ucb1(mean, total, n, c = 1.4) {
  if (n === 0) return Infinity;
  return mean + c * Math.sqrt(Math.log(total + 1) / n);
}

function getArms(db) {
  return db.prepare("SELECT id, name, params_json FROM movement_arms").all()
    .map(r => ({ id: r.id, name: r.name, params: JSON.parse(r.params_json) }));
}

function ensureAgentStats(db, agent, arms) {
  const ins = db.prepare("INSERT OR IGNORE INTO agent_arm_stats (agent, arm_id, n, reward_sum, reward_mean) VALUES (?, ?, 0, 0.0, 0.0)");
  for (const a of arms) ins.run(agent, a.id);
  return db.prepare("SELECT * FROM agent_arm_stats WHERE agent = ?").all(agent);
}

function selectArm(agent) {
  const db = new Database(DB_PATH);
  try {
    const arms = getArms(db);
    const stats = ensureAgentStats(db, agent, arms);
    const total = stats.reduce((s, x) => s + x.n, 0);
    let best = null;
    for (const st of stats) {
      const score = ucb1(st.reward_mean, total, st.n);
      if (!best || score > best.score) best = { arm_id: st.arm_id, score };
    }
    const chosen = arms.find(a => a.id === best.arm_id) || arms[0];
    db.prepare("UPDATE agent_arm_stats SET last_selected_at = ? WHERE agent = ? AND arm_id = ?")
      .run(Date.now(), agent, chosen.id);
    return chosen;
  } finally { db.close(); }
}

function applyMovementsFromParams(bot, params) {
  const { pathfinder, Movements } = require("mineflayer-pathfinder");
  if (!bot.pathfinder) bot.loadPlugin(pathfinder);
  const mcData = bot.mcData || require("minecraft-data")(bot.version);
  const movements = new Movements(bot, mcData);

  movements.canOpenDoors = !!params.canOpenDoors;
  movements.allow1by1towers = !!params.allow1by1towers;
  if (Number.isFinite(params.maxDropDown)) movements.maxDropDown = Math.max(0, Math.min(10, params.maxDropDown));
  if (Number.isFinite(params.digCost)) movements.digCost = Math.max(1, Math.min(20, params.digCost));
  if (Number.isFinite(params.placeCost)) movements.placeCost = Math.max(1, Math.min(20, params.placeCost));
  if (Number.isFinite(params.waterCost)) movements.waterCost = Math.max(1, Math.min(100, params.waterCost));
  if (Number.isFinite(params.lavaCost)) movements.lavaCost = Math.max(1, Math.min(100, params.lavaCost));

  bot.pathfinder.setMovements(movements);
  return movements;
}

function applyAdaptiveMovements(bot, agent) {
  const arm = selectArm(agent);
  const movements = applyMovementsFromParams(bot, arm.params);
  bot.__movementArm = arm.name;

  bot.on("goal_reached", () => {
    const session = bot.__moveSession || {};
    session.success = true;
    finishSession(agent, bot, session);
  });
  bot.on("path_update", (r) => {
    if (r.status === "noPath") {
      const session = bot.__moveSession || {};
      session.timeout = true;
      finishSession(agent, bot, session);
    }
  });

  bot.__moveSession = { start: Date.now(), damageTaken: 0 };

  return { arm: arm.name, movements };
}

function finishSession(agent, bot, session) {
  session.timeMs = Date.now() - (session.start || Date.now());
  const reward = computeMovementReward(session);
  updateReward(agent, bot.__movementArm, reward);
  bot.__moveSession = { start: Date.now(), damageTaken: 0 };
}

function updateReward(agent, armName, reward) {
  const db = new Database(DB_PATH);
  try {
    const arm = db.prepare("SELECT id FROM movement_arms WHERE name = ?").get(armName);
    if (!arm) return;
    const st = db.prepare("SELECT * FROM agent_arm_stats WHERE agent = ? AND arm_id = ?").get(agent, arm.id);
    const n = (st?.n || 0) + 1;
    const sum = (st?.reward_sum || 0) + reward;
    const mean = sum / n;
    const up = db.prepare(`
      INSERT INTO agent_arm_stats (agent, arm_id, n, reward_sum, reward_mean, last_selected_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent, arm_id) DO UPDATE SET
        n=excluded.n, reward_sum=excluded.reward_sum, reward_mean=excluded.reward_mean,
        last_selected_at=excluded.last_selected_at`);
    up.run(agent, arm.id, n, sum, mean, Date.now());
  } finally { db.close(); }
}

module.exports = { applyAdaptiveMovements, updateReward, selectArm };