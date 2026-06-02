import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const STAGGER_MS = 40;
const SPRING_MS = 400;

export type AnimatedBarFillProps = {
  percent: number;
  /** Row index used for load-time stagger (0-based). */
  index: number;
  testId?: string;
  className?: string;
};

export function AnimatedBarFill({
  percent,
  index,
  testId,
  className = "results-bar-fill",
}: AnimatedBarFillProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasEnteredRef = useRef(false);
  const [widthPercent, setWidthPercent] = useState(() =>
    prefersReducedMotion ? percent : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setWidthPercent(percent);
      return;
    }

    if (!hasEnteredRef.current) {
      const delay = index * STAGGER_MS;
      const timer = window.setTimeout(() => {
        setWidthPercent(percent);
        hasEnteredRef.current = true;
      }, delay);
      return () => {
        window.clearTimeout(timer);
      };
    }

    setWidthPercent(percent);
  }, [percent, index, prefersReducedMotion]);

  const motionClass = prefersReducedMotion
    ? "results-bar-fill--reduced"
    : "results-bar-fill--motion";

  return (
    <div
      className={`${className} ${motionClass}`.trim()}
      style={{
        width: `${widthPercent}%`,
        transitionDuration: prefersReducedMotion ? undefined : `${SPRING_MS}ms`,
      }}
      data-testid={testId}
      data-target-percent={percent}
    />
  );
}

export { STAGGER_MS, SPRING_MS };
