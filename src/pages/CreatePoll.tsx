import { FormEvent, type CSSProperties, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  getAccentStyle,
  type AccentColor,
} from "../accentColors";
import { createPoll } from "../api";

export function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [accentColor, setAccentColor] =
    useState<AccentColor>(DEFAULT_ACCENT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim());

    if (!trimmedQuestion) {
      setError("Enter a question.");
      return;
    }

    if (trimmedOptions.length < 2) {
      setError("Add at least two options.");
      return;
    }

    if (trimmedOptions.some((o) => !o)) {
      setError("Every option must be non-empty.");
      return;
    }

    setSubmitting(true);
    try {
      const poll = await createPoll(trimmedQuestion, trimmedOptions, accentColor);
      navigate(`/poll/${poll.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="page poll-accent-scope"
      style={getAccentStyle(accentColor)}
    >
      <h1>Create a poll</h1>
      <p className="page-lead">
        Ask a question and add at least two options. Share the vote link when
        you are done.
      </p>

      <form className="poll-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Question</span>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we order for lunch?"
            autoFocus
          />
        </label>

        <fieldset className="accent-fieldset">
          <legend className="field-label">Accent color</legend>
          <div className="accent-swatches" aria-label="Accent color options">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.key}
                type="button"
                className={
                  color.key === accentColor
                    ? "accent-swatch accent-swatch-selected"
                    : "accent-swatch"
                }
                style={{ "--swatch-color": color.hex } as CSSProperties}
                aria-label={color.label}
                aria-pressed={color.key === accentColor}
                title={color.label}
                onClick={() => setAccentColor(color.key)}
              >
                <span className="sr-only">{color.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="options-fieldset">
          <legend className="field-label">Options</legend>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                aria-label={`Option ${index + 1}`}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                aria-label={`Remove option ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addOption}>
            Add option
          </button>
        </fieldset>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create poll"}
        </button>
      </form>
    </section>
  );
}
