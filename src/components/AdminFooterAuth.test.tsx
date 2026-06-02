import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminFooterAuth } from "./AdminFooterAuth";
import { verifyAdminKey } from "../api";

vi.mock("../api", () => ({
  verifyAdminKey: vi.fn(),
}));

const mockVerify = vi.mocked(verifyAdminKey);

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

beforeEach(() => {
  vi.clearAllMocks();
  sessionStore.clear();
  Object.defineProperty(globalThis, "sessionStorage", {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
});

describe("AdminFooterAuth", () => {
  it("shows a subtle 'Admin' entry point when signed out", () => {
    render(<AdminFooterAuth />);
    const link = screen.getByRole("button", { name: /admin sign in/i });
    expect(link).toHaveTextContent("Admin");
    expect(link).toHaveClass("admin-footer-link");
  });

  it("opens the sign-in modal when the footer link is clicked", () => {
    render(<AdminFooterAuth />);
    fireEvent.click(screen.getByRole("button", { name: /admin sign in/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText("Admin key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("saves the key to sessionStorage and closes the modal on a valid key", async () => {
    mockVerify.mockResolvedValue(true);
    render(<AdminFooterAuth />);
    fireEvent.click(screen.getByRole("button", { name: /admin sign in/i }));

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "good-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith("good-key");
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(sessionStorage.getItem("polopine:admin-key")).toBe("good-key");
    expect(
      screen.getByRole("button", { name: /admin log out/i }),
    ).toHaveTextContent("Log out");
  });

  it("shows a wrong-key error when verifyAdminKey returns false", async () => {
    mockVerify.mockResolvedValue(false);
    render(<AdminFooterAuth />);
    fireEvent.click(screen.getByRole("button", { name: /admin sign in/i }));

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "bad-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wrong key, try again.",
    );
    expect(sessionStorage.getItem("polopine:admin-key")).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a rate-limit error when verifyAdminKey rejects with a 429-like message", async () => {
    mockVerify.mockRejectedValue(new Error("Too many requests"));
    render(<AdminFooterAuth />);
    fireEvent.click(screen.getByRole("button", { name: /admin sign in/i }));

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "any-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts. Try again in a few minutes.",
    );
    expect(sessionStorage.getItem("polopine:admin-key")).toBeNull();
  });

  it("renders a 'Log out' entry when already signed in", () => {
    sessionStorage.setItem("polopine:admin-key", "preloaded");
    render(<AdminFooterAuth />);
    expect(
      screen.getByRole("button", { name: /admin log out/i }),
    ).toHaveTextContent("Log out");
  });

  it("clears sessionStorage and reverts to 'Admin' when logged out", () => {
    sessionStorage.setItem("polopine:admin-key", "preloaded");
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: /admin log out/i }));

    expect(sessionStorage.getItem("polopine:admin-key")).toBeNull();
    expect(
      screen.getByRole("button", { name: /admin sign in/i }),
    ).toHaveTextContent("Admin");
  });

  it("closes the modal when the Cancel button is clicked", () => {
    render(<AdminFooterAuth />);
    fireEvent.click(screen.getByRole("button", { name: /admin sign in/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("rejects empty submissions without hitting the API", async () => {
    render(<AdminFooterAuth />);
    fireEvent.click(screen.getByRole("button", { name: /admin sign in/i }));
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter your admin key.",
    );
    expect(mockVerify).not.toHaveBeenCalled();
  });
});
