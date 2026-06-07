import { useState, useCallback } from 'react';
import type { Squad, SquadPlayer, FormationSlot, GameConfig, PlayerCard } from '../../types';
import { formations } from '../../engine/simulationEngine';
import {
  pickRandomSquad, getEligiblePlayers, getPositionsForPlayer,
  getRerollCount,
} from '../../engine/draftEngine';
import FormationView from '../FormationView/FormationView';
import styles from './DraftPhase.module.scss';

interface Props {
  config: GameConfig;
  squads: Squad[];
  onComplete: (xi: Record<string, PlayerCard>) => void;
  onBack: () => void;
}

export default function DraftPhase({ config, squads, onComplete, onBack }: Props) {
  const [filledSlots, setFilledSlots] = useState<Record<string, PlayerCard>>({});
  const [filledIds, setFilledIds] = useState<Set<string>>(new Set());
  const [usedSquadKeys, setUsedSquadKeys] = useState<Set<string>>(new Set());
  const [rerollsLeft, setRerollsLeft] = useState(getRerollCount(config.difficulty));
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null);
  const [spinning, setSpinning] = useState(false);

  const totalSlots = formations[config.formation].length;
  const filledCount = Object.keys(filledSlots).length;

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setCurrentSquad(null);
    setSelectedPlayer(null);

    // Brief animation delay
    setTimeout(() => {
      const squad = pickRandomSquad(squads, usedSquadKeys);
      if (squad) {
        setCurrentSquad(squad);
        setUsedSquadKeys(new Set([...usedSquadKeys, `${squad.team}|${squad.season}`]));
      }
      setSpinning(false);
    }, 600);
  }, [spinning, squads, usedSquadKeys]);

  const handleReroll = useCallback(() => {
    if (rerollsLeft <= 0 || spinning) return;
    setRerollsLeft(rerollsLeft - 1);
    setCurrentSquad(null);
    setSelectedPlayer(null);
    handleSpin();
  }, [rerollsLeft, spinning, handleSpin]);

  function handleSlotClick(slot: FormationSlot) {
    if (config.draftMode !== 'position-first') return;
    if (filledSlots[slot.label]) return;
    setSelectedSlot(slot.label);
    setCurrentSquad(null);
    setSelectedPlayer(null);
  }

  function handlePickPlayer(player: SquadPlayer) {
    if (config.draftMode === 'squad-first') {
      setSelectedPlayer(player);
    } else {
      // Position-first: assign directly to selected slot
      if (!selectedSlot) return;
      addPlayerToSlot(player, selectedSlot);
    }
  }

  function handleAssignPosition(slotLabel: string) {
    if (!selectedPlayer) return;
    addPlayerToSlot(selectedPlayer, slotLabel);
  }

  function addPlayerToSlot(player: SquadPlayer, slotLabel: string) {
    if (filledSlots[slotLabel]) return;

    const card: PlayerCard = {
      name: player.name,
      season: player.season,
      team: player.team,
      ovr: player.ovr,
      positions: [...player.positions],
      id: player.id,
    };

    setFilledSlots({ ...filledSlots, [slotLabel]: card });
    setFilledIds(new Set([...filledIds, player.id]));
    setCurrentSquad(null);
    setSelectedPlayer(null);
    setSelectedSlot(null);

    // Check if draft is complete
    const newFilled = { ...filledSlots, [slotLabel]: card };
    if (Object.keys(newFilled).length >= totalSlots) {
      onComplete(newFilled);
    }
  }

  // Determine which players are eligible for the current context
  const eligiblePlayers = currentSquad
    ? getEligiblePlayers(
        currentSquad,
        filledIds,
        config.draftMode === 'position-first' ? selectedSlot : null
      )
    : [];

  // For squad-first: positions available for selected player
  const assignablePositions = selectedPlayer
    ? getPositionsForPlayer(selectedPlayer, config.formation)
        .filter((p) => !filledSlots[p])
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(filledCount / totalSlots) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>{filledCount} / {totalSlots}</span>
        </div>
        <div className={styles.rerolls}>
          Rerolls: <span className={rerollsLeft === 0 ? styles.noRerolls : ''}>{rerollsLeft}</span>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.formationCol}>
          <FormationView
            formation={config.formation}
            slots={filledSlots}
            highlightSlot={selectedSlot}
            onSlotClick={config.draftMode === 'position-first' ? handleSlotClick : undefined}
          />

          {config.draftMode === 'position-first' && (
            <p className={styles.hint}>
              {selectedSlot
                ? `Vald position: ${selectedSlot}`
                : 'Klicka på en tom position först'}
            </p>
          )}
        </div>

        <div className={styles.squadCol}>
          {/* Spin controls */}
          {!currentSquad && !spinning && (
            <div className={styles.spinArea}>
              <p className={styles.spinHint}>
                {config.draftMode === 'squad-first'
                  ? 'Snurra hjulet för att få en slumpmässig trupp'
                  : selectedSlot
                    ? 'Snurra hjulet för att få spelare som passar positionen'
                    : 'Välj en position först'}
              </p>
              <button
                className={styles.spinBtn}
                onClick={handleSpin}
                disabled={config.draftMode === 'position-first' && !selectedSlot}
              >
                {config.draftMode === 'squad-first' ? '🎲 Snurra!' : selectedSlot ? '🎲 Snurra!' : 'Välj position'}
              </button>
            </div>
          )}

          {/* Spinning animation */}
          {spinning && (
            <div className={styles.spinning}>
              <div className={styles.wheel} />
              <p>Snurrar...</p>
            </div>
          )}

          {/* Current squad display */}
          {currentSquad && !spinning && !selectedPlayer && (
            <div className={styles.squadCard}>
              <div className={styles.squadHeader}>
                <h3>{currentSquad.team}</h3>
                <span className={styles.squadSeason}>{currentSquad.season}</span>
              </div>

              <div className={styles.rerollRow}>
                {rerollsLeft > 0 && (
                  <button className={styles.rerollBtn} onClick={handleReroll}>
                    🔄 Reroll ({rerollsLeft} kvar)
                  </button>
                )}
              </div>

              <div className={styles.playerList}>
                <h4>Tillgängliga spelare</h4>
                {eligiblePlayers.length === 0 ? (
                  <p className={styles.noPlayers}>Inga passande spelare i denna trupp</p>
                ) : (
                  eligiblePlayers.map((p) => (
                    <button
                      key={p.id}
                      className={styles.playerRow}
                      onClick={() => handlePickPlayer(p)}
                    >
                      <span className={styles.playerName}>{p.name}</span>
                      <span className={styles.playerPos}>{p.positions.join(', ')}</span>
                      <span className={styles.playerOvr}>{p.ovr.toFixed(1)}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Bypass: if no eligible players, skip this squad */}
              {eligiblePlayers.length === 0 && (
                <button className={styles.skipBtn} onClick={handleSpin}>
                  Hoppa över denna trupp
                </button>
              )}
            </div>
          )}

          {/* Position assignment (squad-first mode) */}
          {selectedPlayer && config.draftMode === 'squad-first' && (
            <div className={styles.assignCard}>
              <h3>Välj position för {selectedPlayer.name}</h3>
              <div className={styles.positionGrid}>
                {assignablePositions.map((pos) => (
                  <button
                    key={pos}
                    className={styles.positionBtn}
                    onClick={() => handleAssignPosition(pos)}
                  >
                    {pos}
                    {filledSlots[pos] && (
                      <span className={styles.occupied}>(upptagen)</span>
                    )}
                  </button>
                ))}
              </div>
              {assignablePositions.length === 0 && (
                <p className={styles.noPos}>Inga lediga positioner för denna spelare!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
