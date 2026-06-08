import { useState } from 'react';
import type { GameConfig, DraftMode, RatingMode, Difficulty, FormationKey } from '../../types';
import { formationKeys } from '../../engine/simulationEngine';
import styles from './GameSetup.module.scss';

interface Props {
  onStart: (config: GameConfig) => void;
}

const formationQuotes: Record<string, string> = {
  '4-3-3': 'Holger Nilsson ritade upp den på en servett 1974. Fortfarande oöverträffad.',
  '4-4-2': 'Lika säkert som tacos på fredagar, Pelle Olsson hade varit stolt!',
  '4-5-1': 'Är det den mest flexibla uppställningen? Upp till bevis!',
  '3-4-3': 'Tre backar? Roy Hodgson skulle ha fått hjärtattack.',
  '3-5-2': 'Allan Kuhn lever! Mittfältsdominans till varje pris.',
  '5-4-1': 'Oklart hur man säger Catenaccio på svenska, men bussen är åtminstone parkerad!',
};

export default function GameSetup({ onStart }: Props) {
  const [draftMode, setDraftMode] = useState<DraftMode>('squad-first');
  const [ratingMode, setRatingMode] = useState<RatingMode>('season');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [formation, setFormation] = useState<FormationKey>('4-4-2');

  function handleStart() {
    onStart({ draftMode, ratingMode, difficulty, formation });
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>30-0</h1>
        <p className={styles.subtitle}>Drafta din ultimata Allsvenska XI</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Draft Mode</h2>
        <div className={styles.btnRow}>
          <button
            className={`${styles.optionBtn} ${draftMode === 'squad-first' ? styles.active : ''}`}
            onClick={() => setDraftMode('squad-first')}
          >
            <strong>Trupp först</strong>
            <span>Snurra klubb, välj spelare, auto-assign position</span>
          </button>
          <button
            className={`${styles.optionBtn} ${draftMode === 'position-first' ? styles.active : ''}`}
            onClick={() => setDraftMode('position-first')}
          >
            <strong>Position först</strong>
            <span>Välj position, snurra sen klubb för att fylla den</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Spelarbetyg</h2>
        <div className={styles.btnRow}>
          <button
            className={`${styles.optionBtn} ${ratingMode === 'season' ? styles.active : ''}`}
            onClick={() => setRatingMode('season')}
          >
            <strong>Karriärsäsonger</strong>
            <span>Spelarna betygsatta enligt säsong</span>
          </button>
          <button
            className={`${styles.optionBtn} ${ratingMode === 'peak' ? styles.active : ''}`}
            onClick={() => setRatingMode('peak')}
          >
            <strong>Toppade lag</strong>
            <span>Alla spelare får sin karriärs bästa betyg</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Svårighetsgrad</h2>
        <div className={styles.diffRow}>
          <button
            className={`${styles.diffBtn} ${difficulty === 'easy' ? styles.active : ''}`}
            onClick={() => setDifficulty('easy')}
          >
            <strong>Lätt</strong>
            <span>3 rerolls</span>
          </button>
          <button
            className={`${styles.diffBtn} ${difficulty === 'normal' ? styles.active : ''}`}
            onClick={() => setDifficulty('normal')}
          >
            <strong>Normal</strong>
            <span>1 reroll</span>
          </button>
          <button
            className={`${styles.diffBtn} ${difficulty === 'hard' ? styles.active : ''}`}
            onClick={() => setDifficulty('hard')}
          >
            <strong>Svårt</strong>
            <span>Inga rerolls</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Formation</h2>
        <div className={styles.formGrid}>
          {formationKeys.map((f) => (
            <button
              key={f}
              className={`${styles.formBtn} ${formation === f ? styles.active : ''}`}
              onClick={() => setFormation(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <p className={styles.formQuote}>{formationQuotes[formation]}</p>
      </div>

      <button className={styles.startBtn} onClick={handleStart}>
        Starta Draft
        <span className={styles.arrow}>&rarr;</span>
      </button>
    </div>
  );
}
