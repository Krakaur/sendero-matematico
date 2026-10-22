import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { validateReport, SCHEMA } from "../web/core.js";
import { isAssignedTask, validateTasks, mergeTaskHistory, visibleTasks, validateAssignedSession } from "../web/assignments.js";
import { validWorkshop } from "../web/workshop.js";
import { validEnrollment, normalizeEnrollment } from "../web/enrollment.js";
const digest = (s) => createHash("sha256").update(s).digest("hex");
const canonical = (x) => Array.isArray(x) ? x.map(canonical)
  : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, canonical(x[k])])) : x;
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function openDatabase(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,name TEXT NOT NULL,tasks TEXT NOT NULL DEFAULT '[]');
 CREATE TABLE IF NOT EXISTS access(hash TEXT PRIMARY KEY,room TEXT NOT NULL REFERENCES rooms(id),role TEXT NOT NULL,profile TEXT);
 CREATE TABLE IF NOT EXISTS sessions(room TEXT,profile TEXT,id TEXT,body TEXT NOT NULL,PRIMARY KEY(room,profile,id));
 CREATE TABLE IF NOT EXISTS projects(room TEXT,profile TEXT,id TEXT,body TEXT NOT NULL,PRIMARY KEY(room,profile,id));
 CREATE TABLE IF NOT EXISTS enrollments(room TEXT NOT NULL REFERENCES rooms(id),profile TEXT NOT NULL,body TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(room,profile));
 CREATE TABLE IF NOT EXISTS vaults(access_hash TEXT PRIMARY KEY REFERENCES access(hash) ON DELETE CASCADE,profile TEXT NOT NULL,revision INTEGER NOT NULL,envelope TEXT NOT NULL,updated_at TEXT NOT NULL);`);
  if (
    !db
      .prepare("PRAGMA table_info(access)")
      .all()
      .some((c) => c.name === "id")
  )
    db.exec("ALTER TABLE access ADD COLUMN id TEXT");
  for (const row of db
    .prepare("SELECT hash FROM access WHERE id IS NULL")
    .all())
    db.prepare("UPDATE access SET id=? WHERE hash=?").run(
      randomUUID(),
      row.hash,
    );
  return db;
}
export function issueAccess(db, room, role, token) {
  db.prepare("INSERT INTO access(hash,room,role,id) VALUES(?,?,?,?)").run(
    digest(token),
    room,
    role,
    randomUUID(),
  );
}
export function receiver(db, { origins = [] } = {}) {
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    const json = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(data));
    };
    if (origin && !origins.includes(origin))
      return json(403, { error: "origin" });
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") {
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.writeHead(204);
      return res.end();
    }
    const token = req.headers.authorization?.match(/^Bearer (.{32,200})$/)?.[1];
    const who =
      token &&
      db.prepare("SELECT * FROM access WHERE hash=?").get(digest(token));
    if (!who) return json(401, { error: "unauthorized" });
    const body = async () => {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 10 * 1024 * 1024) throw Error("size");
        chunks.push(chunk);
      }
      if (!db.prepare("SELECT hash FROM access WHERE hash=?").get(who.hash))
        throw Error("revoked");
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    };
    try {
      if (req.url === "/capabilities" && req.method === "GET")
        return json(200, {
          version: 2,
          features: ["projects", "vault", "students", "enrollment", "assignments-v2", "assignments-reasoning-v1", "assignments-arithmetic-v1", "assignments-workshops-v1", "assignments-reasoning-expanded-v1", "assignments-reasoning-expanded-v2"],
        });
      if (req.url === "/vault" && req.method === "GET") {
        const v = db
          .prepare(
            "SELECT revision,envelope,updated_at FROM vaults WHERE access_hash=?",
          )
          .get(who.hash);
        return v
          ? json(200, {
              revision: v.revision,
              envelope: JSON.parse(v.envelope),
              updatedAt: v.updated_at,
            })
          : json(404, { error: "no_copy" });
      }
      if (req.url === "/vault" && req.method === "POST") {
        const data = await body(),
          v = data.envelope;
        if (
          !/^[a-zA-Z0-9-]{1,60}$/.test(data.profile) ||
          !Number.isInteger(data.expectedRevision) ||
          data.expectedRevision < 0 ||
          v?.schema !== "sendero.backup.v1" ||
          v.cipher !== "AES-256-GCM" ||
          v.kdf !== "PBKDF2-SHA256" ||
          v.iterations !== 210000 ||
          typeof v.data !== "string" ||
          v.data.length > 9 * 1024 * 1024 ||
          typeof v.salt !== "string" ||
          typeof v.iv !== "string"
        )
          return json(400, { error: "invalid_copy" });
        const revision = data.expectedRevision + 1,
          at = new Date().toISOString();
        db.exec("BEGIN IMMEDIATE");
        try {
          const account = db
            .prepare("SELECT profile FROM access WHERE hash=?")
            .get(who.hash);
          const old = db
            .prepare("SELECT revision,profile FROM vaults WHERE access_hash=?")
            .get(who.hash);
          if (
            !account ||
            (account.profile && account.profile !== data.profile) ||
            (old && old.profile !== data.profile)
          ) {
            db.exec("ROLLBACK");
            return json(403, { error: "profile" });
          }
          if ((old?.revision || 0) !== data.expectedRevision) {
            db.exec("ROLLBACK");
            return json(409, { error: "newer_remote_copy" });
          }
          db.prepare(
            "INSERT INTO vaults VALUES(?,?,?,?,?) ON CONFLICT(access_hash) DO UPDATE SET revision=excluded.revision,envelope=excluded.envelope,updated_at=excluded.updated_at",
          ).run(who.hash, data.profile, revision, JSON.stringify(v), at);
          db.prepare("UPDATE access SET profile=? WHERE hash=?").run(
            data.profile,
            who.hash,
          );
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
        return json(200, { revision, updatedAt: at });
      }
      if (req.url === "/enrollment" && req.method === "POST") {
        if (who.role !== "student") return json(403, { error: "role" });
        const data = await body();
        if (typeof data.profile !== "string" || !/^[a-zA-Z0-9-]{1,60}$/.test(data.profile) || !validEnrollment(data.enrollment))
          return json(400, { error: "invalid_enrollment" });
        const enrollment = normalizeEnrollment(data.enrollment);
        db.exec("BEGIN IMMEDIATE");
        try {
          const account = db.prepare("SELECT profile FROM access WHERE hash=? AND room=? AND role='student'").get(who.hash, who.room);
          if (!account) throw new HttpError(401, "revoked");
          if (account.profile && account.profile !== data.profile)
            throw new HttpError(403, "profile");
          db.prepare("UPDATE access SET profile=? WHERE hash=?").run(data.profile, who.hash);
          db.prepare("INSERT INTO enrollments(room,profile,body,updated_at) VALUES(?,?,?,?) ON CONFLICT(room,profile) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at")
            .run(who.room, data.profile, JSON.stringify(enrollment), new Date().toISOString());
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return json(200, { classId:who.room, profile:data.profile, enrollment });
      }
      if (
        req.url === "/students" &&
        req.method === "GET" &&
        who.role === "teacher"
      )
        return json(200, {
          students: db
            .prepare(
              "SELECT a.id,a.profile,e.body FROM access a LEFT JOIN enrollments e ON a.room=e.room AND a.profile=e.profile WHERE a.room=? AND a.role='student'",
            )
            .all(who.room).map(({id,profile,body}) => ({id,profile,enrollment:body ? JSON.parse(body) : null})),
        });
      if (
        req.url === "/students" &&
        req.method === "POST" &&
        who.role === "teacher"
      ) {
        if (
          db
            .prepare(
              "SELECT count(*) AS n FROM access WHERE room=? AND role='student'",
            )
            .get(who.room).n >= 60
        )
          return json(409, { error: "class_limit" });
        const token = randomBytes(32).toString("hex");
        issueAccess(db, who.room, "student", token);
        return json(200, {
          schema: "sendero.invitation.v1",
          role: "student",
          classId: who.room,
          token,
        });
      }
      if (
        req.url === "/students/revoke" &&
        req.method === "POST" &&
        who.role === "teacher"
      ) {
        const { id } = await body();
        if (typeof id !== "string" || id.length > 80)
          return json(400, { error: "id" });
        const result = db
          .prepare(
            "DELETE FROM access WHERE id=? AND room=? AND role='student'",
          )
          .run(id, who.room);
        return json(200, { revoked: result.changes === 1 });
      }
      if (
        req.url === "/projects" &&
        req.method === "POST" &&
        who.role === "student"
      ) {
        const data = await body(),
          bound = db
            .prepare("SELECT profile FROM access WHERE hash=?")
            .get(who.hash)?.profile;
        if (
          !/^[a-zA-Z0-9-]{1,60}$/.test(data.profile) ||
          (bound && bound !== data.profile) ||
          !Array.isArray(data.projects) ||
          data.projects.length > 5000 ||
          !data.projects.every((s) => s.completedAt && validWorkshop(s))
        )
          return json(400, { error: "invalid_projects" });
        db.exec("BEGIN IMMEDIATE");
        try {
          for (const p of data.projects) {
            const old = db
              .prepare(
                "SELECT body FROM projects WHERE room=? AND profile=? AND id=?",
              )
              .get(who.room, data.profile, p.id);
            if (old && !isDeepStrictEqual(JSON.parse(old.body), p))
              throw Error("conflict");
            if (!old)
              db.prepare("INSERT INTO projects VALUES(?,?,?,?)").run(
                who.room,
                data.profile,
                p.id,
                JSON.stringify(p),
              );
          }
          db.prepare("UPDATE access SET profile=? WHERE hash=?").run(
            data.profile,
            who.hash,
          );
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
        return json(200, {
          classId: who.room,
          profile: data.profile,
          accepted: data.projects.map((p) => p.id),
          receivedAt: new Date().toISOString(),
        });
      }
      if (
        req.url === "/projects" &&
        req.method === "GET" &&
        who.role === "teacher"
      ) {
        const grouped = new Map();
        for (const row of db
          .prepare("SELECT profile,body FROM projects WHERE room=?")
          .all(who.room)) {
          if (!grouped.has(row.profile)) grouped.set(row.profile, []);
          grouped.get(row.profile).push(JSON.parse(row.body));
        }
        return json(200, {
          reports: [...grouped].map(([profile, projects]) => ({
            profile,
            projects,
          })),
        });
      }
      if (req.url === "/tasks" && req.method === "GET") {
        if (!["teacher", "student"].includes(who.role))
          return json(403, { error: "role" });
        const row = db.prepare("SELECT tasks FROM rooms WHERE id=?").get(who.room);
        const tasks = validateTasks(JSON.parse(row.tasks));
        return json(200, {
          tasks: who.role === "teacher" ? tasks : visibleTasks(tasks, who.profile),
          revision: digest(row.tasks),
        });
      }
      if (req.url === "/tasks" && req.method === "POST" && who.role === "teacher") {
        const data = await body();
        const incoming = validateTasks(data.tasks);
        db.exec("BEGIN IMMEDIATE");
        let tasks, serialized;
        try {
          const row = db.prepare("SELECT tasks FROM rooms WHERE id=?").get(who.room);
          const existing = validateTasks(JSON.parse(row.tasks));
          const currentRevision = digest(row.tasks);
          if ((incoming.some(isAssignedTask) || existing.some(isAssignedTask) || data.expectedRevision != null)
              && data.expectedRevision !== currentRevision)
            throw new HttpError(409, "task_history_changed");
          tasks = mergeTaskHistory(existing, incoming, who.room);
          serialized = JSON.stringify(canonical(tasks));
          if (Buffer.byteLength(serialized) > 192 * 1024)
            throw new HttpError(413, "task_history_limit");
          const result = db.prepare("UPDATE rooms SET tasks=? WHERE id=? AND tasks=? AND EXISTS(SELECT 1 FROM access WHERE hash=? AND room=? AND role='teacher')")
            .run(serialized, who.room, row.tasks, who.hash, who.room);
          if (result.changes !== 1) throw new HttpError(409, "task_history_changed");
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return json(200, { tasks, revision: digest(serialized) });
      }
      if (
        req.url === "/reports" &&
        req.method === "POST" &&
        who.role === "student"
      ) {
        const report = validateReport(await body());
        if (who.profile && who.profile !== report.profile)
          return json(403, { error: "profile" });
        db.exec("BEGIN IMMEDIATE");
        try {
          const bound = db
            .prepare("SELECT profile FROM access WHERE hash=?")
            .get(who.hash).profile;
          if (bound && bound !== report.profile) throw new HttpError(403, "profile");
          const catalog = report.sessions.some((session) => session.assignment)
            ? validateTasks(JSON.parse(db.prepare("SELECT tasks FROM rooms WHERE id=?").get(who.room).tasks))
            : null;
          for (const s of report.sessions) {
            validateAssignedSession(s, catalog, who.room);
            const old = db
              .prepare(
                "SELECT body FROM sessions WHERE room=? AND profile=? AND id=?",
              )
              .get(who.room, report.profile, s.id);
            if (old && !isDeepStrictEqual(JSON.parse(old.body), s))
              throw new HttpError(409, "conflicting_record");
            if (!old)
              db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(
                who.room,
                report.profile,
                s.id,
                JSON.stringify(s),
              );
          }
          db.prepare("UPDATE access SET profile=? WHERE hash=?").run(
            report.profile,
            who.hash,
          );
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
        return json(200, {
          classId: who.room,
          profile: report.profile,
          accepted: report.sessions.map((s) => s.id),
          receivedAt: new Date().toISOString(),
          receiptSource: "server-acknowledgement",
        });
      }
      if (
        req.url === "/reports" &&
        req.method === "GET" &&
        who.role === "teacher"
      ) {
        const grouped = new Map();
        for (const row of db
          .prepare("SELECT profile,body FROM sessions WHERE room=?")
          .all(who.room)) {
          if (!grouped.has(row.profile)) grouped.set(row.profile, []);
          grouped.get(row.profile).push(JSON.parse(row.body));
        }
        return json(200, {
          confirmedAt: new Date().toISOString(),
          confirmationSource: "server-read",
          reports: [...grouped].map(([profile, sessions]) => ({
            schema: SCHEMA,
            profile,
            sessions,
          })),
        });
      }
      return json(403, { error: "permission" });
    } catch (error) {
      return json(error instanceof HttpError ? error.status : 400, { error: error instanceof HttpError ? error.message : "invalid_or_conflicting_data" });
    }
  });
}
