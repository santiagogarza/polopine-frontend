import type { CSSProperties } from "react";

export const ACCENT_COLORS = [
  {
    key: "orange",
    label: "Orange",
    hex: "#f54e00",
    contrast: "#14120b",
  },
  {
    key: "red",
    label: "Red",
    hex: "#d93a3a",
    contrast: "#ffffff",
  },
  {
    key: "rose",
    label: "Rose",
    hex: "#d23b78",
    contrast: "#ffffff",
  },
  {
    key: "violet",
    label: "Violet",
    hex: "#7c3aed",
    contrast: "#ffffff",
  },
  {
    key: "indigo",
    label: "Indigo",
    hex: "#2563eb",
    contrast: "#ffffff",
  },
  {
    key: "teal",
    label: "Teal",
    hex: "#008f82",
    contrast: "#14120b",
  },
  {
    key: "green",
    label: "Green",
    hex: "#2f8f46",
    contrast: "#14120b",
  },
  {
    key: "amber",
    label: "Amber",
    hex: "#b86b00",
    contrast: "#14120b",
  },
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number]["key"];

export const DEFAULT_ACCENT_COLOR: AccentColor = "orange";

type AccentColorDefinition = (typeof ACCENT_COLORS)[number];

export const ACCENT_COLOR_BY_KEY = ACCENT_COLORS.reduce(
  (colors, color) => ({ ...colors, [color.key]: color }),
  {} as Record<AccentColor, AccentColorDefinition>,
);

export type AccentStyle = CSSProperties & {
  "--accent"?: string;
  "--accent-contrast"?: string;
};

export function resolveAccentColor(accentColor: unknown): AccentColor {
  if (
    typeof accentColor === "string" &&
    Object.prototype.hasOwnProperty.call(ACCENT_COLOR_BY_KEY, accentColor)
  ) {
    return accentColor as AccentColor;
  }
  return DEFAULT_ACCENT_COLOR;
}

export function getAccentStyle(accentColor: unknown): AccentStyle {
  const color = ACCENT_COLOR_BY_KEY[resolveAccentColor(accentColor)];
  return {
    "--accent": color.hex,
    "--accent-contrast": color.contrast,
  };
}
