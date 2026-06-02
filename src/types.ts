export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

/**
 * Curated set of accent color keys a poll creator can pick from. We send the
 * key (not a raw hex) to the API so the palette can be restyled later without
 * rewriting data. Keep this list in lockstep with the backend palette.
 */
export const POLL_ACCENT_COLORS = [
  "orange",
  "amber",
  "red",
  "magenta",
  "violet",
  "blue",
  "teal",
  "green",
] as const;

export type PollAccentColor = (typeof POLL_ACCENT_COLORS)[number];

export const DEFAULT_POLL_ACCENT_COLOR: PollAccentColor = "orange";

/**
 * Hex values for each accent key. Tuned for similar saturation / value as the
 * default orange and for readable contrast against `#fff` button labels on
 * both light and dark backgrounds.
 */
export const POLL_ACCENT_COLOR_HEX: Record<PollAccentColor, string> = {
  orange: "#f54e00",
  amber: "#d97706",
  red: "#dc2626",
  magenta: "#db2777",
  violet: "#7c3aed",
  blue: "#2563eb",
  teal: "#0d9488",
  green: "#16a34a",
};

export const POLL_ACCENT_COLOR_LABEL: Record<PollAccentColor, string> = {
  orange: "Orange",
  amber: "Amber",
  red: "Red",
  magenta: "Magenta",
  violet: "Violet",
  blue: "Blue",
  teal: "Teal",
  green: "Green",
};

export function isPollAccentColor(value: unknown): value is PollAccentColor {
  return (
    typeof value === "string" &&
    (POLL_ACCENT_COLORS as readonly string[]).includes(value)
  );
}

/**
 * Returns the hex for a valid accent key, falling back to the default if the
 * key is missing or unknown (e.g. an older poll fetched from a forward-
 * incompatible API).
 */
export function pollAccentHex(value: unknown): string {
  return isPollAccentColor(value)
    ? POLL_ACCENT_COLOR_HEX[value]
    : POLL_ACCENT_COLOR_HEX[DEFAULT_POLL_ACCENT_COLOR];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  accentColor: PollAccentColor;
}

export interface PollResults {
  question: string;
  options: PollOption[];
  totalVotes: number;
  accentColor: PollAccentColor;
}
