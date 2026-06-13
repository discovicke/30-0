import styles from './StepIndicator.module.scss';

interface Props {
  current: number;
  total: number;
  labels: string[];
}

export default function StepIndicator({ current, total, labels }: Props) {
  return (
    <div className={styles.steps}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`${styles.step} ${i <= current ? styles.active : ''}`}>
          <div className={styles.dot} />
          <span className={styles.label}>{labels[i] ?? ''}</span>
        </div>
      ))}
    </div>
  );
}
