import type { SeasonResult } from '../../../types';
import { extractUserMatches } from '../../../engine/simulationEngine';
import styles from './pages.module.scss';

interface Props {
  result: SeasonResult | null;
}

function groupGoals(
  goals: { minute: number; scorer: string }[],
  excludeName: string,
): { scorer: string; minutes: string }[] {
  const playerGoals = goals.filter((g) => g.scorer !== excludeName);
  const grouped: Record<string, number[]> = {};
  for (const g of playerGoals) {
    if (!grouped[g.scorer]) grouped[g.scorer] = [];
    grouped[g.scorer].push(g.minute);
  }
  return Object.entries(grouped)
    .map(([scorer, minutes]) => ({
      scorer,
      minutes: minutes.sort((a, b) => a - b).join(', '),
    }))
    .sort((a, b) => {
      const aMin = parseInt(a.minutes, 10);
      const bMin = parseInt(b.minutes, 10);
      return aMin - bMin;
    });
}

function opponentGoalLines(
  goals: { minute: number; scorer: string }[],
  teamName: string,
): string[] {
  const oppGoals = goals
    .filter((g) => g.scorer === teamName)
    .map((g) => g.minute)
    .sort((a, b) => a - b);
  if (oppGoals.length === 0) return [];
  return [`${teamName} ${oppGoals.join(', ')}'`];
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
        const userGoalsNum = isHome ? m.homeGoals : m.awayGoals;
        const oppGoalsNum = isHome ? m.awayGoals : m.homeGoals;
        const oppName = isHome ? m.awayTeam : m.homeTeam;

        const scoreClass = userGoalsNum > oppGoalsNum ? styles.matchWin
          : userGoalsNum < oppGoalsNum ? styles.matchLoss : styles.matchDraw;

        const homeTeam = isHome ? 'DITT LAG' : oppName.toUpperCase();
        const awayTeam = isHome ? oppName.toUpperCase() : 'DITT LAG';
        const homeClass = isHome ? styles.matchTeamYou : styles.matchTeam;
        const awayClass = !isHome ? styles.matchTeamYou : styles.matchTeam;

        const userGrouped = groupGoals(m.goals, oppName);
        const oppLines = opponentGoalLines(m.goals, oppName);

        const maxRows = Math.max(userGrouped.length, oppLines.length);

        return (
          <div key={roundNum} className={styles.matchBlock}>
            <div className={styles.matchRoundHeader}>OMGÅNG {roundNum}</div>
            <div className={styles.matchResultGrid}>
              {isHome ? (
                <>
                  <div className={`${styles.matchHomeCol} ${homeClass}`}>{homeTeam}</div>
                  <div className={`${styles.matchScore} ${scoreClass}`}>{m.homeGoals}-{m.awayGoals}</div>
                  <div className={`${styles.matchAwayCol} ${awayClass}`}>{awayTeam}</div>
                  {Array.from({ length: maxRows }, (_, ri) => (
                    <div key={ri} className={styles.matchGoalRow}>
                      <div className={styles.matchGoalHome}>
                        {userGrouped[ri] && (
                          <span>{userGrouped[ri].scorer} {userGrouped[ri].minutes}'</span>
                        )}
                      </div>
                      <div className={styles.matchGoalSep} />
                      <div className={styles.matchGoalAway}>
                        {oppLines[ri] && <span>{oppLines[ri]}</span>}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className={`${styles.matchHomeCol} ${homeClass}`}>{homeTeam}</div>
                  <div className={`${styles.matchScore} ${scoreClass}`}>{m.homeGoals}-{m.awayGoals}</div>
                  <div className={`${styles.matchAwayCol} ${awayClass}`}>{awayTeam}</div>
                  {Array.from({ length: maxRows }, (_, ri) => (
                    <div key={ri} className={styles.matchGoalRow}>
                      <div className={styles.matchGoalHome}>
                        {oppLines[ri] && <span>{oppLines[ri]}</span>}
                      </div>
                      <div className={styles.matchGoalSep} />
                      <div className={styles.matchGoalAway}>
                        {userGrouped[ri] && (
                          <span>{userGrouped[ri].scorer} {userGrouped[ri].minutes}'</span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
