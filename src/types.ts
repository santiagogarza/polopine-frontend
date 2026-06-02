import type { AccentColor } from "./accentColors";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  accentColor: AccentColor;
  options: PollOption[];
  createdAt: string;
}

export interface PollResults {
  question: string;
  accentColor: AccentColor;
  options: PollOption[];
  totalVotes: number;
}
