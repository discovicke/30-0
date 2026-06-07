import type { TeamXI, FormationKey } from '../../../types';
import { formations } from '../../../engine/simulationEngine';
import { getSwedishLabel, sortSlotsRightToLeft } from '../../../engine/draftEngine';
import styles from './pages.module.scss';

interface Props {
  xi: TeamXI;
  formation: FormationKey;
}

export default function Page301({ xi, formation }: Props) {
  const slotDefs = sortSlotsRightToLeft(formations[formation]);

  return (
    <div>
      <div className={styles.pageTitle}>ALLSVENSKT 30-0 · {formation.toUpperCase()}</div>
      <div className={styles.pageSubtitle}>DIN TRUPP</div>

      <div className={`${styles.squadRow} ${styles.squadHeader}`}>
        <span className={styles.squadPos}>POS</span>
        <span className={styles.squadName}>SPELARE</span>
        <span className={styles.squadClub}>KLUBB</span>
        <span className={styles.squadYear}>AR</span>
        <span className={styles.squadOvr}>OVR</span>
      </div>

      {slotDefs.map((slot) => {
        const player = xi.slots[slot.label];
        if (!player) return null;
        return (
          <div key={slot.label} className={styles.squadRow}>
            <span className={styles.squadPos}>{getSwedishLabel(slot.label)}</span>
            <span className={styles.squadName}>{player.name.toUpperCase()}</span>
            <span className={styles.squadClub}>{player.team.toUpperCase()}</span>
            <span className={styles.squadYear}>{player.season}</span>
            <span className={styles.squadOvr}>{Math.round(player.ovr)}</span>
          </div>
        );
      })}

      <div className={styles.ratingFooter}>
        ANFALL {Math.round(xi.attack)} · MITT {Math.round(xi.midfield)} · FORSVAR {Math.round(xi.defence)} · MV {Math.round(xi.gkRating)} · OVR {Math.round(xi.overall)}
      </div>
    </div>
  );
}
