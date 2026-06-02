import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPoll, vote as voteApi } from "../api";
import type { Poll } from "../types";
import { markVoted } from "../voted";
import { Vote } from "./Vote";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../api", () => ({
  getPoll: vi.fn(),
  vote: vi.fn(),
}));

vi.mock("../voted", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../voted")>();
  return {
    ...actual,
    markVoted: vi.fn(),
  };
});

const mockGetPoll = vi.mocked(getPoll);
const mockVoteApi = vi.mocked(voteApi);
const mockMarkVoted = vi.mocked(markVoted);

const samplePoll: Poll = {
  id: "poll-1",
  question: "Favorite color?",
  createdAt: "2026-01-01T00:00:00.000Z",
  options: [
    { id: "opt-red", text: "Red", votes: 0 },
    { id: "opt-blue", text: "Blue", votes: 0 },
  ],
};

function renderVote(path = "/poll/poll-1") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/poll/:id" element={<Vote />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows loading state while poll loads", () => {
    mockGetPoll.mockReturnValue(new Promise(() => {}));

    renderVote();

    expect(screen.getByText("Loading poll…")).toBeInTheDocument();
  });

  it("redirects to results when user already voted", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");
    mockGetPoll.mockResolvedValue(samplePoll);

    renderVote();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/poll/poll-1/results", {
        replace: true,
      });
    });
  });

  it("casts vote, marks voted, and navigates to results", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);
    mockVoteApi.mockResolvedValue({
      ...samplePoll,
      options: [
        { id: "opt-red", text: "Red", votes: 1 },
        { id: "opt-blue", text: "Blue", votes: 0 },
      ],
    });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Red" }));

    await waitFor(() => {
      expect(mockVoteApi).toHaveBeenCalledWith("poll-1", "opt-red");
      expect(mockMarkVoted).toHaveBeenCalledWith("poll-1", "opt-red");
      expect(navigate).toHaveBeenCalledWith("/poll/poll-1/results");
    });
  });

  it("shows error and re-enables options when vote fails", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);
    mockVoteApi.mockRejectedValue(new Error("Vote failed"));

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    const redButton = screen.getByRole("button", { name: "Red" });
    fireEvent.click(redButton);

    expect(await screen.findByRole("alert")).toHaveTextContent("Vote failed");
    expect(redButton).not.toBeDisabled();
  });
});
