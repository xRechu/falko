import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const proxyUrl = `${base}/store/furgonetka/points`;

    // Preferuj klucz z nagłówka klienta, potem ENV
    const clientPk = request.headers.get('x-publishable-api-key') || ''
    const envPk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
    const publishableKey = clientPk || envPk

    if (!publishableKey) {
      console.error('❌ Brak x-publishable-api-key w żądaniu oraz brak NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY w środowisku frontendu');
      return Response.json(
        { error: 'Missing publishable API key', details: 'Provide x-publishable-api-key header or set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY' },
        { status: 400 }
      );
    }

    console.log('🔄 Frontend Proxy (POST) -> Backend:', proxyUrl);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('❌ Backend Error:', response.status, response.statusText);
      const text = await response.text();
      return Response.json(
        { error: `Backend error: ${response.status}`, details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Proxy Success:', Array.isArray(data?.points) ? `points: ${data.points.length}` : 'ok');

    return Response.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
      }
    });

  } catch (error) {
    console.error('❌ Proxy Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
    }
  });
}
