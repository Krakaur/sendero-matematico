// Explicit, bounded production verification. Synthetic data only; no credentials in output.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  classroomRequest,
  readInvitation,
  exchangeClassroom,
  applyExchange,
} from "../web/classroom.js";
import { normalizeEnrollment } from "../web/enrollment.js";
import {
  createMatch,
  addPlayer,
  playerAction,
  startMatch,
  tickMatch,
} from "../web/room.js";
import {
  participationRecord,
  MULTIPLAYER_SCHEMA,
} from "../web/multiplayer-records.js";
const admin = JSON.parse(
  await readFile(
    new URL("../server/private/cloudflare-admin.json", import.meta.url),
    "utf8",
  ),
);
const output = new URL(
  "../qa-private/school-profiles-20261014/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const rows = [];
let success = false,
  classId = null,
  before = null,
  after = null;
async function fetcher(url, options = {}) {
  if (rows.length >= 22) throw Error("Presupuesto de 22 solicitudes agotado.");
  const start = performance.now(),
    r = await fetch(url, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  rows.push({
    path: new URL(url).pathname,
    method: options.method || "GET",
    status: r.status,
    wallMs: Math.round(performance.now() - start),
    d1Read: Number(r.headers.get("X-D1-Rows-Read")) || 0,
    d1Written: Number(r.headers.get("X-D1-Rows-Written")) || 0,
  });
  return r;
}
const req = (path, body, link = admin) =>
  classroomRequest(link, path, body, fetcher);
try {
  before = await req("/admin-api/usage");
  const teacher = readInvitation(
    await req("/admin-api/rooms", { name: "QA perfiles escolares 0.11.0" }),
    "teacher",
  );
  classId = teacher.classId;
  const student = readInvitation(
    await req("/students", {}, teacher),
    "student",
  );
  student.includeMultiplayer = true;
  const profile = "qa-school-" + crypto.randomUUID(),
    enrollment = normalizeEnrollment({
      school: "Escuela sintética QA",
      grade: "3",
      group: "PRUEBA",
      listNumber: 99,
    });
  const m = createMatch({
    trail: "multi",
    level: 1,
    circuit: "islas",
    mode: "race",
    seed: 432,
  });
  for (const id of ["p0", "p1"]) {
    addPlayer(m, id);
    playerAction(m, id, { type: "ready" }, 0);
  }
  startMatch(m, 0);
  tickMatch(m, 2100);
  for (const p of m.players)
    for (let i = 0; i < 8; i++)
      playerAction(
        m,
        p.id,
        { type: "answer", index: i, value: p.questions[i].answer },
        2500 + i * 1000,
      );
  const record = participationRecord(
    m,
    "p0",
    { id: profile, enrollment },
    "online",
  );
  const state = {
    profile,
    enrollment,
    sessions: [],
    teacher: [],
    multiplayerHistory: [record],
    classroom: student,
  };
  applyExchange(
    state,
    await exchangeClassroom(structuredClone(state), fetcher),
  );
  assert.deepEqual(state.classroom.multiplayerReceived, [record.id]);
  const teaching = {
    profile: "qa-teacher",
    sessions: [],
    teacher: [],
    classroom: teacher,
  };
  applyExchange(
    teaching,
    await exchangeClassroom(structuredClone(teaching), fetcher),
  );
  assert.equal(teaching.teacherMultiplayer.length, 1);
  assert.equal(teaching.teacherMultiplayer[0].enrollment.listNumber, 99);
  assert.equal(
    teaching.classroom.students[0].enrollment.school,
    enrollment.school,
  );
  await req(
    "/multiplayer",
    { schema: MULTIPLAYER_SCHEMA, profile, multiplayer: [record] },
    student,
  );
  assert.equal(
    (
      await fetcher(admin.endpoint + "/multiplayer", {
        headers: { Authorization: "Bearer " + student.token },
      })
    ).status,
    403,
  );
  await req(
    "/students/revoke",
    { id: teaching.classroom.students[0].id },
    teacher,
  );
  assert.equal(
    (
      await fetcher(admin.endpoint + "/tasks", {
        headers: { Authorization: "Bearer " + student.token },
      })
    ).status,
    401,
  );
  after = await req("/admin-api/usage");
  success = true;
} finally {
  const report = {
    at: new Date().toISOString(),
    success,
    classId,
    before,
    after,
    requests: rows.length,
    d1Read: rows.reduce((n, r) => n + r.d1Read, 0),
    d1Written: rows.reduce((n, r) => n + r.d1Written, 0),
    cpu: "Use provider metrics; wallMs is not CPU time.",
    rows,
  };
  await writeFile(
    new URL("remote-test.json", output),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      success,
      requests: rows.length,
      d1Read: report.d1Read,
      d1Written: report.d1Written,
    }),
  );
}
