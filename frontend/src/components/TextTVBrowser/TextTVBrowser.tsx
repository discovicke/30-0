import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TeamXI, FormationKey, SeasonResult, RatingMode } from '../../types';
import type { PreSeasonOdds } from '../../engine/draftEngine';
import { extractUserMatches } from '../../engine/simulationEngine';
import Page300 from './pages/Page300';
import Page301 from './pages/Page301';
import Page302 from './pages/Page302';
import Page310 from './pages/Page310';
import Page320 from './pages/Page320';
import Page321 from './pages/Page321';
import PageReferat from './pages/PageReferat';
import {ChevronLeft, ChevronRight, ChevronUp, ChevronDown} from 'lucide-react';
import styles from './TextTVBrowser.module.scss';

interface Props {
  xi: TeamXI;
  formation: FormationKey;
  odds: PreSeasonOdds;
  result: SeasonResult | null;
  onSimulate: () => void;
  onRestart: () => void;
  ratingMode?: RatingMode;
  matchByMatch?: boolean;
}

function buildPageOrder(matchByMatch: boolean, matchCount: number): number[] {
  if (!matchByMatch) return [300, 301, 302, 310, 320, 321];
  // 310 (results overview) sits AFTER all referats so arrow-nav spoils nothing
  const referatPages = Array.from({ length: matchCount }, (_, i) => 311 + i);
  return [300, 301, 302, ...referatPages, 310, 350, 351];
}

