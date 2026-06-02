import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PollSortMenu } from "./PollSortMenu";

describe("PollSortMenu", () => {
  it("renders a sort trigger that exposes the current selection", () => {
    render(<PollSortMenu value="newest" onChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: /Sort polls/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAccessibleName(/current: Newest/);
  });

  it("opens the menu and calls onChange when an option is picked", () => {
    const onChange = vi.fn();
    render(<PollSortMenu value="newest" onChange={onChange} />);

    const trigger = screen.getByRole("button", { name: /Sort polls/ });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Most votes" }));
    expect(onChange).toHaveBeenCalledWith("most-votes");
  });

  it("marks the active option as checked", () => {
    render(<PollSortMenu value="alphabetical" onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Sort polls/ }));

    const selected = screen.getByRole("menuitemradio", {
      name: "Alphabetical",
    });
    expect(selected).toHaveAttribute("aria-checked", "true");

    const other = screen.getByRole("menuitemradio", { name: "Newest" });
    expect(other).toHaveAttribute("aria-checked", "false");
  });

  it("closes when clicking outside the menu", () => {
    render(
      <div>
        <button type="button">outside</button>
        <PollSortMenu value="newest" onChange={() => {}} />
      </div>,
    );

    const trigger = screen.getByRole("button", { name: /Sort polls/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
