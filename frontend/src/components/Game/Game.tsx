import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GamePhase, Squad } from '../../types';
import Navbar from '../Navbar/Navbar';
import GameSetup from '../GameSetup/GameSetup';
import DraftPhase from '../DraftPhase/DraftPhase';
import styles from './Game.module.scss';

export default function Game() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const resp = await fetch('/data/squads.json');
      if (!resp.ok) throw new Error('Failed to load squads data');
      const data: Squad[] = await resp.json();
      setSquads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game data');
    } finally {
      setLoading(false);
    }
  }

  const handleStart = useCallback((c: GameConfig) => {
    setConfig(c);
    setPhase('draft');
  }, []);

  const handleRestart = useCallback(() => {
    setConfig(null);
    setPhase('setup');
  }, []);

  const modeLabel = config?.ratingMode === 'peak' ? 'PEAK' : 'SEASON';

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Laddar speldata...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.center}>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  if (phase === 'setup' || !config) {
    return (
      <div className={styles.wrapper}>
        <Navbar phase="setup" modeLabel={modeLabel} />
        <GameSetup onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Navbar phase={phase} modeLabel={modeLabel} />
      {phase === 'draft' && (
        <DraftPhase
          config={config}
          squads={squads}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
