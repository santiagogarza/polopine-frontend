import { useNavigate } from "react-router-dom";
import { pollAccentHex, type Poll } from "../types";

interface VotedPollCardProps {
  poll: Poll;
}

const MAX_BARS = 4;

function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

function percent(votes: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((votes / total) * 100);
}

export function VotedPollCard({ poll }: VotedPollCardProps) {
  const navigate = useNavigate();
  const total = totalVotes(poll);
  const sorted = [...poll.options].sort((a, b) => b.votes - a.votes);
  const visible = sorted.slice(0, MAX_BARS);
  const hiddenCount = sorted.length - visible.length;

  return (
    <button
      type="button"
      className="voted-card"
      style={{ ["--accent" as string]: pollAccentHex(poll.accentColor) }}
      onClick={() => navigate(`/poll/${poll.id}/results`)}
    >
      <span className="voted-card-question">{poll.question}</span>
      <p className="voted-card-status">
        <span className="voted-card-check" aria-hidden="true">
          ✓
        </span>
        <span className="voted-card-sub">You voted</span>
      </p>
      <div className="voted-card-bars" role="list" aria-label="Poll results">
        {visible.map((option, index) => {
          const pct = percent(option.votes, total);
          const rank = index + 1;
          return (
            <div key={option.id} className="voted-bar-row" role="listitem">
              <div className="voted-bar-header">
                <span className="voted-bar-label">
                  <span className="voted-bar-rank" aria-hidden="true">
                    {rank}
                  </span>
                  {option.text}
                </span>
                <span className="voted-bar-meta">
                  {pct}% · {option.votes}
                </span>
              </div>
              <div
                className="results-bar-track voted-bar-track"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${option.text}: ${pct}%`}
              >
                <div
                  className="results-bar-fill"
                  style={{ width: `${pct}%` }}
                  data-testid={`voted-bar-${option.id}`}
                />
              </div>
            </div>
          );
        })}
        {hiddenCount > 0 ? (
          <p className="voted-bar-more">+{hiddenCount} more</p>
        ) : null}
      </div>
    </button>
  );
}
