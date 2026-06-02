import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addOption as addOptionApi, getPoll, vote as voteApi } from "../api";
import { SharePollBar } from "../components/SharePollBar";
import type { Poll, PollOption } from "../types";
import { MAX_OPTION_TEXT_LENGTH } from "../types";
import { hasVoted, markVoted } from "../voted";
import { peekVoterId } from "../voter";

function normalizeOptionText(text: string): string {
  return text.trim().toLowerCase();
}

function isDuplicateOption(options: PollOption[], text: string): boolean {
  const normalized = normalizeOptionText(text);
  return options.some((o) => normalizeOptionText(o.text) === normalized);
}

function authorAttribution(option: PollOption): string | null {
  if (option.authorVoterId === null) {
    return null;
  }
  const voterId = peekVoterId();
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
  const [showAddOption, setShowAddOption] = useState(false);

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

  const trimmedNewText = newOptionText.trim();
  const newTextTooLong = trimmedNewText.length > MAX_OPTION_TEXT_LENGTH;
  const newTextDuplicate =
    poll !== null && trimmedNewText.length > 0
      ? isDuplicateOption(poll.options, trimmedNewText)
      : false;
  const canSubmitNewOption =
    trimmedNewText.length > 0 && !newTextTooLong && !newTextDuplicate;

  const addOptionHint = useMemo(() => {
    if (newTextTooLong) {
      return `Option text must be ${MAX_OPTION_TEXT_LENGTH} characters or fewer.`;
    }
    if (newTextDuplicate) {
      return "An option with this text already exists.";
    }
    return null;
  }, [newTextTooLong, newTextDuplicate]);

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

  async function handleAddOption(event: React.FormEvent) {
    event.preventDefault();
    if (!id || !poll || addingOption || !canSubmitNewOption) {
      return;
    }

    const text = trimmedNewText;
    const optimisticId = `optimistic-${Date.now()}`;
    const voterId = peekVoterId();
    const optimisticOption: PollOption = {
      id: optimisticId,
      text,
      votes: 0,
      authorVoterId: voterId,
    };

    const previousPoll = poll;
    setAddingOption(true);
    setError(null);
    setPoll({
      ...poll,
      options: [...poll.options, optimisticOption],
    });
    setNewOptionText("");
    setShowAddOption(false);

    try {
      const updated = await addOptionApi(id, text);
      setPoll(updated);
    } catch (err) {
      setPoll(previousPoll);
      setError(err instanceof Error ? err.message : "Failed to add option");
      setNewOptionText(text);
      setShowAddOption(true);
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

  return (
    <section className="page">
      <h1>{poll.question}</h1>
      <p className="page-lead">Choose one option to cast your vote.</p>

      <SharePollBar pollId={id} />

      <div className="option-cards">
        {poll.options.map((option) => {
          const attribution = authorAttribution(option);
          return (
            <button
              key={option.id}
              type="button"
              className="option-card"
              onClick={() => void handleVote(option.id)}
              disabled={voting || addingOption || option.id.startsWith("optimistic-")}
              title={attribution ?? undefined}
            >
              <span className="option-card-text">{option.text}</span>
              {attribution ? (
                <span className="option-card-attribution">{attribution}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {poll.allowVoterOptions ? (
        <div className="add-option-section">
          {showAddOption ? (
            <form className="add-option-form" onSubmit={(e) => void handleAddOption(e)}>
              <label className="visually-hidden" htmlFor="new-option-text">
                New option
              </label>
              <input
                id="new-option-text"
                type="text"
                className="add-option-input"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Type a new option"
                maxLength={MAX_OPTION_TEXT_LENGTH + 10}
                disabled={addingOption || voting}
                autoFocus
              />
              <span className="add-option-counter" aria-live="polite">
                {trimmedNewText.length}/{MAX_OPTION_TEXT_LENGTH}
              </span>
              {addOptionHint ? (
                <p className="add-option-hint" role="status">
                  {addOptionHint}
                </p>
              ) : null}
              <div className="add-option-actions">
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={!canSubmitNewOption || addingOption || voting}
                >
                  Add option
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={addingOption}
                  onClick={() => {
                    setShowAddOption(false);
                    setNewOptionText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn-ghost add-option-trigger"
              disabled={addingOption || voting}
              onClick={() => setShowAddOption(true)}
            >
              + Add option
            </button>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
