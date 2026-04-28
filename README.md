# AI Tools Directory

Ein kuratiertes, ehrliches Verzeichnis der besten KI-Tools — mit echten Stärken UND Schwächen. Stand: April 2026.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/ai-tools-directory)

## Features

- 40 Tools in 8 Kategorien
- Client-seitige Suche ohne Page-Reload
- Kategorie-Filter
- Dark Mode (Standard)
- Vollständig statisch — kein Backend, keine DB

## Lokales Setup

```bash
bun install
bun run dev
```

Öffne `http://localhost:4321`

## Neues Tool hinzufügen

1. Öffne die passende JSON-Datei unter `src/data/categories/`
2. Füge ein Objekt im `tools`-Array hinzu:

```json
{
  "id": "eindeutige-id",
  "name": "Tool Name",
  "tagline": "Kurze Beschreibung",
  "description": "Längere Beschreibung mit aktuellen Infos.",
  "logo_url": "https://logo.clearbit.com/domain.com",
  "website": "https://example.com",
  "strengths": ["Stärke 1", "Stärke 2", "Stärke 3"],
  "weaknesses": ["Schwäche 1", "Schwäche 2"],
  "pricing": {
    "model": "freemium",
    "free_tier": true,
    "starting_price": 20,
    "currency": "USD",
    "price_note": "Pro $20/Mo"
  },
  "tags": ["Tag1", "Tag2"],
  "is_open_source": false,
  "editor_pick": false,
  "last_updated": "2026-04"
}
```

Pricing-Modelle: `free` | `freemium` | `paid` | `enterprise`

## Build & Deploy

```bash
bun run build     # Statischen Build erstellen
bun run preview   # Build lokal testen
```

Vercel: Repository verbinden, Framework wird automatisch erkannt (`vercel.json` liegt bei).
