import { validWorkshop, mergeWorkshopReports } from "./workshop.js";
import { SCHEMA, TRAILS, validateReport, mergeSessions } from "./core.js";
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
  if (!r.ok)
    throw Error(
      r.status === 409
        ? "Hay una versión remota más reciente o se alcanzó el límite del aula. Conserva tu copia local antes de recuperar la remota."
        : r.status === 404
          ? "No existe todavía una copia remota para esta invitación."
          : r.status === 401
            ? "La invitación ha caducado o fue revocada."
            : "El aula no pudo confirmar la operación. Se reintentará al volver a conectar.",
    );
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
  let capabilities = [];
  try {
    const features = (
      await classroomRequest(link, "/capabilities", null, fetcher)
    ).features;
    if (Array.isArray(features))
      capabilities = features.filter((f) =>
        ["projects", "vault", "students"].includes(f),
      );
  } catch {}
  if (link.role === "teacher") {
    const data = await classroomRequest(link, "/reports", null, fetcher);
    if (!Array.isArray(data.reports)) throw Error("Informes no válidos.");
    const sessions = data.reports.flatMap((r) => validateReport(r).sessions);
    let projects = [],
      students = [];
    if (capabilities.includes("projects")) {
      const response = await classroomRequest(link, "/projects", null, fetcher);
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
            (s.profile !== null && typeof s.profile !== "string"),
        )
      )
        throw Error("Participantes no válidos.");
    }
    return {
      tasks,
      sessions,
      projects,
      students,
      capabilities,
      at: new Date().toISOString(),
    };
  }
  let projectReceived = [];
  if (link.includeProjects && capabilities.includes("projects")) {
    const pendingProjects = (state.workshopHistory || []).filter(
      (p) => !link.projectReceived?.includes(p.id),
    );
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
  const pending = state.sessions.filter((s) => !link.received?.includes(s.id));
  if (!pending.length)
    return {
      tasks,
      received: [],
      projectReceived,
      capabilities,
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
    tasks,
    received: receipt.accepted,
    projectReceived,
    capabilities,
    at: receipt.receivedAt,
  };
}
export function applyExchange(state, result) {
  if (!result) return;
  if (result.projects)
    state.teacherProjects = mergeWorkshopReports(
      state.teacherProjects || [],
      result.projects,
    );
  if (result.students) state.classroom.students = result.students;
  if (result.capabilities) state.classroom.capabilities = result.capabilities;
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
}
