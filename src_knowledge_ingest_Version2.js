const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { embed } = require("../llm/ollamaClient");

const DB_PATH = process.env.BRAIN_DB_PATH || "./db/bot_brain.sqlite";
const WIKI_DIR = process.env.WIKI_DIR || "./data/wiki";

function chunkText(text, maxLen = 1000) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLen));
    start += maxLen;
  }
  return chunks;
}

function ensureSchema(db) {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
}

async function ingestFile(db, filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const title = path.basename(filePath);
  const insertDoc = db.prepare(
    "INSERT INTO documents (source, title, content, created_at) VALUES (?, ?, ?, ?)"
  );
  const docRes = insertDoc.run(filePath, title, content, Date.now());
  const docId = docRes.lastInsertRowid;

  const chunks = chunkText(content, 1000);
  const insertChunk = db.prepare(
    "INSERT INTO doc_chunks (document_id, idx, text) VALUES (?, ?, ?)"
  );
  const insertEmbed = db.prepare(
    "INSERT INTO embeddings (chunk_id, vector) VALUES (?, ?)"
  );

  for (let i = 0; i < chunks.length; i++) {
    const { lastInsertRowid: chunkId } = insertChunk.run(docId, i, chunks[i]);
    const [vec] = await embed(chunks[i]);
    insertEmbed.run(chunkId, JSON.stringify(vec));
  }
  console.log(`Ingested ${title}: ${chunks.length} chunks`);
}

async function main() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  ensureSchema(db);

  const files = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith(".md"));
  for (const f of files) {
    const full = path.join(WIKI_DIR, f);
    await ingestFile(db, full);
  }
  db.close();
  console.log("Ingest complete.");
}

if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}