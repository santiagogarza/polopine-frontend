import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SharePollBar } from "./SharePollBar";

describe("SharePollBar", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });
  });

  it("copies share URL built from window origin and shows status", async () => {
    render(<SharePollBar pollId="poll-abc" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));
    });

    expect(screen.getByRole("status")).toHaveTextContent("Link copied");

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/poll/poll-abc`,
    );
  });

  it("shows voted notice only when showVotedNotice is true", () => {
    const { rerender } = render(<SharePollBar pollId="poll-abc" />);

    expect(screen.queryByText("You already voted")).not.toBeInTheDocument();

    rerender(<SharePollBar pollId="poll-abc" showVotedNotice />);

    expect(screen.getByText("You already voted")).toBeInTheDocument();
  });
});
