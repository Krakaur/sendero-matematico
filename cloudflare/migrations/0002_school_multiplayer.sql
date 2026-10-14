CREATE TABLE enrollments(room TEXT NOT NULL REFERENCES rooms(id),profile TEXT NOT NULL,body TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(room,profile));
CREATE TABLE multiplayer(seq INTEGER PRIMARY KEY AUTOINCREMENT,room TEXT NOT NULL REFERENCES rooms(id),profile TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,UNIQUE(room,profile,id));
CREATE INDEX multiplayer_room_seq ON multiplayer(room,seq);
CREATE TRIGGER immutable_multiplayer BEFORE UPDATE OF body ON multiplayer WHEN OLD.body != NEW.body
BEGIN SELECT RAISE(ABORT,'immutable_conflict'); END;
