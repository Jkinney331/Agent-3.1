#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTradingOrdersSchema() {
  console.log('🔍 Checking trading_orders table schema...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }

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
    // Check the actual schema
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'trading_orders' });

    if (error) {
      console.log('❌ Error checking schema:', error.message);
      return;
    }

    console.log('📋 trading_orders table columns:');
    console.log('Column Name | Data Type | Nullable');
    console.log('------------|-----------|---------');
    
    if (columns && columns.length > 0) {
      columns.forEach(col => {
        console.log(`${col.column_name.padEnd(12)} | ${col.data_type.padEnd(10)} | ${col.is_nullable}`);
      });
    } else {
      console.log('No columns found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTradingOrdersSchema();
