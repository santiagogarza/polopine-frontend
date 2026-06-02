import { beforeEach, describe, expect, it } from "vitest";
import type { Poll } from "./types";
import {
  DEFAULT_POLL_SORT,
  getStoredPollSort,
  setStoredPollSort,
  sortPolls,
  totalVotes,
} from "./pollSort";

const polls: Poll[] = [
  {
    id: "b",
    question: "Beta question",
    createdAt: "2026-06-01T10:00:00.000Z",
    options: [
      { id: "1", text: "A", votes: 2 },
      { id: "2", text: "B", votes: 1 },
    ],
  },
  {
    id: "a",
    question: "Alpha question",
    createdAt: "2026-06-02T12:00:00.000Z",
    options: [
      { id: "1", text: "A", votes: 1 },
      { id: "2", text: "B", votes: 0 },
    ],
  },
  {
    id: "c",
    question: "Gamma question",
    createdAt: "2026-05-30T08:00:00.000Z",
    options: [
      { id: "1", text: "A", votes: 10 },
      { id: "2", text: "B", votes: 0 },
    ],
  },
];

describe("pollSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to newest when nothing is stored", () => {
    expect(getStoredPollSort()).toBe(DEFAULT_POLL_SORT);
  });

  it("persists the selected sort option", () => {
    setStoredPollSort("alphabetical");
    expect(getStoredPollSort()).toBe("alphabetical");
    expect(localStorage.getItem("polopine:poll-sort")).toBe("alphabetical");
  });

  it("falls back to newest for invalid stored values", () => {
    localStorage.setItem("polopine:poll-sort", "not-a-sort");
    expect(getStoredPollSort()).toBe("newest");
  });

  it("sorts by createdAt for newest and oldest", () => {
    expect(sortPolls(polls, "newest").map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(sortPolls(polls, "oldest").map((p) => p.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("sorts by vote totals for most and least votes", () => {
    expect(sortPolls(polls, "most-votes").map((p) => p.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(sortPolls(polls, "least-votes").map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("sorts alphabetically by question", () => {
    expect(sortPolls(polls, "alphabetical").map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("does not mutate the input array", () => {
    const copy = [...polls];
    sortPolls(polls, "newest");
    expect(polls).toEqual(copy);
  });

  it("sums option votes for totalVotes", () => {
    expect(totalVotes(polls[0])).toBe(3);
  });
});
