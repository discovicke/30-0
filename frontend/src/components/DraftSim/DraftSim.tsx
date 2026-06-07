import { useState, type FormEvent } from 'react';
import type { FormationKey, DraftMode, DraftResult } from '../../types';
import { formationKeys, runDraftSimulation } from '../../api/simulationApi';
import { Panel } from '../Layout/Layout';
import styles from './DraftSim.module.scss';

export default function DraftSim() {
  const [formation, setFormation] = useState<FormationKey>('4-4-2');
  const [sims, setSims] = useState(10000);
  const [rerolls, setRerolls] = useState(1);
  const [mode, setMode] = useState<DraftMode>('season');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await runDraftSimulation(formation, sims, rerolls, mode);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Draft Simulation">
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
            Rerolls
            <input type="number" value={rerolls} min={0} max={10}
              onChange={(e) => setRerolls(Number(e.target.value))} />
          </label>
          <label className={styles.label}>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value as DraftMode)}>
              <option value="season">Season</option>
              <option value="peak">Peak</option>
            </select>
          </label>
        </div>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Running...' : `Run ${sims.toLocaleString()} Simulations`}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <div className={styles.results}>
          <div className={styles.grid}>
            <Stat label="Min" value={result.min.toFixed(1)} />
            <Stat label="P10" value={result.p10.toFixed(1)} />
            <Stat label="P25" value={result.p25.toFixed(1)} />
            <Stat label="Median" value={result.median.toFixed(1)} />
            <Stat label="Average" value={result.avg.toFixed(1)} highlight />
            <Stat label="P75" value={result.p75.toFixed(1)} />
            <Stat label="P90" value={result.p90.toFixed(1)} />
            <Stat label="P95" value={result.p95.toFixed(1)} />
            <Stat label="P99" value={result.p99.toFixed(1)} />
            <Stat label="Max" value={result.max.toFixed(1)} highlight />
          </div>

          <div className={styles.thresholds}>
            <h3>Probability to reach OVR</h3>
            <div className={styles.thresholdGrid}>
              <ThresholdRow threshold={86} pct={result.p86} total={sims} />
              <ThresholdRow threshold={87} pct={result.p87} total={sims} />
              <ThresholdRow threshold={88} pct={result.p88} total={sims} />
              <ThresholdRow threshold={89} pct={result.p89} total={sims} />
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${styles.stat} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function ThresholdRow({ threshold, pct, total }: { threshold: number; pct: number; total: number }) {
  const count = Math.round(pct * total / 100);
  return (
    <div className={styles.thresholdRow}>
      <span className={styles.thresholdLabel}>≥{threshold}</span>
      <div className={styles.thresholdBar}>
        <div className={styles.thresholdFill} style={{ width: `${Math.min(pct * 5, 100)}%` }} />
      </div>
      <span className={styles.thresholdValue}>{pct.toFixed(2)}%</span>
      <span className={styles.thresholdCount}>({count}/{total.toLocaleString()})</span>
    </div>
  );
}
