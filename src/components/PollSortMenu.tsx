import { useEffect, useId, useRef, useState } from "react";
import { SORT_OPTIONS, type SortOption } from "../pollSort";

interface PollSortMenuProps {
  value: SortOption;
  onChange: (next: SortOption) => void;
}

export function PollSortMenu({ value, onChange }: PollSortMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && containerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const currentLabel =
    SORT_OPTIONS.find((option) => option.value === value)?.label ?? "Sort";

  return (
    <div className="poll-sort" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="poll-sort-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Sort polls (current: ${currentLabel})`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <SortIcon />
      </button>

      {open ? (
        <ul id={menuId} role="menu" className="poll-sort-menu">
          {SORT_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={
                    selected
                      ? "poll-sort-option poll-sort-option-selected"
                      : "poll-sort-option"
                  }
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                >
                  <span className="poll-sort-option-check" aria-hidden="true">
                    {selected ? "✓" : ""}
                  </span>
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4v16" />
      <path d="m3 8 4-4 4 4" />
      <path d="M17 20V4" />
      <path d="m13 16 4 4 4-4" />
    </svg>
  );
}
