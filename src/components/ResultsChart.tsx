import { useCallback, useRef, useState } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
  /** Option id the current voter picked, when known. */
  myOptionId?: string | null;
  /** Called when the voter chooses a different option from the results view. */
  onSwitchVote?: (optionId: string) => void;
  switching?: boolean;
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
  myOptionId = null,
  onSwitchVote,
  switching = false,
}: ResultsChartProps) {
  const { options, totalVotes } = results;
  const canSwitch = Boolean(onSwitchVote && myOptionId);
  const [revealedOptionId, setRevealedOptionId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startLongPress = useCallback(
    (optionId: string) => {
      if (!canSwitch || optionId === myOptionId) {
        return;
      }
      clearLongPressTimer();
      longPressTimer.current = window.setTimeout(() => {
        setRevealedOptionId(optionId);
        longPressTimer.current = null;
      }, LONG_PRESS_MS);
    },
    [canSwitch, clearLongPressTimer, myOptionId],
  );

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const isMyVote = myOptionId === option.id;
        const isOtherOption = canSwitch && !isMyVote;
        const showSwitchAffordance =
          isOtherOption && revealedOptionId === option.id;

        return (
          <div
            key={option.id}
            className={`results-row${isMyVote ? " results-row--mine" : ""}${
              isOtherOption ? " results-row--switchable" : ""
            }${showSwitchAffordance ? " results-row--revealed" : ""}`}
            role="listitem"
            onMouseEnter={() => {
              if (isOtherOption) {
                setRevealedOptionId(option.id);
              }
            }}
            onMouseLeave={() => {
              if (isOtherOption) {
                setRevealedOptionId((current) =>
                  current === option.id ? null : current,
                );
              }
            }}
            onTouchStart={() => startLongPress(option.id)}
            onTouchEnd={clearLongPressTimer}
            onTouchCancel={clearLongPressTimer}
          >
            <div className="results-row-header">
              <span className="results-label">
                <span className="results-rank" aria-hidden="true">
                  {rank}
                </span>
                {option.text}
                {isMyVote ? (
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
            {isOtherOption ? (
              <button
                type="button"
                className="results-switch-vote"
                onClick={() => onSwitchVote?.(option.id)}
                disabled={switching}
                aria-hidden={!showSwitchAffordance}
                tabIndex={showSwitchAffordance ? 0 : -1}
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
