import type { FormationKey, PlayerCard, FormationSlot } from '../../types';
import { formations } from '../../engine/simulationEngine';
import styles from './FormationView.module.scss';

interface Props {
  formation: FormationKey;
  slots: Record<string, PlayerCard>;
  compact?: boolean;
}

export default function FormationView({ formation, slots, compact }: Props) {
  const slotDefs = formations[formation];

  return (
    <div className={`${styles.pitch} ${compact ? styles.compact : ''}`}>
      <div className={styles.field}>
        {renderRow(slotDefs.filter((s) => s.position === 'FW'), 0)}
        {renderRow(slotDefs.filter((s) => s.position === 'MF'), 1)}
        {renderRow(slotDefs.filter((s) => s.position === 'DF'), 2)}
        {renderRow(slotDefs.filter((s) => s.position === 'GK'), 3)}
      </div>
    </div>
  );

  function renderRow(rowSlots: FormationSlot[], _rowIndex: number) {
    if (rowSlots.length === 0) return null;
    return (
      <div className={styles.row}>
        {rowSlots.map((slot) => {
          const player = slots[slot.label];
          const filled = !!player;
          return (
            <div key={slot.label} className={styles.pslot}>
              <div className={`${styles.dot} ${filled ? styles.dotFilled : ''}`}>
                <span>{slot.label}</span>
              </div>
              {player ? (
                <>
                  <span className={styles.pname}>{player.name.split(' ').pop()}</span>
                  <span className={styles.povr}>{Math.round(player.ovr)}</span>
                </>
              ) : (
                <>
                  <span className={styles.pname} style={{ opacity: 0.3 }}>&mdash;</span>
                  <span className={styles.povr} style={{ opacity: 0.2 }}>--</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
