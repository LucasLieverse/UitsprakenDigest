import Anthropic from '@anthropic-ai/sdk';
import { DigestItem, Les, RawItem } from '@/types';

const client = new Anthropic();

const SYSTEM_PROMPT = `Je bent een juridisch redacteur gespecialiseerd in het Nederlandse civiele recht en advocatentuchtrecht.
Je beoordeelt uitspraken strikt op inhoudelijke relevantie voor schikken en minnelijke regelingen, en schrijft bondige samenvattingen voor een drukke advocaat.

Relevantiecriteria (uitspraak is alleen relevant als minimaal één criterium geldt):
- Schikken en/of onderhandelen om een juridisch geschil (geheel of gedeeltelijk) op te lossen is een centraal thema (niet slechts een zijdelingse vermelding)
- Rechter doet uitspraak over de rechtsgeldigheid, totstandkoming of gevolgen van een schikking (of minnelijke regeling)
- Advocaat wordt tuchtrechtelijk aangesproken op zijn rol in een schikkingsproces
- Gedrag rond schikkingsonderhandelingen of vaststellingsovereenkomst is kern van het geschil
- Uitspraak bevat een duidelijke les over schikken of onderhandelen die een advocaat iets bruikbaars leert, ook als dat niet het enige of meest relevante thema is

Schrijfregels voor de samenvattingsvelden:
- Headline: concreet en actief, benoem wat er speelt niet wie de partijen zijn. Max 8 woorden.
- Feiten: begin met de kern van het geschil. Geen achtergrond die er niet toe doet. Max 2 zinnen.
- Oordeel: uitkomst eerst, dan de grond. Geen juridisch jargon tenzij onvermijdelijk. Max 3 zinnen.
- Relevantie: twee tot vier afzonderlijke zinnen. Eerste zin: de concrete les of het risico, direct geformuleerd vanuit het perspectief van de advocaat-lezer ("Je kunt...", "Als je... dan...", "Een rechter oordeelt..."). Tweede zin: de praktische implicatie, zonder imperatief — gebruik 'het is verstandig om', 'het loont' of vergelijkbaar.

Stijlregels die altijd gelden:
- Laat bij het redigeren zien dat jede hele uitspraak hebt gelezen. Als de tekst te beperkt is voor een goed oordeel, geef dan relevant: false terug.
- Gebruik NOOIT een gedachtestreepje (—), en-dash (–) of koppelteken (-) om zinsdelen aan elkaar te plakken. Maak er altijd twee zinnen van of gebruik een komma. Koppeltekens zijn alleen toegestaan binnen samengestelde woorden (bijvoorbeeld "niet-tijdige").
- Geen opsommingstekens in de veldwaarden.
- Schrijf toegankelijk en direct. Vermijd formeel-juridische zinsconstructies als "Een tuchtrechtelijke aansprakelijkheid veronderstelt dat...". Schrijf liever "Je kunt een advocaat aansprakelijk stellen als...".

Antwoord altijd in het gevraagde JSON-formaat, zonder extra tekst.`;

const SCHIKKING_KEYWORDS = [
  'schikk',       // matches schikking, schikkingsvoorstel, schikkingsonderhandelingen
  'minnelijk',    // matches minnelijke regeling
  'vaststellingsovereenkomst',
  'finale kwijting',
  'afbreken onderhandeling',
  'settlement',
];

function heeftSchikkingKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return SCHIKKING_KEYWORDS.some((kw) => lower.includes(kw));
}

interface ClaudeResult {
  relevant: boolean;
  reden: string;
  headline?: string;
  feiten?: string;
  oordeel?: string;
  relevantie?: string;
  categorie?: string;
}

function korteLes(relevantie: string): string {
  const eerste = relevantie.split(/\.\s+(?=[A-Z])/)[0].trim();
  return eerste.endsWith('.') ? eerste : eerste + '.';
}

