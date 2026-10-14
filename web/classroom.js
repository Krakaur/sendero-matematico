import { validWorkshop, mergeWorkshopReports } from "./workshop.js";
import { SCHEMA, TRAILS, validateReport, mergeSessions } from "./core.js";
import { normalizeEnrollment, validEnrollment } from "./enrollment.js";
import {
  MULTIPLAYER_SCHEMA,
  validateMultiplayerReport,
  mergeMultiplayer,
} from "./multiplayer-records.js";
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
export function validateTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length > 100)
    throw Error("Lista de tareas no válida.");
  return tasks.map((t) => {
    if (
      typeof t.id !== "string" ||
      t.id.length > 80 ||
      typeof t.title !== "string" ||
      t.title.length < 1 ||
      t.title.length > 100 ||
      !Object.hasOwn(TRAILS, t.trail)
    )
      throw Error("Tarea no válida.");
    return { id: t.id, title: t.title, trail: t.trail };
  });
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
export async function exchangeClassroom(state, fetcher = fetch) {
  const link = state.classroom;
  if (!link?.enabled) return null;
  const tasks = validateTasks(
    (await classroomRequest(link, "/tasks", null, fetcher)).tasks,
  );
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
          ].includes(f),
        );
      capabilitiesAt = Date.now();
    } catch (error) {
      if (error.retryAfter > 60) throw error;
    }
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
  const extra = {};
  if (capabilities.includes("enrollment")) {
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
    .filter((s) => !link.received?.includes(s.id))
    .slice(0, paged ? 4 : 5000);
  if (!pending.length)
    return {
      ...extra,
      tasks,
      received: [],
      projectReceived,
      capabilities,
      capabilitiesAt,
      at: new Date().toISOString(),
    };
  const report = { schema: SCHEMA, profile: state.profile, sessions: pending };
  validateReport(report);
  const receipt = await classroomRequest(link, "/reports", report, fetcher);
  if (
    receipt.classId !== link.classId ||
    receipt.profile !== state.profile ||
    !Array.isArray(receipt.accepted) ||
    pending.some((s) => !receipt.accepted.includes(s.id))
  )
    throw Error("La confirmación no coincide con los informes enviados.");
  return {
    ...extra,
    tasks,
    received: receipt.accepted,
    projectReceived,
    capabilities,
    capabilitiesAt,
    at: receipt.receivedAt,
  };
}
export function applyExchange(state, result) {
  if (!result) return;
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
  state.classroom.lastReceipt = result.at;
  if (result.sessions)
    state.teacher = mergeSessions(state.teacher, result.sessions).sessions;
  if (result.received)
    state.classroom.received = [
      ...new Set([...(state.classroom.received || []), ...result.received]),
    ];
  state.classroom.error = null;
  delete state.classroom.retryAt;
}
