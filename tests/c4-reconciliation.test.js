import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat, writeFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { newAssignedSession, recordAttempt, advanceAssignedSession } from "../web/core.js";
import { TASK_SCHEMA, sessionKey } from "../web/assignments.js";
import { newWorkshop, currentMission, solvedModel, applyWorkshopAction } from "../web/workshop.js";
import { summarizeReconciliation, RECONCILIATION_UNKNOWN as UNKNOWN } from "../web/reconciliation.js";

const at = "2026-10-21T22:00:00.000Z", classId = "class-c4-local";
const profiles = ["000101", "000102", "000103", "000104"];
const clone = (value) => structuredClone(value);
const sortKeys = (records) => records.map((record) => record.key).sort();
const key = (record, kind = "session", room = record.assignment?.classId || record.classId || null,
  profile = record.profile) => JSON.stringify([room, profile, kind, record.id]);
const baseEnrollment = (index = 0) => ({ school: "Escuela sintética C4", grade: "3",
  group: index < 2 ? "A" : "B", listNumber: index + 1 });
function matrix() {
  const tasks = [2, 4, 8].map((table, index) => ({ schema: TASK_SCHEMA, classId, id: `c4-task-${index + 1}`,
    version: 1, title: `Tabla ${table}`, trail: "multi", contentId: "multiply-fixed-table", contentVersion: 1,
    parameters: { table }, completionRule: { kind: "answered_items", count: 8 }, recipientProfileIds: profiles,
    assignedAt: at }));
  const sessions = profiles.flatMap((profile, student) => tasks.map((task, activity) => {
    const session = newAssignedSession(task, profile); session.id = `c4-${profile}-${activity + 1}`;
    session.enrollment = baseEnrollment(student);
    for (let item = 0; item < 8; item++) {
      const question = session.questions[session.index]; question.activeMs = 1000;
      recordAttempt(question, question.answer); advanceAssignedSession(session);
    }
    return session;
  }));
  // Same payload shape as C3 teacherEvidence, without a dependency on private QA files.
  const teacherEvidence = { tasks, sessions, observedAt: at,
    confirmations: Object.fromEntries(sessions.map((session) => [sessionKey(session),
      { classId, profile: session.profile, confirmedAt: at, source: "server-read" }])) };
  return { profile: "000190", teacher: teacherEvidence.sessions, teacherConfirmations: teacherEvidence.confirmations,
    teacherProjects: [], teacherMultiplayer: [], classroom: { classId: "currently-linked-other-room" }, teacherEvidence };
}
function construction() {
  const project = newWorkshop(1, 37);
  for (let i = 0; i < 8; i++) {
    const mission = currentMission(project); project.records[project.index].model = solvedModel(mission);
    applyWorkshopAction(project, { type: "check" });
    applyWorkshopAction(project, { type: "reason", value: mission.reason });
    applyWorkshopAction(project, { type: "next" });
  }
  assert(project.completedAt); return project;
}
function freeSession(session, id = "c4-free") {
  const result = clone(session);
  for (const field of ["assignment", "assignmentId", "assignmentVersion", "taskProtocol"]) delete result[field];
  result.id = id; result.classId = classId; return result;
}
function mixed() {
  const state = matrix(), first = state.teacher[0];
  const otherRoom = clone(first); otherRoom.assignment.classId = "class-c4-other";
  const multiLevel = freeSession(first); multiLevel.enrollment.group = "B";
  multiLevel.questions.forEach((question, index) => { question.level = index % 4 + 1; });
  const project = construction(); Object.assign(project, { id: first.id, classId, enrollment: baseEnrollment() });
  const participation = freeSession(first, first.id);
  Object.assign(participation, { mode: "race", transport: "local", participants: 4, finishedMs: 8000 });
  state.teacher.push(otherRoom, multiLevel);
  state.teacherProjects = [{ profile: profiles[0], projects: [project] }];
  state.teacherMultiplayer = [participation];
  return state;
}
function conservation(summary) {
  const totals = summary.totals;
  assert.equal(totals.inputEntries, totals.canonicalEntries + totals.duplicates + totals.incomplete + totals.invalid + totals.conflicting);
  assert.equal(totals.canonicalEntries, totals.visibleEntries + totals.filteredOut);
  assert.equal(summary.diagnostics.conservationDifference, 0);
  assert.equal(summary.diagnostics.inclusionDifference, 0);
  assert.equal(summary.ledger.length, totals.inputEntries);
  for (const [dimension, buckets] of Object.entries(summary.partitions)) {
    assert.equal(buckets.reduce((sum, bucket) => sum + bucket.count, 0), totals.visibleEntries, dimension);
    assert.equal(summary.diagnostics.partitionDifferences[dimension], 0);
    assert(buckets.some((bucket) => bucket.value === UNKNOWN), `${dimension}: unknown bucket retained`);
    assert(buckets.every((bucket) => bucket.denominator === totals.visibleEntries));
    assert.equal(new Set(buckets.flatMap((bucket) => bucket.keys)).size, totals.visibleEntries);
  }
  assert.equal(Object.values(totals.kinds).reduce((sum, value) => sum + value, 0), totals.visibleEntries);
}

