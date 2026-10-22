import { SCHEMA, TRAILS, validateReport } from "./core.js";
import { sessionKey } from "./assignments.js";
import { validWorkshop } from "./workshop.js";
import { validateMultiplayerRecord } from "./multiplayer-records.js";
import { normalizeEnrollment } from "./enrollment.js";

export const RECONCILIATION_UNKNOWN = "__unknown__";
export const RECONCILIATION_STATUS_LABELS = Object.freeze({ included: "Incluida",
  duplicate: "Copia equivalente omitida", incomplete: "Sin cierre local",
  invalid: "Formato no admitido", conflicting: "Identidad con contenidos discrepantes" });
const UNKNOWN = RECONCILIATION_UNKNOWN;
const dimensions = ["group", "student", "game", "content", "source"];
const filterDimensions = ["group", "student", "game", "content"];
const identity = (value, length = 80) => typeof value === "string"
  && value.length <= length && /^[a-zA-Z0-9-]+$/.test(value);
const date = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const sourceLabels = {
  "server-read": "Consulta del servidor con fecha declarada",
  "server-observed": "Consulta del servidor con fecha observada por el cliente",
  "server-acknowledgement": "Acuse de recepción del servidor",
  "manual-import": "Importación manual documentada",
  "local-store": "Registro disponible en este dispositivo",
  [UNKNOWN]: "Sin clasificar",
};
const gameLabels = {
  "assigned-construction": "Taller asignado", assigned: "Tarea asignada", race: "Carrera individual con rivales digitales",
  "free-write": "Práctica libre · escritura", "free-choice": "Práctica libre · opciones",
  construction: "Construcción individual", "multiplayer-race": "Participación competitiva",
  "multiplayer-coop": "Participación cooperativa", [UNKNOWN]: "Sin clasificar",
};
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
};
const kinds = (records) => Object.fromEntries(["session", "project", "participation"]
  .map((kind) => [kind, records.filter((record) => record.kind === kind).length]));

function entriesOf(state, teacher) {
  const entries = [];
  const addArray = (value, path, kind, profile = null, classId = null) => {
    if (value === undefined || value === null) return;
    if (!Array.isArray(value)) {
      entries.push({ record: value, path, kind, profile, classId, malformed: "El contenedor no es una lista." });
      return;
    }
    value.forEach((record, index) => entries.push({ record, path: `${path}[${index}]`, kind, profile, classId }));
  };
  addArray(teacher ? state.teacher : state.sessions, teacher ? "teacher" : "sessions", "session");
  if (teacher) {
    if (state.teacherProjects != null && !Array.isArray(state.teacherProjects)) {
      entries.push({ record: state.teacherProjects, path: "teacherProjects", kind: "project", malformed: "El contenedor de proyectos no es una lista." });
    } else (state.teacherProjects || []).forEach((group, index) => {
      if (!object(group) || !Array.isArray(group.projects)) {
        entries.push({ record: group, path: `teacherProjects[${index}]`, kind: "project", malformed: "Falta la lista de construcciones del perfil." });
      } else addArray(group.projects, `teacherProjects[${index}].projects`, "project", group.profile, group.classId);
    });
  } else addArray(state.workshopHistory, "workshopHistory", "project", state.profile);
  addArray(teacher ? state.teacherMultiplayer : state.multiplayerHistory,
    teacher ? "teacherMultiplayer" : "multiplayerHistory", "participation");
  return entries;
}

