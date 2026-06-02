import { rotateVoterId } from "./voter";

const PREFIX = "polopine:voted:";
const KEY = (id: string) => `${PREFIX}${id}`;

export function hasVoted(id: string): boolean {
  return localStorage.getItem(KEY(id)) !== null;
}

export function markVoted(id: string, optionId?: string): void {
  localStorage.setItem(KEY(id), optionId ?? "1");
}

export function getVotedOptionId(id: string): string | null {
  const value = localStorage.getItem(KEY(id));
  return value && value !== "1" ? value : null;
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
