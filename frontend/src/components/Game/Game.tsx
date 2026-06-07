import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GamePhase, PlayerCard, SeasonResult, Squad } from '../../types';
import { simulateSeason } from '../../engine/simulationEngine';
import GameSetup from '../GameSetup/GameSetup';
import DraftPhase from '../DraftPhase/DraftPhase';
import SeasonResults from '../SeasonResults/SeasonResults';
import styles from './Game.module.scss';

export default function Game() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [slots, setSlots] = useState<Record<string, PlayerCard>>({});
  const [result, setResult] = useState<SeasonResult | null>(null);
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
    setSlots({});
    setResult(null);
    setPhase('draft');
  }, []);

  const handleDraftComplete = useCallback((filled: Record<string, PlayerCard>) => {
    setSlots(filled);
    setPhase('simulating');

    // Run season simulation
    if (!config) return;
    const xi = buildTeamXI(filled, config.formation);
    const simResult = simulateSeason(xi, config.formation);
    setResult(simResult);
    setPhase('results');
  }, [config]);

  const handleRestart = useCallback(() => {
    setConfig(null);
    setSlots({});
    setResult(null);
    setPhase('setup');
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Laddar speldata...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loading}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (phase === 'setup' || !config) {
    return <GameSetup onStart={handleStart} />;
  }

  if (phase === 'draft') {
    return (
      <DraftPhase
        config={config}
        squads={squads}
        onComplete={handleDraftComplete}
        onBack={handleRestart}
      />
    );
  }

  if (phase === 'simulating') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Simulerar säsongen...</p>
      </div>
    );
  }

  if (phase === 'results' && result) {
    return (
      <SeasonResults
        result={result}
        slots={slots}
        formation={config.formation}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}

function buildTeamXI(
  slots: Record<string, PlayerCard>,
  formation: '4-3-3' | '4-4-2' | '3-5-2'
) {
  return {
    name: 'Your XI',
    slots,
    formation,
    attack: 0,
    midfield: 0,
    defence: 0,
    gkRating: 0,
    overall: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
  };
}
