import styles from './OverallStrip.module.scss';

interface Props {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  emptyAttack?: boolean;
  emptyMidfield?: boolean;
  emptyDefence?: boolean;
  showRatings?: boolean;
}

export default function OverallStrip({
  overall, attack, midfield, defence,
  emptyAttack, emptyMidfield, emptyDefence,
  showRatings = true,
}: Props) {
  const emptyOverall = emptyAttack && emptyMidfield && emptyDefence;
  return (
    <div className={styles.strip}>
      <div className={styles.mainRow}>
        <span className={styles.mainLabel}>Overall</span>
        <span className={styles.mainValue}>{emptyOverall ? '–' : (showRatings ? Math.round(overall) : '??')}</span>
      </div>
      <div className={styles.subGroup}>
        <div className={styles.subRow}>
          <span className={styles.subLabel}>Anfall</span>
          <span className={styles.subValue}>{emptyAttack ? '–' : (showRatings ? Math.round(attack) : '??')}</span>
        </div>
        <div className={styles.subRow}>
          <span className={styles.subLabel}>Mittfält</span>
          <span className={styles.subValue}>{emptyMidfield ? '–' : (showRatings ? Math.round(midfield) : '??')}</span>
        </div>
        <div className={styles.subRow}>
          <span className={styles.subLabel}>Försvar</span>
          <span className={styles.subValue}>{emptyDefence ? '–' : (showRatings ? Math.round(defence) : '??')}</span>
        </div>
      </div>
    </div>
  );
}
