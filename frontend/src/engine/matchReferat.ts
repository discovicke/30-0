import type { MatchResult } from '../types';

export interface ReferatContext {
  round: number;
  oppName: string;
  oppStrength: number;
  oppTier: string;
  userOverall: number;
  isUserHome: boolean;
  userPlayerNames?: string[];
}

// Mulberry32 seeded PRNG — deterministic given seed, no Date/Math.random
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function ordinal(n: number): string {
  if (n === 1) return '1:a';
  if (n === 2) return '2:a';
  return `${n}:e`;
}

type Expectation = 'favorit' | 'jämnt' | 'underläge';
type ResultCat = 'storseger' | 'seger' | 'oavgjort' | 'förlust' | 'storförlust';
type ScoreState = 'user_leads' | 'tied' | 'opp_leads';

function getExpectation(ctx: ReferatContext): Expectation {
  const adj = ctx.userOverall + (ctx.isUserHome ? 3 : -3);
  const diff = adj - ctx.oppStrength;
  if (diff > 5) return 'favorit';
  if (diff < -5) return 'underläge';
  return 'jämnt';
}

function getResultCat(userGoals: number, oppGoals: number): ResultCat {
  const diff = userGoals - oppGoals;
  if (diff >= 3) return 'storseger';
  if (diff > 0) return 'seger';
  if (diff === 0) return 'oavgjort';
  if (diff > -3) return 'förlust';
  return 'storförlust';
}

function getScoreState(u: number, o: number): ScoreState {
  if (u > o) return 'user_leads';
  if (u < o) return 'opp_leads';
  return 'tied';
}

// ---------- PHRASE BANKS ----------

const INTROS: Record<string, readonly string[]> = {
  favorit_home: [
    'Ditt lag gick in som klar favorit inför en hemmapublik med höga förväntningar.',
    'Inför hemmafansen var förväntningarna höga – nu gällde det att leverera.',
    'Hemmaplan och ett övertag i styrka lade grunden för en väntad seger.',
    'Motståndarna anlände som klara underdogs, men fotboll spelas inte på pappret.',
  ],
  favorit_away: [
    'Ditt lag reste som favorit och ville bevisa det även på bortaplan.',
    'Sett till styrkeförhållandena var ditt lag klart bättre, men bortamatcher är sällan enkla.',
    'Bortalaget var klart starkare på pappret – frågan var om man kunde omsätta det till mål.',
    'Ditt lag förväntades hämta hem tre poäng, även borta.',
  ],
  jämnt_home: [
    'En jämn tillställning väntade på hemmaplan – ingen av lagen var given favorit.',
    'Inför den här kvällen var det svårt att peka ut en vinnare.',
    'Hemmaplansfördelen kunde bli avgörande i det i övrigt jämna mötet.',
    'Lika styrkor möttes under kvällen, och hemmaplansfördelen var den enda vägvisaren.',
  ],
  jämnt_away: [
    'Bortatrycket var påtagligt i en jämn match utan uppenbara favoriter.',
    'Det var svårt att sia om utgången – lagen var i stort sett jämbördiga.',
    'En öppen bortamatch mot ett jämnstarkt motstånd.',
    'Matchbilden var svår att förutsäga – bägge lagen hade förutsättningarna att ta poäng.',
  ],
  underläge_home: [
    'Motståndet kom som klara favoriter, men ditt lag vägrade ge upp hemmaplansfördelen.',
    'Det var ett tufft uppdrag hemma mot ett starkare motstånd.',
    'Ditt lag hade allt att bevisa mot ett av seriens bättre lag.',
    'Favoritskapet låg hos gästerna, men hemmaplan ger alltid extra energi.',
  ],
  underläge_away: [
    'Alla räknade med ett bortatapp, men ditt lag hade andra planer.',
    'Det var ett genuint svårt uppdrag borta mot ett starkare motstånd.',
    'Statistiken och formen talade mot ditt lag – men bollen är rund.',
    'Ditt lag var klara outsiders, men reste med ambitionen att överraska.',
  ],
};

