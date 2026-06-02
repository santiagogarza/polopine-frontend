import { useRef, useState } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
  /** Option the current voter picked; enables change-vote affordances. */
  selectedOptionId?: string | null;
  onSwitchVote?: (optionId: string) => void;
  switchingOptionId?: string | null;
}

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

const LONG_PRESS_MS = 450;

export function ResultsChart({
  results,
  selectedOptionId = null,
  onSwitchVote,
  switchingOptionId = null,
}: ResultsChartProps) {
  const { options, totalVotes } = results;
  const [revealedOptionId, setRevealedOptionId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startLongPress(optionId: string) {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      setRevealedOptionId(optionId);
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  }

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const isSelected = selectedOptionId === option.id;
        const canSwitch = Boolean(onSwitchVote) && !isSelected;
        const isRevealed = revealedOptionId === option.id;
        const isSwitching = switchingOptionId === option.id;

        return (
          <div
            key={option.id}
            className={[
              "results-row",
              isSelected ? "results-row--yours" : "",
              canSwitch ? "results-row--switchable" : "",
              isRevealed ? "results-row--reveal-switch" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="listitem"
            onTouchStart={
              canSwitch
                ? () => {
                    startLongPress(option.id);
                  }
                : undefined
            }
            onTouchEnd={
              canSwitch
                ? () => {
                    clearLongPressTimer();
                  }
                : undefined
            }
            onTouchCancel={
              canSwitch
                ? () => {
                    clearLongPressTimer();
                    setRevealedOptionId(null);
                  }
                : undefined
            }
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
            <div className="results-row-body">
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
              {canSwitch ? (
                <button
                  type="button"
                  className="results-switch-btn"
                  disabled={Boolean(switchingOptionId)}
                  aria-busy={isSwitching}
                  onClick={() => onSwitchVote?.(option.id)}
                >
                  {isSwitching ? "Switching…" : "Vote for this instead"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
