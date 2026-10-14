CREATE TABLE rooms(id TEXT PRIMARY KEY, name TEXT NOT NULL, tasks TEXT NOT NULL DEFAULT '[]');
CREATE TABLE access(hash TEXT PRIMARY KEY, id TEXT NOT NULL UNIQUE, room TEXT NOT NULL REFERENCES rooms(id), role TEXT NOT NULL CHECK(role IN ('teacher','student')), profile TEXT);
CREATE INDEX access_room ON access(room,role);
CREATE TRIGGER bind_profile BEFORE UPDATE OF profile ON access
WHEN OLD.profile IS NOT NULL AND NEW.profile IS NOT OLD.profile
BEGIN SELECT RAISE(ABORT,'profile_conflict'); END;
CREATE TABLE sessions(seq INTEGER PRIMARY KEY AUTOINCREMENT,room TEXT NOT NULL REFERENCES rooms(id),profile TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,UNIQUE(room,profile,id));
CREATE INDEX sessions_room_seq ON sessions(room,seq);
CREATE TRIGGER immutable_session BEFORE UPDATE OF body ON sessions WHEN OLD.body != NEW.body
BEGIN SELECT RAISE(ABORT,'immutable_conflict'); END;
CREATE TABLE projects(seq INTEGER PRIMARY KEY AUTOINCREMENT,room TEXT NOT NULL REFERENCES rooms(id),profile TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,UNIQUE(room,profile,id));
CREATE INDEX projects_room_seq ON projects(room,seq);
CREATE TRIGGER immutable_project BEFORE UPDATE OF body ON projects WHEN OLD.body != NEW.body
BEGIN SELECT RAISE(ABORT,'immutable_conflict'); END;
CREATE TABLE vault_uploads(id TEXT PRIMARY KEY,access_hash TEXT NOT NULL REFERENCES access(hash) ON DELETE CASCADE,profile TEXT NOT NULL,expected INTEGER NOT NULL,meta TEXT NOT NULL,parts INTEGER NOT NULL,bytes INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX uploads_access ON vault_uploads(access_hash,created_at);
CREATE TABLE vault_parts(upload TEXT NOT NULL REFERENCES vault_uploads(id) ON DELETE CASCADE,part INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(upload,part));
CREATE TRIGGER immutable_part BEFORE UPDATE OF data ON vault_parts WHEN OLD.data != NEW.data
BEGIN SELECT RAISE(ABORT,'immutable_conflict'); END;
CREATE TABLE vaults(access_hash TEXT PRIMARY KEY REFERENCES access(hash) ON DELETE CASCADE,upload TEXT NOT NULL REFERENCES vault_uploads(id),revision INTEGER NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE usage(day TEXT NOT NULL,scope TEXT NOT NULL,requests INTEGER NOT NULL,PRIMARY KEY(day,scope));
