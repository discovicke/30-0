# Design — Allsvenskt 38-0

## Övergripande filosofi

Sidan blandar två estetiska register medvetet och tydligt:

- **Flat 2026-design** för applikationsdelar (draft, navigation, spelarkortet, formationsplan)
- **Retro-SVT text-TV** för dataintensiva delar (serietabell, matchresultat)

Kontrasten är poängen. Den beige/grå basen gör att text-TV-panelerna sticker ut
som fönster in i ett annat system, ett som svenska fotbollsfansen känner igen.

---

## Färgpalett

### Bas (applikation)

| Namn | Hex | Användning |
|------|-----|------------|
| `sand-bg` | `#F8F6F1` | Sidbakgrund |
| `sand-surface` | `#EAE7DF` | Sekundära ytor, tags, OVR-celler |
| `sand-border` | `#DDD9CF` | Alla borders på bas-komponenter |
| `sand-white` | `#FFFFFF` | Spelarkort, ifyllda slots |
| `ink` | `#1C1C1A` | Primär text, navbar, ifyllda position-badges |
| `ink-muted` | `#5F5E5A` | Sekundär text |
| `ink-ghost` | `#888780` | Tertiär text, labels, metadata |
| `ink-disabled` | `#C0BDB5` | Tomma slots, disabled states |

### Navbar & chrome

| Namn | Hex | Användning |
|------|-----|------------|
| `chrome-bg` | `#1C1C1A` | Navbar, tab-bar (mobil) |
| `chrome-text` | `#F0EDE5` | Text i navbar |
| `chrome-muted` | `#6B6B68` | Inaktiva nav-länkar |
| `badge-yellow` | `#F5C842` | Mode-badge, aktiv tab-indikator (mobil), aktiv nav-länk underline |

### Formationsplan

| Namn | Hex | Användning |
|------|-----|------------|
| `pitch-bg` | `#2D6A2D` | Planbakgrund |
| `pitch-player` | `rgba(255,255,255,0.25)` | Ifyllda spelar-dots |
| `pitch-empty` | `rgba(255,255,255,0.10)` | Tomma spelar-dots |
| `pitch-border-filled` | `rgba(255,255,255,0.9)` | Border på ifyllda dots |
| `pitch-border-empty` | `rgba(255,255,255,0.5)` | Border på tomma dots |
| `pitch-name` | `rgba(255,255,255,0.7)` | Spelarnamn under dot |
| `pitch-ovr` | `#A8E6A8` | OVR-värde under dot |
| `pitch-line` | `rgba(255,255,255,0.15)` | Mittlinje och mittcirkel |

### Interaktiva states

| Namn | Hex | Användning |
|------|-----|------------|
| `active-green` | `#2C7A2C` | Border på aktivt/valt slot |
| `active-green-glow` | `rgba(44,122,44,0.12)` | Box-shadow på aktivt slot |

### Text-TV-panel

| Namn | Hex | Användning |
|------|-----|------------|
| `ttv-bg` | `#0D1B4B` | Panelbakgrund |
| `ttv-border` | `#1A2E6E` | Radseparatorer, rubrikborder |
| `ttv-title` | `#F5C842` | Sidtitel, din rad i tabellen |
| `ttv-meta` | `#7B9FD4` | Sidnummer, kolumnrubriker, omgångsnummer |
| `ttv-body` | `#C5D8F5` | Vanliga rader i tabellen |
| `ttv-alt` | `#D8E4F5` | Alternativa rader (varannan) |
| `ttv-win` | `#7DE87D` | Vinstresultat |
| `ttv-loss` | `#E87D7D` | Förlustresultat |
| `ttv-draw` | `#F5C842` | Oavgjort |

---

## Typografi

### Applikationsdelen

Teckensnitt: **system-ui / sans-serif** (matchar plattformens egna font).

| Användning | Storlek | Vikt |
|------------|---------|------|
| Navbar logotyp | 13–14px | 500 |
| Sidtitel / skärm-header | 13–15px | 500 |
| Spelarnamn i slot | 11–12px | 500 |
| Metadata (klubb, år) | 8–10px | 400 |
| Section labels | 8–9px | 400, uppercase, letter-spacing 0.08–0.1em |
| OVR-värde i slot | 11–13px | 500 |
| OVR-värde i overall-strip | 13–16px | 500 |
| Tomma slots / placeholders | 9–11px | 400 |

### Text-TV-panelen

Teckensnitt: **monospace** (var(--font-mono) / Courier New).

| Användning | Storlek | Färg |
|------------|---------|------|
| Sidtitel (ALLSVENSKAN TABELL) | 7–10px | `ttv-title` |
| Sidnummer / meta | 7–10px | `ttv-meta` |
| Kolumnrubriker | 6.5–9px | `ttv-meta`, uppercase |
| Tabellvärden | 7.5–10px | `ttv-body` |
| Din rad | 7.5–10px | `ttv-title` |

All text i text-TV-panelen är versaler eller uppercase via CSS.

---

## Komponenter

### Navbar

```
[Logo]  [BADGE]                    [Draft] [Formation] [Säsong] [Tabell]
```

