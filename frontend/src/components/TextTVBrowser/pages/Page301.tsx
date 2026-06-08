import type { TeamXI, FormationKey } from '../../../types';
import { formations } from '../../../engine/simulationEngine';
import { getSwedishLabel, sortSlotsRightToLeft } from '../../../engine/draftEngine';
import { shortName } from '../../../utils/teamNames';
import styles from './pages.module.scss';

interface Props {
  xi: TeamXI;
  formation: FormationKey;
  showRatings?: boolean;
}

export default function Page301({ xi, formation, showRatings = true }: Props) {
  const slotDefs = sortSlotsRightToLeft(formations[formation]);

  return (
    <div>
      <div className={styles.pageTitle}>DIN TRUPP - {formation.toUpperCase()}</div>
      <div className={styles.pageSubtitle}>DEN SPORTSLIGA LEDNINGEN KOM FRAM TILL FÖLJANDE SPELARE</div>

      <div className={`${styles.squadRow} ${styles.squadHeader}`}>
        <span className={styles.squadPos}>POS</span>
        <span className={styles.squadName}>SPELARE</span>
        <span className={styles.squadClub}>KLUBB</span>
        <span className={styles.squadYear}>ÅR</span>
        <span className={styles.squadOvr}>OVR</span>
      </div>

      {slotDefs.map((slot) => {
        const player = xi.slots[slot.label];
        if (!player) return null;
        return (
          <div key={slot.label} className={styles.squadRow}>
            <span className={styles.squadPos}>{getSwedishLabel(slot.label)}</span>
            <span className={styles.squadName}>{player.name.toUpperCase()}</span>
            <span className={styles.squadClub}>{shortName(player.team).toUpperCase()}</span>
            <span className={styles.squadYear}>{player.season}</span>
            <span className={styles.squadOvr}>{showRatings ? Math.round(player.ovr) : '??'}</span>
          </div>
        );
      })}

      <div className={styles.ratingFooter}>
        {showRatings
          ? `ANFALL ${Math.round(xi.attack)} · MITT ${Math.round(xi.midfield)} · FÖRSVAR ${Math.round(xi.defence)} · MV ${Math.round(xi.gkRating)} · OVR ${Math.round(xi.overall)}`
          : 'BETYG DOLDA (SVÅR NIVÅ)'}
      </div>
    </div>
  );
}
