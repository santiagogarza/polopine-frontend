import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllVoted,
  clearVoted,
  hasVoted,
  listVotedPollIds,
  markVoted,
} from "./voted";

describe("voted", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tracks and clears vote markers", () => {
    markVoted("poll-a");
    markVoted("poll-b");
    expect(hasVoted("poll-a")).toBe(true);
    expect(listVotedPollIds()).toEqual(["poll-a", "poll-b"]);

    clearVoted("poll-a");
    expect(hasVoted("poll-a")).toBe(false);
    expect(listVotedPollIds()).toEqual(["poll-b"]);

    clearAllVoted();
    expect(listVotedPollIds()).toEqual([]);
  });
});
