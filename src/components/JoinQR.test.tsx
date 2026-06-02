import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("JoinQR", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PUBLIC_URL", "https://polopine.vercel.app");
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders an svg and shows the configured public URL", async () => {
    const { JoinQR } = await import("./JoinQR");
    const { container } = render(<JoinQR />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://polopine.vercel.app" }),
    ).toHaveAttribute("href", "https://polopine.vercel.app");
    expect(screen.getByRole("heading", { name: "Join the demo" })).toBeInTheDocument();
  });
});
