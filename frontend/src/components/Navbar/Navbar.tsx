import type { GamePhase } from '../../types';
import styles from './Navbar.module.scss';

interface Props {
  phase: GamePhase;
  modeLabel: string;
}

const navSteps: { key: string; label: string; phases: GamePhase[] }[] = [
  { key: 'setup', label: 'Start', phases: ['setup'] },
  { key: 'draft', label: 'Draft', phases: ['draft'] },
  { key: 'simulate', label: 'Spela', phases: ['simulating', 'match-replay'] },
  { key: 'result', label: 'Resultat', phases: ['results'] },
];

export default function Navbar({ phase, modeLabel }: Props) {
  const activeStep = navSteps.findIndex((s) => s.phases.includes(phase));

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <span className={styles.logo}>30-0</span>
        <span className={styles.badge}>{modeLabel}</span>
      </div>
      <div className={styles.steps}>
        {navSteps.map((s, i) => (
          <span
            key={s.key}
            className={`${styles.step} ${i === activeStep ? styles.active : ''} ${i < activeStep ? styles.done : ''}`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </nav>
  );
}