function contextOf(state, teacher, entry, profile) {
  const record = entry.record;
  const declared = [record.assignment?.classId, record.classId, entry.classId].filter((value) => value != null);
  if (declared.some((value) => !identity(value))) throw Error("Identificador de aula no válido.");
  const proofs = teacher ? state.teacherConfirmations : state.classroom?.confirmations;
  const proof = entry.kind === "session" ? proofs?.[sessionKey({ ...record, profile })] : null;
  const allowed = teacher ? ["server-read", "client-observed-server-read", "manual-file"] : ["server-acknowledgement"];
  const proofValid = proof && proof.profile === profile && identity(proof.classId)
    && allowed.includes(proof.source) && date(teacher ? proof.confirmedAt : proof.receivedAt);
  if (proofValid) declared.push(proof.classId);
  if (new Set(declared).size > 1) throw Error("El aula del registro y la evidencia de recepción no coinciden.");
  const classId = declared[0] || null;
  const key = JSON.stringify([classId, profile, entry.kind, record.id]);
  // A historical room is never inferred from the room currently linked to the device.
  const source = proofValid
    ? proof.source === "client-observed-server-read" ? "server-observed"
      : proof.source === "manual-file" ? "manual-import" : proof.source
    : teacher ? UNKNOWN : "local-store";
  return { classId, key, provenance: { source, label: sourceLabels[source],
    at: proofValid ? teacher ? proof.confirmedAt : proof.receivedAt : null,
    scopeKnown: classId !== null } };
}

function validate(entry, profile) {
  const record = entry.record;
  if (entry.kind === "session") validateReport({ schema: SCHEMA, profile, sessions: [record] });
  else if (entry.kind === "project") {
    if (record.profile !== undefined && record.profile !== profile) throw Error("El perfil no coincide con la construcción.");
    if (!validWorkshop(record)) throw Error("Construcción no admitida por esta versión.");
  } else validateMultiplayerRecord(record);
}

function describe(entry, context, profile) {
  const record = entry.record, enrollment = normalizeEnrollment(record.enrollment);
  const groupKnown = [enrollment.school, enrollment.grade, enrollment.group].every(Boolean);
  const group = groupKnown ? JSON.stringify([context.classId, enrollment.school, enrollment.grade, enrollment.group]) : UNKNOWN;
  const student = JSON.stringify([context.classId, profile]);
  const game = entry.kind === "project" ? "construction" : entry.kind === "participation"
    ? `multiplayer-${record.mode}` : record.taskProtocol===5 ? "assigned-construction" : record.assignment ? "assigned" : record.race ? "race"
      : record.responseMode === "write" ? "free-write" : "free-choice";
  const content = Object.hasOwn(TRAILS, record.trail) ? record.trail : UNKNOWN;
  const project = entry.kind === "project" ? record : entry.kind === "participation" ? record.project : null;
  const contentMemberships = record.taskProtocol===5 ? [`mission:${record.assignment.parameters.project}`] : project ? [...new Set(project.records.map((item) => `mission:${item.kind}`))]
    : [content];
  const levels = record.taskProtocol===5 ? [record.level] : [...new Set(project ? [project.level] : record.questions.map((question) => question.level))];
  return { key: context.key, kind: entry.kind, classId: context.classId, profile, id: record.id,
    sourceRecord: structuredClone(record), enrollment, provenance: context.provenance,
    dimensions: { group, student, game, content, source: context.provenance.source },
    labels: {
      group: groupKnown ? `${enrollment.school} · ${enrollment.grade} · ${enrollment.group} · ${context.classId || "aula desconocida"}` : "Sin clasificar",
      student: `${profile} · ${context.classId || "aula desconocida"}`,
      game: gameLabels[game] || "Sin clasificar", content: content === UNKNOWN ? "Sin clasificar" : TRAILS[content].name,
      source: context.provenance.label,
    }, contentMemberships, levels,
  };
}

function partition(records, dimension, universe = records) {
  const labels = new Map([[UNKNOWN, "Sin clasificar"]]);
  for (const record of universe) labels.set(record.dimensions[dimension], record.labels[dimension]);
  const buckets = new Map([...labels].map(([value, label]) => [value, { value, label, count: 0,
    denominator: records.length, profileCount: 0, keys: [], profiles: new Set() }]));
  for (const record of records) {
    const bucket = buckets.get(record.dimensions[dimension]);
    bucket.count++; bucket.keys.push(record.key); bucket.profiles.add(record.dimensions.student);
  }
  return [...buckets.values()].map(({ profiles, ...bucket }) => ({ ...bucket, profileCount: profiles.size }))
    .sort((a, b) => a.label.localeCompare(b.label, "es") || a.value.localeCompare(b.value));
}

