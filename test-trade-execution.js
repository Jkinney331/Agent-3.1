const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTradeExecution() {
  console.log('🧪 Testing trade execution...')

  try {
    // Test 1: Check if we can read from trading_accounts
    console.log('📊 Testing trading_accounts table...')
    const { data: accounts, error: accountError } = await supabase
      .from('trading_accounts')
      .select('*')
      .limit(1)

    if (accountError) {
      console.error('❌ Account table error:', accountError)
      return
    }
    console.log('✅ Account table accessible:', accounts[0]?.user_id)

    // Test 2: Check if we can insert into trading_orders
    console.log('📝 Testing trading_orders table...')
    const testOrder = {
      account_id: accounts[0].id,
      symbol: 'BTC/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.001,
      price: 50000,
      status: 'pending',
      strategy_used: 'TEST',
      reasoning: 'Test order',
      confidence_score: 0.8
    }

    const { data: order, error: orderError } = await supabase
      .from('trading_orders')
      .insert(testOrder)
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order insert error:', orderError)
      return
    }
    console.log('✅ Order inserted successfully:', order.id)

    // Test 3: Check if we can insert into trading_positions
    console.log('📈 Testing trading_positions table...')
    const testPosition = {
      account_id: accounts[0].id,
      symbol: 'BTC/USD',
      quantity: 0.001,
      avg_cost: 50000,
      current_price: 50000,
      market_value: 50,
      unrealized_pnl: 0,
      side: 'long'
    }

    const { data: position, error: positionError } = await supabase
      .from('trading_positions')
      .insert(testPosition)
      .select()
      .single()

    if (positionError) {
      console.error('❌ Position insert error:', positionError)
      return
    }
    console.log('✅ Position inserted successfully:', position.id)

    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    await supabase.from('trading_orders').delete().eq('id', order.id)
    await supabase.from('trading_positions').delete().eq('id', position.id)

    console.log('✅ All database tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testTradeExecution() 