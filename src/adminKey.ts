/**
 * Tiny helper around the `polopine:admin-key` sessionStorage entry that
 * both the footer login and the Admin page share. Auth beyond the
 * `x-admin-key` header is intentionally out-of-scope for this demo, so the
 * "session" here is literally a sessionStorage string.
 *
 * Components that care about live updates within the same tab should listen
 * for the `polopine:admin-key-changed` window event — sessionStorage's
 * native `storage` event only fires for other tabs, not the one writing.
 */

export const ADMIN_KEY_STORAGE = "polopine:admin-key";
export const ADMIN_KEY_CHANGED_EVENT = "polopine:admin-key-changed";

export function loadAdminKey(): string {
  if (typeof sessionStorage === "undefined") {
    return "";
  }
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function saveAdminKey(key: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  const trimmed = key.trim();
  if (trimmed) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
  } else {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_KEY_CHANGED_EVENT));
  }
}

export function clearAdminKey(): void {
  saveAdminKey("");
}
