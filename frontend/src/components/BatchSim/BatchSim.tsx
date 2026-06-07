import { useState, type FormEvent } from 'react';
import type { FormationKey, BatchResult } from '../../types';
import { formationKeys, runBatchSimulation } from '../../api/simulationApi';
import { Panel } from '../Layout/Layout';
import styles from './BatchSim.module.scss';

export default function BatchSim() {
  const [formation, setFormation] = useState<FormationKey>('4-4-2');
  const [sims, setSims] = useState(10000);
  const [targetOvr, setTargetOvr] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await runBatchSimulation(formation, sims, targetOvr || undefined);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Batch Simulation — Best Possible XI">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.label}>
            Formation
            <select value={formation} onChange={(e) => setFormation(e.target.value as FormationKey)}>
              {formationKeys.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Simulations
            <input type="number" value={sims} min={100} max={100000} step={100}
              onChange={(e) => setSims(Number(e.target.value))} />
          </label>
          <label className={styles.label}>
            Target OVR (0 = auto)
            <input type="number" value={targetOvr} min={0} max={99}
              onChange={(e) => setTargetOvr(Number(e.target.value))} />
          </label>
        </div>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Running...' : `Run ${sims.toLocaleString()} Seasons`}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.results}>
          <div className={styles.ovrBadge}>
            <span className={styles.ovrLabel}>Team OVR</span>
            <span className={styles.ovrValue}>{result.ovr.toFixed(1)}</span>
          </div>

          <div className={styles.card}>
            <h3>Undefeated Seasons</h3>
            <div className={styles.bigStat}>
              <span className={styles.bigNumber}>{result.undefeated}</span>
              <span className={styles.bigUnit}>/ {result.totalSims.toLocaleString()}</span>
            </div>
            <div className={styles.pct}>{result.undefeatedPct.toFixed(3)}%</div>
            <div className={styles.ratio}>
              1 in {result.totalSims / Math.max(result.undefeated, 1)} seasons
            </div>
          </div>

          <div className={styles.cardsRow}>
            <div className={styles.card}>
              <h3>Best Result</h3>
              <div className={styles.record}>
                {result.bestWins}W - {result.bestDraws}D - {result.bestLosses}L
              </div>
              <div className={styles.meta}>
                {result.bestPoints} pts | +{result.bestGd} GD
              </div>
            </div>
            <div className={styles.card}>
              <h3>Least Losses (undefeated)</h3>
              <div className={styles.record}>
                {result.leastLossWins}W - {result.leastLossDraws}D - {result.leastLossLosses}L
              </div>
              <div className={styles.meta}>
                {result.leastLossPoints} pts
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