function membership(records, field, label) {
  const buckets = new Map();
  for (const record of records) for (const value of new Set(record[field]?.length ? record[field] : [UNKNOWN])) {
    if (!buckets.has(value)) buckets.set(value, { value, label: value === UNKNOWN ? "Sin clasificar" : label(value), keys: [] });
    buckets.get(value).keys.push(record.key);
  }
  const rows = [...buckets.values()].map((bucket) => ({ ...bucket, count: bucket.keys.length, denominator: records.length }));
  const count = rows.reduce((sum, bucket) => sum + bucket.count, 0);
  return { rows, memberships: count, uniqueClosures: records.length, overlapMemberships: count - records.length,
    unit: "pertenencias de cierres; no partición aditiva" };
}

function evidenceUnits(records) {
  const result = { sessionQuestions: 0, participationQuestions: 0, constructionMissions: 0,
    cooperativeMissions: 0, constructionChecks: 0, cooperativeChecks: 0, assignedWorkshopMissions: 0, assignedInitialChecks: 0, assignedProbeChecks: 0, assignedExplanationChoices: 0 };
  for (const { kind, sourceRecord: record } of records) {
    if (kind === "session" && record.taskProtocol===5) {result.assignedWorkshopMissions++;result.assignedInitialChecks+=record.workshop.initial.checks.length;result.assignedProbeChecks+=record.workshop.probe.checks.length;result.assignedExplanationChoices+=record.workshop.explanation.attempts.length;}
    else if (kind === "session") result.sessionQuestions += record.questions.length;
    else if (kind === "participation" && !record.project) result.participationQuestions += record.questions.length;
    else {
      const project = kind === "project" ? record : record.project;
      const prefix = kind === "project" ? "construction" : "cooperative";
      result[`${prefix}Missions`] += project.records.length;
      result[`${prefix}Checks`] += project.records.reduce((sum, item) => sum + item.checks.length + (item.verification?.checks.length || 0), 0);
    }
  }
  return result;
}

