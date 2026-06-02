import { describe, expect, it } from "vitest";
import {
  ACCENT_COLORS,
  ACCENT_HEX,
  ACCENT_HEX_DARK,
} from "./accentColors";

const LIGHT_BG = "#f7f7f4";
const DARK_BG = "#14120b";
const MIN_CONTRAST = 4.5;
const WHITE = "#ffffff";

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(hexToRgb(foreground));
  const l2 = relativeLuminance(hexToRgb(background));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("accent color contrast", () => {
  it.each(ACCENT_COLORS)(
    "meets WCAG AA for links, bars, and buttons for %s",
    (key) => {
      const lightAccent = ACCENT_HEX[key];
      const darkAccent = ACCENT_HEX_DARK[key];

      expect(contrastRatio(lightAccent, LIGHT_BG)).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
      expect(contrastRatio(darkAccent, DARK_BG)).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
      expect(contrastRatio(WHITE, lightAccent)).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
    },
  );
});
