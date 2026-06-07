import type { FormationKey, PlayerCard, FormationSlot } from '../../types';
import { formations } from '../../engine/simulationEngine';
import styles from './FormationView.module.scss';

interface Props {
  formation: FormationKey;
  slots: Record<string, PlayerCard>;
  filledSlots?: string[];
  highlightSlot?: string | null;
  onSlotClick?: (slot: FormationSlot) => void;
  compact?: boolean;
}

export default function FormationView({
  formation,
  slots,
  filledSlots,
  highlightSlot,
  onSlotClick,
  compact,
}: Props) {
  const slotDefs = formations[formation];

  return (
    <div className={`${styles.pitch} ${compact ? styles.compact : ''}`}>
      {/* Top: center circle decoration */}
      <div className={styles.topCircle} />

      {/* Slot rows — top to bottom: FW → MF → DF → GK */}
      <div className={styles.field}>
        {renderRow(slotDefs.filter((s) => s.position === 'FW'), 0)}
        {renderRow(slotDefs.filter((s) => s.position === 'MF'), 1)}
        {renderRow(slotDefs.filter((s) => s.position === 'DF'), 2)}
        {renderRow(slotDefs.filter((s) => s.position === 'GK'), 3)}
      </div>

      {/* Bottom: goal silhouette */}
      <div className={styles.goalLine} />
    </div>
  );

  function renderRow(rowSlots: FormationSlot[], _rowIndex: number) {
    if (rowSlots.length === 0) return null;
    const pos = rowSlots[0].position;
    return (
      <div className={styles.row}>
        {pos !== 'GK' && <div className={styles.rowConnector} />}
        <div className={styles.slotsRow}>
          {rowSlots.map((slot) => {
            const player = slots[slot.label];
            const isFilled = !!player;
            const isFilledList = filledSlots?.includes(slot.label) ?? isFilled;
            const isHighlighted = highlightSlot === slot.label;

            return (
              <button
                key={slot.label}
                className={[
                  styles.slot,
                  isFilledList ? styles.filled : styles.empty,
                  isHighlighted ? styles.highlighted : '',
                ].join(' ')}
                onClick={() => onSlotClick?.(slot)}
                disabled={!onSlotClick}
              >
                <span className={styles.slotLabel}>{slot.label}</span>
                {player ? (
                  <span className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.name}</span>
                    <span className={styles.playerOvr}>{player.ovr.toFixed(1)}</span>
                  </span>
                ) : (
                  <span className={styles.emptySlot}>—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}
