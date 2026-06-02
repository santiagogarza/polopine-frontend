import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PollSortMenu } from "./PollSortMenu";

describe("PollSortMenu", () => {
  it("opens the sort menu and reports selection", () => {
    const onChange = vi.fn();

    render(<PollSortMenu value="newest" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Sort polls" }));

    expect(screen.getByRole("menu", { name: "Sort polls" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "Newest" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Alphabetical" }));
    expect(onChange).toHaveBeenCalledWith("alphabetical");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on Escape", () => {
    render(<PollSortMenu value="newest" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Sort polls" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
