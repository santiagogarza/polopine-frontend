import { rotateVoterId } from "./voter";

const PREFIX = "polopine:voted:";
const KEY = (id: string) => `${PREFIX}${id}`;
// Legacy marker value written by versions before POL-7 — present means "voted"
// but the actual option id is unknown to this client.
const LEGACY_VOTED = "1";

export function hasVoted(id: string): boolean {
  const value = localStorage.getItem(KEY(id));
  return typeof value === "string" && value.length > 0;
}

/**
 * Returns the option id this browser cast for the given poll, or `null` when
 * the marker is missing or was written by a pre-POL-7 client (which stored
 * only the boolean "1").
 */
export function getVotedOptionId(id: string): string | null {
  const value = localStorage.getItem(KEY(id));
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  if (value === LEGACY_VOTED) {
    return null;
  }
  return value;
}

export function markVoted(id: string, optionId?: string): void {
  // Persist the option id (POL-7) when known so the "already voted" view can
  // highlight the user's pick and offer to switch. Fall back to the legacy
  // marker for callers that don't have an option id (e.g. seed/test fixtures).
  const value =
    typeof optionId === "string" && optionId.length > 0
      ? optionId
      : LEGACY_VOTED;
  localStorage.setItem(KEY(id), value);
}

export function clearVoted(id: string): void {
  localStorage.removeItem(KEY(id));
}

export function clearAllVoted(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    localStorage.removeItem(key);
  }
  // Resetting the view also rotates the voter id so the server treats this
  // browser as a fresh voter (matches the user's intent: "forget everything").
  rotateVoterId();
}

/** Poll ids the user has marked as voted in this browser. */
export function listVotedPollIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      ids.push(key.slice(PREFIX.length));
    }
  }
  return ids;
}
