import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPoll, vote as voteApi } from "../api";
import { PollAccentScope } from "../components/PollAccentScope";
import { SharePollBar } from "../components/SharePollBar";
import type { Poll } from "../types";
import { hasVoted, markVoted } from "../voted";

export function Vote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Missing poll id");
      setLoading(false);
      return;
    }

    const pollId = id;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPoll(pollId);
        if (!cancelled) {
          setPoll(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load poll");
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
  }, [id]);

  useEffect(() => {
    if (!loading && id && hasVoted(id)) {
      navigate(`/poll/${id}/results`, { replace: true });
    }
  }, [loading, id, navigate]);

  async function handleVote(optionId: string) {
    if (!id || voting) {
      return;
    }

    setVoting(true);
    setError(null);
    try {
      await voteApi(id, optionId);
      markVoted(id);
      navigate(`/poll/${id}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed");
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p className="page-lead">Loading poll…</p>
      </section>
    );
  }

  if (error && !poll) {
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

  if (!poll || !id) {
    return null;
  }

  if (hasVoted(id)) {
    return (
      <section className="page">
        <p className="page-lead">Loading results…</p>
      </section>
    );
  }

  return (
    <PollAccentScope accentColor={poll.accentColor} className="page">
      <section className="page">
        <h1>{poll.question}</h1>
        <p className="page-lead">Choose one option to cast your vote.</p>

        <SharePollBar pollId={id} />

        <div className="option-cards">
          {poll.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="option-card"
              onClick={() => void handleVote(option.id)}
              disabled={voting}
            >
              <span className="option-card-text">{option.text}</span>
            </button>
          ))}
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </PollAccentScope>
  );
}
