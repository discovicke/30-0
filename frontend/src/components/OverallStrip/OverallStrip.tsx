import styles from './OverallStrip.module.scss';

interface Props {
  overall: number;
  attack: number;
  midfield: number;
  defence: number;
}

export default function OverallStrip({ overall, attack, midfield, defence }: Props) {
  return (
    <div className={styles.strip}>
      <div className={styles.mainRow}>
        <span className={styles.mainLabel}>Overall</span>
        <span className={styles.mainValue}>{Math.round(overall)}</span>
      </div>
      <div className={styles.subRow}>
        <span className={styles.subLabel}>Attack</span>
        <span className={styles.subValue}>{Math.round(attack)}</span>
      </div>
      <div className={styles.subRow}>
        <span className={styles.subLabel}>Mitt</span>
        <span className={styles.subValue}>{Math.round(midfield)}</span>
      </div>
      <div className={styles.subRow}>
        <span className={styles.subLabel}>Forsvar</span>
        <span className={styles.subValue}>{Math.round(defence)}</span>
      </div>
    </div>
  );
}
