import { encryptBackup, decryptBackup, restoreSnapshot } from "./backup.js";
import { classroomRequest, readInvitation } from "./classroom.js";
export async function saveCloudCopy(profile, state, password, fetcher = fetch) {
  if (!state.classroom?.enabled)
    throw Error(
      "Vincula primero una invitación de aula con un servidor disponible.",
    );
  const envelope = await encryptBackup(profile, state, password);
  const capabilities = await classroomRequest(
    state.classroom,
    "/capabilities",
    null,
    fetcher,
  );
  let result;
  if (capabilities.features?.includes("chunked-vault")) {
    const { data, ...meta } = envelope;
    const size = capabilities.chunkSize;
    if (
      !Number.isInteger(size) ||
      size < 1024 ||
      size > 65536 ||
      data.length > capabilities.maxCopyBytes
    )
      throw Error(
        "La copia excede la capacidad del aula. Descarga una copia local protegida.",
      );
    const start = await classroomRequest(
      state.classroom,
      "/vault/start",
      {
        profile: profile.id,
        expectedRevision: state.cloudRevision || 0,
        meta,
        bytes: data.length,
        parts: Math.ceil(data.length / size),
      },
      fetcher,
    );
    try {
      for (let offset = 0; offset < data.length; offset += size) {
        const index = offset / size;
        const part = await classroomRequest(
          state.classroom,
          "/vault/part",
          {
            uploadId: start.uploadId,
            index,
            data: data.slice(offset, offset + size),
          },
          fetcher,
        );
        if (part.stored !== index)
          throw Error("No se confirmó un fragmento de la copia.");
      }
      result = await classroomRequest(
        state.classroom,
        "/vault/finish",
        { uploadId: start.uploadId },
        fetcher,
      );
    } catch (error) {
      try {
        await classroomRequest(
          state.classroom,
          "/vault/abort",
          { uploadId: start.uploadId },
          fetcher,
        );
      } catch {}
      throw error;
    }
  } else
    result = await classroomRequest(
      state.classroom,
      "/vault",
      {
        profile: profile.id,
        expectedRevision: state.cloudRevision || 0,
        envelope,
      },
      fetcher,
    );
  if (!Number.isInteger(result.revision) || result.revision < 1)
    throw Error("El servidor no confirmó la versión de la copia.");
  return result;
}
export async function restoreCloudCopy(
  storage,
  invitation,
  password,
  newPassword,
  fetcher = fetch,
) {
  const link = readInvitation(invitation, invitation.role),
    remote = await classroomRequest(link, "/vault", null, fetcher);
  if (!Number.isInteger(remote.revision) || remote.revision < 1)
    throw Error("Todavía no hay una copia remota para esta invitación.");
  let envelope = remote.envelope;
  if (remote.chunked) {
    if (
      !Number.isInteger(remote.parts) ||
      remote.parts < 1 ||
      remote.parts > 144 ||
      remote.chunkSize !== 65536 ||
      remote.bytes > 9 * 1024 * 1024 ||
      remote.parts !== Math.ceil(remote.bytes / remote.chunkSize)
    )
      throw Error("Metadatos de copia no válidos.");
    const parts = [];
    for (let index = 0; index < remote.parts; index++) {
      const part = await classroomRequest(
        link,
        `/vault/part?index=${index}&revision=${remote.revision}`,
        null,
        fetcher,
      );
      if (
        part.revision !== remote.revision ||
        part.index !== index ||
        typeof part.data !== "string" ||
        part.data.length !==
          Math.min(remote.chunkSize, remote.bytes - index * remote.chunkSize)
      )
        throw Error("La copia remota cambió durante la descarga.");
      parts.push(part.data);
    }
    envelope = { ...remote.meta, data: parts.join("") };
  }
  const snapshot = await decryptBackup(envelope, password);
  if (snapshot.profile.role !== link.role)
    throw Error("La copia y la invitación corresponden a roles diferentes.");
  snapshot.state.cloudRevision = remote.revision;
  const profile = await restoreSnapshot(storage, snapshot, newPassword);
  return { profile, state: snapshot.state, link, revision: remote.revision };
}
