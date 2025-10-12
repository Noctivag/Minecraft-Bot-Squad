const Database = require("better-sqlite3");
const { embed } = require("../llm/ollamaClient");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

function loadAllEmbeddings(db) {
  const stmt = db.prepare(`
    SELECT e.id as embed_id, c.text as chunk, e.vector as vector
    FROM embeddings e
    JOIN doc_chunks c ON c.id = e.chunk_id
  `);
  const rows = stmt.all();
  return rows.map(r => ({
    chunk: r.chunk,
    vec: JSON.parse(r.vector),
  }));
}

async function retrieve(query, k = 5) {
  const db = new Database(DB_PATH, { readonly: true });
  const all = loadAllEmbeddings(db);
  db.close();

  const [qvec] = await embed(query);
  const scored = all.map(x => ({ score: cosine(qvec, x.vec), chunk: x.chunk }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(s => s.chunk);
}

module.exports = { retrieve };