- Bakgrund: `chrome-bg`
- Logo: 13px, 500, `chrome-text`
- Badge (PEAK MODE / SEASON): pill-form, `badge-yellow` bg, `ink` text, 8px
- Nav-länkar: 10–11px, `chrome-muted` inaktiv, `chrome-text` + `badge-yellow` underline aktiv
- Höjd: ~34px desktop, ~30px mobil

### Page tabs (desktop)

Rad under navbar med text-tabs och `ink`-underline på aktiv flik.
Bakgrund: `sand-bg`. Border-bottom: `sand-border`.

### Draft-slot

```
[POS]  Spelarnamn          OVR
       Klubb · År
```

- Höjd: ~34px desktop, ~30px mobil
- Border: `sand-border` (tom), `ink` (ifylld), `active-green` 1.5px (aktiv/föreslagen)
- Position-badge: `sand-surface` bg + `ink-muted` text (tom), `ink` bg + `chrome-text` (ifylld)
- Rundade hörn: 5–6px
- Bakgrund: `sand-white`

### Reroll-rad

Tre prickar (●) + label + höger-justerat mode/knapp.
Fyllda prickar: `ink`. Använda: `sand-border`.

### Formationsplan

Grön rektangel med rundade hörn (8px). Innehåller:
- Mittlinje (horisontell) + mittcirkel via `::before` / `::after`
- Spelar-dots: 22–28px diameter, rundade, med position-label inuti
- Spelarnamn och OVR under varje dot
- Tomma slots: 40% opacity

### Overall-strip

4-kolumns grid under planen.
- Overall-cell: `ink` bg, `badge-yellow` siffra
- Övriga celler: `sand-surface` bg, `ink` siffra
- Label: 7–8px uppercase, `ink-ghost`
- Värde: 13–16px, 500

### Text-TV-panel (semi-modern)

Mörkblå kort med monospace-font. Rundade hörn (5–6px).
Header: `ttv-title` text till vänster, `ttv-meta` till höger.
Separerad från innehållet med `ttv-border` bottom-border.
Tabell: kolumnrubriker i `ttv-meta`, vanliga rader `ttv-body`, din rad `ttv-title`.

### Matchresultat-panel

Samma mörka kort som text-TV-tabellen.
Varje rad: omgångsnummer | hemmalag | resultat | bortalag.
Din rad gul (`ttv-title`), vinst grön (`ttv-win`), förlust röd (`ttv-loss`).

---

## Layout

### Desktop

```
┌─────────────────────────────────────────────┐
│ Navbar                                       │
├─────────────────────────────────────────────┤
│ Page tabs                                    │
├──────────────────────┬──────────────────────┤
│ Draft-lista          │ Formationsplan        │
│ (spelarslots)        │ + Overall-strip       │
├──────────────────────┴──────────────────────┤
│ Text-TV: Tabell  │  Text-TV: Resultat        │
└─────────────────────────────────────────────┘
```

Padding: 14–18px horisontellt. Gap mellan kolumner: 10–12px.

### Mobil

```
┌─────────────────┐
│ Navbar          │
├─────────────────┤
│ Screen header   │
├─────────────────┤
│                 │
│ Aktivt skärm    │
│ (draft /        │
│  formation /    │
│  säsong)        │
│                 │
├─────────────────┤
│ [Draft][Form][S]│  ← Tab-bar
└─────────────────┘
```

Tab-bar: `chrome-bg`, aktiv flik `badge-yellow` ikon + label.
Padding: 10–14px horisontellt.

---

## Designprinciper

1. **Kontrast som navigation.** Mörkblå text-TV-paneler mot beige bas gör att
   spelaren direkt förstår vad som är "data" vs "interface".

2. **Gult som signal.** `badge-yellow` (#F5C842) används enbart för aktiva/viktiga
   states: aktiv nav-länk, aktiv mobilflik, din rad i tabellen, mode-badge.
   Aldrig som dekorativ färg.

3. **Monospace är reserverat.** Monospace-font används uteslutande i text-TV-sektionerna.
   Resten av sidan kör sans-serif. Blandar man dem tappar retro-kontrasten.

4. **OVR-värden syns alltid.** Oavsett var en spelare visas (slot, plan, tabell)
   ska OVR vara synlig och i 500-vikt. Det är spelets primära informationsenhet.

5. **Tomma slots är inte fel.** Halvfylld formation är ett normalt state. Tomma dots
   på planen är transparenta men synliga, inte dolda.

6. **Responsivt via stapling, inte krympning.** På mobil staplas kolumner vertikalt
   och navigation flyttas till bottom tab-bar. Komponenterna skalar inte ner,
   de omorganiseras.

---

## Sidor / vyer

| Vy | Desktop-layout | Mobil-tab |
|----|---------------|-----------|
| Draft | 2 kolumner: lista + plan | Draft-tab |
| Formation | 2 kolumner: plan stor + slots | Formation-tab |
| Säsong (pågående) | 2 kolumner: tabell + resultat | Säsong-tab |
| Slutresultat | Fullbredd text-TV tabell | Säsong-tab |

---

## Vad som medvetet utelämnats

- Inga gradienter, skuggor eller blur-effekter
- Inga animationer i första version (lägg till som förbättring)
- Ingen dark mode (text-TV-sektionerna är redan mörka, kontrasten fungerar i light mode)
- Inga klubblogotyper eller bilder (ren typografi och data)