import { NextRequest, NextResponse } from 'next/server';
import { UKRPOSHTA_CITIES } from '../../../../../data/ukrposhta-cities';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase().trim();

  let cities: readonly string[] = UKRPOSHTA_CITIES;

  if (search && search.length >= 2) {
    cities = UKRPOSHTA_CITIES.filter((c) =>
      c.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(
    { success: true, data: [...cities].slice(0, 50) },
    { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' } }
  );
}
