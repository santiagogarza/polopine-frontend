export const PUBLIC_URL =
  import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");
