# Allsvenskt 38-0 — Plan

## Projektöversikt

Svenskt fotbollsspel inspirerat av 38-0-0. Man bygger ett eget lag genom att drafta
spelare från Allsvenskan 2001–2025, och spelar en 30-matchars säsong mot AI-lag.

---

## 1. Data Pipeline

### Källa: FBref.com

Gratis, mest avancerad statistik. Allsvenskan = `comps/29`.

| Säsonger | Tillgängliga tabeller |
|----------|----------------------|
| 2025–2014 | Standard, Shooting, Passing, Defensive, Possession, GK Standard, GK Advanced, Misc, Playing Time |
| 2013–2001 | Standard, Shooting, Passing, GK Standard, Misc, Playing Time |

URL-schema:

```
Standard:    https://fbref.com/en/comps/29/{år}/stats/{år}-Allsvenskan-Stats
Shooting:    https://fbref.com/en/comps/29/{år}/shooting/{år}-Allsvenskan-Stats
GK:          https://fbref.com/en/comps/29/{år}/keepers/{år}-Allsvenskan-Stats
GK Advanced: https://fbref.com/en/comps/29/{år}/keepers/adv/{år}-Allsvenskan-Stats
```

### Viktig upptäckt: FBref data-stat-prefix

| Tabell | Prefix | Exempel |
|--------|--------|---------|
| Standard | `<ingen>` | `data-stat="goals"` |
| Keeper | `gk_` | `data-stat="gk_save_pct"` |
| Keeper Advanced | `gk_` | `data-stat="gk_psxg_plus_minus"` |

Scrapern (`FbrefScraper`) måste använda rätt prefix i `SetStat()`-anrop.
Tidigare bug: GK-tabellen parsades med data-stat utan `gk_`-prefix → GK-stats
sparades aldrig → GK-OVR baserades på utespelarstatistik (tacklingar, assists).

### Pipeline-kommandon (C# CLI)

| Kommando | Gör |
|----------|-----|
| `scrape [start] [end]` | Hämtar alla sidor och sparar `/data/players/{år}.json` |
| `scrape --local` | Läs från sparade HTML-filer i `/data/pages/{år}/` (ingen nätverkstrafik) |
| `compute` | Räknar baselines och OVR för alla spelare, sparar tillbaka till `/data/players/` |
| `build-peak` | Läser `squads.json`, skapar `squads_peak.json` + `players_peak.json` |

### Datafiler

```
/data
  /players/{år}.json        — Rådata från scrape + OVR från compute
  /pages/{år}/               — Sparade HTML-sidor (för återscrapning utan nätverk)
  /baselines/baselines.json  — Säsongsbaselines per position
  /game/
    players.json             — Game DB: alla spelare med OVR (season mode)
    squads.json              — Game DB: lag per säsong med spelare (season mode)
    players_peak.json        — 2088 unika spelare vid peak (högsta OVR i karriären)
    squads_peak.json         — 386 squads, varje spelare har sin peak-OVR
```

**Skillnad season vs peak:**
- `squads.json`: varje spelare har den OVR de hade den specifika säsongen i det laget
- `squads_peak.json`: varje spelare har sin högsta OVR genom karriären, oavsett säsong
- `build-peak` grupperar på spelarnamn (case-insensitive) för att hitta peak

---

## 2. OVR-beräkning

### Process

1. **Z-score per stat**: `z = (playerValue - seasonAvg) / seasonStdev`
2. **Percentil**: `ZScoreToPercentile(z)` → 0–1 (erf-funktionen)
3. **Normalisera**: `clamp(zScorePercentile * 99, 1, 99)`
4. **Viktat medel**: per position
5. **Lagjustering**: `adjustment = 1.0 + (1.0 - teamFactor) * 0.08`, clamp 0.85–1.15
   - Starkare lag → liten discount på OVR
   - Svagare lag → liten bonus
6. **Linjär skalning**: `scaled = 45.0 + raw * 0.45`, clamp 40–99

### Vikter per position

