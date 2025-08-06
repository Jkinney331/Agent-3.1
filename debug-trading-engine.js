#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugTradingEngine() {
  console.log('🔍 Debugging trading engine...\n');

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
    // Test 1: Check account
    console.log('1️⃣ Testing account access...');
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', 'demo-user')
      .single();

    if (accountError) {
      console.log('❌ Account error:', accountError.message);
      return;
    }
    console.log('✅ Account found:', account.id);

    // Test 2: Check if we can read orders
    console.log('\n2️⃣ Testing order reading...');
    const { data: orders, error: ordersError } = await supabase
      .from('trading_orders')
      .select('*')
      .eq('account_id', account.id)
      .limit(5);

    if (ordersError) {
      console.log('❌ Orders read error:', ordersError.message);
    } else {
      console.log('✅ Orders read successfully, found:', orders.length);
    }

    // Test 3: Try to insert order with exact same data as trading engine
    console.log('\n3️⃣ Testing order insertion with trading engine data...');
    const orderData = {
      account_id: account.id,
      symbol: 'BTC/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.001,
      price: 50000,
      status: 'pending',
      strategy_used: 'AI_ANALYSIS',
      reasoning: 'Test trade execution',
      confidence_score: 0.8
    };

    console.log('📝 Order data to insert:', JSON.stringify(orderData, null, 2));

    const { data: newOrder, error: insertError } = await supabase
      .from('trading_orders')
      .insert(orderData)
      .select();

    if (insertError) {
      console.log('❌ Order insertion error:');
      console.log('   Message:', insertError.message);
      console.log('   Code:', insertError.code);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Order inserted successfully:', newOrder[0].id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

debugTradingEngine();
