import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Squad, SquadPlayer, GameConfig, PlayerCard, SeasonResult, SavedDraftState } from '../../types';
import { formations, simulateSeason, computeTeamRatings } from '../../engine/simulationEngine';
import {
  pickRandomSquad, getEligiblePlayers, getPlayerPosGroups,
  getPositionLabel, autoAssignSlot, getRerollCount,
  computePreSeasonOdds, autoFillSquad,
  playerKey,
} from '../../engine/draftEngine';

import {X, ArrowLeft} from 'lucide-react';
import { displayName } from "../../utils/teamNames";
import FormationView from '../FormationView/FormationView';
import OverallStrip from '../OverallStrip/OverallStrip';
import StepIndicator from '../StepIndicator/StepIndicator';
import TextTVBrowser from '../TextTVBrowser/TextTVBrowser';
import styles from './DraftPhase.module.scss';

interface Props {
  config: GameConfig;
  squads: Squad[];
  onRestart: () => void;
  savedState?: SavedDraftState;
}

const stepLabels = ['Start', 'Draft', 'Text-TV', 'Klar'];

type DraftState = 'drafting' | 'ready' | 'simulating';

export default function DraftPhase({ config, squads, onRestart, savedState }: Props) {
  const [filledSlots, setFilledSlots] = useState<Record<string, PlayerCard>>(savedState?.filledSlots ?? {});
  const [filledIds, setFilledIds] = useState<Set<string>>(new Set(savedState?.filledIds ?? Object.values(savedState?.filledSlots ?? {}).map(p => p.id)));
  const [usedSquadKeys, setUsedSquadKeys] = useState<Set<string>>(new Set(savedState?.usedSquadKeys ?? []));
  const [rerollsLeft, setRerollsLeft] = useState(savedState?.rerollsLeft ?? getRerollCount(config.difficulty));
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(savedState?.currentSquad ?? null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(savedState?.selectedSlot ?? null);
  const [spinning, setSpinning] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rollTeam, setRollTeam] = useState('');
  const [rollSeason, setRollSeason] = useState('');
  const [rollTick, setRollTick] = useState(0);
  const [teamLocked, setTeamLocked] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<SquadPlayer | null>(null);
  const [pendingGroups, setPendingGroups] = useState<string[]>([]);
  const [draftState, setDraftState] = useState<DraftState>(savedState?.draftState ?? 'drafting');
  const [result, setResult] = useState<SeasonResult | null>(savedState?.result ?? null);
  const [mobileView, setMobileView] = useState<'trupp' | 'texttv'>('trupp');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [sortByRating, setSortByRating] = useState(false);

  // Auto-switch to TextTV on mobile when draft completes
  useEffect(() => {
    if (draftState === 'ready') setMobileView('texttv');
  }, [draftState]);

  const totalSlots = formations[config.formation].length;
  const filledCount = Object.keys(filledSlots).length;
  const filledLabels = Object.keys(filledSlots);
  const allFilled = filledCount >= totalSlots;

  // Players already in the XI, keyed by season-independent identity, so the same
  // player can't be drafted again from a different season.
  const filledKeys = useMemo(
    () => new Set(Object.values(filledSlots).map(playerKey)),
    [filledSlots]
  );

  const reelSeasons = useMemo(() =>
    Array.from({ length: config.seasonMax - config.seasonMin + 1 }, (_, i) => config.seasonMin + i),
    [config.seasonMin, config.seasonMax]
  );

  const xi = {
    name: 'Your XI',
    slots: filledSlots,
    formation: config.formation,
    attack: 0, midfield: 0, defence: 0, gkRating: 0, overall: 0,
    goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0, points: 0,
  };
  if (filledCount > 0) computeTeamRatings(xi);

  const slotDefs = formations[config.formation];

  const groupCounts = { FW: 0, MF: 0, DF: 0 };
  for (const label of filledLabels) {
    const def = slotDefs.find((s) => s.label === label);
    if (!def) continue;
    if (def.position === 'GK' || def.position === 'DF') groupCounts.DF++;
    else if (def.position === 'MF') groupCounts.MF++;
    else if (def.position === 'FW') groupCounts.FW++;
  }
  const emptyAttack = groupCounts.FW === 0;
  const emptyMidfield = groupCounts.MF === 0;
  const emptyDefence = groupCounts.DF === 0;

  // --- Draft logic (slot machine) ---

  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setRolling(true);
    setTeamLocked(false);
    setCurrentSquad(null);
    setPendingPlayer(null);
    setPendingGroups([]);
    setOverlayVisible(true);

    const squad = pickRandomSquad(squads, usedSquadKeys);
    const teamSteps = 14;
    const seasonSteps = 22;

    function rollTeamStep(step: number) {
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
      rollTimerRef.current = setTimeout(() => rollTeamStep(step + 1), 60 + p * p * 200);
    }

    function rollSeasonStep(step: number) {
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
      setRollSeason(String(reelSeasons[Math.floor(Math.random() * reelSeasons.length)]));
      setRollTick((t) => t + 1);
      const p = step / seasonSteps;
      rollTimerRef.current = setTimeout(() => rollSeasonStep(step + 1), 60 + p * p * 260);
    }

    rollTeamStep(0);
    setTimeout(() => rollSeasonStep(0), 90);
  }, [spinning, squads, usedSquadKeys]);

  const handleReroll = useCallback(() => {
    if (rerollsLeft <= 0 || spinning) return;
    setRerollsLeft(rerollsLeft - 1);
    handleSpin();
  }, [rerollsLeft, spinning, handleSpin]);

  // "I feel lucky" — auto-fill the rest of the squad randomly
  function handleFeelingLucky() {
    if (spinning) return;
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    setRolling(false);
    setCurrentSquad(null);
    setPendingPlayer(null);
    setPendingGroups([]);

    const result = autoFillSquad(
      squads, config.formation, filledSlots, filledIds, usedSquadKeys,
      config.seasonMin, config.seasonMax,
    );
    setFilledSlots(result.filledSlots);
    setFilledIds(result.filledIds);
    setUsedSquadKeys(result.usedSquadKeys);
    setSelectedSlot(null);
  }

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
      addPlayer(player, undefined, selectedSlot);
      return;
    }

    const groups = getPlayerPosGroups(player);
    const openGroups = groups.filter((g) => {
      const total = slotDefs.filter((s) => s.position === g).length;
      const filled = filledLabels.filter((l) => slotDefs.find((s) => s.label === l)?.position === g).length;
      return filled < total;
    });

    if (openGroups.length === 0) return;
    if (openGroups.length === 1) { addPlayer(player, openGroups[0]); return; }
    setPendingPlayer(player);
    setPendingGroups(openGroups);
  }

  function addPlayer(player: SquadPlayer, targetGroup?: string, exactSlot?: string) {
    if (exactSlot && !filledSlots[exactSlot]) {
      const card: PlayerCard = {
        name: player.name, season: player.season, team: player.team,
        ovr: player.ovr, positions: [...player.positions], id: player.id,
      };
      setFilledSlots({ ...filledSlots, [exactSlot]: card });
      setFilledIds(new Set(filledIds).add(player.id));
      setCurrentSquad(null);
      setSelectedSlot(null);
      setPendingPlayer(null);
      setPendingGroups([]);
      return;
    }

    const targetSlot = autoAssignSlot(player, config.formation, filledLabels, targetGroup);
    if (!targetSlot || filledSlots[targetSlot]) return;

    const card: PlayerCard = {
      name: player.name, season: player.season, team: player.team,
      ovr: player.ovr, positions: [...player.positions], id: player.id,
    };

    setFilledSlots({ ...filledSlots, [targetSlot]: card });
    setFilledIds(new Set(filledIds).add(player.id));
    setCurrentSquad(null);
    setSelectedSlot(null);
    setPendingPlayer(null);
    setPendingGroups([]);
  }

  // Auto-transition drafting → ready
  useEffect(() => {
    if (allFilled && draftState === 'drafting') setDraftState('ready');
  }, [allFilled, draftState]);

  // Save state to localStorage for Continue Draft
  useEffect(() => {
    const state: SavedDraftState = {
      config,
      filledSlots,
      filledIds: [...filledIds],
      usedSquadKeys: [...usedSquadKeys],
      rerollsLeft,
      currentSquad,
      selectedSlot,
      draftState,
      result,
    };
    localStorage.setItem('30-0-draft', JSON.stringify(state));
  }, [filledSlots, usedSquadKeys, rerollsLeft, currentSquad, selectedSlot, draftState, result, config]);

  // --- Simulate (triggered from TextTVBrowser) ---

  function handleSimulate() {
    setDraftState('simulating');
    setTimeout(() => {
      const teamXI = { ...xi, slots: { ...filledSlots } };
      const simResult = simulateSeason(teamXI, config.formation, config.ratingMode);
      setResult(simResult);
      setDraftState('ready');
    }, 1200);
  }

  // Cleanup
  useEffect(() => {
    return () => { if (rollTimerRef.current) clearTimeout(rollTimerRef.current); };
  }, []);

  // --- Derived ---

  const eligiblePlayers = currentSquad
    ? getEligiblePlayers(currentSquad, filledKeys, config.formation, filledLabels, selectedSlot)
    : [];

  const displayedPlayers = sortByRating
    ? [...eligiblePlayers].sort((a, b) => b.ovr - a.ovr)
    : eligiblePlayers;

  const canSpin = !spinning && !pendingPlayer && !allFilled
    && (config.draftMode !== 'position-first' || selectedSlot !== null);

  const showOverlay = currentSquad && !spinning && overlayVisible;

  const odds = filledCount > 0 ? computePreSeasonOdds(xi.overall, config.ratingMode) : null;

  const currentStep = draftState === 'drafting' ? 1
    : draftState === 'simulating' ? 2
    : result ? 3 : 2;

  // --- Render ---

  if (draftState === 'simulating') {
    return (
      <div className={styles.container}>
        <StepIndicator current={2} total={4} labels={stepLabels} />
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>Simulerar säsongen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StepIndicator current={currentStep} total={4} labels={stepLabels} />

      {/* Mobile-only controls above pitch */}
      {draftState === 'drafting' && (
        <div className={styles.mobileControls}>
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
            <span className={styles.progressLabel}>Du har tagit ut</span>
            <span className={styles.progressCount}>{filledCount}/{totalSlots}</span>
            <span className={styles.progressLabel}>spelare</span>
          </div>
          <div className={styles.slotMachine}>
            <div className={styles.slotReel}>
              <div className={styles.reelClip}>
                <span key={teamLocked ? 'team-locked' : rollTick} className={`${styles.slotText} ${teamLocked ? styles.slotStatic : ''}`}>
                  {rolling ? displayName(rollTeam) : (currentSquad ? displayName(currentSquad.team) : '---')}
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
          {currentSquad && !overlayVisible ? (
            <button className={styles.spinBtn} onClick={() => setOverlayVisible(true)}>
              Visa trupp
            </button>
          ) : (
            <button className={styles.spinBtn} onClick={handleSpin} disabled={!canSpin}>
              Snurra fram spelare
            </button>
          )}
          {!allFilled && (
            <button className={styles.luckyBtn} onClick={handleFeelingLucky} disabled={spinning}>
              Jag har tur – slumpa laget
            </button>
          )}
        </div>
      )}

      {/* Mobile tab switch between squad and TextTV */}
      {draftState === 'ready' && (
        <div className={styles.mobileTabs}>
          <button
            className={`${styles.mobileTab} ${mobileView === 'trupp' ? styles.mobileTabActive : ''}`}
            onClick={() => setMobileView('trupp')}
          >
            SE TRUPP
          </button>
          <button
            className={`${styles.mobileTab} ${mobileView === 'texttv' ? styles.mobileTabActive : ''}`}
            onClick={() => setMobileView('texttv')}
          >
            TEXT-TV {!result ? '(SIMULERA)' : ''}
          </button>
        </div>
      )}

      <div className={`${styles.main} ${draftState === 'ready' && mobileView === 'texttv' ? styles.mainTextTV : ''}`}>
        <div className={styles.left}>
          {draftState === 'drafting' && (
            <div className={styles.rerollHeader}>
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
            </div>
          )}
          <FormationView
            formation={config.formation}
            slots={filledSlots}
            tall
            interactive={draftState === 'drafting'}
            selectedSlot={draftState === 'drafting' ? selectedSlot : undefined}
            onSlotClick={draftState === 'drafting' ? handleSlotClick : undefined}
          />
          <OverallStrip
            overall={xi.overall}
            attack={xi.attack}
            midfield={xi.midfield}
            defence={xi.defence}
            emptyAttack={emptyAttack}
            emptyMidfield={emptyMidfield}
            emptyDefence={emptyDefence}
          />
        </div>

        <div className={styles.right}>
          {draftState === 'drafting' && (
            <div className={styles.desktopControls}>
              <div className={styles.progress}>
                <span className={styles.progressLabel}>Du har tagit ut</span>
                <span className={styles.progressCount}>{filledCount}/{totalSlots}</span>
                <span className={styles.progressLabel}>spelare</span>
              </div>

              <div className={styles.slotMachine}>
                <div className={styles.slotReel}>
                  <div className={styles.reelClip}>
                    <span key={teamLocked ? 'team-locked' : rollTick} className={`${styles.slotText} ${teamLocked ? styles.slotStatic : ''}`}>
                      {rolling ? displayName(rollTeam) : (currentSquad ? displayName(currentSquad.team) : '---')}
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

              {currentSquad && !overlayVisible ? (
                <button className={styles.spinBtn} onClick={() => setOverlayVisible(true)}>
                  Visa trupp
                </button>
              ) : (
                <button className={styles.spinBtn} onClick={handleSpin} disabled={!canSpin}>
                  Snurra fram spelare
                </button>
              )}

              {!allFilled && (
                <button className={styles.luckyBtn} onClick={handleFeelingLucky} disabled={spinning}>
                  Jag har tur – slumpa laget
                </button>
              )}

              {config.draftMode === 'position-first' && !selectedSlot && !allFilled && (
                <span className={styles.hint}>Klicka på en position på planen</span>
              )}

            </div>
          )}

          {draftState === 'ready' && odds && (
            <TextTVBrowser
              xi={xi}
              formation={config.formation}
              odds={odds}
              result={result}
              onSimulate={handleSimulate}
              onRestart={onRestart}
              ratingMode={config.ratingMode}
              matchByMatch={config.matchByMatch}
            />
          )}
        </div>
      </div>

      {/* Mobile TextTV (replaces left column on mobile when texttv tab active) */}
      {draftState === 'ready' && odds && mobileView === 'texttv' && (
        <div className={styles.mobileTextTV}>
          <TextTVBrowser
            xi={xi}
            formation={config.formation}
            odds={odds}
            result={result}
            onSimulate={handleSimulate}
            onRestart={onRestart}
            ratingMode={config.ratingMode}
            matchByMatch={config.matchByMatch}
          />
        </div>
      )}

      {/* Squad overlay */}
      {showOverlay && (
        <div className={styles.squadOverlay}>
          <div className={styles.squadCard}>
            <div className={styles.squadHeader}>
              <div className={styles.squadHeaderInfo}>
                <span className={styles.squadName}>{displayName(currentSquad.team)}</span>
                <span className={styles.squadSeason}>{currentSquad.season}</span>
              </div>
              <button className={styles.closeBtn} onClick={() => { setOverlayVisible(false); setPendingPlayer(null); }}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.overlayReroll}>
              <button className={styles.rerollBtn} onClick={handleReroll} disabled={rerollsLeft <= 0}>
                Reroll ({rerollsLeft} kvar)
              </button>
            </div>

            {pendingPlayer ? (
              <div className={styles.posChooser}>
                  <p className={styles.posChooserText}>
                    Välj position för {pendingPlayer.name}
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
                <button className={styles.posBackBtn} onClick={() => { setPendingPlayer(null); setPendingGroups([]); }}>
                  <ArrowLeft size={12} /> Tillbaka till spelarlistan
                </button>
              </div>
            ) : (
              <div className={styles.playerList}>
                {config.showRatings && (
                  <button
                    className={styles.sortBtn}
                    onClick={() => setSortByRating((s) => !s)}
                  >
                    {sortByRating ? 'Sortering: Betyg ↓' : 'Sortera efter betyg'}
                  </button>
                )}
                {displayedPlayers.map((p) => (
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
                    <span className={styles.playerOvr}>{config.showRatings ? Math.round(p.ovr) : '??'}</span>
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
