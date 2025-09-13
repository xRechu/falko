import { NextResponse } from 'next/server';
import { fetchProductsFromAPI } from '@/lib/api/products';

export async function GET() {
  try {
    const response = await fetchProductsFromAPI();
    
    if (response.error) {
      return NextResponse.json({
        success: false,
        error: response.error.message,
        status: response.error.status || 500
      }, { status: response.error.status || 500 });
    }
    
    const products = response.data || [];
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error in products API endpoint:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