function buildUserGoalSentence(
  minute: number,
  scorer: string,
  assistant: string | null,
  stateBefore: ScoreState,
  stateAfter: ScoreState,
  isLateDecider: boolean,
  rng: () => number,
): string {
  const ord = ordinal(minute);
  // Assist clause as parenthetical — works in both subject-first and inverted forms
  const assist = assistant ? ` (framspelad av ${assistant})` : '';

  // Pick a verb phrase. Must work in: "[scorer][assist] [verb] i den Xte minuten."
  // Single-word verbs additionally work in inverted form: "I den Xte minuten [verb] [scorer][assist]."
  let verb: string;
  let canInvert = false; // true = verb is a single word, safe for inversion

  if (stateBefore === 'opp_leads' && stateAfter === 'tied') {
    verb = pick(['kvitterade', 'utjämnade', 'svarade med ett mål'] as const, rng);
    canInvert = verb === 'kvitterade' || verb === 'utjämnade';
  } else if (stateBefore === 'opp_leads' && stateAfter === 'opp_leads') {
    verb = pick(['reducerade', 'hittade reduceringsbollen', 'höll matchen vid liv'] as const, rng);
    canInvert = verb === 'reducerade';
  } else if (stateBefore === 'opp_leads' && stateAfter === 'user_leads') {
    verb = pick(['vände och tog ledningen', 'chockade med ett vändningsmål', 'klev om och tog ledningen'] as const, rng);
  } else if (stateBefore === 'tied' && stateAfter === 'user_leads') {
    if (minute <= 10) {
      verb = pick(['tog en tidig ledning', 'slog till omedelbart', 'öppnade laddningen tidigt'] as const, rng);
    } else {
      verb = pick(['tog ledningen', 'bröt dödläget', 'klev upp och tog ledningen'] as const, rng);
    }
  } else if (isLateDecider) {
    verb = pick(['satte spiken i kistan', 'punkterade tillställningen sent', 'avgjorde definitivt'] as const, rng);
  } else {
    verb = pick(['utökade ledningen', 'ökade på', 'drev in ytterligare ett', 'befäste ledarskapet'] as const, rng);
  }

  // Subject-first form always works grammatically
  const subjectFirst = `${scorer}${assist} ${verb} i den ${ord} minuten.`;
  if (canInvert) {
    // Inverted form: "I den Xte minuten [verb] [scorer][assist]."
    return pick([subjectFirst, `I den ${ord} minuten ${verb} ${scorer}${assist}.`] as const, rng);
  }
  return subjectFirst;
}

function buildOppGoalSentence(
  minute: number,
  oppName: string,
  stateBefore: ScoreState,
  stateAfter: ScoreState,
  rng: () => number,
): string {
  const ord = ordinal(minute);

  let phrase: string;
  if (stateBefore === 'user_leads' && stateAfter === 'tied') {
    phrase = pick([
      `${oppName} kvitterade i den ${ord} minuten`,
      `${oppName} svarade i den ${ord} minuten och utjämnade`,
      `I den ${ord} minuten kvitterade ${oppName}`,
    ] as const, rng);
  } else if (stateBefore === 'user_leads' && stateAfter === 'opp_leads') {
    phrase = pick([
      `${oppName} vände och tog ledningen i den ${ord} minuten`,
      `I den ${ord} minuten chockade ${oppName} med ett vändningsmål`,
    ] as const, rng);
  } else if (stateBefore === 'user_leads' && stateAfter === 'user_leads') {
    phrase = pick([
      `${oppName} reducerade i den ${ord} minuten`,
      `I den ${ord} minuten hittade ${oppName} nätet`,
      `${oppName} fick in ett reduceringsboll i den ${ord} minuten`,
    ] as const, rng);
  } else if (stateBefore === 'tied' && stateAfter === 'opp_leads') {
    phrase = pick([
      `${oppName} tog ledningen i den ${ord} minuten`,
      `I den ${ord} minuten klev ${oppName} upp`,
      `${oppName} bröt dödläget i sin favör i den ${ord} minuten`,
    ] as const, rng);
  } else if (stateBefore === 'opp_leads' && stateAfter === 'opp_leads') {
    phrase = pick([
      `${oppName} utökade ledningen i den ${ord} minuten`,
      `I den ${ord} minuten lade ${oppName} på ytterligare ett mål`,
      `${oppName} ökade på i den ${ord} minuten`,
    ] as const, rng);
  } else {
    phrase = pick([
      `${oppName} hittade nätet i den ${ord} minuten`,
      `I den ${ord} minuten fick ${oppName} in en boll`,
    ] as const, rng);
  }

  return `${phrase}.`;
}