```
FW:
  goals_per90 × 0.30
  assists_per90 × 0.15
  shots_on_target_per90 × 0.15
  xg_per90 × 0.15
  xag_per90 × 0.10
  progressive_carries_per90 × 0.10
  assists_per90 × 0.05
  goals_per_shot × 0.05
  shots_on_target_pct × 0.05
  goals_per_shot_on_target × 0.05
  goals_pens_per90 × 0.05

MF:
  goals_per90 × 0.15
  assists_per90 × 0.15
  xg_per90 × 0.10
  xag_per90 × 0.10
  progressive_carries_per90 × 0.10
  progressive_passes_received_per90 × 0.10
  tackles_won_per90 × 0.10
  interceptions_per90 × 0.10
  passes_into_final_third_per90 × 0.05
  passes_into_penalty_area_per90 × 0.05

DF:
  tackles_won_per90 × 0.25
  interceptions_per90 × 0.20
  progressive_passes_received_per90 × 0.15
  clearances_per90 × 0.10
  aerials_won_pct × 0.10
  xg_per90 × 0.05
  xag_per90 × 0.05
  goals_per90 × 0.05
  assists_per90 × 0.05

GK:
  save_pct × 0.45
  clean_sheets_pct × 0.30
  saves_per90 × 0.25
```

Alla vikter är "högre = bättre". Inga inverterade stats.

### Vintage (2001–2013)

Har färre tillgängliga stats men samma pipeline. Enda skillnaden: färre stat-keys
→ färre baseline-dimensioner → OVR baseras på det som finns.

---

## 3. Match Engine (SimulationEngine.cs)

### Formationslag

Tre formationer definierade med positionsslotar:

```
4-3-3:  GK | LB CB CB RB | CM CM CM | LW ST RW
4-4-2:  GK | LB CB CB RB | LM CM CM RM | ST ST
3-5-2:  GK | CB CB CB | LM CM CM CM RM | ST ST
```

Varje slot har `SpecificPositions` som matchar mot spelarens positionslista.
T.ex. LB kan spelas av CB eller CM (finns inga dedikerade ytterbackar i datat).

### Lagstyrka

```
Attack  = medel(anfallsspelarnas OVR)
Midfield = medel(mittfältarnas OVR)
Defence = medel(försvararnas OVR)
GK      = målvaktens OVR
Overall = viktat: Attack 25% + Midfield 25% + Defence 20% + GK 30%
```

### Matchens gång

Varje match simulerar 90 minuter. Hemmalaget får ~52% bollinnehav.
För varje 5-minutersperiod:

1. Slumpa 0–3 målchanser baserat på styrkeförhållande
2. Varje chans kan bli mål om `random < expectedGoals`

**Målformel:**
```
strengthRatio = avg(userOffence, userDefence) / ai.Strength
expected = 1.2 × ratio^3.5 + homeBonus
homeBonus = 0.08 för hemmalag, 0 för bortalag
expected = clamp(expected, 0.2, 0.99)
```

Samma formel för AI mot användaren (symmetrisk). Exponent 3.5 (skarp cutoff),
home bonus +0.08 (motsvarar ~0.5 måls fördel, konstant oavsett lags styrka).

**Målskytt:** slumpas från anfallare (50%), mittfältare (30%), försvarare (15%),
målvakt (0.5%) → GK gör mål vid straffar.

### Säsongssimulation

30 omgångar, alla mot alla (15 lag × 2). Varje omgång = 1 match.
Hemma/borta roteras. Resultat: `SeasonResult` med poäng, målskillnad, etc.

### AI-lag

| Lag | Styrka | Tier |
|-----|--------|------|
| Malmö | 85 | Elit |
| AIK, Djurgården, Göteborg | 84 | Elit |
| Elfsborg | 82 | Stark |
| Häcken | 81 | Stark |
| Hammarby | 80 | Stark |
| Norrköping | 79 | Mellan |
| Helsingborg | 78 | Mellan |
| Kalmar | 77 | Mellan |
| Halmstad | 75 | Lägre |
| Örebro | 74 | Lägre |
| Sundsvall, Gefle, Mjällby | 72–73 | Lägre |

---

## 4. Draft Simulation

### Mekanik (nuvarande implementering)

1. **11 slotar** (en per position). För varje slot:
   - Dra en slumpmässig squad från 386 squads
   - Hitta bästa tillgängliga spelaren som passar slotens position
2. **Rerolls**: global räknare (0/1/3). Innan du accepterar en slot:
   - Om bästa spelarens OVR < tröskel (65 season / 72 peak) och rerolls kvar
   - Släng squadet, dra en ny, minska reroll-räknaren
   - Repeat tills OVR ≥ tröskel eller slut på rerolls
