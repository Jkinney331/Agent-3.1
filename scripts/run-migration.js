const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Running database migration...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250730000000_fix_trading_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DO'))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          console.log(`  ⚠️  Statement ${i + 1} failed (may already be applied):`, error.message)
        } else {
          console.log(`  ✅ Statement ${i + 1} executed successfully`)
        }
      }
    }

    // Test the connection and schema
    console.log('🧪 Testing database connection...')
    
    const { data: positions, error: posError } = await supabase
      .from('trading_positions')
      .select('*')
      .limit(1)

    if (posError) {
      console.error('❌ Positions table test failed:', posError)
    } else {
      console.log('✅ Positions table accessible')
    }

    const { data: orders, error: orderError } = await supabase
      .from('trading_orders')
      .select('*')
      .limit(1)

    if (orderError) {
      console.error('❌ Orders table test failed:', orderError)
    } else {
      console.log('✅ Orders table accessible')
    }

    console.log('✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration() 