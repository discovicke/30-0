import { useState, type FormEvent } from 'react';
import type { FormationKey, DreamTeamResult } from '../../types';
import { formationKeys, runSingleSimulation, formations } from '../../api/simulationApi';
import { Panel } from '../Layout/Layout';
import styles from './DreamTeam.module.scss';

export default function DreamTeam() {
  const [formation, setFormation] = useState<FormationKey>('4-4-2');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DreamTeamResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await runSingleSimulation(formation);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  const slotPositions = formations[formation];

  return (
    <Panel title="Dream Team — Single Season">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.label}>
            Formation
            <select value={formation} onChange={(e) => setFormation(e.target.value as FormationKey)}>
              {formationKeys.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
        </div>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Simulate Season'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.results}>
          <div className={styles.teamHeader}>
            <div className={styles.ratingGroup}>
              <Rating label="OVR" value={result.team.overall} />
              <Rating label="ATT" value={result.team.attack} />
              <Rating label="MID" value={result.team.midfield} />
              <Rating label="DEF" value={result.team.defence} />
              <Rating label="GK" value={result.team.gkRating} />
            </div>
          </div>

          <div className={styles.xi}>
            {slotPositions.map((slot) => {
              const player = result.team.slots[slot.label];
              return (
                <div key={slot.label} className={styles.xiSlot}>
                  <span className={styles.xiLabel}>{slot.label}</span>
                  {player ? (
                    <span className={styles.xiPlayer}>
                      {player.name}
                      <span className={styles.xiOvr}>{player.ovr.toFixed(1)}</span>
                    </span>
                  ) : (
                    <span className={styles.xiEmpty}>—</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.seasonCard}>
            <h3>Season Result</h3>
            <div className={styles.seasonGrid}>
              <div className={styles.seasonStat}>
                <span className={styles.seasonLabel}>W-D-L</span>
                <span className={styles.seasonValue}>{result.season.wins}-{result.season.draws}-{result.season.losses}</span>
              </div>
              <div className={styles.seasonStat}>
                <span className={styles.seasonLabel}>Points</span>
                <span className={styles.seasonValue}>{result.season.points}</span>
              </div>
              <div className={styles.seasonStat}>
                <span className={styles.seasonLabel}>GD</span>
                <span className={styles.seasonValue}>+{result.season.gd}</span>
              </div>
              <div className={styles.seasonStat}>
                <span className={styles.seasonLabel}>Finish</span>
                <span className={styles.seasonValue}>{result.position}th</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
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
