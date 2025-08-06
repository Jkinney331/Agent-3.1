import { tradingDB, TradingAccount, TradingOrder, TradingPosition } from '@/lib/database/supabase-client'
import { adaptiveStrategyManager, StrategySignal } from './adaptive-strategy-manager'

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
      // Get or create trading account
      let account = await tradingDB.getAccount(userId)
      
      if (!account) {
        account = await tradingDB.initializePaperAccount(userId)
        console.log(`✅ Initialized new paper trading account with $${this.config.initialBalance}`)
      }

      this.account = account
      this.isInitialized = true

      console.log(`📊 Paper Trading Account Status:`)
      console.log(`   Balance: $${account.balance.toLocaleString()}`)
      console.log(`   Total Equity: $${account.total_equity.toLocaleString()}`)
      console.log(`   Buying Power: $${account.buying_power.toLocaleString()}`)

    } catch (error) {
      console.error('❌ Failed to initialize paper trading engine:', error)
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
  }): Promise<TradeExecutionResult> {
    if (!this.isInitialized || !this.account) {
      throw new Error('Paper trading engine not initialized')
    }

    try {
      // Validate order
      const validation = await this.validateOrder(order)
      if (!validation.valid) {
        return {
          success: false,
          message: validation.reason || 'Order validation failed'
        }
      }

      // Get current market price (mock for now)
      const marketPrice = await this.getCurrentPrice(order.symbol)
      const executionPrice = order.orderType === 'limit' && order.price ? order.price : marketPrice
      
      // Calculate fees (0.1% for paper trading simulation)
      const notionalValue = order.quantity * executionPrice
      const estimatedFees = notionalValue * 0.001

      // Create order in database
      const dbOrder = await tradingDB.createOrder({
        account_id: this.account.id,
        symbol: order.symbol,
        side: order.side === "buy" ? "long" : "short",
        order_type: order.orderType || 'market',
        quantity: order.quantity,
        price: order.price || executionPrice,  // Use execution price if order price is not provided
        status: 'pending',
        strategy_used: order.strategy,
        reasoning: order.reasoning,  // Using reasoning to match current DB schema
        confidence_score: order.confidence
      })

      // Execute the trade
      const executionResult = await this.simulateExecution(dbOrder, executionPrice, estimatedFees)

      if (executionResult.success) {
        // Update order status
        await tradingDB.updateOrderStatus(dbOrder.id, 'filled', new Date().toISOString())

        // Update or create position
        await this.updatePosition(order, executionPrice, estimatedFees)

        // Update account balance
        await this.updateAccountBalance(order, executionPrice, estimatedFees)
      } else {
        await tradingDB.updateOrderStatus(dbOrder.id, 'rejected')
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

    // Check position limits
    const currentPositions = await tradingDB.getPositions(this.account.id)
    if (order.side === 'buy' && currentPositions.length >= this.config.maxPositions) {
      return { valid: false, reason: 'Maximum position limit reached' }
    }

    // Check available balance for buy orders
    if (order.side === 'buy') {
      const currentPrice = await this.getCurrentPrice(order.symbol)
      const requiredBalance = order.quantity * currentPrice * 1.001 // Include 0.1% fees
      
      if (requiredBalance > this.account.buying_power) {
        return { valid: false, reason: 'Insufficient buying power' }
      }
    }

    return { valid: true }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // Mock price data - replace with actual API calls
    const mockPrices: { [key: string]: number } = {
      'BTC/USD': 50000 + (Math.random() - 0.5) * 1000,
      'ETH/USD': 3000 + (Math.random() - 0.5) * 100,
      'ADA/USD': 0.5 + (Math.random() - 0.5) * 0.1,
      'SOL/USD': 100 + (Math.random() - 0.5) * 10,
      'AAPL': 150 + (Math.random() - 0.5) * 5,
      'GOOGL': 2800 + (Math.random() - 0.5) * 50,
      'TSLA': 800 + (Math.random() - 0.5) * 20
    }

    return mockPrices[symbol] || 100
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
        unrealized_pnl: 0,
        strategy_used: order.strategy,
        confidence_score: order.confidence
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

    const performanceData = await tradingDB.getPerformanceMetrics(this.account.id)
    
    return {
      totalValue: this.account.total_equity,
      totalPnL: this.account.total_equity - this.account.initial_balance,
      totalPnLPercent: ((this.account.total_equity - this.account.initial_balance) / this.account.initial_balance) * 100,
      dayPnL: 0, // Would calculate from daily data
      dayPnLPercent: 0,
      winRate: performanceData.winRate,
      totalTrades: performanceData.totalOrders,
      activePositions: performanceData.totalPositionsValue > 0 ? 1 : 0, // Simplified
      availableBalance: this.account.balance,
      marginUsed: this.account.total_equity - this.account.balance
    }
  }

  async getAllPositions(): Promise<TradingPosition[]> {
    if (!this.account) return []
    return await tradingDB.getPositions(this.account.id)
  }

  async getAllOrders(limit = 50): Promise<TradingOrder[]> {
    if (!this.account) return []
    return await tradingDB.getOrders(this.account.id, limit)
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
      side: position.side === 'buy' ? 'sell' : 'buy',
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
}

export const paperTradingEngine = new EnhancedPaperTradingEngine() 