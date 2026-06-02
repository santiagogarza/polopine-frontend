import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminDeleteOption,
  adminDeletePoll,
  adminResetAll,
  adminResetPollVotes,
  adminSetAllowVoterOptions,
  listPolls,
} from "../api";
import type { Poll } from "../types";
import {
  clearAllVoted,
  clearVoted,
  listVotedPollIds,
} from "../voted";

const ADMIN_KEY_STORAGE = "polopine:admin-key";

function loadAdminKey(): string {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

function saveAdminKey(key: string): void {
  if (key.trim()) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
  } else {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  }
}

export function Admin() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>(() => listVotedPollIds());
  const [adminKey, setAdminKey] = useState(loadAdminKey);
  const [keyInput, setKeyInput] = useState(loadAdminKey);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshPolls = useCallback(async () => {
    try {
      const data = await listPolls();
      setPolls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load polls");
    }
  }, []);

  useEffect(() => {
    void refreshPolls();
  }, [refreshPolls]);

  function refreshVotedIds() {
    setVotedIds(listVotedPollIds());
  }

  function handleResetMyView() {
    clearAllVoted();
    refreshVotedIds();
    setMessage("Your view was reset. Home will show polls as if you have not voted.");
    setError(null);
  }

  function handleForgetVote(pollId: string) {
    clearVoted(pollId);
    refreshVotedIds();
    setMessage(`Forgot your vote on poll ${pollId.slice(0, 8)}…`);
    setError(null);
  }

  function handleSaveKey() {
    saveAdminKey(keyInput);
    setAdminKey(keyInput.trim());
    setMessage("Admin key saved for this tab session.");
    setError(null);
  }

  async function runServerAction(
    label: string,
    action: () => Promise<void>,
  ): Promise<void> {
    if (!adminKey) {
      setError("Enter and save an admin key first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await action();
      setMessage(label);
      await refreshPolls();
      refreshVotedIds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetAll() {
    setBusy(true);
    setError(null);
    try {
      await adminResetAll();
      clearAllVoted();
      refreshVotedIds();
      setMessage("Server reset to seed state. All polls re-created with zero votes.");
      await refreshPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  const votedPolls = polls.filter((p) => votedIds.includes(p.id));

  return (
    <section className="page page-admin">
      <h1>Admin</h1>
      <p className="page-lead">
        Hidden demo controls. Not linked from the main UI.
      </p>

      {message ? (
        <p className="admin-message" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-section">
        <h2 className="admin-section-title">My view</h2>
        <p className="admin-hint">
          Clears only this browser&apos;s vote markers. Server totals are unchanged.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleResetMyView}
        >
          Reset my view
        </button>
        <p className="admin-hint">
          Quick URL: <Link to="/reset-me">/reset-me</Link> (same as above, then home).
        </p>

        {votedIds.length > 0 ? (
          <ul className="admin-poll-list">
            {votedPolls.length > 0
              ? votedPolls.map((poll) => (
                  <li key={poll.id} className="admin-poll-row">
                    <span className="admin-poll-label">{poll.question}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleForgetVote(poll.id)}
                    >
                      Forget my vote
                    </button>
                  </li>
                ))
              : votedIds.map((id) => (
                  <li key={id} className="admin-poll-row">
                    <span className="admin-poll-label">
                      Poll {id.slice(0, 8)}… (not in current list)
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleForgetVote(id)}
                    >
                      Forget my vote
                    </button>
                  </li>
                ))}
          </ul>
        ) : (
          <p className="admin-hint">No local votes recorded.</p>
        )}
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Server actions</h2>
        <p className="admin-hint">
          Requires <code>ADMIN_API_KEY</code> on the API (Render env in prod).
        </p>
        <div className="admin-key-row">
          <label className="admin-key-label" htmlFor="admin-key">
            Admin key
          </label>
          <input
            id="admin-key"
            type="password"
            className="admin-key-input"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveKey}
          >
            Save key
          </button>
        </div>

        {polls.length === 0 ? (
          <p className="admin-hint">No polls on server.</p>
        ) : (
          <ul className="admin-poll-list">
            {polls.map((poll) => (
              <li key={poll.id} className="admin-poll-row admin-poll-row-stack">
                <span className="admin-poll-label">{poll.question}</span>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={poll.allowVoterOptions}
                    disabled={busy}
                    onChange={() =>
                      void runServerAction(
                        poll.allowVoterOptions
                          ? `Voter-added options disabled on "${poll.question}".`
                          : `Voter-added options enabled on "${poll.question}".`,
                        async () => {
                          await adminSetAllowVoterOptions(
                            poll.id,
                            !poll.allowVoterOptions,
                            adminKey,
                          );
                        },
                      )
                    }
                  />
                  Allow voters to add options
                </label>
                <ul className="admin-option-list">
                  {poll.options.map((option) => (
                    <li key={option.id} className="admin-option-row">
                      <span className="admin-option-label">
                        {option.text}
                        <span className="admin-option-meta">
                          {option.votes} vote{option.votes === 1 ? "" : "s"}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() =>
                          void runServerAction(
                            `Removed option "${option.text}" from "${poll.question}".`,
                            async () => {
                              await adminDeleteOption(
                                poll.id,
                                option.id,
                                adminKey,
                              );
                            },
                          )
                        }
                      >
                        Remove option
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="admin-poll-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busy}
                    onClick={() =>
                      void runServerAction(
                        `Votes reset on "${poll.question}".`,
                        async () => {
                          await adminResetPollVotes(poll.id, adminKey);
                        },
                      )
                    }
                  >
                    Reset votes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busy}
                    onClick={() =>
                      void runServerAction(
                        `Deleted "${poll.question}".`,
                        async () => {
                          await adminDeletePoll(poll.id, adminKey);
                        },
                      )
                    }
                  >
                    Delete poll
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {import.meta.env.DEV ? (
        <div className="admin-section">
          <h2 className="admin-section-title">Local dev only</h2>
          <p className="admin-hint">
            Wipes all polls and re-seeds the three starter polls. Disabled on production API.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => void handleResetAll()}
          >
            Reset server to seed state
          </button>
        </div>
      ) : null}

      <p className="page-footer-link">
        <Link to="/">Back to polls</Link>
      </p>
    </section>
  );
}
