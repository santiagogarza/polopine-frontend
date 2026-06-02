import { useEffect, useId, useRef, useState } from "react";
import {
  POLL_SORT_LABELS,
  POLL_SORT_OPTIONS,
  type PollSortOption,
} from "../pollSort";

type PollSortMenuProps = {
  value: PollSortOption;
  onChange: (option: PollSortOption) => void;
};

export function PollSortMenu({ value, onChange }: PollSortMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectOption(option: PollSortOption) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div className="poll-sort-menu" ref={rootRef}>
      <button
        type="button"
        className="poll-sort-trigger"
        aria-label="Sort polls"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        <SortIcon />
      </button>

      {open ? (
        <div
          id={menuId}
          className="poll-sort-popover"
          role="menu"
          aria-label="Sort polls"
        >
          {POLL_SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={value === option}
              className={
                value === option
                  ? "poll-sort-option poll-sort-option--active"
                  : "poll-sort-option"
              }
              onClick={() => selectOption(option)}
            >
              {POLL_SORT_LABELS[option]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SortIcon() {
  return (
    <svg
      className="poll-sort-icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M5.25 3.75 3 6v1.5h4.5V6L5.25 4.5 6.75 3 5.25 3.75Zm7.5 0L15 6v1.5h-4.5V6l2.25-1.5L11.25 3l1.5.75ZM9 7.5 6.75 9.75 9 12v-1.5h4.5V12L15 9.75 12.75 7.5 11.25 9 9 7.5Z"
      />
    </svg>
  );
}