function getPageTitle(page: number, matchByMatch?: boolean): string {
  if (matchByMatch && page >= 311 && page <= 340) return `OMGÅNG ${page - 310}`;
  const titles: Record<number, string> = {
    300: 'ALLSVENSKT 30-0',
    301: 'DIN TRUPP',
    302: 'FÖRHANDSTIPS',
    310: 'RESULTAT',
    320: 'SLUTTABELL',
    321: 'SÄSONGSARTIKEL',
    350: 'SLUTTABELL',
    351: 'SÄSONGSARTIKEL',
  };
  return titles[page] ?? '';
}

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
  xi, formation, odds, result, onSimulate, onRestart, ratingMode, matchByMatch,
}: Props) {
  const userMatches = useMemo(
    () => result ? extractUserMatches(result.matches) : [],
    [result]
  );
  const PAGE_ORDER = useMemo(
    () => buildPageOrder(matchByMatch ?? false, userMatches.length || 30),
    [matchByMatch, userMatches.length]
  );
  const matchCount = userMatches.length || 30;

  // Highest referat round visited — gates access to result/table pages when matchByMatch
  const [maxReferatRead, setMaxReferatRead] = useState(0);
  // Rounds whose animation has completed — skip animation on revisit
  const [revealedRounds, setRevealedRounds] = useState<Set<number>>(new Set());

  const allRead = !matchByMatch || maxReferatRead >= matchCount;

  const VALID_PAGES = useMemo(() => {
    const pages = new Set(PAGE_ORDER);
    if (matchByMatch && !allRead) {
      [310, 350, 351].forEach(p => pages.delete(p));
    }
    return pages;
  }, [PAGE_ORDER, matchByMatch, allRead]);

  const [currentPage, setCurrentPage] = useState(() => {
    if (!result) return 300;
    return matchByMatch ? 311 : 310;
  });
  const [pageInput, setPageInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const simulated = result !== null;

  const dateStr = useMemo(() => formatDate(new Date()), []);

  const checkScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop < el.scrollHeight - el.clientHeight - 4);
  }, []);

  useEffect(() => {
    // Check after render
    requestAnimationFrame(checkScroll);
  }, [currentPage, checkScroll]);

  const scrollBy = useCallback((amount: number) => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollBy({ top: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 200);
  }, [checkScroll]);

  // Pages that can be shown before simulation — everything before the first result/referat page
  const simThreshold = matchByMatch ? 311 : 310;

  const navigateTo = useCallback((page: number) => {
    if (!VALID_PAGES.has(page)) return;
    if (page >= simThreshold && !simulated) {
      onSimulate();
      return;
    }
    if (matchByMatch && page >= 311 && page <= 340) {
      const round = page - 310;
      setMaxReferatRead(prev => Math.max(prev, round));
    }
    setCurrentPage(page);
    setPageInput('');
    requestAnimationFrame(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; });
  }, [VALID_PAGES, simulated, onSimulate, matchByMatch, simThreshold]);

  // Auto-advance to first result page when simulation completes
  const wasSimulated = useRef(simulated);
  useEffect(() => {
    if (!wasSimulated.current && simulated) {
      const firstPage = matchByMatch ? 311 : 310;
      setCurrentPage(firstPage);
      setPageInput('');
      requestAnimationFrame(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; });
    }
    wasSimulated.current = simulated;
  }, [simulated, matchByMatch]);

  const getPrev = useCallback(() => {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (!simulated) {
      const preSimPages = PAGE_ORDER.filter((p) => p < 310);
      const i = preSimPages.indexOf(currentPage);
      return preSimPages[(i - 1 + preSimPages.length) % preSimPages.length];
    }
    return PAGE_ORDER[(idx - 1 + PAGE_ORDER.length) % PAGE_ORDER.length];
  }, [currentPage, simulated, PAGE_ORDER, simThreshold]);

  const getNext = useCallback(() => {
    const idx = PAGE_ORDER.indexOf(currentPage);
    if (!simulated) {
      const preSimPages = PAGE_ORDER.filter((p) => p < 310);
      const i = preSimPages.indexOf(currentPage);
      if (i === preSimPages.length - 1) {
        return PAGE_ORDER.find(p => p >= simThreshold) ?? simThreshold;
      }
      return preSimPages[(i + 1) % preSimPages.length];
    }
    return PAGE_ORDER[(idx + 1) % PAGE_ORDER.length];
  }, [currentPage, simulated, PAGE_ORDER, simThreshold]);

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
    if (matchByMatch && currentPage >= 311 && currentPage <= 340) {
      const round = currentPage - 310;
      const match = userMatches[round - 1];
      if (!match) return null;
      return (
        <PageReferat
          match={match}
          round={round}
          xi={xi}
          ratingMode={ratingMode}
          roundTable={result?.roundTables?.[round - 1]}
          skipAnimation={revealedRounds.has(round)}
          onRevealed={() => setRevealedRounds(prev => new Set([...prev, round]))}
        />
      );
    }
    switch (currentPage) {
      case 300:
        return <Page300 xi={xi} formation={formation} simulated={simulated} allRead={allRead} onNavigate={navigateTo} matchByMatch={matchByMatch ?? false} />;
      case 301:
        return <Page301 xi={xi} formation={formation} />;
      case 302:
        return <Page302 xi={xi} odds={odds} ratingMode={ratingMode} />;
      case 310:
        return <Page310 result={result} />;
      case 320:
        return <Page320 result={result} />;
      case 321:
        return <Page321 result={result} xi={xi} odds={odds} onRestart={onRestart} />;
      case 350:
        return <Page320 result={result} />;
      case 351:
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
            <ChevronLeft size={14} /> {prevPage}
          </button>
          <div className={styles.inputArea}>
            <span className={styles.inputLabel}>SID</span>
            <span className={styles.inputDisplay}>
              {(pageInput || String(currentPage)).padEnd(3, '\u00A0')}
            </span>
          </div>
          <button className={styles.navBtn} onClick={() => navigateTo(nextPage)}>
            {nextPage} <ChevronRight size={14} />
          </button>
        </div>
        <span className={styles.date}>{dateStr}</span>
      </div>

      <div className={styles.body} ref={bodyRef} onScroll={checkScroll}>
        {renderPage()}
      </div>
      {canScrollUp && (
        <button className={styles.scrollArrowUp} onClick={() => scrollBy(-200)}>
          <ChevronUp size={16} />
        </button>
      )}
      {canScrollDown && (
        <button className={styles.scrollArrowDown} onClick={() => scrollBy(200)}>
          <ChevronDown size={16} />
        </button>
      )}

      <div className={styles.footer}>
        <span className={styles.pageTitle}>{getPageTitle(currentPage, matchByMatch)}</span>
      </div>
    </div>
  );
}
