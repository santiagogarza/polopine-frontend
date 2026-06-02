import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SORT,
  loadSort,
  saveSort,
  sortPolls,
  type SortOption,
} from "./pollSort";
import type { Poll } from "./types";

function poll(
  id: string,
  question: string,
  createdAt: string,
  voteCounts: number[],
): Poll {
  return {
    id,
    question,
    createdAt,
    options: voteCounts.map((votes, index) => ({
      id: `${id}-opt-${index}`,
      text: `option-${index}`,
      votes,
    })),
  };
}

const polls: Poll[] = [
  poll("a", "Banana split?", "2026-06-01T10:00:00.000Z", [3, 2]), // 5
  poll("b", "Apple pie?", "2026-06-02T10:00:00.000Z", [1, 1]), // 2
  poll("c", "Cherry cola?", "2026-06-03T10:00:00.000Z", [10, 0]), // 10
];

describe("sortPolls", () => {
  it("sorts newest first by default", () => {
    const result = sortPolls(polls, "newest").map((p) => p.id);
    expect(result).toEqual(["c", "b", "a"]);
  });

  it("sorts oldest first", () => {
    const result = sortPolls(polls, "oldest").map((p) => p.id);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("sorts most votes first", () => {
    const result = sortPolls(polls, "most-votes").map((p) => p.id);
    expect(result).toEqual(["c", "a", "b"]);
  });

  it("sorts least votes first", () => {
    const result = sortPolls(polls, "least-votes").map((p) => p.id);
    expect(result).toEqual(["b", "a", "c"]);
  });

  it("sorts alphabetically by question", () => {
    const result = sortPolls(polls, "alphabetical").map((p) => p.id);
    expect(result).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the input array", () => {
    const original = polls.slice();
    sortPolls(polls, "alphabetical");
    expect(polls).toEqual(original);
  });

  it("falls back to a stable createdAt order on tie-breaks", () => {
    const tied: Poll[] = [
      poll("y", "Same name", "2026-06-02T10:00:00.000Z", [5]),
      poll("x", "Same name", "2026-06-03T10:00:00.000Z", [5]),
    ];
    const alpha = sortPolls(tied, "alphabetical").map((p) => p.id);
    expect(alpha).toEqual(["x", "y"]);
  });
});

describe("loadSort / saveSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns the default when nothing is stored", () => {
    expect(loadSort()).toBe(DEFAULT_SORT);
  });

  it("returns the default when stored value is invalid", () => {
    localStorage.setItem("polopine:pollSort", "garbage");
    expect(loadSort()).toBe(DEFAULT_SORT);
  });

  it("round-trips a valid sort option", () => {
    const value: SortOption = "most-votes";
    saveSort(value);
    expect(loadSort()).toBe(value);
  });
});
