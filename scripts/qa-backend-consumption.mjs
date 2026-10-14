// Bounded, loopback-only measurements of the existing Node/SQLite receiver.
// This is not a Cloudflare benchmark. The client and server use separate processes.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, platform, release } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { openDatabase, issueAccess, receiver } from '../server/receiver.mjs';
import { newSession, recordAttempt, SCHEMA } from '../web/core.js';
import { readInvitation, exchangeClassroom, applyExchange } from '../web/classroom.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://127.0.0.1:8768';
// Deliberately public test-only strings. No production invitation is read.
const studentToken = 's'.repeat(64), teacherToken = 't'.repeat(64);
const room = 'cost-qa', profile = 'cost-student';
function session(id, minutes = 15) {
  const s = newSession('multi', 2, profile);
  s.id = id;
  s.startedAt = '2026-10-14T00:00:00.000Z';
  s.completedAt = new Date(Date.parse(s.startedAt) + minutes * 60000).toISOString();
  s.index = 7;
  for (const q of s.questions) {
    q.activeMs = minutes * 60000 / 8;
    recordAttempt(q, q.answer);
    q.done = true;
  }
  return s;
}

if (process.argv[2] === '--child') {
  assert(process.send, 'Child must be started through fork');
  const db = openDatabase(process.argv[3]);
  db.prepare('INSERT INTO rooms(id,name) VALUES(?,?)').run(room, 'Synthetic cost QA');
  issueAccess(db, room, 'student', studentToken);
  issueAccess(db, room, 'teacher', teacherToken);
  const server = receiver(db, { origins: [origin] });
  let baseline, beforeCount, count = 0;
  server.on('request', () => { count++; });
  process.on('message', ({ id, type, data }) => {
    try {
      let result;
      if (type === 'begin') {
        beforeCount = count;
        baseline = process.cpuUsage();
        result = {};
      } else if (type === 'end') {
        const c = process.cpuUsage(baseline);
        result = { requests: count - beforeCount, cpuUserUs: c.user, cpuSystemUs: c.system, cpuMs: (c.user + c.system) / 1000 };
      } else if (type === 'seed') {
        assert(Number.isInteger(data.count) && data.count >= 0 && data.count <= 1500);
        // Only the fresh private QA database is opened by this process.
        db.exec('DELETE FROM sessions');
        db.exec('BEGIN');
        const insert = db.prepare('INSERT INTO sessions VALUES(?,?,?,?)');
        for (let i = 0; i < data.count; i++) {
          const s = session(`seed-${i}`);
          insert.run(room, profile, s.id, JSON.stringify(s));
        }
        db.exec('COMMIT');
        result = { sessions: db.prepare('SELECT count(*) AS n FROM sessions').get().n };
      } else if (type === 'close') {
        server.close(() => { db.close(); process.send({ id, result: { closed: true } }); process.disconnect(); });
        return;
      } else throw Error('Unknown QA command');
      process.send({ id, result });
    } catch (e) { process.send({ id, error: e.message }); }
  });
  server.listen(0, '127.0.0.1', () => process.send({ ready: true, endpoint: `http://127.0.0.1:${server.address().port}` }));
} else {
  const started = new Date();
  const outDir = join(root, 'qa-private', 'consumo-hosting', `local-${started.toISOString().replace(/[:.]/g, '-')}`);
  await mkdir(outDir, { recursive: true });
  const child = fork(fileURLToPath(import.meta.url), ['--child', join(outDir, 'synthetic.sqlite')], { cwd: root, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
  const pending = new Map();
  let seq = 0, totalRequests = 0;
  const deadline = setTimeout(() => { child.kill(); process.exitCode = 1; }, 180000);
  const ready = new Promise((resolveReady, reject) => {
    child.once('error', reject);
    child.on('message', m => {
      if (m.ready) return resolveReady(m.endpoint);
      const p = pending.get(m.id);
      if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(Error(m.error)) : p.resolve(m.result); }
    });
    child.on('exit', code => {
      for (const p of pending.values()) { clearTimeout(p.timer); p.reject(Error(`Server exited: ${code}`)); }
      pending.clear();
    });
  });
  const rpc = (type, data) => new Promise((resolveRpc, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('QA IPC timeout')); }, 15000);
    pending.set(id, { resolve: resolveRpc, reject, timer });
    child.send({ id, type, data });
  });
  try {
    const endpoint = await ready;
    assert.equal(new URL(endpoint).hostname, '127.0.0.1');
    const link = role => readInvitation({ schema: 'sendero.invitation.v1', classId: room, role, token: role === 'teacher' ? teacherToken : studentToken, endpoint }, role);
    async function localFetch(url, options = {}) {
      assert.equal(new URL(url).origin, endpoint, 'Network restricted to this loopback receiver');
      assert(++totalRequests <= 10000, 'Local request budget exhausted');
      return fetch(url, { ...options, headers: { ...options.headers, Origin: origin }, signal: AbortSignal.timeout(10000) });
    }
    const scenarios = [];
    for (const [name, minutes, role] of [
      ['offline-or-unlinked-15min', 15, null],
      ['student-5min', 5, 'student'],
      ['student-15min', 15, 'student'],
      ['student-60min', 60, 'student'],
      ['teacher-dashboard-15min', 15, 'teacher'],
    ]) {
      const state = { profile, sessions: [], teacher: [], classroom: role ? link(role) : undefined };
      const requests = [];
      const counted = async (url, options) => {
        requests.push(`${options.method} ${new URL(url).pathname}`);
        return localFetch(url, options);
      };
      // Replay actual exchangeClassroom code; time is simulated, no UI timer is accelerated.
      await rpc('begin');
      applyExchange(state, await exchangeClassroom(state, counted));
      for (let tick = 1; tick <= minutes; tick++) applyExchange(state, await exchangeClassroom(state, counted));
      if (role !== 'teacher') {
        const s = session(name, minutes); state.sessions.push(s);
        applyExchange(state, await exchangeClassroom(state, counted));
        if (role) assert(state.classroom.received.includes(s.id));
      }
      const observed = await rpc('end');
      assert.equal(observed.requests, requests.length);
      const expected = !role ? 0 : role === 'teacher' ? 5 * (minutes + 1) : 2 * minutes + 5;
      assert.equal(requests.length, expected);
      scenarios.push({ name, simulatedMinutes: minutes, apiRequestsObserved: requests.length, byEndpoint: Object.fromEntries([...new Set(requests)].map(k => [k, requests.filter(x => x === k).length])), httpRequestsWithOnePreflightPerApiRequest: requests.length * 2, corsUpperScenarioNotBrowserMeasurement: true });
    }
    const benchmarks = [];
    const headers = role => ({ Authorization: `Bearer ${role === 'teacher' ? teacherToken : studentToken}` });
    let reportId = 0;
    async function request(path, options = {}) {
      const t = performance.now();
      const response = await localFetch(endpoint + path, options);
      const body = await response.text();
      assert(response.ok, `${path}: HTTP ${response.status}: ${body.slice(0, 100)}`);
      return { wallMs: performance.now() - t, bytes: Buffer.byteLength(body) };
    }
    async function benchmark(name, n, invoke, metadata = {}) {
      for (let i = 0; i < 20; i++) await invoke();
      const batches = [];
      for (let repeat = 0; repeat < 3; repeat++) {
        const latency = []; let bytes = 0;
        await rpc('begin');
        for (let i = 0; i < n; i++) { const r = await invoke(); latency.push(r.wallMs); bytes += r.bytes; }
        const result = await rpc('end');
        assert.equal(result.requests, n);
        latency.sort((a, b) => a - b);
        batches.push({ ...result, meanCpuMsPerRequest: result.cpuMs / n, responseBodyBytes: bytes, meanResponseBodyBytes: bytes / n, medianWallMs: latency[Math.floor(n * .5)], p95WallMs: latency[Math.min(n - 1, Math.ceil(n * .95) - 1)] });
      }
      const entry = { name, ...metadata, requestsPerBatch: n, batches, meanCpuMsPerRequest: batches.reduce((s, b) => s + b.cpuMs, 0) / (3 * n) };
      benchmarks.push(entry);
      console.log(`${name}: ${entry.meanCpuMsPerRequest.toFixed(4)} local server CPU ms/request`);
    }
    await rpc('seed', { count: 0 });
    await benchmark('GET /tasks', 400, () => request('/tasks', { headers: headers('student') }));
    await benchmark('GET /capabilities', 400, () => request('/capabilities', { headers: headers('student') }));
    await benchmark('OPTIONS /reports', 400, () => request('/reports', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } }));
    await benchmark('POST /reports one new 8-question session', 200, () => request('/reports', { method: 'POST', headers: { ...headers('student'), 'Content-Type': 'application/json' }, body: JSON.stringify({ schema: SCHEMA, profile, sessions: [session(`cpu-${++reportId}`)] }) }));
    for (const count of [1, 300, 1500]) {
      await rpc('seed', { count });
      await benchmark(`GET /reports history=${count}`, count === 1500 ? 20 : 60, () => request('/reports', { headers: headers('teacher') }), { storedSessions: count });
    }
    const inputs = {};
    for (const path of ['server/receiver.mjs', 'web/core.js', 'web/classroom.js', 'web/app.js', 'scripts/qa-backend-consumption.mjs']) inputs[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
    const report = {
      schema: 'sendero.local-consumption.v1', startedAt: started.toISOString(), endedAt: new Date().toISOString(), status: 'PASS',
      environment: { node: process.version, os: `${platform()} ${release()}`, cpuModel: cpus()[0]?.model, logicalCpus: cpus().length },
      scope: 'Existing Node/SQLite receiver, synthetic data, dedicated child process, disk-backed fresh WAL database, sequential HTTP, warmup excluded',
      externalRequests: 0, cloudflareResourcesUsed: false, totalLocalHttpRequests: totalRequests,
      cpuMethod: 'Server child process.cpuUsage differences over three batches; client CPU excluded; server includes HTTP, SQLite, GC and instrumentation; batch means are not per-request CPU percentiles',
      scenariosMethod: 'Production exchangeClassroom/applyExchange called at entry, each simulated minute including final minute, then completion for student; no retries/manual sync, project uploads or backups. UI timing and CORS preflight not measured in a browser.',
      limitations: ['Not Workers or D1; local CPU cannot certify Cloudflare 10 ms compliance.', 'No cold-start, concurrent-user, WebRTC, large backup or school workload capacity test.', 'OPTIONS upper scenario assumes one preflight for every application request; actual browser caching may reduce it.', 'D1 scanned/written rows and remote CPU remain unmeasured.'],
      inputSha256: inputs, scenarios, benchmarks,
    };
    const output = join(outDir, 'measurement.json');
    await writeFile(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, output, totalLocalHttpRequests: totalRequests, scenarios }, null, 2));
  } finally {
    try { await rpc('close'); } finally { clearTimeout(deadline); child.kill(); }
  }
}
