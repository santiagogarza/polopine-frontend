import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_KEY_STORAGE } from "../adminAuth";
import { verifyAdminKey } from "../api";
import { AdminFooterAuth } from "./AdminFooterAuth";

vi.mock("../api", () => ({
  verifyAdminKey: vi.fn(),
}));

const mockVerifyAdminKey = vi.mocked(verifyAdminKey);

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

function renderFooter() {
  return render(
    <MemoryRouter>
      <AdminFooterAuth />
    </MemoryRouter>,
  );
}

describe("AdminFooterAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStore.clear();
    Object.defineProperty(globalThis, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });
  });

  it("renders subtle Admin entry when not authenticated", () => {
    renderFooter();

    expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin panel" })).not.toBeInTheDocument();
  });

  it("opens login modal when Admin is clicked", () => {
    renderFooter();

    fireEvent.click(screen.getByRole("button", { name: /admin/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Admin key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("saves key and closes modal on valid verification", async () => {
    mockVerifyAdminKey.mockResolvedValue(true);

    renderFooter();
    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "good-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockVerifyAdminKey).toHaveBeenCalledWith("good-key");
      expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBe("good-key");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin panel" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("shows wrong-key error on 401 verification", async () => {
    mockVerifyAdminKey.mockResolvedValue(false);

    renderFooter();
    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "bad-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wrong key, try again.",
    );
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows rate-limit error when verification throws", async () => {
    mockVerifyAdminKey.mockRejectedValue(new Error("Too many requests"));

    renderFooter();
    fireEvent.click(screen.getByRole("button", { name: /admin/i }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "any-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts. Try again in a few minutes.",
    );
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
  });

  it("logout clears sessionStorage and restores Admin entry", () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, "secret-key");

    renderFooter();

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
    expect(screen.getByRole("button", { name: /admin/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin panel" })).not.toBeInTheDocument();
  });
});
