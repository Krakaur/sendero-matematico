import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA, newAssignedSession, recordAttempt, recordReasoningSupport,
  advanceAssignedSession, validateReport,
} from '../web/core.js';
import {TASK_SCHEMA} from '../web/assignments.js';
import {REASONING_SUPPORT_FAMILIES} from '../web/reasoning-support.js';
import {
  teachingInsights, teachingInsightsHTML, teachingEvidenceRows, teachingEvidenceCSV,
} from '../web/teaching-insights.js';

// Candidate authored by the teacher reviewer. Execution belongs to the
// coordinated C10 run; no production artifact is changed by this file.
const profiles = ['000951', '000952', '000953', '000954'];
const numericTask = {
  schema: TASK_SCHEMA, classId: 'c10-teacher-review', id: 'legacy-numeric',
  version: 1, title: 'Tabla del 2: evidencia histórica', trail: 'multi',
  contentId: 'multiply-fixed-table', contentVersion: 1,
  parameters: {table: 2}, completionRule: {kind: 'answered_items', count: 8},
  recipientProfileIds: profiles, assignedAt: '2026-10-21T00:00:00Z',
};
const report = s => ({schema: SCHEMA, profile: s.profile, sessions: [s]});
const stateFor = (task, s) => ({
  classroom: {tasks: [task]}, teacher: [s], teacherConfirmations: {},
});

function closedNumeric(protocol) {
  const s = newAssignedSession(numericTask, profiles[protocol - 1]);
  for (const q of s.questions) {
    recordAttempt(q, q.answer);
    advanceAssignedSession(s);
  }
  if (protocol === 1) {
    s.taskProtocol = 1;
    delete s.completionAction;
  }
  s.questions.forEach((q, index) => {
    // These extras are admissible legacy bytes, not an authoritative stimulus.
    q.prompt = 'LEGACY_EXTRA_PROMPT_' + protocol + '_' + (index + 1);
    q.labels = Array.from({length: q.answer + 1},
      (_, value) => 'LEGACY_EXTRA_LABEL_' + protocol + '_' + (index + 1) + '_' + value);
  });
  return s;
}

// A CSV field may contain commas, escaped quotes and line breaks. Checking only
// the whole CSV string would wrongly reject the deliberately preserved payload.
function csvRecords(text) {
  const rows = [], row = [];
  let cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if (c === '\r' && text[i + 1] === '\n' && !quoted) {
      row.push(cell); rows.push(row.splice(0)); cell = ''; i++;
    } else cell += c;
  }
  row.push(cell); rows.push(row);
  const [headers, ...body] = rows;
  return body.map(values => Object.fromEntries(headers.map((key, i) => [key, values[i]])));
}

for (const protocol of [1, 2]) {
  test('C10 legacy ' + protocol + ': canonical numeric evidence and lossless raw extras', () => {
    const s = closedNumeric(protocol), state = stateFor(numericTask, s);
    const sourceBytes = JSON.stringify(state);
    assert.doesNotThrow(() => validateReport(report(s)),
      'Legacy admissibility is preserved; presentation must not rewrite or reject its extras.');
    const summary = teachingInsights(state), group = summary.tasks[0].groups[0];
    assert.equal(summary.totals.matchedClosures, 1);
    assert.equal(group.protocol, protocol);
    assert.equal(group.metrics.answered, 8);
    assert.deepEqual(group.items.map(item => item.prompt),
      ['2 × 1', '2 × 2', '2 × 3', '2 × 4', '2 × 5', '2 × 6', '2 × 7', '2 × 8']);
    const html = teachingInsightsHTML(summary);
    assert.ok(html.includes('2 × 1'));
    assert.ok(html.includes('2 × 8'));
    assert.doesNotMatch(html, /LEGACY_EXTRA_(?:PROMPT|LABEL)/);

    const structured = teachingEvidenceRows(summary);
    const parsed = csvRecords(teachingEvidenceCSV(summary));
    for (const rows of [structured, parsed]) {
      const questions = rows.filter(r => r.row_type === 'question');
      const events = rows.filter(r => r.row_type === 'question-event');
      assert.equal(questions.length, 8);
      assert.equal(events.length, 8);
      questions.forEach((row, index) => {
        assert.equal(row.stimulus, '2 × ' + (index + 1));
        const raw = JSON.parse(row.payload_json);
        assert.equal(raw.prompt, s.questions[index].prompt);
        assert.deepEqual(raw.labels, s.questions[index].labels);
        const {events: ignoredEvents, reflection: ignoredReflection, ...originalMetadata} =
          s.questions[index];
        assert.deepEqual(raw, JSON.parse(JSON.stringify(originalMetadata)),
          'The raw question metadata remains available for exact historical reconstruction.');
      });
      events.forEach((row, index) => {
        assert.equal(row.stimulus, '2 × ' + (index + 1));
        assert.equal(String(row.choice), String(2 * (index + 1)));
        assert.equal(String(row.reason), String(2 * (index + 1)));
        assert.equal(row.unit, 'correct');
      });
      for (const row of rows) {
        for (const key of ['stimulus', 'choice', 'reason']) {
          assert.doesNotMatch(String(row[key] ?? ''), /LEGACY_EXTRA_(?:PROMPT|LABEL)/,
            'Semantic columns must not promote unverified legacy extras.');
        }
      }
    }
    assert.equal(JSON.stringify(state), sourceBytes,
      'Validation, summaries, HTML and exports leave historical bytes unchanged.');
  });
}

