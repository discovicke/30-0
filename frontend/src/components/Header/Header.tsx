import styles from './Header.module.scss';

interface Props {
  onHome: () => void;
}

type GameMode = 'allsvenskan' | 'club-dream' | 'vm2026';

const modes: { key: GameMode; label: string; disabled: boolean }[] = [
  { key: 'allsvenskan', label: 'Allsvenskan 30-0', disabled: false },
  { key: 'club-dream', label: 'Club Dream Team', disabled: true },
  { key: 'vm2026', label: 'VM2026', disabled: true },
];

export default function Header({ onHome }: Props) {
  return (
    <header className={styles.header}>
      <button className={styles.logo} onClick={onHome}>
        30-0
      </button>
      <nav className={styles.modes}>
        {modes.map((m) => (
          <span
            key={m.key}
            className={`${styles.mode} ${m.disabled ? styles.disabled : styles.active}`}
          >
            {m.label}
          </span>
        ))}
      </nav>
    </header>
  );
}
