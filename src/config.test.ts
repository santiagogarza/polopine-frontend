import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("PUBLIC_URL uses trimmed VITE_PUBLIC_URL when set", async () => {
    vi.stubEnv("VITE_PUBLIC_URL", "https://polopine.vercel.app/");
    const { PUBLIC_URL } = await import("./config");

    expect(PUBLIC_URL).toBe("https://polopine.vercel.app");
  });

  it("PUBLIC_URL falls back to window.location.origin when env unset", async () => {
    vi.stubEnv("VITE_PUBLIC_URL", "");
    const { PUBLIC_URL } = await import("./config");

    expect(PUBLIC_URL).toBe(window.location.origin);
  });
});
