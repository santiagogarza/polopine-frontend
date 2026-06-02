import { peekVoterId } from "../voter";

interface OptionAuthorProps {
  authorVoterId: string | null;
}

export function OptionAuthor({ authorVoterId }: OptionAuthorProps) {
  if (!authorVoterId) {
    return null;
  }

  const label =
    peekVoterId() === authorVoterId ? "added by you" : "added by a voter";

  return (
    <span className="option-author" title={label}>
      {label}
    </span>
  );
}
