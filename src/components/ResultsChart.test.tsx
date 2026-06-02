import { render, screen, waitFor } from "@testing-library/react";
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
  it("renders option labels, vote counts, percentages, and final bar widths", async () => {
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

    await waitFor(() => {
      expect(redBar).toHaveStyle({ width: "60%" });
    });
    expect(blueBar).toHaveStyle({ width: "40%" });
    expect(greenBar).toHaveStyle({ width: "0%" });
  });

  it("starts bars at width 0 before animating in on mount", () => {
    render(<ResultsChart results={sampleResults} />);

    expect(screen.getByTestId("bar-a")).toHaveStyle({ width: "0%" });
    expect(screen.getByTestId("bar-b")).toHaveStyle({ width: "0%" });
    expect(screen.getByTestId("bar-c")).toHaveStyle({ width: "0%" });
  });

  it("staggers bar animation/transition delays by 40ms per row", () => {
    render(<ResultsChart results={sampleResults} />);

    expect(screen.getByTestId("bar-a")).toHaveStyle({
      animationDelay: "0ms",
      transitionDelay: "0ms",
    });
    expect(screen.getByTestId("bar-b")).toHaveStyle({
      animationDelay: "40ms",
      transitionDelay: "40ms",
    });
    expect(screen.getByTestId("bar-c")).toHaveStyle({
      animationDelay: "80ms",
      transitionDelay: "80ms",
    });
  });
});
