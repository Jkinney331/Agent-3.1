const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseSchema() {
  try {
    console.log('🧪 Testing database schema...');
    
    // Test 1: Check what columns exist in trading_orders
    console.log('\n📋 Testing trading_orders table...');
    
    const testOrder = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'BTC/USD',
      side: 'buy',
      quantity: 0.001,
      price: 50000,
      order_type: 'market',
      status: 'filled',
      strategy_used: 'TEST',
      reasoning: 'Schema test',
      confidence_score: 0.8
    };
    
    const { data: orderData, error: orderError } = await supabase
      .from('trading_orders')
      .insert(testOrder)
      .select();
    
    if (orderError) {
      console.error('❌ Order insertion failed:', orderError.message);
    } else {
      console.log('✅ Order inserted successfully:', orderData);
      
      // Clean up
      await supabase
        .from('trading_orders')
        .delete()
        .eq('id', orderData[0].id);
    }
    
    // Test 2: Check what columns exist in trading_positions
    console.log('\n📋 Testing trading_positions table...');
    
    const testPosition = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'BTC/USD',
      quantity: 0.001,
      current_price: 50000,
      market_value: 50,
      unrealized_pnl: 0
    };
    
    const { data: positionData, error: positionError } = await supabase
      .from('trading_positions')
      .insert(testPosition)
      .select();
    
    if (positionError) {
      console.error('❌ Position insertion failed:', positionError.message);
    } else {
      console.log('✅ Position inserted successfully:', positionData);
      
      // Clean up
      await supabase
        .from('trading_positions')
        .delete()
        .eq('id', positionData[0].id);
    }
    
    // Test 3: Check existing orders structure
    console.log('\n📋 Checking existing orders structure...');
    
    const { data: existingOrders, error: ordersError } = await supabase
      .from('trading_orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Failed to fetch orders:', ordersError.message);
    } else if (existingOrders.length > 0) {
      console.log('✅ Existing order structure:', Object.keys(existingOrders[0]));
    } else {
      console.log('ℹ️  No existing orders found');
    }
    
    // Test 4: Check existing positions structure
    console.log('\n📋 Checking existing positions structure...');
    
    const { data: existingPositions, error: positionsError } = await supabase
      .from('trading_positions')
      .select('*')
      .limit(1);
    
    if (positionsError) {
      console.error('❌ Failed to fetch positions:', positionsError.message);
    } else if (existingPositions.length > 0) {
      console.log('✅ Existing position structure:', Object.keys(existingPositions[0]));
    } else {
      console.log('ℹ️  No existing positions found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseSchema(); 