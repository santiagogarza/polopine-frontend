import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllVoted } from "../voted";
import { ResetMyView } from "./ResetMyView";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../voted", () => ({
  clearAllVoted: vi.fn(),
}));

describe("ResetMyView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears voted markers and navigates to home", () => {
    render(
      <MemoryRouter>
        <ResetMyView />
      </MemoryRouter>,
    );

    expect(screen.getByText("Resetting your view…")).toBeInTheDocument();
    expect(clearAllVoted).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
