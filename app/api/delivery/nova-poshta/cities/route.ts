import { NextRequest, NextResponse } from 'next/server';

const NOVA_POSHTA_API = 'https://api.novaposhta.ua/v2.0/json/';

export async function POST(req: NextRequest) {
  try {
    const { search } = await req.json();
    const apiKey = process.env.NOVA_POSHTA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'NOVA_POSHTA_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = search
      ? {
          apiKey,
          modelName: 'Address',
          calledMethod: 'searchSettlements',
          methodProperties: { CityName: search, Limit: 50 },
        }
      : {
          apiKey,
          modelName: 'Address',
          calledMethod: 'getCities',
          methodProperties: { Limit: 100 },
        };

    const endpoint = search ? 'Address/searchSettlements' : 'Address/getCities';
    const res = await fetch(`${NOVA_POSHTA_API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.errors?.join(', ') || 'Nova Poshta API error' },
        { status: 400 }
      );
    }

    let cities: { ref: string; name: string; area?: string }[] = [];

    if (search && Array.isArray(data.data)) {
      const seen = new Set<string>();
      for (const item of data.data) {
        for (const a of item.Addresses || []) {
          const ref = a.DeliveryCity || a.Ref;
          if (!seen.has(ref)) {
            seen.add(ref);
            cities.push({
              ref,
              name: a.Present || a.Ref,
              area: a.Area,
            });
          }
        }
      }
    } else {
      cities = (data.data || []).map((c: { Ref: string; Description: string; AreaDescription?: string }) => ({
        ref: c.Ref,
        name: c.Description,
        area: c.AreaDescription,
      }));
    }

    return NextResponse.json({ success: true, data: cities });
  } catch (error) {
    console.error('Nova Poshta cities error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
