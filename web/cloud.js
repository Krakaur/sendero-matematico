import { encryptBackup, decryptBackup, restoreSnapshot } from "./backup.js";
import { classroomRequest, readInvitation } from "./classroom.js";
export async function saveCloudCopy(profile, state, password, fetcher = fetch) {
  if (!state.classroom?.enabled)
    throw Error(
      "Vincula primero una invitación de aula con un servidor disponible.",
    );
  const envelope = await encryptBackup(profile, state, password);
  const result = await classroomRequest(
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
  const snapshot = await decryptBackup(remote.envelope, password);
  if (snapshot.profile.role !== link.role)
    throw Error("La copia y la invitación corresponden a roles diferentes.");
  snapshot.state.cloudRevision = remote.revision;
  const profile = await restoreSnapshot(storage, snapshot, newPassword);
  return { profile, state: snapshot.state, link, revision: remote.revision };
}
