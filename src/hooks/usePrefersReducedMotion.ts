import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    media.addEventListener("change", onChange);
    setPrefersReduced(media.matches);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  return prefersReduced;
}