function buildVerdict(
  resultCat: ResultCat,
  expectation: Expectation,
  cleanSheet: boolean,
  comeback: boolean,
  senAvgörare: boolean,
  skräll: boolean,
  mållöst: boolean,
  oppName: string,
  oppTier: string,
  rng: () => number,
): string {
  if (mållöst) {
    return pick([
      'En torr tillställning där ingendera lag lyckades bryta nollan. Poängen delades.',
      'Trots spel i båda riktningarna slutade matchen mållös – ett rättvist slut.',
      '0–0 och ingen av lagen förtjänade mer. Nollor för bägge parter.',
    ] as const, rng);
  }

  if (skräll && resultCat === 'storseger') {
    return pick([
      `En dundrande skrällseger mot ${oppName}! Ingen såg det här komma.`,
      `Säsongens kanske mest överraskande resultat – ditt lag demonterade ${oppName}.`,
    ] as const, rng);
  }

  if (skräll && resultCat === 'seger') {
    return pick([
      `En välförtjänt skrällseger mot ${oppName}. Få hade trott på det på förhand.`,
      `Ditt lag levererade en av säsongens överraskningar mot ${oppName}.`,
      `Tre poäng mot ${oppName} var mer än de flesta vågat hoppas på.`,
    ] as const, rng);
  }

  if (comeback && (resultCat === 'seger' || resultCat === 'storseger')) {
    return pick([
      'Ditt lag vände ett underläge och tog en inspirerande seger.',
      'Från att ha legat under vände ditt lag och tog alla tre poäng.',
      'En karaktärsfull vändning – ditt lag gav aldrig upp.',
    ] as const, rng);
  }

  if (comeback && resultCat === 'oavgjort') {
    return pick([
      'Ditt lag kämpade tillbaka och räddade ett poäng i ett dramatiskt slutskede.',
      'Poängen var välförtjänt – ditt lag vägrade förlora.',
    ] as const, rng);
  }

  if (senAvgörare) {
    return pick([
      'Tre poäng i matchens slutskede – dramatik när den är som bäst.',
      'Ett sent avgörande mål räddade hela poängen. Hjärtat sitter i halsen.',
      'Sent men sant – tre poäng i sista minuten.',
    ] as const, rng);
  }

  switch (resultCat) {
    case 'storseger':
      if (cleanSheet) {
        return pick([
          `En suverän insats – ditt lag vann stort och höll nollan mot ${oppName}.`,
          `Fullträff: storseger och inga insläppta mål. ${oppName} hade inget svar.`,
        ] as const, rng);
      }
      return pick([
        `Ditt lag dominerade och vann stort mot ${oppName}.`,
        `En övertygande seger – ${oppName} fick aldrig riktigt fotfäste.`,
        'Storseger och full pott. Ditt lag klättrar i tabellen.',
      ] as const, rng);

    case 'seger':
      if (cleanSheet) {
        return pick([
          `Tre poäng och nollan hållen – en effektiv insats mot ${oppName}.`,
          'Seger och clean sheet. Ett välspelat möte från ditt lags sida.',
        ] as const, rng);
      }
      if (expectation === 'underläge') {
        return pick([
          `Tre välförtjänta poäng mot ett starkt ${oppName}.`,
          'Ditt lag tog poäng mot favoriterna – ett viktigt kvitto på formen.',
        ] as const, rng);
      }
      return pick([
        'Ditt lag vinner och tar hem alla tre poäng.',
        'En viktig seger – tre poäng i tabellen.',
        'Tre poäng hämtade hem. Arbetet är gjort.',
      ] as const, rng);

    case 'oavgjort':
      if (expectation === 'favorit') {
        return pick([
          'Oavgjort smakade som en förlust – ditt lag borde tagit hem tre poäng.',
          'En poäng när man förväntade sig tre. Missat tillfälle.',
          'Ditt lag hämtade hem en poäng, men förväntningarna var högre.',
        ] as const, rng);
      }
      if (expectation === 'underläge') {
        return pick([
          'En välkommen poäng mot ett starkare motstånd.',
          `Att hålla undan mot ${oppName} och ta en poäng är ett godkänt resultat.`,
        ] as const, rng);
      }
      return pick([
        'Rättvist oavgjort i ett jämnt möte.',
        'En delad pott – bägge lag bidrog i en jämn tillställning.',
        'Poängen delades rättvist.',
      ] as const, rng);

    case 'förlust':
      if (expectation === 'underläge') {
        return pick([
          `Förlust, men ingen katastrof. ${oppName} var starkare den här dagen.`,
          'Ditt lag kämpade men föll till ett bättre lag.',
        ] as const, rng);
      }
      return pick([
        'Ditt lag gick som förlorare ur striden. Viktiga poäng förlorade.',
        'En besvikelse – ditt lag gav inte sin bästa bild.',
        'Tre poäng till motståndarna. Svag dag.',
      ] as const, rng);

    case 'storförlust':
      if (oppTier === 'Elit') {
        return pick([
          `En mörk dag mot ett av seriens bästa lag. Dags att se framåt.`,
          `${oppName} var överlägset och vann stort. Tung läxa.`,
        ] as const, rng);
      }
      return pick([
        'En mörk dag – ditt lag fick sig en rejäl läxa.',
        'Storseger för motståndarna. Ditt lag hade inget svar.',
        'Tungt. Det behövs reflektion och omstart.',
      ] as const, rng);
  }
}

