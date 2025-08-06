const { tradingDB } = require('./lib/database/supabase-client')

async function testSimpleTrading() {
  try {
    console.log('🧪 Testing simple trading engine...')
    
    // Test 1: Get account
    console.log('1. Getting account...')
    const account = await tradingDB.getAccount('demo-user')
    console.log('Account:', account ? 'Found' : 'Not found')
    
    if (!account) {
      console.log('2. Initializing account...')
      const newAccount = await tradingDB.initializePaperAccount('demo-user')
      console.log('New account created:', newAccount.id)
    }
    
    // Test 2: Create a simple order
    console.log('3. Creating test order...')
    const testOrder = {
      account_id: account?.id || 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'ETH/USD',
      side: 'buy',
      order_type: 'market',
      quantity: 0.01,
      price: 3000,
      status: 'filled',
      strategy_used: 'Test Strategy',
      reasoning: 'Testing the simplified trading engine',
      confidence_score: 0.85
    }
    
    console.log('Order data:', JSON.stringify(testOrder, null, 2))
    
    const createdOrder = await tradingDB.createOrder(testOrder)
    console.log('✅ Order created successfully:', createdOrder.id)
    
    // Test 3: Update order status
    console.log('4. Updating order status...')
    await tradingDB.updateOrderStatus(createdOrder.id, 'filled', new Date().toISOString())
    console.log('✅ Order status updated')
    
    // Test 4: Create position
    console.log('5. Creating position...')
    const testPosition = {
      account_id: account?.id || 'f988abba-6985-485f-9e75-4ba186b535ca',
      symbol: 'ETH/USD',
      quantity: 0.01,
      avg_cost: 3000,
      current_price: 3000,
      market_value: 30,
      unrealized_pnl: 0,
      side: 'long'
    }
    
    const createdPosition = await tradingDB.createPosition(testPosition)
    console.log('✅ Position created successfully:', createdPosition.id)
    
    console.log('🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
  }
}

testSimpleTrading() 