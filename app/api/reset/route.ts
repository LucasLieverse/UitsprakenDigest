import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const maxDuration = 30;

const BLOB_DIGEST = 'schikking-digest/latest.json';
const BLOB_LESSEN = 'schikking-digest/lessen.json';
const OPTS = { access: 'public' as const, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true };

export async function POST(req: NextRequest) {
  const secret = process.env.DIGEST_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ fout: 'Niet geautoriseerd.' }, { status: 401 });
    }
  }

  const leegDigest = { items: [], lessen: [], ophaalDatum: null, periodeVan: null, periodeTot: null, aantalRuw: 0 };
  const leegLessen = { aanvangsDatum: null, bijgewerkt: null, lessen: [] };

  await Promise.all([
    put(BLOB_DIGEST, JSON.stringify(leegDigest), OPTS),
    put(BLOB_LESSEN, JSON.stringify(leegLessen), OPTS),
  ]);

  return NextResponse.json({ ok: true });
}
