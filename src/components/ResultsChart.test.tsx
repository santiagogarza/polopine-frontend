import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  });

  it("does not render switch affordance without selectedOptionId + handler", () => {
    render(<ResultsChart results={sampleResults} />);
    expect(screen.queryByTestId("switch-vote-a")).not.toBeInTheDocument();
    expect(screen.queryByTestId("switch-vote-b")).not.toBeInTheDocument();
  });

  it("renders the voted marker on the selected option only", () => {
    render(
      <ResultsChart
        results={sampleResults}
        selectedOptionId="a"
        onSwitchVote={() => {}}
      />,
    );

    expect(screen.getByLabelText("Your vote")).toBeInTheDocument();
    // Selected option has no switch affordance.
    expect(screen.queryByTestId("switch-vote-a")).not.toBeInTheDocument();
    // Non-selected options do.
    expect(screen.getByTestId("switch-vote-b")).toBeInTheDocument();
    expect(screen.getByTestId("switch-vote-c")).toBeInTheDocument();
  });

  it("calls onSwitchVote when a non-selected option's affordance is clicked", () => {
    const onSwitchVote = vi.fn();
    render(
      <ResultsChart
        results={sampleResults}
        selectedOptionId="a"
        onSwitchVote={onSwitchVote}
      />,
    );

    fireEvent.click(screen.getByTestId("switch-vote-b"));

    expect(onSwitchVote).toHaveBeenCalledWith("b");
  });

  it("disables the switch affordance while a switch is in flight", () => {
    render(
      <ResultsChart
        results={sampleResults}
        selectedOptionId="a"
        onSwitchVote={() => {}}
        switching
      />,
    );

    expect(screen.getByTestId("switch-vote-b")).toBeDisabled();
    expect(screen.getByTestId("switch-vote-c")).toBeDisabled();
  });
});
