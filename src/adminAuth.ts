export const ADMIN_KEY_STORAGE = "polopine:admin-key";

const ADMIN_AUTH_EVENT = "polopine:admin-auth-changed";

export function loadAdminKey(): string {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function saveAdminKey(key: string): string {
  const trimmedKey = key.trim();
  if (trimmedKey) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmedKey);
  } else {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  }
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  return trimmedKey;
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export function subscribeToAdminAuthChange(callback: () => void): () => void {
  window.addEventListener(ADMIN_AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ADMIN_AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
