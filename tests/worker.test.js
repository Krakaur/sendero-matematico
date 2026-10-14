import { normalizeEnrollment } from "../web/enrollment.js";
import { MULTIPLAYER_SCHEMA } from "../web/multiplayer-records.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { newSession, recordAttempt, SCHEMA } from "../web/core.js";
import {
  readInvitation,
  exchangeClassroom,
  applyExchange,
  classroomRequest,
} from "../web/classroom.js";
import { saveCloudCopy, restoreCloudCopy } from "../web/cloud.js";

test("Workers/D1: isolation, pagination, atomic copies, concurrent writers, encryption and quotas", async (t) => {
  const bundle = await build({
    entryPoints: ["cloudflare/worker.mjs"],
    bundle: true,
    format: "esm",
    write: false,
    platform: "browser",
    target: "es2022",
  });
  const admin = "a".repeat(64),
    adminHash = createHash("sha256").update(admin).digest("hex");
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: bundle.outputFiles[0].text,
      compatibilityDate: "2026-10-14",
      d1Databases: ["DB"],
      bindings: {
        ADMIN_TOKEN_HASH: adminHash,
        SERVICE_ENABLED: "true",
        ALLOWED_ORIGINS: "https://krakaur.github.io",
        MAX_DAILY_REQUESTS: "10000",
        MAX_DAILY_PER_ACCESS: "1000",
      },
    }),
  );
  const db = await mf.getD1Database("DB");
  // The migration contains triggers; execute each complete SQL statement, including its BEGIN/END.
  const sql =
    (await readFile(
      new URL("../cloudflare/migrations/0001_classroom.sql", import.meta.url),
      "utf8",
    )) +
    (await readFile(
      new URL(
        "../cloudflare/migrations/0002_school_multiplayer.sql",
        import.meta.url,
      ),
      "utf8",
    ));
  const statements = sql.match(
    /CREATE TRIGGER[\s\S]*?END;|CREATE (?:TABLE|INDEX)[\s\S]*?;/g,
  );
  for (const s of statements) await db.prepare(s).run();
  const raw = (path, body, key = admin, headers = {}) =>
    mf.dispatchFetch("https://aula.test" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + key,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const fetcher = (url, options) => mf.dispatchFetch(url, options);
  try {
    const room = await (
      await raw("/admin-api/rooms", { name: "Pruebas sintéticas" })
    ).json();
    assert.equal(room.role, "teacher");
    const teacher = readInvitation(room, "teacher");
    const inv = await classroomRequest(teacher, "/students", {}, fetcher),
      student = readInvitation(inv, "student");
    const room2 = await (
      await raw("/admin-api/rooms", { name: "Otra aula" })
    ).json();
    const session = () => {
      const s = newSession("suma", 1, "profile-a");
      for (const q of s.questions) {
        q.activeMs = 1000;
        recordAttempt(q, q.answer);
        q.done = true;
      }
      s.completedAt = new Date().toISOString();
      s.index = 7;
      return s;
    };
    const state = {
      profile: "profile-a",
      sessions: Array.from({ length: 9 }, session),
      teacher: [],
      adaptive: {},
      current: null,
      classroom: student,
    };
    await t.test(
      "Private enrollment and opt-in multiplayer survive sync without duplicate uploads or cross-room access",
      async () => {
        state.enrollment = normalizeEnrollment({
          school: "Escuela sintética",
          grade: "3",
          group: "A",
          listNumber: 7,
        });
        state.multiplayerHistory = [
          {
            ...session(),
            id: "multi-qa",
            enrollment: structuredClone(state.enrollment),
            mode: "race",
            transport: "online",
            participants: 2,
            finishedMs: 8000,
          },
        ];
        let writes = 0;
        const measured = (url, options) => {
          if (
            options.method === "POST" &&
            /\/(enrollment|multiplayer)$/.test(url)
          )
            writes++;
          return fetcher(url, options);
        };
        applyExchange(
          state,
          await exchangeClassroom(structuredClone(state), measured),
        );
        assert.equal(writes, 1);
        assert.equal((await raw("/multiplayer", null, room.token)).status, 200);
        assert.equal(
          (await (await raw("/multiplayer", null, room.token)).json()).reports
            .length,
          0,
        );
        state.classroom.includeMultiplayer = true;
        applyExchange(
          state,
          await exchangeClassroom(structuredClone(state), measured),
        );
        assert.equal(writes, 2);
        assert.deepEqual(state.classroom.multiplayerReceived, ["multi-qa"]);
        applyExchange(
          state,
          await exchangeClassroom(structuredClone(state), measured),
        );
        assert.equal(writes, 2);
        const teaching = {
          profile: "teacher-a",
          sessions: [],
          teacher: [],
          classroom: structuredClone(teacher),
        };
        applyExchange(
          teaching,
          await exchangeClassroom(structuredClone(teaching), fetcher),
        );
        assert.equal(teaching.teacherMultiplayer.length, 1);
        assert.equal(teaching.classroom.students[0].enrollment.listNumber, 7);
        applyExchange(
          teaching,
          await exchangeClassroom(structuredClone(teaching), fetcher),
        );
        assert.equal(teaching.teacherMultiplayer.length, 1);
        assert.equal(
          (await (await raw("/multiplayer", null, room2.token)).json()).reports
            .length,
          0,
        );
        assert.equal((await raw("/multiplayer", null, inv.token)).status, 403);
        assert.equal(
          (
            await raw(
              "/enrollment",
              { profile: state.profile, enrollment: state.enrollment },
              room.token,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await raw(
              "/enrollment",
              { profile: "another-profile", enrollment: state.enrollment },
              inv.token,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await raw(
              "/enrollment",
              {
                profile: state.profile,
                enrollment: { ...state.enrollment, listNumber: 0 },
              },
              inv.token,
            )
          ).status,
          400,
        );
        state.enrollment.group = "B";
        applyExchange(
          state,
          await exchangeClassroom(structuredClone(state), measured),
        );
        assert.equal(writes, 3);
        const delivered = (
          await (await raw("/multiplayer", null, room.token)).json()
        ).reports[0].multiplayer[0];
        assert.equal(delivered.enrollment.group, "A");
        const report = {
          schema: MULTIPLAYER_SCHEMA,
          profile: state.profile,
          multiplayer: [delivered],
        };
        assert.equal(
          (await raw("/multiplayer", report, inv.token)).status,
          200,
        );
        report.multiplayer[0].enrollment.group = "C";
        assert.equal(
          (await raw("/multiplayer", report, inv.token)).status,
          409,
        );
        const spoof = structuredClone(report);
        spoof.multiplayer[0].profile = "another-profile";
        assert.equal((await raw("/multiplayer", spoof, inv.token)).status, 400);
      },
    );
    await t.test(
      "bounded batches, incremental reads and role isolation",
      async () => {
        for (let i = 0; i < 3; i++)
          applyExchange(
            state,
            await exchangeClassroom(structuredClone(state), fetcher),
          );
        assert.equal(state.classroom.received.length, 9);
        const teaching = {
          profile: "teacher-a",
          sessions: [],
          teacher: [],
          classroom: teacher,
        };
        for (let i = 0; i < 3; i++)
          applyExchange(
            teaching,
            await exchangeClassroom(structuredClone(teaching), fetcher),
          );
        assert.equal(teaching.teacher.length, 9);
        const cursor = teaching.classroom.reportCursor;
        applyExchange(
          teaching,
          await exchangeClassroom(structuredClone(teaching), fetcher),
        );
        assert.equal(teaching.teacher.length, 9);
        assert.equal(teaching.classroom.reportCursor, cursor);
        assert.equal((await raw("/reports", null, student.token)).status, 403);
        assert.equal((await raw("/reports", null, room2.token)).status, 200);
        assert.deepEqual(
          (await (await raw("/reports", null, room2.token)).json()).reports,
          [],
        );
        assert.equal(
          (
            await raw("/tasks", null, student.token, {
              Origin: "https://untrusted.test",
            })
          ).status,
          403,
        );
        const changed = structuredClone(state.sessions[0]);
        changed.questions[0].activeMs++;
        assert.equal(
          (
            await raw(
              "/reports",
              {
                schema: SCHEMA,
                profile: state.profile,
                sessions: [session(), changed],
              },
              student.token,
            )
          ).status,
          409,
        );
        assert.equal(
          (await db.prepare("SELECT count(*) n FROM sessions").first()).n,
          9,
        );
        assert.equal(
          (
            await raw(
              "/reports",
              { schema: SCHEMA, profile: "another", sessions: [session()] },
              student.token,
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "encrypted copy round trip across a fresh device",
      async () => {
        const profile = {
          id: state.profile,
          name: "Alias privado",
          role: "student",
        };
        const result = await saveCloudCopy(
          profile,
          state,
          "clave-segura-123",
          fetcher,
        );
        assert.equal(result.revision, 1);
        state.cloudRevision = 1;
        const parts = await db.prepare("SELECT data FROM vault_parts").all();
        assert(parts.results.length);
        assert(!parts.results.some((r) => r.data.includes(profile.name)));
        const map = new Map(),
          storage = {
            getItem: (k) => map.get(k) || null,
            setItem: (k, v) => map.set(k, v),
          };
        const restored = await restoreCloudCopy(
          storage,
          inv,
          "clave-segura-123",
          "nueva-clave-456",
          fetcher,
        );
        assert.equal(restored.state.sessions.length, 9);
        assert.equal(restored.profile.name, profile.name);
        await assert.rejects(
          () =>
            saveCloudCopy(
              profile,
              { ...state, cloudRevision: 0 },
              "clave-segura-123",
              fetcher,
            ),
          /versión remota/,
        );
      },
    );
    await t.test(
      "copy larger than D1 row limit, incomplete upload and concurrent commits",
      async () => {
        const meta = {
            schema: "sendero.backup.v1",
            cipher: "AES-256-GCM",
            kdf: "PBKDF2-SHA256",
            iterations: 210000,
            salt: "A".repeat(24),
            iv: "A".repeat(16),
          },
          bytes = 2097152 + 100;
        const start = async () =>
          (
            await (
              await raw(
                "/vault/start",
                {
                  profile: state.profile,
                  expectedRevision: 1,
                  meta,
                  bytes,
                  parts: Math.ceil(bytes / 65536),
                },
                student.token,
              )
            ).json()
          ).uploadId;
        const a = await start(),
          b = await start();
        assert.equal(
          (await raw("/vault/finish", { uploadId: a }, student.token)).status,
          409,
        );
        assert.equal(
          (await (await raw("/vault", null, student.token)).json()).revision,
          1,
        );
        for (const uploadId of [a, b])
          for (let index = 0; index < Math.ceil(bytes / 65536); index++)
            assert.equal(
              (
                await raw(
                  "/vault/part",
                  {
                    uploadId,
                    index,
                    data: "A".repeat(Math.min(65536, bytes - index * 65536)),
                  },
                  student.token,
                )
              ).status,
              200,
            );
        const results = await Promise.all(
          [a, b].map((uploadId) =>
            raw("/vault/finish", { uploadId }, student.token),
          ),
        );
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
        const remote = await (await raw("/vault", null, student.token)).json();
        assert.equal(remote.bytes, bytes);
        assert.equal(remote.revision, 2);
        assert.equal(
          (await raw("/vault/part?index=0&revision=1", null, student.token))
            .status,
          409,
        );
        assert.equal(
          (await raw("/vault/part?index=0&revision=2", null, room2.token))
            .status,
          409,
        );
      },
    );
    await t.test(
      "revocation removes vault and blocks access, quota preserves data",
      async () => {
        const roster = await classroomRequest(
          teacher,
          "/students",
          null,
          fetcher,
        );
        const id = roster.students.find((r) => r.profile === state.profile).id;
        assert.equal(
          (await raw("/students/revoke", { id }, teacher.token)).status,
          200,
        );
        assert.equal((await raw("/tasks", null, student.token)).status, 401);
        assert.equal(
          (await db.prepare("SELECT count(*) n FROM vaults").first()).n,
          0,
        );
        assert.equal(
          (await db.prepare("SELECT count(*) n FROM vault_parts").first()).n,
          0,
        );
        const day = new Date().toISOString().slice(0, 10);
        await db
          .prepare(
            "UPDATE usage SET requests=10000 WHERE day=? AND scope='global'",
          )
          .bind(day)
          .run();
        assert.equal((await raw("/tasks", null, teacher.token)).status, 429);
        assert.equal(
          (await db.prepare("SELECT count(*) n FROM sessions").first()).n,
          9,
        );
      },
    );
  } finally {
    await mf.dispose();
  }
});
