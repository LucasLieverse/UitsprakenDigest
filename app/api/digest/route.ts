import { NextRequest, NextResponse } from 'next/server';
import { readDigest, runDigest } from '@/lib/digest';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { digest, lessenStore } = await readDigest();
    if (!digest) {
      return NextResponse.json({ items: [], lessen: [], ophaalDatum: null, periodeVan: null, periodeTot: null, aantalRuw: 0 });
    }
    return NextResponse.json(
      { ...digest, lessen: lessenStore?.lessen ?? [], lessenAanvangsDatum: lessenStore?.aanvangsDatum },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('GET digest fout:', error);
    return NextResponse.json({ fout: 'Ophalen mislukt', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.DIGEST_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ fout: 'Niet geautoriseerd.' }, { status: 401 });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dateFrom = typeof body.dateFrom === 'string' ? body.dateFrom : undefined;
    const response = await runDigest(dateFrom);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Digest fout:', error);
    return NextResponse.json({ fout: 'Ophalen mislukt', details: String(error) }, { status: 500 });
  }
}
