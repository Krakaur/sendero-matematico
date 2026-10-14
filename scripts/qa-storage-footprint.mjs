// Local-only storage sizing. Synthetic records, no HTTP, no account credentials.
import assert from 'node:assert/strict';
import { mkdir, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../server/receiver.mjs';
import { newSession, recordAttempt, validateReport, SCHEMA } from '../web/core.js';
import { newWorkshop, currentMission, solvedModel, applyWorkshopAction, validWorkshop } from '../web/workshop.js';
import { encryptBackup } from '../web/backup.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const profile = { id: 'synthetic-storage-profile', name: 'QA storage', role: 'student' };
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.isFile()) files.push({ path: target.slice(root.length + 1), bytes: (await stat(target)).size });
  }
}
await walk(join(root, 'web'));
const sessions = [];
for (const trail of ['suma', 'resta', 'multi', 'tablas20']) for (let level = 1; level <= 4; level++) {
  const s = newSession(trail, level, profile.id);
  for (const q of s.questions) { q.activeMs = 10000; recordAttempt(q, q.answer); q.done = true; }
  s.completedAt = new Date().toISOString(); s.index = 7;
  validateReport({ schema: SCHEMA, profile: profile.id, sessions: [s] });
  sessions.push(s);
}
const projects = [];
for (let i = 0; i < 16; i++) {
  const s = newWorkshop(i % 4 + 1, 134 + i);
  let steps = 0;
  while (!s.completedAt) {
    assert(++steps <= 16);
    const m = currentMission(s);
    s.records[s.index].model = solvedModel(m);
    applyWorkshopAction(s, { type: 'check' });
    applyWorkshopAction(s, { type: 'reason', value: m.reason });
    applyWorkshopAction(s, { type: 'next' });
  }
  assert(validWorkshop(s)); projects.push(s);
}
const distribution = list => {
  const sizes = list.map(bytes);
  return { samples: sizes.length, minBytes: Math.min(...sizes), meanBytes: sizes.reduce((a, b) => a + b, 0) / sizes.length, maxBytes: Math.max(...sizes) };
};
const db = openDatabase(':memory:');
const dbBytes = () => Number(db.prepare('PRAGMA page_count').get().page_count) * Number(db.prepare('PRAGMA page_size').get().page_size);
const baselineBytes = dbBytes();
const insert = db.prepare('INSERT INTO sessions VALUES(?,?,?,?)');
const database = [];
let inserted = 0;
for (const target of [100, 1000, 10000]) {
  db.exec('BEGIN');
  for (; inserted < target; inserted++) {
    const s = { ...sessions[inserted % sessions.length], id: randomUUID() };
    insert.run('synthetic-room', profile.id, s.id, JSON.stringify(s));
  }
  db.exec('COMMIT');
  const storedBytes = dbBytes();
  database.push({ sessions: target, sqliteAllocatedBytes: storedBytes, incrementalBytes: storedBytes - baselineBytes, incrementalBytesPerSession: (storedBytes - baselineBytes) / target });
}
db.close();
const backups = [];
for (const count of [100, 500, 1000]) {
  const state = { profile: profile.id, sessions: Array.from({ length: count }, (_, i) => ({ ...sessions[i % sessions.length], id: randomUUID() })), teacher: [], adaptive: {}, current: null, workshopHistory: [] };
  const envelope = await encryptBackup(profile, state, 'synthetic-storage-password');
  backups.push({ sessions: count, plaintextSnapshotBytes: bytes({ profile, state }), encryptedEnvelopeBytes: bytes(envelope), exceedsD1SingleRow2MB: bytes(envelope) > 2000000 });
}
const gitTree = execFileSync('git', ['ls-tree', '-r', '-l', 'origin/gh-pages'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const gitSizes = gitTree.map(line => Number(line.match(/^\d+ blob [0-9a-f]+\s+(\d+)\t/)?.[1]));
assert(gitSizes.every(Number.isFinite));
const sourcePaths = ['server/receiver.mjs', 'web/core.js', 'web/backup.js', 'web/workshop.js', 'scripts/qa-storage-footprint.mjs'];
const inputSha256 = {};
for (const path of sourcePaths) inputSha256[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
const result = {
  schema: 'sendero.storage-footprint.v1', measuredAt: new Date().toISOString(), node: process.version, externalRequests: 0, status: 'PASS',
  workingWeb: { files: files.length, bytes: files.reduce((s, f) => s + f.bytes, 0), largestFiles: files.sort((a, b) => b.bytes - a.bytes).slice(0, 8) },
  cachedGhPagesRef: { revision: execFileSync('git', ['rev-parse', 'origin/gh-pages'], { cwd: root, encoding: 'utf8' }).trim(), files: gitSizes.length, bytes: gitSizes.reduce((a, b) => a + b, 0), liveDeploymentRechecked: false },
  arithmeticSession8Answers: distribution(sessions), workshopRun8Activities: distribution(projects),
  sqliteBaselineBytes: baselineBytes, sqliteSizing: database, encryptedBackups: backups, inputSha256,
  limitations: ['Synthetic successful arithmetic responses and eight-activity workshop runs; errors, notes, reasoning-bank items and future fields can enlarge records.', 'SQLite page sizing includes the current schema and indexes, not measured D1 billing, WAL files, replicas or remote backup storage.', 'Backup fixtures contain arithmetic history only. D1 row limit requires splitting or limiting larger envelopes.', 'MB estimates use decimal bytes; no hosting changes or remote resource use.'],
};
const outDir = join(root, 'qa-private', 'consumo-hosting', `storage-${result.measuredAt.replace(/[:.]/g, '-')}`);
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'measurement.json'), JSON.stringify(result, null, 2) + '\n');
await writeFile(join(outDir, 'qa-storage-footprint.source.mjs'), await readFile(fileURLToPath(import.meta.url)));
console.log(JSON.stringify({ output: join(outDir, 'measurement.json'), ...result }, null, 2));
