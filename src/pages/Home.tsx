import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccentStyle } from "../accentColors";
import { listPolls } from "../api";
import { JoinQR } from "../components/JoinQR";
import { VotedPollCard } from "../components/VotedPollCard";
import type { Poll } from "../types";
import { hasVoted } from "../voted";

function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

export function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let initial = true;

    async function load() {
      if (initial) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await listPolls();
        if (!cancelled) {
          setPolls(data);
        }
      } catch (err) {
        if (!cancelled && initial) {
          setError(
            err instanceof Error ? err.message : "Failed to load recent polls",
          );
        }
      } finally {
        if (!cancelled && initial) {
          setLoading(false);
          initial = false;
        }
      }
    }

    void load();
    const interval = window.setInterval(load, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="page page-home">
      <JoinQR />

      <h2 className="home-section-title">Polls</h2>

      {loading ? <p className="page-lead">Loading recent polls…</p> : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && polls.length === 0 ? (
        <p className="home-empty">No polls yet. Be the first to create one.</p>
      ) : null}

      {!loading && !error && polls.length > 0 ? (
        <ul className="poll-list">
          {polls.map((poll) => {
            if (hasVoted(poll.id)) {
              return (
                <li key={poll.id}>
                  <VotedPollCard poll={poll} />
                </li>
              );
            }

            const optionCount = poll.options.length;
            const votes = totalVotes(poll);
            return (
              <li key={poll.id}>
                <button
                  type="button"
                  className="poll-card poll-accent-scope"
                  style={getAccentStyle(poll.accentColor)}
                  onClick={() => navigate(`/poll/${poll.id}`)}
                >
                  <span className="poll-card-question">{poll.question}</span>
                  <span className="poll-card-meta">
                    {optionCount} {optionCount === 1 ? "option" : "options"} ·{" "}
                    {votes} {votes === 1 ? "vote" : "votes"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
