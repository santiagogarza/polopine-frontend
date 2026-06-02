import type { Poll } from "./types";

export type SortOption =
  | "newest"
  | "oldest"
  | "most-votes"
  | "least-votes"
  | "alphabetical";

export const SORT_OPTIONS: ReadonlyArray<{
  value: SortOption;
  label: string;
}> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-votes", label: "Most votes" },
  { value: "least-votes", label: "Least votes" },
  { value: "alphabetical", label: "Alphabetical" },
];

export const DEFAULT_SORT: SortOption = "newest";
const STORAGE_KEY = "polopine:pollSort";

const VALID_VALUES = new Set<SortOption>(SORT_OPTIONS.map((o) => o.value));

function isSortOption(value: string | null): value is SortOption {
  return value !== null && VALID_VALUES.has(value as SortOption);
}

export function loadSort(): SortOption {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSortOption(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (SSR, privacy mode).
  }
  return DEFAULT_SORT;
}

export function saveSort(sort: SortOption): void {
  try {
    localStorage.setItem(STORAGE_KEY, sort);
  } catch {
    // Ignore quota / availability errors; persistence is best-effort.
  }
}

function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

function compareCreatedAtDesc(a: Poll, b: Poll): number {
  const ta = Date.parse(a.createdAt);
  const tb = Date.parse(b.createdAt);
  // Newer (larger timestamp) first; fall back to id for stable ordering.
  if (tb !== ta) return tb - ta;
  return a.id.localeCompare(b.id);
}

export function sortPolls(polls: Poll[], sort: SortOption): Poll[] {
  const copy = polls.slice();
  switch (sort) {
    case "newest":
      copy.sort(compareCreatedAtDesc);
      break;
    case "oldest":
      copy.sort((a, b) => -compareCreatedAtDesc(a, b));
      break;
    case "most-votes":
      copy.sort((a, b) => {
        const diff = totalVotes(b) - totalVotes(a);
        return diff !== 0 ? diff : compareCreatedAtDesc(a, b);
      });
      break;
    case "least-votes":
      copy.sort((a, b) => {
        const diff = totalVotes(a) - totalVotes(b);
        return diff !== 0 ? diff : compareCreatedAtDesc(a, b);
      });
      break;
    case "alphabetical":
      copy.sort((a, b) => {
        const cmp = a.question.localeCompare(b.question, undefined, {
          sensitivity: "base",
        });
        return cmp !== 0 ? cmp : compareCreatedAtDesc(a, b);
      });
      break;
  }
  return copy;
}
