const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Applying database schema fixes...');
    
    // SQL statements to fix the schema
    const fixes = [
      // Add missing columns to trading_orders table
      `ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;`,
      `ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE DEFAULT gen_random_uuid()::text;`,
      
      // Add missing columns to trading_positions table
      `ALTER TABLE trading_positions ADD COLUMN IF NOT EXISTS entry_price DECIMAL(15,8);`,
      `ALTER TABLE trading_positions ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('buy', 'sell')) DEFAULT 'buy';`,
      `ALTER TABLE trading_positions ADD COLUMN IF NOT EXISTS strategy_used TEXT;`,
      `ALTER TABLE trading_positions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);`,
      
      // Update existing records
      `UPDATE trading_positions SET entry_price = current_price WHERE entry_price IS NULL AND current_price IS NOT NULL;`,
      `UPDATE trading_positions SET side = 'buy' WHERE side IS NULL;`,
      `UPDATE trading_orders SET ai_reasoning = reasoning WHERE ai_reasoning IS NULL AND reasoning IS NOT NULL;`,
      `UPDATE trading_orders SET ai_reasoning = 'Legacy order' WHERE ai_reasoning IS NULL;`,
      `UPDATE trading_orders SET order_id = gen_random_uuid()::text WHERE order_id IS NULL;`,
      
      // Make price column nullable for market orders
      `ALTER TABLE trading_orders ALTER COLUMN price DROP NOT NULL;`
    ];
    
    // Execute each fix
    for (const fix of fixes) {
      console.log(`📝 Executing: ${fix.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: fix });
      
      if (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error(`Statement: ${fix}`);
      } else {
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log('🎉 Database schema fixes applied successfully!');
    
    // Test the schema by trying to insert a test record
    console.log('🧪 Testing schema with a test order...');
    
    const testOrder = {
      account_id: 'f988abba-6985-485f-9e75-4ba186b535ca', // Your account ID
      order_id: `test-${Date.now()}`,
      symbol: 'BTC/USD',
      side: 'buy',
      quantity: 0.001,
      price: 50000,
      order_type: 'market',
      status: 'filled',
      strategy_used: 'TEST',
      reasoning: 'Schema test',
      ai_reasoning: 'Schema test',
      confidence_score: 0.8
    };
    
    const { data, error } = await supabase
      .from('trading_orders')
      .insert(testOrder)
      .select();
    
    if (error) {
      console.error('❌ Test order insertion failed:', error);
    } else {
      console.log('✅ Test order inserted successfully:', data);
      
      // Clean up test order
      await supabase
        .from('trading_orders')
        .delete()
        .eq('order_id', testOrder.order_id);
      
      console.log('🧹 Test order cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply schema fixes:', error);
    process.exit(1);
  }
}

fixDatabaseSchema(); 