// ---------- FLAVOR EVENTS (yellow cards, chances, subs, penalties) ----------

interface FlavorEvent {
  minute: number;
  text: string;
}

function generateFlavorEvents(
  match: MatchResult,
  ctx: ReferatContext,
  rng: () => number,
): FlavorEvent[] {
  const events: FlavorEvent[] = [];
  const players = ctx.userPlayerNames ?? [];
  const totalGoals = match.homeGoals + match.awayGoals;
  const takenMinutes = new Set(match.goals.map(g => g.minute));

  function freeMinute(base: number, range: number): number {
    let m = base + Math.floor(rng() * range);
    while (takenMinutes.has(m)) m = (m % 89) + 1;
    takenMinutes.add(m);
    return m;
  }

  function pickPlayer(): string {
    return players.length > 0 ? players[Math.floor(rng() * players.length)] : 'spelaren';
  }

  // Yellow cards: 0-2 per match
  const numYellows = Math.floor(rng() * 3);
  for (let i = 0; i < numYellows; i++) {
    const min = freeMinute(12, 70);
    const userCard = rng() < 0.55;
    if (userCard && players.length > 0) {
      const p = pickPlayer();
      events.push({ minute: min, text: pick([
        `${p} fick ett gult kort i den ${ordinal(min)} minuten.`,
        `I den ${ordinal(min)} minuten bokfördes ${p} i domarboken.`,
        `Gult kort för ${p} – domaren hade sett nog i den ${ordinal(min)} minuten.`,
      ] as const, rng) });
    } else {
      events.push({ minute: min, text: pick([
        `${ctx.oppName} fick ett gult kort i den ${ordinal(min)} minuten.`,
        `En spelare i ${ctx.oppName} bokfördes i den ${ordinal(min)} minuten.`,
        `Gult kort mot ${ctx.oppName} i den ${ordinal(min)} minuten.`,
      ] as const, rng) });
    }
  }

  // Big chances (more in low-scoring games)
  const numChances = totalGoals <= 1 ? Math.floor(rng() * 2) + 1 : totalGoals <= 3 ? Math.floor(rng() * 2) : 0;
  for (let i = 0; i < numChances; i++) {
    const min = freeMinute(18, 60);
    const userChance = rng() < 0.6;
    if (userChance && players.length > 0) {
      const p = pickPlayer();
      events.push({ minute: min, text: pick([
        `${p} var millimetrar från mål i den ${ordinal(min)} minuten.`,
        `I den ${ordinal(min)} minuten träffade ${p} stolpen.`,
        `En friyta för ${p} i den ${ordinal(min)} minuten räddades av målvakten.`,
        `${p} sköt utanför från nära håll i den ${ordinal(min)} minuten.`,
        `Fri ${p} i den ${ordinal(min)} minuten – men skottet gick över ribban.`,
      ] as const, rng) });
    } else {
      events.push({ minute: min, text: pick([
        `${ctx.oppName} var nära att öppna poängkontot i den ${ordinal(min)} minuten.`,
        `I den ${ordinal(min)} minuten räddades ditt lag av ribban.`,
        `${ctx.oppName} slösade en stor chans i den ${ordinal(min)} minuten.`,
        `Ditt lags målvakt var tvungen att sträcka sig i den ${ordinal(min)} minuten.`,
      ] as const, rng) });
    }
  }

  // One substitution (user, minute 56-82)
  if (players.length > 0) {
    const min = freeMinute(56, 26);
    const p = pickPlayer();
    events.push({ minute: min, text: pick([
      `${p} byttes ut i den ${ordinal(min)} minuten.`,
      `Tränaren valde att ta av ${p} i den ${ordinal(min)} minuten.`,
      `I den ${ordinal(min)} minuten lämnade ${p} planen.`,
    ] as const, rng) });
  }

  // Penalty miss (15% chance)
  if (rng() < 0.15) {
    const min = freeMinute(22, 55);
    const userPen = rng() < 0.5;
    if (userPen && players.length > 0) {
      const p = pickPlayer();
      events.push({ minute: min, text: pick([
        `${p} missade en straff i den ${ordinal(min)} minuten.`,
        `Ditt lag fick en straff i den ${ordinal(min)} minuten – men ${p} sköt utanför.`,
        `I den ${ordinal(min)} minuten räddade ${ctx.oppName}s målvakt ett straffskott.`,
      ] as const, rng) });
    } else {
      events.push({ minute: min, text: pick([
        `${ctx.oppName} missade en straff i den ${ordinal(min)} minuten.`,
        `Ditt lags målvakt räddade en straff mot ${ctx.oppName} i den ${ordinal(min)} minuten.`,
        `I den ${ordinal(min)} minuten räddade ditt lag ett straffskott.`,
      ] as const, rng) });
    }
  }

  return events;
}

