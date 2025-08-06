#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testOrderInsert() {
  console.log('🧪 Testing order insertion...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': supabaseKey,
      },
    },
  });

  try {
    // Get the demo account
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('user_id', 'demo-user')
      .single();

    if (accountError) throw accountError;

    console.log('✅ Found account:', account.id);

    // Try to insert a test order
    const { data: order, error: orderError } = await supabase
      .from('trading_orders')
      .insert({
        account_id: account.id,
        symbol: 'BTC/USD',
        side: 'buy',
        order_type: 'market',
        quantity: 0.001,
        price: 50000,
        status: 'filled',
        strategy_used: 'TEST',
        reasoning: 'Test order',
        confidence_score: 0.8
      })
      .select();

    if (orderError) {
      console.log('❌ Order insertion failed:');
      console.log('   Error:', orderError.message);
      console.log('   Code:', orderError.code);
      console.log('   Details:', orderError.details);
      console.log('   Hint:', orderError.hint);
    } else {
      console.log('✅ Order inserted successfully:');
      console.log('   Order ID:', order[0].id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOrderInsert();
