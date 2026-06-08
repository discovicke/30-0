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

function performanceLabel(final: number, projected: number): string {
  if (final < projected) return 'ÖVERPRESTATION';
  if (final === projected) return 'FÖRVANTAT';
  return 'UNDERPRESTATION';
}

export default function Page321({ result, odds, onRestart }: Props) {
  if (!result) {
    return (
      <div className={styles.lockedMessage}>
        SÄSONGEN HAR INTE SPELATS ÄNNU<br />
        NAVIGERA TILL 310 FÖR ATT SIMULERA
      </div>
    );
  }

  const user = result.userTeam;
  const gd = user.goalsFor - user.goalsAgainst;
  const article = generateArticleData(result);

  return (
    <div>
      <div className={styles.pageTitle}>SÄSONGSAVSLUTNING - SLUTRAPPORT</div>
      <div className={styles.pageSubtitle}>SÄSONGSKRÖNIKAN</div>

      <div className={styles.quoteBlock}>
        "{article.quote}"
      </div>

      <div className={styles.section}>SÄSONGSRESULTAT</div>
      <div className={styles.statGrid}>
        <span className={styles.statLabel}>PLACERING</span>
        <span className={styles.statVal}>
          {positionSuffix(result.finalPosition)} AV {result.finalTable.length}
          {result.finalPosition === 1 ? '  (MÄSTARE)' : ''}
        </span>
        <span className={styles.statLabel}>PROJEKTERAD</span>
        <span className={styles.statVal}>
          {positionSuffix(odds.projectedPosition)}
        </span>
        <span className={styles.statLabel}>PRESTATION</span>
        <span className={styles.statVal}>
          {performanceLabel(result.finalPosition, odds.projectedPosition)}
        </span>
        <span className={styles.statLabel}>V - O - F</span>
        <span className={styles.statVal}>{user.wins} - {user.draws} - {user.losses}</span>
        <span className={styles.statLabel}>MÅLSKILLNAD</span>
        <span className={styles.statVal}>
          {gd >= 0 ? '+' : ''}{gd}  ({user.goalsFor} GM / {user.goalsAgainst} IM)
        </span>
        <span className={styles.statLabel}>POÄNG</span>
        <span className={styles.statVal}>{user.points}</span>
      </div>

      {(result.goldenBoot || result.playmaker || result.goldenGlove || result.playerOfSeason) && (
        <>
          <div className={styles.section}>INDIVIDUELLA UTMÄRKELSER</div>
          {result.goldenBoot && (
            <div className={styles.awardRow}>
              <span className={styles.awardLabel}>SKYTTEKUNG</span>
              <span className={styles.awardPlayer}>{result.goldenBoot.playerName.toUpperCase()}</span>
              <span className={styles.awardVal}>{result.goldenBoot.goals} MÅL</span>
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
              <span className={styles.awardLabel}>ÅRETS SPELARE</span>
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
        <span className={styles.statLabel}>FLEST MÅL I EN MATCH</span>
        <span className={styles.statVal}>
          {article.mostGoalsMatch.goals}  (OMG {article.mostGoalsMatch.round} VS {article.mostGoalsMatch.opponent.toUpperCase()})
        </span>
        <span className={styles.statLabel}>LÄNGSTA VINSTSVIT</span>
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
