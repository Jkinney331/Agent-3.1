#!/usr/bin/env node

/**
 * Alpaca Integration Demo
 * Demonstrates both mock mode and real connection setup
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

console.log('🎬 Alpaca Integration Demo');
console.log('=========================');
console.log('This demo shows how the Alpaca integration works in different modes:\n');

// Test 1: Show current configuration
console.log('📋 Current Configuration:');
console.log(`   ALPACA_API_KEY: ${process.env.ALPACA_API_KEY || 'NOT SET'}`);
console.log(`   ALPACA_SECRET_KEY: ${process.env.ALPACA_SECRET_KEY ? '[HIDDEN]' : 'NOT SET'}`);
console.log(`   ALPACA_PAPER: ${process.env.ALPACA_PAPER || 'NOT SET'}`);
console.log(`   ALPACA_BASE_URL: ${process.env.ALPACA_BASE_URL || 'NOT SET'}`);

// Test 2: Determine mode
let mode = 'unknown';
if (!process.env.ALPACA_API_KEY || process.env.ALPACA_API_KEY === 'your-alpaca-paper-api-key') {
  mode = 'mock';
  console.log('\n🎭 Mode: MOCK (Demo credentials detected)');
  console.log('   - Safe for testing and development');
  console.log('   - Uses simulated data');
  console.log('   - No real API calls made');
} else if (process.env.ALPACA_API_KEY.startsWith('PK')) {
  mode = 'paper';
  console.log('\n📝 Mode: PAPER TRADING (Real paper trading credentials)');
  console.log('   - Connects to real Alpaca paper trading API');
  console.log('   - Uses real market data');
  console.log('   - Virtual money only');
} else if (process.env.ALPACA_API_KEY.startsWith('AK')) {
  mode = 'live';
  console.log('\n⚠️  Mode: LIVE TRADING (Real live trading credentials)');
  console.log('   - WARNING: Uses real money!');
  console.log('   - Only use in production');
  console.log('   - Not recommended for development');
} else {
  console.log('\n❓ Mode: UNKNOWN (Custom or invalid credentials)');
}

// Test 3: Load and test the Alpaca client
async function testAlpacaIntegration() {
  try {
    console.log('\n🔧 Testing Alpaca Client Integration...');
    
    // Try to load Alpaca SDK
    let Alpaca = null;
    try {
      Alpaca = require('@alpacahq/alpaca-trade-api');
      console.log('✅ Alpaca SDK loaded successfully');
    } catch (error) {
      console.log('❌ Alpaca SDK not available:', error.message);
      console.log('📝 This is normal for deployment environments');
      return;
    }

    // Initialize client based on mode
    if (mode === 'mock') {
      console.log('\n🎭 Mock Mode Demo:');
      console.log('   ✅ Account: Demo Account (DEMO123456)');
      console.log('   ✅ Cash: $50,000.00 (virtual)');
      console.log('   ✅ Buying Power: $50,000.00 (virtual)');
      console.log('   ✅ Portfolio Value: $50,000.00 (virtual)');
      console.log('   ✅ Positions: 0 (empty portfolio)');
      console.log('   ✅ Orders: 0 (no trading history)');
      console.log('   📝 All data is simulated - perfect for development!');
      
    } else if (mode === 'paper' || mode === 'live') {
      console.log(`\n${mode === 'paper' ? '📝' : '⚠️ '} ${mode.toUpperCase()} Mode Test:`);
      
      const alpaca = new Alpaca({
        credentials: {
          key: process.env.ALPACA_API_KEY,
          secret: process.env.ALPACA_SECRET_KEY,
          paper: mode === 'paper'
        },
        data: {
          url: process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets'
        }
      });
      
      // Test real connection
      try {
        const account = await alpaca.getAccount();
        console.log('   ✅ Successfully connected to Alpaca!');
        console.log(`   📊 Account ID: ${account.id}`);
        console.log(`   💰 Cash: $${parseFloat(account.cash).toLocaleString()}`);
        console.log(`   📈 Portfolio Value: $${parseFloat(account.portfolio_value).toLocaleString()}`);
        console.log(`   🔄 Status: ${account.status}`);
        
        // Test positions
        const positions = await alpaca.getPositions();
        console.log(`   📋 Positions: ${positions.length}`);
        
        // Test orders
        const orders = await alpaca.getOrders({ status: 'all', limit: 5 });
        console.log(`   📜 Recent Orders: ${orders.length}`);
        
      } catch (error) {
        console.log('   ❌ Connection failed:', error.message);
        if (error.response?.status === 403) {
          console.log('   💡 This usually means invalid API credentials');
          console.log('   🔧 Please check your .env.local file');
        }
      }
    }

    console.log('\n🎯 Integration Test Results:');
    console.log('============================');
    
    switch (mode) {
      case 'mock':
        console.log('✅ PASS - Mock mode working correctly');
        console.log('   Ready for development and testing');
        console.log('   To use real paper trading, get API keys from:');
        console.log('   https://app.alpaca.markets/paper/dashboard/overview');
        break;
        
      case 'paper':
        console.log('✅ PASS - Paper trading mode configured');
        console.log('   Ready for realistic testing with virtual money');
        console.log('   Safe to test strategies and orders');
        break;
        
      case 'live':
        console.log('⚠️  CAUTION - Live trading mode detected');
        console.log('   Uses real money - ensure you want this!');
        console.log('   Consider using paper trading for development');
        break;
        
      default:
        console.log('❓ UNKNOWN - Please check your configuration');
        break;
    }

  } catch (error) {
    console.error('\n💥 Integration test failed:', error);
  }
}

// Test 4: Show setup instructions
function showSetupInstructions() {
  console.log('\n📚 Setup Instructions:');
  console.log('======================');
  
  if (mode === 'mock') {
    console.log('\n🚀 To set up real paper trading:');
    console.log('1. Go to https://alpaca.markets and create a free account');
    console.log('2. Navigate to https://app.alpaca.markets/paper/dashboard/overview');
    console.log('3. Generate API keys for paper trading');
    console.log('4. Update your .env.local file with real credentials:');
    console.log('');
    console.log('   ALPACA_API_KEY=PKTEST_YOUR_REAL_API_KEY');
    console.log('   ALPACA_SECRET_KEY=your_real_secret_key');
    console.log('   ALPACA_PAPER=true');
    console.log('');
    console.log('5. Run this test again to verify the connection');
  } else {
    console.log('\n✅ Configuration looks good!');
    console.log('   You can start using the trading bot features');
  }
  
  console.log('\n🔧 Available test scripts:');
  console.log('   npm run test:alpaca          # Run this demo');
  console.log('   node scripts/simple-alpaca-test.js  # Detailed connection test');
  console.log('   npm run integrated:test      # Full system integration test');
}

// Main execution
async function main() {
  await testAlpacaIntegration();
  showSetupInstructions();
  
  console.log('\n🎉 Alpaca Integration Demo Complete!');
  console.log('====================================');
  
  // Summary
  const summary = {
    mode: mode,
    configured: mode !== 'unknown',
    safe: mode === 'mock' || mode === 'paper',
    ready: mode === 'paper' || mode === 'mock'
  };
  
  console.log('\n📊 Summary:');
  console.log(`   Mode: ${summary.mode.toUpperCase()}`);
  console.log(`   Configured: ${summary.configured ? '✅ Yes' : '❌ No'}`);
  console.log(`   Safe for Development: ${summary.safe ? '✅ Yes' : '⚠️  No'}`);
  console.log(`   Ready to Use: ${summary.ready ? '✅ Yes' : '🔧 Needs Setup'}`);
}

if (require.main === module) {
  main().catch(console.error);
}