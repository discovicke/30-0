import { useState, useCallback } from 'react';
import type { Squad, SquadPlayer, GameConfig, PlayerCard } from '../../types';
import { formations, computeTeamRatings } from '../../engine/simulationEngine';
import {
  pickRandomSquad, getEligiblePlayers, getPlayerPosGroups,
  getPositionLabel, autoAssignSlot, getRerollCount,
} from '../../engine/draftEngine';
import PlayerSlot from '../PlayerSlot/PlayerSlot';
import FormationView from '../FormationView/FormationView';
import OverallStrip from '../OverallStrip/OverallStrip';
import StepIndicator from '../StepIndicator/StepIndicator';
import styles from './DraftPhase.module.scss';

interface Props {
  config: GameConfig;
  squads: Squad[];
  onComplete: (xi: Record<string, PlayerCard>) => void;
}

const stepLabels = ['Start', 'Draft', 'Spela', 'Resultat'];

export default function DraftPhase({ config, squads, onComplete }: Props) {
  const [filledSlots, setFilledSlots] = useState<Record<string, PlayerCard>>({});
  const [filledIds, setFilledIds] = useState<Set<string>>(new Set());
  const [usedSquadKeys, setUsedSquadKeys] = useState<Set<string>>(new Set());
  const [rerollsLeft, setRerollsLeft] = useState(getRerollCount(config.difficulty));
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  // For multi-position: store player being placed and their open groups
  const [pendingPlayer, setPendingPlayer] = useState<SquadPlayer | null>(null);
  const [pendingGroups, setPendingGroups] = useState<string[]>([]);

  const totalSlots = formations[config.formation].length;
  const filledCount = Object.keys(filledSlots).length;
  const filledLabels = Object.keys(filledSlots);

  const xi = {
    name: 'Your XI',
    slots: filledSlots,
    formation: config.formation,
    attack: 0, midfield: 0, defence: 0, gkRating: 0, overall: 0,
    goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0, points: 0,
  };
  if (filledCount > 0) computeTeamRatings(xi);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setCurrentSquad(null);
    setPendingPlayer(null);
    setPendingGroups([]);

    setTimeout(() => {
      const squad = pickRandomSquad(squads, usedSquadKeys);
      if (squad) {
        setCurrentSquad(squad);
        setUsedSquadKeys(new Set([...usedSquadKeys, `${squad.team}|${squad.season}`]));
      }
      setSpinning(false);
    }, 400);
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
      const slot = formations[config.formation].find((s) => s.label === selectedSlot);
      if (!slot) return;
      addPlayer(player, slot.position);
      return;
    }

    // Squad-first: check if player fits multiple open groups
    const groups = getPlayerPosGroups(player);
    const openGroups = groups.filter((g) => {
      const slotDefs = formations[config.formation];
      const total = slotDefs.filter((s) => s.position === g).length;
      const filled = filledLabels.filter((l) => slotDefs.find((s) => s.label === l)?.position === g).length;
      return filled < total;
    });

    if (openGroups.length === 0) return;

    if (openGroups.length === 1) {
      addPlayer(player, openGroups[0]);
      return;
    }

    // Multiple groups open — show chooser
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

    if (Object.keys(newFilled).length >= totalSlots) {
      onComplete(newFilled);
    }
  }

  const eligiblePlayers = currentSquad
    ? getEligiblePlayers(currentSquad, filledIds, config.formation, filledLabels, selectedSlot)
    : [];

  const canSpin = !spinning && !pendingPlayer && (config.draftMode !== 'position-first' || selectedSlot !== null);

  const showOverlay = currentSquad && !spinning;

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <StepIndicator current={1} total={4} labels={stepLabels} />
        <div className={styles.progress}>{filledCount}/{totalSlots}</div>
      </div>

      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.spinRow}>
            <button className={styles.spinBtn} onClick={handleSpin} disabled={!canSpin}>
              {spinning ? 'Snurrar...' : 'Snurra fram spelare'}
            </button>
            {config.draftMode === 'position-first' && !selectedSlot && (
              <span className={styles.hint}>Klicka pa en tom position forst</span>
            )}
          </div>

          <div className={styles.slotList}>
            {formations[config.formation].map((slot) => {
              const player = filledSlots[slot.label];
              const isSelected = selectedSlot === slot.label;
              return (
                <PlayerSlot
                  key={slot.label}
                  positionLabel={slot.label}
                  player={player ?? null}
                  active={isSelected}
                  onClick={config.draftMode === 'position-first' && !player
                    ? () => handleSlotClick(slot.label)
                    : undefined}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.right}>
          <FormationView formation={config.formation} slots={filledSlots} />
          {filledCount > 0 && (
            <OverallStrip overall={xi.overall} attack={xi.attack} midfield={xi.midfield} defence={xi.defence} />
          )}
        </div>
      </div>

      {/* Squad overlay */}
      {showOverlay && (
        <div className={styles.squadOverlay}>
          <div className={styles.squadCard}>
            <div className={styles.squadHeader}>
              <span className={styles.squadName}>{currentSquad.team}</span>
              <span className={styles.squadSeason}>{currentSquad.season}</span>
            </div>

            {/* Reroll inside overlay */}
            <div className={styles.overlayReroll}>
              <button className={styles.rerollBtn} onClick={handleReroll} disabled={rerollsLeft <= 0}>
                Reroll ({rerollsLeft} kvar)
              </button>
              <button className={styles.spinBtnSm} onClick={handleSpin}>
                Ny trupp
              </button>
            </div>

            {/* Position chooser for multi-position players */}
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
