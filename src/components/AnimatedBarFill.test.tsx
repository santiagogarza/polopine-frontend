import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedBarFill } from "./AnimatedBarFill";

function mockMatchMedia(reducedMotion: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const matches = query === "(prefers-reduced-motion: reduce)" && reducedMotion;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) => {
        listeners.add(handler);
      },
      removeEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) => {
        listeners.delete(handler);
      },
      dispatchEvent: vi.fn(),
    } as MediaQueryList;
  });

  return {
    setReducedMotion(next: boolean) {
      reducedMotion = next;
      const event = { matches: reducedMotion } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

describe("AnimatedBarFill", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts at 0% width then animates to target with stagger on load", () => {
    mockMatchMedia(false);

    render(<AnimatedBarFill percent={60} index={1} testId="bar-a" />);

    const bar = screen.getByTestId("bar-a");
    expect(bar).toHaveStyle({ width: "0%" });
    expect(bar).toHaveAttribute("data-target-percent", "60");

    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(bar).toHaveStyle({ width: "60%" });
  });

  it("applies final width immediately when reduced motion is preferred", () => {
    mockMatchMedia(true);

    render(<AnimatedBarFill percent={40} index={2} testId="bar-b" />);

    expect(screen.getByTestId("bar-b")).toHaveStyle({ width: "40%" });
  });

  it("re-animates to a new percent after the initial entrance", () => {
    mockMatchMedia(false);

    const { rerender } = render(
      <AnimatedBarFill percent={30} index={0} testId="bar-c" />,
    );

    act(() => {
      vi.runAllTimers();
    });

    const bar = screen.getByTestId("bar-c");
    expect(bar).toHaveStyle({ width: "30%" });

    rerender(<AnimatedBarFill percent={70} index={0} testId="bar-c" />);
    expect(bar).toHaveStyle({ width: "70%" });
    expect(bar).toHaveAttribute("data-target-percent", "70");
  });
});
