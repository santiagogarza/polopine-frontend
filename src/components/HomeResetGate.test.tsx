import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllVoted } from "../voted";
import { HomeResetGate } from "./HomeResetGate";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../pages/Home", () => ({
  Home: () => <div>Home page</div>,
}));

vi.mock("../voted", () => ({
  clearAllVoted: vi.fn(),
}));

describe("HomeResetGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears voted markers and navigates home when ?reset=me", () => {
    render(
      <MemoryRouter initialEntries={["/?reset=me"]}>
        <Routes>
          <Route path="/" element={<HomeResetGate />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Resetting your view…")).toBeInTheDocument();
    expect(clearAllVoted).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("renders Home when reset query param is absent", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomeResetGate />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(clearAllVoted).not.toHaveBeenCalled();
  });
});
