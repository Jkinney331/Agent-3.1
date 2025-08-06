const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTradingEngine() {
  try {
    console.log('🧪 Testing trading engine...');
    
    // Test 1: Check if the account exists
    console.log('\n📋 Testing account access...');
    
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', 'demo-user')
      .single();
    
    if (accountError) {
      console.error('❌ Account access failed:', accountError);
    } else {
      console.log('✅ Account found:', account);
    }
    
    // Test 2: Check if we can get positions
    console.log('\n📋 Testing position access...');
    
    const { data: positions, error: positionsError } = await supabase
      .from('trading_positions')
      .select('*')
      .eq('account_id', account.id);
    
    if (positionsError) {
      console.error('❌ Position access failed:', positionsError);
    } else {
      console.log('✅ Positions found:', positions.length);
    }
    
    // Test 3: Check if we can get orders
    console.log('\n📋 Testing order access...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('trading_orders')
      .select('*')
      .eq('account_id', account.id)
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Order access failed:', ordersError);
    } else {
      console.log('✅ Orders found:', orders.length);
    }
    
    // Test 4: Test the API initialization
    console.log('\n📋 Testing API initialization...');
    
    const initResponse = await fetch('http://localhost:3000/api/trading/enhanced-paper-trading?action=initialize&userId=demo-user');
    const initResult = await initResponse.json();
    console.log('Initialization Response:', initResult);
    
    // Test 5: Test the API status
    console.log('\n📋 Testing API status...');
    
    const statusResponse = await fetch('http://localhost:3000/api/trading/enhanced-paper-trading?action=status');
    const statusResult = await statusResponse.json();
    console.log('Status Response:', statusResult.success ? 'Success' : 'Failed');
    
    if (!statusResult.success) {
      console.log('Status Error:', statusResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTradingEngine(); 