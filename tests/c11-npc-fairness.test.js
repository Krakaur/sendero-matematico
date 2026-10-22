import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {newRace, raceStats, raceLevel, rivalProgress, rivalEffort} from '../web/race.js';
import {advanceBoat, RiverMotion} from '../web/race-motion.js';
import {CircuitView, courseGeometry, coursePoint} from '../web/circuit.js';

// Prepared candidate; no browser, storage, timers, randomness or network.
// 716 bounded fixtures, 746 newRace constructions; never a population claim.
const TRAILS = ['suma', 'resta', 'multi', 'tablas20'];
const MODES = ['gentle', 'balanced', 'challenge'];
const SEEDS = [1, 0xfeedc0de];
const BASE_MS = [8000, 10000, 12000, 15000];
const COURSES = ['bosque', 'islas', 'cascada'];
let fixtures = 0, constructions = 0;
function fixture() { assert.ok(++fixtures <= 1000, 'Fixture budget exceeded'); }
function seededRace(...args) {
  assert.ok(++constructions <= 1000, 'Race construction budget exceeded');
  return newRace(...args);
}
function question(level = 2, activeMs = 18000, changes = {}) {
  return {level, activeMs, firstResponseMs: 1000, timingProtocol: 1,
    done: true, answer: 6, attempts: [6], hint: false,
    timingInterrupted: false, ...changes};
}
const answered = (count = 8, level = 2) =>
  Array.from({length: count}, () => question(level));
const history = (trail, level, ms, count = 6, changes = {}) =>
  [{trail, questions: Array.from({length: count}, () => question(level, ms, changes))}];
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};

test('C11 NPC: 4 routes x 4 levels x 3 modes have attainable, non-guaranteed outcomes', () => {
  for (const trail of TRAILS) for (let level = 1; level <= 4; level++)
    for (const mode of MODES) for (const seed of SEEDS)
      for (const calibrated of [false, true]) for (const ratio of [.9, 1, 1.6]) {
        fixture();
        const base = BASE_MS[level - 1];
        const past = calibrated ? history(trail, level, base * 2) : [];
        const race = seededRace(past, trail, level, seed, mode);
        const before = JSON.stringify(race), expectedPace = base * (calibrated ? 2 : 1);
        assert.equal(race.referencePaceMs, expectedPace);
        assert.equal(race.paceSource, calibrated ? 'same-level' : 'initial-level');
        assert.equal(race.calibrationN, calibrated ? 6 : 0);
        const finish = race.targetMs * ratio;
        // Each completion is earned; this fixture models elapsed active game time.
        for (let done = 0; done <= 8; done++) {
          const elapsed = finish * done / 8;
          const stats = raceStats({race, questions: answered(done, level)}, elapsed);
          assert.equal(stats.progress, done / 8);
          assert.ok(stats.rank >= 1 && stats.rank <= 4);
          assert.ok(stats.bots.every(p => p >= 0 && p <= 1));
        }
        const final = raceStats({race, questions: answered(8, level)}, finish);
        if (ratio === .9) assert.equal(final.rank, 1, 'Adequate synthetic pace can win');
        if (ratio === 1) {
          if (mode === 'challenge') assert.ok(final.rank > 1, 'Challenge is not reference-pace victory');
          else assert.equal(final.rank, 1, 'Reference pace wins approachable modes');
        }
        if (ratio === 1.6) assert.equal(final.rank, 4, 'A slow finish is not gifted a victory');
        assert.equal(JSON.stringify(race), before, 'Responses never retune rivals');
      }
});

test('C11 NPC: schedules are fixed, strictly forward and replayable for all route-level modes', () => {
  for (let route = 0; route < TRAILS.length; route++) for (let level = 1; level <= 4; level++)
    for (let mode = 0; mode < MODES.length; mode++) {
      fixture();
      const seed = 101 + route * 31 + level * 7 + mode;
      const race = seededRace([], TRAILS[route], level, seed, MODES[mode]);
      assert.deepEqual(race, seededRace([], TRAILS[route], level, seed, MODES[mode]));
      const restored = JSON.parse(JSON.stringify(race)), before = JSON.stringify(race);
      race.finishMs.forEach((finish, rival) => {
        const cadence = race.cadence[rival];
        // Analytical lower bound of derivative wrt normalized race time.
        assert.ok(1 - Math.abs(cadence.launch) - Math.abs(cadence.swing) > .46);
        let previous = 0;
        for (let sample = 0; sample <= 16; sample++) {
          const elapsed = finish * sample / 16, p = rivalProgress(race, rival, elapsed);
          assert.ok(Number.isFinite(p) && p >= 0 && p <= 1 && p >= previous);
          assert.equal(p, rivalProgress(restored, rival, elapsed));
          assert.ok(['steady', 'surge', 'glide', 'finished'].includes(rivalEffort(race, rival, elapsed)));
          previous = p;
        }
        assert.equal(rivalProgress(race, rival, 0), 0);
        assert.equal(rivalProgress(race, rival, finish), 1);
      });
      const complete = {race, questions: answered()};
      assert.equal(raceStats(complete, Math.min(...race.finishMs)).rank, 1, 'Earliest exact tie shares first');
      assert.equal(raceStats(complete, Math.max(...race.finishMs) + 1).rank, 4);
      assert.equal(JSON.stringify(race), before);
    }
});

