import type { SeasonResult } from '../types';

interface ArticleData {
  quote: string;
  longestWinStreak: number;
  mostGoalsMatch: { round: number; opponent: string; goals: number };
  homeRecord: { w: number; d: number; l: number };
  awayRecord: { w: number; d: number; l: number };
}

export function generateArticleData(result: SeasonResult): ArticleData {
  const userMatches = result.matches.filter(
    (m) => m.homeTeam === 'Your XI' || m.awayTeam === 'Your XI'
  );

  // Longest win streak
  let streak = 0;
  let maxStreak = 0;
  for (const m of userMatches) {
    const isHome = m.homeTeam === 'Your XI';
    const userGoals = isHome ? m.homeGoals : m.awayGoals;
    const oppGoals = isHome ? m.awayGoals : m.homeGoals;
    if (userGoals > oppGoals) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  // Most goals in a single match
  let bestMatch = { round: 1, opponent: '', goals: 0 };
  userMatches.forEach((m, i) => {
    const isHome = m.homeTeam === 'Your XI';
    const userGoals = isHome ? m.homeGoals : m.awayGoals;
    const oppName = isHome ? m.awayTeam : m.homeTeam;
    if (userGoals > bestMatch.goals) {
      bestMatch = { round: i + 1, opponent: oppName, goals: userGoals };
    }
  });

  // Home/away split
  const homeRecord = { w: 0, d: 0, l: 0 };
  const awayRecord = { w: 0, d: 0, l: 0 };
  for (const m of userMatches) {
    const isHome = m.homeTeam === 'Your XI';
    const userGoals = isHome ? m.homeGoals : m.awayGoals;
    const oppGoals = isHome ? m.awayGoals : m.homeGoals;
    const rec = isHome ? homeRecord : awayRecord;
    if (userGoals > oppGoals) rec.w++;
    else if (userGoals === oppGoals) rec.d++;
    else rec.l++;
  }

  // Generate quote
  const quote = pickQuote(result, maxStreak);

  return {
    quote,
    longestWinStreak: maxStreak,
    mostGoalsMatch: bestMatch,
    homeRecord,
    awayRecord,
  };
}

function pickQuote(result: SeasonResult, _winStreak: number): string {
  const pos = result.finalPosition;
  const user = result.userTeam;
  const boot = result.goldenBoot;
  const bestPlayer = boot?.playerName ?? 'LAGET';
  const goals = boot?.goals ?? 0;
  const losses = user.losses;

  // Unbeaten
  if (losses === 0) {
    return `30 MATCHER. NOLL FORLUSTER. ${bestPlayer.toUpperCase()} LEDDE LAGET GENOM EN HISTORISK SASONG DAR INGEN MOTSTANDARE KUNDE BRYTA DEN OBESEGRADE SVITEN.`;
  }

  // Champion dominant
  if (pos === 1 && losses <= 4) {
    return `ETT LAG SOM DOMINERADE FRAN FORSTA OMGANGEN. ${bestPlayer.toUpperCase()} MED SINA ${goals} MAL STYRDE LAGET MED JARNHAND — TITELN VAR ALDRIG I FARA.`;
  }

  // Champion tight
  if (pos === 1) {
    return `DET BLEV EN RYSARE ANDA IN I KAKLET, MEN TILL SLUT STOD ${bestPlayer.toUpperCase()} OCH LAGET SOM MASTARE. ${goals} MAL OCH OANDLIGA NERVER.`;
  }

  // Runner up
  if (pos === 2) {
    return `SA NARA, MEN ANDA SA LANGT BORT. ANDRAPLATS AR INGET ATT SKAMMAS FOR MEN ${bestPlayer.toUpperCase()} VET ATT DET FANNS MER ATT GE.`;
  }

  // Top 3
  if (pos <= 3) {
    return `EN STARK SASONG SOM ANDA INTE RACKTE HELA VAGEN. ${bestPlayer.toUpperCase()} LEVERERADE MATCHERNA — MEN LAGET SAKNADE DEN DAR SISTA BITEN.`;
  }

  // Top half
  if (pos <= 8) {
    return `ETT LAG I OVRE HALVAN SOM HADE SINA STUNDER. ${bestPlayer.toUpperCase()} VISADE BLIXTAR AV KLASS, MEN KONSISTENSEN FATTADES.`;
  }

  // Mid table
  if (pos <= 12) {
    return `EN SASONG I MITTFALTET DAR LAGET ALDRIG RIKTIGT HITTADE RATT. ${bestPlayer.toUpperCase()} GJORDE VAD HAN KUNDE MED ${goals} MAL.`;
  }

  // Relegation battle
  if (pos <= 14) {
    return `EN TUNG SASONG DAR NEDFLYTTNINGSSPOKEN HANGDE OVER LAGET UNDER STORA DELAR. ${bestPlayer.toUpperCase()} KAMPADE TAPPERT MEN DET VAR INTE TILLRACKLIGT.`;
  }

  // Relegated
  return `EN MARDROMS-SASONG FRAN START TILL SLUT. ${bestPlayer.toUpperCase()} KUNDE INTE RADDDA LAGET FRAN DEN BITTRA NEDFLYTTNINGEN.`;
}
