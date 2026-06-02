import { useCallback, useState } from "react";

type SharePollBarProps = {
  pollId: string;
  /** Subtle note that the viewer has already voted (e.g. on results). */
  showVotedNotice?: boolean;
};

export function SharePollBar({
  pollId,
  showVotedNotice = false,
}: SharePollBarProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/poll/${pollId}`
      : "";

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Link copied");
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Could not copy link");
    }
  }, [shareUrl]);

  return (
    <div className="share-bar">
      <button
        type="button"
        className="btn btn-primary btn-copy"
        onClick={() => void copyShareLink()}
      >
        Copy share link
      </button>
      {showVotedNotice ? (
        <span className="share-voted-notice">You already voted</span>
      ) : null}
      {copyStatus ? (
        <span className="copy-status" role="status">
          {copyStatus}
        </span>
      ) : null}
    </div>
  );
}