function supportTask() {
  const family = REASONING_SUPPORT_FAMILIES.find(f => f.id === 'comparacion_inversa');
  assert.ok(family, 'The fixture names a specific supported family.');
  return {
    schema: TASK_SCHEMA, classId: 'c10-teacher-review', id: 'support-only',
    version: 1, title: 'Apoyo solicitado: condición de respuesta', trail: 'razonar',
    contentId: 'reasoning-supported-pack', contentVersion: 1,
    parameters: {family: family.id, level: family.level, variant: 1},
    completionRule: {kind: 'answered_items', count: 4},
    recipientProfileIds: profiles, assignedAt: '2026-10-21T00:00:00Z',
  };
}

for (const kind of ['scaffold', 'feedback']) {
  test('C10 support only ' + kind + ': teacher suggestion and denominators preserve assistance', () => {
    const task = supportTask(), s = newAssignedSession(task, profiles[2]);
    for (const q of s.questions) {
      if (kind === 'feedback') recordAttempt(q, q.options.find(value => value !== q.answer));
      assert.equal(recordReasoningSupport(q, kind), true);
      recordAttempt(q, q.answer);
      advanceAssignedSession(s);
    }
    assert.doesNotThrow(() => validateReport(report(s)));
    const state = stateFor(task, s), bytes = JSON.stringify(state);
    const summary = teachingInsights(state), item = summary.tasks[0], group = item.groups[0];
    const m = group.metrics;
    assert.equal(group.protocol, 6);
    assert.equal(m.answered, 4);
    assert.equal(m.hints.numerator, 0);
    assert.equal(m.solutions.numerator, 0);
    assert.equal(m.first.numerator, kind === 'scaffold' ? 4 : 0);
    assert.equal(m.firstWithoutHelp.numerator, 0);
    assert.equal(m.firstWithoutHelp.denominator, 4);
    assert.equal(m.final.numerator, 4);
    assert.equal(m.scaffolds.numerator, kind === 'scaffold' ? 4 : 0);
    assert.equal(m.scaffolds.denominator, 4);
    assert.equal(m.feedbackItems.numerator, kind === 'feedback' ? 4 : 0);
    assert.equal(m.feedbackItems.denominator, 4);
    assert.equal(m.feedbackRequests.numerator, kind === 'feedback' ? 4 : 0);
    assert.ok(item.suggestions.some(suggestion => suggestion.code === 'inspect-support'
      && suggestion.protocol === 6 && suggestion.source === 'unverified'));
    assert.equal(item.coverage.visible, 1);
    assert.equal(item.coverage.denominator, 4);
    assert.equal(group.profileCount, 1);
    assert.ok(!Object.hasOwn(m, 'mastery'));
    const html = teachingInsightsHTML(summary);
    assert.match(html, /Primera respuesta correcta sin apoyo previo/);
    assert.match(html, /no clasificar el uso de ayuda como déficit/);
    assert.equal(JSON.stringify(state), bytes);
  });
}

