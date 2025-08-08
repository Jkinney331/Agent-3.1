import { createClient } from '@supabase/supabase-js'

// Database connection state management
let supabaseClient: any = null
let supabaseAdmin: any = null
let isSupabaseAvailable = false
let connectionAttempted = false

// In-memory fallback storage
class InMemoryStorage {
  private accounts = new Map<string, TradingAccount>()
  private positions = new Map<string, TradingPosition[]>()
  private orders = new Map<string, TradingOrder[]>()
  private aiDecisions = new Map<string, AIDecision[]>()
  private marketAnalysis = new Map<string, MarketAnalysis[]>()
  private idCounter = 1

  generateId(): string {
    return `mem-${Date.now()}-${this.idCounter++}`
  }

  // Account operations
  setAccount(userId: string, account: TradingAccount): void {
    this.accounts.set(userId, account)
  }

  getAccount(userId: string): TradingAccount | null {
    return this.accounts.get(userId) || null
  }

  updateAccount(accountId: string, updates: Partial<TradingAccount>): void {
    for (const [userId, account] of this.accounts.entries()) {
      if (account.id === accountId) {
        this.accounts.set(userId, { ...account, ...updates, updated_at: new Date().toISOString() })
        break
      }
    }
  }

  // Position operations
  setPositions(accountId: string, positions: TradingPosition[]): void {
    this.positions.set(accountId, positions)
  }

  getPositions(accountId: string): TradingPosition[] {
    return this.positions.get(accountId) || []
  }

  addPosition(accountId: string, position: TradingPosition): void {
    const existing = this.positions.get(accountId) || []
    existing.push(position)
    this.positions.set(accountId, existing)
  }

  updatePosition(positionId: string, updates: Partial<TradingPosition>): void {
    for (const [accountId, positions] of this.positions.entries()) {
      const index = positions.findIndex(p => p.id === positionId)
      if (index >= 0) {
        positions[index] = { ...positions[index], ...updates, updated_at: new Date().toISOString() }
        break
      }
    }
  }

  // Order operations
  setOrders(accountId: string, orders: TradingOrder[]): void {
    this.orders.set(accountId, orders)
  }

  getOrders(accountId: string, limit = 50): TradingOrder[] {
    const orders = this.orders.get(accountId) || []
    return orders.slice(0, limit)
  }

  addOrder(accountId: string, order: TradingOrder): void {
    const existing = this.orders.get(accountId) || []
    existing.unshift(order) // Add to beginning for chronological order
    this.orders.set(accountId, existing)
  }

  updateOrderStatus(orderId: string, status: TradingOrder['status'], filledAt?: string): void {
    for (const [accountId, orders] of this.orders.entries()) {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        order.status = status
        if (filledAt) order.filled_at = filledAt
        break
      }
    }
  }

  // AI decision operations
  addAIDecision(accountId: string, decision: AIDecision): void {
    const existing = this.aiDecisions.get(accountId) || []
    existing.unshift(decision)
    this.aiDecisions.set(accountId, existing.slice(0, 100)) // Keep only last 100
  }

  getAIDecisions(accountId: string, limit = 100): AIDecision[] {
    const decisions = this.aiDecisions.get(accountId) || []
    return decisions.slice(0, limit)
  }

  // Market analysis operations
  addMarketAnalysis(symbol: string, analysis: MarketAnalysis): void {
    const existing = this.marketAnalysis.get(symbol) || []
    existing.unshift(analysis)
    this.marketAnalysis.set(symbol, existing.slice(0, 50)) // Keep only last 50
  }

  getLatestAnalysis(symbol: string, analysisType?: string): MarketAnalysis | null {
    const analyses = this.marketAnalysis.get(symbol) || []
    if (analysisType) {
      return analyses.find(a => a.analysis_type === analysisType) || null
    }
    return analyses[0] || null
  }

  clear(): void {
    this.accounts.clear()
    this.positions.clear()
    this.orders.clear()
    this.aiDecisions.clear()
    this.marketAnalysis.clear()
    this.idCounter = 1
    console.log('📝 In-memory storage cleared')
  }

  getStats(): any {
    return {
      accounts: this.accounts.size,
      totalPositions: Array.from(this.positions.values()).reduce((sum, positions) => sum + positions.length, 0),
      totalOrders: Array.from(this.orders.values()).reduce((sum, orders) => sum + orders.length, 0),
      totalAIDecisions: Array.from(this.aiDecisions.values()).reduce((sum, decisions) => sum + decisions.length, 0),
      totalMarketAnalyses: Array.from(this.marketAnalysis.values()).reduce((sum, analyses) => sum + analyses.length, 0)
    }
  }
}

