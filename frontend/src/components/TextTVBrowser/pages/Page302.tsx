import type { TeamXI } from '../../../types';
import type { PreSeasonOdds } from '../../../engine/draftEngine';
import { getAllAITeams } from '../../../engine/simulationEngine';
import styles from './pages.module.scss';

interface Props {
  xi: TeamXI;
  odds: PreSeasonOdds;
  simulated: boolean;
  onNavigate: (page: number) => void;
}

function makeBar(val: number, max: number = 99): string {
  const ratio = Math.min(1, val / max);
  const filled = Math.round(ratio * 10);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
}

function positionSuffix(pos: number): string {
  if (pos === 1 || pos === 2) return pos + ':a';
  return pos + ':e';
}

export default function Page302({ xi, odds, simulated, onNavigate }: Props) {
  const aiTeams = getAllAITeams();
  const allTeams = [...aiTeams, { name: 'DITT LAG', strength: xi.overall, tier: undefined }]
    .sort((a, b) => b.strength - a.strength);

  const projRange = odds.projectedPosition <= 3
    ? '1-5 PLATS'
    : odds.projectedPosition <= 8
    ? `${odds.projectedPosition - 2}-${odds.projectedPosition + 2} PLATS`
    : `${odds.projectedPosition - 2}-${odds.projectedPosition + 1} PLATS`;

  const isTitle = odds.projectedPosition <= 3;
  const isRelegation = odds.projectedPosition >= 14;

  // Find strongest & weakest areas
  const areas = [
    { label: 'ANFALL', val: xi.attack },
    { label: 'MITTFÄLT', val: xi.midfield },
    { label: 'FÖRSVAR', val: xi.defence },
    { label: 'MÅLVAKT', val: xi.gkRating },
  ];
  const strongest = [...areas].sort((a, b) => b.val - a.val)[0];
  const weakest = [...areas].sort((a, b) => a.val - b.val)[0];

  return (
    <div>
      <div className={styles.pageTitle}>ALLSVENSKT 30-0 · SÄSONG 2025</div>
      <div className={styles.pageSubtitle}>FÖRHANDSTIPS</div>

      <div className={styles.row}>
        <span className={styles.label}>PROJEKTERAD PLACERING</span>
        <span className={styles.valYellow}>{projRange}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>TITELKANDIDAT</span>
        <span className={styles.val}>{isTitle ? 'JA' : 'NEJ'}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>NEDFLYTTNINGSRISK</span>
        <span className={styles.val}>{isRelegation ? 'JA' : 'NEJ'}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>FÖRVÄNTADE POÄNG</span>
        <span className={styles.valYellow}>{odds.projectedPoints}</span>
      </div>

      <div className={styles.section}>LAGANALYS</div>

      <div className={styles.bodyText}>STYRKOR</div>
      <div className={styles.barRow}>
        <span className={styles.barLabel}>{strongest.label}</span>
        <span className={styles.barTrack}>{makeBar(strongest.val)}</span>
        <span className={styles.barValue}>{Math.round(strongest.val)}/99</span>
      </div>

      <div className={styles.bodyText}>SVAGHETER</div>
      <div className={styles.barRow}>
        <span className={styles.barLabel}>{weakest.label}</span>
        <span className={styles.barTrack}>{makeBar(weakest.val)}</span>
        <span className={styles.barValue}>{Math.round(weakest.val)}/99</span>
      </div>

      <div className={styles.section}>ALLA OMRADEN</div>
      {areas.map((a) => (
        <div key={a.label} className={styles.barRow}>
          <span className={styles.barLabel}>{a.label}</span>
          <span className={styles.barTrack}>{makeBar(a.val)}</span>
          <span className={styles.barValue}>{Math.round(a.val)}/99</span>
        </div>
      ))}

      <div className={styles.section}>TIPPAD TOPPTABELL</div>
      {allTeams.slice(0, 8).map((t, i) => {
        const isYou = t.name === 'DITT LAG';
        return (
          <div key={t.name} className={`${styles.tippedRow} ${isYou ? styles.tippedYou : ''}`}>
            <span className={styles.tippedRank}>{i + 1}.</span>
            <span className={styles.tippedName}>{t.name}</span>

          </div>
        );
      })}

      <hr className={styles.separator} />

      {!simulated ? (
        <div className={styles.instruction} onClick={() => onNavigate(310)} style={{ cursor: 'pointer' }}>
          SASONGEN BÖRJAR: TRYCK 310 → SIMULERA
        </div>
      ) : (
        <div className={styles.instruction}>
          SÄSONGEN KLAR · {positionSuffix(odds.projectedPosition)} PROJEKTERAD
        </div>
      )}
    </div>
  );
}
