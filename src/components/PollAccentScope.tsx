import type { ReactNode } from "react";
import { accentCssVars, DEFAULT_ACCENT_COLOR, type AccentColor } from "../accentColors";

type PollAccentScopeProps = {
  accentColor?: AccentColor;
  children: ReactNode;
  className?: string;
};

export function PollAccentScope({
  accentColor = DEFAULT_ACCENT_COLOR,
  children,
  className,
}: PollAccentScopeProps) {
  return (
    <div
      className={className ? `poll-accent ${className}` : "poll-accent"}
      style={accentCssVars(accentColor)}
    >
      {children}
    </div>
  );
}
