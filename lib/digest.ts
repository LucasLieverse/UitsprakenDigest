import { put, head } from '@vercel/blob';
import { fetchRechtspraak } from '@/lib/rechtspraak';
import { fetchTuchtrecht } from '@/lib/tuchtrecht';
import { processItems } from '@/lib/claude';
import { DigestResponse, Les, LessenStore } from '@/types';

const BLOB_DIGEST = 'uitspraken-digest/latest.json';
const BLOB_LESSEN = 'uitspraken-digest/lessen.json';

async function readBlob<T>(key: string): Promise<T | null> {
  const meta = await head(key).catch(() => null);
  if (!meta) return null;
  const res = await fetch(meta.downloadUrl, { cache: 'no-store' });
  return res.json() as Promise<T>;
}

async function writeBlob(key: string, data: unknown) {
  await put(key, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readDigest(): Promise<{ digest: DigestResponse | null; lessenStore: LessenStore | null }> {
  const [digest, lessenStore] = await Promise.all([
    readBlob<DigestResponse>(BLOB_DIGEST),
    readBlob<LessenStore>(BLOB_LESSEN),
  ]);
  return { digest, lessenStore };
}

export async function runDigest(): Promise<DigestResponse> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 14);

  const dateFrom = weekAgo.toISOString().split('T')[0];
  const dateTo = now.toISOString().split('T')[0];

  const [rechtspraakItems, tuchbrechtItems] = await Promise.all([
    fetchRechtspraak(dateFrom, dateTo),
    fetchTuchtrecht(dateFrom),
  ]);

  const seen = new Set<string>();
  const allRaw = [...rechtspraakItems, ...tuchbrechtItems].filter(item => {
    const id = item.bron === 'rechtspraak' ? item.ecli : item.identifier;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  console.log(`Opgehaald: ${rechtspraakItems.length} rechtspraak, ${tuchbrechtItems.length} tuchtrecht (${allRaw.length} uniek)`);

  const items = await processItems(allRaw);

  const seenIds = new Set<string>();
  const uniqueItems = items.filter(item => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  uniqueItems.sort((a, b) => {
    const da = new Date(a.datum).getTime();
    const db = new Date(b.datum).getTime();
    return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
  });

  const nieuweLessen: Les[] = uniqueItems.map(item => ({
    tekst: item.les,
    categorie: item.categorie,
    bronnen: [{ id: item.id, headline: item.headline, datum: item.datum, url: item.url }],
  }));

  const bestaandeStore = await readBlob<LessenStore>(BLOB_LESSEN);
  const bestaandeLessen = bestaandeStore?.lessen ?? [];
  const aanvangsDatum = bestaandeStore?.aanvangsDatum ?? now.toISOString();

  const bestaandeEclis = new Set(bestaandeLessen.flatMap(l => l.bronnen.map(b => b.id)));

  const gemergedeLessen = [...bestaandeLessen];
  for (const nieuw of nieuweLessen) {
    const nieuwId = nieuw.bronnen[0]?.id;
    if (nieuwId && bestaandeEclis.has(nieuwId)) continue;
    gemergedeLessen.push(nieuw);
    if (nieuwId) bestaandeEclis.add(nieuwId);
  }

  const lessenStore: LessenStore = {
    aanvangsDatum,
    bijgewerkt: now.toISOString(),
    lessen: gemergedeLessen,
  };

  const response: DigestResponse = {
    items: uniqueItems,
    lessen: gemergedeLessen,
    lessenAanvangsDatum: aanvangsDatum,
    ophaalDatum: now.toISOString(),
    periodeVan: dateFrom,
    periodeTot: dateTo,
    aantalRuw: allRaw.length,
  };

  await Promise.all([
    writeBlob(BLOB_DIGEST, response),
    writeBlob(BLOB_LESSEN, lessenStore),
  ]);

  return response;
}
