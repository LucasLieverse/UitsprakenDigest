import { NextRequest, NextResponse } from 'next/server';
import { runDigest } from '@/lib/digest';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel cron jobs zenden Authorization: Bearer <CRON_SECRET> mee zodra die env var is gezet.
  // Buiten Vercel (handmatig aanroepen) werkt deze route niet zonder dezelfde header.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ fout: 'CRON_SECRET niet geconfigureerd.' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ fout: 'Niet geautoriseerd.' }, { status: 401 });
  }

  try {
    const response = await runDigest();
    console.log(`Cron-digest klaar: ${response.items.length} items, ${response.lessen.length} lessen totaal.`);
    return NextResponse.json({ ok: true, aantal: response.items.length });
  } catch (error) {
    console.error('Cron digest fout:', error);
    return NextResponse.json({ fout: 'Cron-run mislukt', details: String(error) }, { status: 500 });
  }
}
