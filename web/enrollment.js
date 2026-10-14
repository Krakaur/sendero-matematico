// Educational affiliation, never a public multiplayer identity.
export const ENROLLMENT_FIELDS = ["school", "grade", "group", "listNumber"];
export function normalizeEnrollment(value = {}) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !ENROLLMENT_FIELDS.includes(k))
  )
    throw Error("Datos escolares no válidos.");
  const result = {};
  for (const [key, max] of [
    ["school", 120],
    ["grade", 24],
    ["group", 16],
  ]) {
    const raw = value[key] ?? "";
    if (typeof raw !== "string")
      throw Error("Los datos escolares deben ser texto.");
    const text = raw.normalize("NFKC").replace(/\s+/gu, " ").trim();
    if (text.length > max || /[\u0000-\u001f\u007f]/u.test(text))
      throw Error("Revisa la longitud de los datos escolares.");
    result[key] = text;
  }
  const n = value.listNumber;
  if (n === undefined || n === null || n === "") result.listNumber = null;
  else {
    if (
      !/^[0-9]{1,3}$/.test(String(n)) ||
      !Number.isInteger(Number(n)) ||
      Number(n) < 1 ||
      Number(n) > 999
    )
      throw Error("El número de lista debe ser un entero de 1 a 999.");
    result.listNumber = Number(n);
  }
  return result;
}
export function validEnrollment(value) {
  try {
    const n = normalizeEnrollment(value);
    return Object.keys(n).every((k) => n[k] === value[k]);
  } catch {
    return false;
  }
}
export const enrollmentFromForm = (form) =>
  normalizeEnrollment(
    Object.fromEntries(ENROLLMENT_FIELDS.map((k) => [k, form.get(k) ?? ""])),
  );
export const schoolKey = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function enrollmentFields(value = {}) {
  const v = normalizeEnrollment(value);
  return `<fieldset class="enrollment-fields"><legend>Datos escolares · opcionales</legend><p>Usa la misma escritura que indique tu docente. No escribas tu nombre personal.</p><label>Nombre de la escuela<input name="school" maxlength="120" value="${escapeHTML(v.school)}" autocomplete="off"></label><label>Grado escolar<input name="grade" maxlength="24" value="${escapeHTML(v.grade)}" placeholder="Ejemplo: 3.º de primaria" autocomplete="off"></label><label>Grupo<input name="group" maxlength="16" value="${escapeHTML(v.group)}" placeholder="Ejemplo: A" autocomplete="off"></label><label>Número de lista<input name="listNumber" type="number" min="1" max="999" step="1" value="${v.listNumber ?? ""}" inputmode="numeric" autocomplete="off"></label><p class="micro">Sirven para organizar informes privados. No aparecen ante otros jugadores. Escuela, grupo y número de lista pueden permitir identificarte; compártelos solo con tu docente mediante la invitación del aula o una exportación.</p></fieldset>`;
}
export function csvCell(value) {
  let s = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
