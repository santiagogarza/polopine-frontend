import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addOption, getPollResults } from "../api";
import type { PollResults } from "../types";
import { Results } from "./Results";

vi.mock("../api", () => ({
  addOption: vi.fn(),
  getPollResults: vi.fn(),
}));

const mockAddOption = vi.mocked(addOption);
const mockGetPollResults = vi.mocked(getPollResults);

const sampleResults: PollResults = {
  question: "Favorite color?",
  allowVoterOptions: true,
  totalVotes: 2,
  options: [
    { id: "opt-red", text: "Red", votes: 2, authorVoterId: null },
    { id: "opt-blue", text: "Blue", votes: 0, authorVoterId: null },
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
    localStorage.setItem("polopine:voted:poll-1", "1");
    mockGetPollResults.mockResolvedValue(sampleResults);

    renderResults();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.getByText(/2 votes total/)).toBeInTheDocument();
    expect(mockGetPollResults).toHaveBeenCalledWith("poll-1");
  });

  it("adds an option from the post-vote results view", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");
    localStorage.setItem("polopine:voter-id", "voter-1");
    mockGetPollResults.mockResolvedValue(sampleResults);
    mockAddOption.mockResolvedValue({
      id: "poll-1",
      question: "Favorite color?",
      createdAt: "2026-01-01T00:00:00.000Z",
      allowVoterOptions: true,
      options: [
        ...sampleResults.options,
        {
          id: "opt-green",
          text: "Green",
          votes: 0,
          authorVoterId: "voter-1",
        },
      ],
    });

    renderResults();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add option"), {
      target: { value: "Green" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Green")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAddOption).toHaveBeenCalledWith("poll-1", "Green");
    });
  });

  it("shows error when results fetch fails", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");
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
