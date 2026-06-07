import type { SeasonResult } from '../../../types';
import styles from './pages.module.scss';

interface Props {
  result: SeasonResult | null;
}

export default function Page320({ result }: Props) {
  if (!result) {
    return (
      <div className={styles.lockedMessage}>
        SASONGEN HAR INTE SPELATS ANNU<br />
        NAVIGERA TILL 310 FOR ATT SIMULERA
      </div>
    );
  }

  const table = result.finalTable;

  return (
    <div>
      <div className={styles.pageTitle}>ALLSVENSKAN SLUTTABELL</div>
      <div className={styles.pageSubtitle}>SASONG 2025</div>

      <table className={styles.ttvTable}>
        <thead>
          <tr>
            <th style={{ width: 20 }}>#</th>
            <th>LAG</th>
            <th>S</th>
            <th>V</th>
            <th>O</th>
            <th>F</th>
            <th>GM</th>
            <th>IM</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => {
            const isUser = t.name === 'Your XI';
            const pos = i + 1;
            const isEurope = pos <= 2;
            const isRelegation = pos >= table.length - 1;
            const totalMatches = (t.wins ?? 0) + (t.draws ?? 0) + (t.losses ?? 0);

            let rowClass = '';
            if (isUser) rowClass = styles.rowYou;
            else if (isEurope) rowClass = styles.rowEurope;
            else if (isRelegation) rowClass = styles.rowRelegation;

            return (
              <tr key={t.name} className={rowClass}>
                <td className={styles.rankCol}>{pos}</td>
                <td>{isUser ? 'DITT LAG' : t.name.toUpperCase()}</td>
                <td>{totalMatches}</td>
                <td>{t.wins ?? 0}</td>
                <td>{t.draws ?? 0}</td>
                <td>{t.losses ?? 0}</td>
                <td>{t.goalsFor ?? 0}</td>
                <td>{t.goalsAgainst ?? 0}</td>
                <td className={styles.boldCol}>{t.points ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
