import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test połączenia z Medusa 2.0 backend (prosty fetch bez JS SDK)
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/regions`, {
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      status: 'ok',
      message: 'Medusa 2.0 API connected',
      regionCount: data.regions?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Medusa 2.0 API test failed:', error);
    
    return NextResponse.json({
      status: 'degraded',
      message: errorMessage || 'Failed to connect to Medusa 2.0 API',
      timestamp: new Date().toISOString(),
    });
  }
}
