import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// Keep tests hermetic: the api module reads `import.meta.env.VITE_API_URL`
// at import time and defaults to `http://localhost:8080`. If the developer
// (or cloud-agent VM) has `VITE_API_URL` exported, the api tests would
// otherwise hit that URL instead. Unset it before every test.
beforeEach(() => {
  if ("VITE_API_URL" in import.meta.env) {
    delete (import.meta.env as Record<string, string | undefined>).VITE_API_URL;
  }
});

const store = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
