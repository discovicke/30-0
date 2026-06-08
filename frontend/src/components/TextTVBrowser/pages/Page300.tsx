import type { TeamXI, FormationKey } from '../../../types';
import styles from './pages.module.scss';

interface Props {
  xi: TeamXI;
  formation: FormationKey;
  simulated: boolean;
  onNavigate: (page: number) => void;
}

export default function Page300({ xi, formation, simulated, onNavigate }: Props) {
  const pages = [
    { num: 301, label: 'DIN TRUPP', locked: false },
    { num: 302, label: 'FÖRHANDSTIPS', locked: false },
    { num: 310, label: 'RESULTAT OMG 1-10', locked: !simulated },
    { num: 311, label: 'RESULTAT OMG 11-20', locked: !simulated },
    { num: 312, label: 'RESULTAT OMG 21-30', locked: !simulated },
    { num: 320, label: 'SLUTTABELL', locked: !simulated },
    { num: 321, label: 'SÄSONGSARTIKEL', locked: !simulated },
  ];

  return (
    <div>
      <div className={styles.pageTitle}>ALLSVENSKT 30-0 · SÄSONG 2025</div>
      <div className={styles.pageSubtitle}>
        {formation.toUpperCase()} · OVR {Math.round(xi.overall)}
      </div>

      <div className={styles.section}>INNEHÅLL</div>

      {pages.map((p) => (
        <div
          key={p.num}
          className={`${styles.indexRow} ${p.locked ? styles.indexLocked : ''}`}
          onClick={p.locked ? undefined : () => onNavigate(p.num)}
        >
          <span className={styles.indexNum}>{p.num}</span>
          <span className={styles.indexLabel}>{p.label}</span>
        </div>
      ))}

      <hr className={styles.separator} />

      {!simulated ? (
        <div className={styles.instruction}>
          TRYCK 310 FÖR ATT STARTA SÄSONGEN
        </div>
      ) : (
        <div className={styles.instruction}>
          SÄSONGEN KLAR · BLÄDDRA FRITT
        </div>
      )}
    </div>
  );
}
