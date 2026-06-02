import { useEffect, useRef, useState } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
  selectedOptionId?: string | null;
  switchingOptionId?: string | null;
  onSwitchVote?: (optionId: string) => void;
}

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

export function ResultsChart({
  results,
  selectedOptionId = null,
  switchingOptionId = null,
  onSwitchVote,
}: ResultsChartProps) {
  const { options, totalVotes } = results;
  const [revealedOptionId, setRevealedOptionId] = useState<string | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  function clearRevealTimer() {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }

  function startTouchReveal(optionId: string, switchable: boolean) {
    if (!switchable) {
      return;
    }
    clearRevealTimer();
    revealTimerRef.current = window.setTimeout(() => {
      setRevealedOptionId(optionId);
      revealTimerRef.current = null;
    }, 450);
  }

  function stopTouchReveal() {
    clearRevealTimer();
  }

  useEffect(() => {
    return () => {
      clearRevealTimer();
    };
  }, []);

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const isSelected = option.id === selectedOptionId;
        const isSwitchable = Boolean(onSwitchVote) && !isSelected;
        const isRevealed = revealedOptionId === option.id;
        return (
          <div
            key={option.id}
            className={[
              "results-row",
              isSelected ? "results-row-selected" : "",
              isSwitchable ? "results-row-switchable" : "",
              isRevealed ? "results-row-revealed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="listitem"
            onPointerDown={() => startTouchReveal(option.id, isSwitchable)}
            onPointerUp={stopTouchReveal}
            onPointerCancel={stopTouchReveal}
            onPointerLeave={stopTouchReveal}
          >
            <div className="results-row-topline">
              <div className="results-row-main">
                <div className="results-row-header">
                  <span className="results-label">
                    <span className="results-rank" aria-hidden="true">
                      {rank}
                    </span>
                    {option.text}
                  </span>
                  <span className="results-meta">
                    {option.votes} {option.votes === 1 ? "vote" : "votes"} ·{" "}
                    {pct}%
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
                    style={{ width: `${pct}%` }}
                    data-testid={`bar-${option.id}`}
                  />
                </div>
              </div>
              <div className="results-row-action">
                {isSelected ? (
                  <span className="voted-marker" aria-label={`${option.text} is your vote`}>
                    Your vote
                  </span>
                ) : null}
                {isSwitchable ? (
                  <button
                    type="button"
                    className="vote-switch-button"
                    onClick={() => onSwitchVote?.(option.id)}
                    disabled={switchingOptionId !== null}
                    aria-label={`Vote for ${option.text} instead`}
                  >
                    {switchingOptionId === option.id
                      ? "Switching..."
                      : "Vote for this instead"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
