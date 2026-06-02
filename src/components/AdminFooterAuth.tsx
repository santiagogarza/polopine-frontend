import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { verifyAdminKey } from "../api";
import {
  clearAdminKey,
  loadAdminKey,
  saveAdminKey,
  subscribeToAdminAuthChange,
} from "../adminAuth";

export function AdminFooterAuth() {
  const inputId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const [adminKey, setAdminKey] = useState(loadAdminKey);
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthenticated = adminKey.length > 0;

  useEffect(() => {
    return subscribeToAdminAuthChange(() => {
      setAdminKey(loadAdminKey());
    });
  }, []);

  useEffect(() => {
    if (!isOpen && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen, adminKey]);

  function closeModal() {
    shouldRestoreFocusRef.current = true;
    setIsOpen(false);
    setKeyInput("");
    setError(null);
    setIsSubmitting(false);
  }

  function handleLogout() {
    clearAdminKey();
    setAdminKey("");
    closeModal();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = keyInput.trim();
    setError(null);
    setIsSubmitting(true);

    try {
      const isValid = await verifyAdminKey(key);
      if (!isValid) {
        setError("Wrong key, try again.");
        return;
      }
      const savedKey = saveAdminKey(key);
      setAdminKey(savedKey);
      closeModal();
    } catch (error) {
      handleVerifyError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleVerifyError(error: unknown) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: unknown }).status
        : undefined;
    const message = error instanceof Error ? error.message : "";

    if (status !== undefined) {
      setError(
        status === 429
          ? "Too many attempts. Try again in a few minutes."
          : "Could not verify the admin key. Try again.",
      );
      return;
    }

    if (/too many|429/i.test(message)) {
      setError("Too many attempts. Try again in a few minutes.");
      return;
    }

    setError("Could not verify the admin key. Try again.");
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => !element.hasAttribute("disabled"));

    if (focusable.length === 0) {
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="admin-footer-auth">
      {isAuthenticated ? (
        <button
          type="button"
          className="admin-footer-auth-trigger"
          ref={triggerRef}
          onClick={handleLogout}
        >
          Log out
        </button>
      ) : (
        <button
          type="button"
          className="admin-footer-auth-trigger"
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
        >
          Admin
        </button>
      )}

      {isOpen ? (
        <div className="admin-auth-backdrop" role="presentation">
          <div
            className="admin-auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-auth-title"
            onKeyDown={handleDialogKeyDown}
          >
            <button
              type="button"
              className="admin-auth-close"
              aria-label="Close admin login"
              onClick={closeModal}
            >
              &times;
            </button>
            <h2 id="admin-auth-title">Admin sign in</h2>
            <form className="admin-auth-form" onSubmit={handleSubmit}>
              <label className="admin-auth-label" htmlFor={inputId}>
                Admin key
              </label>
              <input
                id={inputId}
                className="admin-auth-input"
                type="password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Checking..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
