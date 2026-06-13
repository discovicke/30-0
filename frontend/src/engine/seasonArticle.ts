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
    return `30 MATCHER. NOLL FÖRLUSTER. ${bestPlayer.toUpperCase()} LEDDE LAGET GENOM EN HISTORISK SÄSONG DÄR INGEN MOTSTÅNDARE KUNDE BRYTA DEN OBESEGRADE SVITEN.`;
  }

  // Champion dominant
  if (pos === 1 && losses <= 4) {
    return `ETT LAG SOM DOMINERADE FRÅN FÖRSTA OMGÅNGEN. ${bestPlayer.toUpperCase()} MED SINA ${goals} MÅL STYRDE LAGET MED JÄRNHAND — TITELN VAR ALDRIG I FARA.`;
  }

  // Champion tight
  if (pos === 1) {
    return `DET BLEV EN RYSARE ÄNDA IN I KAKLET, MEN TILL SLUT STOD ${bestPlayer.toUpperCase()} OCH LAGET SOM MÄSTARE. ${goals} MÅL OCH OÄNDLIGA NERVER.`;
  }

  // Runner up
  if (pos === 2) {
    return `SÅ NÄRA, MEN ÄNDA SÅ LÄNGT BORT. ANDRAPLATS ÄR INGET ATT SKÄMMAS FÖR MEN ${bestPlayer.toUpperCase()} VET ATT DET FANNS MER ATT GE.`;
  }

  // Top 3
  if (pos <= 3) {
    return `EN STARK SÄSONG SOM ÄNDA INTE RÄCKTE HELA VÄGEN. ${bestPlayer.toUpperCase()} LEVERERADE MATCHERNA — MEN LAGET SAKNADE DEN DÄR SISTA BITEN.`;
  }

  // Top half
  if (pos <= 8) {
    return `ETT LAG I ÖVRE HALVAN SOM HADE SINA STUNDER. ${bestPlayer.toUpperCase()} VISADE BLIXTAR AV KLASS, MEN KONSISTENSEN FATTADES.`;
  }

  // Mid table
  if (pos <= 12) {
    return `EN SÄSONG I MITTFÄLTET DÄR LAGET ALDRIG RIKTIGT HITTADE RÄTT. ${bestPlayer.toUpperCase()} GJORDE VAD HAN KUNDE MED ${goals} MÅL.`;
  }

  // Relegation battle
  if (pos <= 14) {
    return `EN TUNG SÄSONG DÄR NEDFLYTTNINGSSPÖKEN HÄNGDE ÖVER LAGET UNDER STORA DELAR. ${bestPlayer.toUpperCase()} KÄMPADE TAPPERT MEN DET VAR INTE TILLRÄCKLIGT.`;
  }

  // Relegated
  return `EN MARDRÖMS-SÄSONG FRÅN START TILL SLUT. ${bestPlayer.toUpperCase()} KUNDE INTE RÄDDA LAGET FRÅN DEN BITTRA NEDFLYTTNINGEN.`;
}
