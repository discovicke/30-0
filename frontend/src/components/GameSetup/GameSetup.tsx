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
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [ratingMode, setRatingMode] = useState<RatingMode>('season');
  const [draftMode, setDraftMode] = useState<DraftMode>('squad-first');
  const [showRatings, setShowRatings] = useState(true);
  const [seasonMin, setSeasonMin] = useState(2001);
  const [seasonMax, setSeasonMax] = useState(2025);
  const [formation, setFormation] = useState<FormationKey>('4-4-2');
  const [matchByMatch, setMatchByMatch] = useState(false);

  const ratingsHidden = difficulty === 'hard' || !showRatings;

  function handleStart() {
    onStart({
      draftMode,
      ratingMode,
      difficulty,
      formation,
      showRatings: difficulty === 'hard' ? false : showRatings,
      seasonMin,
      seasonMax,
      matchByMatch,
    });
  }

  function handleSeasonRangeChange(type: 'min' | 'max', value: number) {
    if (type === 'min') {
      const clamped = Math.min(value, seasonMax - 1);
      setSeasonMin(clamped);
    } else {
      const clamped = Math.max(value, seasonMin + 1);
      setSeasonMax(clamped);
    }
  }

  const rangePercentMin = ((seasonMin - 2001) / 24) * 100;
  const rangePercentMax = ((seasonMax - 2001) / 24) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>30-0</h1>
        <p className={styles.subtitle}>Drafta din ultimata Allsvenska XI</p>
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
            <span>Inga rerolls, dolda attribut</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Visa attribut</h2>
        <div className={styles.btnRow}>
          <button
              className={`${styles.optionBtn} ${!ratingsHidden ? styles.active : ''} ${difficulty === 'hard' ? styles.disabled : ''}`}
              onClick={() => difficulty !== 'hard' && setShowRatings(true)}
          >
            <strong>Visa</strong>
            <span>Se spelarnas attribut</span>
          </button>
          <button
              className={`${styles.optionBtn} ${ratingsHidden ? styles.active : ''} ${difficulty === 'hard' ? styles.forced : ''}`}
              onClick={() => difficulty !== 'hard' && setShowRatings(false)}
          >
            <strong>Dölj</strong>
            <span>{difficulty === 'hard' ? 'Påtvingat (svår nivå)' : 'Göm spelarnas attribut'}</span>
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
            <strong>Säsongs-attribut</strong>
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
        <h2 className={styles.sectionTitle}>Draft Mode</h2>
        <div className={styles.btnRow}>
          <button
            className={`${styles.optionBtn} ${draftMode === 'squad-first' ? styles.active : ''}`}
            onClick={() => setDraftMode('squad-first')}
          >
            <strong>Trupp först</strong>
            <span>Snurra först klubb och säsong, sen får du välja vilken position att fylla</span>
          </button>
          <button
            className={`${styles.optionBtn} ${draftMode === 'position-first' ? styles.active : ''}`}
            onClick={() => setDraftMode('position-first')}
          >
            <strong>Position först</strong>
            <span>Välj först en position, sen snurra klubb och säsong</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Säsongsintervall</h2>
        <div className={styles.rangeLabels}>
          <span>{seasonMin}</span>
          <span>{seasonMax}</span>
        </div>
        <div className={styles.rangeWrapper}>
          <div className={styles.rangeTrack}>
            <div
              className={styles.rangeFill}
              style={{ left: `${rangePercentMin}%`, width: `${rangePercentMax - rangePercentMin}%` }}
            />
          </div>
          <input
            type="range"
            min={2001}
            max={2025}
            value={seasonMin}
            onChange={(e) => handleSeasonRangeChange('min', Number(e.target.value))}
            className={`${styles.rangeInput} ${styles.rangeInputMin}`}
          />
          <input
            type="range"
            min={2001}
            max={2025}
            value={seasonMax}
            onChange={(e) => handleSeasonRangeChange('max', Number(e.target.value))}
            className={`${styles.rangeInput} ${styles.rangeInputMax}`}
          />
        </div>
        <div className={styles.rangeTicks}>
          {[2001, 2005, 2010, 2015, 2020, 2025].map((y) => (
            <span key={y} className={styles.rangeTick}>{y}</span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Matchupplevelse</h2>
        <div className={styles.btnRow}>
          <button
            className={`${styles.optionBtn} ${!matchByMatch ? styles.active : ''}`}
            onClick={() => setMatchByMatch(false)}
          >
            <strong>Snabb</strong>
            <span>Hela säsongen simuleras direkt</span>
          </button>
          <button
            className={`${styles.optionBtn} ${matchByMatch ? styles.active : ''}`}
            onClick={() => setMatchByMatch(true)}
          >
            <strong>Match för match</strong>
            <span>Läs ett referat för varje omgång</span>
          </button>
        </div>
      </div>

      <button className={styles.startBtn} onClick={handleStart}>
        Starta Draft
        <span className={styles.arrow}>&rarr;</span>
      </button>
    </div>
  );
}

