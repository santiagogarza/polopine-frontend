import { type FormEvent, useState } from "react";
import { addOption } from "../api";
import type { Poll, PollOption } from "../types";
import { getOrCreateVoterId } from "../voter";

const MAX_OPTION_LENGTH = 80;

interface AddOptionFormProps {
  pollId: string;
  options: PollOption[];
  allowVoterOptions: boolean;
  disabled?: boolean;
  onOptimisticOption: (option: PollOption) => void;
  onSavedPoll: (poll: Poll) => void;
  onRollbackOption: (optionId: string) => void;
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase();
}

function validateOptionText(text: string, options: PollOption[]): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return "Enter an option.";
  }
  if (trimmed.length > MAX_OPTION_LENGTH) {
    return "Use 80 characters or fewer.";
  }
  if (options.some((option) => normalize(option.text) === normalize(trimmed))) {
    return "That option already exists.";
  }
  return null;
}

export function AddOptionForm({
  pollId,
  options,
  allowVoterOptions,
  disabled = false,
  onOptimisticOption,
  onSavedPoll,
  onRollbackOption,
}: AddOptionFormProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const validationError =
    text.length > 0 ? validateOptionText(text, options) : null;
  const trimmedLength = text.trim().length;
  const canSubmit =
    !disabled && !submitting && trimmedLength > 0 && !validationError;

  if (!allowVoterOptions) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateOptionText(text, options);
    if (error) {
      setServerError(error);
      return;
    }

    const trimmedText = text.trim();
    const optimisticOption: PollOption = {
      id: `optimistic-${Date.now().toString(36)}`,
      text: trimmedText,
      votes: 0,
      authorVoterId: getOrCreateVoterId(),
    };

    setSubmitting(true);
    setServerError(null);
    setText("");
    onOptimisticOption(optimisticOption);

    try {
      const updatedPoll = await addOption(pollId, trimmedText);
      onSavedPoll(updatedPoll);
    } catch (err) {
      onRollbackOption(optimisticOption.id);
      setServerError(err instanceof Error ? err.message : "Option add failed");
    } finally {
      setSubmitting(false);
    }
  }

  const feedback = validationError ?? serverError;

  return (
    <form
      className="add-option-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label className="add-option-label" htmlFor={`add-option-${pollId}`}>
        Add option
      </label>
      <div className="add-option-row">
        <input
          id={`add-option-${pollId}`}
          type="text"
          value={text}
          maxLength={MAX_OPTION_LENGTH + 1}
          placeholder="+ Add option"
          disabled={disabled || submitting}
          onChange={(event) => {
            setText(event.target.value);
            setServerError(null);
          }}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={!canSubmit}
        >
          Add
        </button>
      </div>
      <div className="add-option-meta">
        <span className={feedback ? "add-option-feedback" : undefined}>
          {feedback ?? "Voter-added options are visible to everyone."}
        </span>
        <span>{trimmedLength}/{MAX_OPTION_LENGTH}</span>
      </div>
    </form>
  );
}
