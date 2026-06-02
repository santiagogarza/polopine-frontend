import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Poll } from "../types";
import { VotedPollCard } from "./VotedPollCard";

function renderCard(poll: Poll) {
  return render(
    <MemoryRouter>
      <VotedPollCard poll={poll} />
    </MemoryRouter>,
  );
}

describe("VotedPollCard", () => {
  it("sorts options by votes descending and caps visible bars at 4", () => {
    const poll: Poll = {
      id: "poll-1",
      question: "Ranked?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [
        { id: "o1", text: "One", votes: 1 },
        { id: "o2", text: "Two", votes: 5 },
        { id: "o3", text: "Three", votes: 3 },
        { id: "o4", text: "Four", votes: 2 },
        { id: "o5", text: "Five", votes: 4 },
        { id: "o6", text: "Six", votes: 0 },
      ],
    };

    renderCard(poll);

    expect(screen.getByLabelText("Two: 33%")).toBeInTheDocument();
    expect(screen.getByLabelText("Five: 27%")).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
    expect(screen.queryByText("Six")).not.toBeInTheDocument();
  });

  it("renders 0% bars without divide-by-zero when total votes is 0", () => {
    const poll: Poll = {
      id: "poll-zero",
      question: "No votes?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [
        { id: "a", text: "A", votes: 0 },
        { id: "b", text: "B", votes: 0 },
      ],
    };

    renderCard(poll);

    expect(screen.getByLabelText("A: 0%")).toBeInTheDocument();
    expect(screen.getByLabelText("B: 0%")).toBeInTheDocument();
    expect(screen.getByTestId("voted-bar-a")).toHaveStyle({ width: "0%" });
  });

  it("starts bars at width 0 and animates them in on mount", async () => {
    const poll: Poll = {
      id: "poll-anim",
      question: "Animated?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [
        { id: "a", text: "A", votes: 4 },
        { id: "b", text: "B", votes: 1 },
      ],
    };

    renderCard(poll);

    expect(screen.getByTestId("voted-bar-a")).toHaveStyle({ width: "0%" });
    expect(screen.getByTestId("voted-bar-b")).toHaveStyle({ width: "0%" });

    await waitFor(() => {
      expect(screen.getByTestId("voted-bar-a")).toHaveStyle({ width: "80%" });
    });
    expect(screen.getByTestId("voted-bar-b")).toHaveStyle({ width: "20%" });
  });

  it("staggers visible bar animation delays by 40ms per row", () => {
    const poll: Poll = {
      id: "poll-stagger",
      question: "Stagger?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [
        { id: "a", text: "A", votes: 3 },
        { id: "b", text: "B", votes: 2 },
        { id: "c", text: "C", votes: 1 },
      ],
    };

    renderCard(poll);

    expect(screen.getByTestId("voted-bar-a")).toHaveStyle({
      animationDelay: "0ms",
      transitionDelay: "0ms",
    });
    expect(screen.getByTestId("voted-bar-b")).toHaveStyle({
      animationDelay: "40ms",
      transitionDelay: "40ms",
    });
    expect(screen.getByTestId("voted-bar-c")).toHaveStyle({
      animationDelay: "80ms",
      transitionDelay: "80ms",
    });
  });
});
