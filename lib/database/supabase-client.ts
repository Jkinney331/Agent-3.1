import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null

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
  side: 'buy' | 'sell'
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

// Database Operations
export class TradingDatabase {
  
  // Account Management
  async initializePaperAccount(userId: string): Promise<TradingAccount> {
    const { data, error } = await supabase
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
  }

  async getAccount(userId: string): Promise<TradingAccount | null> {
    const { data, error } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateAccount(accountId: string, updates: Partial<TradingAccount>): Promise<void> {
    const { error } = await supabase
      .from('trading_accounts')
      .update(updates)
      .eq('id', accountId)

    if (error) throw error
  }

  // Position Management
  async createPosition(position: Omit<TradingPosition, 'id' | 'created_at' | 'updated_at'>): Promise<TradingPosition> {
    const { data, error } = await supabase
      .from('trading_positions')
      .insert(position)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePosition(positionId: string, updates: Partial<TradingPosition>): Promise<void> {
    const { error } = await supabase
      .from('trading_positions')
      .update(updates)
      .eq('id', positionId)

    if (error) throw error
  }

  async getPositions(accountId: string): Promise<TradingPosition[]> {
    const { data, error } = await supabase
      .from('trading_positions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Order Management
  async createOrder(order: Omit<TradingOrder, 'id' | 'created_at'>): Promise<TradingOrder> {
    const { data, error } = await supabase
      .from('trading_orders')
      .insert(order)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateOrderStatus(orderId: string, status: TradingOrder['status'], filledAt?: string): Promise<void> {
    const updates: any = { status }
    if (filledAt) updates.filled_at = filledAt

    const { error } = await supabase
      .from('trading_orders')
      .update(updates)
      .eq('id', orderId)

    if (error) throw error
  }

  async getOrders(accountId: string, limit = 50): Promise<TradingOrder[]> {
    const { data, error } = await supabase
      .from('trading_orders')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // AI Decision Logging
  async logAIDecision(decision: Omit<AIDecision, 'id' | 'created_at'>): Promise<AIDecision> {
    const { data, error } = await supabase
      .from('ai_decisions')
      .insert(decision)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getAIDecisions(accountId: string, limit = 100): Promise<AIDecision[]> {
    const { data, error } = await supabase
      .from('ai_decisions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Market Analysis
  async saveMarketAnalysis(analysis: Omit<MarketAnalysis, 'id' | 'created_at'>): Promise<MarketAnalysis> {
    const { data, error } = await supabase
      .from('market_analysis')
      .insert(analysis)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getLatestAnalysis(symbol: string, analysisType?: string): Promise<MarketAnalysis | null> {
    let query = supabase
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