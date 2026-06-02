import { describe, expect, it } from "vitest";
import {
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  resolveAccentColor,
} from "./accentColors";

const LIGHT_BG = "#f7f7f4";
const DARK_BG = "#14120b";

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("accent color palette", () => {
  it("defines exactly 8 curated colors with orange as the default", () => {
    expect(ACCENT_COLORS).toHaveLength(8);
    expect(DEFAULT_ACCENT_COLOR).toBe("orange");
    expect(new Set(ACCENT_COLORS.map((color) => color.key)).size).toBe(8);
  });

  it("keeps every accent visible in light and dark mode and readable on CTAs", () => {
    for (const color of ACCENT_COLORS) {
      expect(contrastRatio(color.hex, LIGHT_BG)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color.hex, DARK_BG)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color.hex, color.contrast)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("falls back to orange for missing or unknown API values", () => {
    expect(resolveAccentColor(undefined)).toBe("orange");
    expect(resolveAccentColor("chartreuse")).toBe("orange");
    expect(resolveAccentColor("teal")).toBe("teal");
  });
});
