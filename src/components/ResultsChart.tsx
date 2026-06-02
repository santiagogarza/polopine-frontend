import { useState } from "react";
import type { PollResults } from "../types";

interface ResultsChartProps {
  results: PollResults;
  /** Option this browser cast for the poll, if known (POL-7). */
  selectedOptionId?: string | null;
  /** Invoked when the user clicks the "Vote for this instead" affordance. */
  onSwitchVote?: (optionId: string) => void | Promise<void>;
  /** Set while a switch is in flight so the affordance disables itself. */
  switching?: boolean;
}

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

// Long-press threshold for touch devices, mirrors the hover-reveal on desktop.
const LONG_PRESS_MS = 400;

export function ResultsChart({
  results,
  selectedOptionId = null,
  onSwitchVote,
  switching = false,
}: ResultsChartProps) {
  const { options, totalVotes } = results;
  const canSwitch = Boolean(onSwitchVote) && selectedOptionId !== null;
  const [revealed, setRevealed] = useState<string | null>(null);
  const [pressTimer, setPressTimer] = useState<number | null>(null);

  function clearPressTimer() {
    if (pressTimer !== null) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  function handleTouchStart(optionId: string) {
    if (!canSwitch || optionId === selectedOptionId) {
      return;
    }
    clearPressTimer();
    const id = window.setTimeout(() => {
      setRevealed(optionId);
    }, LONG_PRESS_MS);
    setPressTimer(id);
  }

  function handleTouchEnd() {
    clearPressTimer();
  }

  async function handleSwitch(optionId: string) {
    if (!onSwitchVote || switching) {
      return;
    }
    setRevealed(null);
    await onSwitchVote(optionId);
  }

  return (
    <div className="results-chart" role="list" aria-label="Poll results">
      {options.map((option, index) => {
        const pct = percent(option.votes, totalVotes);
        const rank = index + 1;
        const isSelected = option.id === selectedOptionId;
        const showSwitch =
          canSwitch && !isSelected && (revealed === option.id);
        const rowClasses = ["results-row"];
        if (isSelected) {
          rowClasses.push("results-row-selected");
        }
        if (canSwitch && !isSelected) {
          rowClasses.push("results-row-switchable");
        }
        return (
          <div
            key={option.id}
            className={rowClasses.join(" ")}
            role="listitem"
            onMouseEnter={() => {
              if (canSwitch && !isSelected) {
                setRevealed(option.id);
              }
            }}
            onMouseLeave={() => {
              if (revealed === option.id) {
                setRevealed(null);
              }
            }}
            onTouchStart={() => handleTouchStart(option.id)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="results-row-header">
              <span className="results-label">
                <span className="results-rank" aria-hidden="true">
                  {rank}
                </span>
                {option.text}
                {isSelected ? (
                  <span
                    className="results-voted-marker"
                    aria-label="Your vote"
                    title="Your vote"
                  >
                    ✓
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
            {canSwitch && !isSelected ? (
              <button
                type="button"
                className={
                  "results-switch-vote" +
                  (showSwitch ? " results-switch-vote-visible" : "")
                }
                aria-label={`Vote for ${option.text} instead`}
                data-testid={`switch-vote-${option.id}`}
                disabled={switching}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleSwitch(option.id);
                }}
                onFocus={() => setRevealed(option.id)}
                onBlur={() => {
                  if (revealed === option.id) {
                    setRevealed(null);
                  }
                }}
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
