import { useState, useEffect, useRef } from 'react';
import type { MatchResult, TeamXI, RatingMode, AITeam } from '../../../types';
import { getAllAITeams } from '../../../engine/simulationEngine';
import { generateReferat } from '../../../engine/matchReferat';
import type { ReferatContext } from '../../../engine/matchReferat';
import styles from './pages.module.scss';

const CHAR_DELAY_MS = 42;

interface Props {
  match: MatchResult;
  round: number;
  xi: TeamXI;
  ratingMode?: RatingMode;
  roundTable?: AITeam[];
  skipAnimation?: boolean;
  onRevealed?: () => void;
}

function CompactTable({ table, round }: { table: AITeam[]; round: number }) {
  const userIdx = table.findIndex(t => t.name === 'Your XI');
  return (
    <div style={{ marginTop: '14px' }}>
      <div className={styles.section} style={{ marginTop: 0 }}>TABELLEN – OMGÅNG {round}</div>
      <table className={styles.ttvTable} style={{ fontSize: '11px' }}>
        <thead>
          <tr>
            <th style={{ width: '20px' }}>#</th>
            <th>LAG</th>
            <th style={{ textAlign: 'right', width: '32px' }}>GS</th>
            <th style={{ textAlign: 'right', width: '28px' }}>P</th>
          </tr>
        </thead>
        <tbody>
          {table.map((team, i) => {
            const isUser = team.name === 'Your XI';
            const gd = (team.goalsFor ?? 0) - (team.goalsAgainst ?? 0);
            const gdStr = gd > 0 ? `+${gd}` : String(gd);
            return (
              <tr key={team.name}>
                <td style={{ color: isUser ? 'var(--ttv-title, #f5c518)' : undefined }}>{i + 1}</td>
                <td style={{ color: isUser ? 'var(--ttv-title, #f5c518)' : undefined, fontWeight: isUser ? 700 : undefined }}>
                  {isUser ? 'DITT LAG' : team.name}
                </td>
                <td style={{ textAlign: 'right', color: isUser ? 'var(--ttv-title, #f5c518)' : undefined }}>{gdStr}</td>
                <td style={{ textAlign: 'right', color: isUser ? 'var(--ttv-title, #f5c518)' : undefined, fontWeight: isUser ? 700 : undefined }}>
                  {team.points ?? 0}
                </td>
              </tr>
            );
          })}
          {userIdx < 0 && null /* user not in table — shouldn't happen */}
        </tbody>
      </table>
    </div>
  );
}

export default function PageReferat({ match, round, xi, ratingMode, roundTable, skipAnimation, onRevealed }: Props) {
  const oppName = match.isUserHome ? match.awayTeam : match.homeTeam;
  const aiTeams = getAllAITeams(ratingMode ?? 'season');
  const aiTeam = aiTeams.find((t) => t.name === oppName);
  const userPlayerNames = Object.values(xi.slots).map(p => p.name);

  const ctx: ReferatContext = {
    round,
    oppName,
    oppStrength: aiTeam?.strength ?? 75,
    oppTier: aiTeam?.tier ?? 'Mellan',
    userOverall: xi.overall,
    isUserHome: match.isUserHome,
    userPlayerNames,
  };

  const prose = generateReferat(match, ctx);
  const initialLength = skipAnimation ? prose.length : 0;

  const [displayedLength, setDisplayedLength] = useState(initialLength);
  const onRevealedRef = useRef(onRevealed);
  useEffect(() => { onRevealedRef.current = onRevealed; });

  useEffect(() => {
    setDisplayedLength(skipAnimation ? prose.length : 0);
  }, [prose, skipAnimation]);

  const done = displayedLength >= prose.length;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setDisplayedLength(prev => {
        const next = prev + 1;
        if (next >= prose.length) clearInterval(id);
        return next;
      });
    }, CHAR_DELAY_MS);
    return () => clearInterval(id);
  }, [done, prose]);

  useEffect(() => {
    if (done) onRevealedRef.current?.();
  }, [done]);

  const userGoals = match.isUserHome ? match.homeGoals : match.awayGoals;
  const oppGoals = match.isUserHome ? match.awayGoals : match.homeGoals;
  const scoreClass = userGoals > oppGoals ? styles.matchWin
    : userGoals < oppGoals ? styles.matchLoss
    : styles.matchDraw;

  const homeLabel = match.isUserHome ? 'DITT LAG' : oppName.toUpperCase();
  const awayLabel = match.isUserHome ? oppName.toUpperCase() : 'DITT LAG';
  const homeClass = match.isUserHome ? styles.matchTeamYou : styles.matchTeam;
  const awayClass = !match.isUserHome ? styles.matchTeamYou : styles.matchTeam;

  return (
    <div>
      <div className={styles.pageTitle}>OMGÅNG {round}</div>
      <div className={styles.pageSubtitle}>ALLSVENSKT 30-0 · MATCHREFERAT</div>

      <div className={styles.matchResultGrid} style={{ marginBottom: '10px' }}>
        <div className={`${styles.matchHomeCol} ${homeClass}`}>{homeLabel}</div>
        <div className={styles.matchScore} style={{ color: 'var(--ttv-meta)' }}>–</div>
        <div className={`${styles.matchAwayCol} ${awayClass}`}>{awayLabel}</div>
      </div>

      <p className={styles.referat}>
        {prose.slice(0, displayedLength)}
        {!done && <span className={styles.cursor}>█</span>}
      </p>

      {!done && (
        <button
          className={styles.skipBtn}
          onClick={() => setDisplayedLength(prose.length)}
        >
          VISA ALLT
        </button>
      )}

      {done && (
        <>
          <div className={styles.matchResultGrid} style={{ marginTop: '16px' }}>
            <div className={`${styles.matchHomeCol} ${homeClass}`}>{homeLabel}</div>
            <div className={`${styles.matchScore} ${scoreClass}`}>
              {match.homeGoals}–{match.awayGoals}
            </div>
            <div className={`${styles.matchAwayCol} ${awayClass}`}>{awayLabel}</div>
          </div>
          {roundTable && <CompactTable table={roundTable} round={round} />}
        </>
      )}
    </div>
  );
}
