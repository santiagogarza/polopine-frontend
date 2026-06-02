import { useCallback, useEffect, useId, useRef, useState } from "react";
import { verifyAdminKey } from "../api";
import {
  ADMIN_KEY_CHANGED_EVENT,
  clearAdminKey,
  loadAdminKey,
  saveAdminKey,
} from "../adminKey";

type ModalState =
  | { kind: "closed" }
  | { kind: "open"; error: string | null; submitting: boolean };

function useAdminKey(): [string, () => void] {
  const [key, setKey] = useState<string>(() => loadAdminKey());

  const refresh = useCallback(() => {
    setKey(loadAdminKey());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onChange = () => setKey(loadAdminKey());
    window.addEventListener(ADMIN_KEY_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ADMIN_KEY_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return [key, refresh];
}

export function AdminFooterAuth() {
  const [adminKey] = useAdminKey();
  const isAuthed = adminKey !== "";

  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    if (modal.kind === "open") {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [modal.kind]);

  useEffect(() => {
    if (modal.kind !== "open") {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModal({ kind: "closed" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal.kind]);

  function openModal() {
    setInput("");
    setModal({ kind: "open", error: null, submitting: false });
  }

  function closeModal() {
    setModal({ kind: "closed" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal.kind !== "open" || modal.submitting) {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      setModal({ kind: "open", error: "Enter your admin key.", submitting: false });
      return;
    }

    setModal({ kind: "open", error: null, submitting: true });
    try {
      const ok = await verifyAdminKey(trimmed);
      if (ok) {
        saveAdminKey(trimmed);
        setInput("");
        setModal({ kind: "closed" });
        return;
      }
      setModal({
        kind: "open",
        error: "Wrong key, try again.",
        submitting: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isRateLimit = /too many|rate.?limit|429/i.test(message);
      setModal({
        kind: "open",
        error: isRateLimit
          ? "Too many attempts. Try again in a few minutes."
          : "Something went wrong. Try again.",
        submitting: false,
      });
    }
  }

  function handleLogout() {
    clearAdminKey();
  }

  return (
    <>
      {isAuthed ? (
        <button
          type="button"
          className="admin-footer-link"
          onClick={handleLogout}
          aria-label="Admin log out"
        >
          Log out
        </button>
      ) : (
        <button
          type="button"
          className="admin-footer-link"
          onClick={openModal}
          aria-label="Admin sign in"
        >
          Admin
        </button>
      )}

      {modal.kind === "open" ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-title`}
          >
            <h2 id={`${inputId}-title`} className="admin-modal-title">
              Admin sign in
            </h2>
            <form className="admin-modal-form" onSubmit={(e) => void handleSubmit(e)}>
              <label htmlFor={inputId} className="admin-modal-label">
                Admin key
              </label>
              <input
                ref={inputRef}
                id={inputId}
                name="admin-key"
                type="password"
                autoComplete="off"
                className="admin-modal-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-invalid={modal.error ? true : undefined}
                aria-describedby={modal.error ? errorId : undefined}
                disabled={modal.submitting}
              />
              {modal.error ? (
                <p id={errorId} className="form-error admin-modal-error" role="alert">
                  {modal.error}
                </p>
              ) : null}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeModal}
                  disabled={modal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={modal.submitting}
                >
                  {modal.submitting ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
