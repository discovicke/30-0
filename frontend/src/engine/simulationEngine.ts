import type {
  FormationSlot, TeamXI, AITeam, MatchResult, GoalEvent,
  SeasonResult, FormationKey, PlayerCard, RatingMode,
} from '../types';

export const formations: Record<FormationKey, FormationSlot[]> = {
  '5-4-1': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'LB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB3', position: 'DF', specificPositions: ['CB'] },
    { label: 'RB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'ST', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
  ],
  '4-5-1': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'LB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'RB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'CAM', position: 'MF', specificPositions: ['CAM', 'CM'] },
    { label: 'ST', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
  ],
  '3-4-3': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB3', position: 'DF', specificPositions: ['CB'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'LW', position: 'FW', specificPositions: ['LW', 'RW', 'ST'] },
    { label: 'ST', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'RW', position: 'FW', specificPositions: ['RW', 'LW', 'ST'] },
  ],
  '3-5-2': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB3', position: 'DF', specificPositions: ['CB'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM3', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'ST1', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'ST2', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
  ],
  '4-4-2': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'LB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'RB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'ST1', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'ST2', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
  ],
  '4-3-3': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'LB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'RB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM3', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'LW', position: 'FW', specificPositions: ['LW', 'RW', 'ST'] },
    { label: 'ST', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'RW', position: 'FW', specificPositions: ['RW', 'LW', 'ST'] },
  ],
};

export const formationKeys: FormationKey[] = ['5-4-1', '4-5-1', '3-4-3', '3-5-2', '4-4-2', '4-3-3'];

export function getAllAITeams(mode: RatingMode = 'season'): AITeam[] {
  const teams: { name: string; season: number; peak: number; tier: string }[] = [
    { name: 'Malmö', season: 84, peak: 86, tier: 'Elite' },
    { name: 'AIK Stockholm', season: 83, peak: 85, tier: 'Elite' },
    { name: 'Djurgården', season: 82, peak: 84, tier: 'Elite' },
    { name: 'Göteborg', season: 82, peak: 84, tier: 'Elite' },
    { name: 'Elfsborg', season: 81, peak: 83, tier: 'Strong' },
    { name: 'BK Häcken', season: 80, peak: 82, tier: 'Strong' },
    { name: 'Hammarby', season: 79, peak: 81, tier: 'Strong' },
    { name: 'Norrköping', season: 78, peak: 80, tier: 'Mid' },
    { name: 'Helsingborg', season: 77, peak: 79, tier: 'Mid' },
    { name: 'Kalmar', season: 76, peak: 78, tier: 'Mid' },
    { name: 'Halmstad', season: 74, peak: 77, tier: 'Lower' },
    { name: 'Örebro', season: 73, peak: 76, tier: 'Lower' },
    { name: 'Sundsvall', season: 72, peak: 75, tier: 'Lower' },
    { name: 'Gefle', season: 71, peak: 74, tier: 'Lower' },
    { name: 'Mjällby', season: 70, peak: 73, tier: 'Lower' },
  ];
  return teams.map((t) => ({ name: t.name, strength: mode === 'peak' ? t.peak : t.season, tier: t.tier }));
}

