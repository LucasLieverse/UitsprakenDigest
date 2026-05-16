import { RawTuchbrechtItem } from '@/types';
import { XMLParser } from 'fast-xml-parser';

const ZOEKTERMEN = [
  'schikking',
  'schikken',
  'schikkingsvoorstel',
  'schikkingsonderhandelingen',
  'schikkingsoverleg',
  'onderhandelingen',
  'minnelijke regeling',
  'vaststellingsovereenkomst',
  'mediation',
];
const SRU_ENDPOINT = 'https://repository.overheid.nl/sru';

export async function fetchTuchtrecht(dateFrom: string): Promise<RawTuchbrechtItem[]> {
  const seen = new Set<string>();
  const results: RawTuchbrechtItem[] = [];
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    isArray: (name) => name === 'record',
  });

  for (const zoekterm of ZOEKTERMEN) {
    const query = `(c.product-area==tuchtrecht AND cql.textAndIndexes="${zoekterm}" AND dt.modified>=${dateFrom})`;
    const url = `${SRU_ENDPOINT}?query=${encodeURIComponent(query)}&maximumRecords=10&sortBy=dt.modified/sort.descending`;

    let xml: string;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Tuchtrecht HTTP ${response.status} voor "${zoekterm}"`);
        continue;
      }
      xml = await response.text();
    } catch (err) {
      console.error(`Tuchtrecht fetch fout voor "${zoekterm}":`, err);
      continue;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parser.parse(xml);
    } catch (err) {
      console.error(`Tuchtrecht XML parse fout voor "${zoekterm}":`, err);
      continue;
    }

    // Path (after removeNSPrefix):
    // searchRetrieveResponse > records > record[] > recordData > gzd > originalData > meta
    //   meta > owmskern: identifier, title, creator, modified
    //   meta > owmsmantel: description, available
    //   meta > tpmeta: uitspraakdatum
    // recordData > gzd > enrichedData > url  (document link)

    const root = (parsed as Record<string, unknown>)?.searchRetrieveResponse as Record<string, unknown>;
    const recordArr = ((root?.records as Record<string, unknown>)?.record ?? []) as unknown[];

    for (const rec of recordArr) {
      const recordData = (rec as Record<string, unknown>)?.recordData as Record<string, unknown>;
      const gzd = recordData?.gzd as Record<string, unknown>;
      const originalData = gzd?.originalData as Record<string, unknown>;
      const meta = originalData?.meta as Record<string, unknown>;
      if (!meta) continue;

      const owmskern = meta.owmskern as Record<string, unknown>;
      const owmsmantel = meta.owmsmantel as Record<string, unknown>;
      const tpmeta = meta.tpmeta as Record<string, unknown>;

      const identifier = String(owmskern?.identifier ?? '');
      if (!identifier || seen.has(identifier)) continue;
      seen.add(identifier);

      const ecliSlug = identifier.replace(/:/g, '_');
      const docUrl = `https://tuchtrecht.overheid.nl/${ecliSlug}`;

      results.push({
        identifier,
        titel: String(owmskern?.title ?? ''),
        instantie: String(owmskern?.creator ?? '').trim(),
        datum: String(tpmeta?.uitspraakdatum ?? owmskern?.modified ?? ''),
        tekst: String(owmsmantel?.description ?? ''),
        url: docUrl,
        bron: 'tuchtrecht',
      });
    }
  }

  return results;
}
