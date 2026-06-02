import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
}

const STAGGER_MS = 40;

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

export function ResultsChart({ results }: ResultsChartProps) {
  const { options, totalVotes } = results;
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Two rAFs guarantee the browser paints with width: 0% on the first
    // frame, then the second render transitions to the real width — which
    // is what triggers the spring CSS transition.
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setAnimateIn(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const delay = `${index * STAGGER_MS}ms`;
        const fillStyle: CSSProperties = {
          width: animateIn ? `${pct}%` : "0%",
          animationDelay: delay,
          transitionDelay: delay,
        };
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
                style={fillStyle}
                data-testid={`bar-${option.id}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
