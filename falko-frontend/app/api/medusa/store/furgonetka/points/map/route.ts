import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Przekazujemy wszystkie parametry zapytania do backendu
    const proxyUrl = `http://localhost:9000/store/furgonetka/points/map?${searchParams.toString()}`;
    
    console.log('🔄 Frontend Map Proxy -> Backend:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Backend Map Error:', response.status, response.statusText);
      return Response.json(
        { error: `Backend map error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Map Proxy Success:', data);
    
    return Response.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
      }
    });

  } catch (error) {
    console.error('❌ Map Proxy Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const { searchParams } = new URL(request.url);
    
    // Przekazujemy POST request do backendu
    const proxyUrl = `http://localhost:9000/store/furgonetka/points/map?${searchParams.toString()}`;
    
    console.log('🔄 Frontend Map POST Proxy -> Backend:', proxyUrl);
    console.log('📦 POST Body:', body);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        'Accept': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      console.error('❌ Backend Map POST Error:', response.status, response.statusText);
      return Response.json(
        { error: `Backend map POST error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Map POST Proxy Success:', data);
    
    return Response.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
      }
    });

  } catch (error) {
    console.error('❌ Map POST Proxy Error:', error);
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
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://falkoproject.com' 
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-publishable-api-key',
    }
  });
}
