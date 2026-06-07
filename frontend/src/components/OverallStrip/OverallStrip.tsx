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
      <div className={`${styles.cell} ${styles.main}`}>
        <span className={styles.label}>Overall</span>
        <span className={styles.value}>{Math.round(overall)}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.label}>Attack</span>
        <span className={styles.value}>{Math.round(attack)}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.label}>Mitt</span>
        <span className={styles.value}>{Math.round(midfield)}</span>
      </div>
      <div className={styles.cell}>
        <span className={styles.label}>Forsvar</span>
        <span className={styles.value}>{Math.round(defence)}</span>
      </div>
    </div>
  );
}