// ---------- PUBLIC API ----------

export function generateReferat(match: MatchResult, ctx: ReferatContext): string {
  const firstMin = match.goals.length > 0 ? match.goals[0].minute : 45;
  const seed = (ctx.round * 31337 + match.homeGoals * 997 + match.awayGoals * 101 +
    firstMin + hashStr(ctx.oppName)) >>> 0;
  const rng = mulberry32(seed);

  const userGoals = match.isUserHome ? match.homeGoals : match.awayGoals;
  const oppGoals = match.isUserHome ? match.awayGoals : match.homeGoals;

  const expectation = getExpectation(ctx);
  const resultCat = getResultCat(userGoals, oppGoals);

  const introKey = `${expectation}_${ctx.isUserHome ? 'home' : 'away'}`;
  const intro = pick(INTROS[introKey] ?? INTROS['jämnt_home'], rng);

  // Detect match flags
  const mållöst = userGoals === 0 && oppGoals === 0;
  const cleanSheet = userGoals > 0 && oppGoals === 0;
  const skräll = expectation === 'underläge' && (resultCat === 'seger' || resultCat === 'storseger');

  let everTrailed = false;
  let lastUserGoalMinute = -1;
  let u = 0;
  let o = 0;
  for (const g of match.goals) {
    if (g.scorer === ctx.oppName) { o++; } else { u++; lastUserGoalMinute = g.minute; }
    if (o > u) everTrailed = true;
  }
  const comeback = everTrailed && (resultCat === 'seger' || resultCat === 'storseger' || resultCat === 'oavgjort');
  const margin = Math.abs(userGoals - oppGoals);
  const senAvgörare = resultCat === 'seger' && margin === 1 && lastUserGoalMinute >= 80;

  // Build goal events
  u = 0; o = 0;
  const allEvents: { minute: number; text: string }[] = [];
  for (const g of match.goals) {
    const stateBefore = getScoreState(u, o);
    const isUser = g.scorer !== ctx.oppName;
    if (isUser) u++; else o++;
    const stateAfter = getScoreState(u, o);
    const isLateDecider = isUser && g.minute >= 80 && stateAfter === 'user_leads' && margin === 1;
    const text = isUser
      ? buildUserGoalSentence(g.minute, g.scorer, g.assistant, stateBefore, stateAfter, isLateDecider, rng)
      : buildOppGoalSentence(g.minute, ctx.oppName, stateBefore, stateAfter, rng);
    allEvents.push({ minute: g.minute, text });
  }

  // Add flavor events (yellow cards, chances, subs, penalties)
  for (const ev of generateFlavorEvents(match, ctx, rng)) {
    allEvents.push(ev);
  }

  allEvents.sort((a, b) => a.minute - b.minute);

  const verdict = buildVerdict(
    resultCat, expectation, cleanSheet, comeback, senAvgörare, skräll,
    mållöst, ctx.oppName, ctx.oppTier, rng,
  );

  return [intro, ...allEvents.map(e => e.text), verdict].join(' ');
}
