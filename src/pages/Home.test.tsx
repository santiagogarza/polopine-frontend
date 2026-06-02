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

const multiPolls: Poll[] = [
  {
    id: "p-banana",
    question: "Banana split?",
    createdAt: "2026-06-01T10:00:00.000Z",
    options: [
      { id: "1", text: "Yes", votes: 2 },
      { id: "2", text: "No", votes: 3 },
    ],
  },
  {
    id: "p-apple",
    question: "Apple pie?",
    createdAt: "2026-06-02T10:00:00.000Z",
    options: [
      { id: "1", text: "Yes", votes: 0 },
      { id: "2", text: "No", votes: 2 },
    ],
  },
  {
    id: "p-cherry",
    question: "Cherry cola?",
    createdAt: "2026-06-03T10:00:00.000Z",
    options: [
      { id: "1", text: "Yes", votes: 10 },
      { id: "2", text: "No", votes: 0 },
    ],
  },
];

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

  it("re-orders polls when a new sort option is chosen", async () => {
    mockListPolls.mockResolvedValue(multiPolls);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await screen.findByText("Cherry cola?");

    const list = screen.getByRole("list");
    const initialQuestions = within(list)
      .getAllByRole("button")
      .map((btn) => btn.querySelector(".poll-card-question")?.textContent);
    expect(initialQuestions).toEqual([
      "Cherry cola?",
      "Apple pie?",
      "Banana split?",
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Sort polls/ }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Alphabetical" }));

    const sortedQuestions = within(screen.getByRole("list"))
      .getAllByRole("button")
      .map((btn) => btn.querySelector(".poll-card-question")?.textContent);
    expect(sortedQuestions).toEqual([
      "Apple pie?",
      "Banana split?",
      "Cherry cola?",
    ]);
  });

  it("restores the persisted sort selection on reload", async () => {
    localStorage.setItem("polopine:pollSort", "least-votes");
    mockListPolls.mockResolvedValue(multiPolls);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await screen.findByText("Cherry cola?");

    const questions = within(screen.getByRole("list"))
      .getAllByRole("button")
      .map((btn) => btn.querySelector(".poll-card-question")?.textContent);
    expect(questions).toEqual([
      "Apple pie?",
      "Banana split?",
      "Cherry cola?",
    ]);

    expect(
      screen.getByRole("button", { name: /current: Least votes/ }),
    ).toBeInTheDocument();
  });
});
