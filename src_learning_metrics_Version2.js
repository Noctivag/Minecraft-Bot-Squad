const Database = require("better-sqlite3");
const { bus, Topics } = require("../comms/bus");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function recordMetric(agent, kind, value, ctx) {
  const db = new Database(DB_PATH);
  try {
    db.prepare("INSERT INTO metrics (agent, ts, kind, value, ctx) VALUES (?, ?, ?, ?, ?)").run(
      agent, Date.now(), kind, value, JSON.stringify(ctx || {})
    );
  } finally { db.close(); }
  bus.publish(Topics.BOT_STATUS, { agent, metric: { kind, value, ctx } });
}

function computeMovementReward(session) {
  let r = 0;
  if (session.success) r += 1;
  if (session.timeout) r -= 1;
  if (typeof session.timeMs === "number") r -= Math.min(0.5, session.timeMs / 30000);
  if (typeof session.damageTaken === "number") r -= Math.min(0.5, session.damageTaken / 5);
  return r;
}

module.exports = { recordMetric, computeMovementReward };