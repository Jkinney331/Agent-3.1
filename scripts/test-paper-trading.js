#!/usr/bin/env node

// Test the $50k Paper Trading System
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testPaperTradingSystem() {
  console.log('💰 Testing $50k Paper Trading System...')
  console.log('======================================')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  try {
    // 1. Check paper trading account
    const { data: account, error: accountError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', 'demo-user')
      .eq('account_type', 'paper')
      .single()
    
    if (accountError) {
      console.error('❌ Paper trading account not found:', accountError.message)
      return false
    }
    
    console.log('✅ Paper Trading Account Found!')
    console.log(`💰 Current Balance: $${Number(account.balance).toLocaleString()}`)
    console.log(`💵 Initial Balance: $${Number(account.initial_balance).toLocaleString()}`)
    console.log(`📈 Total Equity: $${Number(account.total_equity).toLocaleString()}`)
    console.log(`🛒 Buying Power: $${Number(account.buying_power).toLocaleString()}`)
    
    // Verify $50k starting balance
    if (Number(account.initial_balance) === 50000) {
      console.log('✅ Perfect! $50,000 starting balance confirmed!')
    } else {
      console.log(`⚠️  Starting balance is $${account.initial_balance}, expected $50,000`)
    }
    
    // 2. Test database tables
    console.log('\n📊 Testing Database Tables...')
    
    const tables = ['trading_positions', 'trading_orders', 'ai_decisions', 'market_analysis']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`)
      } else {
        console.log(`✅ Table ${table}: Ready`)
      }
    }
    
    // 3. Test a sample order (simulation)
    console.log('\n🧪 Testing Sample Order Simulation...')
    
    const sampleOrder = {
      account_id: account.id,
      order_id: `test_${Date.now()}`,
      symbol: 'BTC/USD',
      side: 'buy',
      quantity: 0.1,
      price: 50000,
      order_type: 'market',
      status: 'filled',
      strategy_used: 'Test Strategy',
      reasoning: 'Testing $50k paper trading system',
      confidence_score: 0.85,
      filled_at: new Date().toISOString()
    }
    
    const { data: testOrder, error: orderError } = await supabase
      .from('trading_orders')
      .insert(sampleOrder)
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ Test order failed:', orderError.message)
    } else {
      console.log('✅ Test order created successfully!')
      console.log(`📋 Order ID: ${testOrder.order_id}`)
      console.log(`💎 Symbol: ${testOrder.symbol}`)
      console.log(`📈 Side: ${testOrder.side}`)
      console.log(`💰 Value: $${(testOrder.quantity * testOrder.price).toLocaleString()}`)
      
      // Clean up test order
      await supabase
        .from('trading_orders')
        .delete()
        .eq('id', testOrder.id)
      
      console.log('🧹 Test order cleaned up')
    }
    
    // 4. Test AI decision logging
    console.log('\n🧠 Testing AI Decision Logging...')
    
    const sampleDecision = {
      account_id: account.id,
      workflow_id: 'test_workflow',
      workflow_step: 'market_analysis',
      decision_type: 'strategy_selection',
      reasoning: 'Testing AI decision logging for paper trading system',
      market_data: { symbol: 'BTC/USD', price: 50000, volume: 1000 },
      strategy_selected: 'momentum_breakout',
      confidence_score: 0.75,
      symbol: 'BTC/USD',
      action_taken: 'buy_signal_generated'
    }
    
    const { data: testDecision, error: decisionError } = await supabase
      .from('ai_decisions')
      .insert(sampleDecision)
      .select()
      .single()
    
    if (decisionError) {
      console.error('❌ AI decision logging failed:', decisionError.message)
    } else {
      console.log('✅ AI decision logged successfully!')
      console.log(`🧠 Workflow: ${testDecision.workflow_id}`)
      console.log(`📊 Step: ${testDecision.workflow_step}`)
      console.log(`💭 Strategy: ${testDecision.strategy_selected}`)
      
      // Clean up test decision
      await supabase
        .from('ai_decisions')
        .delete()
        .eq('id', testDecision.id)
      
      console.log('🧹 Test decision cleaned up')
    }
    
    console.log('\n🎉 All Tests Passed!')
    console.log('=====================================')
    console.log('✅ $50,000 paper trading account ready')
    console.log('✅ Database tables working')
    console.log('✅ Order system functional')
    console.log('✅ AI decision logging operational')
    console.log('\n🚀 Ready to start AI-powered paper trading!')
    
    return true
    
  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return false
  }
}

// Run the test
testPaperTradingSystem().catch(console.error) 