const inMemoryStorage = new InMemoryStorage()

/**
 * Initialize Supabase connection with proper error handling
 */
async function initializeSupabase(): Promise<boolean> {
  if (connectionAttempted) {
    return isSupabaseAvailable
  }

  connectionAttempted = true

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check if environment variables are set and not template values
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl.includes('your-project.supabase.co') || 
        supabaseAnonKey.includes('your-supabase')) {
      console.log('⚠️ Supabase environment variables not properly configured, using in-memory storage')
      return false
    }

    // Create clients
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    if (supabaseServiceRole && !supabaseServiceRole.includes('your-supabase')) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)
    }

    // Test the connection by making a simple query
    const { data, error } = await supabaseClient
      .from('trading_accounts')
      .select('count', { count: 'exact', head: true })

    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is OK
      console.log(`⚠️ Supabase connection test failed: ${error.message}, falling back to in-memory storage`)
      return false
    }

    isSupabaseAvailable = true
    console.log('✅ Supabase connection established successfully')
    return true
  } catch (error) {
    console.log('⚠️ Failed to initialize Supabase, falling back to in-memory storage:', error)
    return false
  }
}

// Initialize connection on module load
initializeSupabase().catch(() => {
  console.log('📝 Using in-memory storage for this session')
})

// Export clients (may be null if not available)
export const supabase = supabaseClient
export const supabaseAdminClient = supabaseAdmin
export { inMemoryStorage }

// Database Tables Schema - Updated to match current database
export interface TradingAccount {
  id: string
  user_id: string
  account_type: 'paper' | 'live'
  balance: number
  initial_balance: number
  total_equity: number
  buying_power: number
  created_at: string
  updated_at: string
}

export interface TradingPosition {
  id: string
  account_id: string
  symbol: string
  quantity: number
  avg_cost: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  side: 'long' | 'short'
  created_at: string
  updated_at: string
}

export interface TradingOrder {
  id: string
  account_id: string
  symbol: string
  side: 'buy' | 'sell' | 'long' | 'short'  // Support both formats
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit'
  quantity: number
  price: number
  status: 'pending' | 'filled' | 'cancelled' | 'rejected'
  strategy_used: string
  reasoning: string  // Using 'reasoning' instead of 'ai_reasoning' to match current DB
  confidence_score: number
  realized_pnl?: number
  created_at: string
  filled_at?: string
}

export interface AIDecision {
  id: string
  account_id: string
  decision_type: 'buy' | 'sell' | 'hold' | 'strategy_change'
  symbol?: string
  reasoning: string
  confidence_score: number
  market_conditions: any
  data_analyzed: any
  strategy_selected: string
  outcome?: 'success' | 'failure' | 'pending'
  created_at: string
}

export interface MarketAnalysis {
  id: string
  symbol: string
  timeframe: string
  analysis_type: 'technical' | 'fundamental' | 'sentiment' | 'combined'
  indicators: any
  signals: any
  confidence_score: number
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  created_at: string
}