export async function processItem(item: RawItem): Promise<DigestItem | null> {
  const id = item.bron === 'rechtspraak' ? item.ecli : item.identifier;
  const titel = item.titel;
  const tekst = item.bron === 'rechtspraak' ? item.samenvatting : item.tekst;

  // Pre-filter: skip if the text is very short AND contains no schikking keyword.
  // Rechtspraak items now carry full document text so this rarely fires.
  const allText = [titel, item.instantie, tekst].join(' ');
  if (tekst.length < 100 && !heeftSchikkingKeyword(allText)) {
    console.log(`Skip (te kort, geen keyword): ${id}`);
    return null;
  }

  const tekstKort = tekst.slice(0, 5000);

  const bronContext =
    item.bron === 'tuchtrecht'
      ? 'Bron: tuchtrecht (advocaten). Relevant als schikking of de rol van de advocaat in een schikkingsproces een significant element is in de klacht of het oordeel — het hoeft niet het enige thema te zijn.'
      : 'Bron: civiel recht. Relevant als de uitspraak een advocaat iets bruikbaars leert over schikkingen, vaststellingsovereenkomsten, minnelijke regelingen, finale kwijting of onderhandelingen — ook als dat één van meerdere thema\'s is. Niet relevant als schikking alleen terloops wordt genoemd zonder dat de rechter er iets inhoudelijk relevants over zegt.';

  const prompt = `Beoordeel deze uitspraak op relevantie voor de schikkingspraktijk.

**Titel:** ${titel || '(geen titel)'}
**Instantie:** ${item.instantie || '(onbekend)'}
**Datum:** ${item.datum || '(onbekend)'}
**Tekst:**
${tekstKort || '(geen tekst beschikbaar)'}

${bronContext}

Antwoord uitsluitend in dit JSON-formaat:
{
  "relevant": true,
  "reden": "één zin: waarom dit de relevantiedrempel haalt",
  "headline": "concreet, actief, max 8 woorden",
  "feiten": "kern van het geschil in max 2 zinnen — begin met wat er fout ging of waar het om draaide",
  "oordeel": "uitkomst eerst, dan de grond, max 2-4 zinnen",
  "relevantie": "twee tot vier zinnen: eerste zin de concrete les of het risico, tweede zin de praktische implicatie. Geen imperatief. Gebruik 'het is verstandig om', 'het loont' of vergelijkbaar.",
  "categorie": "één van: 'Schikkingsadvies' | 'Vaststellingsovereenkomst' | 'Onderhandelingen' | 'Hoedanigheid advocaat' | 'Overig'"
}

Of als niet relevant:
{
  "relevant": false,
  "reden": "één zin"
}`;

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    console.error(`Claude fout voor ${id}:`, err);
    return null;
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const result: ClaudeResult = JSON.parse(jsonMatch[0]);

    console.log(`Claude [${item.bron}] ${id}: relevant=${result.relevant} — ${result.reden}`);

    if (!result.relevant || !result.headline || !result.feiten || !result.oordeel || !result.relevantie) return null;
    const les = korteLes(result.relevantie!);
    const CATEGORIEEN = ['Schikkingsadvies', 'Vaststellingsovereenkomst', 'Onderhandelingen', 'Hoedanigheid advocaat', 'Overig'] as const;
    type Cat = typeof CATEGORIEEN[number];
    const categorie: Cat = CATEGORIEEN.includes(result.categorie as Cat) ? (result.categorie as Cat) : 'Overig';

    return {
      id,
      titel,
      headline: result.headline,
      instantie: item.instantie,
      datum: item.datum,
      feiten: result.feiten,
      oordeel: result.oordeel,
      relevantie: result.relevantie,
      les,
      categorie,
      url: item.url,
      bron: item.bron,
    };
  } catch (err) {
    console.error(`Claude JSON parse fout voor ${id}:`, err);
    return null;
  }
}

export async function mergeLessen(bestaand: Les[], nieuw: Les[]): Promise<Les[]> {
  if (nieuw.length === 0) return bestaand;

  const prompt = `Je krijgt twee lijsten lessen over de schikkingspraktijk van advocaten.
Merge lessen die inhoudelijk hetzelfde zeggen, ook als de formulering verschilt.
Gebruik bij een merge de bestaande formulering tenzij de nieuwe duidelijk beter is.
Voeg bij een merge alle bronnen samen (geen duplicaten op basis van id).
Voeg nieuwe lessen zonder equivalent gewoon toe aan de lijst.
Retourneer uitsluitend een JSON-array in dit formaat, geen extra tekst:
[{ "tekst": "...", "bronnen": [{ "id": "...", "headline": "...", "datum": "...", "url": "..." }] }]

Bestaande lessen:
${JSON.stringify(bestaand, null, 2)}

Nieuwe lessen:
${JSON.stringify(nieuw, null, 2)}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [...bestaand, ...nieuw];
    return JSON.parse(match[0]) as Les[];
  } catch (err) {
    console.error('Lessen merge fout:', err);
    return [...bestaand, ...nieuw];
  }
}

// Run all items through Claude in parallel — Anthropic's API handles the concurrency,
// and on Vercel Hobby every saved second matters (60s function ceiling).
export async function processItems(items: RawItem[]): Promise<DigestItem[]> {
  const settled = await Promise.all(items.map(processItem));
  return settled.filter((r): r is DigestItem => r !== null);
}
