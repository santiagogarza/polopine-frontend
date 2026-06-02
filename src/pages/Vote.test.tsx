import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addOption, getPoll, vote as voteApi } from "../api";
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
  addOption: vi.fn(),
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
const mockAddOption = vi.mocked(addOption);
const mockVoteApi = vi.mocked(voteApi);
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

  it("optimistically adds an option and can vote for the saved option", async () => {
    localStorage.setItem("polopine:voter-id", "voter-1");
    mockGetPoll.mockResolvedValue(samplePoll);
    const updatedPoll: Poll = {
      ...samplePoll,
      options: [
        ...samplePoll.options,
        {
          id: "opt-green",
          text: "Green",
          votes: 0,
          authorVoterId: "voter-1",
        },
      ],
    };
    mockAddOption.mockResolvedValue(updatedPoll);
    mockVoteApi.mockResolvedValue({
      ...updatedPoll,
      options: updatedPoll.options.map((option) =>
        option.id === "opt-green" ? { ...option, votes: 1 } : option,
      ),
    });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add option"), {
      target: { value: "Green" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Green")).toBeInTheDocument();
    expect(screen.getByText("added by you")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAddOption).toHaveBeenCalledWith("poll-1", "Green");
    });

    fireEvent.click(screen.getByRole("button", { name: /Green/ }));

    await waitFor(() => {
      expect(mockVoteApi).toHaveBeenCalledWith("poll-1", "opt-green");
      expect(mockMarkVoted).toHaveBeenCalledWith("poll-1");
    });
  });

  it("shows duplicate-aware client validation", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add option"), {
      target: { value: " red " },
    });

    expect(screen.getByText("That option already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("shows the 80 character cap before submitting", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add option"), {
      target: { value: "x".repeat(81) },
    });

    expect(screen.getByText("Use 80 characters or fewer.")).toBeInTheDocument();
    expect(screen.getByText("81/80")).toBeInTheDocument();
  });

  it("rolls back an optimistic option when the server rejects it", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);
    mockAddOption.mockRejectedValue(new Error("Option already exists"));

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add option"), {
      target: { value: "Green" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Green")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Green")).not.toBeInTheDocument();
      expect(screen.getByText("Option already exists")).toBeInTheDocument();
    });
  });

  it("hides the add option form when voter-added options are disabled", async () => {
    mockGetPoll.mockResolvedValue({
      ...samplePoll,
      allowVoterOptions: false,
    });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Add option")).not.toBeInTheDocument();
  });
});
