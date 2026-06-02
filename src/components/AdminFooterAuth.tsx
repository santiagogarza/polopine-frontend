import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  clearAdminKey,
  saveAdminKey,
  useAdminAuth,
} from "../adminAuth";
import { verifyAdminKey } from "../api";

const WRONG_KEY_MESSAGE = "Wrong key, try again.";
const RATE_LIMIT_MESSAGE =
  "Too many attempts. Try again in a few minutes.";

function isRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  const lower = err.message.toLowerCase();
  return lower.includes("too many") || lower.includes("429");
}

export function AdminFooterAuth() {
  const { isAuthenticated } = useAdminAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    inputRef.current?.focus();
  }, [modalOpen]);

  function openModal() {
    setKeyInput("");
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setKeyInput("");
    setError(null);
  }

  function handleLogout() {
    clearAdminKey();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setError(WRONG_KEY_MESSAGE);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const valid = await verifyAdminKey(trimmed);
      if (valid) {
        saveAdminKey(trimmed);
        closeModal();
        return;
      }
      setError(WRONG_KEY_MESSAGE);
    } catch (err) {
      if (isRateLimitError(err)) {
        setError(RATE_LIMIT_MESSAGE);
      } else {
        setError(
          err instanceof Error ? err.message : "Could not verify key.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <footer className="app-footer" aria-label="Site footer">
        <div className="app-footer-inner">
          {isAuthenticated ? (
            <>
              <Link to="/admin" className="app-footer-admin-link">
                Admin panel
              </Link>
              <button
                type="button"
                className="app-footer-auth-btn"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="app-footer-auth-btn"
              onClick={openModal}
              aria-haspopup="dialog"
            >
              <span className="app-footer-auth-icon" aria-hidden="true">
                &#128274;
              </span>
              Admin
            </button>
          )}
        </div>
      </footer>

      {modalOpen ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-login-title" className="admin-modal-title">
              Admin sign in
            </h2>
            <form className="admin-modal-form" onSubmit={handleSubmit}>
              <label className="field" htmlFor="admin-footer-key">
                <span className="field-label">Admin key</span>
                <input
                  ref={inputRef}
                  id="admin-footer-key"
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                  disabled={submitting}
                />
              </label>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
