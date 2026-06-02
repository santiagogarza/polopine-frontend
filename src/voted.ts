const KEY = (id: string) => `polopine:voted:${id}`;

export function hasVoted(id: string): boolean {
  return localStorage.getItem(KEY(id)) === "1";
}

export function markVoted(id: string): void {
  localStorage.setItem(KEY(id), "1");
}
