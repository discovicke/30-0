import type { TeamXI } from "../../../types";
import type { PreSeasonOdds } from "../../../engine/draftEngine";
import { getAllAITeams } from "../../../engine/simulationEngine";
import styles from "./pages.module.scss";

interface Props {
  xi: TeamXI;
  odds: PreSeasonOdds;
}

function makeBar(val: number, max: number = 99): string {
  const ratio = Math.min(1, val / max);
  const filled = Math.round(ratio * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export default function Page302({ xi, odds }: Props) {
  const actualRank = odds.projectedPosition;
  const aiTeams = getAllAITeams();
  const allTeams = [...aiTeams, { name: "DITT LAG", strength: xi.overall, tier: undefined }]
    .sort((a, b) => b.strength - a.strength);

  const projRange = actualRank <= 3
    ? "1-5 PLATS"
    : actualRank <= 8
    ? (actualRank - 2) + "-" + (actualRank + 2) + " PLATS"
    : (actualRank - 2) + "-" + (actualRank + 1) + " PLATS";

  const isTitle = actualRank <= 3;
  const isRelegation = actualRank >= 14;

  const areas = [
    { label: "ANFALL", val: xi.attack },
    { label: "MITTFÄLT", val: xi.midfield },
    { label: "FÖRSVAR", val: xi.defence },
    { label: "MÅLVAKT", val: xi.gkRating },
  ];
  const strongest = [...areas].sort((a, b) => b.val - a.val)[0];
  const weakest = [...areas].sort((a, b) => a.val - b.val)[0];

  return (
    <div>
      <div className={styles.pageTitle}>FÖRHANDSTIPS - DITT LAG</div>
      <div className={styles.pageSubtitle}>SAMMANFATTNING: "EXPERTERNA" HAR TIPPAT ÅRETS ALLSVENSKA</div>

      <div className={styles.row}>
        <span className={styles.label}>TIPPAD PLACERING</span>
        <span className={styles.valYellow}>{projRange}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>TITELKANDIDAT</span>
        <span className={styles.val}>{isTitle ? "JA" : "NEJ"}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>NEDFLYTTNINGSRISK</span>
        <span className={styles.val}>{isRelegation ? "JA" : "NEJ"}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>FÖRVÄNTADE POÄNG</span>
        <span className={styles.valYellow}>{odds.projectedPoints}</span>
      </div>

      <div className={styles.section}>LAGANALYS</div>

      <div className={styles.bodyText}>STYRKOR</div>
      <div className={styles.barRow}>
        <span className={styles.barLabel}>{strongest.label}</span>
        <span className={styles.barTrack}>{makeBar(strongest.val)}</span>
        <span className={styles.barValue}>{Math.round(strongest.val)}/99</span>
      </div>

      <div className={styles.bodyText}>SVAGHETER</div>
      <div className={styles.barRow}>
        <span className={styles.barLabel}>{weakest.label}</span>
        <span className={styles.barTrack}>{makeBar(weakest.val)}</span>
        <span className={styles.barValue}>{Math.round(weakest.val)}/99</span>
      </div>

      <div className={styles.section}>ALLA OMRÅDEN</div>
      {areas.map((a) => (
        <div key={a.label} className={styles.barRow}>
          <span className={styles.barLabel}>{a.label}</span>
          <span className={styles.barTrack}>{makeBar(a.val)}</span>
          <span className={styles.barValue}>{Math.round(a.val)}/99</span>
        </div>
      ))}

      <div className={styles.section}>TIPPAD TOPPTABELL</div>
      {allTeams.slice(0, 8).map((t, i) => {
        const isYou = t.name === "DITT LAG";
        return (
          <div key={t.name} className={styles.tippedRow + (isYou ? " " + styles.tippedYou : "")}>
            <span className={styles.tippedRank}>{i + 1}.</span>
            <span className={styles.tippedName}>{t.name}</span>
          </div>
        );
      })}
    </div>
  );
}
