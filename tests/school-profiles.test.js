import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEnrollment,
  validEnrollment,
  enrollmentFields,
  csvCell,
} from "../web/enrollment.js";
import {
  createProfile,
  loginProfile,
  profileKey,
  PROFILE_INDEX,
} from "../web/profiles.js";
import {
  createMatch,
  addPlayer,
  playerAction,
  startMatch,
  tickMatch,
  publicSnapshot,
} from "../web/room.js";
import {
  participationRecord,
  saveParticipation,
  validateMultiplayerRecord,
  mergeMultiplayer,
} from "../web/multiplayer-records.js";
import {
  cohortRows,
  filterCohorts,
  summarizeCohorts,
  cohortCSV,
} from "../web/cohorts.js";
import { encryptBackup, decryptBackup } from "../web/backup.js";
import { currentMission, solvedModel } from "../web/workshop.js";
import { togetherProfiles } from "../web/together-profiles.js";
const enrollment = normalizeEnrollment({
  school: "Escuela de prueba",
  grade: "3.º primaria",
  group: "A",
  listNumber: "07",
});
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const state = (id) => ({
  profile: id,
  sessions: [],
  teacher: [],
  adaptive: {},
  current: null,
});
function match(trail = "multi") {
  const m = createMatch({
    trail,
    level: 1,
    circuit: "islas",
    mode: trail === "razonar" ? "coop" : "race",
    seed: 431,
  });
  for (const id of ["p0", "p1"]) {
    addPlayer(m, id);
    playerAction(m, id, { type: "ready" }, 0);
  }
  startMatch(m, 0);
  tickMatch(m, 2100);
  for (const p of m.players)
    for (let i = 0; i < 8; i++) {
      if (p.workshop) {
        const task = currentMission(p.workshop);
        p.workshop.records[i].model = solvedModel(task);
        for (const change of [
          { type: "check" },
          { type: "reason", value: task.reason },
          { type: "next" },
        ])
          playerAction(
            m,
            p.id,
            { type: "project", index: i, change },
            2500 + i * 1000,
          );
      } else
        playerAction(
          m,
          p.id,
          { type: "answer", index: i, value: p.questions[i].answer },
          2500 + i * 1000,
        );
    }
  return m;
}
test("School fields normalize, reject invalid identities and escape HTML and CSV formula injection", () => {
  assert.deepEqual(enrollment, {
    school: "Escuela de prueba",
    grade: "3.o primaria",
    group: "A",
    listNumber: 7,
  });
  assert(validEnrollment(normalizeEnrollment()));
  assert(!validEnrollment({ school: "X" }));
  for (const value of [
    { name: "Personal name" },
    { listNumber: 0 },
    { listNumber: 1.5 },
    { listNumber: 1000 },
    { school: "x".repeat(121) },
  ])
    assert.throws(() => normalizeEnrollment(value));
  assert(!enrollmentFields({ school: "<script>" }).includes('value="<script>'));
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("@SUM(1)"), '"\'@SUM(1)"');
});
test("Two local student profiles keep private enrollment, historical snapshots and encrypted backups", async () => {
  const store = storage(),
    a = state("profile-a"),
    b = state("profile-b");
  const profile = await createProfile(
    store,
    "Prueba A",
    "prueba-segura",
    "student",
    a,
    enrollment,
  );
  await createProfile(store, "Prueba B", "prueba-segura", "student", b, {
    ...enrollment,
    listNumber: 8,
  });
  assert(!store.getItem(PROFILE_INDEX).includes("Escuela de prueba"));
  assert.equal(
    (await loginProfile(store, profile.id, "prueba-segura")).state.enrollment
      .listNumber,
    7,
  );
  const m = match(),
    ra = participationRecord(m, "p0", { id: a.profile, enrollment }, "local"),
    rb = participationRecord(
      m,
      "p1",
      { id: b.profile, enrollment: { ...enrollment, listNumber: 8 } },
      "local",
    );
  const network = JSON.stringify(publicSnapshot(m, 11000));
  for (const value of [
    "Escuela de prueba",
    "profile-a",
    "enrollment",
    "listNumber",
  ])
    assert(!network.includes(value));
  assert.equal(participationRecord(m, "p0", null, "local"), null);
  assert(saveParticipation(store, profileKey(a.profile), ra));
  assert(!saveParticipation(store, profileKey(a.profile), ra));
  assert(saveParticipation(store, profileKey(b.profile), rb));
  const saved = JSON.parse(store.getItem(profileKey(a.profile)));
  saved.enrollment.group = "B";
  assert.equal(saved.multiplayerHistory[0].enrollment.group, "A");
  assert.equal(saved.sessions.length, 0);
  assert.deepEqual(saved.adaptive, {});
  assert.equal(
    JSON.parse(store.getItem(profileKey(b.profile))).multiplayerHistory[0]
      .enrollment.listNumber,
    8,
  );
  const copy = await decryptBackup(
    await encryptBackup(profile, saved, "copia-segura"),
    "copia-segura",
  );
  assert.equal(copy.state.enrollment.group, "B");
  assert.equal(copy.state.multiplayerHistory[0].enrollment.group, "A");
  assert.equal(mergeMultiplayer([ra], [ra]).length, 1);
});
test("Shared construction records are separate and exclude free notes", () => {
  const m = match("razonar");
  m.players[0].workshop.records[0].note = "Nota no compartida";
  const r = participationRecord(
    m,
    "p0",
    { id: "profile-a", enrollment },
    "online",
  );
  assert(validateMultiplayerRecord(r));
  assert.equal(r.project.records[0].note, "");
  assert.throws(() => validateMultiplayerRecord({ ...r, mode: "race" }));
  assert.throws(() => validateMultiplayerRecord({ ...r, version: null }));
  assert.equal(
    cohortRows({ profile: r.profile, multiplayerHistory: [r] })[0].kind,
    "Modelo y justificación",
  );
});
test("An online guest records only their own seat, without mutating the transmitted match or adaptation", async () => {
  const store = storage(),
    tab = storage(),
    s = state("online-profile");
  await createProfile(
    store,
    "Invitado QA",
    "clave-prueba",
    "student",
    s,
    enrollment,
  );
  tab.setItem("sendero.active", s.profile);
  const controller = togetherProfiles(store, tab, () => {}),
    m = match(),
    before = JSON.stringify(m);
  controller.capture(m, "guest", "p1");
  controller.capture(m, "guest", "p1");
  const saved = JSON.parse(store.getItem(profileKey(s.profile)));
  assert.equal(saved.multiplayerHistory.length, 1);
  assert.equal(saved.multiplayerHistory[0].id, m.id + "-1");
  assert.equal(saved.multiplayerHistory[0].transport, "online");
  assert.equal(JSON.stringify(m), before);
  assert.equal(saved.sessions.length, 0);
  assert.deepEqual(saved.adaptive, {});
  const restored = togetherProfiles(store, tab, () => {});
  restored.capture(m, "guest", "p1");
  assert.equal(
    JSON.parse(store.getItem(profileKey(s.profile))).multiplayerHistory.length,
    1,
  );
});
test("Conflicting multiplayer imports preserve the original record instead of silently replacing it", () => {
  const m = match(),
    r = participationRecord(m, "p0", { id: "profile-a", enrollment }, "local");
  const other = structuredClone(r);
  other.enrollment.group = "B";
  assert.throws(() => mergeMultiplayer([r], [other]), /dos contenidos/);
  assert.equal(r.enrollment.group, "A");
  const reordered = Object.fromEntries(Object.entries(r).reverse());
  assert.equal(mergeMultiplayer([r], [reordered]).length, 1);
});
test("Cohorts separate context and level, retain missing historical labels and compute equal-profile and pooled rates", () => {
  const m = match(),
    r = participationRecord(m, "p0", { id: "profile-a", enrollment }, "local");
  const other = structuredClone(r);
  other.id += "-b";
  other.profile = "profile-b";
  other.questions[0].attempts.unshift(-1);
  const individual = {
    ...r,
    id: "individual",
    questions: structuredClone(r.questions),
  };
  delete individual.enrollment;
  individual.questions[0].level = 2;
  const rows = cohortRows({
    profile: r.profile,
    enrollment,
    sessions: [individual],
    multiplayerHistory: [r, other],
  });
  assert.equal(rows.length, 4);
  assert.equal(rows.filter((x) => !x.school).length, 2);
  assert.equal(
    filterCohorts(rows, {
      school: " ESCUELA DE PRUEBA ",
      group: "a",
      listNumber: "7",
    }).length,
    2,
  );
  const groups = summarizeCohorts(rows);
  assert.equal(groups.length, 3);
  const g = groups.find((x) => x.transport === "local");
  assert.equal(g.students, 2);
  assert.equal(g.first, 15);
  assert.equal(g.percent, 93.75);
  const uneven = [
    { ...rows.at(-2), items: 8, first: 8 },
    { ...rows.at(-1), items: 1, first: 0 },
  ];
  assert.equal(summarizeCohorts(uneven)[0].studentMean, 50);
  assert.equal(summarizeCohorts(uneven)[0].percent, 800 / 9);
  const csv = cohortCSV(rows);
  assert(csv.includes("numero_lista"));
  assert(csv.includes("Multijugador"));
  assert(!csv.includes("password"));
});