// Pure calculation: no state mutation, storage, network, timers, inferred roster or rates.
export function summarizeReconciliation(state, teacher = false, filters = {}) {
  if (!object(state) || !object(filters) || typeof teacher !== "boolean") throw Error("Contexto de conciliación no válido.");
  const selected = Object.fromEntries(filterDimensions.map((key) => [key, filters[key] ?? ""]));
  if (Object.values(selected).some((value) => typeof value !== "string")) throw Error("Filtro de conciliación no válido.");
  const ledger = [], groups = new Map();
  const entries = entriesOf(state, teacher);
  entries.forEach((entry, index) => {
    const record = entry.record;
    const profile = entry.kind === "project" ? entry.profile : record?.profile;
    const row = { index, path: entry.path, kind: entry.kind, key: null, classId: null,
      profile: typeof profile === "string" ? profile : null, id: typeof record?.id === "string" ? record.id : null,
      originalTrail: typeof record?.trail === "string" ? record.trail : null,
      status: "invalid", reason: "", visible: false };
    ledger.push(row);
    let context, payload;
    try {
      if (entry.malformed) throw Error(entry.malformed);
      if (!object(record) || !identity(record.id) || !identity(profile, 60)) throw Error("Falta una identidad de registro admisible.");
      context = contextOf(state, teacher, entry, profile);
      row.key = context.key; row.classId = context.classId;
      payload = JSON.stringify(canonical(record));
      if (record.completedAt == null || record.completedAt === "") {
        row.status = "incomplete"; row.reason = "No consta cierre local; no se interpreta como fallo del alumno.";
      } else {
        if (!date(record.completedAt)) throw Error("Fecha de cierre no válida.");
        validate(entry, profile);
        row.status = "included"; row.reason = "Cierre admisible según el formato de esta versión.";
      }
    } catch (error) {
      row.status = "invalid"; row.reason = `Formato o contenido no admitido por esta versión: ${error.message}`;
    }
    if (context && payload !== undefined) {
      if (!groups.has(context.key)) groups.set(context.key, []);
      groups.get(context.key).push({ entry, row, context, profile, payload });
    }
  });
  const allRecords = [];
  for (const group of groups.values()) {
    if (new Set(group.map((item) => item.payload)).size > 1) {
      for (const { row } of group) {
        row.status = "conflicting"; row.reason = "Una misma identidad contextual tiene contenidos distintos; se excluyen todas sus variantes.";
      }
    } else if (group[0].row.status === "included") {
      const first = group[0];
      try {
        const described = describe(first.entry, first.context, first.profile);
        allRecords.push(described);
        for (const { row } of group.slice(1)) {
          row.status = "duplicate"; row.reason = "Copia equivalente omitida según la identidad y el contenido disponibles.";
          row.canonicalIndex = first.row.index;
        }
      } catch (error) {
        for (const { row } of group) {
          row.status = "invalid";
          row.reason = `No se pudo clasificar el registro admitido; se conserva esta exclusión: ${error.message}`;
        }
      }
    }
  }
  const records = allRecords.filter((record) => filterDimensions.every((key) => !selected[key] || record.dimensions[key] === selected[key]));
  const visibleKeys = new Set(records.map((record) => record.key));
  for (const row of ledger) row.visible = row.status === "included" && visibleKeys.has(row.key);
  const counts = Object.fromEntries(["included", "duplicate", "incomplete", "invalid", "conflicting"]
    .map((status) => [status, ledger.filter((row) => row.status === status).length]));
  const partitions = Object.fromEntries(dimensions.map((dimension) => [dimension, partition(records, dimension, allRecords)]));
  const options = Object.fromEntries(dimensions.map((dimension) => [dimension, partition(allRecords, dimension)
    .map(({ value, label, count }) => ({ value, label, count }))]));
  const profiles = new Set(records.map((record) => record.dimensions.student));
  const profileGroups = new Map();
  for (const record of records) {
    if (!profileGroups.has(record.dimensions.student)) profileGroups.set(record.dimensions.student, new Set());
    profileGroups.get(record.dimensions.student).add(record.dimensions.group);
  }
  const groupMemberships = [...profileGroups.values()].reduce((sum, values) => sum + values.size, 0);
  const totals = { inputEntries: entries.length, canonicalEntries: allRecords.length, visibleEntries: records.length,
    filteredOut: allRecords.length - records.length, duplicates: counts.duplicate, incomplete: counts.incomplete,
    invalid: counts.invalid, conflicting: counts.conflicting, profiles: profiles.size,
    canonicalProfiles: new Set(allRecords.map((record) => record.dimensions.student)).size,
    kinds: kinds(records), canonicalKinds: kinds(allRecords), evidenceUnits: evidenceUnits(records),
    denominator: records.length, unit: "cierres únicos admisibles", profileUnit: "perfiles contextualizados por aula; no personas verificadas" };
  const diagnostics = {
    conservationDifference: entries.length - Object.values(counts).reduce((sum, count) => sum + count, 0),
    inclusionDifference: counts.included - allRecords.length,
    partitionDifferences: Object.fromEntries(dimensions.map((dimension) => [dimension, partitions[dimension]
      .reduce((sum, bucket) => sum + bucket.count, 0) - records.length])),
    unknownClassClosures: allRecords.filter((record) => record.classId === null).length,
    noObservations: records.length === 0,
    limits: ["Un aula desconocida no establece identidad global: la deduplicación usa sólo los campos conservados.",
      "Disponibilidad, importación, acuse y consulta no demuestran aprendizaje ni identidad personal.",
      "Las pertenencias a niveles, contenidos o grupos históricos no son recuentos aditivos de perfiles."] };
  return { totals, partitions, ledger, options, records, allRecords, filters: selected, diagnostics,
    memberships: {
      content: membership(records, "contentMemberships", (value) => value.startsWith("mission:") ? `Tipo de misión: ${value.slice(8)}` : TRAILS[value]?.name || value),
      levels: membership(records, "levels", (value) => `Nivel de cantidades ${value}`),
      groups: { profileMemberships: groupMemberships, uniqueProfiles: profiles.size,
        overlapMemberships: groupMemberships - profiles.size,
        overlappingProfiles: [...profileGroups].filter(([, values]) => values.size > 1).map(([profile]) => profile),
        unit: "pertenencias de perfiles a grupos históricos; no personas" },
    } };
}
