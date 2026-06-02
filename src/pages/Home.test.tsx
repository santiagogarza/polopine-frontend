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
];

const sortablePolls: Poll[] = [
  {
    id: "poll-old",
    question: "Zebra snacks",
    createdAt: "2026-06-01T12:00:00.000Z",
    options: [
      { id: "a", text: "Hay", votes: 1 },
      { id: "b", text: "Apples", votes: 0 },
    ],
  },
  {
    id: "poll-new",
    question: "Apple favorites",
    createdAt: "2026-06-03T12:00:00.000Z",
    options: [
      { id: "a", text: "Red", votes: 3 },
      { id: "b", text: "Green", votes: 5 },
    ],
  },
  {
    id: "poll-middle",
    question: "Mango ripeness",
    createdAt: "2026-06-02T12:00:00.000Z",
    options: [
      { id: "a", text: "Firm", votes: 1 },
      { id: "b", text: "Soft", votes: 2 },
    ],
  },
];

function renderHome() {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

function pollOrder(): string[] {
  const list = screen.getByRole("list", { name: "Polls" });
  return within(list)
    .getAllByRole("listitem")
    .map((item) => {
      const question = item.querySelector(".poll-card-question");
      return question?.textContent ?? "";
    });
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the create CTA, join QR, and poll cards from listPolls", async () => {
    mockListPolls.mockResolvedValue(samplePolls);

    renderHome();

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

    renderHome();

    expect(
      await screen.findByText("How much of a Cursor ninja are you?"),
    ).toBeInTheDocument();
    expect(screen.getByText("You voted")).toBeInTheDocument();
    expect(screen.getByLabelText("Over a year: 70%")).toBeInTheDocument();
    expect(screen.getByLabelText("Brand new: 30%")).toBeInTheDocument();

    const topBar = screen.getByTestId("voted-bar-b");
    expect(topBar).toHaveStyle({ width: "70%" });
  });

  it("sorts polls from the section header menu and persists the selection", async () => {
    mockListPolls.mockResolvedValue(sortablePolls);

    renderHome();

    await screen.findByText("Apple favorites");
    expect(pollOrder()).toEqual([
      "Apple favorites",
      "Mango ripeness",
      "Zebra snacks",
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: "Sort polls, current: Newest" }),
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Newest" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.getByRole("menuitemradio", { name: "Oldest" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "Most votes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "Least votes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: "Alphabetical" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Least votes" }));

    expect(localStorage.getItem("polopine:poll-sort")).toBe("least-votes");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(pollOrder()).toEqual([
      "Zebra snacks",
      "Mango ripeness",
      "Apple favorites",
    ]);
    expect(
      screen.getByRole("button", { name: "Sort polls, current: Least votes" }),
    ).toBeInTheDocument();
  });

  it("uses the locally saved sort option on reload", async () => {
    localStorage.setItem("polopine:poll-sort", "oldest");
    mockListPolls.mockResolvedValue(sortablePolls);

    renderHome();

    await screen.findByText("Apple favorites");
    expect(pollOrder()).toEqual([
      "Zebra snacks",
      "Mango ripeness",
      "Apple favorites",
    ]);
    expect(
      screen.getByRole("button", { name: "Sort polls, current: Oldest" }),
    ).toBeInTheDocument();
  });
});