3. Varje slot fylls oåterkalleligt. Använda spelare ("usedIds") kan inte draftas igen.

### Tröskel

- Season: 65 (under medel i season mode ~75)
- Peak: 72 (under medel i peak mode ~82)

Rerolls aktiveras sällan eftersom de flesta squads har en spelare över tröskeln
per position. För att rerolls ska göra nytta borde tröskeln vara högre (t.ex. 80 för peak).

### Resultat (10k simulationer)

| Scenario | Avg OVR | P99 | Max | ≥86 |
|----------|---------|-----|-----|-----|
| Season 0r | 75.6 | 80.7 | 84.4 | 0% |
| Season 1r | 76.4 | 81.1 | 84.4 | 0% |
| Season 3r | 76.9 | 81.3 | 83.1 | 0% |
| Peak 0r | 82.1 | 85.5 | 87.1 | 0.33% |
| Peak 1r | 82.6 | 85.6 | 86.8 | 0.34% |
| Peak 3r | 82.7 | 85.6 | 87.5 | 0.33% |

Season mode når aldrig 86+ — max OVR i season-läget är för lågt.
Peak mode når 86+ i ~0.3% av fallen.

### Begränsningar i nuvarande modell

- Varje slot drar en **oberoende slumpmässig squad** — du kan få samma squad flera gånger
- Verklig draft borde ha en **gemensam pool** (alla tillgängliga spelare) där du väljer en i taget
- Rerolls är globala — en verklig draft har ofta per-slot begränsningar
- Tröskeln är statisk — adaptiv tröskel (baserat på kvarvarande slotar) vore mer realistisk

---

## 5. CLI-kommandon

```
Usage:
  dotnet run -- scrape [startYear] [endYear] [--headed] [--debug] [--local]
  dotnet run -- compute
  dotnet run -- simulate [formation]
  dotnet run -- batch [formation] [n] [targetOvr]
  dotnet run -- draft [formation] [n] [rerolls] [season|peak]
  dotnet run -- build-peak
  dotnet run -- all [--headed] [--debug] [--local]
```

### Python-hjälpscript

| Script | Syfte |
|--------|-------|
| `scripts/inject_gk_stats.py` | Injicerar GK-stats från sparad HTML till JSON (kringgår AngleSharp-bug) |
| `scripts/rebuild_game_db.py` | Återskapar `players.json` + `squads.json` från updated `/data/players/` |

---

## 6. Projektstatus

### Klart

- [x] Scraper alla 25 säsonger (2001–2025), inklusive GK-tabeller
- [x] OVR-beräkning med z-score, percentiler, lagjustering, skalning
- [x] Game DB (players.json, squads.json) med 6779 spelare, 386 squads
- [x] Peak DB (squads_peak.json, players_peak.json) med 2088 unika spelare
- [x] Position derivation (DF→CB/LB/RB, MF→CM/CDM/CAM, FW→ST/LW/RW)
- [x] Match engine med exponent 3.5, home bonus 0.08, clamp 0.2
- [x] Säsongssimulation (30 omgångar, alla AI-lag)
- [x] Draft-simulation med reroll-mekanik
- [x] GK-stats fix (data-stat prefix `gk_`)
- [x] GK-OVR vikter (save_pct 45%, clean_sheets_pct 30%, saves_per90 25%)

### Att göra

- [ ] Trimma reroll-tröskel för peak (80 istället för 72) så rerolls gör nytta
- [ ] Bygg gemensam pool-modell för draft (istället för per-squad)
- [ ] Frontend (React + Vite + TypeScript)
- [ ] Deploy Cloudflare Pages
- [ ] Balansera AI-lags styrkor mot verklig data
- [ ] Lägg till fler formationer (4-3-3, 4-4-2, 3-5-2 finns redan)
- [ ] Testa match engine accuracy mot verkliga resultat

---

## 7. Teknisk skuld

- `ParseGkRow` / `ParseGkAdvRow` fungerar inte via AngleSharp pga tabell-ID-konflikt
  (div och table har samma ID). GK-stats injiceras via Python istället.
- `GenerateGameDb` i C# är en stum metod som inte anropas från CLI (`build-game` saknas).
  Game DB återskapas via Python-script.
- Inga enhetstest — all testning sker via CLI + manuell verifikation.
