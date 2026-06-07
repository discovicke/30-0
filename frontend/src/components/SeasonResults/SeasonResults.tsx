import type { SeasonResult, PlayerCard } from '../../types';
import FormationView from '../FormationView/FormationView';
import styles from './SeasonResults.module.scss';

interface Props {
  result: SeasonResult;
  slots: Record<string, PlayerCard>;
  formation: '4-3-3' | '4-4-2' | '3-5-2';
  onRestart: () => void;
}

export default function SeasonResults({ result, slots, formation, onRestart }: Props) {
  const u = result.userTeam;
  const gd = u.goalsFor - u.goalsAgainst;

  const ordinal = (n: number) => {
    if (n === 1) return 'a';
    if (n === 2) return 'a';
    if (n === 3) return 'e';
    return 'e';
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <h1 className={styles.title}>Säsongen är slut!</h1>
        <div className={styles.record}>
          {u.wins}W - {u.draws}D - {u.losses}L
        </div>
        <div className={styles.pts}>{u.points} poäng</div>
        <div className={styles.gd}>Målskillnad: {gd >= 0 ? `+${gd}` : gd}</div>
        <div className={styles.pos}>
          Slutade {result.finalPosition}{ordinal(result.finalPosition)} plats
          (förväntad {result.expectedPosition.toFixed(0)}a)
        </div>

        {u.losses === 0 && (
          <div className={styles.undefeated}>
            🏆 Obesegrad säsong!
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <FormationView
            formation={formation}
            slots={slots}
            compact
          />

          <div className={styles.ratingsCard}>
            <h3>Lagbetyg</h3>
            <div className={styles.ratings}>
              <Rating label="OVR" value={u.overall} />
              <Rating label="ATT" value={u.attack} />
              <Rating label="MID" value={u.midfield} />
              <Rating label="DEF" value={u.defence} />
              <Rating label="GK" value={u.gkRating} />
            </div>
          </div>
        </div>

        <div className={styles.column}>
          {/* Final table */}
          <div className={styles.tableCard}>
            <h3>Sluttabell</h3>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>#</span>
                <span>Lag</span>
                <span>P</span>
                <span>W</span>
                <span>D</span>
                <span>L</span>
                <span>GD</span>
              </div>
              {result.finalTable.map((t, i) => {
                const tGd = (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0);
                const isUser = t.name === 'Your XI';
                return (
                  <div
                    key={t.name}
                    className={`${styles.tableRow} ${isUser ? styles.userRow : ''}`}
                  >
                    <span>{i + 1}</span>
                    <span className={styles.teamName}>
                      {t.name}
                    </span>
                    <span className={styles.bold}>{t.points}</span>
                    <span>{t.wins}</span>
                    <span>{t.draws}</span>
                    <span>{t.losses}</span>
                    <span>{tGd >= 0 ? `+${tGd}` : tGd}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Awards */}
          <div className={styles.awardsCard}>
            <h3>Utmärkelser</h3>
            <div className={styles.awards}>
              {result.goldenBoot && (
                <div className={styles.award}>
                  <span className={styles.awardIcon}>⚽</span>
                  <span>
                    <strong>Golden Boot:</strong> {result.goldenBoot.playerName} ({result.goldenBoot.goals} mål)
                  </span>
                </div>
              )}
              {result.playmaker && (
                <div className={styles.award}>
                  <span className={styles.awardIcon}>🎯</span>
                  <span>
                    <strong>Playmaker:</strong> {result.playmaker.playerName} ({result.playmaker.assists} assists)
                  </span>
                </div>
              )}
              {result.goldenGlove && (
                <div className={styles.award}>
                  <span className={styles.awardIcon}>🧤</span>
                  <span>
                    <strong>Golden Glove:</strong> {result.goldenGlove.playerName} ({result.goldenGlove.cleanSheets} hållna nollor)
                  </span>
                </div>
              )}
              {result.playerOfSeason && (
                <div className={styles.award}>
                  <span className={styles.awardIcon}>🏆</span>
                  <span>
                    <strong>Player of the Season:</strong> {result.playerOfSeason.playerName} ({result.playerOfSeason.goals}G, {result.playerOfSeason.assists}A)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button className={styles.restartBtn} onClick={onRestart}>
        Spela igen
      </button>
    </div>
  );
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.rating}>
      <span className={styles.ratingLabel}>{label}</span>
      <span className={styles.ratingValue}>{value.toFixed(1)}</span>
    </div>
  );
}
