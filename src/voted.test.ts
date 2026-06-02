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

  it("stores the optionId so the already-voted view can highlight the user's pick", () => {
    markVoted("poll-a", "opt-red");
    expect(hasVoted("poll-a")).toBe(true);
    expect(getVotedOptionId("poll-a")).toBe("opt-red");
  });

  it("returns null option id when marker is missing", () => {
    expect(hasVoted("poll-missing")).toBe(false);
    expect(getVotedOptionId("poll-missing")).toBeNull();
  });

  it("treats the legacy '1' marker as voted with unknown option id", () => {
    // A pre-POL-7 client wrote just "1" — we should still consider that voted
    // (so we don't show the vote page again) but we can't highlight an option.
    localStorage.setItem("polopine:voted:poll-legacy", "1");
    expect(hasVoted("poll-legacy")).toBe(true);
    expect(getVotedOptionId("poll-legacy")).toBeNull();
  });

  it("markVoted can overwrite the stored option id (switch vote)", () => {
    markVoted("poll-a", "opt-red");
    markVoted("poll-a", "opt-blue");
    expect(getVotedOptionId("poll-a")).toBe("opt-blue");
  });
});
