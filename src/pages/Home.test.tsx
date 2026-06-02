import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPolls } from "../api";
import type { Poll } from "../types";
import { Home } from "./Home";

vi.mock("../api", () => ({
  listPolls: vi.fn(),
}));

const mockListPolls = vi.mocked(listPolls);

const samplePolls: Poll[] = [
  {
    id: "poll-1",
    question: "How much of a Cursor ninja are you?",
    createdAt: "2026-06-01T12:00:00.000Z",
    options: [
      { id: "a", text: "Brand new", votes: 3 },
      { id: "b", text: "Over a year", votes: 7 },
    ],
  },
  {
    id: "poll-2",
    question: "Alpha first?",
    createdAt: "2026-05-28T08:00:00.000Z",
    options: [
      { id: "a", text: "Yes", votes: 1 },
      { id: "b", text: "No", votes: 0 },
    ],
  },
  {
    id: "poll-3",
    question: "Zulu last?",
    createdAt: "2026-06-03T18:00:00.000Z",
    options: [
      { id: "a", text: "Yes", votes: 20 },
      { id: "b", text: "No", votes: 0 },
    ],
  },
];

function pollQuestionsInOrder(): string[] {
  const list = screen.getByRole("list");
  return within(list)
    .getAllByRole("button")
    .map((button) => button.textContent?.split(/\d+ options/)[0]?.trim() ?? "");
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the create CTA, join QR, and poll cards from listPolls", async () => {
    mockListPolls.mockResolvedValue(samplePolls);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Join the demo!" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("How much of a Cursor ninja are you?"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 options · 10 votes")).toBeInTheDocument();
  });

  it("renders a voted poll card with mini bars and vote total", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");
    mockListPolls.mockResolvedValue(samplePolls);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("How much of a Cursor ninja are you?"),
    ).toBeInTheDocument();
    expect(screen.getByText("You voted")).toBeInTheDocument();
    expect(screen.getByLabelText("Over a year: 70%")).toBeInTheDocument();
    expect(screen.getByLabelText("Brand new: 30%")).toBeInTheDocument();

    const topBar = screen.getByTestId("voted-bar-b");
    expect(topBar).toHaveStyle({ width: "70%" });
  });

  it("shows a sort control on the Polls section header", async () => {
    mockListPolls.mockResolvedValue(samplePolls);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await screen.findByText("How much of a Cursor ninja are you?");
    expect(screen.getByRole("button", { name: "Sort polls" })).toBeInTheDocument();
  });

  it("re-orders polls when a sort option is chosen and persists it", async () => {
    mockListPolls.mockResolvedValue(samplePolls);

    const { unmount } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await screen.findByText("Zulu last?");
    expect(pollQuestionsInOrder()).toEqual([
      "Zulu last?",
      "How much of a Cursor ninja are you?",
      "Alpha first?",
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Sort polls" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Alphabetical" }));

    expect(pollQuestionsInOrder()).toEqual([
      "Alpha first?",
      "How much of a Cursor ninja are you?",
      "Zulu last?",
    ]);
    expect(localStorage.getItem("polopine:poll-sort")).toBe("alphabetical");

    unmount();

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await screen.findByText("Alpha first?");
    expect(pollQuestionsInOrder()).toEqual([
      "Alpha first?",
      "How much of a Cursor ninja are you?",
      "Zulu last?",
    ]);
  });
});
