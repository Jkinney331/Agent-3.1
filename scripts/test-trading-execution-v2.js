const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTradingExecutionV2() {
  try {
    console.log('🧪 Testing trading execution v2...');
    
    // Test 1: Check if we can create an order with the exact fields the trading engine uses
    console.log('\n📋 Testing order creation with trading engine fields...');
    
    const testOrder = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'ETH/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.01,
      price: 3000,  // Required field in current schema
      strategy_used: 'TEST_ENGINE',
      reasoning: 'Testing trading engine fields',
      confidence_score: 0.85
    };
    
    const { data: orderData, error: orderError } = await supabase
      .from('trading_orders')
      .insert(testOrder)
      .select();
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
    } else {
      console.log('✅ Order created successfully:', orderData);
      
      // Clean up
      await supabase
        .from('trading_orders')
        .delete()
        .eq('id', orderData[0].id);
    }
    
    // Test 2: Check if we can create a position with the exact fields the trading engine uses
    console.log('\n📋 Testing position creation with trading engine fields...');
    
    const testPosition = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'ETH/USD',
      quantity: 0.01,
      avg_cost: 3000,  // Using avg_cost instead of entry_price
      current_price: 3000,
      market_value: 30,
      unrealized_pnl: 0,
      side: 'long'  // Using 'long' instead of 'buy'
    };
    
    const { data: positionData, error: positionError } = await supabase
      .from('trading_positions')
      .insert(testPosition)
      .select();
    
    if (positionError) {
      console.error('❌ Position creation failed:', positionError);
    } else {
      console.log('✅ Position created successfully:', positionData);
      
      // Clean up
      await supabase
        .from('trading_positions')
        .delete()
        .eq('id', positionData[0].id);
    }
    
    // Test 3: Test the actual API endpoint
    console.log('\n📋 Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/trading/enhanced-paper-trading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'execute-order',
        symbol: 'ETH/USD',
        side: 'buy',
        quantity: 0.01,
        orderType: 'market',
        strategy: 'Test Strategy',
        reasoning: 'Testing API endpoint',
        confidence: 0.85
      })
    });
    
    const result = await response.json();
    console.log('API Response:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTradingExecutionV2(); 