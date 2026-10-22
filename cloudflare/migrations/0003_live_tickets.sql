-- Additive candidate only. Apply separately after Free/permission/backup review.
-- One ephemeral ticket per classroom/profile; at most 60 profiles per classroom.
CREATE TABLE IF NOT EXISTS live_tickets (
  hash TEXT PRIMARY KEY,
  classroom TEXT NOT NULL,
  roomId TEXT NOT NULL,
  profile TEXT NOT NULL,
  accessHash TEXT NOT NULL,
  generation INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL,
  UNIQUE(classroom,profile)
);
CREATE INDEX IF NOT EXISTS live_tickets_expiry ON live_tickets(classroom,expiresAt);
CREATE INDEX IF NOT EXISTS live_tickets_access ON live_tickets(accessHash);
