import { useCallback, useEffect, useState } from "react";

export const ADMIN_KEY_STORAGE = "polopine:admin-key";

export const ADMIN_AUTH_CHANGED_EVENT = "polopine:admin-auth-changed";

export function getAdminKey(): string {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function isAdminAuthenticated(): boolean {
  return getAdminKey().length > 0;
}

export function saveAdminKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
  } else {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  }
  dispatchAdminAuthChanged();
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  dispatchAdminAuthChanged();
}

function dispatchAdminAuthChanged(): void {
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGED_EVENT));
}

/** Keeps React state in sync with sessionStorage admin key changes. */
export function useAdminAuth(): {
  adminKey: string;
  isAuthenticated: boolean;
  refresh: () => void;
} {
  const [adminKey, setAdminKey] = useState(getAdminKey);

  const refresh = useCallback(() => {
    setAdminKey(getAdminKey());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, onChange);
  }, [refresh]);

  return {
    adminKey,
    isAuthenticated: adminKey.length > 0,
    refresh,
  };
}
