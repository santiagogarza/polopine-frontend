import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_KEY_STORAGE } from "../adminAuth";
import { verifyAdminKey } from "../api";
import { AdminFooterAuth } from "./AdminFooterAuth";

vi.mock("../api", () => ({
  verifyAdminKey: vi.fn(),
}));

const mockVerifyAdminKey = vi.mocked(verifyAdminKey);

describe("AdminFooterAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders the admin login modal from the subtle footer trigger", () => {
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));

    expect(
      screen.getByRole("dialog", { name: "Admin sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Admin key")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("saves a valid key and closes the modal", async () => {
    mockVerifyAdminKey.mockResolvedValue(true);
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: " secret-key " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockVerifyAdminKey).toHaveBeenCalledWith("secret-key");
      expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBe("secret-key");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Log out" })).toHaveFocus();
  });

  it("shows a friendly error for an invalid key", async () => {
    mockVerifyAdminKey.mockResolvedValue(false);
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "wrong-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wrong key, try again.",
    );
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
    expect(
      screen.getByRole("dialog", { name: "Admin sign in" }),
    ).toBeInTheDocument();
  });

  it("shows the rate-limit message when verification throws", async () => {
    mockVerifyAdminKey.mockRejectedValue(new Error("Too many requests"));
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "any-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts. Try again in a few minutes.",
    );
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
  });

  it("shows a generic error for non-rate-limit verification failures", async () => {
    mockVerifyAdminKey.mockRejectedValue({
      message: "too many upstream failures",
      status: 503,
    });
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "any-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not verify the admin key. Try again.",
    );
  });

  it("keeps keyboard focus inside the modal and restores it on close", () => {
    render(<AdminFooterAuth />);

    const trigger = screen.getByRole("button", { name: "Admin" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Admin sign in" });
    const closeButton = screen.getByRole("button", {
      name: "Close admin login",
    });
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    closeButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(submitButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });

  it("logs out by clearing the saved key", () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, "secret-key");
    render(<AdminFooterAuth />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });
});
