import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminDeletePoll,
  adminResetAll,
  adminResetPollVotes,
  listPolls,
} from "../api";
import type { Poll } from "../types";
import { Admin } from "./Admin";

vi.mock("../api", () => ({
  listPolls: vi.fn(),
  adminDeletePoll: vi.fn(),
  adminDeleteOption: vi.fn(),
  adminResetPollVotes: vi.fn(),
  adminSetAllowVoterOptions: vi.fn(),
  adminResetAll: vi.fn(),
}));

const mockListPolls = vi.mocked(listPolls);
const mockAdminDeletePoll = vi.mocked(adminDeletePoll);
const mockAdminResetPollVotes = vi.mocked(adminResetPollVotes);
const mockAdminResetAll = vi.mocked(adminResetAll);

const samplePolls: Poll[] = [
  {
    id: "poll-1",
    question: "Demo poll?",
    createdAt: "2026-01-01T00:00:00.000Z",
    allowVoterOptions: true,
    options: [
      { id: "a", text: "A", votes: 1, authorVoterId: null },
      { id: "b", text: "B", votes: 0, authorVoterId: null },
    ],
  },
];

const sessionStore = new Map<string, string>();

const sessionStorageMock: Storage = {
  getItem: (key: string) => (sessionStore.has(key) ? sessionStore.get(key)! : null),
  setItem: (key: string, value: string) => {
    sessionStore.set(key, value);
  },
  removeItem: (key: string) => {
    sessionStore.delete(key);
  },
  clear: () => {
    sessionStore.clear();
  },
  key: (index: number) => Array.from(sessionStore.keys())[index] ?? null,
  get length() {
    return sessionStore.size;
  },
};

describe("Admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStore.clear();
    Object.defineProperty(globalThis, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });
    mockListPolls.mockResolvedValue(samplePolls);
  });

  function renderAdmin() {
    return render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>,
    );
  }

  it("persists admin key to sessionStorage when saved", async () => {
    renderAdmin();

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "secret-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save key" }));

    expect(sessionStorage.getItem("polopine:admin-key")).toBe("secret-key");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Admin key saved for this tab session.",
    );
  });

  it("reset my view clears local vote markers", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");

    renderAdmin();

    await screen.findByRole("heading", { name: "Admin" });

    fireEvent.click(screen.getByRole("button", { name: "Reset my view" }));

    expect(localStorage.getItem("polopine:voted:poll-1")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Your view was reset");
  });

  it("blocks server actions when admin key is not saved", async () => {
    renderAdmin();

    await screen.findByText("Demo poll?");

    fireEvent.click(screen.getByRole("button", { name: "Reset votes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter and save an admin key first.",
    );
    expect(mockAdminResetPollVotes).not.toHaveBeenCalled();
  });

  it("runs reset votes when admin key is saved", async () => {
    sessionStorage.setItem("polopine:admin-key", "secret-key");
    mockAdminResetPollVotes.mockResolvedValue({
      ...samplePolls[0],
      options: [
        { id: "a", text: "A", votes: 0, authorVoterId: null },
        { id: "b", text: "B", votes: 0, authorVoterId: null },
      ],
    });

    renderAdmin();

    await screen.findByText("Demo poll?");

    fireEvent.click(screen.getByRole("button", { name: "Reset votes" }));

    await waitFor(() => {
      expect(mockAdminResetPollVotes).toHaveBeenCalledWith("poll-1", "secret-key");
    });
  });

  it("reset server to seed clears local markers and refreshes list", async () => {
    localStorage.setItem("polopine:voted:poll-1", "1");
    mockAdminResetAll.mockResolvedValue(samplePolls);

    renderAdmin();

    await screen.findByRole("heading", { name: "Admin" });

    fireEvent.click(
      screen.getByRole("button", { name: "Reset server to seed state" }),
    );

    await waitFor(() => {
      expect(mockAdminResetAll).toHaveBeenCalled();
      expect(localStorage.getItem("polopine:voted:poll-1")).toBeNull();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Server reset to seed state",
      );
    });
  });

  it("delete poll calls adminDeletePoll with saved key", async () => {
    sessionStorage.setItem("polopine:admin-key", "secret-key");
    mockAdminDeletePoll.mockResolvedValue();

    renderAdmin();

    await screen.findByText("Demo poll?");

    fireEvent.click(screen.getByRole("button", { name: "Delete poll" }));

    await waitFor(() => {
      expect(mockAdminDeletePoll).toHaveBeenCalledWith("poll-1", "secret-key");
    });
  });
});
