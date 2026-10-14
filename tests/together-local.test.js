import test from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_KEYS,
  createLocalMatch,
  localAnswer,
} from "../web/together-local.js";
import {
  playerAction,
  startMatch,
  tickMatch,
  publicSnapshot,
  validSnapshot,
} from "../web/room.js";
import { togetherProfiles } from "../web/together-profiles.js";
import { createProfile, profileKey } from "../web/profiles.js";
import { currentMission, solvedModel } from "../web/workshop.js";

const config = {
  trail: "multi",
  level: 1,
  mode: "race",
  circuit: "islas",
  seed: 431,
};
const testCode = i => String(i + 1).padStart(6, "0");
const storage = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
function ready(match) {
  for (const p of match.players)
    if (!p.ready) playerAction(match, p.id, { type: "ready" }, 0);
  assert(startMatch(match, 0));
  tickMatch(match, 2100);
}
function complete(match) {
  for (let i = 0; i < 8; i++)
    for (const p of match.players) {
      if (p.workshop) {
        const task = currentMission(p.workshop);
        p.workshop.records[i].model = solvedModel(task);
        for (const change of [
          { type: "check" },
          { type: "reason", value: task.reason },
          { type: "next" },
        ])
          playerAction(
            match,
            p.id,
            { type: "project", index: i, change },
            2500 + i * 1000,
          );
      } else {
        const q = p.questions[i];
        const input = localAnswer(
          match,
          LOCAL_KEYS[p.seat][q.options.indexOf(q.answer)],
        );
        playerAction(match, input.player, input.action, 2500 + i * 1000);
      }
      if (i < 7 || p.seat < match.players.length - 1)
        assert.equal(match.status, "running");
    }
  assert.equal(match.status, "finished");
}

test("Two, three and four local seats have disjoint controls, identical challenges and recoverable snapshots", () => {
  assert.equal(new Set(LOCAL_KEYS.flat()).size, 16);
  for (const count of [2, 3, 4])
    for (const mode of ["race", "coop"]) {
      const m = createLocalMatch({ ...config, mode }, count);
      assert.equal(m.players.length, count);
      for (const p of m.players.slice(0, -1))
        playerAction(m, p.id, { type: "ready" }, 0);
      assert.equal(startMatch(m, 0), false);
      ready(m);
      for (const p of m.players) {
        assert.deepEqual(
          p.questions.map((q) => [q.a, q.b]),
          m.players[0].questions.map((q) => [q.a, q.b]),
        );
        for (const [index, key] of LOCAL_KEYS[p.seat].entries()) {
          const input = localAnswer(m, key.toUpperCase());
          assert.equal(input.player, p.id);
          assert.equal(input.action.value, p.questions[0].options[index]);
        }
      }
      if (count < 4) assert.equal(localAnswer(m, LOCAL_KEYS[count][0]), null);
      assert.equal(localAnswer(m, "z"), null);
      assert(validSnapshot(publicSnapshot(m, 2100)));
      complete(m);
      assert(validSnapshot(publicSnapshot(m, 12000)));
      assert.equal(localAnswer(m, "a"), null);
    }
  for (const invalid of [0, 1, 5, 2.5, "4", NaN])
    assert.throws(() => createLocalMatch(config, invalid));
});

test("Four students complete reasoning cooperatively without arithmetic keyboard interference", () => {
  const m = createLocalMatch({ ...config, trail: "razonar", mode: "coop" }, 4);
  ready(m);
  assert.equal(localAnswer(m, "a"), null);
  complete(m);
  assert.equal(m.players.filter((p) => p.index === 8).length, 4);
  assert(validSnapshot(publicSnapshot(m, 12000)));
});

test("Four private profiles save four independent, idempotent records and keep school data off the shared match", async () => {
  const store = storage(),
    tab = storage();
  const controller = togetherProfiles(store, tab, () => {});
  for (let i = 0; i < 4; i++) {
    const s = {
      profile: `qa-${testCode(i)}`,
      sessions: [],
      teacher: [],
      adaptive: {},
      current: null,
    };
    await createProfile(store, testCode(i), "clave-prueba", "student", s, {
      school: "Escuela de prueba",
      grade: "3.º primaria",
      group: "A",
      listNumber: String(i + 1),
    });
    await controller.selectProfile(i, s.profile, "clave-prueba");
  }
  await assert.rejects(
    controller.selectProfile(3, "qa-000001", "clave-prueba"),
    /perfil distinto/,
  );
  await assert.rejects(
    controller.selectProfile(4, "qa-000001", "clave-prueba"),
    /plaza/,
  );
  const m = createLocalMatch(config, 4);
  ready(m);
  controller.capture(m, "local", "local-0");
  complete(m);
  const before = JSON.stringify(m);
  controller.capture(m, "local", "local-0");
  togetherProfiles(store, tab, () => {}).capture(m, "local", "local-0");
  for (let i = 0; i < 4; i++) {
    const s = JSON.parse(store.getItem(profileKey(`qa-${testCode(i)}`)));
    assert.equal(s.multiplayerHistory.length, 1);
    assert.equal(s.multiplayerHistory[0].id, m.id + "-" + i);
    assert.equal(s.multiplayerHistory[0].enrollment.listNumber, i + 1);
    assert.equal(s.multiplayerHistory[0].participants, 4);
    assert.equal(s.sessions.length, 0);
    assert.deepEqual(s.adaptive, {});
  }
  assert.equal(JSON.stringify(m), before);
  assert(!before.includes("Escuela de prueba"));
  assert(!before.includes("qa-000"));
});

test("Legacy two-profile bindings migrate and concurrent sign-ins cannot share a profile", async () => {
  const store = storage(),
    tab = storage();
  await createProfile(store, "000005", "clave-prueba", "student", {
    profile: "legacy",
    sessions: [],
    teacher: [],
  });
  tab.setItem(
    "sendero.together.profiles",
    JSON.stringify({ bindings: [{ id: "legacy" }, null], captured: null }),
  );
  const c = togetherProfiles(store, tab, () => {});
  assert(c.panel(4).includes("Vinculado: <strong>000005</strong>"));
  assert.equal((c.panel(4).match(/data-profile-seat=/g) || []).length, 4);
  assert.equal((c.panel(2).match(/data-profile-seat=/g) || []).length, 2);
  await c.selectProfile(0, "", "");
  const results = await Promise.allSettled([
    c.selectProfile(2, "legacy", "clave-prueba"),
    c.selectProfile(3, "legacy", "clave-prueba"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    JSON.parse(tab.getItem("sendero.together.profiles")).bindings.filter(
      Boolean,
    ).length,
    1,
  );
});