// Database Operations with Fallback Support
export class TradingDatabase {
  private async withFallback<T>(
    supabaseOperation: () => Promise<T>,
    fallbackOperation: () => T,
    operationName: string
  ): Promise<T> {
    // Check if Supabase is available
    if (isSupabaseAvailable && supabaseClient) {
      try {
        return await supabaseOperation()
      } catch (error) {
        console.log(`⚠️ Supabase operation '${operationName}' failed, falling back to in-memory storage:`, error)
        // Mark Supabase as unavailable and fallback
        isSupabaseAvailable = false
        return fallbackOperation()
      }
    } else {
      // Use in-memory storage directly
      return fallbackOperation()
    }
  }
  
  /**
   * Check if database connection is available
   */
  async isConnected(): Promise<boolean> {
    return await initializeSupabase()
  }

  /**
   * Get storage statistics and connection status
   */
  getStatus(): any {
    return {
      supabaseAvailable: isSupabaseAvailable,
      connectionAttempted,
      inMemoryStats: inMemoryStorage.getStats(),
      storageMode: isSupabaseAvailable ? 'supabase' : 'in-memory'
    }
  }

  /**
   * Force reconnection attempt to Supabase
   */
  async reconnect(): Promise<boolean> {
    connectionAttempted = false
    isSupabaseAvailable = false
    return await initializeSupabase()
  }
  
  // Account Management
  async initializePaperAccount(userId: string): Promise<TradingAccount> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('trading_accounts')
          .insert({
            user_id: userId,
            account_type: 'paper',
            balance: 50000,
            initial_balance: 50000,
            total_equity: 50000,
            buying_power: 50000
          })
          .select()
          .single()

