import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPollResults } from "../api";
import { PollAccentScope } from "../components/PollAccentScope";
import { ResultsChart } from "../components/ResultsChart";
import { SharePollBar } from "../components/SharePollBar";
import type { PollResults } from "../types";
import { hasVoted } from "../voted";

const POLL_INTERVAL_MS = 2000;

export function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<PollResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Missing poll id");
      setAllowed(false);
      return;
    }
    setAllowed(hasVoted(id));
  }, [id]);

  useEffect(() => {
    if (!id || !allowed) {
      return;
    }

    const pollId = id;
    let cancelled = false;

    async function fetchResults() {
      try {
        const data = await getPollResults(pollId);
        if (!cancelled) {
          setResults(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load results",
          );
        }
      }
    }

    void fetchResults();
    const intervalId = window.setInterval(() => {
      void fetchResults();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id, allowed]);

  if (!id) {
    return (
      <section className="page">
        <p className="form-error" role="alert">
          Missing poll id
        </p>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="page">
        <div className="results-gate">
          <h1>Vote first to see results</h1>
          <p className="page-lead">
            Cast your vote on this poll to unlock live results.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-hero"
            onClick={() => navigate(`/poll/${id}`)}
          >
            Go vote
          </button>
        </div>
      </section>
    );
  }

  if (error && !results) {
    return (
      <section className="page">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/create" className="btn btn-secondary">
          Create a new poll
        </Link>
      </section>
    );
  }

  if (!results) {
    return (
      <section className="page">
        <p className="page-lead">Loading results…</p>
      </section>
    );
  }

  return (
    <PollAccentScope accentColor={results.accentColor} className="page">
      <section className="page">
        <h1>{results.question}</h1>
        <p className="page-lead">
          Live results · {results.totalVotes}{" "}
          {results.totalVotes === 1 ? "vote" : "votes"} total · updates every 2s
        </p>

        <SharePollBar pollId={id} showVotedNotice />

        <ResultsChart results={results} />

        <p className="page-footer-link">
          <Link to="/">Back to polls</Link>
        </p>
      </section>
    </PollAccentScope>
  );
}
