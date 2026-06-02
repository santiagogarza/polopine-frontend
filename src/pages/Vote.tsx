import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addOption as addOptionApi, getPoll, vote as voteApi } from "../api";
import { SharePollBar } from "../components/SharePollBar";
import type { Poll, PollOption } from "../types";
import { hasVoted, markVoted } from "../voted";
import { peekVoterId } from "../voter";

const MAX_OPTION_LENGTH = 80;

function authorTitle(
  option: PollOption,
  voterId: string | null,
): string | undefined {
  if (option.authorVoterId === null) {
    return undefined;
  }
  if (voterId && option.authorVoterId === voterId) {
    return "added by you";
  }
  return "added by a voter";
}

export function Vote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const [newOptionText, setNewOptionText] = useState("");
  const [addingOption, setAddingOption] = useState(false);
  const [addOptionError, setAddOptionError] = useState<string | null>(null);

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

  const voterId = useMemo(() => peekVoterId(), [poll]);

  const trimmedNewOption = newOptionText.trim();
  const isDuplicate = useMemo(() => {
    if (!poll || trimmedNewOption.length === 0) {
      return false;
    }
    const normalized = trimmedNewOption.toLowerCase();
    return poll.options.some((o) => o.text.toLowerCase() === normalized);
  }, [poll, trimmedNewOption]);

  const tooLong = trimmedNewOption.length > MAX_OPTION_LENGTH;
  const canSubmit =
    trimmedNewOption.length > 0 && !isDuplicate && !tooLong && !addingOption;

  async function handleAddOption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !poll || !canSubmit) {
      return;
    }

    const text = trimmedNewOption;
    const optimisticOption: PollOption = {
      id: `optimistic-${Date.now()}`,
      text,
      votes: 0,
      authorVoterId: voterId,
    };
    const snapshot = poll;
    setPoll({ ...poll, options: [...poll.options, optimisticOption] });
    setNewOptionText("");
    setAddingOption(true);
    setAddOptionError(null);

    try {
      const updated = await addOptionApi(id, text);
      setPoll(updated);
    } catch (err) {
      setPoll(snapshot);
      setNewOptionText(text);
      setAddOptionError(
        err instanceof Error ? err.message : "Could not add option",
      );
    } finally {
      setAddingOption(false);
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

  const remaining = MAX_OPTION_LENGTH - trimmedNewOption.length;
  const counterTone =
    remaining < 0 ? "form-counter form-counter-over" : "form-counter";

  let inlineHint: string | null = null;
  if (isDuplicate) {
    inlineHint = "That option already exists.";
  } else if (tooLong) {
    inlineHint = `Trim to ${MAX_OPTION_LENGTH} characters or fewer.`;
  }

  return (
    <section className="page">
      <h1>{poll.question}</h1>
      <p className="page-lead">Choose one option to cast your vote.</p>

      <SharePollBar pollId={id} />

      <div className="option-cards">
        {poll.options.map((option) => {
          const title = authorTitle(option, voterId);
          const byYou = option.authorVoterId !== null && voterId !== null && option.authorVoterId === voterId;
          return (
            <button
              key={option.id}
              type="button"
              className="option-card"
              onClick={() => void handleVote(option.id)}
              disabled={voting}
              title={title}
            >
              <span className="option-card-text">{option.text}</span>
              {byYou ? (
                <span className="option-card-badge" aria-label="added by you">
                  added by you
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {poll.allowVoterOptions ? (
        <form
          className="add-option-form"
          onSubmit={(e) => void handleAddOption(e)}
          aria-label="Add a new option"
        >
          <label className="add-option-label" htmlFor="add-option-input">
            Add an option
          </label>
          <div className="add-option-row">
            <input
              id="add-option-input"
              type="text"
              className="add-option-input"
              placeholder="Something to vote on…"
              value={newOptionText}
              onChange={(e) => {
                setNewOptionText(e.target.value);
                setAddOptionError(null);
              }}
              maxLength={MAX_OPTION_LENGTH * 2}
              disabled={addingOption || voting}
              aria-describedby="add-option-counter"
            />
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={!canSubmit || voting}
            >
              {addingOption ? "Adding…" : "+ Add option"}
            </button>
          </div>
          <div className="add-option-meta">
            <span id="add-option-counter" className={counterTone}>
              {remaining} character{remaining === 1 ? "" : "s"} left
            </span>
            {inlineHint ? (
              <span className="add-option-hint" role="status">
                {inlineHint}
              </span>
            ) : null}
          </div>
          {addOptionError ? (
            <p className="form-error" role="alert">
              {addOptionError}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="add-option-disabled">
          The creator has turned off voter-added options for this poll.
        </p>
      )}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
