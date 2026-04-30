/**
 * fetch-news.mjs
 * Holt täglich KI-News via Perplexity Sonar API und schreibt sie in src/data/news.json
 * Aufruf: bun scripts/fetch-news.mjs
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_FILE = join(__dirname, '../src/data/news.json');
const MAX_ENTRIES = 90;

const today = new Date().toISOString().split('T')[0];
const dateDE = new Date().toLocaleDateString('de-DE', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ── Guards ────────────────────────────────────────────────────
const apiKey = process.env.PERPLEXITY_API_KEY;
if (!apiKey) {
  console.error('❌ PERPLEXITY_API_KEY nicht gesetzt');
  process.exit(1);
}

const existing = JSON.parse(readFileSync(NEWS_FILE, 'utf8'));
if (existing.entries.find(e => e.id === today)) {
  console.log(`✓ Eintrag für ${today} existiert bereits — übersprungen.`);
  process.exit(0);
}

// ── API Call ──────────────────────────────────────────────────
console.log(`📡 Lade KI-News für ${dateDE}…`);

const systemPrompt = `Du bist ein präziser KI-News-Redakteur für ein deutsches KI-Tools-Verzeichnis.
Du antwortest AUSSCHLIESSLICH mit validem JSON — kein Text davor/danach, kein Markdown, keine Erklärungen.
Recherchiere aktuelle Ereignisse der letzten 24–48 Stunden.`;

const userPrompt = `Erstelle einen deutschen KI-News-Eintrag für ${dateDE}.
Recherchiere 4–5 der wichtigsten KI-Neuigkeiten: neue Modelle, Tool-Releases, Funding-Runden, Forschungsergebnisse, wichtige Ankündigungen.

Antworte NUR mit diesem JSON (exakt dieses Format, keine weiteren Zeichen):
{
  "title": "KI-News · ${today}",
  "intro": "1–2 Sätze die das Wichtigste des Tages zusammenfassen",
  "highlights": [
    {
      "title": "Prägnante Schlagzeile (max. 10 Wörter)",
      "body": "2–3 Sätze Erklärung auf Deutsch — konkret, ohne Marketing-Sprache",
      "tag": "Firmenname oder Thema (z.B. OpenAI, Google, Forschung)",
      "type": "Release"
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Erlaubte 'type'-Werte: Release, Ankündigung, Forschung, Funding, Vorschau, Update`;

let entry;
try {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices[0].message.content.trim();

  // JSON parsen — Markdown-Codeblöcke entfernen falls vorhanden
  try {
    entry = JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    if (!match) throw new Error('Kein JSON im Response gefunden');
    entry = JSON.parse(match[1]);
  }

} catch (err) {
  console.error(`❌ Fehler beim Laden der News: ${err.message}`);
  process.exit(1);
}

// ── Daten speichern ───────────────────────────────────────────
entry.id = today;
entry.date = today;
entry.generated_by = 'perplexity/sonar';

existing.entries.unshift(entry);

// Maximal MAX_ENTRIES behalten
if (existing.entries.length > MAX_ENTRIES) {
  existing.entries = existing.entries.slice(0, MAX_ENTRIES);
}

writeFileSync(NEWS_FILE, JSON.stringify(existing, null, 2));
console.log(`✅ News-Eintrag hinzugefügt: "${entry.title}"`);
console.log(`   Highlights: ${entry.highlights.length} | Gesamt: ${existing.entries.length} Einträge`);
