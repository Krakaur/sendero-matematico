import test from "node:test";
import assert from "node:assert/strict";
import {
  recordAttempt,
  makeQuestion,
  newSession,
  adapt,
  dimensions,
  summarize,
  validateReport,
  mergeSessions,
  SCHEMA,
} from "../web/core.js";
test("An error reveals the solution and a subsequent correct answer is not independent", () => {
  const q = makeQuestion("suma", 1, seeded());
  assert.equal(q.solutionShown, false);
  const wrong = q.options.find((n) => n !== q.answer);
  assert.equal(recordAttempt(q, wrong), true);
  assert.equal(q.solutionShown, true);
  assert.equal(q.done, undefined);
  assert.equal(recordAttempt(q, q.answer), true);
  assert.equal(q.done, true);
  assert.equal(dimensions([{ questions: [q] }]).independent, 0);
  assert.equal(JSON.parse(JSON.stringify(q)).solutionShown, true);
  assert.equal(recordAttempt(q, q.answer), false);
});
const seeded = () => {
  let x = 12345;
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
};
function complete(trail = "suma") {
  const s = newSession(trail, 1, "test-profile");
  s.questions.forEach((q) => {
    q.attempts = [q.answer];
    q.done = true;
    q.activeMs = 1200;
  });
  s.completedAt = new Date().toISOString();
  return s;
}
test("Exercises have one correct option, nonnegative integers and declared level ranges", () => {
  const rng = seeded();
  for (const trail of ["suma", "resta", "multi"])
    for (let level = 1; level <= 4; level++)
      for (let i = 0; i < 1000; i++) {
        const q = makeQuestion(trail, level, rng);
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options).size, 4);
        assert.ok(q.options.includes(q.answer));
        assert.ok(q.options.every((n) => Number.isInteger(n) && n >= 0));
        assert.equal(q.level, level);
        assert.equal(
          q.answer,
          trail === "suma"
            ? q.a + q.b
            : trail === "resta"
              ? q.a - q.b
              : q.a * q.b,
        );
        assert.ok(
          q.a <=
            (trail === "multi" ? [3, 5, 8, 10] : [5, 10, 20, 50])[level - 1],
        );
      }
});
test("Three independent first responses advance; speed does not affect adaptation", () => {
  let s = { level: 1, streak: 0, support: 0 };
  const q = { answer: 4, attempts: [4], hint: false, activeMs: 999999 };
  for (let i = 0; i < 3; i++) s = adapt(s, q);
  assert.equal(s.level, 2);
  assert.equal(s.streak, 0);
});
test("Two supported questions lower difficulty without going below level one", () => {
  let s = { level: 3, streak: 2, support: 0 };
  const q = { answer: 4, attempts: [4], hint: true };
  s = adapt(s, q);
  assert.equal(s.level, 3);
  s = adapt(s, q);
  assert.equal(s.level, 2);
  for (let i = 0; i < 20; i++) s = adapt(s, q);
  assert.equal(s.level, 1);
});
test("Mistakes reset upward streak; maximum level is four", () => {
  assert.equal(
    adapt(
      { level: 2, streak: 2, support: 0 },
      { answer: 3, attempts: [2, 3], hint: false },
    ).streak,
    0,
  );
  assert.equal(
    adapt(
      { level: 4, streak: 2, support: 0 },
      { answer: 3, attempts: [3], hint: false },
    ).level,
    4,
  );
});
test("Multidimensional metrics distinguish assisted accuracy, independence and recovery", () => {
  const s = complete();
  s.questions[0].attempts = [999, s.questions[0].answer];
  s.questions[1].hint = true;
  const d = dimensions([s]);
  assert.deepEqual(d, {
    n: 8,
    first: 7,
    independent: 6,
    hints: 1,
    recovered: 1,
    errors: 1,
  });
  assert.equal(summarize([s]).accuracy, 88);
});
test("No observations are distinct from zero performance", () => {
  assert.equal(summarize([]).accuracy, null);
  assert.equal(dimensions([]).errors, 0);
});
test("Correction on the second attempt excludes three or more attempts", () => {
  const s = complete();
  s.questions[0].attempts = [999, 998, s.questions[0].answer];
  const d = dimensions([s]);
  assert.equal(d.errors, 1);
  assert.equal(d.recovered, 0);
});
test("Report round trip and deduplication preserve individual records", () => {
  const s = complete();
  const r = JSON.parse(
    JSON.stringify({ schema: SCHEMA, profile: s.profile, sessions: [s] }),
  );
  validateReport(r);
  const first = mergeSessions([], r.sessions);
  const second = mergeSessions(first.sessions, r.sessions);
  assert.equal(first.added, 1);
  assert.equal(second.added, 0);
  assert.equal(second.sessions.length, 1);
});
test("Reports reject malformed identities, impossible arithmetic, mixed profiles and excessive times", () => {
  for (const mutation of [
    (s) => (s.profile = "different"),
    (s) => (s.questions[0].answer = 999),
    (s) => (s.questions[0].activeMs = -1),
    (s) => (s.questions[0].level = 9),
    (s) => (s.id = "<script>"),
    (s) => (s.questions[0].attempts = []),
  ]) {
    const s = complete();
    mutation(s);
    assert.throws(() =>
      validateReport({
        schema: SCHEMA,
        profile: "test-profile",
        sessions: [s],
      }),
    );
  }
});
test("Completed data and pending session survive serialization without losing attempts", () => {
  const s = complete("multi");
  s.questions[0].attempts = [1, s.questions[0].answer];
  const data = {
    sessions: [s],
    current: newSession("resta", 2, "test-profile"),
  };
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data);
});
