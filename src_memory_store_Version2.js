const path = require("path");
const Database = require("better-sqlite3");
const { generate } = require("../llm/ollamaClient");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function withDb(fn, options = {}) {
  const db = new Database(DB_PATH);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

function logEvent(agent, type, payload) {
  return withDb(db => {
    const stmt = db.prepare("INSERT INTO episodes (agent, ts, type, payload) VALUES (?, ?, ?, ?)");
    stmt.run(agent, Date.now(), type, JSON.stringify(payload || {}));
  });
}

function getRecentEpisodes(agent, limit = 50) {
  return withDb(db => {
    const stmt = db.prepare("SELECT * FROM episodes WHERE agent = ? ORDER BY ts DESC LIMIT ?");
    const rows = stmt.all(agent, limit);
    return rows.reverse();
  });
}

async function summarizeRecent(agent, lookback = 200) {
  const episodes = getRecentEpisodes(agent, lookback);
  const text = episodes.map(e => `[${new Date(e.ts).toISOString()}] ${e.type}: ${e.payload}`).join("\n");
  const prompt = `Fasse die wichtigsten Erkenntnisse für den Agenten ${agent} kompakt zusammen. Fokus: was hat funktioniert, was nicht, next best practices.\n\nLogs:\n${text}`;
  const summary = await generate({ prompt, system: "Du bist ein prägnanter Analyst." });
  withDb(db => {
    const stmt = db.prepare("INSERT INTO summaries (agent, start_ts, end_ts, text) VALUES (?, ?, ?, ?)");
    const start = episodes[0]?.ts || Date.now();
    const end = episodes[episodes.length - 1]?.ts || Date.now();
    stmt.run(agent, start, end, summary);
  });
  return summary;
}

module.exports = { logEvent, getRecentEpisodes, summarizeRecent };