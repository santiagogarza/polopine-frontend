import { beforeEach, describe, expect, it } from "vitest";
import {
  getOrCreateVoterId,
  peekVoterId,
  rotateVoterId,
} from "./voter";

describe("voter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null before any id is generated", () => {
    expect(peekVoterId()).toBeNull();
  });

  it("mints a voter id on first call and persists it across calls", () => {
    const first = getOrCreateVoterId();
    expect(first).toBeTruthy();
    expect(peekVoterId()).toBe(first);

    const second = getOrCreateVoterId();
    expect(second).toBe(first);
  });

  it("rotateVoterId replaces the stored id with a fresh one", () => {
    const original = getOrCreateVoterId();
    const rotated = rotateVoterId();

    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(original);
    expect(peekVoterId()).toBe(rotated);
    expect(getOrCreateVoterId()).toBe(rotated);
  });

  it("regenerates a voter id if storage was cleared", () => {
    const first = getOrCreateVoterId();
    localStorage.clear();
    const second = getOrCreateVoterId();

    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
  });
});
