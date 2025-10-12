CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY,
  agent TEXT,
  version INTEGER,
  policy_json TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_policies_agent_version ON policies(agent, version);

CREATE TABLE IF NOT EXISTS current_policy (
  agent TEXT PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movement_arms (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE,
  params_json TEXT
);

CREATE TABLE IF NOT EXISTS agent_arm_stats (
  id INTEGER PRIMARY KEY,
  agent TEXT,
  arm_id INTEGER REFERENCES movement_arms(id) ON DELETE CASCADE,
  n INTEGER DEFAULT 0,
  reward_sum REAL DEFAULT 0.0,
  reward_mean REAL DEFAULT 0.0,
  last_selected_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_arm ON agent_arm_stats(agent, arm_id);

CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY,
  agent TEXT,
  ts INTEGER,
  kind TEXT,
  value REAL,
  ctx TEXT
);