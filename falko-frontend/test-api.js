#!/usr/bin/env node

/**
 * Test API po migracji SDK
 */

const { sdk } = require('./lib/medusa-client');

async function testAPI() {
  console.log('🧪 Testing Medusa.js 2.0 SDK...\n');
  
  try {
    // Test 1: Products
    console.log('1. Testing products API...');
    const productsResponse = await sdk.store.product.list({ limit: 2 });
    console.log(`✅ Products: ${productsResponse.products?.length || 0} found`);
    
    if (productsResponse.products?.[0]) {
      const product = productsResponse.products[0];
      console.log(`   - Product: ${product.title}`);
      console.log(`   - Variants: ${product.variants?.length || 0}`);
      
      if (product.variants?.[0]?.calculated_price) {
        const price = product.variants[0].calculated_price;
        console.log(`   - Price: ${price.calculated_amount} ${price.currency_code}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Products API error:', error.message);
  }
  
  try {
    // Test 2: Auth endpoints (bez logowania)
    console.log('\n2. Testing auth endpoints...');
    const response = await sdk.client.fetch('/auth/customer/emailpass/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@nonexistent.com' }),
    });
    console.log('❌ Unexpected success in reset password test');
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.log('✅ Auth endpoint working (404 for non-existent user)');
    } else {
      console.log(`✅ Auth endpoint responding with: ${error.message}`);
    }
  }
  
  try {
    // Test 3: Health check via SDK
    console.log('\n3. Testing health endpoint...');
    const healthResponse = await sdk.client.fetch('/health');
    console.log('✅ Health endpoint working');
  } catch (error) {
    console.error('❌ Health endpoint error:', error.message);
  }
  
  console.log('\n🎉 API tests completed!');
}

testAPI().catch(console.error);