export function computeTeamRatings(xi: TeamXI): void {
  const slots = xi.slots;
  const slotsDef = formations[xi.formation];
  let attack = 0, midfield = 0, defence = 0;
  let attackN = 0, midfieldN = 0, defenceN = 0; let gkRating = 0;
  for (const slot of slotsDef) {
    const player = slots[slot.label];
    if (!player) continue;
    switch (slot.position) {
      case 'FW': attack += player.ovr; attackN++; break;
      case 'MF': midfield += player.ovr; midfieldN++; break;
      case 'DF': defence += player.ovr; defenceN++; break;
      case 'GK':
        defence += player.ovr;
        defenceN++; 
        gkRating = player.ovr;
        break;
    }
  }
  xi.attack = attackN > 0 ? +(attack / attackN).toFixed(1) : 50;
  xi.midfield = midfieldN > 0 ? +(midfield / midfieldN).toFixed(1) : 50;
  xi.defence = defenceN > 0 ? +(defence / defenceN).toFixed(1) : 50;
  xi.gkRating = +gkRating.toFixed(1); xi.overall = +((xi.attack + xi.midfield + xi.defence) / 3).toFixed(1);
}
  function poisson(lambda: number): number { if (lambda <= 0) return 0; const L = Math.exp(-lambda); let k = 0; let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function weightedPick<T>(items: T[], weight: (item: T) => number): T {
  if (items.length === 0) throw new Error('Cannot pick from empty list');
  if (items.length === 1) return items[0];
  const totalWeight = items.reduce((s, item) => s + weight(item), 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pickGoalScorer(xi: TeamXI, formation: FormationKey): { scorer: string; assistant: string | null } {
  const slotsDef = formations[formation];
  const players = slotsDef.map((s) => xi.slots[s.label]).filter(Boolean) as PlayerCard[];
  const positionWeights: Record<string, number> = { FW: 0.50, MF: 0.30, DF: 0.18, GK: 0.005 };
  let roll = Math.random();
  let cumul = 0;
  let scorerPos = 'FW';
  for (const [pos, w] of Object.entries(positionWeights)) {
    cumul += w;
    if (roll <= cumul) { scorerPos = pos; break; }
  }
  let candidates = slotsDef.filter((s) => s.position === scorerPos && xi.slots[s.label]).map((s) => xi.slots[s.label]!);
  if (candidates.length === 0) candidates = players;
  const scorer = weightedPick(candidates, (p) => p.ovr);
  const assistPosWeights: Record<string, number> = { MF: 0.45, FW: 0.30, DF: 0.20, GK: 0.05 };
  roll = Math.random();
  cumul = 0;
  let assistPos = 'MF';
  for (const [pos, w] of Object.entries(assistPosWeights)) {
    cumul += w;
    if (roll <= cumul) { assistPos = pos; break; }
  }
  let assistCandidates = slotsDef.filter((s) => s.position === assistPos && xi.slots[s.label]).map((s) => xi.slots[s.label]!).filter((p) => p.name !== scorer.name);
  if (assistCandidates.length === 0) assistCandidates = players.filter((p) => p.name !== scorer.name);
  let assistant: string | null = null;
  if (assistCandidates.length > 0 && Math.random() < 0.75) {
    assistant = weightedPick(assistCandidates, (p) => p.ovr).name;
  }
  return { scorer: scorer.name, assistant };
}

export function simulateMatch(user: TeamXI, ai: AITeam, isUserHome: boolean, formation: FormationKey): MatchResult {
  computeTeamRatings(user);
  const userOffence = user.attack * 0.4 + user.midfield * 0.6;
  const userDefence = user.midfield * 0.2 + user.defence * 0.8;
  const userStrength = (userOffence + userDefence) / 2;
  const strengthRatio = Math.max(userStrength / Math.max(ai.strength, 1), 0.1);
  const baseRate = 1.25;
  const exponent = 3.5;
  const homeBonus = 0.10;
  let userExpected = baseRate * Math.pow(strengthRatio, exponent) + (isUserHome ? homeBonus : 0);
  let aiExpected = baseRate * Math.pow(1 / strengthRatio, exponent) + (isUserHome ? 0 : homeBonus);
  userExpected = Math.max(0.2, Math.min(userExpected, 6));
  aiExpected = Math.max(0.2, Math.min(aiExpected, 6));
  const userGoals = poisson(userExpected);
  const aiGoals = poisson(aiExpected);
  const match: MatchResult = {
    homeTeam: isUserHome ? 'Your XI' : ai.name,
    awayTeam: isUserHome ? ai.name : 'Your XI',
    isUserHome,
    homeGoals: isUserHome ? userGoals : aiGoals,
    awayGoals: isUserHome ? aiGoals : userGoals,
    goals: [],
  };
  const allGoals: { isUser: boolean; minute: number }[] = [];
  for (let i = 0; i < userGoals; i++) allGoals.push({ isUser: true, minute: Math.floor(Math.random() * 90) + 1 });
  for (let i = 0; i < aiGoals; i++) allGoals.push({ isUser: false, minute: Math.floor(Math.random() * 90) + 1 });
  allGoals.sort((a, b) => a.minute - b.minute);
  for (const g of allGoals) {
    const goal: GoalEvent = { minute: g.minute, scorer: '', assistant: null, isPenalty: false, isOwnGoal: false };
    if (g.isUser) {
      const { scorer, assistant } = pickGoalScorer(user, formation);
      goal.scorer = scorer;
      goal.assistant = assistant;
    } else {
      goal.scorer = ai.name;
    }
    match.goals.push(goal);
  }
  return match;
}

export function simulateAIMatch(home: AITeam, away: AITeam): MatchResult {
  const strengthRatio = Math.max(home.strength / Math.max(away.strength, 1), 0.1);
  const baseRate = 1.25;
  const exponent = 3.5;
  const homeBonus = 0.10;
  let homeExpected = baseRate * Math.pow(strengthRatio, exponent) + homeBonus;
  let awayExpected = baseRate * Math.pow(1 / strengthRatio, exponent);
  homeExpected = Math.max(0.2, Math.min(homeExpected, 6));
  awayExpected = Math.max(0.2, Math.min(awayExpected, 6));
  return {
    homeTeam: home.name,
    awayTeam: away.name,
    isUserHome: false,
    homeGoals: poisson(homeExpected),
    awayGoals: poisson(awayExpected),
    goals: [],
  };
}

export function extractUserMatches(matches: MatchResult[]): MatchResult[] {
  return matches.filter((m) => m.homeTeam === 'Your XI' || m.awayTeam === 'Your XI');
}

export function computeStandingsAfterMatch(allTeams: AITeam[], matches: MatchResult[]): AITeam[] {
  const teams = allTeams.map((t) => ({
    ...t,
    goalsFor: 0,
    goalsAgainst: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
  }));
  for (const m of matches) {
    for (const t of teams) {
      if (t.name === m.homeTeam) {
        t.goalsFor = (t.goalsFor ?? 0) + m.homeGoals;
        t.goalsAgainst = (t.goalsAgainst ?? 0) + m.awayGoals;
        if (m.homeGoals > m.awayGoals) t.wins = (t.wins ?? 0) + 1;
        else if (m.homeGoals === m.awayGoals) t.draws = (t.draws ?? 0) + 1;
        else t.losses = (t.losses ?? 0) + 1;
      } else if (t.name === m.awayTeam) {
        t.goalsFor = (t.goalsFor ?? 0) + m.awayGoals;
        t.goalsAgainst = (t.goalsAgainst ?? 0) + m.homeGoals;
        if (m.awayGoals > m.homeGoals) t.wins = (t.wins ?? 0) + 1;
        else if (m.awayGoals === m.homeGoals) t.draws = (t.draws ?? 0) + 1;
        else t.losses = (t.losses ?? 0) + 1;
      }
    }
  }
  for (const t of teams) {
    t.points = (t.wins ?? 0) * 3 + (t.draws ?? 0);
  }
  teams.sort((a, b) => {
    const cmp = (b.points ?? 0) - (a.points ?? 0);
    if (cmp !== 0) return cmp;
    const gdA = (a.goalsFor ?? 0) - (a.goalsAgainst ?? 0);
    const gdB = (b.goalsFor ?? 0) - (b.goalsAgainst ?? 0);
    return gdB - gdA;
  });
  return teams;
}

// Circle-method round-robin for 16 teams (user + 15 AI).
// Returns 30 rounds; each round has the user's opponent + 7 AI vs AI pairs.
function buildSchedule(aiNames: string[]): { userOpp: string; userIsHome: boolean; aiPairs: [string, string][] }[] {
  const rotating = [...aiNames]; // 15 elements
  const rounds: { userOpp: string; userIsHome: boolean; aiPairs: [string, string][] }[] = [];

  for (let r = 0; r < 15; r++) {
    const userIsHome = r % 2 === 0;
    const userOpp = rotating[0];
    const aiPairs: [string, string][] = [];
    for (let i = 1; i <= 7; i++) {
      const a = rotating[i];
      const b = rotating[15 - i]; // rotating has indices 0..14
      aiPairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    // Rotate: last element to front
    const last = rotating.pop()!;
    rotating.unshift(last);
    rounds.push({ userOpp, userIsHome, aiPairs });
  }

  // Second half: swap home/away for every fixture
  const firstHalf = rounds.slice();
  for (const { userOpp, userIsHome, aiPairs } of firstHalf) {
    rounds.push({ userOpp, userIsHome: !userIsHome, aiPairs: aiPairs.map(([h, a]) => [a, h]) });
  }

  return rounds;
}

export function simulateSeason(user: TeamXI, formation: FormationKey, mode: RatingMode = 'season'): SeasonResult {
  user.goalsFor = 0; user.goalsAgainst = 0;
  user.wins = 0; user.draws = 0; user.losses = 0; user.points = 0;
  user.formation = formation;
  computeTeamRatings(user);

  const aiTeams = getAllAITeams(mode);
  const schedule = buildSchedule(aiTeams.map(t => t.name));

  const matches: MatchResult[] = [];
  const goalScorers: Record<string, number> = {};
  const assists: Record<string, number> = {};
  const cleanSheets: Record<string, number> = {};
  const roundTables: import('../types').AITeam[][] = [];

  type Stats = { gf: number; ga: number; w: number; d: number; l: number };
  const statsMap = new Map<string, Stats>();
  for (const ai of aiTeams) statsMap.set(ai.name, { gf: 0, ga: 0, w: 0, d: 0, l: 0 });
  statsMap.set('Your XI', { gf: 0, ga: 0, w: 0, d: 0, l: 0 });

  function addStats(homeName: string, awayName: string, hg: number, ag: number) {
    const h = statsMap.get(homeName)!;
    const a = statsMap.get(awayName)!;
    h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) { h.w++; a.l++; }
    else if (hg === ag) { h.d++; a.d++; }
    else { h.l++; a.w++; }
  }

  function snapshotTable(): import('../types').AITeam[] {
    const all: import('../types').AITeam[] = [
      ...aiTeams.map(t => {
        const s = statsMap.get(t.name)!;
        return { name: t.name, strength: t.strength, tier: t.tier,
          goalsFor: s.gf, goalsAgainst: s.ga, wins: s.w, draws: s.d, losses: s.l, points: s.w * 3 + s.d };
      }),
      { name: 'Your XI', strength: user.overall,
        ...(() => { const s = statsMap.get('Your XI')!;
          return { goalsFor: s.gf, goalsAgainst: s.ga, wins: s.w, draws: s.d, losses: s.l, points: s.w * 3 + s.d }; })() },
    ];
    all.sort((a, b) => {
      const cmp = (b.points ?? 0) - (a.points ?? 0);
      if (cmp !== 0) return cmp;
      return ((b.goalsFor ?? 0) - (b.goalsAgainst ?? 0)) - ((a.goalsFor ?? 0) - (a.goalsAgainst ?? 0));
    });
    return all;
  }

  for (const { userOpp, userIsHome, aiPairs } of schedule) {
    const ai = aiTeams.find(t => t.name === userOpp)!;

    const userMatch = simulateMatch(user, ai, userIsHome, formation);
    matches.push(userMatch);
    addStats(userMatch.homeTeam, userMatch.awayTeam, userMatch.homeGoals, userMatch.awayGoals);

    if (userIsHome ? userMatch.awayGoals === 0 : userMatch.homeGoals === 0) {
      const gk = user.slots['GK'];
      if (gk) cleanSheets[gk.name] = (cleanSheets[gk.name] ?? 0) + 1;
    }
    for (const goal of userMatch.goals) {
      if (Object.values(user.slots).some(s => s.name === goal.scorer)) {
        goalScorers[goal.scorer] = (goalScorers[goal.scorer] ?? 0) + 1;
        if (goal.assistant) assists[goal.assistant] = (assists[goal.assistant] ?? 0) + 1;
      }
    }

    for (const [homeName, awayName] of aiPairs) {
      const homeTeam = aiTeams.find(t => t.name === homeName)!;
      const awayTeam = aiTeams.find(t => t.name === awayName)!;
      const m = simulateAIMatch(homeTeam, awayTeam);
      matches.push(m);
      addStats(homeName, awayName, m.homeGoals, m.awayGoals);
    }

    roundTables.push(snapshotTable());
  }

  // Write final stats back to objects for backwards-compat
  for (const ai of aiTeams) {
    const s = statsMap.get(ai.name)!;
    ai.goalsFor = s.gf; ai.goalsAgainst = s.ga;
    ai.wins = s.w; ai.draws = s.d; ai.losses = s.l; ai.points = s.w * 3 + s.d;
  }
  const us = statsMap.get('Your XI')!;
  user.goalsFor = us.gf; user.goalsAgainst = us.ga;
  user.wins = us.w; user.draws = us.d; user.losses = us.l; user.points = us.w * 3 + us.d;

  const finalTable = roundTables[roundTables.length - 1] ?? [];
  const userPosition = finalTable.findIndex(t => t.name === 'Your XI') + 1;
  const allStrengths = [...aiTeams.map(t => t.strength), user.overall].sort((a, b) => b - a);
  const expectedPos = 1 + allStrengths.indexOf(user.overall);

  const goldenBoot = Object.entries(goalScorers).sort((a, b) => b[1] - a[1])[0];
  const playmaker = Object.entries(assists).sort((a, b) => b[1] - a[1])[0];
  const goldenGlove = Object.entries(cleanSheets).sort((a, b) => b[1] - a[1])[0];
  const potScores: Record<string, number> = {};
  for (const [name, g] of Object.entries(goalScorers)) potScores[name] = g * 2;
  for (const [name, a] of Object.entries(assists)) potScores[name] = (potScores[name] ?? 0) + a;
  const potSeason = Object.entries(potScores).sort((a, b) => b[1] - a[1])[0];

  return {
    userTeam: { ...user, slots: { ...user.slots } },
    aiTeams: aiTeams.map(t => ({ ...t })),
    matches,
    goalScorers,
    assists,
    cleanSheets,
    finalPosition: userPosition,
    expectedPoints: Math.round(45 + (user.overall - aiTeams.reduce((s, t) => s + t.strength, 0) / aiTeams.length) * 3),
    expectedPosition: expectedPos,
    finalTable,
    roundTables,
    goldenBoot: goldenBoot ? { playerName: goldenBoot[0], goals: goldenBoot[1] } : null,
    playmaker: playmaker ? { playerName: playmaker[0], assists: playmaker[1] } : null,
    goldenGlove: goldenGlove ? { playerName: goldenGlove[0], cleanSheets: goldenGlove[1] } : null,
    playerOfSeason: potSeason ? { playerName: potSeason[0], goals: goalScorers[potSeason[0]] ?? 0, assists: assists[potSeason[0]] ?? 0 } : null,
  };
}