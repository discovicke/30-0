import type { SeasonResult } from '../../types';
import TextTVPanel from '../TextTVPanel/TextTVPanel';
import styles from './SeasonResults.module.scss';

interface Props {
  result: SeasonResult;
  onRestart: () => void;
}

export default function SeasonResults({ result, onRestart }: Props) {
  const u = result.userTeam;
  const gd = u.goalsFor - u.goalsAgainst;

  return (
    <div className={styles.container}>
      <TextTVPanel
        title={`SVT TEXT-TV  SID 378  ALLSVENSKAN`}
        meta="SLUTTABELL"
      >
        <div className={styles.headerInfo}>
          <div className={styles.bigRecord}>
            {u.wins}W - {u.draws}D - {u.losses}L
          </div>
          <div className={styles.ptsLine}>
            {u.points} POÄNG  GD {gd >= 0 ? `+${gd}` : gd}
          </div>
          <div className={styles.posLine}>
            PLATS {result.finalPosition}/{result.finalTable.length}
          </div>
          {u.losses === 0 && (
            <div className={styles.undefeated}>
              30-0  OBESEGRADE!
            </div>
          )}
        </div>

        <table className={styles.ttvTable}>
          <thead>
            <tr>
              <th style={{ width: 10 }}>#</th>
              <th>Lag</th>
              <th>S</th>
              <th>V</th>
              <th>O</th>
              <th>F</th>
              <th>+/-</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            {result.finalTable.map((t, i) => {
              const tGd = (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0);
              const isUser = t.name === 'Your XI';
              const total = (t.wins ?? 0) + (t.draws ?? 0) + (t.losses ?? 0);
              return (
                <tr key={t.name} className={isUser ? styles.you : ''}>
                  <td className={styles.rank}>{i + 1}</td>
                  <td>{isUser ? 'DITT LAG' : t.name}</td>
                  <td>{total}</td>
                  <td>{t.wins ?? 0}</td>
                  <td>{t.draws ?? 0}</td>
                  <td>{t.losses ?? 0}</td>
                  <td>{tGd >= 0 ? `+${tGd}` : `${tGd}`}</td>
                  <td className={styles.bold}>{t.points ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TextTVPanel>

      <TextTVPanel title="UTMARKELSER" meta="">
        <div className={styles.awards}>
          {result.goldenBoot && (
            <div className={styles.award}>
              <span className={styles.awardIcon}>G</span>
              <span>{result.goldenBoot.playerName}  {result.goldenBoot.goals} mål</span>
            </div>
          )}
          {result.playmaker && (
            <div className={styles.award}>
              <span className={styles.awardIcon}>A</span>
              <span>{result.playmaker.playerName}  {result.playmaker.assists} assists</span>
            </div>
          )}
          {result.goldenGlove && (
            <div className={styles.award}>
              <span className={styles.awardIcon}>C</span>
              <span>{result.goldenGlove.playerName}  {result.goldenGlove.cleanSheets} hallna nollor</span>
            </div>
          )}
          {result.playerOfSeason && (
            <div className={styles.award}>
              <span className={styles.awardIcon}>P</span>
              <span>{result.playerOfSeason.playerName}  {result.playerOfSeason.goals}G {result.playerOfSeason.assists}A</span>
            </div>
          )}
        </div>
      </TextTVPanel>

      <button className={styles.restartBtn} onClick={onRestart}>
        Spela igen
      </button>
    </div>
  );
}
