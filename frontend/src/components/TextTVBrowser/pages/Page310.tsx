import type { SeasonResult } from '../../../types';
import { extractUserMatches } from '../../../engine/simulationEngine';
import styles from './pages.module.scss';

interface Props {
  result: SeasonResult | null;
}

export default function Page310({ result }: Props) {
  if (!result) {
    return (
      <div className={styles.lockedMessage}>
        SASONGEN HAR INTE SPELATS ÄNNU<br />
        NAVIGERA TILL 310 FÖR ATT SIMULERA
      </div>
    );
  }

  const userMatches = extractUserMatches(result.matches);

  return (
    <div>
      <div className={styles.pageTitle}>RESULTAT</div>
      <div className={styles.pageSubtitle}>ALLSVENSKT 30-0 · SASONG 2025</div>

      {userMatches.map((m, i) => {
        const roundNum = i + 1;
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
          const goalText = sorted.map((g) => `${g.scorer} ${g.minute}'`).join('  ');
          if (goalText) goalLines.push(goalText);
        }

        return (
          <div key={roundNum} className={styles.matchBlock}>
            <div className={styles.matchRoundHeader}>OMGÅNG {roundNum}</div>
            <div className={styles.matchLine}>
              <span className={homeClass}>{homeTeam}</span>
              <span className={`${styles.matchScore} ${scoreClass}`}>
                {m.homeGoals}-{m.awayGoals}
              </span>
              <span className={awayClass}>{awayTeam}</span>
            </div>
            {goalLines.map((line, gi) => (
              <div key={gi} className={styles.matchGoals}>
                MÅL: {line}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
