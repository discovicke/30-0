import { useState } from 'react';
import type { GameConfig, DraftMode, RatingMode, Difficulty, FormationKey } from '../../types';
import { formationKeys } from '../../engine/simulationEngine';
import styles from './GameSetup.module.scss';

interface Props {
  onStart: (config: GameConfig) => void;
}

export default function GameSetup({ onStart }: Props) {
  const [draftMode, setDraftMode] = useState<DraftMode>('squad-first');
  const [ratingMode, setRatingMode] = useState<RatingMode>('season');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [formation, setFormation] = useState<FormationKey>('4-4-2');

  function handleStart() {
    onStart({ draftMode, ratingMode, difficulty, formation });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>30-0</h1>
        <p className={styles.subtitle}>Bygg det ultimata Allsvenska laget</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Spelinställningar</h2>

        <label className={styles.label}>
          Draft Mode
          <select value={draftMode} onChange={(e) => setDraftMode(e.target.value as DraftMode)}>
            <option value="squad-first">Squad First — välj klubb först</option>
            <option value="position-first">Position First — välj position först</option>
          </select>
        </label>

        <label className={styles.label}>
          Rating Mode
          <select value={ratingMode} onChange={(e) => setRatingMode(e.target.value as RatingMode)}>
            <option value="season">Current Season — säsongens OVR</option>
            <option value="peak">Peak — karriärens högsta OVR</option>
          </select>
        </label>

        <label className={styles.label}>
          Formation
          <select value={formation} onChange={(e) => setFormation(e.target.value as FormationKey)}>
            {formationKeys.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <label className={styles.label}>
          Svårighetsgrad
          <div className={styles.difficultyRow}>
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d === 'easy' && 'Easy (3 rerolls)'}
                {d === 'normal' && 'Normal (1 reroll)'}
                {d === 'hard' && 'Hard (0 rerolls)'}
              </button>
            ))}
          </div>
        </label>

        <button className={styles.startBtn} onClick={handleStart}>
          Starta Draft
        </button>
      </div>

      <div className={styles.rules}>
        <h3>Så fungerar det</h3>
        <ul>
          <li>Drafta 11 spelare från Allsvenska trupper 2001–2025</li>
          <li>Fyll din formation och simulera en 30-matchars säsong</li>
          <li>Målet: gå obesegrad — 30-0</li>
        </ul>
        {draftMode === 'squad-first' && (
          <p className={styles.modeHint}>
            <strong>Squad First:</strong> Snurra hjulet → se en trupp → välj spelare → assigna position
          </p>
        )}
        {draftMode === 'position-first' && (
          <p className={styles.modeHint}>
            <strong>Position First:</strong> Välj position först → snurra hjulet → se tillgängliga spelare för positionen
          </p>
        )}
      </div>
    </div>
  );
}
