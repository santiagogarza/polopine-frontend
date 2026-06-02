import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  it("renders option labels, vote counts, percentages, and bar widths", () => {
    render(<ResultsChart results={sampleResults} />);

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
    expect(redBar.style.getPropertyValue("--bar-delay")).toBe("0ms");
    expect(blueBar.style.getPropertyValue("--bar-delay")).toBe("40ms");
    expect(greenBar.style.getPropertyValue("--bar-delay")).toBe("80ms");
  });

  it("updates existing bar widths when vote totals change", () => {
    const { rerender } = render(<ResultsChart results={sampleResults} />);

    const redBar = screen.getByTestId("bar-a");
    const blueBar = screen.getByTestId("bar-b");

    rerender(
      <ResultsChart
        results={{
          ...sampleResults,
          totalVotes: 12,
          options: [
            { id: "a", text: "Red", votes: 6 },
            { id: "b", text: "Blue", votes: 6 },
            { id: "c", text: "Green", votes: 0 },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("bar-a")).toBe(redBar);
    expect(screen.getByTestId("bar-b")).toBe(blueBar);
    expect(redBar).toHaveStyle({ width: "50%" });
    expect(blueBar).toHaveStyle({ width: "50%" });
  });
});
