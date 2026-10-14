// Bounded production smoke test with synthetic records. Never logs invitations or credentials.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import assert from "node:assert/strict";
import { newSession, recordAttempt } from "../web/core.js";
import {
  readInvitation,
  exchangeClassroom,
  applyExchange,
  classroomRequest,
} from "../web/classroom.js";
import { saveCloudCopy, restoreCloudCopy } from "../web/cloud.js";
const admin = JSON.parse(
  await readFile(
    new URL("../server/private/cloudflare-admin.json", import.meta.url),
    "utf8",
  ),
);
const output = new URL("../qa-private/cloudflare-20261014/", import.meta.url);
await mkdir(output, { recursive: true });
const rows = [],
  start = new Date().toISOString();
async function fetcher(url, options = {}) {
  if (rows.length >= 45) throw Error("Remote request budget reached");
  const t = performance.now();
  const response = await fetch(url, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  rows.push({
    path: new URL(url).pathname,
    method: options.method || "GET",
    status: response.status,
    wallMs: Math.round(performance.now() - t),
    d1Read: Number(response.headers.get("X-D1-Rows-Read")) || 0,
    d1Written: Number(response.headers.get("X-D1-Rows-Written")) || 0,
  });
  return response;
}
const request = (path, body, link = admin) =>
  classroomRequest(link, path, body, fetcher);
let success = false;
try {
  const before = await request("/admin-api/usage");
  const invitation = await request("/admin-api/rooms", {
      name: "QA sintética 2026-10-14",
    }),
    teacher = readInvitation(invitation, "teacher");
  const studentInvitation = await request("/students", {}, teacher),
    student = readInvitation(studentInvitation, "student");
  const profile = {
    id: "qa-cloud-" + crypto.randomUUID(),
    name: "Prueba sintética",
    role: "student",
  };
  const s = newSession("suma", 1, profile.id);
  for (const q of s.questions) {
    q.activeMs = 1000;
    recordAttempt(q, q.answer);
    q.done = true;
  }
  s.index = 7;
  s.completedAt = new Date().toISOString();
  const state = {
    profile: profile.id,
    sessions: [s],
    teacher: [],
    adaptive: {},
    current: null,
    classroom: student,
  };
  await request(
    "/tasks",
    { tasks: [{ id: "qa-sumas", title: "Prueba sintética", trail: "suma" }] },
    teacher,
  );
  applyExchange(state, await exchangeClassroom(state, fetcher));
  assert.deepEqual(state.classroom.received, [s.id]);
  const teaching = {
    profile: "qa-teacher",
    sessions: [],
    teacher: [],
    classroom: teacher,
  };
  applyExchange(teaching, await exchangeClassroom(teaching, fetcher));
  assert.equal(teaching.teacher.length, 1);
  const saved = await saveCloudCopy(
    profile,
    state,
    "solo-prueba-sintetica-2026",
    fetcher,
  );
  assert.equal(saved.revision, 1);
  const map = new Map(),
    storage = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
    };
  const restored = await restoreCloudCopy(
    storage,
    studentInvitation,
    "solo-prueba-sintetica-2026",
    "clave-local-sintetica",
    fetcher,
  );
  assert.equal(restored.state.sessions[0].id, s.id);
  const invalid = await fetcher(admin.endpoint + "/reports", {
    headers: { Authorization: "Bearer " + student.token },
  });
  assert.equal(invalid.status, 403);
  const roster = await request("/students", null, teacher);
  await request("/students/revoke", { id: roster.students[0].id }, teacher);
  const revoked = await fetcher(admin.endpoint + "/tasks", {
    headers: { Authorization: "Bearer " + student.token },
  });
  assert.equal(revoked.status, 401);
  const after = await request("/admin-api/usage");
  // Record only identifiers; revoke synthetic accesses separately after inspecting the final result.
  await writeFile(
    new URL("synthetic-room.json", output),
    JSON.stringify(
      { classId: invitation.classId, profile: profile.id, before, after },
      null,
      2,
    ),
  );
  success = true;
} finally {
  const report = {
    startedAt: start,
    finishedAt: new Date().toISOString(),
    success,
    requests: rows.length,
    d1Read: rows.reduce((a, r) => a + r.d1Read, 0),
    d1Written: rows.reduce((a, r) => a + r.d1Written, 0),
    cpu: "Read provider metrics separately; wallMs is not CPU.",
    rows,
  };
  await writeFile(
    new URL("remote-test.json", output),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      success,
      requests: report.requests,
      d1Read: report.d1Read,
      d1Written: report.d1Written,
      report: "qa-private/cloudflare-20261014/remote-test.json",
    }),
  );
}
