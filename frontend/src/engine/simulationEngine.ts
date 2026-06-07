import type {
  FormationSlot, TeamXI, AITeam, MatchResult, GoalEvent,
  SeasonResult, FormationKey, PlayerCard,
} from '../types';

// ── Formations ──

export const formations: Record<FormationKey, FormationSlot[]> = {
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
};

export const formationKeys: FormationKey[] = ['4-3-3', '4-4-2', '3-5-2'];

// ── AI Teams ──

export function getAllAITeams(): AITeam[] {
  return [
    { name: 'Malmö', strength: 85, tier: 'Elit' },
    { name: 'AIK Stockholm', strength: 84, tier: 'Elit' },
    { name: 'Djurgården', strength: 84, tier: 'Elit' },
    { name: 'Göteborg', strength: 84, tier: 'Elit' },
    { name: 'Elfsborg', strength: 82, tier: 'Stark' },
    { name: 'BK Häcken', strength: 81, tier: 'Stark' },
    { name: 'Hammarby', strength: 80, tier: 'Stark' },
    { name: 'Norrköping', strength: 79, tier: 'Mellan' },
    { name: 'Helsingborg', strength: 78, tier: 'Mellan' },
    { name: 'Kalmar', strength: 77, tier: 'Mellan' },
    { name: 'Halmstad', strength: 75, tier: 'Lägre' },
    { name: 'Örebro', strength: 74, tier: 'Lägre' },
    { name: 'Sundsvall', strength: 73, tier: 'Lägre' },
    { name: 'Gefle', strength: 72, tier: 'Lägre' },
    { name: 'Mjällby', strength: 72, tier: 'Lägre' },
  ];
}

// ── Team Ratings ──

export function computeTeamRatings(xi: TeamXI): void {
  const slots = xi.slots;
  const slotsDef = formations[xi.formation];

  let attack = 0, midfield = 0, defence = 0, gk = 0;
  let attackN = 0, midfieldN = 0, defenceN = 0, gkN = 0;

  for (const slot of slotsDef) {
    const player = slots[slot.label];
    if (!player) continue;

    switch (slot.position) {
      case 'FW': attack += player.ovr; attackN++; break;
      case 'MF': midfield += player.ovr; midfieldN++; break;
      case 'DF': defence += player.ovr; defenceN++; break;
      case 'GK': gk += player.ovr; gkN++; break;
    }
  }

  xi.attack = attackN > 0 ? +(attack / attackN).toFixed(1) : 50;
  xi.midfield = midfieldN > 0 ? +(midfield / midfieldN).toFixed(1) : 50;
  xi.defence = defenceN > 0 ? +(defence / defenceN).toFixed(1) : 50;
  xi.gkRating = gkN > 0 ? +(gk / gkN).toFixed(1) : 50;
  xi.overall = +((xi.attack + xi.midfield + xi.defence + xi.gkRating) / 4).toFixed(1);
}

// ── Poisson ──

