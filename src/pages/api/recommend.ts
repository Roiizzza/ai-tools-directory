export const prerender = false;

import type { APIRoute } from 'astro';

const categoryModules = import.meta.glob('../../data/categories/*.json', { eager: true });

export const POST: APIRoute = async ({ request }) => {
  const { idea, preferFree } = await request.json();

  const tools: any[] = [];
  for (const mod of Object.values(categoryModules) as any[]) {
    for (const t of mod.tools) {
      tools.push({
        name: t.name,
        tagline: t.tagline,
        tags: t.tags,
        free: t.pricing?.free_tier ?? false,
        priceModel: t.pricing?.model ?? '',
        priceNote: t.pricing?.price_note ?? '',
        category: mod.category.name,
      });
    }
  }

  const toolsList = tools
    .map(t =>
      `- ${t.name} (${t.category}): ${t.tagline} | Tags: ${t.tags.join(', ')} | ${t.free ? '✓ KOSTENLOS' : t.priceModel}${t.priceNote ? ' – ' + t.priceNote : ''}`
    )
    .join('\n');

  const systemPrompt = `Du bist ein erfahrener KI-Tool-Berater. Empfehle passende Tools aus unserem Verzeichnis für die Idee des Nutzers.

VERFÜGBARE TOOLS:
${toolsList}

${preferFree ? '⚠️ Der Nutzer bevorzugt KOSTENLOSE Tools. Empfehle bevorzugt Tools mit "✓ KOSTENLOS". Erwähne bei kostenpflichtigen Tools immer den Preis.' : ''}

ANWEISUNGEN:
- Antworte auf Deutsch
- Analysiere die Idee kurz (1-2 Sätze)
- Empfehle 3-5 passende Tools aus der obigen Liste, erkläre konkret WARUM
- Beschreibe wie die Tools zusammenarbeiten könnten
- Schreibe am Ende: "Starte mit: [Tool-Name]" als klare Empfehlung
- Nutze **Tool-Name** für Fettschrift
- Sei konkret und praktisch, kein Marketing-Sprech`;

  const apiKey = import.meta.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return new Response('API-Key fehlt', { status: 500 });
  }

  let nvidiaRes: Response;
  try {
    nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Meine Idee: ${idea}` },
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });
  } catch (e: any) {
    return new Response(e.message, { status: 502 });
  }

  if (!nvidiaRes.ok) {
    const err = await nvidiaRes.text();
    return new Response(err, { status: nvidiaRes.status });
  }

  return new Response(nvidiaRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
};
