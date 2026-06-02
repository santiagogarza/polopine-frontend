import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPoll } from "../api";
import { CreatePoll } from "./CreatePoll";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../api", () => ({
  createPoll: vi.fn(),
}));

const mockCreatePoll = vi.mocked(createPoll);

describe("CreatePoll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderCreate() {
    return render(
      <MemoryRouter>
        <CreatePoll />
      </MemoryRouter>,
    );
  }

  it("shows validation error for empty question", () => {
    renderCreate();

    fireEvent.click(screen.getByRole("button", { name: "Create poll" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a question.");
    expect(mockCreatePoll).not.toHaveBeenCalled();
  });

  it("shows validation error for empty option", () => {
    renderCreate();

    fireEvent.change(screen.getByPlaceholderText("What should we order for lunch?"), {
      target: { value: "Lunch?" },
    });
    fireEvent.change(screen.getByLabelText("Option 1"), {
      target: { value: "Pizza" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create poll" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Every option must be non-empty.",
    );
  });

  it("does not remove option when only two remain", () => {
    renderCreate();

    const removeButtons = screen.getAllByRole("button", { name: /Remove option/ });
    expect(removeButtons[0]).toBeDisabled();
    expect(removeButtons[1]).toBeDisabled();
  });

  it("navigates to new poll after successful create", async () => {
    mockCreatePoll.mockResolvedValue({
      id: "new-poll",
      question: "Lunch?",
      createdAt: "2026-01-01T00:00:00.000Z",
      allowVoterOptions: true,
      options: [
        { id: "a", text: "Pizza", votes: 0, authorVoterId: null },
        { id: "b", text: "Salad", votes: 0, authorVoterId: null },
      ],
    });

    renderCreate();

    fireEvent.change(screen.getByPlaceholderText("What should we order for lunch?"), {
      target: { value: "Lunch?" },
    });
    fireEvent.change(screen.getByLabelText("Option 1"), {
      target: { value: "Pizza" },
    });
    fireEvent.change(screen.getByLabelText("Option 2"), {
      target: { value: "Salad" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create poll" }));

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith("Lunch?", ["Pizza", "Salad"]);
      expect(navigate).toHaveBeenCalledWith("/poll/new-poll");
    });
  });

  it("surfaces server error on failed create", async () => {
    mockCreatePoll.mockRejectedValue(new Error("question must be a non-empty string"));

    renderCreate();

    fireEvent.change(screen.getByPlaceholderText("What should we order for lunch?"), {
      target: { value: "Lunch?" },
    });
    fireEvent.change(screen.getByLabelText("Option 1"), {
      target: { value: "Pizza" },
    });
    fireEvent.change(screen.getByLabelText("Option 2"), {
      target: { value: "Salad" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create poll" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "question must be a non-empty string",
    );
  });
});
