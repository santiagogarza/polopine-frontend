import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllVoted,
  clearVoted,
  getVotedOptionId,
  hasVoted,
  listVotedPollIds,
  markVoted,
} from "./voted";

describe("voted", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tracks and clears vote markers with option ids", () => {
    markVoted("poll-a", "opt-a");
    markVoted("poll-b", "opt-b");
    expect(hasVoted("poll-a")).toBe(true);
    expect(getVotedOptionId("poll-a")).toBe("opt-a");
    expect(listVotedPollIds()).toEqual(["poll-a", "poll-b"]);

    clearVoted("poll-a");
    expect(hasVoted("poll-a")).toBe(false);
    expect(listVotedPollIds()).toEqual(["poll-b"]);

    clearAllVoted();
    expect(listVotedPollIds()).toEqual([]);
  });

  it("treats legacy '1' markers as voted without a known option", () => {
    localStorage.setItem("polopine:voted:poll-legacy", "1");
    expect(hasVoted("poll-legacy")).toBe(true);
    expect(getVotedOptionId("poll-legacy")).toBeNull();
  });
});
