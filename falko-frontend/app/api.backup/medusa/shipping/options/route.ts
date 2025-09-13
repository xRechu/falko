/**
 * Frontend API route dla opcji dostawy
 * Proxy do backend Medusa z Furgonetka integration
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy do backend Medusa
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    
    const response = await fetch(`${backendUrl}/store/shipping/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Shipping options API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch shipping options' },
      { status: 500 }
    );
  }
}
