import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllVoted,
  clearVoted,
  getVotedOption,
  hasVoted,
  listVotedPollIds,
  markVoted,
} from "./voted";

describe("voted", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tracks and clears vote markers", () => {
    markVoted("poll-a", "opt-a");
    markVoted("poll-b", "opt-b");
    expect(hasVoted("poll-a")).toBe(true);
    expect(getVotedOption("poll-a")).toBe("opt-a");
    expect(listVotedPollIds()).toEqual(["poll-a", "poll-b"]);

    clearVoted("poll-a");
    expect(hasVoted("poll-a")).toBe(false);
    expect(getVotedOption("poll-a")).toBeNull();
    expect(listVotedPollIds()).toEqual(["poll-b"]);

    clearAllVoted();
    expect(listVotedPollIds()).toEqual([]);
  });
});
