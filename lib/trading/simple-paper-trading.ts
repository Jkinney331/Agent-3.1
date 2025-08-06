import { tradingDB } from '@/lib/database/supabase-client'

export interface SimpleTradeExecutionResult {
  success: boolean
  orderId?: string
  message: string
  executedPrice?: number
  executedQuantity?: number
}

export class SimplePaperTradingEngine {
  private account: any = null

  async initialize(userId: string = 'demo-user') {
    try {
      // Get or create trading account
      let account = await tradingDB.getAccount(userId)
      
      if (!account) {
        account = await tradingDB.initializePaperAccount(userId)
        console.log(`✅ Initialized new paper trading account with $50,000`)
      }

      this.account = account
      console.log(`📊 Paper Trading Account Status:`)
      console.log(`   Balance: $${account.balance.toLocaleString()}`)

      return account
    } catch (error) {
      console.error('❌ Failed to initialize simple paper trading engine:', error)
      throw error
    }
  }

  async executeOrder(order: {
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    orderType?: 'market' | 'limit'
    price?: number
    strategy: string
    reasoning: string
    confidence: number
  }): Promise<SimpleTradeExecutionResult> {
    try {
      console.log(`🚀 Executing simple order: ${order.side} ${order.quantity} ${order.symbol}`)

      if (!this.account) {
        await this.initialize()
      }

      // Get current market price
      const marketPrice = this.getMockPrice(order.symbol)
      const executionPrice = order.orderType === 'limit' && order.price ? order.price : marketPrice
      
      // Create order in database with correct schema
      const dbOrder = await tradingDB.createOrder({
        account_id: this.account.id,
        symbol: order.symbol,
        side: order.side, // Keep as 'buy'/'sell' for orders
        order_type: order.orderType || 'market',
        quantity: order.quantity,
        price: executionPrice, // Always provide a price
        status: 'filled', // Immediately fill for paper trading
        strategy_used: order.strategy,
        reasoning: order.reasoning, // Use 'reasoning' to match current DB
        confidence_score: order.confidence
      })

      // Update the order with filled_at timestamp
      await tradingDB.updateOrderStatus(dbOrder.id, 'filled', new Date().toISOString())

      // Create position if buying
      if (order.side === 'buy') {
        await tradingDB.createPosition({
          account_id: this.account.id,
          symbol: order.symbol,
          quantity: order.quantity,
          avg_cost: executionPrice, // Use avg_cost instead of entry_price
          current_price: executionPrice,
          market_value: order.quantity * executionPrice,
          unrealized_pnl: 0,
          side: 'long' // Use 'long' for positions
        })
      }

      console.log(`✅ Order executed successfully: ${dbOrder.id}`)

      return {
        success: true,
        orderId: dbOrder.id,
        message: `Order executed successfully at $${executionPrice}`,
        executedPrice: executionPrice,
        executedQuantity: order.quantity
      }

    } catch (error) {
      console.error('❌ Simple order execution failed:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private getMockPrice(symbol: string): number {
    const mockPrices: { [key: string]: number } = {
      'BTC/USD': 114776,
      'ETH/USD': 3000,
      'ADA/USD': 0.5,
      'SOL/USD': 100,
      'AAPL': 150,
      'GOOGL': 2800,
      'TSLA': 800
    }
    return mockPrices[symbol] || 100
  }

  getAccount() { return this.account }
  
  async getAllPositions() {
    if (!this.account) return []
    return await tradingDB.getPositions(this.account.id)
  }

  async getAllOrders(limit = 50) {
    if (!this.account) return []
    return await tradingDB.getOrders(this.account.id, limit)
  }

  async getPortfolioMetrics() {
    if (!this.account) return null
    
    const positions = await this.getAllPositions()
    const orders = await this.getAllOrders(100)
    
    const totalValue = this.account.balance + positions.reduce((sum, pos) => sum + pos.market_value, 0)
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0)
    
    return {
      totalValue,
      totalPnL,
      totalPnLPercent: totalPnL / this.account.initial_balance * 100,
      dayPnL: 0,
      dayPnLPercent: 0,
      winRate: 0,
      totalTrades: orders.length,
      activePositions: positions.length,
      availableBalance: this.account.balance,
      marginUsed: 0
    }
  }

  // Compatibility methods
  async closePosition(symbol: string, reason: string) {
    return { success: true, message: `Position ${symbol} closed: ${reason}` }
  }
  async enableAutoTrading() { console.log('✅ Auto trading enabled') }
  async disableAutoTrading() { console.log('❌ Auto trading disabled') }
  async processAISignals() { console.log('🤖 Processing AI signals') }
  isAutoTradingEnabled() { return false }
  getConfig() {
    return {
      enabled: true,
      initialBalance: 50000,
      maxPositions: 5,
      maxPositionSize: 0.2,
      allowedSymbols: ['BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD', 'AAPL', 'GOOGL', 'TSLA']
    }
  }
  updateConfig(config: any) { console.log('📝 Config updated', config) }
}

export const simplePaperTradingEngine = new SimplePaperTradingEngine() 