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

  it("renders the add-option form when allowVoterOptions is true", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.getByLabelText("Add an option")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add option" }),
    ).toBeInTheDocument();
  });

  it("hides the add-option form and shows disabled notice when allowVoterOptions is false", async () => {
    mockGetPoll.mockResolvedValue({ ...samplePoll, allowVoterOptions: false });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Add an option")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "The creator has turned off voter-added options for this poll.",
      ),
    ).toBeInTheDocument();
  });

  it("optimistically inserts new option, POSTs to API, then replaces with server response", async () => {
    localStorage.setItem("polopine:voter-id", "voter-test");
    mockGetPoll.mockResolvedValue(samplePoll);
    const updated = {
      ...samplePoll,
      options: [
        ...samplePoll.options,
        {
          id: "opt-sushi",
          text: "Sushi",
          votes: 0,
          authorVoterId: "voter-test",
        },
      ],
    };
    let resolveAdd: (value: typeof updated) => void = () => {};
    mockAddOptionApi.mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add an option"), {
      target: { value: "Sushi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Add option" }));

    expect(screen.getByText("Sushi")).toBeInTheDocument();
    expect(mockAddOptionApi).toHaveBeenCalledWith("poll-1", "Sushi");

    resolveAdd(updated);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sushi/ }),
      ).toBeInTheDocument();
    });
  });

  it("rolls back optimistic insert and shows error on add failure", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);
    mockAddOptionApi.mockRejectedValue(new Error("Server hates this"));

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Add an option"), {
      target: { value: "Sushi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Add option" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server hates this",
    );
    expect(screen.queryByRole("button", { name: /Sushi/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Add an option")).toHaveValue("Sushi");
  });

  it("client-side blocks case-insensitive duplicates and over-length input", async () => {
    mockGetPoll.mockResolvedValue(samplePoll);

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();

    const input = screen.getByLabelText("Add an option");
    const submit = screen.getByRole("button", { name: "+ Add option" });

    fireEvent.change(input, { target: { value: "  red  " } });
    expect(submit).toBeDisabled();
    expect(screen.getByText("That option already exists.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "x".repeat(81) } });
    expect(submit).toBeDisabled();
    expect(
      screen.getByText("Trim to 80 characters or fewer."),
    ).toBeInTheDocument();
  });

  it("shows 'added by you' badge for voter-added options that match the local voter id", async () => {
    localStorage.setItem("polopine:voter-id", "voter-me");
    mockGetPoll.mockResolvedValue({
      ...samplePoll,
      options: [
        ...samplePoll.options,
        {
          id: "opt-mine",
          text: "Mine",
          votes: 0,
          authorVoterId: "voter-me",
        },
        {
          id: "opt-theirs",
          text: "Theirs",
          votes: 0,
          authorVoterId: "voter-other",
        },
      ],
    });

    renderVote();

    expect(await screen.findByText("Favorite color?")).toBeInTheDocument();
    expect(screen.getByLabelText("added by you")).toBeInTheDocument();
    const theirsBtn = screen.getByRole("button", { name: /Theirs/ });
    expect(theirsBtn).toHaveAttribute("title", "added by a voter");
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
