import { tradingDB, TradingAccount, TradingOrder, TradingPosition } from '@/lib/database/supabase-client'
import { adaptiveStrategyManager, StrategySignal } from './adaptive-strategy-manager'
import { alpacaClient } from './exchanges/alpaca-client'

export interface PaperTradingConfig {
  enabled: boolean
  initialBalance: number
  maxPositions: number
  maxPositionSize: number
  riskPerTrade: number
  autoTradingEnabled: boolean
  stopLossPercent: number
  takeProfitPercent: number
  allowedSymbols: string[]
}

export interface TradeExecutionResult {
  success: boolean
  orderId?: string
  message: string
  executedPrice?: number
  executedQuantity?: number
  estimatedFees?: number
}

export interface PortfolioMetrics {
  totalValue: number
  totalPnL: number
  totalPnLPercent: number
  dayPnL: number
  dayPnLPercent: number
  winRate: number
  totalTrades: number
  activePositions: number
  availableBalance: number
  marginUsed: number
}

export class EnhancedPaperTradingEngine {
  private config: PaperTradingConfig
  private account: TradingAccount | null = null
  private isInitialized = false

  constructor() {
    this.config = {
      enabled: true,
      initialBalance: 50000,
      maxPositions: 5,
      maxPositionSize: 0.2, // 20% of portfolio
      riskPerTrade: 0.02, // 2% risk per trade
      autoTradingEnabled: false,
      stopLossPercent: 0.05, // 5%
      takeProfitPercent: 0.10, // 10%
      allowedSymbols: [
        'BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD', 'MATIC/USD',
        'DOT/USD', 'LINK/USD', 'UNI/USD', 'AAVE/USD', 'SUSHI/USD',
        'COMP/USD', 'MKR/USD', 'SNX/USD', 'YFI/USD', 'CRV/USD',
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META',
        'NFLX', 'AMD', 'INTC', 'CRM', 'ADBE', 'PYPL', 'SQ'
      ]
    }
  }

