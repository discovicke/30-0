import type { SeasonResult } from '../../../types';
import { extractUserMatches } from '../../../engine/simulationEngine';
import styles from './pages.module.scss';

interface Props {
  result: SeasonResult | null;
  roundOffset: number; // 0, 10, or 20
}

export default function Page310({ result, roundOffset }: Props) {
  if (!result) {
    return (
      <div className={styles.lockedMessage}>
        SASONGEN HAR INTE SPELATS ANNU<br />
        NAVIGERA TILL 310 FOR ATT SIMULERA
      </div>
    );
  }

  const userMatches = extractUserMatches(result.matches);
  const slice = userMatches.slice(roundOffset, roundOffset + 10);
  const startRound = roundOffset + 1;
  const endRound = Math.min(roundOffset + 10, userMatches.length);

  return (
    <div>
      <div className={styles.pageTitle}>RESULTAT OMG {startRound}-{endRound}</div>
      <div className={styles.pageSubtitle}>ALLSVENSKT 30-0 · SASONG 2025</div>

      {slice.map((m, i) => {
        const roundNum = roundOffset + i + 1;
        const isHome = m.isUserHome;
        const userGoals = isHome ? m.homeGoals : m.awayGoals;
        const oppGoals = isHome ? m.awayGoals : m.homeGoals;
        const oppName = isHome ? m.awayTeam : m.homeTeam;

        const scoreClass = userGoals > oppGoals ? styles.matchWin
          : userGoals < oppGoals ? styles.matchLoss : styles.matchDraw;

        const homeTeam = isHome ? 'DITT LAG' : oppName.toUpperCase();
        const awayTeam = isHome ? oppName.toUpperCase() : 'DITT LAG';
        const homeClass = isHome ? styles.matchTeamYou : styles.matchTeam;
        const awayClass = !isHome ? styles.matchTeamYou : styles.matchTeam;

        const goalLines: string[] = [];
        if (m.goals.length > 0) {
          const sorted = [...m.goals].sort((a, b) => a.minute - b.minute);
          // Group by team (user goals vs opponent goals)
          const userGoalEvents = sorted.filter(() => {
            // User goals: scorer is in user's team
            // Since we can't easily tell, use the convention:
            // all goals in user matches are attributed to their respective teams
            // For now, show all goals together
            return true;
          });
          const goalText = userGoalEvents.map((g) => `${g.scorer} ${g.minute}'`).join('  ');
          if (goalText) goalLines.push(goalText);
        }

        return (
          <div key={roundNum} className={styles.matchBlock}>
            <div className={styles.matchRoundHeader}>OMGANG {roundNum}</div>
            <div className={styles.matchLine}>
              <span className={homeClass}>{homeTeam}</span>
              <span className={`${styles.matchScore} ${scoreClass}`}>
                {m.homeGoals}-{m.awayGoals}
              </span>
              <span className={awayClass}>{awayTeam}</span>
            </div>
            {goalLines.map((line, gi) => (
              <div key={gi} className={styles.matchGoals}>
                MAL: {line}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
