#!/usr/bin/env node

// Direct Database Setup Script for $50k Paper Trading
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function setupDatabase() {
  console.log('🚀 Setting up $50k Paper Trading Database...')
  console.log('==========================================')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return false
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Step 1: Create trading_accounts table
    console.log('📊 Creating trading_accounts table...')
    const { error: accountsError } = await supabase.rpc('create_trading_accounts_table', {})
    
    if (accountsError && !accountsError.message.includes('already exists')) {
      console.log('ℹ️  Using direct SQL approach for table creation...')
      
      // Execute SQL directly using Supabase edge function approach
      const createTablesSQL = `
        -- Create trading accounts table
        CREATE TABLE IF NOT EXISTS trading_accounts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_type TEXT CHECK (account_type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
          balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          initial_balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          total_equity DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          buying_power DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create your $50k paper trading account
        INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power)
        VALUES ('demo-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00)
        ON CONFLICT DO NOTHING;
      `
      
      console.log('📋 Please run this SQL in your Supabase Dashboard:')
      console.log('👉 Go to: https://supabase.com/dashboard/project/rrirpgdwgydqzmsvnaxa/sql')
      console.log('👉 Copy and paste this SQL:')
      console.log('\n' + '='.repeat(50))
      console.log(createTablesSQL)
      console.log('='.repeat(50) + '\n')
      
      // Try to at least test the connection
      const { data, error: testError } = await supabase
        .from('trading_accounts')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.log('ℹ️  Tables need to be created manually in dashboard')
        return false
      }
    }
    
    console.log('✅ Database setup completed!')
    return true
    
  } catch (err) {
    console.error('❌ Setup failed:', err.message)
    console.log('\n📋 Manual Setup Required:')
    console.log('1. Go to: https://supabase.com/dashboard/project/rrirpgdwgydqzmsvnaxa/sql')
    console.log('2. Copy the SQL from: database/setup-trading-schema.sql')
    console.log('3. Paste and run in the SQL Editor')
    console.log('4. Then run: node scripts/test-paper-trading.js')
    return false
  }
}

// Run setup
setupDatabase().then(success => {
  if (success) {
    console.log('\n🎉 Ready to test! Run: node scripts/test-paper-trading.js')
  }
}).catch(console.error) 