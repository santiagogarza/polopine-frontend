import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listPolls } from "../api";
import type { Poll } from "../types";

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

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listPolls();
        if (!cancelled) {
          setPolls(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load recent polls",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page page-home">
      <div className="home-hero">
        <h1>Polls in seconds</h1>
        <p className="page-lead">
          Create a question, share the link, and watch votes roll in live.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-hero"
          onClick={() => navigate("/create")}
        >
          Create a poll
        </button>
      </div>

      <h2 className="home-section-title">Recent polls</h2>

      {loading ? (
        <p className="page-lead">Loading recent polls…</p>
      ) : null}

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
            const optionCount = poll.options.length;
            const votes = totalVotes(poll);
            return (
              <li key={poll.id}>
                <button
                  type="button"
                  className="poll-card"
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
