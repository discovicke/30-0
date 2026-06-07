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

export interface FormationSlot {
  label: string;
  position: string;
  specificPositions: string[];
}

export interface TeamXI {
  name: string;
  slots: Record<string, PlayerCard>;
  formation: string;
  attack: number;
  midfield: number;
  defence: number;
  gkRating: number;
  overall: number;
}

export interface AITeam {
  name: string;
  strength: number;
  tier: string;
}

export interface SeasonStats {
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  gd: number;
}

export interface DraftResult {
  min: number;
  p10: number;
  p25: number;
  median: number;
  avg: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  p86: number;
  p87: number;
  p88: number;
  p89: number;
  thresholds: { threshold: number; pct: number }[];
}

export interface BatchResult {
  ovr: number;
  totalSims: number;
  undefeated: number;
  undefeatedPct: number;
  bestWins: number;
  bestDraws: number;
  bestLosses: number;
  bestPoints: number;
  bestGd: number;
  leastLossWins: number;
  leastLossDraws: number;
  leastLossLosses: number;
  leastLossPoints: number;
}

export interface DreamTeamResult {
  team: TeamXI;
  season: SeasonStats;
  position: number;
  expectedPosition: number;
}

export type FormationKey = '4-3-3' | '4-4-2' | '3-5-2';
export type DraftMode = 'season' | 'peak';

export interface Tab {
  id: string;
  label: string;
}
