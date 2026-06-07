import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GamePhase, PlayerCard, SeasonResult, Squad, MatchResult } from '../../types';
import { simulateSeason, extractUserMatches } from '../../engine/simulationEngine';
import Navbar from '../Navbar/Navbar';
import GameSetup from '../GameSetup/GameSetup';
import DraftPhase from '../DraftPhase/DraftPhase';
import MatchReplay from '../MatchReplay/MatchReplay';
import SeasonResults from '../SeasonResults/SeasonResults';
import styles from './Game.module.scss';

export default function Game() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [slots, setSlots] = useState<Record<string, PlayerCard>>({});
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [userMatches, setUserMatches] = useState<MatchResult[]>([]);
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
    setUserMatches([]);
    setPhase('draft');
  }, []);

  const handleDraftComplete = useCallback((filled: Record<string, PlayerCard>) => {
    if (!config) return;
    setSlots(filled);
    setPhase('simulating');

    const xi = buildTeamXI(filled, config.formation);
    const simResult = simulateSeason(xi, config.formation);
    setResult(simResult);
    setUserMatches(extractUserMatches(simResult.matches));
    setPhase('match-replay');
  }, [config]);

  const handleReplayComplete = useCallback(() => {
    setPhase('results');
  }, []);

  const handleRestart = useCallback(() => {
    setConfig(null);
    setSlots({});
    setResult(null);
    setUserMatches([]);
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

      {phase === 'simulating' && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Simulerar sasongen...</p>
        </div>
      )}

      {phase === 'draft' && (
        <DraftPhase
          config={config}
          squads={squads}
          onComplete={handleDraftComplete}
        />
      )}

      {phase === 'match-replay' && result && (
        <MatchReplay
          userMatches={userMatches}
          aiTeams={result.aiTeams}
          result={{ userTeam: result.userTeam }}
          slots={slots}
          formation={config.formation}
          onComplete={handleReplayComplete}
        />
      )}

      {phase === 'results' && result && (
        <SeasonResults
          result={result}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

function buildTeamXI(slots: Record<string, PlayerCard>, formation: '4-3-3' | '4-4-2' | '3-5-2'): {
  name: string;
  slots: Record<string, PlayerCard>;
  formation: '4-3-3' | '4-4-2' | '3-5-2';
  attack: number;
  midfield: number;
  defence: number;
  gkRating: number;
  overall: number;
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
} {
  return {
    name: 'Your XI',
    slots,
    formation,
    attack: 0, midfield: 0, defence: 0, gkRating: 0, overall: 0,
    goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0, points: 0,
  };
}