test('C11 NPC: errors and help remain visible without secretly changing opposition', () => {
  for (const trail of TRAILS) for (let level = 1; level <= 4; level++) for (const mode of MODES) {
    fixture();
    const race = seededRace([], trail, level, 41, mode), before = JSON.stringify(race);
    const perfect = {race, questions: answered(8, level)};
    const corrected = {race, questions: answered(8, level)};
    corrected.questions[0].attempts = [5, 6];
    const helped = {race, questions: answered(8, level)};
    helped.questions[0].hint = true;
    const time = race.targetMs;
    const a = raceStats(perfect, time), b = raceStats(corrected, time), c = raceStats(helped, time);
    assert.equal(a.points, 120); assert.equal(b.points, 115); assert.equal(c.points, 115);
    assert.deepEqual(a.bots, b.bots); assert.deepEqual(a.bots, c.bots);
    assert.equal(a.rank, b.rank); assert.equal(a.rank, c.rank);
    assert.equal(raceLevel(perfect), Math.min(4, level + 1));
    const sixInitial = {race, questions: answered(8, level)};
    sixInitial.questions.slice(0, 2).forEach(q => {q.attempts = [5, 6];});
    assert.equal(raceLevel(sixInitial), level);
    sixInitial.questions.slice(2, 4).forEach(q => {q.attempts = [5, 6];});
    assert.equal(raceLevel(sixInitial), Math.max(1, level - 1));
    assert.equal(JSON.stringify(race), before);
  }
});

test('C11 NPC: calibration respects eligibility, resolution time, fallback and limits', () => {
  const cases = [
    {name: 'four insufficient', past: history('multi', 2, 18000, 4), pace: 10000, source: 'initial-level', n: 0},
    {name: 'five enough', past: history('multi', 2, 18000, 5), pace: 18000, source: 'same-level', n: 5},
    {name: 'corrected resolution', past: history('multi', 2, 18000, 6, {attempts: [5, 6], firstResponseMs: 600}), pace: 18000, source: 'same-level', n: 6},
    {name: 'adjacent fallback', past: history('multi', 1, 15000, 5), pace: 18000, source: 'adjacent-level', n: 5},
    {name: 'four current plus five adjacent', past: [...history('multi', 2, 8000, 4), ...history('multi', 1, 15000, 5)], pace: 18000, source: 'adjacent-level', n: 5},
    {name: 'wrong final', past: history('multi', 2, 18000, 6, {attempts: [5]}), pace: 10000, source: 'initial-level', n: 0},
    {name: 'help excluded', past: history('multi', 2, 18000, 6, {hint: true}), pace: 10000, source: 'initial-level', n: 0},
    {name: 'interruption excluded', past: history('multi', 2, 18000, 6, {timingInterrupted: true}), pace: 10000, source: 'initial-level', n: 0},
    {name: 'timing protocol excluded', past: history('multi', 2, 18000, 6, {timingProtocol: 0}), pace: 10000, source: 'initial-level', n: 0},
    {name: 'under lower bound excluded', past: history('multi', 2, 499), pace: 10000, source: 'initial-level', n: 0},
    {name: 'above upper bound excluded', past: history('multi', 2, 120001), pace: 10000, source: 'initial-level', n: 0},
    {name: 'other route excluded', past: history('suma', 2, 18000), pace: 10000, source: 'initial-level', n: 0},
    {name: 'minimum target clamp', past: history('multi', 2, 500), pace: 1500, source: 'same-level', n: 6},
    {name: 'maximum target', past: history('multi', 2, 120000), pace: 120000, source: 'same-level', n: 6},
  ];
  for (const row of cases) {
    fixture();
    const race = seededRace(row.past, 'multi', 2, 19, 'balanced');
    assert.equal(race.referencePaceMs, row.pace, row.name);
    assert.equal(race.paceSource, row.source, row.name);
    assert.equal(race.calibrationN, row.n, row.name);
    assert.ok(race.targetMs >= 12000 && race.targetMs <= 960000);
  }
});

