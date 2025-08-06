const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTradingExecution() {
  try {
    console.log('🧪 Testing trading execution...');
    
    // Test 1: Check if we can create an order directly
    console.log('\n📋 Testing direct order creation...');
    
    const testOrder = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'ETH/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.01,
      strategy_used: 'TEST_DIRECT',
      ai_reasoning: 'Direct database test',
      confidence_score: 0.85
    };
    
    const { data: orderData, error: orderError } = await supabase
      .from('trading_orders')
      .insert(testOrder)
      .select();
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      
      // Check what columns exist
      console.log('\n🔍 Checking table schema...');
      const { data: columns, error: columnsError } = await supabase
        .from('trading_orders')
        .select('*')
        .limit(1);
      
      if (columnsError) {
        console.error('❌ Schema check failed:', columnsError);
      } else {
        console.log('✅ Table exists, columns:', Object.keys(columns[0] || {}));
      }
    } else {
      console.log('✅ Order created successfully:', orderData);
      
      // Clean up
      await supabase
        .from('trading_orders')
        .delete()
        .eq('id', orderData[0].id);
    }
    
    // Test 2: Check if we can create a position
    console.log('\n📋 Testing position creation...');
    
    const testPosition = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'ETH/USD',
      side: 'buy',
      quantity: 0.01,
      entry_price: 3000,
      current_price: 3000,
      market_value: 30,
      unrealized_pnl: 0,
      strategy_used: 'TEST_DIRECT',
      confidence_score: 0.85
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
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTradingExecution(); 