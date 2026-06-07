import type { Squad, SquadPlayer, FormationSlot, FormationKey, DraftMode, Difficulty } from '../types';
import { formations } from './simulationEngine';

export interface DraftState {
  mode: DraftMode;
  difficulty: Difficulty;
  formation: FormationKey;
  ratingMode: 'season' | 'peak';
  usedIds: Set<string>;
  currentSquad: Squad | null;
  rerollsLeft: number;
  filledSlots: string[];
  selectedPosition: string | null;
  phase: 'idle' | 'spinning' | 'show-squad' | 'assign-position' | 'complete';
}

export function getRerollCount(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 3;
    case 'normal': return 1;
    case 'hard': return 0;
  }
}

export function pickRandomSquad(squads: Squad[], usedSquadKeys?: Set<string>): Squad | null {
  if (squads.length === 0) return null;

  const available = usedSquadKeys
    ? squads.filter((s) => !usedSquadKeys.has(`${s.team}|${s.season}`))
    : squads;

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getEligiblePlayers(
  squad: Squad,
  filledIds: Set<string>,
  filterPosition?: string | null
): SquadPlayer[] {
  let players = squad.players.filter((p) => !filledIds.has(p.id));

  if (filterPosition) {
    const slots = formations['4-4-2'];
    const slot = slots.find((s) => s.label === filterPosition);
    if (slot) {
      players = players.filter((p) =>
        p.positions.some((pos) => slot.specificPositions.includes(pos))
      );
    }
  }

  return players.sort((a, b) => b.ovr - a.ovr);
}

export function getEmptySlots(formation: FormationKey, filledSlots: string[]): FormationSlot[] {
  return formations[formation].filter((s) => !filledSlots.includes(s.label));
}

export function getPositionsForPlayer(player: SquadPlayer, formation: FormationKey): string[] {
  const slots = formations[formation];
  return slots
    .filter((s) => player.positions.some((pos) => s.specificPositions.includes(pos)))
    .map((s) => s.label);
}
