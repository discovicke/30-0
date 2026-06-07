import type { Squad, SquadPlayer, FormationKey } from '../types';
import { formations } from './simulationEngine';

export function getRerollCount(difficulty: 'easy' | 'normal' | 'hard'): number {
  return difficulty === 'easy' ? 3 : difficulty === 'normal' ? 1 : 0;
}

export function pickRandomSquad(
  squads: Squad[],
  usedSquadKeys?: Set<string>
): Squad | null {
  const available = usedSquadKeys
    ? squads.filter((s) => !usedSquadKeys.has(`${s.team}|${s.season}`))
    : [...squads];
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

const posGroupMap: Record<string, string> = {
  GK: 'GK',
  CB: 'DF', LB: 'DF', RB: 'DF',
  CDM: 'MF', CM: 'MF', CAM: 'MF', LM: 'MF', RM: 'MF',
  LW: 'FW', RW: 'FW', ST: 'FW',
};

export function getPlayerPosGroup(player: SquadPlayer): string {
  for (const p of player.positions) {
    const g = posGroupMap[p];
    if (g) return g;
  }
  return 'MF';
}

export interface EligiblePlayer extends SquadPlayer {
  available: boolean;
}

export function getEligiblePlayers(
  squad: Squad,
  filledIds: Set<string>,
  _filledPosGroups: Set<string>,
  filterPosition: string | null,
  formation: FormationKey,
  filledSlots: string[],
): EligiblePlayer[] {
  const slotsDef = formations[formation];

  // Build a map of label -> position group for already-filled slots
  const filledGroups = new Set<string>();
  for (const label of filledSlots) {
    const slot = slotsDef.find((s) => s.label === label);
    if (slot) filledGroups.add(slot.position);
  }

  // Determine which position groups are still open
  const neededGroups = new Set(slotsDef.map((s) => s.position));
  for (const g of filledGroups) neededGroups.delete(g);

  // If filtering by a specific slot, only that slot's position group is needed
  const filterGroup = filterPosition
    ? slotsDef.find((s) => s.label === filterPosition)?.position ?? null
    : null;

  if (filterGroup && !neededGroups.has(filterGroup)) {
    // selected slot's group is already full — no one is available
    return squad.players.map((p) => ({ ...p, available: false }));
  }

  return squad.players.map((p) => {
    const alreadyUsed = filledIds.has(p.id);
    const playerGroup = getPlayerPosGroup(p);
    const groupOpen = filterGroup
      ? neededGroups.has(filterGroup) && playerGroup === filterGroup
      : neededGroups.has(playerGroup);
    const available = !alreadyUsed && groupOpen;
    return { ...p, available };
  });
}

export function autoAssignSlot(
  player: SquadPlayer,
  formation: FormationKey,
  filledSlots: string[],
): string | null {
  const slotsDef = formations[formation];
  const playerGroup = getPlayerPosGroup(player);

  const openSlots = slotsDef.filter(
    (s) => s.position === playerGroup && !filledSlots.includes(s.label)
  );

  if (openSlots.length === 0) return null;
  return openSlots[0].label;
}
