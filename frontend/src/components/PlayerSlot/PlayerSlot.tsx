import type { SquadPlayer } from '../../types';
import styles from './PlayerSlot.module.scss';

interface Props {
  positionLabel: string;
  player?: SquadPlayer | null;
  available?: boolean;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}

export default function PlayerSlot({ positionLabel, player, active, muted, onClick }: Props) {
  const filled = !!player;
  const clickable = !!onClick && !muted;

  return (
    <button
      className={[
        styles.slot,
        filled ? styles.filled : styles.empty,
        active ? styles.active : '',
        muted ? styles.muted : '',
      ].join(' ')}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      <span className={`${styles.posBadge} ${filled ? styles.posFilled : ''}`}>
        {positionLabel}
      </span>
      <div className={styles.info}>
        {player ? (
          <>
            <span className={styles.name}>{player.name}</span>
            <span className={styles.meta}>{player.team} &middot; {player.season}</span>
          </>
        ) : (
          <span className={styles.emptyText}>Inte draftad</span>
        )}
      </div>
      {player ? (
        <span className={`${styles.ovr} ${active ? styles.ovrActive : ''}`}>
          {Math.round(player.ovr)}
        </span>
      ) : (
        <span className={styles.ovrEmpty}>&mdash;</span>
      )}
    </button>
  );
}
