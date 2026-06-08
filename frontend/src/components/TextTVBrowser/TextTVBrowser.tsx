import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TeamXI, FormationKey, GameConfig, SeasonResult } from '../../types';
import type { PreSeasonOdds } from '../../engine/draftEngine';
import Page300 from './pages/Page300';
import Page301 from './pages/Page301';
import Page302 from './pages/Page302';
import Page310 from './pages/Page310';
import Page320 from './pages/Page320';
import Page321 from './pages/Page321';
import styles from './TextTVBrowser.module.scss';

interface Props {
  xi: TeamXI;
  formation: FormationKey;
  config: GameConfig;
  odds: PreSeasonOdds;
  result: SeasonResult | null;
  onSimulate: () => void;
  onRestart: () => void;
}

const PAGE_ORDER = [300, 301, 302, 310, 311, 312, 320, 321];
const VALID_PAGES = new Set(PAGE_ORDER);

const PAGE_TITLES: Record<number, string> = {
  300: 'ALLSVENSKT 30-0',
  301: 'DIN TRUPP',
  302: 'FÖRHANDSTIPS',
  310: 'RESULTAT OMG 1-10',
  311: 'RESULTAT OMG 11-20',
  312: 'RESULTAT OMG 21-30',
  320: 'SLUTTABELL',
  321: 'SÄSONGSARTIKEL',
};

const DAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function formatDate(date: Date) {
  const day = DAYS[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mon = MONTHS[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${day} ${dd} ${mon} ${yyyy}`;
}

export default function TextTVBrowser({
  xi, formation, odds, result, onSimulate, onRestart,
}: Props) {
  const [currentPage, setCurrentPage] = useState(() => result ? 310 : 300);
  const [pageInput, setPageInput] = useState('');

  const simulated = result !== null;

  const dateStr = useMemo(() => formatDate(new Date()), []);

  const navigateTo = useCallback((page: number) => {
    if (!VALID_PAGES.has(page)) return;
    if (page >= 310 && !simulated) {
      onSimulate();
      return;
    }
    setCurrentPage(page);
    setPageInput('');
  }, [simulated, onSimulate]);

  const getPrev = useCallback(() => {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (!simulated) {
      const preSimPages = PAGE_ORDER.filter((p) => p < 310);
      const i = preSimPages.indexOf(currentPage);
      return preSimPages[(i - 1 + preSimPages.length) % preSimPages.length];
    }
    return PAGE_ORDER[(idx - 1 + PAGE_ORDER.length) % PAGE_ORDER.length];
  }, [currentPage, simulated]);

  const getNext = useCallback(() => {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (!simulated) {
      const preSimPages = PAGE_ORDER.filter((p) => p < 310);
      const i = preSimPages.indexOf(currentPage);
      if (i === preSimPages.length - 1) return 310;
      return preSimPages[(i + 1) % preSimPages.length];
    }
    return PAGE_ORDER[(idx + 1) % PAGE_ORDER.length];
  }, [currentPage, simulated]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateTo(getPrev());
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateTo(getNext());
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const next = (pageInput + e.key).slice(-3);
        setPageInput(next);
        if (next.length === 3) {
          const num = parseInt(next, 10);
          if (VALID_PAGES.has(num)) navigateTo(num);
          else setPageInput('');
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPageInput((p) => p.slice(0, -1));
      } else if (e.key === 'Enter' && pageInput.length === 3) {
        e.preventDefault();
        const num = parseInt(pageInput, 10);
        if (VALID_PAGES.has(num)) navigateTo(num);
        setPageInput('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageInput, navigateTo, getPrev, getNext]);

  const prevPage = getPrev();
  const nextPage = getNext();

  function renderPage() {
    switch (currentPage) {
      case 300:
        return <Page300 xi={xi} formation={formation} simulated={simulated} onNavigate={navigateTo} />;
      case 301:
        return <Page301 xi={xi} formation={formation} />;
      case 302:
        return <Page302 xi={xi} odds={odds} />;
      case 310:
        return <Page310 result={result} roundOffset={0} />;
      case 311:
        return <Page310 result={result} roundOffset={10} />;
      case 312:
        return <Page310 result={result} roundOffset={20} />;
      case 320:
        return <Page320 result={result} />;
      case 321:
        return <Page321 result={result} xi={xi} odds={odds} onRestart={onRestart} />;
      default:
        return null;
    }
  }

  return (
    <div className={styles.browser}>
      <div className={styles.header}>
        <span className={styles.brand}>SVT TEXT-TV</span>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => navigateTo(prevPage)}>
            ◄ {prevPage}
          </button>
          <div className={styles.inputArea}>
            <span className={styles.inputLabel}>SID</span>
            <span className={styles.inputDisplay}>
              {pageInput.padEnd(3, '_')}
            </span>
          </div>
          <button className={styles.navBtn} onClick={() => navigateTo(nextPage)}>
            {nextPage} ►
          </button>
        </div>
        <span className={styles.date}>{dateStr}</span>
      </div>

      <div className={styles.body}>
        {renderPage()}
      </div>

      <div className={styles.footer}>
        <span className={styles.pageTitle}>{PAGE_TITLES[currentPage] ?? ''}</span>
      </div>
    </div>
  );
}
