import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPollResults, vote as voteApi } from "../api";
import { ResultsChart } from "../components/ResultsChart";
import { SharePollBar } from "../components/SharePollBar";
import type { PollResults } from "../types";
import { getVotedOptionId, hasVoted, markVoted } from "../voted";

const POLL_INTERVAL_MS = 2000;

export function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<PollResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Missing poll id");
      setAllowed(false);
      return;
    }
    setAllowed(hasVoted(id));
    setSelectedOptionId(getVotedOptionId(id));
  }, [id]);

  const fetchResults = useCallback(async (pollId: string) => {
    const data = await getPollResults(pollId);
    setResults(data);
    setError(null);
  }, []);

  useEffect(() => {
    if (!id || !allowed) {
      return;
    }

    const pollId = id;
    let cancelled = false;

    async function safeFetch() {
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

    void safeFetch();
    const intervalId = window.setInterval(() => {
      void safeFetch();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id, allowed]);

  const handleSwitchVote = useCallback(
    async (newOptionId: string) => {
      if (!id || switching || newOptionId === selectedOptionId) {
        return;
      }
      setSwitching(true);
      setError(null);
      try {
        await voteApi(id, newOptionId);
        markVoted(id, newOptionId);
        setSelectedOptionId(newOptionId);
        // Refresh immediately so the bars animate to their new values
        // instead of waiting for the next 2s poll tick.
        await fetchResults(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to switch vote");
      } finally {
        setSwitching(false);
      }
    },
    [id, switching, selectedOptionId, fetchResults],
  );

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
    <section className="page">
      <h1>{results.question}</h1>
      <p className="page-lead">
        Live results · {results.totalVotes}{" "}
        {results.totalVotes === 1 ? "vote" : "votes"} total · updates every 2s
      </p>

      <SharePollBar pollId={id} showVotedNotice />

      <ResultsChart
        results={results}
        selectedOptionId={selectedOptionId}
        onSwitchVote={handleSwitchVote}
        switching={switching}
      />

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="page-footer-link">
        <Link to="/">Back to polls</Link>
      </p>
    </section>
  );
}
