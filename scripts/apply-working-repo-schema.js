const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyWorkingRepoSchema() {
  try {
    console.log('🔧 Applying schema changes to match working repo...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/fix-schema-to-match-working-repo.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
          console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
          
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🎉 Schema migration completed!');
    console.log('📊 Verifying schema changes...');
    
    // Test the schema by trying to create a test order
    const testOrder = {
      account_id: 'test-account',
      symbol: 'BTC/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.001,
      strategy_used: 'TEST',
      ai_reasoning: 'Schema test',
      confidence_score: 0.8
    };
    
    const { data: testData, error: testError } = await supabase
      .from('trading_orders')
      .insert(testOrder)
      .select();
    
    if (testError) {
      console.error('❌ Schema test failed:', testError);
    } else {
      console.log('✅ Schema test passed - trading_orders table is working');
      
      // Clean up test data
      await supabase
        .from('trading_orders')
        .delete()
        .eq('account_id', 'test-account');
    }
    
  } catch (error) {
    console.error('❌ Schema migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyWorkingRepoSchema(); 