        if (error) throw error
        return data
      },
      () => {
        const account: TradingAccount = {
          id: inMemoryStorage.generateId(),
          user_id: userId,
          account_type: 'paper',
          balance: 50000,
          initial_balance: 50000,
          total_equity: 50000,
          buying_power: 50000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        inMemoryStorage.setAccount(userId, account)
        console.log(`📝 Created in-memory paper account for user: ${userId}`)
        return account
      },
      'initializePaperAccount'
    )
  }

  async getAccount(userId: string): Promise<TradingAccount | null> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('trading_accounts')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
      },
      () => {
        return inMemoryStorage.getAccount(userId)
      },
      'getAccount'
    )
  }

  async updateAccount(accountId: string, updates: Partial<TradingAccount>): Promise<void> {
    return this.withFallback(
      async () => {
        const { error } = await supabaseClient
          .from('trading_accounts')
          .update(updates)
          .eq('id', accountId)

        if (error) throw error
      },
      () => {
        inMemoryStorage.updateAccount(accountId, updates)
      },
      'updateAccount'
    )
  }

  // Position Management
  async createPosition(position: Omit<TradingPosition, 'id' | 'created_at' | 'updated_at'>): Promise<TradingPosition> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('trading_positions')
          .insert(position)
          .select()
          .single()

        if (error) throw error
        return data
      },
      () => {
        const newPosition: TradingPosition = {
          ...position,
          id: inMemoryStorage.generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        inMemoryStorage.addPosition(position.account_id, newPosition)
        return newPosition
      },
      'createPosition'
    )
  }

  async updatePosition(positionId: string, updates: Partial<TradingPosition>): Promise<void> {
    return this.withFallback(
      async () => {
        const { error } = await supabaseClient
          .from('trading_positions')
          .update(updates)
          .eq('id', positionId)

        if (error) throw error
      },
      () => {
        inMemoryStorage.updatePosition(positionId, updates)
      },
      'updatePosition'
    )
  }

  async getPositions(accountId: string): Promise<TradingPosition[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('trading_positions')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      },
      () => {
        return inMemoryStorage.getPositions(accountId)
      },
      'getPositions'
    )
  }

  // Order Management
  async createOrder(order: Omit<TradingOrder, 'id' | 'created_at'>): Promise<TradingOrder> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('trading_orders')
          .insert(order)
          .select()
          .single()

        if (error) throw error
        return data
      },
      () => {
        const newOrder: TradingOrder = {
          ...order,
          id: inMemoryStorage.generateId(),
          created_at: new Date().toISOString()
        }
        inMemoryStorage.addOrder(order.account_id, newOrder)
        return newOrder
      },
      'createOrder'
    )
  }

  async updateOrderStatus(orderId: string, status: TradingOrder['status'], filledAt?: string): Promise<void> {
    return this.withFallback(
      async () => {
        const updates: any = { status }
        if (filledAt) updates.filled_at = filledAt

        const { error } = await supabaseClient
          .from('trading_orders')
          .update(updates)
          .eq('id', orderId)

        if (error) throw error
      },
      () => {
        inMemoryStorage.updateOrderStatus(orderId, status, filledAt)
      },
      'updateOrderStatus'
    )
  }

  async getOrders(accountId: string, limit = 50): Promise<TradingOrder[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('trading_orders')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return data || []
      },
      () => {
        return inMemoryStorage.getOrders(accountId, limit)
      },
      'getOrders'
    )
  }

  // AI Decision Logging
  async logAIDecision(decision: Omit<AIDecision, 'id' | 'created_at'>): Promise<AIDecision> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('ai_decisions')
          .insert(decision)
          .select()
          .single()

        if (error) throw error
        return data
      },
      () => {
        const newDecision: AIDecision = {
          ...decision,
          id: inMemoryStorage.generateId(),
          created_at: new Date().toISOString()
        }
        inMemoryStorage.addAIDecision(decision.account_id, newDecision)
        return newDecision
      },
      'logAIDecision'
    )
  }

  async getAIDecisions(accountId: string, limit = 100): Promise<AIDecision[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('ai_decisions')
          .select('*')
          .eq('account_id', accountId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return data || []
      },
      () => {
        return inMemoryStorage.getAIDecisions(accountId, limit)
      },
      'getAIDecisions'
    )
  }

  // Market Analysis
  async saveMarketAnalysis(analysis: Omit<MarketAnalysis, 'id' | 'created_at'>): Promise<MarketAnalysis> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabaseClient
          .from('market_analysis')
          .insert(analysis)
          .select()
          .single()

        if (error) throw error
        return data
      },
      () => {
        const newAnalysis: MarketAnalysis = {
          ...analysis,
          id: inMemoryStorage.generateId(),
          created_at: new Date().toISOString()
        }
        inMemoryStorage.addMarketAnalysis(analysis.symbol, newAnalysis)
        return newAnalysis
      },
      'saveMarketAnalysis'
    )
  }

  async getLatestAnalysis(symbol: string, analysisType?: string): Promise<MarketAnalysis | null> {
    return this.withFallback(
      async () => {
        let query = supabaseClient
          .from('market_analysis')
          .select('*')
          .eq('symbol', symbol)
          .order('created_at', { ascending: false })
          .limit(1)

        if (analysisType) {
          query = query.eq('analysis_type', analysisType)
        }

        const { data, error } = await query

        if (error) throw error
        return data?.[0] || null
      },
      () => {
        return inMemoryStorage.getLatestAnalysis(symbol, analysisType)
      },
      'getLatestAnalysis'
    )
  }

  // Performance Metrics
  async getPerformanceMetrics(accountId: string): Promise<any> {
    const orders = await this.getOrders(accountId, 1000)
    const positions = await this.getPositions(accountId)

    const totalTrades = orders.length
    const winningTrades = orders.filter(order => (order.realized_pnl || 0) > 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0)
    const realizedPnL = orders.reduce((sum, order) => sum + (order.realized_pnl || 0), 0)

    return {
      totalTrades,
      winningTrades,
      winRate,
      totalPnL,
      realizedPnL,
      activePositions: positions.length
    }
  }

  private calculateWinRate(orders: TradingOrder[]): number {
    if (orders.length === 0) return 0
    const winningTrades = orders.filter(order => (order.realized_pnl || 0) > 0).length
    return (winningTrades / orders.length) * 100
  }
}

// Export singleton instance
export const tradingDB = new TradingDatabase() 