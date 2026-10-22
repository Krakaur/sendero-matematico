import { validateReport, SCHEMA } from "../web/core.js";
import { isAssignedTask, validateTasks, mergeTaskHistory, visibleTasks, validateAssignedSession } from "../web/assignments.js";
import { validWorkshop } from "../web/workshop.js";
import { validEnrollment, normalizeEnrollment } from "../web/enrollment.js";
import {
  MULTIPLAYER_SCHEMA,
  validateMultiplayerReport,
} from "../web/multiplayer-records.js";

const CHUNK = 65536,
  MAX_COPY = 9 * 1024 * 1024,
  PAGE = 4;
const validId = (x) => typeof x === "string" && /^[a-zA-Z0-9-]{1,60}$/.test(x);
const canonical = (x) =>
  Array.isArray(x)
    ? x.map(canonical)
    : x && typeof x === "object"
      ? Object.fromEntries(
          Object.keys(x)
            .sort()
            .map((k) => [k, canonical(x[k])]),
        )
      : x;
export async function digest(s) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
const token = () =>
  [...crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}
const require = (ok, status = 400, code = "invalid_request") => {
  if (!ok) throw new HttpError(status, code);
};
async function readBody(request) {
  require(request.headers
    .get("content-type")
    ?.startsWith("application/json"), 415, "json_required");
  require(Number(request.headers.get("content-length") || 0) <=
    192 * 1024, 413, "body_limit");
  const reader = request.body?.getReader();
  require(reader);
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 192 * 1024) {
      await reader.cancel();
      throw new HttpError(413, "body_limit");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url),
      path = url.pathname,
      origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((x) => x.trim());
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      Vary: "Origin",
    };
    if (origin && (allowed.includes(origin) || origin === url.origin))
      headers["Access-Control-Allow-Origin"] = origin;
    const respond = (data, status = 200) =>
      Response.json(data, { status, headers });
    let reads = 0,
      writes = 0;
    const track = (r) => {
      reads += r.meta?.rows_read || 0;
      writes += r.meta?.rows_written || 0;
      headers["X-D1-Rows-Read"] = String(reads);
      headers["X-D1-Rows-Written"] = String(writes);
      return r;
    };
    const stmt = (sql, ...args) => env.DB.prepare(sql).bind(...args);
    const all = async (sql, ...args) =>
      track(await stmt(sql, ...args).all()).results;
    const first = async (sql, ...args) => (await all(sql, ...args))[0];
    const run = async (sql, ...args) => track(await stmt(sql, ...args).run());
    const batch = async (statements) =>
      (await env.DB.batch(statements)).map(track);
    try {
      require(!origin || headers["Access-Control-Allow-Origin"], 403, "origin");
      if (request.method === "OPTIONS")
        return new Response(null, {
          status: 204,
          headers: {
            ...headers,
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Max-Age": "600",
          },
        });
      if (path === "/health" && request.method === "GET")
        return respond({
          service: "sendero-aula",
          version: 3,
          enabled: env.SERVICE_ENABLED === "true",
        });
      if (
        !path.startsWith("/admin-api/") &&
        (path === "/" || path === "/admin.js" || path === "/style.css")
      )
        return env.ASSETS.fetch(request);
      require(env.SERVICE_ENABLED === "true", 503, "service_paused");
      require(["GET", "POST"].includes(request.method), 405, "method");
      const bearer = request.headers
        .get("Authorization")
        ?.match(/^Bearer ([A-Za-z0-9-]{32,200})$/)?.[1];
      require(bearer, 401, "unauthorized");
      const hash = await digest(bearer),
        admin = path.startsWith("/admin-api/");
      let who;
      if (admin)
        require(env.ADMIN_TOKEN_HASH &&
          hash === env.ADMIN_TOKEN_HASH, 401, "unauthorized");
      else {
        who = await first("SELECT * FROM access WHERE hash=?", hash);
        require(who, 401, "unauthorized");
      }
      const day = new Date().toISOString().slice(0, 10);
      if (path !== "/admin-api/usage") {
        for (const [scope, limit] of [
          ["global", Number(env.MAX_DAILY_REQUESTS) || 10000],
          [hash, Number(env.MAX_DAILY_PER_ACCESS) || 1000],
        ]) {
          const r = await all(
            "INSERT INTO usage(day,scope,requests) VALUES(?,?,1) ON CONFLICT(day,scope) DO UPDATE SET requests=requests+1 WHERE requests<? RETURNING requests",
            day,
            scope,
            limit,
          );
          if (!r.length) {
            headers["Retry-After"] = String(
              Math.ceil(
                (Date.parse(day + "T00:00:00Z") + 86400000 - Date.now()) / 1000,
              ),
            );
            throw new HttpError(429, "daily_budget");
          }
        }
      }
      const data = request.method === "POST" ? await readBody(request) : null;
      const is = (p, m = "GET") => path === p && request.method === m;
      if (is("/admin-api/usage"))
        return respond({
          day,
          usage: await all(
            "SELECT scope,requests FROM usage WHERE day=? AND scope='global'",
            day,
          ),
          limits: {
            requests: Number(env.MAX_DAILY_REQUESTS) || 10000,
            perInvitation: Number(env.MAX_DAILY_PER_ACCESS) || 1000,
          },
          note: "Application counters. Cloudflare billing and CPU metrics are available in its dashboard.",
        });
      if (is("/admin-api/rooms"))
        return respond({
          rooms: await all(
            "SELECT id,name FROM rooms ORDER BY rowid DESC LIMIT 100",
          ),
        });
      if (is("/admin-api/rooms", "POST")) {
        require(
          typeof data.name === "string" &&
            data.name.trim().length > 0 &&
            data.name.length <= 100,
        );
        const id = crypto.randomUUID(),
          secret = token();
        await batch([
          stmt("INSERT INTO rooms(id,name) VALUES(?,?)", id, data.name.trim()),
          stmt(
            "INSERT INTO access(hash,id,room,role) VALUES(?,?,?,'teacher')",
            await digest(secret),
            crypto.randomUUID(),
            id,
          ),
        ]);
        return respond(
          {
            schema: "sendero.invitation.v1",
            role: "teacher",
            classId: id,
            token: secret,
            endpoint: url.origin,
          },
          201,
        );
      }
      require(!admin, 404, "route");
      if (is("/capabilities"))
        return respond({
          version: 3,
          features: [
            "projects",
            "vault",
            "students",
            "paged-reports",
            "chunked-vault",
            "enrollment",
            "multiplayer",
            "assignments-v2", "assignments-reasoning-v1",
          ],
          pageSize: PAGE,
          chunkSize: CHUNK,
          maxCopyBytes: MAX_COPY,
        });
      if (is("/tasks")) {
        require(["teacher", "student"].includes(who.role), 403, "role");
        const row = await first("SELECT tasks FROM rooms WHERE id=?", who.room);
        require(row, 404, "classroom");
        const tasks = validateTasks(JSON.parse(row.tasks));
        return respond({
          tasks: who.role === "teacher" ? tasks : visibleTasks(tasks, who.profile),
          revision: await digest(row.tasks),
        });
      }
      if (is("/tasks", "POST")) {
        require(who.role === "teacher", 403, "role");
        const incoming = validateTasks(data.tasks);
        const row = await first("SELECT tasks FROM rooms WHERE id=?", who.room);
        require(row, 404, "classroom");
        const existing = validateTasks(JSON.parse(row.tasks));
        const currentRevision = await digest(row.tasks);
        if (incoming.some(isAssignedTask) || existing.some(isAssignedTask))
          require(data.expectedRevision === currentRevision, 409, "task_history_changed");
        else if (data.expectedRevision != null)
          require(data.expectedRevision === currentRevision, 409, "task_history_changed");
        const tasks = mergeTaskHistory(existing, incoming, who.room);
        const serialized = JSON.stringify(canonical(tasks));
        require(new TextEncoder().encode(serialized).length <= 192 * 1024, 413, "task_history_limit");
        const result = await run(
          "UPDATE rooms SET tasks=? WHERE id=? AND tasks=? AND EXISTS(SELECT 1 FROM access WHERE hash=? AND room=? AND role='teacher')",
          serialized, who.room, row.tasks, hash, who.room,
        );
        require(result.meta.changes === 1, 409, "task_history_changed");
        return respond({ tasks, revision: await digest(serialized) });
      }
      if (is("/students")) {
        require(who.role === "teacher", 403, "role");
        const students = await all(
          "SELECT a.id,a.profile,e.body FROM access a LEFT JOIN enrollments e ON a.room=e.room AND a.profile=e.profile WHERE a.room=? AND a.role='student' ORDER BY a.id LIMIT 60",
          who.room,
        );
        return respond({
          students: students.map(({ id, profile, body }) => ({
            id,
            profile,
            enrollment: body ? JSON.parse(body) : null,
          })),
        });
      }
      if (is("/enrollment", "POST")) {
        require(who.role === "student", 403, "role");
        require(validId(data.profile) && validEnrollment(data.enrollment));
        require(!who.profile || who.profile === data.profile, 403, "profile");
        const enrollment = normalizeEnrollment(data.enrollment);
        const results = await batch([
          stmt("UPDATE access SET profile=? WHERE hash=?", data.profile, hash),
          stmt(
            "INSERT INTO enrollments(room,profile,body,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM access WHERE hash=? AND profile=?) ON CONFLICT(room,profile) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at",
            who.room,
            data.profile,
            JSON.stringify(enrollment),
            new Date().toISOString(),
            hash,
            data.profile,
          ),
        ]);
        require(results.every((r) => r.meta.changes === 1), 401, "revoked");
        return respond({
          classId: who.room,
          profile: data.profile,
          enrollment,
        });
      }
      if (is("/students", "POST")) {
        require(who.role === "teacher", 403, "role");
        const secret = token();
        const r = await run(
          "INSERT INTO access(hash,id,room,role) SELECT ?,?,?,'student' WHERE (SELECT count(*) FROM access WHERE room=? AND role='student')<60",
          await digest(secret),
          crypto.randomUUID(),
          who.room,
          who.room,
        );
        require(r.meta.changes === 1, 409, "class_limit");
        return respond({
          schema: "sendero.invitation.v1",
          role: "student",
          classId: who.room,
          token: secret,
          endpoint: url.origin,
        });
      }
      if (is("/students/revoke", "POST")) {
        require(who.role === "teacher", 403, "role");
        require(validId(data.id));
        await run(
          "DELETE FROM access WHERE room=? AND id=? AND role='student'",
          who.room,
          data.id,
        );
        return respond({ revoked: true });
      }
      if (["/reports", "/projects", "/multiplayer"].includes(path)) {
        const table =
            path === "/reports"
              ? "sessions"
              : path === "/projects"
                ? "projects"
                : "multiplayer",
          key = table;
        if (request.method === "GET") {
          require(who.role === "teacher", 403, "role");
          const after = Number(url.searchParams.get("after") || 0);
          require(Number.isSafeInteger(after) && after >= 0);
          const rows = await all(
            `SELECT seq,profile,body FROM ${table} WHERE room=? AND seq>? ORDER BY seq LIMIT ?`,
            who.room,
            after,
            PAGE,
          );
          const groups = new Map();
          for (const row of rows) {
            if (!groups.has(row.profile))
              groups.set(row.profile, {
                schema: key === "multiplayer" ? MULTIPLAYER_SCHEMA : SCHEMA,
                profile: row.profile,
                [key]: [],
              });
            groups.get(row.profile)[key].push(JSON.parse(row.body));
          }
          return respond({
            reports: [...groups.values()],
            cursor: rows.at(-1)?.seq || after,
            more: rows.length === PAGE,
            confirmedAt: new Date().toISOString(),
            confirmationSource: "server-read",
          });
        }
        require(who.role === "student", 403, "role");
        require(
          validId(data.profile) &&
            Array.isArray(data[key]) &&
            data[key].length > 0 &&
            data[key].length <= PAGE,
        );
        require(!who.profile || who.profile === data.profile, 403, "profile");
        if (key === "sessions") {
          validateReport(data);
          const catalog = data.sessions.some((session) => session.assignment)
            ? validateTasks(JSON.parse((await first("SELECT tasks FROM rooms WHERE id=?", who.room)).tasks))
            : null;
          for (const session of data.sessions)
            validateAssignedSession(session, catalog, who.room);
        }
        else if (key === "multiplayer") validateMultiplayerReport(data);
        else
          require(
            data.projects.every((p) => p.completedAt && validWorkshop(p)),
          );
        const records = data[key].map((item) => {
          const body = JSON.stringify(canonical(item));
          require(new TextEncoder().encode(body).length <=
            (key === "sessions" ? 32768 : 65536), 413, "record_limit");
          return { id: item.id, body };
        });
        const results = await batch([
          stmt("UPDATE access SET profile=? WHERE hash=?", data.profile, hash),
          ...records.map((r) =>
            stmt(
              `INSERT INTO ${table}(room,profile,id,body) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM access WHERE hash=? AND profile=?) ON CONFLICT(room,profile,id) DO UPDATE SET body=excluded.body${key === "sessions" ? " WHERE sessions.body <> excluded.body" : ""}`,
              who.room,
              data.profile,
              r.id,
              r.body,
              hash,
              data.profile,
            ),
          ),
        ]);
        require(results[0].meta.changes === 1 && results.slice(1).every((r) =>
          r.meta.changes === 1 || (key === "sessions" && r.meta.changes === 0)), 401, "revoked");
        return respond({
          classId: who.room,
          profile: data.profile,
          accepted: records.map((r) => r.id),
          receivedAt: new Date().toISOString(),
          receiptSource: "server-acknowledgement",
        });
      }
      if (is("/vault/start", "POST")) {
        const m = data.meta;
        require(validId(data.profile) &&
          (!who.profile || who.profile === data.profile), 403, "profile");
        require(
          Number.isSafeInteger(data.expectedRevision) &&
            data.expectedRevision >= 0 &&
            Number.isInteger(data.bytes) &&
            data.bytes > 0 &&
            data.bytes <= MAX_COPY &&
            data.parts === Math.ceil(data.bytes / CHUNK),
        );
        require(
          m?.schema === "sendero.backup.v1" &&
            m.cipher === "AES-256-GCM" &&
            m.kdf === "PBKDF2-SHA256" &&
            m.iterations === 210000 &&
            /^[A-Za-z0-9+/=]{24}$/.test(m.salt) &&
            /^[A-Za-z0-9+/=]{16}$/.test(m.iv),
        );
        const current = await first(
          "SELECT revision FROM vaults WHERE access_hash=?",
          hash,
        );
        require((current?.revision || 0) ===
          data.expectedRevision, 409, "newer_remote_copy");
        await run(
          "DELETE FROM vault_uploads WHERE access_hash=? AND created_at<? AND id NOT IN(SELECT upload FROM vaults WHERE access_hash=?)",
          hash,
          Date.now() - 3600000,
          hash,
        );
        const id = crypto.randomUUID(),
          meta = JSON.stringify({
            schema: m.schema,
            cipher: m.cipher,
            kdf: m.kdf,
            iterations: m.iterations,
            salt: m.salt,
            iv: m.iv,
          });
        const r = await run(
          "INSERT INTO vault_uploads(id,access_hash,profile,expected,meta,parts,bytes,created_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM vault_uploads WHERE access_hash=?)<4",
          id,
          hash,
          data.profile,
          data.expectedRevision,
          meta,
          data.parts,
          data.bytes,
          Date.now(),
          hash,
        );
        require(r.meta.changes === 1, 409, "upload_limit");
        return respond({ uploadId: id, chunkSize: CHUNK });
      }
      if (is("/vault/part", "POST")) {
        require(
          validId(data.uploadId) &&
            Number.isInteger(data.index) &&
            typeof data.data === "string" &&
            /^[A-Za-z0-9+/=]+$/.test(data.data) &&
            data.data.length <= CHUNK,
        );
        const u = await first(
          "SELECT parts,bytes FROM vault_uploads WHERE id=? AND access_hash=? AND id NOT IN(SELECT upload FROM vaults WHERE access_hash=?)",
          data.uploadId,
          hash,
          hash,
        );
        require(u, 404, "upload");
        require(
          data.index >= 0 &&
            data.index < u.parts &&
            data.data.length === Math.min(CHUNK, u.bytes - data.index * CHUNK),
        );
        await run(
          "INSERT INTO vault_parts(upload,part,data) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM vault_uploads WHERE id=? AND access_hash=?) ON CONFLICT(upload,part) DO UPDATE SET data=excluded.data",
          data.uploadId,
          data.index,
          data.data,
          data.uploadId,
          hash,
        );
        return respond({ stored: data.index });
      }
      if (is("/vault/finish", "POST")) {
        require(validId(data.uploadId));
        const u = await first(
          "SELECT * FROM vault_uploads WHERE id=? AND access_hash=?",
          data.uploadId,
          hash,
        );
        require(u, 404, "upload");
        const stats = await first(
          "SELECT count(*) AS n,sum(length(data)) AS bytes FROM vault_parts WHERE upload=?",
          u.id,
        );
        require(stats.n === u.parts &&
          stats.bytes === u.bytes, 409, "incomplete_copy");
        const at = new Date().toISOString();
        const results = await batch([
          stmt("UPDATE access SET profile=? WHERE hash=?", u.profile, hash),
          stmt(
            "INSERT INTO vaults(access_hash,upload,revision,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM access WHERE hash=? AND profile=?) AND COALESCE((SELECT revision FROM vaults WHERE access_hash=?),0)=? ON CONFLICT(access_hash) DO UPDATE SET upload=excluded.upload,revision=excluded.revision,updated_at=excluded.updated_at WHERE vaults.revision=?",
            hash,
            u.id,
            u.expected + 1,
            at,
            hash,
            u.profile,
            hash,
            u.expected,
            u.expected,
          ),
        ]);
        require(results[0].meta.changes === 1, 401, "revoked");
        require(results[1].meta.changes === 1, 409, "newer_remote_copy");
        // Only obsolete committed versions are removed; concurrent unfinished uploads remain recoverable.
        await run(
          "DELETE FROM vault_uploads WHERE access_hash=? AND expected<? AND id<>? AND id NOT IN(SELECT upload FROM vaults WHERE access_hash=?)",
          hash,
          u.expected,
          u.id,
          hash,
        );
        return respond({ revision: u.expected + 1, updatedAt: at });
      }
      if (is("/vault/abort", "POST")) {
        require(validId(data.uploadId));
        await run(
          "DELETE FROM vault_uploads WHERE id=? AND access_hash=? AND id NOT IN(SELECT upload FROM vaults WHERE access_hash=?)",
          data.uploadId,
          hash,
          hash,
        );
        return respond({ aborted: true });
      }
      if (is("/vault")) {
        const v = await first(
          "SELECT v.revision,v.updated_at,u.meta,u.parts,u.bytes FROM vaults v JOIN vault_uploads u ON u.id=v.upload WHERE v.access_hash=?",
          hash,
        );
        require(v, 404, "no_copy");
        return respond({
          chunked: true,
          revision: v.revision,
          updatedAt: v.updated_at,
          meta: JSON.parse(v.meta),
          parts: v.parts,
          bytes: v.bytes,
          chunkSize: CHUNK,
        });
      }
      if (is("/vault/part")) {
        const revision = Number(url.searchParams.get("revision")),
          index = Number(url.searchParams.get("index"));
        require(
          Number.isSafeInteger(revision) &&
            Number.isInteger(index) &&
            index >= 0,
        );
        const row = await first(
          "SELECT p.data FROM vaults v JOIN vault_parts p ON p.upload=v.upload WHERE v.access_hash=? AND v.revision=? AND p.part=?",
          hash,
          revision,
          index,
        );
        require(row, 409, "copy_changed");
        return respond({ revision, index, data: row.data });
      }
      throw new HttpError(404, "route");
    } catch (error) {
      const code = error.message || "";
      if (error instanceof HttpError)
        return respond({ error: code }, error.status);
      if (/profile_conflict|immutable_conflict/.test(code))
        return respond({ error: "conflicting_record" }, 409);
      if (/D1|SQLITE|quota|limit|database/i.test(code)) {
        headers["Retry-After"] = "3600";
        return respond({ error: "storage_unavailable" }, 503);
      }
      return respond({ error: "invalid_request" }, 400);
    }
  },
};
