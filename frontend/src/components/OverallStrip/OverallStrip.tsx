import styles from './OverallStrip.module.scss';

interface Props {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
  emptyAttack?: boolean;
  emptyMidfield?: boolean;
  emptyDefence?: boolean;
}

export default function OverallStrip({
  overall, attack, midfield, defence,
  emptyAttack, emptyMidfield, emptyDefence,
}: Props) {
  const emptyOverall = emptyAttack && emptyMidfield && emptyDefence;
  return (
    <div className={styles.strip}>
      <div className={styles.mainRow}>
        <span className={styles.mainLabel}>Overall</span>
        <span className={styles.mainValue}>{emptyOverall ? '–' : Math.round(overall)}</span>
      </div>
      <div className={styles.subGroup}>
        <div className={styles.subRow}>
          <span className={styles.subLabel}>Anfall</span>
          <span className={styles.subValue}>{emptyAttack ? '–' : Math.round(attack)}</span>
        </div>
        <div className={styles.subRow}>
          <span className={styles.subLabel}>Mittfält</span>
          <span className={styles.subValue}>{emptyMidfield ? '–' : Math.round(midfield)}</span>
        </div>
        <div className={styles.subRow}>
          <span className={styles.subLabel}>Försvar</span>
          <span className={styles.subValue}>{emptyDefence ? '–' : Math.round(defence)}</span>
        </div>
      </div>
    </div>
  );
}
