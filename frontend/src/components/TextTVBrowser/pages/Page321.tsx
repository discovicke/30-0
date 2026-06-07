import type { TeamXI, SeasonResult } from '../../../types';
import type { PreSeasonOdds } from '../../../engine/draftEngine';
import { generateArticleData } from '../../../engine/seasonArticle';
import styles from './pages.module.scss';

interface Props {
  result: SeasonResult | null;
  xi: TeamXI;
  odds: PreSeasonOdds;
  onRestart: () => void;
}

function positionSuffix(pos: number): string {
  if (pos === 1 || pos === 2) return pos + ':a';
  return pos + ':e';
}

export default function Page321({ result, odds, onRestart }: Props) {
  if (!result) {
    return (
      <div className={styles.lockedMessage}>
        SASONGEN HAR INTE SPELATS ANNU<br />
        NAVIGERA TILL 310 FOR ATT SIMULERA
      </div>
    );
  }

  const user = result.userTeam;
  const gd = user.goalsFor - user.goalsAgainst;
  const article = generateArticleData(result);
  const projHit = Math.abs(result.finalPosition - odds.projectedPosition) <= 2;

  return (
    <div>
      <div className={styles.pageTitle}>ALLSVENSKAN 2025 · SLUTRAPPORT</div>
      <div className={styles.pageSubtitle}>SASONGSARTIKEL</div>

      <div className={styles.quoteBlock}>
        "{article.quote}"
      </div>

      <div className={styles.section}>SASONGSRESULTAT</div>
      <div className={styles.statGrid}>
        <span className={styles.statLabel}>PLACERING</span>
        <span className={styles.statVal}>
          {positionSuffix(result.finalPosition)} AV {result.finalTable.length}
          {result.finalPosition === 1 ? '  (MASTARE)' : ''}
        </span>
        <span className={styles.statLabel}>PROJEKTERAD</span>
        <span className={styles.statVal}>
          {positionSuffix(odds.projectedPosition)}
          {projHit ? '  ✓ TRAFFADE' : '  ✗ MISSADE'}
        </span>
        <span className={styles.statLabel}>V - O - F</span>
        <span className={styles.statVal}>{user.wins} - {user.draws} - {user.losses}</span>
        <span className={styles.statLabel}>MALSKILLNAD</span>
        <span className={styles.statVal}>
          {gd >= 0 ? '+' : ''}{gd}  ({user.goalsFor} GM / {user.goalsAgainst} IM)
        </span>
        <span className={styles.statLabel}>POANG</span>
        <span className={styles.statVal}>{user.points}</span>
      </div>

      {(result.goldenBoot || result.playmaker || result.goldenGlove || result.playerOfSeason) && (
        <>
          <div className={styles.section}>INDIVIDUELLA UTMARKELSER</div>
          {result.goldenBoot && (
            <div className={styles.awardRow}>
              <span className={styles.awardLabel}>SKYTTEKUNG</span>
              <span className={styles.awardPlayer}>{result.goldenBoot.playerName.toUpperCase()}</span>
              <span className={styles.awardVal}>{result.goldenBoot.goals} MAL</span>
            </div>
          )}
          {result.playmaker && (
            <div className={styles.awardRow}>
              <span className={styles.awardLabel}>FLEST ASSIST</span>
              <span className={styles.awardPlayer}>{result.playmaker.playerName.toUpperCase()}</span>
              <span className={styles.awardVal}>{result.playmaker.assists} ASS</span>
            </div>
          )}
          {result.goldenGlove && (
            <div className={styles.awardRow}>
              <span className={styles.awardLabel}>FLEST NOLLOR</span>
              <span className={styles.awardPlayer}>{result.goldenGlove.playerName.toUpperCase()}</span>
              <span className={styles.awardVal}>{result.goldenGlove.cleanSheets} ST</span>
            </div>
          )}
          {result.playerOfSeason && (
            <div className={styles.awardRow}>
              <span className={styles.awardLabel}>ARETS SPELARE</span>
              <span className={styles.awardPlayer}>{result.playerOfSeason.playerName.toUpperCase()}</span>
              <span className={styles.awardVal}>
                {result.playerOfSeason.goals}G {result.playerOfSeason.assists}A
              </span>
            </div>
          )}
        </>
      )}

      <div className={styles.section}>LAGSTATISTIK</div>
      <div className={styles.statGrid}>
        <span className={styles.statLabel}>FLEST MAL I EN MATCH</span>
        <span className={styles.statVal}>
          {article.mostGoalsMatch.goals}  (OMG {article.mostGoalsMatch.round} VS {article.mostGoalsMatch.opponent.toUpperCase()})
        </span>
        <span className={styles.statLabel}>LANGSTA VINSTSVIT</span>
        <span className={styles.statVal}>{article.longestWinStreak} MATCHER</span>
        <span className={styles.statLabel}>HEMMAMATCHER</span>
        <span className={styles.statVal}>
          {article.homeRecord.w}V · {article.homeRecord.d}O · {article.homeRecord.l}F
        </span>
        <span className={styles.statLabel}>BORTAMATCHER</span>
        <span className={styles.statVal}>
          {article.awayRecord.w}V · {article.awayRecord.d}O · {article.awayRecord.l}F
        </span>
      </div>

      <hr className={styles.separator} />

      <button className={styles.restartBtn} onClick={onRestart}>
        SPELA IGEN
      </button>
    </div>
  );
}
