import type { TeamXI, FormationKey } from '../../../types';
import styles from './pages.module.scss';

interface Props {
  xi: TeamXI;
  formation: FormationKey;
  simulated: boolean;
  allRead: boolean;
  onNavigate: (page: number) => void;
  matchByMatch?: boolean;
}

export default function Page300({ xi, formation, simulated, allRead, onNavigate, matchByMatch }: Props) {
  const tablePageNum = matchByMatch ? 350 : 320;
  const articlePageNum = matchByMatch ? 351 : 321;

  const pages = [
    { num: 301, label: 'DIN TRUPP', locked: false },
    { num: 302, label: 'FÖRHANDSTIPS', locked: false },
    ...(matchByMatch
      ? [
          { num: 311, label: 'MATCHREFERAT – OMGÅNG 1', locked: !simulated },
          ...(allRead
            ? [
                { num: 310, label: 'RESULTAT', locked: false },
                { num: tablePageNum, label: 'SLUTTABELL', locked: false },
                { num: articlePageNum, label: 'SÄSONGSARTIKEL', locked: false },
              ]
            : []),
        ]
      : [
          { num: 310, label: 'RESULTAT', locked: !simulated },
          { num: tablePageNum, label: 'SLUTTABELL', locked: !simulated },
          { num: articlePageNum, label: 'SÄSONGSARTIKEL', locked: !simulated },
        ]),
  ];

  let instruction: string;
  if (!simulated) {
    instruction = matchByMatch
      ? 'NAVIGERA TILL OMGÅNG 1 [ 311 ] FÖR ATT SPELA SÄSONGEN'
      : 'NAVIGERA TILL RESULTATSIDAN [ 310 ] FÖR ATT SIMULERA SÄSONGEN';
  } else if (matchByMatch && !allRead) {
    instruction = 'BLÄDDRA OMGÅNG FÖR OMGÅNG – BÖRJA PÅ SIDA 311';
  } else {
    instruction = 'SÄSONGEN FÄRDIGSPELAD – BLÄDDRA FRITT';
  }

  return (
    <div>
      <div className={styles.pageTitle}>DAGS FÖR DITT LAG ATT TA ÖVER ALLSVENSKAN</div>
      <div className={styles.pageSubtitle}>
        {formation.toUpperCase()} - OVR {Math.round(xi.overall)}
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

      <div className={styles.instruction}>{instruction}</div>
    </div>
  );
}
