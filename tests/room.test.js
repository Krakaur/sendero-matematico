import test from "node:test";
import assert from "node:assert/strict";
import {
  createMatch,
  addPlayer,
  sharedDeck,
  startMatch,
  tickMatch,
  pauseMatch,
  playerAction,
  disconnectPlayer,
  publicSnapshot,
  validSnapshot,
  matchResults,
} from "../web/room.js";
const config = {
  trail: "multi",
  level: 1,
  circuit: "islas",
  mode: "race",
  seed: 431,
};
function ready(n = 2, c = {}) {
  const m = createMatch({ ...config, ...c }, "qa");
  for (let i = 0; i < n; i++) {
    addPlayer(m, "p" + i);
    playerAction(m, "p" + i, { type: "ready" }, 0);
  }
  assert(startMatch(m, 0));
  tickMatch(m, 2100);
  return m;
}
test("Private match has only actual participants, identical facts, and independently shuffled answer positions", () => {
  for (const trail of ["suma", "resta", "multi", "tablas20"])
    for (let level = 1; level <= 4; level++)
      for (let seed = 0; seed < 100; seed++) {
        const c = { ...config, trail, level, seed },
          deck = sharedDeck(c);
        assert.equal(new Set(deck.map((q) => `${q.a}:${q.b}`)).size, 8);
        const m = createMatch(c);
        for (let i = 0; i < 4; i++) assert(addPlayer(m, "p" + i));
        assert(!addPlayer(m, "fifth"));
        for (const p of m.players) {
          assert.deepEqual(
            p.questions.map((q) => [q.a, q.b, q.answer]),
            deck.map((q) => [q.a, q.b, q.answer]),
          );
          assert.equal(p.index, 0);
        }
      }
});
test("Readiness, start and pause are shared and excluded from active solving time", () => {
  const m = createMatch(config);
  addPlayer(m, "p0");
  assert(!startMatch(m, 0));
  addPlayer(m, "p1");
  playerAction(m, "p0", { type: "ready" }, 0);
  assert(!startMatch(m, 0));
  playerAction(m, "p1", { type: "ready" }, 0);
  assert(startMatch(m, 100));
  tickMatch(m, 2199);
  assert.equal(m.elapsedMs, 0);
  assert(
    !playerAction(
      m,
      "p0",
      { type: "answer", index: 0, value: m.players[0].questions[0].answer },
      2199,
    ),
  );
  tickMatch(m, 3200);
  assert.equal(m.elapsedMs, 1000);
  pauseMatch(m, "break", 4200);
  tickMatch(m, 100000);
  assert.equal(m.elapsedMs, 2000);
  assert(m.players.every((p) => !p.ready));
  assert(!startMatch(m, 100000));
  for (const p of m.players) playerAction(m, p.id, { type: "ready" }, 100000);
  assert(startMatch(m, 100000));
  tickMatch(m, 103100);
  assert.equal(m.elapsedMs, 3000);
  assert(m.players.every((p) => p.questions[0].timingInterrupted));
});
test("Only valid current answers advance; repeated, skipped, forged and rapid inputs do not", () => {
  const m = ready(),
    p = m.players[0],
    q = p.questions[0],
    wrong = q.options.find((x) => x !== q.answer);
  assert(
    !playerAction(
      m,
      "intruder",
      { type: "answer", index: 0, value: q.answer },
      3000,
    ),
  );
  assert(
    !playerAction(m, p.id, { type: "answer", index: 4, value: q.answer }, 3000),
  );
  assert(
    !playerAction(m, p.id, { type: "answer", index: 0, value: 10000 }, 3000),
  );
  assert(
    playerAction(m, p.id, { type: "answer", index: 0, value: wrong }, 3000),
  );
  assert.equal(p.index, 0);
  assert.equal(q.firstResponseMs, 900);
  assert(
    !playerAction(m, p.id, { type: "answer", index: 0, value: q.answer }, 3010),
  );
  assert(
    !playerAction(m, p.id, { type: "answer", index: 0, value: wrong }, 3200),
  );
  assert(
    playerAction(m, p.id, { type: "answer", index: 0, value: q.answer }, 3400),
  );
  assert.equal(p.index, 1);
  assert.deepEqual(q.attempts, [wrong, q.answer]);
  assert(
    !playerAction(m, p.id, { type: "answer", index: 0, value: q.answer }, 4000),
  );
});
test("Finishing one player never terminates others; correction and assistance remain distinct", () => {
  const m = ready();
  let time = 2500;
  playerAction(m, "p0", { type: "hint", index: 0 }, time);
  for (let i = 0; i < 8; i++)
    playerAction(
      m,
      "p0",
      { type: "answer", index: i, value: m.players[0].questions[i].answer },
      (time += 500),
    );
  assert.equal(m.status, "running");
  assert.equal(matchResults(m).find((p) => p.id === "p0").independent, 7);
  for (let i = 0; i < 8; i++)
    playerAction(
      m,
      "p1",
      { type: "answer", index: i, value: m.players[1].questions[i].answer },
      (time += 500),
    );
  assert.equal(m.status, "finished");
  assert.equal(matchResults(m)[0].place, 1);
  assert.equal(matchResults(m)[1].place, 2);
});
test("Cooperation completes only when everyone arrives and has no ranking", () => {
  const m = ready(4, { mode: "coop" });
  let t = 2200;
  for (let i = 0; i < 8; i++)
    for (const p of m.players)
      playerAction(
        m,
        p.id,
        { type: "answer", index: i, value: p.questions[i].answer },
        (t += 200),
      );
  assert.equal(m.status, "finished");
  assert(matchResults(m).every((p) => p.place === null && p.completed === 8));
});
test("A disconnect pauses all, prevents a false win and requires connected ready players", () => {
  const m = ready();
  disconnectPlayer(m, "p1", 4000);
  assert.equal(m.status, "paused");
  assert.equal(m.elapsedMs, 1900);
  assert(!m.players[1].connected);
  assert(!startMatch(m, 8000));
  assert(matchResults(m).every((p) => p.place === null));
});
test("Snapshot validation rejects corrupted facts, duplicate IDs, invalid progress and injected structures", () => {
  const m = ready(),
    s = publicSnapshot(m, 3500);
  assert(validSnapshot(s));
  for (const mutate of [
    (s) => (s.players[0].questions[0].answer = 200),
    (s) => (s.players[1].id = s.players[0].id),
    (s) => (s.players[0].index = 8),
    (s) => (s.players[0].name = "<img>"),
    (s) => (s.elapsedMs = Infinity),
    (s) => (s.countdownMs = -2),
    (s) => (s.config.level = 8),
    (s) => (s.players[0].questions[0].options = [1, 1, 1, 1]),
  ]) {
    const copy = structuredClone(s);
    mutate(copy);
    assert(!validSnapshot(copy));
  }
});
test("Network finish uncertainty is explicit; very close arrivals share first place", () => {
  const m = ready();
  m.tieWindowMs = 180;
  m.players[0].finishedMs = 10000;
  m.players[1].finishedMs = 10100;
  assert(matchResults(m).every((p) => p.place === 1));
  m.players[1].finishedMs = 10400;
  assert.deepEqual(
    matchResults(m).map((p) => p.place),
    [1, 2],
  );
});
test("Tie groups use their first arrival, without chained or inconsistent ranks", () => {
  const m = ready(4);
  m.tieWindowMs = 100;
  [1000, 1080, 1160, 1240].forEach((t, i) => (m.players[i].finishedMs = t));
  assert.deepEqual(
    matchResults(m).map((p) => p.place),
    [1, 1, 3, 3],
  );
  m.players.reverse();
  assert.deepEqual(
    matchResults(m).map((p) => p.place),
    [1, 1, 3, 3],
  );
});
