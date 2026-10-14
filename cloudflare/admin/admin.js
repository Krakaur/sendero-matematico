let key = "";
const $ = (s) => document.querySelector(s),
  status = (message) => ($("#status").textContent = message);
async function api(path, body) {
  if (!key) throw Error("Abre primero el archivo privado de administración.");
  const r = await fetch("/admin-api/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + key,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw Error(
      r.status === 401
        ? "Acceso no válido."
        : "La operación no pudo completarse. Estado " + r.status + ".",
    );
  return r.json();
}
$("#access").addEventListener("change", async (e) => {
  try {
    const file = e.target.files[0];
    if (!file || file.size > 4096) throw Error("Archivo no válido.");
    const data = JSON.parse(await file.text());
    if (
      data.schema !== "sendero.admin.v1" ||
      data.endpoint !== location.origin ||
      !/^[a-f0-9]{64}$/.test(data.token)
    )
      throw Error("El archivo no corresponde a este servicio.");
    key = data.token;
    status("Acceso cargado para esta pestaña.");
  } catch (error) {
    key = "";
    status(error.message);
  } finally {
    e.target.value = "";
  }
});
$("#logout").addEventListener("click", () => {
  key = "";
  $("#usage").textContent = "";
  $("#rooms").replaceChildren();
  status("Acceso cerrado.");
});
$("#create").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.disabled = true;
  try {
    const result = await api("rooms", {
      name: new FormData(e.target).get("name"),
    });
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(result, null, 2)], {
          type: "application/json",
        }),
      );
    a.href = url;
    a.download = "sendero-invitacion-docente-" + result.classId + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status(
      "Aula creada. Conserva la invitación descargada y ábrela en un perfil docente del juego.",
    );
    e.target.reset();
  } catch (error) {
    status(error.message);
  } finally {
    button.disabled = false;
  }
});
$("#refresh").addEventListener("click", async (e) => {
  e.target.disabled = true;
  try {
    const usage = await api("usage"),
      rooms = await api("rooms");
    $("#usage").textContent =
      `Día UTC: ${usage.day}\nSolicitudes autenticadas: ${usage.usage[0]?.requests || 0} / ${usage.limits.requests}\nLímite diario por invitación: ${usage.limits.perInvitation}`;
    $("#rooms").replaceChildren(
      ...rooms.rooms.map((r) => {
        const li = document.createElement("li");
        li.textContent = r.name + " · " + r.id;
        return li;
      }),
    );
    status("Consulta terminada.");
  } catch (error) {
    status(error.message);
  } finally {
    e.target.disabled = false;
  }
});
