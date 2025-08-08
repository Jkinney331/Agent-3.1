#!/usr/bin/env ts-node

/**
 * Alpaca API Connection Test Script (TypeScript)
 * Tests the connection to Alpaca paper trading API with configured credentials
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { AlpacaClient } from '../lib/trading/exchanges/alpaca-client.js';

interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
}

console.log('🚀 Alpaca API Connection Test Starting...');
console.log('==========================================');

// Check environment variables
console.log('\n📋 Environment Configuration:');
console.log(`ALPACA_API_KEY: ${process.env.ALPACA_API_KEY ? '***' + process.env.ALPACA_API_KEY.slice(-4) : 'NOT SET'}`);
console.log(`ALPACA_SECRET_KEY: ${process.env.ALPACA_SECRET_KEY ? '***' + process.env.ALPACA_SECRET_KEY.slice(-4) : 'NOT SET'}`);
console.log(`ALPACA_PAPER: ${process.env.ALPACA_PAPER || 'NOT SET'}`);
console.log(`ALPACA_BASE_URL: ${process.env.ALPACA_BASE_URL || 'NOT SET'}`);
console.log(`ALPACA_DATA_URL: ${process.env.ALPACA_DATA_URL || 'NOT SET'}`);

/**
 * Comprehensive Alpaca API test suite
 */
export async function testAlpacaConnection(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    console.log('\n🔗 Testing Alpaca Client Connection...');
    
    // Initialize the Alpaca client
    const alpacaClient = new AlpacaClient();
    console.log('✅ Alpaca client instantiated successfully');
    
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
      console.log(`   Pattern Day Trader: ${account.pattern_day_trader}`);
      console.log(`   Trading Blocked: ${account.trading_blocked}`);
      
      results.push({
        test: 'Account Information',
        success: true,
        data: {
          id: account.id,
          status: account.status,
          cash: account.cash,
          buying_power: account.buying_power,
          portfolio_value: account.portfolio_value
        }
      });
    } catch (error) {
      console.error('❌ Failed to retrieve account:', (error as Error).message);
      results.push({
        test: 'Account Information',
        success: false,
        error: (error as Error).message
      });
    }
    
    // Test 2: Get Positions
    console.log('\n📈 Test 2: Retrieving Current Positions...');
    try {
      const positions = await alpacaClient.getPositions();
      console.log(`✅ Retrieved ${positions.length} positions`);
      if (positions.length > 0) {
        positions.forEach((pos, index) => {
          console.log(`   ${index + 1}. ${pos.symbol}: ${pos.qty} shares (${pos.side}) - Market Value: $${pos.market_value}`);
        });
      } else {
        console.log('   No positions found (expected for new account)');
      }
      
      results.push({
        test: 'Current Positions',
        success: true,
        data: { count: positions.length, positions: positions.slice(0, 3) }
      });
    } catch (error) {
      console.error('❌ Failed to retrieve positions:', (error as Error).message);
      results.push({
        test: 'Current Positions',
        success: false,
        error: (error as Error).message
      });
    }
    
    // Test 3: Get Recent Orders
    console.log('\n📋 Test 3: Retrieving Recent Orders...');
    try {
      const orders = await alpacaClient.getOrders();
      console.log(`✅ Retrieved ${orders.length} orders`);
      if (orders.length > 0) {
        orders.slice(0, 5).forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.symbol} ${order.side} ${order.qty} - ${order.status} (${order.created_at})`);
        });
      } else {
        console.log('   No orders found (expected for new account)');
      }
      
      results.push({
        test: 'Recent Orders',
        success: true,
        data: { count: orders.length, orders: orders.slice(0, 3) }
      });
    } catch (error) {
      console.error('❌ Failed to retrieve orders:', (error as Error).message);
      results.push({
        test: 'Recent Orders',
        success: false,
        error: (error as Error).message
      });
    }
    
    // Test 4: Test a mock order placement
    console.log('\n🔄 Test 4: Testing Mock Order Placement...');
    try {
      const mockOrder = {
        symbol: 'AAPL',
        qty: 1,
        side: 'buy' as const,
        type: 'market' as const,
        time_in_force: 'day' as const,
        client_order_id: `test_${Date.now()}`
      };
      
      const orderResult = await alpacaClient.placeOrder(mockOrder);
      console.log('✅ Mock order placed successfully:');
      console.log(`   Order ID: ${orderResult.id}`);
      console.log(`   Symbol: ${orderResult.symbol}`);
      console.log(`   Side: ${orderResult.side}`);
      console.log(`   Qty: ${orderResult.qty}`);
      console.log(`   Status: ${orderResult.status}`);
      console.log(`   Created: ${orderResult.created_at}`);
      
      results.push({
        test: 'Mock Order Placement',
        success: true,
        data: {
          id: orderResult.id,
          symbol: orderResult.symbol,
          side: orderResult.side,
          qty: orderResult.qty,
          status: orderResult.status
        }
      });
    } catch (error) {
      console.error('❌ Failed to place mock order:', (error as Error).message);
      results.push({
        test: 'Mock Order Placement',
        success: false,
        error: (error as Error).message
      });
    }
    
    // Test 5: Test position lookup for a common stock
    console.log('\n🔍 Test 5: Testing Position Lookup...');
    try {
      const position = await alpacaClient.getPosition('AAPL');
      if (position) {
        console.log(`✅ Found position for AAPL: ${position.qty} shares`);
      } else {
        console.log('ℹ️  No position found for AAPL (expected)');
      }
      
      results.push({
        test: 'Position Lookup',
        success: true,
        data: { symbol: 'AAPL', hasPosition: !!position }
      });
    } catch (error) {
      console.error('❌ Failed to lookup position:', (error as Error).message);
      results.push({
        test: 'Position Lookup',
        success: false,
        error: (error as Error).message
      });
    }
    
  } catch (error) {
    console.error('\n💥 Fatal Error:', error);
    results.push({
      test: 'Client Initialization',
      success: false,
      error: (error as Error).message
    });
  }
  
  return results;
}

/**
 * Validate the Alpaca configuration
 */
export function validateConfiguration(): boolean {
  console.log('\n🔍 Validating Configuration...');
  
  const issues: string[] = [];
  
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

/**
 * Check if real API keys are configured
 */
export function checkApiKeys(): boolean {
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

/**
 * Generate a test report
 */
function generateTestReport(results: TestResult[]): void {
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => r.success === false).length;
  
  console.log(`✅ Successful tests: ${successful}`);
  console.log(`❌ Failed tests: ${failed}`);
  console.log(`📋 Total tests: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.test}: ${result.error}`);
    });
  }
  
  console.log(`\n🎯 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  try {
    const configValid = validateConfiguration();
    const hasRealKeys = checkApiKeys();
    
    if (!configValid) {
      console.log('\n⚠️  Configuration issues detected, but continuing with test...');
    }
    
    const results = await testAlpacaConnection();
    
    generateTestReport(results);
    
    console.log('\n🎉 Alpaca API Connection Test Completed!');
    console.log('==========================================');
    
    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}