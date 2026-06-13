# 30-0

> Bygg ditt drömlag från 25 säsonger Allsvenskan (2001–2025) och försök vinna guldet — klarar du av det obesegrad?

Ett webbaserat draftspel inspirerat av klassiska 38-0. Du väljer formation, drar spelare från verkliga Allsvenska säsonger och spelar en 30 matcher lång säsong mot 15 AI-styrda motståndare.

---

## Spela

[30-0.se](https://30-0.se) – ingen installation krävs, fungerar i webbläsaren.

---

## Funktioner

- **25 säsongers data** (2001–2025) med statistik från FBref
- **Sex formationer**: 5-4-1, 4-5-1, 3-4-3, 3-5-2, 4-4-2, 4-3-3
- **Två draft-lägen**: squad-first (välj spelare fritt ur en trupp) och position-first (klicka på en position först)
- **Reroll-mekanik**: kasta om truppen — 3 rerolls på easy, 1 på normal, 0 på hard
- **OVR-betyg** (1–99) per position med z-score, percentil och lagjustering
- **Season mode** (spelare betygsatta per säsong) eller **Peak mode** (varje spelares karriärsbästa)
- **Matchmotor** minut-för-minut-simulering med hemmaplansfördel och slumpade målskyttar
- **30 matcher mot 15 AI-lag** med styrka baserad på historisk Allsvensk statistik
- **Text-TV-gränssnitt** inspirerat av SVT Text-TV med sidor för trupp, odds, resultat, tabell och säsongsartikel
- **Auto-spara** – din draft sparas i webbläsaren så du kan fortsätta senare

---

## Tech stack

| Del | Teknik |
|-----|--------|
| Scraper | C# (.NET) |
| Databehandling | C# – JSON → statiska datafiler |
| Frontend | React 19 + Vite + TypeScript |
| Styling | SCSS-moduler |
| Deployment | Vercel |
| Statistikdata | FBref (offentlig, read-only) |

---

## Utveckling lokalt

```bash
cd frontend
npm install
npm run dev          # Frontend på localhost:5173
npm run server       # Express-server för API (valfritt)
npm run dev:all      # Båda samtidigt
npm run build        # Produktionsbygge
```

Datafilerna (`src/data/*.json`) är förgenererade och versionshanterade – ingen scraper krävs för att köra frontend.

---

## Datakälla

Spelarstatistik från [FBref.com](https://fbref.com) (Allsvenskan, `comps/29`). Datan används i beskrivande syfte för ett icke-kommersiellt fanprojekt.

30-0 är ett oberoende projekt utan koppling till Allsvenskan, Svenska Fotbollförbundet, någon fotbollsklubb eller FBref/Sports Reference.

---

## Status

Spelet är i alpha med komplett draft- och säsongsflöde. Frontend är fullt fungerande med mobil- och desktop-läge.

### Kommande
- Förbättrad AI-balansering
- Ljud och animationer
- Dela resultat på sociala medier
- Fler säsonger framåt (2026+)