  async initialize(userId: string): Promise<void> {
    try {
      // Check database connection status
      const dbStatus = tradingDB.getStatus()
      console.log(`📊 Database Status: ${dbStatus.storageMode} mode`)
      
      if (dbStatus.storageMode === 'in-memory') {
        console.log('📝 Using in-memory storage for this session - data will not persist')
      }

      // Get or create trading account with fallback handling
      let account = await tradingDB.getAccount(userId)
      
      if (!account) {
        account = await tradingDB.initializePaperAccount(userId)
        console.log(`✅ Initialized new paper trading account with $${this.config.initialBalance}`)
      }

      this.account = account
      this.isInitialized = true

      console.log(`📊 Paper Trading Account Status:`)
      console.log(`   Storage Mode: ${dbStatus.storageMode}`)
      console.log(`   Account ID: ${account.id}`)
      console.log(`   Balance: $${account.balance.toLocaleString()}`)
      console.log(`   Total Equity: $${account.total_equity.toLocaleString()}`)
      console.log(`   Buying Power: $${account.buying_power.toLocaleString()}`)

      // Try to sync with Alpaca on initialization only if account was successfully loaded
      if (this.account) {
        try {
          await this.syncWithAlpaca()
        } catch (error) {
          console.log('⚠️ Could not sync with Alpaca on initialization (API may be unavailable)')
        }
      }

      // Log initialization success
      console.log(`✅ Paper trading engine initialized successfully for user: ${userId}`)

    } catch (error) {
      console.error('❌ Failed to initialize paper trading engine:', error)
      
      // Try to create a fallback account in case of complete database failure
      if (!this.account) {
        console.log('🔄 Attempting to create fallback in-memory account...')
        try {
          this.account = {
            id: `fallback-${Date.now()}`,
            user_id: userId,
            account_type: 'paper',
            balance: this.config.initialBalance,
            initial_balance: this.config.initialBalance,
            total_equity: this.config.initialBalance,
            buying_power: this.config.initialBalance,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          this.isInitialized = true
          console.log('✅ Fallback account created - limited functionality available')
        } catch (fallbackError) {
          console.error('❌ Failed to create fallback account:', fallbackError)
          throw new Error(`Failed to initialize paper trading engine: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
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
  }): Promise<TradeExecutionResult> {
    if (!this.isInitialized || !this.account) {
      return {
        success: false,
        message: 'Paper trading engine not initialized'
      }
    }

    try {
      console.log(`🔄 Executing ${order.side.toUpperCase()} order for ${order.symbol} (${order.quantity} units)`)
      
      // Validate order
      const validation = await this.validateOrder(order)
      if (!validation.valid) {
        console.log(`❌ Order validation failed: ${validation.reason}`)
        return {
          success: false,
          message: validation.reason || 'Order validation failed'
        }
      }

      // Get current market price from Alpaca or fallback to mock
      const marketPrice = await this.getCurrentPrice(order.symbol)
      const executionPrice = order.orderType === 'limit' && order.price ? order.price : marketPrice
      
      // Calculate fees (0.1% for paper trading simulation)
      const notionalValue = order.quantity * executionPrice
      const estimatedFees = notionalValue * 0.001

      // Create order in database with error handling
      let dbOrder
      try {
        dbOrder = await tradingDB.createOrder({
          account_id: this.account.id,
          symbol: order.symbol,
          side: order.side,
          order_type: order.orderType || 'market',
          quantity: order.quantity,
          price: order.price || executionPrice,
          status: 'pending',
          strategy_used: order.strategy,
          reasoning: order.reasoning,
          confidence_score: order.confidence
        })
        console.log(`📝 Order created with ID: ${dbOrder.id}`)
      } catch (dbError) {
        console.log(`⚠️ Failed to create order in database: ${dbError}, continuing with execution...`)
        // Create a fallback order object for execution
        dbOrder = {
          id: `temp-${Date.now()}`,
          account_id: this.account.id,
          symbol: order.symbol,
          side: order.side,
          order_type: order.orderType || 'market',
          quantity: order.quantity,
          price: order.price || executionPrice,
          status: 'pending',
          strategy_used: order.strategy,
          reasoning: order.reasoning,
          confidence_score: order.confidence,
          created_at: new Date().toISOString()
        } as TradingOrder
      }

      // Try to execute through Alpaca for US equities, otherwise simulate
      let executionResult
      if (this.isUSEquity(order.symbol)) {
        executionResult = await this.executeRealOrder(order, executionPrice, estimatedFees, dbOrder.id)
      } else {
        executionResult = await this.simulateExecution(dbOrder, executionPrice, estimatedFees)
      }

      if (executionResult.success) {
        // Update order status with error handling
        try {
          await tradingDB.updateOrderStatus(dbOrder.id, 'filled', new Date().toISOString())
        } catch (error) {
          console.log(`⚠️ Failed to update order status in database: ${error}`)
        }

        // Update or create position with error handling
        try {
          await this.updatePosition(order, executionPrice, estimatedFees)
        } catch (error) {
          console.log(`⚠️ Failed to update position in database: ${error}`)
          // Update local account balance at minimum
          this.updateLocalAccountBalance(order, executionPrice, estimatedFees)
        }

        // Update account balance with error handling
        try {
          await this.updateAccountBalance(order, executionPrice, estimatedFees)
        } catch (error) {
          console.log(`⚠️ Failed to update account balance in database: ${error}`)
          // Update local account as fallback
          this.updateLocalAccountBalance(order, executionPrice, estimatedFees)
        }
      } else {
        try {
          await tradingDB.updateOrderStatus(dbOrder.id, 'rejected')
        } catch (error) {
          console.log(`⚠️ Failed to update rejected order status: ${error}`)
        }
      }

      return {
        success: executionResult.success,
        orderId: dbOrder.id,
        message: executionResult.message,
        executedPrice: executionPrice,
        executedQuantity: order.quantity,
        estimatedFees
      }

    } catch (error) {
      console.error('❌ Order execution failed:', error)
      return {
        success: false,
        message: `Order execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Update local account balance when database operations fail
   */
  private updateLocalAccountBalance(order: any, executionPrice: number, fees: number): void {
    if (!this.account) return

    const notionalValue = order.quantity * executionPrice
    const totalCost = notionalValue + fees

    if (order.side === 'buy') {
      this.account.balance -= totalCost
      this.account.buying_power -= totalCost
    } else {
      this.account.balance += notionalValue - fees
      this.account.buying_power += notionalValue - fees
    }

    // Simple equity calculation without position data
    this.account.total_equity = this.account.balance
    this.account.updated_at = new Date().toISOString()

    console.log(`📊 Local account updated - Balance: $${this.account.balance.toLocaleString()}`)
  }

  async processAISignals(): Promise<void> {
    if (!this.isInitialized || !this.account || !this.config.autoTradingEnabled) {
      return
    }

    try {
      console.log('🤖 Processing AI trading signals...')

      // Get signals for allowed symbols
      for (const symbol of this.config.allowedSymbols.slice(0, 5)) { // Process first 5 symbols
        const signals = await adaptiveStrategyManager.generateSignals(symbol, this.account.id)
        
        for (const signal of signals) {
          await this.processSignal(signal)
        }
      }

    } catch (error) {
      console.error('❌ Error processing AI signals:', error)
    }
  }

  private async processSignal(signal: StrategySignal): Promise<void> {
    if (!this.account) return

    const { strategy, signal: action, strength, confidence, reasoning } = signal

    // Only process high-confidence signals
    if (confidence < 0.7 || strength < 0.6) {
      console.log(`⏭️  Skipping low-confidence signal for ${signal.strategy.name}: confidence=${confidence.toFixed(2)}, strength=${strength.toFixed(2)}`)
      return
    }

    // Check if we already have a position in this symbol
    const existingPositions = await tradingDB.getPositions(this.account.id)
    const existingPosition = existingPositions.find(p => p.symbol === signal.strategy.name) // This should be the symbol, adjust as needed

    if (action === 'hold' || (existingPosition && action === 'buy') || (!existingPosition && action === 'sell')) {
      return
    }

    // Calculate position size based on risk management
    const positionSize = this.calculatePositionSize(signal)

    const order = {
      symbol: signal.strategy.name, // This should be the actual symbol
      side: action,
      quantity: positionSize,
      strategy: strategy.name,
      reasoning,
      confidence
    }

    console.log(`📈 Executing AI signal: ${action.toUpperCase()} ${order.symbol} (${positionSize} units) - ${strategy.name}`)
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}% | Strength: ${(strength * 100).toFixed(1)}%`)
    console.log(`   Reasoning: ${reasoning}`)

    await this.executeOrder(order)
  }

  private calculatePositionSize(signal: StrategySignal): number {
    if (!this.account) return 0

    const { strategy, stopLoss } = signal
    const currentPrice = 50000 // Mock price - replace with actual price fetching
    
    // Risk-based position sizing
    const riskAmount = this.account.balance * this.config.riskPerTrade
    const stopLossDistance = Math.abs(currentPrice - stopLoss) / currentPrice
    
    if (stopLossDistance === 0) return 0
    
    const positionValue = riskAmount / stopLossDistance
    const maxPositionValue = this.account.balance * this.config.maxPositionSize
    
    const finalPositionValue = Math.min(positionValue, maxPositionValue)
    const positionSize = finalPositionValue / currentPrice
    
    return Math.max(0.001, positionSize) // Minimum position size
  }

  private async validateOrder(order: any): Promise<{ valid: boolean; reason?: string }> {
    if (!this.account) {
      return { valid: false, reason: 'No trading account found' }
    }

    // Check if symbol is allowed
    if (!this.config.allowedSymbols.includes(order.symbol)) {
      return { valid: false, reason: `Symbol ${order.symbol} not in allowed list` }
    }

    // Check position limits with error handling
    try {
      const currentPositions = await tradingDB.getPositions(this.account.id)
      if (order.side === 'buy' && currentPositions.length >= this.config.maxPositions) {
        return { valid: false, reason: 'Maximum position limit reached' }
      }
    } catch (error) {
      console.log(`⚠️ Could not validate position limits due to database error: ${error}`)
      // Continue with validation - assume position limit is OK if we can't check
    }

    // Check available balance for buy orders
    if (order.side === 'buy') {
      try {
        const currentPrice = await this.getCurrentPrice(order.symbol)
        const requiredBalance = order.quantity * currentPrice * 1.001 // Include 0.1% fees
        
        if (requiredBalance > this.account.buying_power) {
          return { valid: false, reason: 'Insufficient buying power' }
        }
      } catch (error) {
        console.log(`⚠️ Could not validate balance due to price fetch error: ${error}`)
        // Use a conservative approach - reject the order if we can't get price
        return { valid: false, reason: 'Unable to validate order due to price data unavailability' }
      }
    }

    return { valid: true }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Try to get real market data from Alpaca for US equities
    if (this.isUSEquity(symbol)) {
      try {
        // Try to get real data from Alpaca
        const positions = await alpacaClient.getPositions()
        const position = positions.find(p => p.symbol === symbol)
        if (position && position.current_price) {
          const price = parseFloat(position.current_price)
          console.log(`📊 Got real price for ${symbol} from Alpaca: $${price}`)
          return price
        }
        
        // If no position exists, we can't get current price from Alpaca without market data subscription
        console.log(`⚠️ No position found for ${symbol} in Alpaca, using fallback price`)
      } catch (error) {
        console.log(`⚠️ Failed to get Alpaca price for ${symbol}, using mock data:`, error)
      }
    }
    
    // Fallback to mock prices for demo purposes
    const mockPrices: { [key: string]: number } = {
      'BTC/USD': 50000 + (Math.random() - 0.5) * 1000,
      'ETH/USD': 3000 + (Math.random() - 0.5) * 100,
      'ADA/USD': 0.5 + (Math.random() - 0.5) * 0.1,
      'SOL/USD': 100 + (Math.random() - 0.5) * 10,
      'MATIC/USD': 0.8 + (Math.random() - 0.5) * 0.1,
      'AAPL': 150 + (Math.random() - 0.5) * 5,
      'GOOGL': 2800 + (Math.random() - 0.5) * 50,
      'MSFT': 420 + (Math.random() - 0.5) * 10,
      'AMZN': 180 + (Math.random() - 0.5) * 5,
      'TSLA': 800 + (Math.random() - 0.5) * 20,
      'NVDA': 900 + (Math.random() - 0.5) * 30,
      'META': 520 + (Math.random() - 0.5) * 15,
      'NFLX': 700 + (Math.random() - 0.5) * 20
    }

    return mockPrices[symbol] || 100
  }

  private isUSEquity(symbol: string): boolean {
    return !symbol.includes('/') && 
           ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 
            'NFLX', 'AMD', 'INTC', 'CRM', 'ADBE', 'PYPL', 'SQ'].includes(symbol)
  }

  private async executeRealOrder(order: any, executionPrice: number, fees: number, orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 Executing real order via Alpaca: ${order.side} ${order.quantity} ${order.symbol} at $${executionPrice}`)
      
      const alpacaOrder = await alpacaClient.placeOrder({
        symbol: order.symbol,
        qty: order.quantity.toString(),
        side: order.side,
        type: order.orderType || 'market',
        time_in_force: 'day',
        limit_price: order.orderType === 'limit' ? executionPrice : undefined,
        client_order_id: `paper_${orderId}`
      })

      console.log(`✅ Alpaca order placed successfully: ${alpacaOrder.id}`)
      
      return {
        success: true,
        message: `Real order executed via Alpaca: ${alpacaOrder.id} at $${executionPrice}`
      }
    } catch (error) {
      console.error(`❌ Alpaca order failed for ${order.symbol}:`, error)
      
      // Fallback to simulation if Alpaca fails
      console.log('📝 Falling back to simulated execution')
      return await this.simulateExecution({ id: orderId, side: order.side } as any, executionPrice, fees)
    }
  }

  private async simulateExecution(order: TradingOrder, price: number, fees: number): Promise<{ success: boolean; message: string }> {
    // Simulate market conditions and slippage
    const slippage = Math.random() * 0.002 // 0-0.2% slippage
    const executionPrice = order.side === 'buy' ? price * (1 + slippage) : price * (1 - slippage)
    
    // 95% execution success rate
    const executionSuccess = Math.random() < 0.95

    if (executionSuccess) {
      return {
        success: true,
        message: `Order executed at $${executionPrice.toFixed(2)} with ${(slippage * 100).toFixed(3)}% slippage`
      }
    } else {
      return {
        success: false,
        message: 'Order rejected due to market conditions'
      }
    }
  }

  private async updatePosition(order: any, executionPrice: number, fees: number): Promise<void> {
    if (!this.account) return

    const existingPositions = await tradingDB.getPositions(this.account.id)
    const existingPosition = existingPositions.find(p => p.symbol === order.symbol)

    if (existingPosition) {
      // Update existing position
      const newQuantity = order.side === 'buy' 
        ? existingPosition.quantity + order.quantity
        : existingPosition.quantity - order.quantity

      if (newQuantity <= 0) {
        // Position closed - this would typically remove the position
        // For now, we'll just set quantity to 0
        await tradingDB.updatePosition(existingPosition.id, {
          quantity: 0,
          current_price: executionPrice,
          market_value: 0,
          unrealized_pnl: (executionPrice - existingPosition.avg_cost) * existingPosition.quantity
        })
      } else {
        // Calculate new average entry price
        const totalCost = (existingPosition.avg_cost * existingPosition.quantity) + 
                         (executionPrice * order.quantity * (order.side === 'buy' ? 1 : -1))
        const newEntryPrice = totalCost / newQuantity

        await tradingDB.updatePosition(existingPosition.id, {
          quantity: newQuantity,
          avg_cost: newEntryPrice,
          current_price: executionPrice,
          market_value: newQuantity * executionPrice,
          unrealized_pnl: (executionPrice - newEntryPrice) * newQuantity
        })
      }
    } else if (order.side === 'buy') {
      // Create new position
      await tradingDB.createPosition({
        account_id: this.account.id,
        symbol: order.symbol,
        side: order.side === "buy" ? "long" : "short",
        quantity: order.quantity,
        avg_cost: executionPrice,
        current_price: executionPrice,
        market_value: order.quantity * executionPrice,
        unrealized_pnl: 0
      })
    }
  }

  private async updateAccountBalance(order: any, executionPrice: number, fees: number): Promise<void> {
    if (!this.account) return

    const notionalValue = order.quantity * executionPrice
    const totalCost = notionalValue + fees

    let newBalance = this.account.balance
    let newBuyingPower = this.account.buying_power

    if (order.side === 'buy') {
      newBalance -= totalCost
      newBuyingPower -= totalCost
    } else {
      newBalance += notionalValue - fees
      newBuyingPower += notionalValue - fees
    }

    // Calculate new total equity (balance + position values)
    const positions = await tradingDB.getPositions(this.account.id)
    const totalPositionValue = positions.reduce((sum, pos) => sum + pos.market_value, 0)
    const newTotalEquity = newBalance + totalPositionValue

    await tradingDB.updateAccount(this.account.id, {
      balance: newBalance,
      buying_power: newBuyingPower,
      total_equity: newTotalEquity
    })

    // Update local account object
    this.account.balance = newBalance
    this.account.buying_power = newBuyingPower
    this.account.total_equity = newTotalEquity
  }

  async getPortfolioMetrics(): Promise<PortfolioMetrics | null> {
    if (!this.account) return null

    try {
      const performanceData = await tradingDB.getPerformanceMetrics(this.account.id)
      
      return {
        totalValue: this.account.total_equity,
        totalPnL: this.account.total_equity - this.account.initial_balance,
        totalPnLPercent: ((this.account.total_equity - this.account.initial_balance) / this.account.initial_balance) * 100,
        dayPnL: 0, // Would calculate from daily data
        dayPnLPercent: 0,
        winRate: performanceData.winRate || 0,
        totalTrades: performanceData.totalTrades || 0,
        activePositions: performanceData.activePositions || 0,
        availableBalance: this.account.balance,
        marginUsed: this.account.total_equity - this.account.balance
      }
    } catch (error) {
      console.log(`⚠️ Failed to get performance data from database: ${error}`)
      // Return basic metrics using only account data
      return {
        totalValue: this.account.total_equity,
        totalPnL: this.account.total_equity - this.account.initial_balance,
        totalPnLPercent: ((this.account.total_equity - this.account.initial_balance) / this.account.initial_balance) * 100,
        dayPnL: 0,
        dayPnLPercent: 0,
        winRate: 0,
        totalTrades: 0,
        activePositions: 0,
        availableBalance: this.account.balance,
        marginUsed: this.account.total_equity - this.account.balance
      }
    }
  }

  async getAllPositions(): Promise<TradingPosition[]> {
    if (!this.account) return []
    
    try {
      return await tradingDB.getPositions(this.account.id)
    } catch (error) {
      console.log(`⚠️ Failed to get positions from database: ${error}`)
      return [] // Return empty array as fallback
    }
  }

  async getAllOrders(limit = 50): Promise<TradingOrder[]> {
    if (!this.account) return []
    
    try {
      return await tradingDB.getOrders(this.account.id, limit)
    } catch (error) {
      console.log(`⚠️ Failed to get orders from database: ${error}`)
      return [] // Return empty array as fallback
    }
  }

  async closePosition(symbol: string, reason = 'Manual close'): Promise<TradeExecutionResult> {
    if (!this.account) {
      throw new Error('No trading account found')
    }

    const positions = await tradingDB.getPositions(this.account.id)
    const position = positions.find(p => p.symbol === symbol)

    if (!position || position.quantity <= 0) {
      return {
        success: false,
        message: 'No position found to close'
      }
    }

    return await this.executeOrder({
      symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      quantity: position.quantity,
      strategy: 'Position Close',
      reasoning: reason,
      confidence: 0.9
    })
  }

  async enableAutoTrading(): Promise<void> {
    this.config.autoTradingEnabled = true
    console.log('🤖 Auto trading enabled')
  }

  async disableAutoTrading(): Promise<void> {
    this.config.autoTradingEnabled = false
    console.log('⏸️  Auto trading disabled')
  }

  isAutoTradingEnabled(): boolean {
    return this.config.autoTradingEnabled
  }

  getConfig(): PaperTradingConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<PaperTradingConfig>): void {
    this.config = { ...this.config, ...updates }
    console.log('⚙️  Paper trading configuration updated')
  }

  getAccount(): TradingAccount | null {
    return this.account
  }

  /**
   * Get database connection status and statistics
   */
  getDatabaseStatus(): any {
    return tradingDB.getStatus()
  }

  /**
   * Attempt to reconnect to database
   */
  async reconnectDatabase(): Promise<boolean> {
    try {
      const reconnected = await tradingDB.reconnect()
      if (reconnected) {
        console.log('✅ Successfully reconnected to Supabase database')
      } else {
        console.log('⚠️ Database reconnection failed, continuing with in-memory storage')
      }
      return reconnected
    } catch (error) {
      console.log(`❌ Database reconnection error: ${error}`)
      return false
    }
  }

  async syncWithAlpaca(): Promise<void> {
    if (!this.account) {
      console.log('⚠️ No account initialized, cannot sync with Alpaca')
      return
    }

    try {
      console.log('🔄 Syncing with Alpaca account data...')
      
      // Get Alpaca account data
      const alpacaAccount = await alpacaClient.getAccount()
      const alpacaPositions = await alpacaClient.getPositions()
      
      // Update local account with Alpaca data
      const updatedBalance = parseFloat(alpacaAccount.cash)
      const updatedEquity = parseFloat(alpacaAccount.equity)
      const updatedBuyingPower = parseFloat(alpacaAccount.buying_power)
      
      try {
        await tradingDB.updateAccount(this.account.id, {
          balance: updatedBalance,
          total_equity: updatedEquity,
          buying_power: updatedBuyingPower
        })
      } catch (error) {
        console.log(`⚠️ Failed to update account in database during Alpaca sync: ${error}`)
      }

      // Update local account object regardless of database success
      this.account.balance = updatedBalance
      this.account.total_equity = updatedEquity
      this.account.buying_power = updatedBuyingPower
      this.account.updated_at = new Date().toISOString()

      console.log(`✅ Synced with Alpaca - Balance: $${updatedBalance.toLocaleString()}, Equity: $${updatedEquity.toLocaleString()}`)
      
      // Sync positions with error handling
      try {
        await this.syncAlpacaPositions(alpacaPositions)
      } catch (error) {
        console.log(`⚠️ Failed to sync positions during Alpaca sync: ${error}`)
      }
      
    } catch (error) {
      console.error('❌ Failed to sync with Alpaca:', error)
      throw error // Re-throw to let caller know sync failed
    }
  }

  private async syncAlpacaPositions(alpacaPositions: any[]): Promise<void> {
    if (!this.account) return

    try {
      // Get current database positions with error handling
      let dbPositions: TradingPosition[] = []
      try {
        dbPositions = await tradingDB.getPositions(this.account.id)
      } catch (error) {
        console.log(`⚠️ Failed to get positions from database during sync: ${error}`)
        // Continue with empty positions list
      }
      
      // Update existing positions and add new ones
      for (const alpacaPos of alpacaPositions) {
        const existingPos = dbPositions.find(p => p.symbol === alpacaPos.symbol)
        
        const positionData = {
          symbol: alpacaPos.symbol,
          quantity: parseFloat(alpacaPos.qty),
          avg_cost: parseFloat(alpacaPos.avg_entry_price),
          current_price: parseFloat(alpacaPos.current_price),
          market_value: parseFloat(alpacaPos.market_value),
          unrealized_pnl: parseFloat(alpacaPos.unrealized_pl),
          side: alpacaPos.side as 'long' | 'short'
        }
        
        try {
          if (existingPos) {
            await tradingDB.updatePosition(existingPos.id, positionData)
            console.log(`🔄 Updated position: ${alpacaPos.symbol}`)
          } else {
            await tradingDB.createPosition({
              account_id: this.account.id,
              ...positionData
            })
            console.log(`➕ Added new position: ${alpacaPos.symbol}`)
          }
        } catch (error) {
          console.log(`⚠️ Failed to sync position ${alpacaPos.symbol}: ${error}`)
        }
      }
      
      // Remove positions that no longer exist in Alpaca
      const alpacaSymbols = alpacaPositions.map(p => p.symbol)
      for (const dbPos of dbPositions) {
        if (!alpacaSymbols.includes(dbPos.symbol)) {
          try {
            await tradingDB.updatePosition(dbPos.id, { quantity: 0 })
            console.log(`❌ Closed position: ${dbPos.symbol} (no longer in Alpaca)`)
          } catch (error) {
            console.log(`⚠️ Failed to close position ${dbPos.symbol}: ${error}`)
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to sync positions:', error)
      // Don't throw - this is not critical for operation
    }
  }

  async getAlpacaPortfolioData(): Promise<any> {
    try {
      const account = await alpacaClient.getAccount()
      const positions = await alpacaClient.getPositions()
      const orders = await alpacaClient.getOrders()
      
      return {
        account: {
          cash: parseFloat(account.cash),
          buyingPower: parseFloat(account.buying_power),
          portfolioValue: parseFloat(account.portfolio_value),
          equity: parseFloat(account.equity),
          dayPnL: parseFloat(account.equity) - parseFloat(account.last_equity),
          totalPnL: parseFloat(account.equity) - this.config.initialBalance
        },
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          quantity: parseFloat(pos.qty),
          marketValue: parseFloat(pos.market_value),
          unrealizedPnL: parseFloat(pos.unrealized_pl),
          unrealizedPnLPercent: parseFloat(pos.unrealized_plpc),
          side: pos.side,
          avgEntryPrice: parseFloat(pos.avg_entry_price),
          currentPrice: parseFloat(pos.current_price)
        })),
        recentOrders: orders.slice(0, 10).map(order => ({
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          quantity: parseFloat(order.qty || '0'),
          price: parseFloat((order.limit_price || order.filled_avg_price || '0').toString()),
          status: order.status,
          orderType: order.order_type,
          createdAt: order.created_at,
          filledAt: order.filled_at
        }))
      }
    } catch (error) {
      console.error('❌ Failed to get Alpaca portfolio data:', error)
      throw error
    }
  }
}

export const paperTradingEngine = new EnhancedPaperTradingEngine() 