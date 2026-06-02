import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPollResults, vote as voteApi } from "../api";
import type { Poll, PollResults } from "../types";
import { Results } from "./Results";

vi.mock("../api", () => ({
  getPollResults: vi.fn(),
  vote: vi.fn(),
}));

const mockGetPollResults = vi.mocked(getPollResults);
const mockVoteApi = vi.mocked(voteApi);

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

  it("highlights the option this browser voted for", async () => {
    localStorage.setItem("polopine:voted:poll-1", "opt-red");
    mockGetPollResults.mockResolvedValue(sampleResults);

    renderResults();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.getByLabelText("Your vote")).toBeInTheDocument();
    // Switch affordance is rendered on the non-selected option only.
    expect(screen.getByTestId("switch-vote-opt-blue")).toBeInTheDocument();
    expect(
      screen.queryByTestId("switch-vote-opt-red"),
    ).not.toBeInTheDocument();
  });

  it("does not render switch affordance for legacy '1' marker", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");
    mockGetPollResults.mockResolvedValue(sampleResults);

    renderResults();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(
      screen.queryByTestId("switch-vote-opt-blue"),
    ).not.toBeInTheDocument();
  });

  it("switches the vote and refreshes results when affordance is clicked", async () => {
    localStorage.setItem("polopine:voted:poll-1", "opt-red");
    mockGetPollResults.mockResolvedValueOnce(sampleResults);

    const switchedPoll: Poll = {
      id: "poll-1",
      question: "Favorite color?",
      createdAt: "2026-01-01T00:00:00.000Z",
      options: [
        { id: "opt-red", text: "Red", votes: 1 },
        { id: "opt-blue", text: "Blue", votes: 1 },
      ],
    };
    mockVoteApi.mockResolvedValue(switchedPoll);

    const switchedResults: PollResults = {
      question: "Favorite color?",
      totalVotes: 2,
      options: [
        { id: "opt-red", text: "Red", votes: 1 },
        { id: "opt-blue", text: "Blue", votes: 1 },
      ],
    };
    mockGetPollResults.mockResolvedValue(switchedResults);

    renderResults();

    const switchBtn = await screen.findByTestId("switch-vote-opt-blue");
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(mockVoteApi).toHaveBeenCalledWith("poll-1", "opt-blue");
    });

    // localStorage marker should now point at the new option.
    await waitFor(() => {
      expect(localStorage.getItem("polopine:voted:poll-1")).toBe("opt-blue");
    });

    // Bars reflect the refreshed totals (Red 50% now).
    await waitFor(() => {
      expect(screen.getByLabelText("Red: 50%")).toBeInTheDocument();
      expect(screen.getByLabelText("Blue: 50%")).toBeInTheDocument();
    });

    // The "your vote" marker should now live on Blue.
    await waitFor(() => {
      expect(
        screen.queryByTestId("switch-vote-opt-blue"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("switch-vote-opt-red")).toBeInTheDocument();
    });
  });

  it("shows an error when switching the vote fails", async () => {
    localStorage.setItem("polopine:voted:poll-1", "opt-red");
    mockGetPollResults.mockResolvedValue(sampleResults);
    mockVoteApi.mockRejectedValue(new Error("Vote failed"));

    renderResults();

    const switchBtn = await screen.findByTestId("switch-vote-opt-blue");
    fireEvent.click(switchBtn);

    expect(await screen.findByRole("alert")).toHaveTextContent("Vote failed");
    // Marker stays on the original option after a failed switch.
    expect(localStorage.getItem("polopine:voted:poll-1")).toBe("opt-red");
  });
});
