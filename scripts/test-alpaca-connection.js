#!/usr/bin/env node

/**
 * Alpaca API Connection Test Script
 * Tests the connection to Alpaca paper trading API with configured credentials
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

console.log('🚀 Alpaca API Connection Test Starting...');
console.log('==========================================');

// Check environment variables
console.log('\n📋 Environment Configuration:');
console.log(`ALPACA_API_KEY: ${process.env.ALPACA_API_KEY ? '***' + process.env.ALPACA_API_KEY.slice(-4) : 'NOT SET'}`);
console.log(`ALPACA_SECRET_KEY: ${process.env.ALPACA_SECRET_KEY ? '***' + process.env.ALPACA_SECRET_KEY.slice(-4) : 'NOT SET'}`);
console.log(`ALPACA_PAPER: ${process.env.ALPACA_PAPER || 'NOT SET'}`);
console.log(`ALPACA_BASE_URL: ${process.env.ALPACA_BASE_URL || 'NOT SET'}`);
console.log(`ALPACA_DATA_URL: ${process.env.ALPACA_DATA_URL || 'NOT SET'}`);

// Test the Alpaca client
async function testAlpacaConnection() {
  try {
    console.log('\n🔗 Testing Alpaca Client Connection...');
    
    // Dynamic import of the Alpaca client
    const { AlpacaClient } = await import('../lib/trading/exchanges/alpaca-client.ts');
    const alpacaClient = new AlpacaClient();
    
    console.log('\n✅ Alpaca client instantiated successfully');
    
    // Test 1: Get Account Information
    console.log('\n📊 Test 1: Retrieving Account Information...');
    try {
      const account = await alpacaClient.getAccount();
      console.log('✅ Account retrieved successfully:');
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Status: ${account.status}`);
      console.log(`   Cash: $${account.cash}`);
      console.log(`   Buying Power: $${account.buying_power}`);
      console.log(`   Portfolio Value: $${account.portfolio_value}`);
    } catch (error) {
      console.error('❌ Failed to retrieve account:', error.message);
    }
    
    // Test 2: Get Positions
    console.log('\n📈 Test 2: Retrieving Current Positions...');
    try {
      const positions = await alpacaClient.getPositions();
      console.log(`✅ Retrieved ${positions.length} positions`);
      if (positions.length > 0) {
        positions.forEach((pos, index) => {
          console.log(`   ${index + 1}. ${pos.symbol}: ${pos.qty} shares (${pos.side})`);
        });
      } else {
        console.log('   No positions found (expected for new account)');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve positions:', error.message);
    }
    
    // Test 3: Get Recent Orders
    console.log('\n📋 Test 3: Retrieving Recent Orders...');
    try {
      const orders = await alpacaClient.getOrders();
      console.log(`✅ Retrieved ${orders.length} orders`);
      if (orders.length > 0) {
        orders.slice(0, 5).forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.symbol} ${order.side} ${order.qty} - ${order.status}`);
        });
      } else {
        console.log('   No orders found (expected for new account)');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve orders:', error.message);
    }
    
    // Test 4: Test a mock order (if in demo mode)
    console.log('\n🔄 Test 4: Testing Mock Order Placement...');
    try {
      const mockOrder = {
        symbol: 'AAPL',
        qty: 1,
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
        client_order_id: `test_${Date.now()}`
      };
      
      const orderResult = await alpacaClient.placeOrder(mockOrder);
      console.log('✅ Mock order placed successfully:');
      console.log(`   Order ID: ${orderResult.id}`);
      console.log(`   Symbol: ${orderResult.symbol}`);
      console.log(`   Side: ${orderResult.side}`);
      console.log(`   Qty: ${orderResult.qty}`);
      console.log(`   Status: ${orderResult.status}`);
    } catch (error) {
      console.error('❌ Failed to place mock order:', error.message);
    }
    
    console.log('\n🎉 Alpaca API Connection Test Completed!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('\n💥 Fatal Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Additional validation checks
function validateConfiguration() {
  console.log('\n🔍 Validating Configuration...');
  
  const issues = [];
  
  if (!process.env.ALPACA_API_KEY || process.env.ALPACA_API_KEY === 'your-alpaca-api-key') {
    issues.push('ALPACA_API_KEY is not set or using placeholder value');
  }
  
  if (!process.env.ALPACA_SECRET_KEY || process.env.ALPACA_SECRET_KEY === 'your-alpaca-secret-key') {
    issues.push('ALPACA_SECRET_KEY is not set or using placeholder value');
  }
  
  if (process.env.ALPACA_PAPER !== 'true') {
    issues.push('ALPACA_PAPER should be set to "true" for paper trading');
  }
  
  if (!process.env.ALPACA_BASE_URL || !process.env.ALPACA_BASE_URL.includes('paper-api')) {
    issues.push('ALPACA_BASE_URL should point to paper trading API');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Configuration Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log('\n💡 Please check your .env.local file and update the configuration');
  } else {
    console.log('✅ Configuration validation passed');
  }
  
  return issues.length === 0;
}

// API Keys validation
function checkApiKeys() {
  console.log('\n🔑 Checking API Keys...');
  
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;
  
  if (apiKey && secretKey && apiKey !== 'demo_key' && secretKey !== 'demo_secret') {
    console.log('✅ Real API keys detected - testing live connection');
    return true;
  } else {
    console.log('ℹ️  Demo/placeholder keys detected - will use mock mode');
    return false;
  }
}

// Run the tests
async function main() {
  const configValid = validateConfiguration();
  const hasRealKeys = checkApiKeys();
  
  if (!configValid) {
    console.log('\n⚠️  Configuration issues detected, but continuing with test...');
  }
  
  await testAlpacaConnection();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAlpacaConnection, validateConfiguration };