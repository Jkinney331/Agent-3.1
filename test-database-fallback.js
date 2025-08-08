#!/usr/bin/env node

/**
 * Test script to verify database fallback mechanisms
 * This will test both Supabase connection failure and in-memory fallback
 */

const { paperTradingEngine } = require('./lib/trading/enhanced-paper-trading-engine')
const { tradingDB } = require('./lib/database/supabase-client')

async function testDatabaseFallback() {
  console.log('🧪 Testing Database Fallback Mechanisms\n')
  
  try {
    // Test 1: Check initial database status
    console.log('1️⃣ Checking database connection status...')
    const dbStatus = tradingDB.getStatus()
    console.log(`   Database Status:`, dbStatus)
    console.log(`   Storage Mode: ${dbStatus.storageMode}`)
    console.log(`   Supabase Available: ${dbStatus.supabaseAvailable}`)
    console.log(`   Connection Attempted: ${dbStatus.connectionAttempted}`)
    console.log('')

    // Test 2: Initialize paper trading engine
    console.log('2️⃣ Initializing paper trading engine...')
    const testUserId = 'test-user-fallback-demo'
    
    try {
      await paperTradingEngine.initialize(testUserId)
      console.log('   ✅ Paper trading engine initialized successfully')
      
      const account = paperTradingEngine.getAccount()
      if (account) {
        console.log(`   Account ID: ${account.id}`)
        console.log(`   Balance: $${account.balance.toLocaleString()}`)
        console.log(`   User ID: ${account.user_id}`)
      } else {
        console.log('   ❌ No account found after initialization')
      }
    } catch (error) {
      console.error('   ❌ Failed to initialize:', error.message)
      return
    }
    console.log('')

    // Test 3: Execute a test trade
    console.log('3️⃣ Testing order execution...')
    const testOrder = {
      symbol: 'AAPL',
      side: 'buy',
      quantity: 10,
      strategy: 'Test Strategy',
      reasoning: 'Testing database fallback mechanisms',
      confidence: 0.8
    }

    try {
      const result = await paperTradingEngine.executeOrder(testOrder)
      console.log('   Order execution result:', {
        success: result.success,
        message: result.message,
        executedPrice: result.executedPrice,
        orderId: result.orderId
      })
    } catch (error) {
      console.error('   ❌ Order execution failed:', error.message)
    }
    console.log('')

    // Test 4: Check portfolio metrics
    console.log('4️⃣ Getting portfolio metrics...')
    try {
      const metrics = await paperTradingEngine.getPortfolioMetrics()
      if (metrics) {
        console.log('   Portfolio Metrics:', {
          totalValue: `$${metrics.totalValue.toLocaleString()}`,
          totalPnL: `$${metrics.totalPnL.toLocaleString()}`,
          totalTrades: metrics.totalTrades,
          activePositions: metrics.activePositions,
          availableBalance: `$${metrics.availableBalance.toLocaleString()}`
        })
      } else {
        console.log('   ❌ No portfolio metrics available')
      }
    } catch (error) {
      console.error('   ❌ Failed to get portfolio metrics:', error.message)
    }
    console.log('')

    // Test 5: Get positions and orders
    console.log('5️⃣ Testing data retrieval...')
    try {
      const positions = await paperTradingEngine.getAllPositions()
      const orders = await paperTradingEngine.getAllOrders(10)
      
      console.log(`   Positions found: ${positions.length}`)
      console.log(`   Orders found: ${orders.length}`)
      
      if (orders.length > 0) {
        const latestOrder = orders[0]
        console.log('   Latest order:', {
          symbol: latestOrder.symbol,
          side: latestOrder.side,
          quantity: latestOrder.quantity,
          status: latestOrder.status
        })
      }
    } catch (error) {
      console.error('   ❌ Failed to retrieve data:', error.message)
    }
    console.log('')

    // Test 6: Database reconnection test
    console.log('6️⃣ Testing database reconnection...')
    try {
      const reconnected = await paperTradingEngine.reconnectDatabase()
      console.log(`   Reconnection result: ${reconnected ? 'Success' : 'Failed'}`)
      
      const newDbStatus = tradingDB.getStatus()
      console.log(`   New storage mode: ${newDbStatus.storageMode}`)
    } catch (error) {
      console.error('   ❌ Reconnection test failed:', error.message)
    }
    console.log('')

    // Test 7: Final status check
    console.log('7️⃣ Final system status...')
    const finalStatus = paperTradingEngine.getDatabaseStatus()
    console.log('   Final Database Status:', finalStatus)
    
    // Show in-memory storage statistics if applicable
    if (finalStatus.storageMode === 'in-memory') {
      console.log('   In-Memory Storage Stats:', finalStatus.inMemoryStats)
    }

    console.log('\n✅ Database fallback test completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - Storage Mode: ${finalStatus.storageMode}`)
    console.log(`   - Engine Initialized: ${paperTradingEngine.isInitialized ? 'Yes' : 'No'}`)
    console.log(`   - Account Available: ${paperTradingEngine.getAccount() ? 'Yes' : 'No'}`)
    
    if (finalStatus.storageMode === 'in-memory') {
      console.log('   - Note: Using in-memory storage - data will not persist between sessions')
    } else {
      console.log('   - Note: Connected to persistent database storage')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabaseFallback()
    .then(() => {
      console.log('\n🏁 Test script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error)
      process.exit(1)
    })
}

module.exports = { testDatabaseFallback }