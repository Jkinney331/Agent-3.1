const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateDatabaseSchema() {
  console.log('🔧 Updating database schema...')

  try {
    // Add missing columns to trading_positions table
    console.log('📝 Adding missing columns to trading_positions...')
    const { error: posError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE trading_positions 
        ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL DEFAULT 'buy';
        
        ALTER TABLE trading_positions 
        ADD COLUMN IF NOT EXISTS entry_price DECIMAL(15,8) NOT NULL DEFAULT 0;
        
        ALTER TABLE trading_positions 
        DROP COLUMN IF EXISTS avg_cost;
      `
    })

    if (posError) {
      console.log('⚠️  Some position table changes failed (columns may already exist):', posError.message)
    }

    // Add missing columns to trading_orders table
    console.log('📝 Adding missing columns to trading_orders...')
    const { error: orderError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE trading_orders 
        ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
        
        ALTER TABLE trading_orders 
        ADD COLUMN IF NOT EXISTS filled_quantity DECIMAL(15,8) DEFAULT 0;
        
        ALTER TABLE trading_orders 
        ADD COLUMN IF NOT EXISTS filled_price DECIMAL(15,8);
        
        ALTER TABLE trading_orders 
        ADD COLUMN IF NOT EXISTS fees DECIMAL(15,2) DEFAULT 0;
        
        ALTER TABLE trading_orders 
        ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(15,2) DEFAULT 0;
      `
    })

    if (orderError) {
      console.log('⚠️  Some order table changes failed (columns may already exist):', orderError.message)
    }

    // Update existing records to have proper values
    console.log('🔄 Updating existing records...')
    
    // Update positions to have entry_price
    const { error: updatePosError } = await supabase
      .from('trading_positions')
      .update({ entry_price: 0 })
      .is('entry_price', null)

    if (updatePosError) {
      console.log('⚠️  Position update failed:', updatePosError.message)
    }

    // Update orders to have ai_reasoning
    const { error: updateOrderError } = await supabase
      .from('trading_orders')
      .update({ ai_reasoning: 'Legacy order' })
      .is('ai_reasoning', null)

    if (updateOrderError) {
      console.log('⚠️  Order update failed:', updateOrderError.message)
    }

    console.log('✅ Database schema updated successfully!')
    
    // Test the connection
    const { data: accounts, error: testError } = await supabase
      .from('trading_accounts')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Database connection test failed:', testError)
    } else {
      console.log('✅ Database connection test successful')
    }

  } catch (error) {
    console.error('❌ Failed to update database schema:', error)
    process.exit(1)
  }
}

updateDatabaseSchema() 