function bareCircuit(id) {
  return Object.assign(Object.create(CircuitView.prototype), {
    course: courseGeometry(id), roomScene: false, markerLayer: null,
    markerSeats: [], projectedMarkers: []
  });
}
function motionFixture(id) {
  const circuit = bareCircuit(id), props = {}, projected = [];
  const style = () => ({});
  const boats = Array.from({length: 4}, () => {
    const art = {style: style()};
    return {style: style(), dataset: {}, querySelector: selector => {
      assert.equal(selector, '.canoe-art'); return art;
    }};
  });
  const motion = Object.assign(Object.create(RiverMotion.prototype), {
    scene: {dataset: {}}, stage: {clientHeight: 250}, width: 350, boatWidth: 64,
    position: .25, velocity: .03, lastElapsed: 41900, flow: 0,
    boats, dots: Array.from({length: 4}, () => ({style: style()})),
    map: {clientHeight: 48}, mapWidth: 140,
    segment: {textContent: ''}, steps: {textContent: ''}, lastSteps: -1, lastSegment: null,
    pearls: Array.from({length: 8}, () => ({classList: {toggle() {}}})),
    wake: {style: {setProperty(name, value) {props[name] = value;}}},
    ribbon: {style: style()},
    circuit: {
      course: circuit.course,
      draw(progress, width, height, reduced) {
        circuit.projectedMarkers = [];
        return circuit.camera(progress, width, height, reduced);
      },
      project(progress, lane, camera, width, height, boatWidth) {
        const point = circuit.project(progress, lane, camera, width, height, boatWidth);
        projected[lane] = point; return point;
      }
    }
  });
  return {motion, props, projected};
}

test('C11 NPC: presentation, arrival and reduced motion preserve earned progress and results', () => {
  for (const id of COURSES) for (const reduced of [false, true]) for (const arriving of [false, true]) {
    fixture();
    const race = seededRace([], 'multi', 2, 7, 'balanced');
    const session = {race, questions: answered(4)}, stats = freeze(raceStats(session, 42000));
    const before = JSON.stringify({session, stats}), {motion, props, projected} = motionFixture(id);
    const visualRank = motion.draw(stats, 42000, reduced, arriving);
    assert.ok(motion.position >= .25 && motion.position <= stats.progress);
    assert.equal(projected[0].edge, '', 'Learner remains visible in its own camera');
    assert.ok(Number(props['--boat-speed']) >= 0 && Number(props['--boat-speed']) <= 1);
    assert.equal(visualRank, 1 + stats.bots.filter(p => p > motion.position).length);
    if (reduced) {
      assert.equal(motion.position, stats.progress); assert.equal(motion.velocity, 0);
      assert.equal(motion.scene.dataset.moving, 'false'); assert.equal(props['--boat-speed'], '0.000');
    } else {
      assert.ok(motion.position > .25 && motion.velocity > 0);
    }
    const paused = {position: motion.position, velocity: motion.velocity, flow: motion.flow};
    motion.draw(stats, 42000, reduced, arriving);
    assert.deepEqual({position: motion.position, velocity: motion.velocity, flow: motion.flow}, paused);
    assert.equal(JSON.stringify({session, stats}), before, 'Presentation cannot rewrite score or NPC schedule');
    const long = advanceBoat(.25, .03, .5, 2);
    let split = {position: .25, velocity: .03};
    for (let n = 0; n < 4; n++) split = advanceBoat(split.position, split.velocity, .5, .5);
    assert.ok(Math.abs(long.position - split.position) < 1e-12);
    assert.ok(Math.abs(long.velocity - split.velocity) < 1e-12);
    assert.deepEqual(advanceBoat(.25, 0, .25, 60), {position: .25, velocity: 0});
  }
});

test('C11 NPC: three course projections keep the learner visible and reduced camera fixed', () => {
  for (const id of COURSES) for (const size of [{w: 280, h: 180}, {w: 350, h: 250}, {w: 1100, h: 340}])
    for (const reduced of [false, true]) {
      fixture();
      const view = bareCircuit(id), fixed = [];
      for (const progress of [0, .5, 1]) {
        const source = coursePoint(id, progress, 0);
        const camera = view.camera(progress, size.w, size.h, reduced);
        const point = view.project(progress, 0, camera, size.w, size.h, 64);
        assert.equal(point.edge, '', JSON.stringify({id, size, reduced, progress}));
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.angle));
        assert.deepEqual(coursePoint(id, progress, 0), source);
        fixed.push([camera.x, camera.y, camera.scale, camera.angle]);
      }
      if (reduced) {assert.deepEqual(fixed[0], fixed[1]); assert.deepEqual(fixed[1], fixed[2]);}
    }
});

after(() => {
  assert.equal(fixtures, 716, 'Declared deterministic fixture count');
  assert.equal(constructions, 746, 'Declared newRace construction count');
});

