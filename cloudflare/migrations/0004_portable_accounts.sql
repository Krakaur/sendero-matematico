CREATE TABLE portable_accounts(
  code_hash TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  verifier_hash TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  last_operation_id TEXT,
  last_operation_digest TEXT,
  snapshot TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE portable_tokens(
  hash TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL REFERENCES portable_accounts(code_hash) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
CREATE INDEX portable_tokens_account ON portable_tokens(code_hash);
