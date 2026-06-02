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

  it("tracks and clears vote markers", () => {
    markVoted("poll-a", "option-a");
    markVoted("poll-b");
    expect(hasVoted("poll-a")).toBe(true);
    expect(getVotedOptionId("poll-a")).toBe("option-a");
    expect(getVotedOptionId("poll-b")).toBeNull();
    expect(listVotedPollIds()).toEqual(["poll-a", "poll-b"]);

    clearVoted("poll-a");
    expect(hasVoted("poll-a")).toBe(false);
    expect(listVotedPollIds()).toEqual(["poll-b"]);

    clearAllVoted();
    expect(listVotedPollIds()).toEqual([]);
  });

  it("treats legacy boolean markers as voted without a selected option", () => {
    localStorage.setItem("polopine:voted:poll-a", "1");

    expect(hasVoted("poll-a")).toBe(true);
    expect(getVotedOptionId("poll-a")).toBeNull();
  });
});
