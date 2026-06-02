import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccentColorPicker } from "./AccentColorPicker";

describe("AccentColorPicker", () => {
  it("renders 8 color swatches with orange selected by default", () => {
    const onChange = vi.fn();
    render(<AccentColorPicker value="orange" onChange={onChange} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(8);
    expect(screen.getByRole("radio", { name: /Orange/i })).toBeChecked();
  });

  it("calls onChange when a different swatch is selected", () => {
    const onChange = vi.fn();
    render(<AccentColorPicker value="orange" onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /Teal/i }));

    expect(onChange).toHaveBeenCalledWith("teal");
  });
});
