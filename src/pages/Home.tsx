import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listPolls } from "../api";
import { JoinQR } from "../components/JoinQR";
import { VotedPollCard } from "../components/VotedPollCard";
import type { Poll } from "../types";
import { hasVoted } from "../voted";

const POLL_SORT_STORAGE_KEY = "polopine:poll-sort";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-votes", label: "Most votes" },
  { value: "least-votes", label: "Least votes" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

type PollSortOption = (typeof sortOptions)[number]["value"];

function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

function timestamp(poll: Poll): number {
  return Date.parse(poll.createdAt) || 0;
}

function getInitialSortOption(): PollSortOption {
  const stored = localStorage.getItem(POLL_SORT_STORAGE_KEY);
  return sortOptions.some((option) => option.value === stored)
    ? (stored as PollSortOption)
    : "newest";
}

function sortPolls(polls: Poll[], sortOption: PollSortOption): Poll[] {
  return [...polls].sort((a, b) => {
    switch (sortOption) {
      case "oldest":
        return timestamp(a) - timestamp(b);
      case "most-votes":
        return totalVotes(b) - totalVotes(a) || timestamp(b) - timestamp(a);
      case "least-votes":
        return totalVotes(a) - totalVotes(b) || timestamp(b) - timestamp(a);
      case "alphabetical":
        return (
          a.question.localeCompare(b.question, undefined, {
            sensitivity: "base",
          }) || timestamp(b) - timestamp(a)
        );
      case "newest":
      default:
        return timestamp(b) - timestamp(a);
    }
  });
}

export function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] =
    useState<PollSortOption>(getInitialSortOption);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const sortedPolls = useMemo(
    () => sortPolls(polls, sortOption),
    [polls, sortOption],
  );

  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label ??
    "Newest";

  useEffect(() => {
    let cancelled = false;
    let initial = true;

    async function load() {
      if (initial) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await listPolls();
        if (!cancelled) {
          setPolls(data);
        }
      } catch (err) {
        if (!cancelled && initial) {
          setError(
            err instanceof Error ? err.message : "Failed to load recent polls",
          );
        }
      } finally {
        if (!cancelled && initial) {
          setLoading(false);
          initial = false;
        }
      }
    }

    void load();
    const interval = window.setInterval(load, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!sortMenuOpen) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setSortMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [sortMenuOpen]);

  function chooseSortOption(nextSortOption: PollSortOption) {
    setSortOption(nextSortOption);
    localStorage.setItem(POLL_SORT_STORAGE_KEY, nextSortOption);
    setSortMenuOpen(false);
  }

  return (
    <section className="page page-home">
      <JoinQR />

      <div className="home-section-header">
        <h2 className="home-section-title" id="polls-heading">
          Polls
        </h2>
        <div className="poll-sort" ref={sortMenuRef}>
          <button
            type="button"
            className="poll-sort-trigger"
            aria-label={`Sort polls, current: ${selectedSortLabel}`}
            aria-haspopup="menu"
            aria-expanded={sortMenuOpen}
            onClick={() => setSortMenuOpen((open) => !open)}
          >
            <svg
              className="poll-sort-icon"
              viewBox="0 0 20 20"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M7 4v12" />
              <path d="M7 4 4.5 6.5" />
              <path d="M7 4l2.5 2.5" />
              <path d="M13 16V4" />
              <path d="m13 16-2.5-2.5" />
              <path d="m13 16 2.5-2.5" />
            </svg>
          </button>
          {sortMenuOpen ? (
            <div className="poll-sort-menu" role="menu" aria-label="Sort polls">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="poll-sort-option"
                  role="menuitemradio"
                  aria-checked={option.value === sortOption}
                  onClick={() => chooseSortOption(option.value)}
                >
                  <span>{option.label}</span>
                  {option.value === sortOption ? (
                    <svg
                      className="poll-sort-check"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="m5 10 3 3 7-7" />
                    </svg>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? <p className="page-lead">Loading recent polls…</p> : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && polls.length === 0 ? (
        <p className="home-empty">No polls yet. Be the first to create one.</p>
      ) : null}

      {!loading && !error && sortedPolls.length > 0 ? (
        <ul
          className="poll-list"
          aria-labelledby="polls-heading"
          data-sort={sortOption}
          key={sortOption}
        >
          {sortedPolls.map((poll) => {
            if (hasVoted(poll.id)) {
              return (
                <li key={poll.id}>
                  <VotedPollCard poll={poll} />
                </li>
              );
            }

            const optionCount = poll.options.length;
            const votes = totalVotes(poll);
            return (
              <li key={poll.id}>
                <button
                  type="button"
                  className="poll-card"
                  onClick={() => navigate(`/poll/${poll.id}`)}
                >
                  <span className="poll-card-question">{poll.question}</span>
                  <span className="poll-card-meta">
                    {optionCount} {optionCount === 1 ? "option" : "options"} ·{" "}
                    {votes} {votes === 1 ? "vote" : "votes"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
