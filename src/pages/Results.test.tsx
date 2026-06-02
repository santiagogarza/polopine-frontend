import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPollResults, vote } from "../api";
import type { Poll, PollResults } from "../types";
import { Results } from "./Results";

vi.mock("../api", () => ({
  getPollResults: vi.fn(),
  vote: vi.fn(),
}));

const mockGetPollResults = vi.mocked(getPollResults);
const mockVote = vi.mocked(vote);

const sampleResults: PollResults = {
  question: "Favorite color?",
  totalVotes: 2,
  options: [
    { id: "opt-red", text: "Red", votes: 2 },
    { id: "opt-blue", text: "Blue", votes: 0 },
  ],
};

function renderResults(path = "/poll/poll-1/results") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/poll/:id/results" element={<Results />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows vote-first gate when user has not voted", () => {
    renderResults();

    expect(
      screen.getByRole("heading", { name: "Vote first to see results" }),
    ).toBeInTheDocument();
    expect(mockGetPollResults).not.toHaveBeenCalled();
  });

  it("loads and displays results when user has voted", async () => {
    localStorage.setItem("polopine:voted:poll-1", "opt-red");
    mockGetPollResults.mockResolvedValue(sampleResults);

    renderResults();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.getByText(/2 votes total/)).toBeInTheDocument();
    expect(mockGetPollResults).toHaveBeenCalledWith("poll-1");
  });

  it("switches vote when user chooses another option", async () => {
    localStorage.setItem("polopine:voted:poll-1", "opt-red");
    mockGetPollResults.mockResolvedValue(sampleResults);

    const updatedPoll: Poll = {
      id: "poll-1",
      question: "Favorite color?",
      createdAt: "2024-01-01T00:00:00.000Z",
      options: [
        { id: "opt-red", text: "Red", votes: 1 },
        { id: "opt-blue", text: "Blue", votes: 1 },
      ],
    };
    mockVote.mockResolvedValue(updatedPoll);

    const { container } = renderResults();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    const blueRow = screen.getByText("Blue").closest(".results-row");
    expect(blueRow).toBeTruthy();
    fireEvent.mouseEnter(blueRow!);

    const switchBtn = await screen.findByRole("button", {
      name: "Vote for this instead",
    });
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(mockVote).toHaveBeenCalledWith("poll-1", "opt-blue");
    });
    expect(localStorage.getItem("polopine:voted:poll-1")).toBe("opt-blue");
    expect(screen.getByText(/2 votes total/)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="bar-opt-blue"]')).toHaveStyle({
      width: "50%",
    });
  });

  it("shows error when results fetch fails", async () => {
    localStorage.setItem("polopine:voted:poll-1", "opt-red");
    mockGetPollResults.mockRejectedValue(new Error("Poll not found"));

    renderResults();

    expect(await screen.findByRole("alert")).toHaveTextContent("Poll not found");
  });

  it("navigates to vote page from gate CTA", () => {
    render(
      <MemoryRouter initialEntries={["/poll/poll-1/results"]}>
        <Routes>
          <Route path="/poll/:id/results" element={<Results />} />
          <Route path="/poll/:id" element={<div>Vote page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go vote" }));

    expect(screen.getByText("Vote page")).toBeInTheDocument();
  });
});
