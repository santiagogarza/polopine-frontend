import type { CSSProperties } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
}

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

function barStyle(pct: number, index: number): CSSProperties {
  return {
    "--bar-delay": `${index * 40}ms`,
    width: `${pct}%`,
  } as CSSProperties;
}

export function ResultsChart({ results }: ResultsChartProps) {
  const { options, totalVotes } = results;

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        return (
          <div key={option.id} className="results-row" role="listitem">
            <div className="results-row-header">
              <span className="results-label">
                <span className="results-rank" aria-hidden="true">
                  {rank}
                </span>
                {option.text}
              </span>
              <span className="results-meta">
                {option.votes} {option.votes === 1 ? "vote" : "votes"} · {pct}%
              </span>
            </div>
            <div
              className="results-bar-track"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${option.text}: ${pct}%`}
            >
              <div
                className="results-bar-fill"
                style={barStyle(pct, index)}
                data-testid={`bar-${option.id}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
