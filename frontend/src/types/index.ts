// ── Data Types (from C# models) ──

export interface PlayerCard {
  name: string;
  season: number;
  team: string;
  ovr: number;
  positions: string[];
  id: string;
}

export interface SquadPlayer {
  name: string;
  season: number;
  team: string;
  ovr: number;
  positions: string[];
  id: string;
}

export interface Squad {
  team: string;
  season: number;
  players: SquadPlayer[];
}

// ── Formation ──

export interface FormationSlot {
  label: string;
  position: string;
  specificPositions: string[];
}

export type FormationKey = '4-3-3' | '4-4-2' | '3-5-2';

// ── Team ──

export interface TeamXI {
  name: string;
  slots: Record<string, PlayerCard>;
  formation: FormationKey;
  attack: number;
  midfield: number;
  defence: number;
  gkRating: number;
  overall: number;
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export interface AITeam {
  name: string;
  strength: number;
  tier?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  points?: number;
}

// ── Match ──

export interface GoalEvent {
  minute: number;
  scorer: string;
  assistant: string | null;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  isUserHome: boolean;
  homeGoals: number;
  awayGoals: number;
  goals: GoalEvent[];
}

// ── Season ──

export interface SeasonAward {
  playerName: string;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
}

export interface SeasonResult {
  userTeam: TeamXI;
  aiTeams: AITeam[];
  matches: MatchResult[];
  goalScorers: Record<string, number>;
  assists: Record<string, number>;
  cleanSheets: Record<string, number>;
  finalPosition: number;
  expectedPoints: number;
  expectedPosition: number;
  finalTable: AITeam[];
  goldenBoot: SeasonAward | null;
  playmaker: SeasonAward | null;
  goldenGlove: SeasonAward | null;
  playerOfSeason: SeasonAward | null;
}

// ── Game State ──

export type DraftMode = 'squad-first' | 'position-first';
export type RatingMode = 'season' | 'peak';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GamePhase = 'setup' | 'draft' | 'simulating' | 'results';

export interface GameConfig {
  draftMode: DraftMode;
  ratingMode: RatingMode;
  difficulty: Difficulty;
  formation: FormationKey;
}
