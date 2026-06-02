export interface PollOption {
  id: string;
  text: string;
  votes: number;
  /**
   * Voter id (POL-11 `x-voter-id`) of whoever added this option, or `null`
   * for options seeded at poll-creation time. The client compares against
   * `peekVoterId()` to render an "added by you" attribution.
   */
  authorVoterId: string | null;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  /**
   * When true (default), voters can append new options to this poll. The
   * creator/admin can toggle this off per poll without losing existing
   * voter-added options.
   */
  allowVoterOptions: boolean;
}

export interface PollResults {
  question: string;
  options: PollOption[];
  totalVotes: number;
}
