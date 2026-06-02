import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPollResults, vote as voteApi } from "../api";
import { ResultsChart } from "../components/ResultsChart";
import { SharePollBar } from "../components/SharePollBar";
import type { PollResults } from "../types";
import { getVotedOption, hasVoted, markVoted } from "../voted";

const POLL_INTERVAL_MS = 2000;

export function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<PollResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [changingVote, setChangingVote] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Missing poll id");
      setAllowed(false);
      return;
    }
    setAllowed(hasVoted(id));
    setSelectedOptionId(getVotedOption(id));
  }, [id]);

  const fetchResults = useCallback(async (pollId: string) => {
    const data = await getPollResults(pollId);
    setResults(data);
    setError(null);
    return data;
  }, []);

  useEffect(() => {
    if (!id || !allowed) {
      return;
    }

    const pollId = id;
    let cancelled = false;

    async function load() {
      try {
        await fetchResults(pollId);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load results",
          );
        }
      }
    }

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id, allowed, fetchResults]);

  async function handleChangeVote(optionId: string) {
    if (!id || changingVote || optionId === selectedOptionId) {
      return;
    }

    setChangingVote(true);
    setError(null);
    try {
      await voteApi(id, optionId);
      markVoted(id, optionId);
      setSelectedOptionId(optionId);
      await fetchResults(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change vote");
    } finally {
      setChangingVote(false);
    }
  }

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

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <ResultsChart
        results={results}
        selectedOptionId={selectedOptionId}
        onChangeVote={selectedOptionId ? handleChangeVote : undefined}
        changingVote={changingVote}
      />

      <p className="page-footer-link">
        <Link to="/">Back to polls</Link>
      </p>
    </section>
  );
}
