import type { Poll } from "./types";

const STORAGE_KEY = "polopine:poll-sort";

export const POLL_SORT_OPTIONS = [
  "newest",
  "oldest",
  "most-votes",
  "least-votes",
  "alphabetical",
] as const;

export type PollSortOption = (typeof POLL_SORT_OPTIONS)[number];

export const DEFAULT_POLL_SORT: PollSortOption = "newest";

export const POLL_SORT_LABELS: Record<PollSortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "most-votes": "Most votes",
  "least-votes": "Least votes",
  alphabetical: "Alphabetical",
};

function isPollSortOption(value: string): value is PollSortOption {
  return (POLL_SORT_OPTIONS as readonly string[]).includes(value);
}

export function getStoredPollSort(): PollSortOption {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isPollSortOption(stored)) {
    return stored;
  }
  return DEFAULT_POLL_SORT;
}

export function setStoredPollSort(option: PollSortOption): void {
  localStorage.setItem(STORAGE_KEY, option);
}

export function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

export function sortPolls(polls: Poll[], option: PollSortOption): Poll[] {
  const sorted = [...polls];
  switch (option) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "most-votes":
      return sorted.sort((a, b) => totalVotes(b) - totalVotes(a));
    case "least-votes":
      return sorted.sort((a, b) => totalVotes(a) - totalVotes(b));
    case "alphabetical":
      return sorted.sort((a, b) =>
        a.question.localeCompare(b.question, undefined, {
          sensitivity: "base",
        }),
      );
    default: {
      const _exhaustive: never = option;
      return _exhaustive;
    }
  }
}
