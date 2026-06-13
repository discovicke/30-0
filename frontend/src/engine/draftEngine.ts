import type { Squad, SquadPlayer, FormationKey, FormationSlot, RatingMode } from '../types';
import { formations, getAllAITeams } from './simulationEngine';

export function getRerollCount(difficulty: 'easy' | 'normal' | 'hard'): number {
  return difficulty === 'easy' ? 3 : difficulty === 'normal' ? 1 : 0;
}

export function pickRandomSquad(
  squads: Squad[],
  usedSquadKeys?: Set<string>,
  seasonMin?: number,
  seasonMax?: number,
): Squad | null {
  let filtered = usedSquadKeys
    ? squads.filter((s) => !usedSquadKeys.has(`${s.team}|${s.season}`))
    : [...squads];
  if (seasonMin !== undefined) filtered = filtered.filter((s) => s.season >= seasonMin);
  if (seasonMax !== undefined) filtered = filtered.filter((s) => s.season <= seasonMax);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
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

const swedishSlotLabels: Record<string, string> = {
  GK: 'MV', LB: 'VB', CB1: 'MB', CB2: 'MB', RB: 'HB', CB3: 'MB',
  CM1: 'CM', CM2: 'CM', CM3: 'CM',
  CDM1: 'DM', CDM2: 'DM',
  CAM: 'OM',
  LM: 'VM', RM: 'HM',
  LW: 'VY', RW: 'HY', ST: 'ANF',
  ST1: 'ANF', ST2: 'ANF',
};

export function getSwedishLabel(label: string): string {
  return swedishSlotLabels[label] ?? label;
}

export function sortSlotsRightToLeft(slots: FormationSlot[]): FormationSlot[] {
  const groupOrder = ['GK', 'DF', 'MF', 'FW'];
  const result: FormationSlot[] = [];
  for (const group of groupOrder) {
    const groupSlots = slots.filter((s) => s.position === group);
    result.push(...groupSlots.reverse());
  }
  return result;
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

export interface PreSeasonOdds {
  projectedPosition: number;
  projectedPoints: number;
  winLeague: number;
  top4: number;
  top6: number;
  top10: number;
  relegation: number;
}

export function computePreSeasonOdds(overall: number, mode: RatingMode = 'season'): PreSeasonOdds {
  const strength = Math.max(0, Math.min(1, (overall - 55) / 38)); const aiTeams = getAllAITeams(mode); const allTeamsSorted = [...aiTeams, { name: "DITT LAG", strength: overall }].sort((a, b) => b.strength - a.strength); const actualRank = allTeamsSorted.findIndex(t => t.name === "DITT LAG") + 1;

  return {
    projectedPosition: actualRank,
    projectedPoints: Math.round(28 + strength * 37),
    winLeague: Math.round(Math.pow(strength, 1.8) * 60 * 10) / 10,
    top4: Math.round(Math.min(99.9, Math.pow(strength, 0.7) * 99.9) * 10) / 10,
    top6: Math.round(Math.min(99.9, Math.pow(strength, 0.5) * 99.9) * 10) / 10,
    top10: Math.round(Math.min(99.9, (30 + strength * 70)) * 10) / 10,
    relegation: Math.round(Math.pow(1 - strength, 2.5) * 80 * 10) / 10,
  };
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
