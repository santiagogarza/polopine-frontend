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

  it("tracks option id and clears vote markers", () => {
    markVoted("poll-a", "opt-1");
    markVoted("poll-b", "opt-2");
    expect(hasVoted("poll-a")).toBe(true);
    expect(getVotedOption("poll-a")).toBe("opt-1");
    expect(listVotedPollIds()).toEqual(["poll-a", "poll-b"]);

    clearVoted("poll-a");
    expect(hasVoted("poll-a")).toBe(false);
    expect(getVotedOption("poll-a")).toBeNull();
    expect(listVotedPollIds()).toEqual(["poll-b"]);

    clearAllVoted();
    expect(listVotedPollIds()).toEqual([]);
  });

  it("treats legacy marker as voted without option id", () => {
    localStorage.setItem("polopine:voted:poll-legacy", "1");
    expect(hasVoted("poll-legacy")).toBe(true);
    expect(getVotedOption("poll-legacy")).toBeNull();
  });
});
