import { useState, useEffect, useRef, useCallback } from 'react';
import type { Squad, SquadPlayer, GameConfig, PlayerCard, SeasonResult } from '../../types';
import { formations, simulateSeason, computeTeamRatings, extractUserMatches } from '../../engine/simulationEngine';
import {
  pickRandomSquad, getEligiblePlayers, getPlayerPosGroups,
  getPositionLabel, autoAssignSlot, getRerollCount,
  getSwedishLabel, sortSlotsRightToLeft,
} from '../../engine/draftEngine';

const seasons = [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
import FormationView from '../FormationView/FormationView';
import PlayerSlot from '../PlayerSlot/PlayerSlot';
import OverallStrip from '../OverallStrip/OverallStrip';
import TextTVPanel from '../TextTVPanel/TextTVPanel';
import StepIndicator from '../StepIndicator/StepIndicator';
import styles from './DraftPhase.module.scss';

interface Props {
  config: GameConfig;
  squads: Squad[];
  onRestart: () => void;
}

const stepLabels = ['Start', 'Draft', 'Spela', 'Resultat'];

type DraftState = 'drafting' | 'ready' | 'simulating' | 'playing' | 'done';

export default function DraftPhase({ config, squads, onRestart }: Props) {
  const [filledSlots, setFilledSlots] = useState<Record<string, PlayerCard>>({});
  const [filledIds, setFilledIds] = useState<Set<string>>(new Set());
  const [usedSquadKeys, setUsedSquadKeys] = useState<Set<string>>(new Set());
  const [rerollsLeft, setRerollsLeft] = useState(getRerollCount(config.difficulty));
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rollTeam, setRollTeam] = useState('');
  const [rollSeason, setRollSeason] = useState('');
  const [rollTick, setRollTick] = useState(0);
  const [teamLocked, setTeamLocked] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<SquadPlayer | null>(null);
  const [pendingGroups, setPendingGroups] = useState<string[]>([]);
  const [draftState, setDraftState] = useState<DraftState>('drafting');
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [played, setPlayed] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const totalSlots = formations[config.formation].length;
  const filledCount = Object.keys(filledSlots).length;
  const filledLabels = Object.keys(filledSlots);
  const allFilled = filledCount >= totalSlots;

  const xi = {
    name: 'Your XI',
    slots: filledSlots,
    formation: config.formation,
    attack: 0, midfield: 0, defence: 0, gkRating: 0, overall: 0,
    goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0, points: 0,
  };
  if (filledCount > 0) computeTeamRatings(xi);

  const slotDefs = formations[config.formation];

  // --- Draft logic ---

  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setRolling(true);
    setTeamLocked(false);
    setCurrentSquad(null);
    setPendingPlayer(null);
    setPendingGroups([]);

    const squad = pickRandomSquad(squads, usedSquadKeys);
    const teamSteps = 14;
    const seasonSteps = 22;

    function rollTeam(step: number) {
      if (!squad || step >= teamSteps) {
        if (squad) {
          setRollTeam(squad.team);
          setTeamLocked(true);
        }
        return;
      }
      const rs = squads[Math.floor(Math.random() * squads.length)];
      setRollTeam(rs?.team ?? '');
      setRollTick((t) => t + 1);
      const p = step / teamSteps;
      rollTimerRef.current = setTimeout(() => rollTeam(step + 1), 60 + p * p * 200);
    }

    function rollSeason(step: number) {
      if (!squad || step >= seasonSteps) {
        if (squad) {
          setRollSeason(String(squad.season));
          setRollTick((t) => t + 1);
          setRolling(false);
          setCurrentSquad(squad);
          setUsedSquadKeys(new Set([...usedSquadKeys, `${squad.team}|${squad.season}`]));
        }
        setSpinning(false);
        return;
      }
      setRollSeason(String(seasons[Math.floor(Math.random() * seasons.length)]));
      setRollTick((t) => t + 1);
      const p = step / seasonSteps;
      rollTimerRef.current = setTimeout(() => rollSeason(step + 1), 60 + p * p * 260);
    }

    // Start both out of sync (season starts 90ms late so they stay offset)
    rollTeam(0);
    setTimeout(() => rollSeason(0), 90);
  }, [spinning, squads, usedSquadKeys]);

  const handleReroll = useCallback(() => {
    if (rerollsLeft <= 0 || spinning) return;
    setRerollsLeft(rerollsLeft - 1);
    handleSpin();
  }, [rerollsLeft, spinning, handleSpin]);

  function handleSlotClick(slotLabel: string) {
    if (config.draftMode !== 'position-first') return;
    if (filledSlots[slotLabel]) return;
    setSelectedSlot(slotLabel);
    setCurrentSquad(null);
    setPendingPlayer(null);
  }

  function handlePickPlayer(player: SquadPlayer) {
    if (!currentSquad) return;

    if (config.draftMode === 'position-first') {
      if (!selectedSlot) return;
      const slot = slotDefs.find((s) => s.label === selectedSlot);
      if (!slot) return;
      addPlayer(player, slot.position);
      return;
    }

    const groups = getPlayerPosGroups(player);
    const openGroups = groups.filter((g) => {
      const total = slotDefs.filter((s) => s.position === g).length;
      const filled = filledLabels.filter((l) => slotDefs.find((s) => s.label === l)?.position === g).length;
      return filled < total;
    });

    if (openGroups.length === 0) return;

    if (openGroups.length === 1) {
      addPlayer(player, openGroups[0]);
      return;
    }

    setPendingPlayer(player);
    setPendingGroups(openGroups);
  }

  function addPlayer(player: SquadPlayer, targetGroup: string) {
    const targetSlot = autoAssignSlot(player, config.formation, filledLabels, targetGroup);
    if (!targetSlot || filledSlots[targetSlot]) return;

    const card: PlayerCard = {
      name: player.name,
      season: player.season,
      team: player.team,
      ovr: player.ovr,
      positions: [...player.positions],
      id: player.id,
    };

    const newFilled = { ...filledSlots, [targetSlot]: card };
    setFilledSlots(newFilled);
    setFilledIds(new Set([...filledIds, player.id]));
    setCurrentSquad(null);
    setSelectedSlot(null);
    setPendingPlayer(null);
    setPendingGroups([]);
  }

  // When all slots filled → transition to ready
  useEffect(() => {
    if (allFilled && draftState === 'drafting') {
      setDraftState('ready');
    }
  }, [allFilled, draftState]);

  // --- Simulate ---

  function handleSimulate() {
    const teamXI = { ...xi, slots: { ...filledSlots } };
    const simResult = simulateSeason(teamXI, config.formation);
    setResult(simResult);
    setDraftState('simulating');
    setTimeout(() => setDraftState('playing'), 600);
  }

  // --- Results playback ---

  const userMatches = result ? extractUserMatches(result.matches) : [];
  const totalMatches = userMatches.length;
  const u = result?.userTeam;
  const gd = u ? u.goalsFor - u.goalsAgainst : 0;

  const advance = useCallback(() => {
    const next = played + 1;
    setPlayed(next);
    if (next >= totalMatches) {
      setDraftState('done');
    }
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 50);
  }, [played, totalMatches]);

  useEffect(() => {
    if (draftState !== 'playing') return;
    advance();
  }, []);

  useEffect(() => {
    if (draftState !== 'playing') return;
    if (!autoPlay || played >= totalMatches) return;
    timerRef.current = setTimeout(advance, 700);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [played, autoPlay, draftState, advance, totalMatches]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  // --- Derived ---

  const eligiblePlayers = currentSquad
    ? getEligiblePlayers(currentSquad, filledIds, config.formation, filledLabels, selectedSlot)
    : [];

  const canSpin = !spinning && !pendingPlayer && !allFilled
    && (config.draftMode !== 'position-first' || selectedSlot !== null);

  const showOverlay = currentSquad && !spinning;

  const currentStep = draftState === 'drafting' ? 1
    : draftState === 'ready' ? 1
    : draftState === 'simulating' ? 2
    : draftState === 'playing' ? 2
    : 3;

  // --- Render ---

  if (draftState === 'simulating') {
    return (
      <div className={styles.container}>
        <StepIndicator current={2} total={4} labels={stepLabels} />
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Simulerar sasongen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StepIndicator current={currentStep} total={4} labels={stepLabels} />

      <div className={styles.main}>
        <div className={styles.left}>
          <OverallStrip
            overall={xi.overall}
            attack={xi.attack}
            midfield={xi.midfield}
            defence={xi.defence}
          />
          <FormationView
            formation={config.formation}
            slots={filledSlots}
            tall
            interactive={draftState === 'drafting'}
            selectedSlot={draftState === 'drafting' ? selectedSlot : undefined}
            onSlotClick={draftState === 'drafting' ? handleSlotClick : undefined}
          />
        </div>

        <div className={styles.right}>
          {draftState === 'drafting' && (
            <>
              <div className={styles.rerollRow}>
                <span className={styles.rerollLabel}>Omkast</span>
                <div className={styles.rerollDots}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span
                      key={i}
                      className={`${styles.rerollDot} ${i < rerollsLeft ? styles.rerollActive : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.progress}>
                <span className={styles.progressLabel}>Spelare</span>
                <span className={styles.progressCount}>{filledCount}/{totalSlots}</span>
              </div>

              <div className={styles.slotMachine}>
                <div className={styles.slotReel}>
                  <div className={styles.reelClip}>
                    <span key={teamLocked ? 'team-locked' : rollTick} className={`${styles.slotText} ${teamLocked ? styles.slotStatic : ''}`}>
                      {rolling ? rollTeam : (currentSquad?.team ?? '---')}
                    </span>
                  </div>
                </div>
                <span className={styles.slotX}>X</span>
                <div className={styles.slotReel}>
                  <div className={styles.reelClip}>
                    <span key={rollTick + 1000} className={styles.slotText}>
                      {rolling ? rollSeason : (currentSquad ? String(currentSquad.season) : '--')}
                    </span>
                  </div>
                </div>
              </div>

              <button className={styles.spinBtn} onClick={handleSpin} disabled={!canSpin}>
                Snurra fram spelare
              </button>

              {config.draftMode === 'position-first' && !selectedSlot && !allFilled && (
                <span className={styles.hint}>Klicka pa en position pa planen</span>
              )}
            </>
          )}

          {draftState === 'ready' && (
            <>
              <div className={styles.slotList}>
                {sortSlotsRightToLeft(slotDefs).map((slot) => (
                  <PlayerSlot
                    key={slot.label}
                    positionLabel={getSwedishLabel(slot.label)}
                    player={filledSlots[slot.label] ?? null}
                    positionGroup={slot.position}
                  />
                ))}
              </div>
              <button className={styles.simBtn} onClick={handleSimulate}>
                Simulera sasong
              </button>
            </>
          )}

          {(draftState === 'playing' || draftState === 'done') && (
            <button className={styles.autoBtn} onClick={() => setAutoPlay(!autoPlay)}>
              {autoPlay ? 'Pausa' : 'Auto'}
            </button>
          )}
        </div>
      </div>

      {/* Results section — Text-TV styled */}
      {(draftState === 'playing' || draftState === 'done') && result && (
        <TextTVPanel
          title="DINA MATCHER"
          meta={`${played} SPELADE`}
          scrollable
          maxHeight={draftState === 'done' ? undefined : "360px"}
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

          {draftState === 'done' && u && (
            <>
              <div className={styles.finalSection}>
                <div className={styles.sectionLabel}>SLUTTABELL</div>
                <div className={styles.finalHeader}>
                  <div className={styles.bigRecord}>
                    {u.wins}W - {u.draws}D - {u.losses}L
                  </div>
                  <div className={styles.ptsLine}>
                    {u.points} POANG  GD {gd >= 0 ? `+${gd}` : gd}
                  </div>
                  <div className={styles.posLine}>
                    PLATS {result.finalPosition}/{result.finalTable.length}
                  </div>
                  {u.losses === 0 && (
                    <div className={styles.undefeated}>30-0  OBESEGRADE!</div>
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
                      <span>{result.goldenBoot.playerName}  {result.goldenBoot.goals} mal</span>
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
                      <span>{result.goldenGlove.playerName}  {result.goldenGlove.cleanSheets} hallna nollor</span>
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

              <div className={styles.restartWrap}>
                <button className={styles.restartBtn} onClick={onRestart}>
                  Spela igen
                </button>
              </div>
            </>
          )}
        </TextTVPanel>
      )}

      {/* Squad overlay */}
      {showOverlay && (
        <div className={styles.squadOverlay}>
          <div className={styles.squadCard}>
            <div className={styles.squadHeader}>
              <span className={styles.squadName}>{currentSquad.team}</span>
              <span className={styles.squadSeason}>{currentSquad.season}</span>
            </div>

            <div className={styles.overlayReroll}>
              <button className={styles.rerollBtn} onClick={handleReroll} disabled={rerollsLeft <= 0}>
                Reroll ({rerollsLeft} kvar)
              </button>
              <button className={styles.spinBtnSm} onClick={handleSpin}>
                Ny trupp
              </button>
            </div>

            {pendingPlayer ? (
              <div className={styles.posChooser}>
                <p className={styles.posChooserText}>
                  Valj position for {pendingPlayer.name}
                </p>
                <div className={styles.posChooserBtns}>
                  {pendingGroups.map((g) => (
                    <button
                      key={g}
                      className={`${styles.posChooserBtn} ${styles[`pos${g}`] || ''}`}
                      onClick={() => addPlayer(pendingPlayer, g)}
                    >
                      {getPositionLabel(g)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.playerList}>
                {eligiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    className={`${styles.playerRow} ${!p.available ? styles.playerMuted : ''}`}
                    onClick={() => p.available && handlePickPlayer(p)}
                    disabled={!p.available}
                  >
                    {p.openGroups.map((g) => (
                      <span key={g} className={`${styles.playerPos} ${styles[`pos${g}`] || ''}`}>
                        {getPositionLabel(g)}
                      </span>
                    ))}
                    <span className={styles.playerName}>{p.name}</span>
                    <span className={styles.playerOvr}>{Math.round(p.ovr)}</span>
                  </button>
                ))}
              </div>
            )}

            {!pendingPlayer && eligiblePlayers.filter((p) => p.available).length === 0 && (
              <button className={styles.skipBtn} onClick={handleSpin}>
                Inga valbara, snurra igen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
