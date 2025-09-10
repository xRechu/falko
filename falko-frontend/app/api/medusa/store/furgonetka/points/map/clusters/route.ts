import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Przekazujemy wszystkie parametry zapytania do backendu
    const proxyUrl = `http://localhost:9000/store/furgonetka/points/map/clusters?${searchParams.toString()}`;
    
    console.log('🔄 Frontend Clusters Proxy -> Backend:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Backend Clusters Error:', response.status, response.statusText);
      return Response.json(
        { error: `Backend clusters error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Clusters Proxy Success:', data);
    
    return Response.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
      }
    });

  } catch (error) {
    console.error('❌ Clusters Proxy Error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
    }
  });
}
