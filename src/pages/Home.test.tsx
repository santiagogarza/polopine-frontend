import { render, screen } from "@testing-library/react";
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

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the create CTA and poll cards from listPolls", async () => {
    mockListPolls.mockResolvedValue(samplePolls);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Create a poll" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("How much of a Cursor ninja are you?"),
    ).toBeInTheDocument();
    expect(screen.getByText("2 options · 10 votes")).toBeInTheDocument();
  });
});
