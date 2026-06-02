const KEY = "polopine:voter-id";

function generate(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/**
 * Returns the persistent anonymous voter id for this browser, creating one on
 * first call. Same trust model as the existing `polopine:voted:` markers in
 * `voted.ts`: client-asserted, opaque to the server, no PII. Resetting the
 * view (via `clearAllVoted`) rotates this id so the user is treated as a
 * fresh voter going forward.
 */
export function getOrCreateVoterId(): string {
  const existing = localStorage.getItem(KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }
  const fresh = generate();
  localStorage.setItem(KEY, fresh);
  return fresh;
}

/** Replaces the stored voter id with a fresh one and returns it. */
export function rotateVoterId(): string {
  const fresh = generate();
  localStorage.setItem(KEY, fresh);
  return fresh;
}

/** Returns the stored voter id without minting one. Useful for tests / UI. */
export function peekVoterId(): string | null {
  return localStorage.getItem(KEY);
}
