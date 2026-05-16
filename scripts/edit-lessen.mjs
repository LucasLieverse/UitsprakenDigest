/**
 * Gebruik:
 *   node scripts/edit-lessen.mjs download      → sla lessen.json op in ./tmp/lessen.json
 *   node scripts/edit-lessen.mjs upload         → upload ./tmp/lessen.json terug naar de blob
 *   node scripts/edit-lessen.mjs deduplicate    → verwijder dubbele ECLIs uit de blob
 *   node scripts/edit-lessen.mjs reset          → wis alle lessen (schone lei)
 */

import { put, head, del } from '@vercel/blob';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// Lees BLOB_READ_WRITE_TOKEN uit .env.local zonder dotenv
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key?.trim() && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const BLOB_KEY = 'schikking-digest/lessen.json';
const LOCAL_PATH = './tmp/lessen.json';
const command = process.argv[2];

async function download() {
  const meta = await head(BLOB_KEY).catch(() => null);
  if (!meta) { console.log('Geen lessen.json gevonden in de blob.'); process.exit(1); }
  const res = await fetch(meta.downloadUrl);
  const json = await res.text();
  mkdirSync('./tmp', { recursive: true });
  writeFileSync(LOCAL_PATH, JSON.stringify(JSON.parse(json), null, 2), 'utf8');
  console.log(`Opgeslagen in ${LOCAL_PATH}`);
  return JSON.parse(json);
}

if (command === 'download') {
  await download();
  console.log('Bewerk het bestand en run daarna: node scripts/edit-lessen.mjs upload');

} else if (command === 'upload') {
  const json = readFileSync(LOCAL_PATH, 'utf8');
  JSON.parse(json); // valideer JSON
  await put(BLOB_KEY, json, { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
  console.log('Geüpload naar de blob.');

} else if (command === 'deduplicate') {
  const store = await download();
  const gedeup = [];
  const gezieneEclis = new Set();
  for (const les of store.lessen) {
    const nieuweIds = les.bronnen.map(b => b.id).filter(id => !gezieneEclis.has(id));
    if (nieuweIds.length === 0) continue;
    nieuweIds.forEach(id => gezieneEclis.add(id));
    gedeup.push({ ...les, bronnen: les.bronnen.filter(b => nieuweIds.includes(b.id)) });
  }
  console.log(`Voor: ${store.lessen.length} lessen → na: ${gedeup.length} lessen`);
  store.lessen = gedeup;
  await put(BLOB_KEY, JSON.stringify(store), { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
  console.log('Klaar.');

} else if (command === 'reset') {
  const DIGEST_KEY = 'schikking-digest/latest.json';
  const leegDigest = { items: [], lessen: [], ophaalDatum: null, periodeVan: null, periodeTot: null, aantalRuw: 0 };
  const leegLessen = { aanvangsDatum: null, bijgewerkt: null, lessen: [] };
  const opts = { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true };
  await Promise.all([
    put(DIGEST_KEY, JSON.stringify(leegDigest), opts),
    put(BLOB_KEY,   JSON.stringify(leegLessen), opts),
  ]);
  console.log('Database leeggemaakt. De volgende digest-run bouwt alles opnieuw op.');

} else {
  console.log('Gebruik: node scripts/edit-lessen.mjs download|upload|deduplicate|reset');
}
