# Allsvenskan 30-0

> Bygg ditt drömlag från 25 säsongers Allsvenskan och spela dig till guldet, klarar du av det obesegrad?

Ett webbspel inspirerat av [38-0.app](https://38-0.app) och dess föregångare [82-0](https://www.82-0.com/). Du draftar spelare från Allsvenskan 2001–2025, sätter din formation och spelar en 30-matchars säsong mot de 15 föreningar med flest Allsvenska säsonger senaste 25 åren. Lagstyrkan på dessa 15 lag har räknats ut genom att ta genomsnittet på deras insatser dessa 25 år.

---

## Vad är det här?

Du väljer spelare utifrån verklig statistik hämtad från FBref. Varje spelare får ett OVR-betyg (1–99) baserat på sin prestation relativt säsongens genomsnitt. Du kan antingen drafta spelare som de var en specifik säsong, eller plocka varje spelares karriärsbästa.

Sedan kör du säsongen. Vinner du Allsvenskan obesegrad?

---

## Funktioner

- **25 säsongers data** (2001–2025) scrapad från FBref
- **6 779 spelare**, 386 lag, 2 088 unika karriärstoppen-spelare
- **OVR-rating** per position med z-score, percentiler och lagjustering
- **Season mode** (spelare betygsatt per säsong) och **Peak mode** (karriärens bästa)
- **Draft-system** med rerolls och positionsbaserad matchning
- **Match engine** med hemmaplansfördel, styrkebaserade formel och slumpad målskytt
- **30-matchars säsong** mot 15 AI-styrda Allsvenskan-lag

---

## Hur det fungerar

### Data
Statistik scrapad med en C# CLI-scraper direkt från FBref. Rådata sparas som JSON och bearbetas lokalt. Inga live-anrop i spelet.

### OVR-beräkning
```
z-score → percentil → viktat medel per position → lagjustering → linjär skalning (40–99)
```
Exempelindex för anfallare: mål/90 (30%), assist/90 (15%), xG/90 (15%) m.fl.

### Match engine
Varje match simuleras minut för minut (5-min-intervall). Målchanser genereras baserat på styrkeförhållandet mellan lagen:
```
expected = 1.2 × (ratio^3.5) + homeBonus
```
Målvaktens OVR väger tungt (30% av lagets overall).

### Formationer
Stödjer 4-3-3, 4-4-2 och 3-5-2. Varje position matchas mot spelarens faktiska roller i datat.

---

## Tech stack

| Del | Teknik |
|-----|--------|
| Scraper + engine | C# (.NET) |
| Data | Statisk JSON |
| Frontend | React + Vite + TypeScript *(kommer)* |
| Deploy | Cloudflare Pages *(kommer)* |

---

## Status

### Klart
- [x] Scraper för alla 25 säsonger inklusive målvaktsdata
- [x] OVR-beräkning med lagjustering
- [x] Game DB och Peak DB
- [x] Match engine med hemmaplansfördel
- [x] 30-matchars säsongssimulation
- [x] Draft med reroll-mekanik

### Under arbete
- [ ] Frontend (React + Vite)
- [ ] Deploy till Cloudflare Pages
- [ ] Förbättrad draft (gemensam pool istället för per-squad)
- [ ] Balansering av AI-lag mot verklig historisk data

---

## Kör lokalt

```bash
# Hämta data från FBref (kräver internetanslutning)
dotnet run -- scrape 2001 2025

# Beräkna OVR för alla spelare
dotnet run -- compute

# Bygg peak-databasen
dotnet run -- build-peak

# Simulera ett draft + säsong
dotnet run -- draft 4-3-3 1 3 peak
dotnet run -- simulate 4-3-3
```

Använd `--local` för att köra scrapen mot sparade HTML-filer utan nätverksanrop.

---

## Datakälla

Statistik från [FBref.com](https://fbref.com) (Allsvenskan, `comps/29`). Datan används enbart för privat, icke-kommersiellt bruk.

---

*Projektet är under aktiv utveckling. Frontend och deploy kommer.*
