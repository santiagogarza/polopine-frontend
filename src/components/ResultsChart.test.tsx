import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsChart } from "./ResultsChart";
import type { PollResults } from "../types";

const sampleResults: PollResults = {
  question: "Favorite color?",
  totalVotes: 10,
  options: [
    { id: "a", text: "Red", votes: 6 },
    { id: "b", text: "Blue", votes: 4 },
    { id: "c", text: "Green", votes: 0 },
  ],
};

describe("ResultsChart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders option labels, vote counts, percentages, and bar widths", () => {
    render(<ResultsChart results={sampleResults} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText("1", { selector: ".results-rank" })).toBeInTheDocument();
    expect(screen.getByText("2", { selector: ".results-rank" })).toBeInTheDocument();
    expect(screen.getByText("3", { selector: ".results-rank" })).toBeInTheDocument();

    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();

    expect(screen.getByLabelText("Red: 60%")).toBeInTheDocument();
    expect(screen.getByLabelText("Blue: 40%")).toBeInTheDocument();
    expect(screen.getByLabelText("Green: 0%")).toBeInTheDocument();

    const redBar = screen.getByTestId("bar-a");
    const blueBar = screen.getByTestId("bar-b");
    const greenBar = screen.getByTestId("bar-c");

    expect(redBar).toHaveStyle({ width: "60%" });
    expect(blueBar).toHaveStyle({ width: "40%" });
    expect(greenBar).toHaveStyle({ width: "0%" });
  });
});
