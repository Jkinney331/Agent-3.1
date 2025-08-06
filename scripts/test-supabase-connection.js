#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase environment variables:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    console.log('\n📝 Please update your .env.local file with real Supabase credentials.');
    console.log('   See SUPABASE_SETUP_GUIDE.md for instructions.');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('   URL:', supabaseUrl);
  console.log('   Key:', supabaseKey.substring(0, 20) + '...');

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('\n🔌 Attempting to connect to Supabase...');

    // Test connection by querying trading_accounts table
    const { data, error } = await supabase
      .from('trading_accounts')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Connection successful, but trading_accounts table may not exist yet.');
        console.log('   This is normal for new projects. Run the database setup to create tables.');
      } else {
        console.log('❌ Connection failed:', error.message);
        console.log('   Error code:', error.code);
        console.log('   Details:', error.details);
        return;
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('   Found', data?.length || 0, 'trading_account records');
    }

    // Test creating a test trading_account
    console.log('\n🧪 Testing trading_account creation...');
    const testPortfolio = {
      user_id: 'test-user-' + Date.now(),
      balance: 50000,
      realized_pnl: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('trading_accounts')
      .insert([testPortfolio])
      .select()
      .single();

    if (insertError) {
      console.log('⚠️  Could not create test trading_account:', insertError.message);
      console.log('   This might be due to missing table or permissions.');
      console.log('   Run the database setup to create required tables.');
    } else {
      console.log('✅ Test trading_account created successfully!');
      console.log('   Portfolio ID:', insertData.id);
      console.log('   User ID:', insertData.user_id);
      console.log('   Balance:', insertData.balance);

      // Clean up test data
      await supabase
        .from('trading_accounts')
        .delete()
        .eq('user_id', testPortfolio.user_id);
      console.log('🧹 Test data cleaned up');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('   Stack trace:', error.stack);
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. If connection failed, check your Supabase credentials');
  console.log('   2. If tables missing, run: node scripts/setup-database-direct.js');
  console.log('   3. If permissions issue, check Row Level Security (RLS) policies');
  console.log('   4. Restart your dev server: npm run dev');
}

// Run the test
testSupabaseConnection().catch(console.error); 