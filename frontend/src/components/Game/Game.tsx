import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GamePhase, Squad, RatingMode, SavedDraftState } from '../../types';
import Header from '../Header/Header';
import LandingPage from '../LandingPage/LandingPage';
import GameSetup from '../GameSetup/GameSetup';
import DraftPhase from '../DraftPhase/DraftPhase';
import Footer from '../Footer/Footer';
import styles from './Game.module.scss';

function loadSavedDraft(): SavedDraftState | null {
  try {
    const raw = localStorage.getItem('30-0-draft');
    if (!raw) return null;
    return JSON.parse(raw) as SavedDraftState;
  } catch {
    return null;
  }
}

function clearSavedDraft() {
  localStorage.removeItem('30-0-draft');
}

export default function Game() {
  const [phase, setPhase] = useState<GamePhase>('landing');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDraft, setSavedDraft] = useState<SavedDraftState | null>(loadSavedDraft());

  function filterSquads(data: Squad[], c: GameConfig | null): Squad[] {
    if (!c) return data;
    let result = data;
    if (c.seasonMin > 2001) result = result.filter((s) => s.season >= c.seasonMin);
    if (c.seasonMax < 2025) result = result.filter((s) => s.season <= c.seasonMax);
    return result;
  }

  async function loadData(mode: RatingMode, c?: GameConfig | null) {
    if (loading) return;
    setLoading(true);
    try {
      const url = mode === 'peak' ? '/data/squads_peak.json' : '/data/squads.json';
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to load ${mode} squads data`);
      const data: Squad[] = await resp.json();
      setSquads(filterSquads(data, c ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game data');
    } finally {
      setLoading(false);
    }
  }

  // Load data when entering setup or draft
  useEffect(() => {
    if (phase !== 'setup' && phase !== 'draft') return;
    if (squads.length > 0) return;
    const mode = savedDraft?.config.ratingMode ?? config?.ratingMode ?? 'season';
    const c = config ?? savedDraft?.config ?? null;
    loadData(mode, c);
  }, [phase]);

  const handleStart = useCallback(async (c: GameConfig) => {
    setConfig(c);
    clearSavedDraft();
    setSavedDraft(null);
    await loadData(c.ratingMode, c);
    setPhase('draft');
  }, []);

  const handleContinue = useCallback(async () => {
    const saved = loadSavedDraft();
    if (!saved) return;
    setConfig(saved.config);
    setSavedDraft(saved);
    await loadData(saved.config.ratingMode, saved.config);
    setPhase('draft');
  }, []);

  const handleRestart = useCallback(() => {
    clearSavedDraft();
    setSavedDraft(null);
    setConfig(null);
    setPhase('landing');
  }, []);

  const handleHome = useCallback(() => {
    if (phase === 'landing') return;
    setPhase('landing');
  }, [phase]);

  const canContinue = loadSavedDraft() !== null;

  // Landing page
  if (phase === 'landing') {
    return (
      <div className={styles.wrapper}>
        <Header onHome={handleHome} />
        <LandingPage onStart={() => setPhase('setup')} onContinue={handleContinue} canContinue={canContinue} />
        <Footer />
      </div>
    );
  }

  // Loading state
  if (loading && squads.length === 0) {
    return (
      <div className={styles.wrapper}>
        <Header onHome={handleHome} />
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Laddar speldata...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error && squads.length === 0) {
    return (
      <div className={styles.wrapper}>
        <Header onHome={handleHome} />
        <div className={styles.center}>
          <p className={styles.error}>{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Setup phase
  if (phase === 'setup' || !config) {
    return (
      <div className={styles.wrapper}>
        <Header onHome={handleHome} />
        <GameSetup onStart={handleStart} />
        <Footer />
      </div>
    );
  }

  // Draft phase
  return (
    <div className={`${styles.wrapper} ${styles.wrapperNoScroll}`}>
      <Header onHome={handleHome} />
      <DraftPhase
        config={config}
        squads={squads}
        onRestart={handleRestart}
        savedState={savedDraft ?? undefined}
      />
      <Footer />
    </div>
  );
}
