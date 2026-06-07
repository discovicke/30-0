# Allsvenskt 38-0 — Plan

## Datakälla

**FBref.com** — enda källan. Gratis, mest avancerad statistik. Allsvenskan = comps/29.

| Säsonger | Status |
|----------|--------|
| 2025 → 2014 | Alla tabeller: Standard, Shooting, Passing, Defensive, Possession, GK |
| 2013 → 2001 | Endast Standard (Min, Gls, Ast, Pos, CrdY, CrdR) |

Scrapas baklänges från 2025 → 2001.

## URL-schema per säsong

```
Standard:    https://fbref.com/en/comps/29/{år}/stats/{år}-Allsvenskan-Stats
Shooting:    https://fbref.com/en/comps/29/{år}/shooting/{år}-Allsvenskan-Stats       (2014+)
Passing:     https://fbref.com/en/comps/29/{år}/passing/{år}-Allsvenskan-Stats         (2014+)
Defensive:   https://fbref.com/en/comps/29/{år}/defense/{år}-Allsvenskan-Stats         (2014+)
Possession:  https://fbref.com/en/comps/29/{år}/possession/{år}-Allsvenskan-Stats      (2014+)
GK Standard: https://fbref.com/en/comps/29/{år}/keepers/{år}-Allsvenskan-Stats         (2014+)
GK Advanced: https://fbref.com/en/comps/29/{år}/keepers/adv/{år}-Allsvenskan-Stats     (2014+)
```

4s delay mellan requests.

## Parsning (AngleSharp)

Tabell-id:n: `stats_standard`, `stats_shooting`, `stats_passing`, `stats_defense`, `stats_possession`, `stats_keeper`, `stats_keeper_adv`.

Multi-position (t.ex. `MF,FW`) sparas som array.

## Härledda positioner

Från FBrefs breda positioner (`GK`, `DF`, `MF`, `FW`) → detaljerade via stat-heuristik:

```
GK → GK

DF:
  goals/90 > 0.1 + carries/90 > 2.0  →  LB, RB
  else                               →  CB

MF:
  goals/90 > 0.3 + assists/90 > 0.2  →  CAM
  assists/90 > 0.25 + crosses/90 > 2  →  RM, LM
  tackles/90 > 2.5                    →  CDM
  else                                →  CM

FW:
  xg/90 > 0.5  →  ST
  assists/90 > 0.2 + carries/90 > 3  →  LW, RW
  else  →  ST, LW

2001-2013: DF→CB, MF→CM, FW→ST
```

Multi-position (MF,FW) → alla passande.

## Datafiler

```
/data
  /players
    2001.json
    ...
    2025.json
  /teams
    teams.json
  /baselines
    baselines.json
```

## OVR — två nivåer

**2014+:** Percentilnormalisering per position per säsong.

Vikter:
- FW: goals×35 + assists×15 + xg×25 + xag×10 + prgCarries×15
- MF: goals×15 + assists×20 + xg×10 + xag×15 + prgCarries×10 + prgPasses×10 + tackles×10 + interceptions×10
- CB: tackles×30 + interceptions×25 + prgPasses×15 + clearances×10 + aerial×10 + xg×5 + xag×5
- FB: tackles×20 + interceptions×20 + prgCarries×20 + xag×15 + crosses×15 + xg×5 + goals×5
- GK: savePct×40 + cleanSheets×25 + psxgNet×25 + crossesStopped×10

**2001–2013:** Enklare vikter.
- FW: goals/90×50 + assists/90×25 + minutes×25
- MF: goals/90×20 + assists/90×25 + minutes×55
- DF: goals/90×5 + assists/90×5 + minutes×90
- GK: gaPer90×50 (inv) + cleanSheets×20 + minutes×30

## Backend (C#)

```
dotnet run -- scrape    →  scrapar alla säsonger
dotnet run -- compute   →  räknar ut OVR + baselines
dotnet run -- all       →  båda
```

## Frontend (senare)

React + Vite + TypeScript. Statisk build → Cloudflare Pages.

## Milstolpar

| # | Steg |
|---|------|
| 1 | PlayerSeason-modell + JSON |
| 2 | Parsning av standard-tabellen |
| 3 | Scrapa 2025 klar (alla tabeller) |
| 4 | Scrapa 2024→2014 |
| 5 | Scrapa 2013→2001 (basic only) |
| 6 | Generera baselines + OVR |
| 7 | Committa JSON |
| 8 | Frontend (React) |
| 9 | Deploy Cloudflare Pages |
