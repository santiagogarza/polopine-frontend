import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listPolls } from "../api";
import { JoinQR } from "../components/JoinQR";
import { PollSortMenu } from "../components/PollSortMenu";
import { VotedPollCard } from "../components/VotedPollCard";
import {
  getStoredPollSort,
  setStoredPollSort,
  sortPolls,
  totalVotes,
  type PollSortOption,
} from "../pollSort";
import type { Poll } from "../types";
import { hasVoted } from "../voted";

export function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<PollSortOption>(getStoredPollSort);

  const sortedPolls = useMemo(
    () => sortPolls(polls, sortOption),
    [polls, sortOption],
  );

  function handleSortChange(option: PollSortOption) {
    setSortOption(option);
    setStoredPollSort(option);
  }

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

      <div className="home-section-header">
        <h2 className="home-section-title">Polls</h2>
        <PollSortMenu value={sortOption} onChange={handleSortChange} />
      </div>

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
        <ul className="poll-list" key={sortOption}>
          {sortedPolls.map((poll) => {
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
