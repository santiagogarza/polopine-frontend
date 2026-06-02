const PREFIX = "polopine:voted:";
const KEY = (id: string) => `${PREFIX}${id}`;

export function hasVoted(id: string): boolean {
  return localStorage.getItem(KEY(id)) === "1";
}

export function markVoted(id: string): void {
  localStorage.setItem(KEY(id), "1");
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
