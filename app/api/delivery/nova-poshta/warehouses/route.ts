import { NextRequest, NextResponse } from 'next/server';

const NOVA_POSHTA_API = 'https://api.novaposhta.ua/v2.0/json/';

export async function POST(req: NextRequest) {
  try {
    const { cityRef } = await req.json();
    const apiKey = process.env.NOVA_POSHTA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'NOVA_POSHTA_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!cityRef) {
      return NextResponse.json(
        { success: false, error: 'cityRef is required' },
        { status: 400 }
      );
    }

    const body = {
      apiKey,
      modelName: 'AddressGeneral',
      calledMethod: 'getWarehouses',
      methodProperties: { CityRef: cityRef },
    };

    const res = await fetch(`${NOVA_POSHTA_API}AddressGeneral/getWarehouses`, {
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

    const warehouses = (data.data || []).map(
      (w: { Ref: string; Description: string; Number: string }) => ({
        ref: w.Ref,
        description: w.Description,
        number: w.Number,
      })
    );

    return NextResponse.json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Nova Poshta warehouses error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}
