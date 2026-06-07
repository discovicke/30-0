import { useState, useEffect, useRef } from 'react';
import type { MatchResult, AITeam, PlayerCard, TeamXI } from '../../types';
import { formations, computeStandingsAfterMatch } from '../../engine/simulationEngine';
import PlayerSlot from '../PlayerSlot/PlayerSlot';
import FormationView from '../FormationView/FormationView';
import OverallStrip from '../OverallStrip/OverallStrip';
import TextTVPanel from '../TextTVPanel/TextTVPanel';
import StepIndicator from '../StepIndicator/StepIndicator';
import styles from './MatchReplay.module.scss';

interface Props {
  userMatches: MatchResult[];
  aiTeams: AITeam[];
  result: {
    userTeam: TeamXI;
  };
  slots: Record<string, PlayerCard>;
  formation: '4-3-3' | '4-4-2' | '3-5-2';
  onComplete: () => void;
}

const stepLabels = ['Start', 'Draft', 'Spela', 'Resultat'];

export default function MatchReplay({
  userMatches, aiTeams, result, slots, formation, onComplete,
}: Props) {
  const [played, setPlayed] = useState(0);
  const [table, setTable] = useState<AITeam[]>([]);
  const [done, setDone] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const total = userMatches.length;

  const advance = () => {
    const next = played + 1;
    const playedMatches = userMatches.slice(0, next);
    const standings = computeStandingsAfterMatch(aiTeams, playedMatches);
    setTable(standings);
    setPlayed(next);
    if (next >= total) {
      setDone(true);
    }
    // scroll to bottom
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    advance();
  }, []);

  useEffect(() => {
    if (!autoPlay || done || played >= total) return;
    timerRef.current = setTimeout(advance, 700);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [played, autoPlay, done]);

  const slotDefs = formations[formation];

  return (
    <div className={styles.container}>
      <StepIndicator current={2} total={4} labels={stepLabels} />

      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.slotList}>
            {slotDefs.map((slot) => (
              <PlayerSlot
                key={slot.label}
                positionLabel={slot.label}
                player={slots[slot.label] ?? null}
                muted
              />
            ))}
          </div>
          <FormationView formation={formation} slots={slots} compact />
          <OverallStrip
            overall={result.userTeam.overall}
            attack={result.userTeam.attack}
            midfield={result.userTeam.midfield}
            defence={result.userTeam.defence}
          />
        </div>

        <div className={styles.right}>
          <TextTVPanel
            title="SVT TEXT-TV  SID 378  ALLSVENSKAN"
            meta={`OMG ${Math.min(played, total)}/${total}`}
          >
            <table className={styles.ttvTable}>
              <thead>
                <tr>
                  <th style={{ width: 10 }}>#</th>
                  <th>Lag</th>
                  <th>S</th>
                  <th>V</th>
                  <th>O</th>
                  <th>F</th>
                  <th>+/-</th>
                  <th>P</th>
                </tr>
              </thead>
              <tbody>
                {table.slice(0, 16).map((t, i) => {
                  const gd = (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0);
                  const isUser = t.name === 'Your XI';
                  return (
                    <tr key={t.name} className={isUser ? styles.you : ''}>
                      <td className={styles.rank}>{i + 1}</td>
                      <td>{isUser ? 'DITT LAG' : t.name}</td>
                      <td>{t.wins ?? 0 + (t.draws ?? 0) + (t.losses ?? 0)}</td>
                      <td>{t.wins ?? 0}</td>
                      <td>{t.draws ?? 0}</td>
                      <td>{t.losses ?? 0}</td>
                      <td>{gd >= 0 ? `+${gd}` : `${gd}`}</td>
                      <td className={styles.bold}>{t.points ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TextTVPanel>

          <TextTVPanel
            title="DINA MATCHER"
            meta={`${played} SPELADE`}
            scrollable
            maxHeight="260px"
          >
            <div ref={listRef} className={styles.matchList}>
              {userMatches.slice(0, played).map((m, i) => {
                const isHome = m.isUserHome;
                const userScore = isHome ? m.homeGoals : m.awayGoals;
                const oppScore = isHome ? m.awayGoals : m.homeGoals;
                const oppName = isHome ? m.awayTeam : m.homeTeam;
                const resultClass = userScore > oppScore ? styles.win
                  : userScore === oppScore ? styles.draw : styles.loss;

                return (
                  <div key={i} className={styles.matchRow}>
                    <span className={styles.round}>{i + 1}</span>
                    <span className={isHome ? styles.youTeam : ''}>
                      {isHome ? 'Ditt lag' : oppName}
                    </span>
                    <span className={`${styles.score} ${resultClass}`}>
                      {userScore}-{oppScore}
                    </span>
                    <span className={!isHome ? styles.youTeam : ''}>
                      {!isHome ? 'Ditt lag' : oppName}
                    </span>
                  </div>
                );
              })}
            </div>
          </TextTVPanel>

          <div className={styles.controls}>
            {!done && (
              <button className={styles.nextBtn} onClick={advance}>
                Nasta match
              </button>
            )}
            <button className={styles.autoBtn} onClick={() => setAutoPlay(!autoPlay)}>
              {autoPlay ? 'Pausa' : 'Auto'}
            </button>
            {done && (
              <button className={styles.doneBtn} onClick={onComplete}>
                Visa resultat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