test("C4: canonical closures, explicit exclusions and exclusive teacher partitions", async (t) => {
  const started = performance.now();
  const metrics = { schema: "sendero.c4-reconciliation-evidence.v1", publicRequests: 0,
    quota: "Recorded separately in quota ledger; local execution does not measure public quota", scenarios: [],
    predefined: { matrix: { entries: 12, included: 12, profiles: 4, questions: 96 },
      mixed: { entries: 16, included: 16, profiles: 5, session: 14, project: 1, participation: 1 },
      replay: { entries: 24, included: 12, duplicates: 12 },
      conflict: { entries: 14, included: 11, conflicting: 3 },
      missing: { entries: 17, included: 12, incomplete: 1, invalid: 4 },
      unknown: { entries: 3, included: 3, unknownClass: 3 }, empty: { entries: 0, included: 0 } } };
  const record = (name, summary) => {
    conservation(summary);
    metrics.scenarios.push({ name, totals: summary.totals, diagnostics: summary.diagnostics });
  };
  try {
    await t.test("exact four profiles times three assigned tasks and C3-compatible confirmations", () => {
      const state = matrix(), summary = summarizeReconciliation(state, true);
      assert.equal(summary.totals.inputEntries, 12); assert.equal(summary.totals.visibleEntries, 12);
      assert.equal(summary.totals.profiles, 4); assert.equal(summary.totals.evidenceUnits.sessionQuestions, 96);
      assert.deepEqual(sortKeys(summary.records), state.teacher.map((session) => key(session)).sort());
      assert.deepEqual(summary.partitions.group.filter((bucket) => bucket.count).map((bucket) => bucket.count).sort(), [6, 6]);
      assert.equal(summary.partitions.source.find((bucket) => bucket.value === "server-read").count, 12);
      assert.equal(summary.totals.canonicalEntries, state.teacherEvidence.sessions.length);
      // Extra session metadata cannot masquerade as a validated nested construction.
      const extended = clone(state); extended.teacher[0].project = {};
      const withExtraField = summarizeReconciliation(extended, true);
      assert.equal(withExtraField.totals.canonicalEntries, 12);
      assert.deepEqual(withExtraField.totals.evidenceUnits, summary.totals.evidenceUnits);
      assert.equal(withExtraField.records[0].dimensions.content, "multi");
      conservation(withExtraField);
      record("matrix4x3", summary);
    });
    await t.test("same ID across classrooms and types survives; multiple levels count as one closure", () => {
      const summary = summarizeReconciliation(mixed(), true);
      assert.equal(summary.totals.visibleEntries, 16); assert.equal(summary.totals.profiles, 5);
      assert.deepEqual(summary.totals.kinds, { session: 14, project: 1, participation: 1 });
      assert.equal(summary.records.filter((row) => row.id === "c4-000101-1").length, 4);
      assert.equal(summary.records.filter((row) => row.id === "c4-free").length, 1);
      assert.deepEqual(summary.totals.evidenceUnits, { sessionQuestions: 112, participationQuestions: 8,
        constructionMissions: 8, cooperativeMissions: 0, constructionChecks: 8, cooperativeChecks: 0 });
      assert.equal(summary.memberships.levels.overlapMemberships, 3);
      assert.equal(summary.memberships.groups.overlapMemberships, 1);
      assert.equal(summary.partitions.content.find((bucket) => bucket.value === UNKNOWN).count, 1);
      assert(summary.memberships.content.overlapMemberships > 0);
      assert.equal(summary.memberships.content.uniqueClosures, 16);
      record("mixed-types-and-levels", summary);
    });
    await t.test("twelve equivalent replays with reordered keys add no closures", () => {
      const state = matrix(), expected = state.teacher.map((session) => key(session)).sort();
      state.teacher.push(...state.teacher.map((session) => Object.fromEntries(Object.entries(clone(session)).reverse())));
      const summary = summarizeReconciliation(state, true);
      assert.equal(summary.totals.inputEntries, 24); assert.equal(summary.totals.canonicalEntries, 12);
      assert.equal(summary.totals.duplicates, 12); assert.deepEqual(sortKeys(summary.records), expected);
      assert.equal(summary.ledger.filter((row) => row.status === "duplicate").length, 12);
      record("twelve-replays", summary);
    });
    await t.test("a discrepant variant excludes every entry of that identity, including its replay", () => {
      const state = matrix(), conflicting = clone(state.teacher[0]);
      conflicting.enrollment.group = "C";
      state.teacher.push(clone(state.teacher[0]), conflicting);
      const summary = summarizeReconciliation(state, true);
      assert.equal(summary.totals.inputEntries, 14); assert.equal(summary.totals.canonicalEntries, 11);
      assert.equal(summary.totals.conflicting, 3); assert.equal(summary.totals.duplicates, 0);
      assert(!summary.records.some((row) => row.key === key(conflicting)));
      const rows = summary.ledger.filter((row) => row.status === "conflicting");
      assert.equal(rows.length, 3); assert(rows.every((row) => row.reason.includes("todas sus variantes")));
      record("conflicting-identity", summary);
    });
    await t.test("missing identity, incomplete closure, unsupported content and malformed containers remain visible", () => {
      const state = matrix();
      const incomplete = clone(state.teacher[0]); incomplete.id = "c4-incomplete"; incomplete.completedAt = null;
      const missing = clone(state.teacher[0]); delete missing.id;
      const unsupported = freeSession(state.teacher[0], "c4-unsupported"); unsupported.trail = "unrecognized-trail";
      state.teacher.push(incomplete, missing, unsupported, null);
      state.teacherProjects = [{ profile: profiles[0], projects: "not-an-array" }];
      const summary = summarizeReconciliation(state, true);
      assert.equal(summary.totals.inputEntries, 17); assert.equal(summary.totals.canonicalEntries, 12);
      assert.equal(summary.totals.incomplete, 1); assert.equal(summary.totals.invalid, 4);
      assert.equal(summary.ledger.find((row) => row.id === "c4-unsupported").originalTrail, "unrecognized-trail");
      assert(summary.ledger.filter((row) => row.status !== "included").every((row) => row.reason && row.path));
      record("missing-and-invalid", summary);
    });
    await t.test("valid unknown context remains included without borrowing the currently linked room", () => {
      const base = matrix(), session = freeSession(base.teacher[0], "c4-legacy");
      delete session.classId; delete session.enrollment;
      const project = construction(); project.id = "c4-unknown-project";
      const participation = freeSession(base.teacher[0], "c4-unknown-participation");
      delete participation.classId;
      Object.assign(participation, { mode: "race", transport: "online", participants: 4, finishedMs: 8000 });
      const state = { teacher: [session], teacherProjects: [{ profile: profiles[0], projects: [project] }],
        teacherMultiplayer: [participation], classroom: { classId: "must-not-be-inferred" } };
      const summary = summarizeReconciliation(state, true);
      assert.equal(summary.totals.visibleEntries, 3); assert.equal(summary.diagnostics.unknownClassClosures, 3);
      assert(summary.records.every((row) => row.classId === null));
      assert.equal(summary.partitions.source.find((bucket) => bucket.value === UNKNOWN).count, 3);
      assert.equal(summary.partitions.group.find((bucket) => bucket.value === UNKNOWN).count, 2);
      assert.equal(summary.partitions.content.find((bucket) => bucket.value === UNKNOWN).count, 1);
      record("unknown-retained", summary);
    });
    await t.test("real manual-file, server-read, client-observed and student-ack sources stay distinct", () => {
      const state = matrix();
      state.teacherConfirmations[sessionKey(state.teacher[0])].source = "manual-file";
      state.teacherConfirmations[sessionKey(state.teacher[1])].source = "client-observed-server-read";
      delete state.teacherConfirmations[sessionKey(state.teacher[2])];
      const summary = summarizeReconciliation(state, true);
      const count = (source) => summary.partitions.source.find((bucket) => bucket.value === source)?.count || 0;
      assert.equal(count("manual-import"), 1); assert.equal(count("server-observed"), 1);
      assert.equal(count("server-read"), 9); assert.equal(count(UNKNOWN), 1);
      const local = { profile: profiles[0], sessions: state.teacher.slice(0, 3), classroom: { confirmations: {
        [sessionKey(state.teacher[0])]: { classId, profile: profiles[0], receivedAt: at, source: "server-acknowledgement" },
      } } };
      const student = summarizeReconciliation(local, false);
      assert.equal(student.partitions.source.find((bucket) => bucket.value === "server-acknowledgement").count, 1);
      assert.equal(student.partitions.source.find((bucket) => bucket.value === "local-store").count, 2);
      const mismatch = matrix(); mismatch.teacherConfirmations[sessionKey(mismatch.teacher[0])].classId = "wrong-class";
      const rejected = summarizeReconciliation(mismatch, true);
      assert.equal(rejected.totals.invalid, 1); assert.equal(rejected.totals.visibleEntries, 11);
      const badMetadata = matrix();
      badMetadata.teacherConfirmations[sessionKey(badMetadata.teacher[0])].confirmedAt = "invalid-date";
      const unproven = summarizeReconciliation(badMetadata, true);
      assert.equal(unproven.totals.canonicalEntries, 12);
      assert.equal(unproven.partitions.source.find((bucket) => bucket.value === UNKNOWN).count, 1);
      conservation(unproven);
      record("provenance-distinct", summary); conservation(student); conservation(rejected);
    });
    await t.test("filters select only canonical closures and preserve global exclusions and options", () => {
      const state = mixed(), all = summarizeReconciliation(state, true);
      const studentValue = all.records.find((row) => row.profile === profiles[0] && row.classId === classId).dimensions.student;
      const filtered = summarizeReconciliation(state, true, { student: studentValue, game: "assigned" });
      assert.equal(filtered.totals.canonicalEntries, 16); assert.equal(filtered.totals.visibleEntries, 3);
      assert.equal(filtered.totals.filteredOut, 13); assert.equal(filtered.totals.profiles, 1);
      assert(filtered.records.every((row) => row.profile === profiles[0] && row.classId === classId && row.sourceRecord.assignment));
      assert.deepEqual(filtered.options, all.options);
      const unknown = summarizeReconciliation(state, true, { content: UNKNOWN });
      assert.equal(unknown.totals.visibleEntries, 1); assert.equal(unknown.records[0].kind, "project");
      const absent = summarizeReconciliation(state, true, { student: "does-not-exist" });
      assert.equal(absent.totals.visibleEntries, 0); assert.equal(absent.totals.denominator, 0);
      assert.equal(absent.diagnostics.noObservations, true); assert.equal(absent.options.student.length, all.options.student.length);
      record("filter-subset", filtered); conservation(unknown); record("filter-empty", absent);
    });
    await t.test("empty input is no observations, with explicit zero denominators and unknown choices", () => {
      const summary = summarizeReconciliation({}, true);
      assert.equal(summary.totals.inputEntries, 0); assert.equal(summary.totals.visibleEntries, 0);
      assert.equal(summary.totals.profiles, 0); assert(summary.diagnostics.noObservations);
      for (const buckets of Object.values(summary.partitions)) assert.deepEqual(buckets,
        [{ value: UNKNOWN, label: "Sin clasificar", count: 0, denominator: 0, profileCount: 0, keys: [] }]);
      record("empty", summary);
    });
    await t.test("calculation and returned source copies do not mutate application state", () => {
      const state = mixed(), before = JSON.stringify(state), filters = { game: "assigned" }, beforeFilters = JSON.stringify(filters);
      const summary = summarizeReconciliation(state, true, filters);
      assert.equal(JSON.stringify(state), before); assert.equal(JSON.stringify(filters), beforeFilters);
      summary.records[0].sourceRecord.questions[0].attempts.push(999);
      summary.records[0].enrollment.group = "changed-output-only";
      assert.equal(JSON.stringify(state), before);
      assert.throws(() => summarizeReconciliation(state, true, { game: [] }), /Filtro/);
      metrics.nonMutation = true;
    });
    await t.test("optional exact C3 evidence path agrees with the self-contained 4x3 fixture", { skip: !process.env.C4_C3_EVIDENCE_FILE }, async () => {
      const path = process.env.C4_C3_EVIDENCE_FILE;
      assert(isAbsolute(path), "Use one explicit absolute file; no directory traversal or scan");
      assert((await stat(path)).size <= 512 * 1024, "C3 evidence budget is 512 KiB");
      const evidence = JSON.parse(await readFile(path, "utf8")).teacherEvidence;
      assert(evidence && Array.isArray(evidence.sessions));
      const summary = summarizeReconciliation({ teacher: evidence.sessions, teacherConfirmations: evidence.confirmations }, true);
      assert.equal(summary.totals.canonicalEntries, 12); assert.equal(summary.totals.profiles, 4);
      assert.equal(summary.totals.evidenceUnits.sessionQuestions, 96);
      const actual = summary.records.map((row) => `${row.profile}/${row.sourceRecord.assignmentId}@${row.sourceRecord.assignmentVersion}`).sort();
      const expected = profiles.flatMap((profile) => [1, 2, 3].map((activity) => `${profile}/c3-task-${activity}@1`)).sort();
      assert.deepEqual(actual, expected); record("actual-C3-evidence", summary);
    });
  } finally {
    metrics.elapsedMilliseconds = Math.round(performance.now() - started);
    if (process.env.C4_METRICS_FILE) await writeFile(process.env.C4_METRICS_FILE, JSON.stringify(metrics, null, 2) + "\n", "utf8");
  }
});
