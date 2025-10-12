CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  source TEXT,
  title TEXT,
  content TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS doc_chunks (
  id INTEGER PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  idx INTEGER,
  text TEXT
);
CREATE TABLE IF NOT EXISTS embeddings (
  id INTEGER PRIMARY KEY,
  chunk_id INTEGER REFERENCES doc_chunks(id) ON DELETE CASCADE,
  vector TEXT
);
CREATE INDEX IF NOT EXISTS idx_chunk_doc ON doc_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embed_chunk ON embeddings(chunk_id);

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY,
  agent TEXT,
  ts INTEGER,
  type TEXT,
  payload TEXT
);
CREATE INDEX IF NOT EXISTS idx_episodes_agent_ts ON episodes(agent, ts);

CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY,
  agent TEXT,
  start_ts INTEGER,
  end_ts INTEGER,
  text TEXT
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  version TEXT,
  policy TEXT,
  score REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agent_profiles (
  id INTEGER PRIMARY KEY,
  agent TEXT UNIQUE,
  persona TEXT,
  preferences TEXT
);