function poisson(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ── Weighted Pick ──

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

// ── Goal Scorer ──

function pickGoalScorer(xi: TeamXI, formation: FormationKey): { scorer: string; assistant: string | null } {
  const slots = formations[formation];
  const players = slots.map((s) => xi.slots[s.label]).filter(Boolean) as PlayerCard[];

  const positionWeights: Record<string, number> = {
    FW: 0.50,
    MF: 0.30,
    DF: 0.18,
    GK: 0.005,
  };

  let roll = Math.random();
  let cumul = 0;
  let scorerPos = 'FW';
  for (const [pos, w] of Object.entries(positionWeights)) {
    cumul += w;
    if (roll <= cumul) { scorerPos = pos; break; }
  }

  let candidates = slots
    .filter((s) => s.position === scorerPos && xi.slots[s.label])
    .map((s) => xi.slots[s.label]!);

  if (candidates.length === 0) {
    candidates = players;
  }

  const scorer = weightedPick(candidates, (p) => p.ovr);

  const assistPosWeights: Record<string, number> = {
    MF: 0.45,
    FW: 0.30,
    DF: 0.20,
    GK: 0.05,
  };

  roll = Math.random();
  cumul = 0;
  let assistPos = 'MF';
  for (const [pos, w] of Object.entries(assistPosWeights)) {
    cumul += w;
    if (roll <= cumul) { assistPos = pos; break; }
  }

  let assistCandidates = slots
    .filter((s) => s.position === assistPos && xi.slots[s.label])
    .map((s) => xi.slots[s.label]!)
    .filter((p) => p.name !== scorer.name);

  if (assistCandidates.length === 0) {
    assistCandidates = players.filter((p) => p.name !== scorer.name);
  }

  let assistant: string | null = null;
  if (assistCandidates.length > 0 && Math.random() < 0.75) {
    assistant = weightedPick(assistCandidates, (p) => p.ovr).name;
  }

  return { scorer: scorer.name, assistant };
}

// ── Match Simulation ──

export function simulateMatch(
  user: TeamXI, ai: AITeam, isUserHome: boolean, formation: FormationKey
): MatchResult {
  computeTeamRatings(user);

  const userOffence = user.attack * 0.4 + user.midfield * 0.6;
  const userDefence = user.midfield * 0.2 + user.defence * 0.5 + user.gkRating * 0.3;
  const userStrength = (userOffence + userDefence) / 2;

  const strengthRatio = Math.max(userStrength / Math.max(ai.strength, 1), 0.1);
  const baseRate = 1.2;
  const exponent = 3.5;
  const homeBonus = 0.08;

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
  const baseRate = 1.2;
  const exponent = 3.5;
  const homeBonus = 0.08;

  let homeExpected = baseRate * Math.pow(strengthRatio, exponent) + homeBonus;
  let awayExpected = baseRate * Math.pow(1 / strengthRatio, exponent);

  homeExpected = Math.max(0.2, Math.min(homeExpected, 6));
  awayExpected = Math.max(0.2, Math.min(awayExpected, 6));

  const homeGoals = poisson(homeExpected);
  const awayGoals = poisson(awayExpected);

  return {
    homeTeam: home.name,
    awayTeam: away.name,
    isUserHome: false,
    homeGoals,
    awayGoals,
    goals: [],
  };
}

// ── Season Simulation ──

export function simulateSeason(user: TeamXI, formation: FormationKey): SeasonResult {
  user.goalsFor = 0;
  user.goalsAgainst = 0;
  user.wins = 0;
  user.draws = 0;
  user.losses = 0;
  user.points = 0;
  user.formation = formation;

  computeTeamRatings(user);

  const aiTeams = getAllAITeams();
  const matches: MatchResult[] = [];
  const goalScorers: Record<string, number> = {};
  const assists: Record<string, number> = {};
  const cleanSheets: Record<string, number> = {};

  for (const ai of aiTeams) {
    const homeMatch = simulateMatch(user, ai, true, formation);
    matches.push(homeMatch);

    if (homeMatch.isUserHome ? homeMatch.awayGoals === 0 : homeMatch.homeGoals === 0) {
      const gk = user.slots['GK'];
      if (gk) cleanSheets[gk.name] = (cleanSheets[gk.name] ?? 0) + 1;
    }

    const awayMatch = simulateMatch(user, ai, false, formation);
    matches.push(awayMatch);

    if (awayMatch.isUserHome ? awayMatch.awayGoals === 0 : awayMatch.homeGoals === 0) {
      const gk = user.slots['GK'];
      if (gk) cleanSheets[gk.name] = (cleanSheets[gk.name] ?? 0) + 1;
    }
  }

  for (let i = 0; i < aiTeams.length; i++) {
    for (let j = i + 1; j < aiTeams.length; j++) {
      matches.push(simulateAIMatch(aiTeams[i], aiTeams[j]));
      matches.push(simulateAIMatch(aiTeams[j], aiTeams[i]));
    }
  }

  const userMatches = matches.filter(
    (m) => m.homeTeam === 'Your XI' || m.awayTeam === 'Your XI'
  );

  for (const match of userMatches) {
    for (const goal of match.goals) {
      const isUserGoal = Object.values(user.slots).some((s) => s.name === goal.scorer);
      if (isUserGoal) {
        goalScorers[goal.scorer] = (goalScorers[goal.scorer] ?? 0) + 1;
        if (goal.assistant) {
          assists[goal.assistant] = (assists[goal.assistant] ?? 0) + 1;
        }
      }
    }

    if (match.isUserHome) {
      user.goalsFor += match.homeGoals;
      user.goalsAgainst += match.awayGoals;
    } else {
      user.goalsFor += match.awayGoals;
      user.goalsAgainst += match.homeGoals;
    }
  }

  user.wins = userMatches.filter((m) =>
    m.isUserHome ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals
  ).length;
  user.losses = userMatches.filter((m) =>
    m.isUserHome ? m.homeGoals < m.awayGoals : m.awayGoals < m.homeGoals
  ).length;
  user.draws = userMatches.length - user.wins - user.losses;
  user.points = user.wins * 3 + user.draws;

  for (const ai of aiTeams) {
    const aiMatches = matches.filter((m) => m.homeTeam === ai.name || m.awayTeam === ai.name);
    for (const m of aiMatches) {
      if (m.homeTeam === ai.name) {
        ai.goalsFor = (ai.goalsFor ?? 0) + m.homeGoals;
        ai.goalsAgainst = (ai.goalsAgainst ?? 0) + m.awayGoals;
      } else {
        ai.goalsFor = (ai.goalsFor ?? 0) + m.awayGoals;
        ai.goalsAgainst = (ai.goalsAgainst ?? 0) + m.homeGoals;
      }
    }
    ai.wins = aiMatches.filter((m) =>
      m.homeTeam === ai.name ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals
    ).length;
    ai.losses = aiMatches.filter((m) =>
      m.homeTeam === ai.name ? m.homeGoals < m.awayGoals : m.awayGoals < m.homeGoals
    ).length;
    ai.draws = aiMatches.length - ai.wins - ai.losses;
    ai.points = ai.wins * 3 + ai.draws;
  }

  const allTeams: AITeam[] = [
    ...aiTeams,
    {
      name: 'Your XI',
      strength: user.overall,
      goalsFor: user.goalsFor,
      goalsAgainst: user.goalsAgainst,
      wins: user.wins,
      draws: user.draws,
      losses: user.losses,
      points: user.points,
    },
  ];

  allTeams.sort((a, b) => {
    const cmp = (b.points ?? 0) - (a.points ?? 0);
    if (cmp !== 0) return cmp;
    const gdA = (a.goalsFor ?? 0) - (a.goalsAgainst ?? 0);
    const gdB = (b.goalsFor ?? 0) - (b.goalsAgainst ?? 0);
    return gdB - gdA;
  });

  const userPosition = allTeams.findIndex((t) => t.name === 'Your XI') + 1;

  const allStrengths = [...aiTeams.map((t) => t.strength), user.overall].sort((a, b) => b - a);
  const userStrengthRank = allStrengths.indexOf(user.overall);
  const expectedPos = 1 + userStrengthRank;
  const expectedPts = estimateExpectedPoints(user.overall, aiTeams);

  const goldenBoot = Object.entries(goalScorers).sort((a, b) => b[1] - a[1])[0];
  const playmaker = Object.entries(assists).sort((a, b) => b[1] - a[1])[0];
  const goldenGlove = Object.entries(cleanSheets).sort((a, b) => b[1] - a[1])[0];

  const potScores: Record<string, number> = {};
  for (const [name, g] of Object.entries(goalScorers)) potScores[name] = g * 2;
  for (const [name, a] of Object.entries(assists)) potScores[name] = (potScores[name] ?? 0) + a;
  const potSeason = Object.entries(potScores).sort((a, b) => b[1] - a[1])[0];

  return {
    userTeam: {
      ...user,
      slots: { ...user.slots },
      goalsFor: user.goalsFor,
      goalsAgainst: user.goalsAgainst,
      wins: user.wins,
      draws: user.draws,
      losses: user.losses,
      points: user.points,
    },
    aiTeams: aiTeams.map((t) => ({ ...t })),
    matches,
    goalScorers,
    assists,
    cleanSheets,
    finalPosition: userPosition,
    expectedPoints: expectedPts,
    expectedPosition: expectedPos,
    finalTable: allTeams,
    goldenBoot: goldenBoot ? { playerName: goldenBoot[0], goals: goldenBoot[1] } : null,
    playmaker: playmaker ? { playerName: playmaker[0], assists: playmaker[1] } : null,
    goldenGlove: goldenGlove ? { playerName: goldenGlove[0], cleanSheets: goldenGlove[1] } : null,
    playerOfSeason: potSeason ? {
      playerName: potSeason[0],
      goals: goalScorers[potSeason[0]] ?? 0,
      assists: assists[potSeason[0]] ?? 0,
    } : null,
  };
}

// ── Helpers ──

function estimateExpectedPoints(userOvr: number, aiTeams: AITeam[]): number {
  const leagueAvg = aiTeams.reduce((s, t) => s + t.strength, 0) / aiTeams.length;
  const diff = userOvr - leagueAvg;
  return Math.round(45 + diff * 3);
}
