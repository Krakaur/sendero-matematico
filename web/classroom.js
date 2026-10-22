import {validateTasks,sessionKey} from './assignments.js';
export {validateTasks} from './assignments.js';
import { validWorkshop, mergeWorkshopReports } from "./workshop.js";
import { SCHEMA, TRAILS, validateReport, mergeSessions } from "./core.js";
import { normalizeEnrollment, validEnrollment } from "./enrollment.js";
import {
  MULTIPLAYER_SCHEMA,
  validateMultiplayerReport,
  mergeMultiplayer,
} from "./multiplayer-records.js";
export const DELIVERY_ATTEMPT_SCHEMA = "sendero.delivery-attempt.v1";
const deliveryTime = (value) => typeof value === "string" && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
function confirmationFor(state, session, entries=state.classroom?.confirmations) {
  const confirmation=entries?.[sessionKey(session)];
  return confirmation && confirmation.classId===state.classroom?.classId
    && confirmation.profile===state.profile && session.profile===state.profile
    && (!session.assignment || session.assignment.classId===confirmation.classId)
    && confirmation.source==="server-acknowledgement" && deliveryTime(confirmation.receivedAt)
    ? confirmation : null;
}
function checkedDeliveryAttempt(state, event) {
  if (event?.schema!==DELIVERY_ATTEMPT_SCHEMA || event.classId!==state.classroom?.classId
      || event.profile!==state.profile || typeof event.attemptId!=="string" || !/^[a-zA-Z0-9-]{1,80}$/.test(event.attemptId)
      || !deliveryTime(event.startedAt) || !Array.isArray(event.sessionKeys) || !Array.isArray(event.sessionIds)
      || !event.sessionKeys.length || event.sessionKeys.length>5000 || event.sessionKeys.length!==event.sessionIds.length
      || new Set(event.sessionKeys).size!==event.sessionKeys.length || new Set(event.sessionIds).size!==event.sessionIds.length)
    throw Error("El intento de entrega no corresponde al perfil o al aula.");
  const sessions=new Map(state.sessions.map((session)=>[sessionKey(session),session]));
  for (let index=0; index<event.sessionKeys.length; index++) {
    const session=sessions.get(event.sessionKeys[index]);
    if (!session || session.id!==event.sessionIds[index] || session.profile!==state.profile
        || !deliveryTime(session.completedAt) || (session.assignment && session.assignment.classId!==event.classId))
      throw Error("El intento de entrega contiene una sesión ajena o sin cierre local.");
  }
  return event;
}
// This is an intention persisted before POST, never proof of transmission or reception.
export function applyDeliveryAttempt(state, event) {
  checkedDeliveryAttempt(state,event);
  const attempts={...(state.classroom.deliveryAttempts||{})};
  for (const key of event.sessionKeys) {
    const old=attempts[key];
    if (old?.lastAttemptId===event.attemptId) continue;
    const same=old?.classId===event.classId && old?.profile===event.profile;
    attempts[key]={classId:event.classId,profile:event.profile,
      firstAttemptAt:same?old.firstAttemptAt:event.startedAt,
      lastAttemptAt:event.startedAt,lastAttemptId:event.attemptId,
      attemptCount:(same && Number.isSafeInteger(old.attemptCount) && old.attemptCount>0?old.attemptCount:0)+1};
  }
  state.classroom.deliveryAttempts=attempts;
}
export function deliveryStatus(state, session) {
  const confirmation=confirmationFor(state,session);
  const candidate=state.classroom?.deliveryAttempts?.[sessionKey(session)];
  const attempt=candidate?.classId===state.classroom?.classId && candidate?.profile===session.profile
    && deliveryTime(candidate.lastAttemptAt) ? candidate : null;
  return {stage:confirmation?"acknowledged":!session.completedAt?"in_progress":attempt?"send_attempted":"closed_local",
    closedAt:session.completedAt||null,attempt,confirmation,
    // Preserve legacy skip markers without upgrading them into verifiable acknowledgements.
    legacyReceivedFlag:!session.assignment && Boolean(state.classroom?.received?.includes(session.id))};
}
export function readInvitation(data, role) {
  if (
    data?.schema !== "sendero.invitation.v1" ||
    data.role !== role ||
    !["teacher", "student"].includes(role) ||
    typeof data.token !== "string" ||
    data.token.length < 32 ||
    typeof data.classId !== "string"
  )
    throw Error("La invitación no corresponde a este tipo de perfil.");
  const u = new URL(data.endpoint);
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !(
      u.protocol === "https:" ||
      (u.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(u.hostname))
    )
  )
    throw Error("La dirección del aula debe usar HTTPS.");
  return {
    schema: data.schema,
    role,
    token: data.token,
    classId: data.classId,
    endpoint: u.href.replace(/\/$/, ""),
    enabled: true,
    received: [],
    tasks: [],
  };
}
export async function classroomRequest(link, path, body, fetcher = fetch) {
  const r = await fetcher(link.endpoint + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + link.token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const error = Error(
      [429, 503].includes(r.status)
        ? "El aula ha pausado la sincronización por su límite de uso o disponibilidad. Tu progreso sigue guardado en este dispositivo."
        : r.status === 409
          ? "Hay una versión remota más reciente o se alcanzó el límite del aula. Conserva tu copia local antes de recuperar la remota."
          : r.status === 404
            ? "No existe todavía una copia remota para esta invitación."
            : r.status === 401
              ? "La invitación ha caducado o fue revocada."
              : "El aula no pudo confirmar la operación. Se reintentará al volver a conectar.",
    );
    error.retryAfter = [429, 503].includes(r.status)
      ? Math.min(
          86400,
          Math.max(300, Number(r.headers.get("Retry-After")) || 3600),
        )
      : 60;
    throw error;
  }
  const text = await r.text();
  if (text.length > 10 * 1024 * 1024)
    throw Error("Respuesta demasiado grande.");
  return JSON.parse(text);
}
export async function exchangeClassroom(state, fetcher = fetch, {onAttempt} = {}) {
  if (onAttempt!==undefined && typeof onAttempt!=="function") throw Error("onAttempt debe ser una función de persistencia.");
  const link = state.classroom;
  if (!link?.enabled) return null;
  let capabilities = link.capabilities || [];
  let capabilitiesAt = link.capabilitiesAt || 0;
  if (!link.capabilitiesAt || Date.now() - link.capabilitiesAt > 3600000)
    try {
      const features = (
        await classroomRequest(link, "/capabilities", null, fetcher)
      ).features;
      if (Array.isArray(features))
        capabilities = features.filter((f) =>
          [
            "projects",
            "vault",
            "students",
            "paged-reports",
            "chunked-vault",
            "enrollment",
            "multiplayer",
            "assignments-v2",
          ].includes(f),
        );
      capabilitiesAt = Date.now();
    } catch (error) {
      if (error.retryAfter > 60) throw error;
    }
  const extra = {};
  if (link.role === "student" && capabilities.includes("enrollment")) {
    const enrollment = normalizeEnrollment(state.enrollment),
      stamp = JSON.stringify(enrollment);
    if (link.enrollmentSent !== stamp) {
      const receipt = await classroomRequest(
        link,
        "/enrollment",
        { profile: state.profile, enrollment },
        fetcher,
      );
      if (
        receipt.profile !== state.profile ||
        receipt.classId !== link.classId ||
        JSON.stringify(receipt.enrollment) !== stamp
      )
        throw Error("La confirmación de datos escolares no coincide.");
      extra.enrollmentSent = stamp;
    }
  }
  const taskData=await classroomRequest(link,"/tasks",null,fetcher);
  const tasks=validateTasks(taskData.tasks);
  const taskRevision=typeof taskData.revision==='string'?taskData.revision:null;
  const paged = capabilities.includes("paged-reports");
  if (link.role === "teacher") {
    const data = await classroomRequest(
      link,
      "/reports" + (paged ? "?after=" + (link.reportCursor || 0) : ""),
      null,
      fetcher,
    );
    if (!Array.isArray(data.reports)) throw Error("Informes no válidos.");
    if (
      paged &&
      (!Number.isSafeInteger(data.cursor) ||
        data.cursor < (link.reportCursor || 0))
    )
      throw Error("Cursor de informes no válido.");
    const sessions = data.reports.flatMap((r) => validateReport(r).sessions);
    const confirmedAt=typeof data.confirmedAt==='string'&&Number.isFinite(Date.parse(data.confirmedAt))?data.confirmedAt:new Date().toISOString();
    const teacherConfirmations=Object.fromEntries(sessions.map(s=>[sessionKey(s),{classId:link.classId,profile:s.profile,confirmedAt,source:data.confirmationSource==='server-read'?'server-read':'client-observed-server-read'}]));
    let projects = [],
      multiplayer = [],
      multiplayerCursor = link.multiplayerCursor || 0,
      students = [];
    if (capabilities.includes("multiplayer")) {
      const response = await classroomRequest(
        link,
        "/multiplayer?after=" + multiplayerCursor,
        null,
        fetcher,
      );
      if (
        !Array.isArray(response.reports) ||
        !Number.isSafeInteger(response.cursor) ||
        response.cursor < multiplayerCursor
      )
        throw Error("Participaciones o cursor no válidos.");
      multiplayer = response.reports.flatMap(
        (r) => validateMultiplayerReport(r).multiplayer,
      );
      multiplayerCursor = response.cursor;
    }
    if (capabilities.includes("projects")) {
      const response = await classroomRequest(
        link,
        "/projects" + (paged ? "?after=" + (link.projectCursor || 0) : ""),
        null,
        fetcher,
      );
      if (
        !Array.isArray(response.reports) ||
        response.reports.some(
          (r) =>
            typeof r.profile !== "string" ||
            !Array.isArray(r.projects) ||
            !r.projects.every(validWorkshop),
        )
      )
        throw Error("Proyectos no válidos.");
      projects = response.reports;
      if (paged) {
        if (
          !Number.isSafeInteger(response.cursor) ||
          response.cursor < (link.projectCursor || 0)
        )
          throw Error("Cursor de proyectos no válido.");
        link.projectCursor = response.cursor;
      }
    }
    if (capabilities.includes("students")) {
      students = (await classroomRequest(link, "/students", null, fetcher))
        .students;
      if (
        !Array.isArray(students) ||
        students.length > 60 ||
        students.some(
          (s) =>
            typeof s.id !== "string" ||
            s.id.length > 80 ||
            (s.profile !== null && typeof s.profile !== "string") ||
            (s.enrollment != null && !validEnrollment(s.enrollment)),
        )
      )
        throw Error("Participantes no válidos.");
    }
    return {
      tasks,
      taskRevision,
      teacherConfirmations,
      sessions,
      projects,
      students,
      multiplayer,
      multiplayerCursor,
      capabilities,
      capabilitiesAt,
      ...(paged
        ? { reportCursor: data.cursor, projectCursor: link.projectCursor || 0 }
        : {}),
      at: new Date().toISOString(),
    };
  }
  if (link.includeMultiplayer && capabilities.includes("multiplayer")) {
    const pending = (state.multiplayerHistory || [])
      .filter((r) => !link.multiplayerReceived?.includes(r.id))
      .slice(0, 1);
    if (pending.length) {
      const report = {
        schema: MULTIPLAYER_SCHEMA,
        profile: state.profile,
        multiplayer: pending,
      };
      validateMultiplayerReport(report);
      const receipt = await classroomRequest(
        link,
        "/multiplayer",
        report,
        fetcher,
      );
      if (
        receipt.profile !== state.profile ||
        receipt.classId !== link.classId ||
        !Array.isArray(receipt.accepted) ||
        pending.some((r) => !receipt.accepted.includes(r.id))
      )
        throw Error("La confirmación multijugador no coincide.");
      extra.multiplayerReceived = receipt.accepted;
    }
  }
  let projectReceived = [];
  if (link.includeProjects && capabilities.includes("projects")) {
    const pendingProjects = (state.workshopHistory || [])
      .filter((p) => !link.projectReceived?.includes(p.id))
      .slice(0, paged ? 1 : 5000);
    if (pendingProjects.length) {
      const receipt = await classroomRequest(
        link,
        "/projects",
        { profile: state.profile, projects: pendingProjects },
        fetcher,
      );
      if (
        receipt.profile !== state.profile ||
        receipt.classId !== link.classId ||
        !Array.isArray(receipt.accepted) ||
        pendingProjects.some((p) => !receipt.accepted.includes(p.id))
      )
        throw Error("La recepción de proyectos no coincide.");
      projectReceived = receipt.accepted;
    }
  }
  const pending = state.sessions
    .filter((s) => (!s.assignment ? !link.received?.includes(s.id) : !confirmationFor(state,s))
      && (!s.assignment || s.assignment.classId === link.classId))
    .slice(0, paged ? 4 : 5000);
  if (!pending.length)
    return {
      ...extra,
      tasks,
      taskRevision,
      received: [],
      projectReceived,
      capabilities,
      capabilitiesAt,
      at: new Date().toISOString(),
    };
  const report = { schema: SCHEMA, profile: state.profile, sessions: pending };
  validateReport(report);
  const deliveryAttempt={schema:DELIVERY_ATTEMPT_SCHEMA,classId:link.classId,profile:state.profile,
    attemptId:crypto.randomUUID(),startedAt:new Date().toISOString(),
    sessionKeys:pending.map(sessionKey),sessionIds:pending.map((session)=>session.id)};
  checkedDeliveryAttempt(state,deliveryAttempt);
  // The host application must save this callback before it resolves. Failure prevents POST.
  if (onAttempt) await onAttempt(structuredClone(deliveryAttempt));
  const receipt = await classroomRequest(link, "/reports", report, fetcher);
  if (
    receipt.classId !== link.classId ||
    receipt.profile !== state.profile ||
    !Array.isArray(receipt.accepted) ||
    pending.some((s) => !receipt.accepted.includes(s.id)) ||
    receipt.accepted.length!==pending.length || new Set(receipt.accepted).size!==pending.length ||
    !deliveryTime(receipt.receivedAt)
  )
    throw Error("La confirmación no coincide con los informes enviados.");
  return {
    ...extra,
    tasks,
    taskRevision,
    deliveryAttempt,
    confirmations:Object.fromEntries(pending.map(s=>[sessionKey(s),{classId:link.classId,profile:s.profile,receivedAt:receipt.receivedAt,source:'server-acknowledgement'}])),
    received: receipt.accepted,
    projectReceived,
    capabilities,
    capabilitiesAt,
    at: receipt.receivedAt,
  };
}
export function applyExchange(state, result) {
  if (!result) return;
  // Reject incomplete student acknowledgements before changing any state or cursor.
  if (state.classroom.role==="student") {
    const accepted=result.received||[], confirmations=result.confirmations||{};
    if (!Array.isArray(accepted) || new Set(accepted).size!==accepted.length
        || Object.keys(confirmations).length!==accepted.length)
      throw Error("El intercambio no contiene un acuse íntegro.");
    for (const id of accepted) {
      const session=state.sessions.find((entry)=>entry.id===id && entry.profile===state.profile
        && confirmationFor(state,entry,confirmations));
      const confirmation=session && confirmationFor(state,session,confirmations);
      if (!confirmation || confirmation.receivedAt!==result.at)
        throw Error("No se puede marcar recibido un informe sin acuse válido.");
    }
    if (result.deliveryAttempt) checkedDeliveryAttempt(state,result.deliveryAttempt);
  }
  // Validate conflicts before changing cursors or other state.
  const mergedTeacher=result.sessions?mergeSessions(state.teacher,result.sessions).sessions:null;
  if (result.multiplayer)
    state.teacherMultiplayer = mergeMultiplayer(
      state.teacherMultiplayer || [],
      result.multiplayer,
    );
  if (
    Number.isSafeInteger(result.multiplayerCursor) &&
    result.multiplayerCursor >= 0
  )
    state.classroom.multiplayerCursor = result.multiplayerCursor;
  if (result.enrollmentSent)
    state.classroom.enrollmentSent = result.enrollmentSent;
  if (result.multiplayerReceived)
    state.classroom.multiplayerReceived = [
      ...new Set([
        ...(state.classroom.multiplayerReceived || []),
        ...result.multiplayerReceived,
      ]),
    ];
  if (result.projects)
    state.teacherProjects = mergeWorkshopReports(
      state.teacherProjects || [],
      result.projects,
    );
  if (result.students) state.classroom.students = result.students;
  if (result.capabilities) {
    state.classroom.capabilities = result.capabilities;
    state.classroom.capabilitiesAt = result.capabilitiesAt || 0;
  }
  if (Number.isSafeInteger(result.reportCursor) && result.reportCursor >= 0)
    state.classroom.reportCursor = result.reportCursor;
  if (Number.isSafeInteger(result.projectCursor) && result.projectCursor >= 0)
    state.classroom.projectCursor = result.projectCursor;
  if (result.projectReceived)
    state.classroom.projectReceived = [
      ...new Set([
        ...(state.classroom.projectReceived || []),
        ...result.projectReceived,
      ]),
    ];
  state.classroom.tasks = result.tasks;
  if(result.taskRevision)state.classroom.taskRevision=result.taskRevision;
  // onAttempt owns attempt persistence; an out-of-order response must not count it again.
  if(result.confirmations){
    const confirmations={...(state.classroom.confirmations||{})};
    for(const [key,incoming] of Object.entries(result.confirmations)){
      const old=confirmations[key];
      if(!old || old.classId!==incoming.classId || old.profile!==incoming.profile
          || old.source!=="server-acknowledgement"
          || !deliveryTime(old.receivedAt) || Date.parse(old.receivedAt)<=Date.parse(incoming.receivedAt))
        confirmations[key]=incoming;
    }
    state.classroom.confirmations=confirmations;
  }
  if(result.teacherConfirmations)state.teacherConfirmations={...(state.teacherConfirmations||{}),...result.teacherConfirmations};
  state.classroom.lastSyncAt = result.at;
  if (result.received?.length && (!deliveryTime(state.classroom.lastReceipt)
      || Date.parse(state.classroom.lastReceipt)<=Date.parse(result.at))) state.classroom.lastReceipt = result.at;
  if (result.sessions)
    state.teacher = mergedTeacher;
  if (result.received)
    state.classroom.received = [
      ...new Set([...(state.classroom.received || []), ...result.received]),
    ];
  state.classroom.error = null;
  delete state.classroom.retryAt;
}
