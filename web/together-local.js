import { createMatch, addPlayer } from "./room.js";

// A distinct group for each seat; preserve the original two-player controls.
export const LOCAL_KEYS = Object.freeze([
  Object.freeze(["a", "s", "d", "f"]),
  Object.freeze(["j", "k", "l", "ñ"]),
  Object.freeze(["1", "2", "3", "4"]),
  Object.freeze(["7", "8", "9", "0"]),
]);

export function createLocalMatch(config, count) {
  if (!Number.isInteger(count) || count < 2 || count > 4)
    throw Error("Elige de dos a cuatro personas.");
  const match = createMatch(config);
  for (let seat = 0; seat < count; seat++) addPlayer(match, `local-${seat}`);
  return match;
}

export function localAnswer(match, key) {
  if (match?.status !== "running" || match.config.trail === "razonar")
    return null;
  const normalized = String(key).toLowerCase();
  const seat = LOCAL_KEYS.findIndex((keys) => keys.includes(normalized));
  const player = match.players.find((p) => p.seat === seat);
  const question = player?.questions[player.index];
  if (!question) return null;
  return {
    player: player.id,
    action: {
      type: "answer",
      index: player.index,
      value: question.options[LOCAL_KEYS[seat].indexOf(normalized)],
    },
  };
}
