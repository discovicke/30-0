import styles from './Navigation.module.scss';

interface NavItem {
  id: string;
  label: string;
}

const tabs: NavItem[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'batch', label: 'Batch' },
  { id: 'simulate', label: 'Dream Team' },
];

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export default function Navigation({ active, onChange }: Props) {
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>30-0</span>
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${active === t.id ? styles.active : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
