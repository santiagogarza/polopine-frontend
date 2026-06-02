import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addOption as addOptionApi, getPoll, vote as voteApi } from "../api";
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
  addOption: vi.fn(),
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
const mockAddOptionApi = vi.mocked(addOptionApi);
const mockMarkVoted = vi.mocked(markVoted);

const samplePoll: Poll = {
  id: "poll-1",
  question: "Favorite color?",
  createdAt: "2026-01-01T00:00:00.000Z",
  allowVoterOptions: true,
  options: [
    { id: "opt-red", text: "Red", votes: 0, authorVoterId: null },
    { id: "opt-blue", text: "Blue", votes: 0, authorVoterId: null },
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
        { id: "opt-red", text: "Red", votes: 1, authorVoterId: null },
        { id: "opt-blue", text: "Blue", votes: 0, authorVoterId: null },
      ],
    });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Red" }));

    await waitFor(() => {
      expect(mockVoteApi).toHaveBeenCalledWith("poll-1", "opt-red");
      expect(mockMarkVoted).toHaveBeenCalledWith("poll-1");
      expect(navigate).toHaveBeenCalledWith("/poll/poll-1/results");
    });
  });

  it("adds an option optimistically then replaces with server poll", async () => {
    localStorage.setItem("polopine:voter-id", "voter-abc");
    mockGetPoll.mockResolvedValue(samplePoll);
    mockAddOptionApi.mockResolvedValue({
      ...samplePoll,
      options: [
        ...samplePoll.options,
        {
          id: "opt-green",
          text: "Green",
          votes: 0,
          authorVoterId: "voter-abc",
        },
      ],
    });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ Add option" }));
    fireEvent.change(screen.getByLabelText("New option"), {
      target: { value: "Green" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add option" }));

    await waitFor(() => {
      expect(screen.getByText("Green")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockAddOptionApi).toHaveBeenCalledWith("poll-1", "Green");
    });
  });

  it("rolls back and shows error when add option fails", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);
    mockAddOptionApi.mockRejectedValue(new Error("Duplicate option"));

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ Add option" }));
    fireEvent.change(screen.getByLabelText("New option"), {
      target: { value: "Green" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add option" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Duplicate option",
    );
    expect(screen.queryByText("Green")).not.toBeInTheDocument();
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
