import { useCallback, useRef, useState } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
  /** When set, the matching row shows a "your vote" marker and others may offer a switch. */
  votedOptionId?: string | null;
  onSwitchVote?: (optionId: string) => void;
  switchingOptionId?: string | null;
}

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

const LONG_PRESS_MS = 500;

export function ResultsChart({
  results,
  votedOptionId = null,
  onSwitchVote,
  switchingOptionId = null,
}: ResultsChartProps) {
  const { options, totalVotes } = results;
  const [revealedOptionId, setRevealedOptionId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const canSwitch = Boolean(votedOptionId && onSwitchVote);

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const isMyVote = votedOptionId === option.id;
        const isOtherOption = canSwitch && votedOptionId !== option.id;
        const showSwitch =
          isOtherOption &&
          (revealedOptionId === option.id || switchingOptionId === option.id);
        const isSwitching = switchingOptionId === option.id;

        return (
          <div
            key={option.id}
            className={`results-row${isMyVote ? " results-row--voted" : ""}${showSwitch ? " results-row--switch-visible" : ""}`}
            role="listitem"
            onMouseEnter={() => {
              if (isOtherOption) {
                setRevealedOptionId(option.id);
              }
            }}
            onMouseLeave={() => {
              if (revealedOptionId === option.id) {
                setRevealedOptionId(null);
              }
            }}
            onTouchStart={() => {
              if (!isOtherOption) {
                return;
              }
              clearLongPress();
              longPressTimer.current = setTimeout(() => {
                setRevealedOptionId(option.id);
              }, LONG_PRESS_MS);
            }}
            onTouchEnd={clearLongPress}
            onTouchCancel={clearLongPress}
          >
            <div className="results-row-header">
              <span className="results-label">
                <span className="results-rank" aria-hidden="true">
                  {rank}
                </span>
                {option.text}
                {isMyVote ? (
                  <span className="results-your-vote" aria-label="Your vote">
                    Your vote
                  </span>
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
                aria-hidden={!showSwitch}
                tabIndex={showSwitch ? 0 : -1}
                disabled={isSwitching || !showSwitch}
                onClick={() => onSwitchVote?.(option.id)}
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
