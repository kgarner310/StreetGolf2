export type Score = '2' | '3' | '4' | '5' | '6' | 'X' | 'DNP';

export interface Player {
  id: string;
  name: string;
  archetype: string;
  avatarEmoji: string;
  streak: number;
}

export interface Submission {
  playerId: string;
  date: string; // YYYY-MM-DD
  score: Score;
  submittedAt: string; // ISO timestamp
}

export interface Title {
  playerId: string;
  label: string;
  emoji: string;
}

export interface Board {
  date: string;
  groupId: string;
  submissions: Submission[];
  completed: boolean;
  generatedText: string;
  generatedTitles: Title[];
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  players: Player[];
}

export interface AppState {
  group: Group;
  submissions: Submission[];
}
