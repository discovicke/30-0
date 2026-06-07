import { useState, useCallback } from 'react';
import type { Squad, SquadPlayer, GameConfig, PlayerCard } from '../../types';
import { formations, computeTeamRatings } from '../../engine/simulationEngine';
import {
  pickRandomSquad, getEligiblePlayers, getPlayerPosGroup,
  autoAssignSlot, getRerollCount,
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

  const totalSlots = formations[config.formation].length;
  const filledCount = Object.keys(filledSlots).length;
  const filledLabels = Object.keys(filledSlots);

  // Compute team ratings from current filled slots for OverallStrip
  const xi = {
    name: 'Your XI',
    slots: filledSlots,
    formation: config.formation,
    attack: 0, midfield: 0, defence: 0, gkRating: 0, overall: 0,
    goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0, points: 0,
  };
  if (filledCount > 0) computeTeamRatings(xi);

  // Build filled position groups set
  const filledPosGroups = new Set<string>();
  for (const label of filledLabels) {
    const s = formations[config.formation].find((f) => f.label === label);
    if (s) filledPosGroups.add(s.position);
  }

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setCurrentSquad(null);

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
  }

  function handlePickPlayer(player: SquadPlayer) {
    if (!currentSquad) return;

    const targetSlot = config.draftMode === 'position-first'
      ? selectedSlot
      : autoAssignSlot(player, config.formation, filledLabels);

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

    if (Object.keys(newFilled).length >= totalSlots) {
      onComplete(newFilled);
    }
  }

  const eligiblePlayers = currentSquad
    ? getEligiblePlayers(
        currentSquad, filledIds, filledPosGroups,
        selectedSlot, config.formation, filledLabels
      )
    : [];

  const canSpin = !spinning && (config.draftMode !== 'position-first' || selectedSlot !== null);

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
            {rerollsLeft > 0 && (
              <button className={styles.rerollBtn} onClick={handleReroll}>
                Reroll ({rerollsLeft})
              </button>
            )}
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

      {currentSquad && !spinning && (
        <div className={styles.squadOverlay}>
          <div className={styles.squadCard}>
            <div className={styles.squadHeader}>
              <span className={styles.squadName}>{currentSquad.team}</span>
              <span className={styles.squadSeason}>{currentSquad.season}</span>
            </div>
            <div className={styles.playerList}>
              {eligiblePlayers.map((p) => (
                <button
                  key={p.id}
                  className={`${styles.playerRow} ${!p.available ? styles.playerMuted : ''}`}
                  onClick={() => p.available && handlePickPlayer(p)}
                  disabled={!p.available}
                >
                  <span className={styles.playerPos}>{getPlayerPosGroup(p)}</span>
                  <span className={styles.playerName}>{p.name}</span>
                  <span className={styles.playerOvr}>{Math.round(p.ovr)}</span>
                </button>
              ))}
            </div>
            {eligiblePlayers.filter((p) => p.available).length === 0 && (
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
