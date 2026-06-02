import { useCallback, useRef, useState } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
  selectedOptionId?: string | null;
  onChangeVote?: (optionId: string) => void;
  changingVote?: boolean;
}

const LONG_PRESS_MS = 500;

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

export function ResultsChart({
  results,
  selectedOptionId = null,
  onChangeVote,
  changingVote = false,
}: ResultsChartProps) {
  const { options, totalVotes } = results;
  const [revealedOptionId, setRevealedOptionId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOptionId = useRef<string | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOptionId.current = null;
  }, []);

  const canChangeVote = Boolean(onChangeVote && selectedOptionId);

  function handleChangeVote(optionId: string) {
    if (!onChangeVote || changingVote || optionId === selectedOptionId) {
      return;
    }
    onChangeVote(optionId);
    setRevealedOptionId(null);
  }

  function startLongPress(optionId: string) {
    if (!canChangeVote || optionId === selectedOptionId) {
      return;
    }
    clearLongPress();
    longPressOptionId.current = optionId;
    longPressTimer.current = setTimeout(() => {
      setRevealedOptionId(optionId);
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  }

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const isSelected = selectedOptionId === option.id;
        const isChangeable =
          canChangeVote && !isSelected && Boolean(selectedOptionId);
        const rowClass = [
          "results-row",
          isSelected ? "results-row--selected" : "",
          isChangeable ? "results-row--changeable" : "",
          revealedOptionId === option.id ? "results-row--affordance-visible" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={option.id}
            className={rowClass}
            role="listitem"
            onPointerDown={(event) => {
              if (event.pointerType === "touch" && isChangeable) {
                startLongPress(option.id);
              }
            }}
            onPointerUp={clearLongPress}
            onPointerCancel={clearLongPress}
            onPointerLeave={clearLongPress}
          >
            <div className="results-row-header">
              <span className="results-label">
                <span className="results-rank" aria-hidden="true">
                  {rank}
                </span>
                {option.text}
                {isSelected ? (
                  <span className="results-your-vote">Your vote</span>
                ) : null}
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
                style={{ width: `${pct}%` }}
                data-testid={`bar-${option.id}`}
              />
            </div>
            {isChangeable ? (
              <button
                type="button"
                className="results-change-vote"
                onClick={() => handleChangeVote(option.id)}
                disabled={changingVote}
                aria-label={`Vote for ${option.text} instead`}
              >
                Vote for this instead
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
