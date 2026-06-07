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

export function getPlayerPosGroups(player: SquadPlayer): string[] {
  const groups = new Set<string>();
  for (const p of player.positions) {
    const g = posGroupMap[p];
    if (g) groups.add(g);
  }
  if (groups.size === 0) groups.add('MF');
  return [...groups];
}

export function getPositionLabel(posGroup: string): string {
  const map: Record<string, string> = { GK: 'MÅL', DF: 'FÖR', MF: 'MID', FW: 'ANF' };
  return map[posGroup] ?? posGroup;
}

export interface EligiblePlayer extends SquadPlayer {
  available: boolean;
  openGroups: string[];
}

export function getEligiblePlayers(
  squad: Squad,
  filledIds: Set<string>,
  formation: FormationKey,
  filledSlots: string[],
  filterPosition: string | null,
): EligiblePlayer[] {
  const slotsDef = formations[formation];

  // Count total slots per position group
  const totalPerGroup: Record<string, number> = {};
  for (const s of slotsDef) {
    totalPerGroup[s.position] = (totalPerGroup[s.position] ?? 0) + 1;
  }

  // Count filled slots per position group
  const filledPerGroup: Record<string, number> = {};
  for (const label of filledSlots) {
    const slot = slotsDef.find((s) => s.label === label);
    if (slot) {
      filledPerGroup[slot.position] = (filledPerGroup[slot.position] ?? 0) + 1;
    }
  }

  function groupIsOpen(g: string): boolean {
    return (filledPerGroup[g] ?? 0) < (totalPerGroup[g] ?? 0);
  }

  const filterGroup = filterPosition
    ? slotsDef.find((s) => s.label === filterPosition)?.position ?? null
    : null;

  if (filterGroup && !groupIsOpen(filterGroup)) {
    return squad.players.map((p) => ({ ...p, available: false, openGroups: [] }));
  }

  return squad.players.map((p) => {
    const alreadyUsed = filledIds.has(p.id);
    const playerGroups = getPlayerPosGroups(p);
    const openGroups = playerGroups.filter((g) =>
      filterGroup ? g === filterGroup : groupIsOpen(g)
    );
    const available = !alreadyUsed && openGroups.length > 0;
    return { ...p, available, openGroups };
  });
}

export function autoAssignSlot(
  player: SquadPlayer,
  formation: FormationKey,
  filledSlots: string[],
  preferredGroup?: string,
): string | null {
  const slotsDef = formations[formation];
  const groups = getPlayerPosGroups(player);
  const targetGroup = preferredGroup
    ? (groups.includes(preferredGroup) ? preferredGroup : groups[0])
    : groups[0];

  const openSlots = slotsDef.filter(
    (s) => s.position === targetGroup && !filledSlots.includes(s.label)
  );

  if (openSlots.length === 0) return null;
  return openSlots[0].label;
}

export function getOpenGroupsForPlayer(
  player: SquadPlayer,
  formation: FormationKey,
  filledSlots: string[],
): string[] {
  const slotsDef = formations[formation];
  const totalPerGroup: Record<string, number> = {};
  for (const s of slotsDef) {
    totalPerGroup[s.position] = (totalPerGroup[s.position] ?? 0) + 1;
  }
  const filledPerGroup: Record<string, number> = {};
  for (const label of filledSlots) {
    const slot = slotsDef.find((s) => s.label === label);
    if (slot) {
      filledPerGroup[slot.position] = (filledPerGroup[slot.position] ?? 0) + 1;
    }
  }
  const playerGroups = getPlayerPosGroups(player);
  return playerGroups.filter((g) => (filledPerGroup[g] ?? 0) < (totalPerGroup[g] ?? 0));
}
