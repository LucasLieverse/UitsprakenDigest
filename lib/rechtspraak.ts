import { RawRechtspraakItem } from '@/types';
import { XMLParser } from 'fast-xml-parser';

// Met return=DOC doet de API echte full-text search. Meerdere termen verbreden de coverage.
const ZOEKTERMEN = ['schikking', 'schikken', 'schikkingsonderhandelingen', 'schikkingsoverleg', 'mediation'];

const ATOM_BASE = 'https://data.rechtspraak.nl/uitspraken/zoeken';
const CONTENT_BASE = 'https://data.rechtspraak.nl/uitspraken/content';

interface AtomEntry {
  id?: string;
  title?: string | { '#text': string };
  summary?: string | { '#text': string };
  updated?: string;
  link?: { '@_href': string; '@_rel'?: string } | Array<{ '@_href': string; '@_rel'?: string }>;
}

function str(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '#text' in v) return String((v as Record<string, unknown>)['#text']);
  return String(v);
}

function entryUrl(link: AtomEntry['link']): string {
  if (!link) return '';
  const arr = Array.isArray(link) ? link : [link];
  const alt = arr.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate');
  return alt?.['@_href'] ?? '';
}

// Title format: "ECLI:NL:X:2025:1, Instantienaam, DD-MM-YYYY, zaaknr"
function parseTitel(raw: string): { instantie: string; datum: string } {
  const parts = raw.split(', ');
  const instantie = parts[1] ?? '';
  const datumRaw = parts[2] ?? '';
  const match = datumRaw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const datum = match ? `${match[3]}-${match[2]}-${match[1]}` : datumRaw;
  return { instantie, datum };
}

// Matches settlement keywords that cannot appear inside "beschikking" or "beschikken".
// Using negative lookbehind so "beschikking" doesn't trigger a match.
// Matches settlement-keywords. Negative lookbehind op (?<![a-z]) voorkomt valse hits op
// "beschikking/beschikken". Alleen dubbele-k vormen worden gematched; enkele-k werkwoordsvormen
// (schikt, schikte) zijn niet te onderscheiden van "geschikt" zonder context.
const SETTLEMENT_RE = /(?<![a-z])schikking|schikkings|(?<![a-z])schikken|(?<![a-z])minnelijk|vaststellingsovereenkomst|finale\s+kwijting|settlement|mediation|afbreken\s+(?:van\s+)?onderhandeling/i;

function heeftSettlementKeyword(tekst: string): boolean {
  return SETTLEMENT_RE.test(tekst);
}

// Fetch full uitspraak text and extract the most relevant passages.
// Returns intro (first 1500 chars) + context around schikking keywords (up to 2000 chars).
async function fetchVolledigeTekst(ecli: string): Promise<string> {
  try {
    const response = await fetch(`${CONTENT_BASE}?id=${encodeURIComponent(ecli)}`);
    if (!response.ok) return '';
    const xml = await response.text();

    const bodyMatch = xml.match(/<(?:uitspraak|conclusie)[^>]*>([\s\S]*?)<\/(?:uitspraak|conclusie)>/i);
    if (!bodyMatch) return '';

    const tekst = bodyMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const intro = tekst.slice(0, 1500);

    // Extract windows around schikking-related keywords
    const keywords = /schikk|minnelijk|vaststellingsovereenkomst|finale kwijting/gi;
    const snippets: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = keywords.exec(tekst)) !== null && snippets.join('').length < 2000) {
      const start = Math.max(0, match.index - 200);
      const end = Math.min(tekst.length, match.index + 400);
      snippets.push(tekst.slice(start, end));
    }

    const contextBlok = snippets.length > 0
      ? '\n\n[...relevante passages...]\n' + snippets.join('\n[...]\n')
      : '';

    return (intro + contextBlok).slice(0, 5000);
  } catch {
    return '';
  }
}

export async function fetchRechtspraak(
  dateFrom: string,
  _dateTo: string
): Promise<RawRechtspraakItem[]> {
  const seen = new Set<string>();
  const results: RawRechtspraakItem[] = [];
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'entry',
  });

  // Collect ATOM hits first (fast), then enrich with full text in parallel
  const candidates: Array<{ ecli: string; titel: string; instantie: string; datum: string; url: string; atomSamenvatting: string }> = [];

  for (const zoekterm of ZOEKTERMEN) {
    const url = `${ATOM_BASE}?free=${encodeURIComponent(zoekterm)}&return=DOC&max=50&date=${dateFrom}&subject=http://psi.rechtspraak.nl/rechtsgebied%23civielRecht`;

    let xml: string;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Rechtspraak.nl HTTP ${response.status} voor "${zoekterm}"`);
        continue;
      }
      xml = await response.text();
    } catch (err) {
      console.error(`Rechtspraak.nl fetch fout voor "${zoekterm}":`, err);
      continue;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parser.parse(xml);
    } catch (err) {
      console.error(`Rechtspraak.nl XML parse fout voor "${zoekterm}":`, err);
      continue;
    }

    const feed = parsed?.feed as Record<string, unknown>;
    const entries = (feed?.entry ?? []) as AtomEntry[];

    for (const entry of entries) {
      const ecli = str(entry.id);
      if (!ecli || seen.has(ecli)) continue;
      seen.add(ecli);

      const titelRaw = str(entry.title);
      const { instantie, datum } = parseTitel(titelRaw);

      candidates.push({
        ecli,
        titel: titelRaw,
        instantie,
        datum,
        atomSamenvatting: str(entry.summary),
        url: entryUrl(entry.link) || `https://uitspraken.rechtspraak.nl/details?id=${encodeURIComponent(ecli)}`,
      });
    }
  }

  // Fetch full text for all candidates in parallel (max 20 concurrent)
  const CHUNK = 20;
  for (let i = 0; i < candidates.length; i += CHUNK) {
    const chunk = candidates.slice(i, i + CHUNK);
    const teksten = await Promise.all(chunk.map((c) => fetchVolledigeTekst(c.ecli)));

    for (let j = 0; j < chunk.length; j++) {
      const c = chunk[j];
      const volledigeTekst = teksten[j];
      const tekst = volledigeTekst || c.atomSamenvatting;
      // Drop items where the full text only contains "beschikking/beschikken" — not actual settlement content
      if (!heeftSettlementKeyword(tekst)) {
        console.log(`Skip (geen settlement-keyword): ${c.ecli}`);
        continue;
      }
      results.push({
        ecli: c.ecli,
        titel: c.titel,
        instantie: c.instantie,
        datum: c.datum,
        samenvatting: tekst,
        url: c.url,
        bron: 'rechtspraak',
      });
    }
  }

  console.log(`Rechtspraak: ${candidates.length} kandidaten → ${results.length} met settlement-keyword`);
  return results;
}
