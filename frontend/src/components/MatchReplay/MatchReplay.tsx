import { useState, useEffect, useRef } from 'react';
import type { SeasonResult, PlayerCard } from '../../types';
import { formations, extractUserMatches } from '../../engine/simulationEngine';
import PlayerSlot from '../PlayerSlot/PlayerSlot';
import FormationView from '../FormationView/FormationView';
import OverallStrip from '../OverallStrip/OverallStrip';
import TextTVPanel from '../TextTVPanel/TextTVPanel';
import StepIndicator from '../StepIndicator/StepIndicator';
import styles from './MatchReplay.module.scss';

interface Props {
  result: SeasonResult;
  slots: Record<string, PlayerCard>;
  formation: '4-3-3' | '4-4-2' | '3-5-2';
  onRestart: () => void;
}

const stepLabels = ['Start', 'Draft', 'Spela', 'Resultat'];

export default function MatchReplay({
  result, slots, formation, onRestart,
}: Props) {
  const [played, setPlayed] = useState(0);
  const [done, setDone] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showPlayers, setShowPlayers] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const userMatches = extractUserMatches(result.matches);
  const total = userMatches.length;

  const advance = () => {
    const next = played + 1;
    setPlayed(next);
    if (next >= total) {
      setDone(true);
    }
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
  const u = result.userTeam;
  const gd = u.goalsFor - u.goalsAgainst;

  return (
    <div className={styles.container}>
      <StepIndicator current={done ? 3 : 2} total={4} labels={stepLabels} />

      <div className={styles.main}>
        <div className={styles.left}>
          <OverallStrip
            overall={result.userTeam.overall}
            attack={result.userTeam.attack}
            midfield={result.userTeam.midfield}
            defence={result.userTeam.defence}
          />

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${!showPlayers ? styles.toggleActive : ''}`}
              onClick={() => setShowPlayers(false)}
            >
              UPPSTÄLLNING
            </button>
            <button
              className={`${styles.toggleBtn} ${showPlayers ? styles.toggleActive : ''}`}
              onClick={() => setShowPlayers(true)}
            >
              SPELARE
            </button>
          </div>

          <div className={styles.viewPanel}>
            {showPlayers ? (
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
            ) : (
              <FormationView formation={formation} slots={slots} tall />
            )}
          </div>
        </div>

        <div className={styles.right}>
          <TextTVPanel
            title="DINA MATCHER"
            meta={`${played} SPELADE`}
            scrollable
            maxHeight={done ? undefined : "340px"}
          >
            <div ref={listRef} className={styles.matchList}>
              {userMatches.slice(0, played).map((m, i) => {
                const isHome = m.isUserHome;
                const userScore = isHome ? m.homeGoals : m.awayGoals;
                const oppScore = isHome ? m.awayGoals : m.homeGoals;
                const oppName = isHome ? m.awayTeam : m.homeTeam;
                const resultClass = userScore > oppScore ? styles.win
                  : userScore === oppScore ? styles.draw : styles.loss;

                const goalText = m.goals
                  .sort((a, b) => a.minute - b.minute)
                  .map((g) => `${g.scorer} ${g.minute}'`)
                  .join(', ');

                return (
                  <div key={i} className={styles.matchRow}>
                    <span className={styles.matchInfo}>
                      <span className={styles.round}>{i + 1}</span>
                      <span className={`${styles.teamName} ${isHome ? styles.youTeam : ''}`}>
                        {isHome ? 'Ditt lag' : oppName}
                      </span>
                      <span className={`${styles.score} ${resultClass}`}>
                        {userScore}-{oppScore}
                      </span>
                      <span className={`${styles.teamName} ${!isHome ? styles.youTeam : ''}`}>
                        {!isHome ? 'Ditt lag' : oppName}
                      </span>
                    </span>
                    <span className={styles.goalScorers}>{goalText}</span>
                  </div>
                );
              })}
            </div>

            {done && (
              <>
                <div className={styles.finalSection}>
                  <div className={styles.sectionLabel}>SLUTTABELL</div>
                  <div className={styles.finalHeader}>
                    <div className={styles.bigRecord}>
                      {u.wins}W - {u.draws}D - {u.losses}L
                    </div>
                    <div className={styles.ptsLine}>
                      {u.points} POÄNG  GD {gd >= 0 ? `+${gd}` : gd}
                    </div>
                    <div className={styles.posLine}>
                      PLATS {result.finalPosition}/{result.finalTable.length}
                    </div>
                    {u.losses === 0 && (
                      <div className={styles.undefeated}>
                        30-0  OBESEGRADE!
                      </div>
                    )}
                  </div>

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
                      {result.finalTable.map((t, i) => {
                        const tGd = (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0);
                        const isUser = t.name === 'Your XI';
                        const totalM = (t.wins ?? 0) + (t.draws ?? 0) + (t.losses ?? 0);
                        return (
                          <tr key={t.name} className={isUser ? styles.you : ''}>
                            <td className={styles.rank}>{i + 1}</td>
                            <td>{isUser ? 'DITT LAG' : t.name}</td>
                            <td>{totalM}</td>
                            <td>{t.wins ?? 0}</td>
                            <td>{t.draws ?? 0}</td>
                            <td>{t.losses ?? 0}</td>
                            <td>{tGd >= 0 ? `+${tGd}` : `${tGd}`}</td>
                            <td className={styles.bold}>{t.points ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.awardsSection}>
                  <div className={styles.sectionLabel}>UTMARKELSER</div>
                  <div className={styles.awards}>
                    {result.goldenBoot && (
                      <div className={styles.award}>
                        <span className={styles.awardIcon}>G</span>
                        <span>{result.goldenBoot.playerName}  {result.goldenBoot.goals} mål</span>
                      </div>
                    )}
                    {result.playmaker && (
                      <div className={styles.award}>
                        <span className={styles.awardIcon}>A</span>
                        <span>{result.playmaker.playerName}  {result.playmaker.assists} assists</span>
                      </div>
                    )}
                    {result.goldenGlove && (
                      <div className={styles.award}>
                        <span className={styles.awardIcon}>C</span>
                        <span>{result.goldenGlove.playerName}  {result.goldenGlove.cleanSheets} hållna nollor</span>
                      </div>
                    )}
                    {result.playerOfSeason && (
                      <div className={styles.award}>
                        <span className={styles.awardIcon}>P</span>
                        <span>{result.playerOfSeason.playerName}  {result.playerOfSeason.goals}G {result.playerOfSeason.assists}A</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TextTVPanel>

          <div className={styles.controls}>
            {!done && (
              <button className={styles.nextBtn} onClick={advance}>
                Nästa match
              </button>
            )}
            <button className={styles.autoBtn} onClick={() => setAutoPlay(!autoPlay)}>
              {autoPlay ? 'Pausa' : 'Auto'}
            </button>
            {done && (
              <button className={styles.restartBtn} onClick={onRestart}>
                Spela igen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
