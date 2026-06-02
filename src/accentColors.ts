import type { CSSProperties } from "react";

export const ACCENT_COLORS = [
  "orange",
  "coral",
  "amber",
  "emerald",
  "teal",
  "blue",
  "violet",
  "rose",
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

export const DEFAULT_ACCENT_COLOR: AccentColor = "orange";

/** Hex values for swatches and contrast checks (light mode). */
export const ACCENT_HEX: Record<AccentColor, string> = {
  orange: "#c24100",
  coral: "#b83d32",
  amber: "#b45309",
  emerald: "#047857",
  teal: "#0f766e",
  blue: "#1d4ed8",
  violet: "#6d28d9",
  rose: "#be123c",
};

/** Slightly brighter accents for dark backgrounds. */
export const ACCENT_HEX_DARK: Record<AccentColor, string> = {
  orange: "#ff7a33",
  coral: "#f07a6a",
  amber: "#fbbf24",
  emerald: "#4ade80",
  teal: "#5eead4",
  blue: "#93c5fd",
  violet: "#c4b5fd",
  rose: "#fda4af",
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  orange: "Orange",
  coral: "Coral",
  amber: "Amber",
  emerald: "Emerald",
  teal: "Teal",
  blue: "Blue",
  violet: "Violet",
  rose: "Rose",
};

export function isAccentColor(value: unknown): value is AccentColor {
  return (
    typeof value === "string" &&
    (ACCENT_COLORS as readonly string[]).includes(value)
  );
}

export function accentCssVars(color: AccentColor): CSSProperties {
  return {
    "--accent": ACCENT_HEX[color],
    "--accent-dark": ACCENT_HEX_DARK[color],
  } as CSSProperties;
}
