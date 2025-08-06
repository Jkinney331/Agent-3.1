// Authentication and User Types
export interface AuthCredentials {
  apiKey: string
  secretKey: string
}

export interface User {
  id: string
  email?: string
  createdAt?: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationSettings
  trading: TradingPreferences
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sound: boolean
  tradeExecution: boolean
  riskAlerts: boolean
  dailyReports: boolean
}

export interface TradingPreferences {
  defaultLeverage: number
  maxPositionSize: number
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  autoTrade: boolean
}

// Portfolio and Trading Types
export interface PortfolioData {
  totalBalance: number
  availableBalance: number
  totalEquity: number
  dailyPnL: number
  dailyPnLPercentage: number
  totalReturn: number
  totalReturnPercentage: number
  activePositions: number
  totalPositionsValue: number
  marginUsed: number
  marginAvailable: number
  lastUpdated: Date
}

export interface Position {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  size: number
  entryPrice: number
  currentPrice: number
  markPrice: number
  unrealizedPnL: number
  unrealizedPnLPercentage: number
  leverage: number
  margin: number
  liquidationPrice: number
  createdAt: Date
  strategy: string
  stopLoss?: number
  takeProfit?: number
}

export interface Trade {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
  quantity: number
  price: number
  executedPrice?: number
  executedQuantity?: number
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED'
  timeInForce: 'GTC' | 'IOC' | 'FOK'
  createdAt: Date
  executedAt?: Date
  commission: number
  commissionAsset: string
  realizedPnL?: number
  strategy: string
  reason: string
  confidence: number
}

export interface Order {
  id: string
  clientOrderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce: 'GTC' | 'IOC' | 'FOK'
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED'
  createdAt: Date
  updatedAt: Date
}

// Market Data Types
export interface MarketData {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  volume: number
  quoteVolume: number
  high24h: number
  low24h: number
  openPrice: number
  lastUpdate: Date
}

export interface CandlestickData {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
  quoteAssetVolume: number
  numberOfTrades: number
  takerBuyBaseAssetVolume: number
  takerBuyQuoteAssetVolume: number
}

export interface OrderBookData {
  symbol: string
  bids: [number, number][] // [price, quantity]
  asks: [number, number][] // [price, quantity]
  lastUpdateId: number
}

export interface TickerData {
  symbol: string
  priceChange: number
  priceChangePercent: number
  weightedAvgPrice: number
  prevClosePrice: number
  lastPrice: number
  lastQty: number
  bidPrice: number
  bidQty: number
  askPrice: number
  askQty: number
  openPrice: number
  highPrice: number
  lowPrice: number
  volume: number
  quoteVolume: number
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

// AI and Strategy Types
export interface AIAnalysis {
  marketRegime: 'BULL' | 'BEAR' | 'RANGE' | 'VOLATILE'
  confidence: number
  sentiment: number // -1 to 1
  fearGreedIndex: number // 0 to 100
  nextAction: 'BUY' | 'SELL' | 'HOLD'
  recommendedSymbol?: string
  entryPrice?: number
  targetPrice?: number
  stopLoss?: number
  reasoning: string[]
  lastUpdated: Date
}

export interface Strategy {
  id: string
  name: string
  description: string
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED'
  allocation: number // Percentage of portfolio
  performance: StrategyPerformance
  settings: StrategySettings
  rules: TradingRule[]
  lastExecuted?: Date
}

export interface StrategyPerformance {
  winRate: number
  totalTrades: number
  profitable: number
  losing: number
  averageReturn: number
  maxDrawdown: number
  sharpeRatio: number
  profitFactor: number
  totalReturn: number
  totalReturnPercentage: number
}

export interface StrategySettings {
  timeframes: string[]
  maxPositions: number
  riskPerTrade: number
  stopLossType: 'FIXED' | 'ATR' | 'PERCENTAGE'
  stopLossValue: number
  takeProfitRatio: number
  minConfidence: number
  marketRegimes: string[]
  volumeFilter: boolean
  sentimentWeight: number
}

export interface TradingRule {
  id: string
  name: string
  type: 'ENTRY' | 'EXIT' | 'RISK'
  condition: string
  action: string
  priority: number
  enabled: boolean
}

// Risk Management Types
export interface RiskMetrics {
  portfolioDrawdown: number
  maxDrawdownLimit: number
  dailyPnL: number
  dailyPnLLimit: number
  positionSizing: number
  maxPositionSize: number
  leverage: number
  maxLeverage: number
  var95: number // Value at Risk 95%
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  lastUpdated: Date
}

export interface RiskAlert {
  id: string
  type: 'WARNING' | 'CRITICAL' | 'INFO'
  category: 'DRAWDOWN' | 'LEVERAGE' | 'EXPOSURE' | 'API'
  message: string
  details: string
  action?: string
  timestamp: Date
  acknowledged: boolean
}

// WebSocket and Connection Types
export interface ConnectionStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'
  latency?: number
  lastPing?: Date
  reconnectAttempts: number
  error?: string
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface BinanceError {
  code: number
  msg: string
}

// Configuration Types
export interface TradingConfig {
  maxDrawdown: number
  maxPositionSize: number
  maxDailyLoss: number
  defaultLeverage: number
  emergencyStopLoss: number
  maxConcurrentTrades: number
  tradingHours: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  allowedSymbols: string[]
  blacklistedSymbols: string[]
}

export interface AIConfig {
  confidenceThreshold: number
  adaptationRate: number
  modelUpdateInterval: number
  overrideRules: string[]
  modelVersions: {
    marketRegime: string
    pricePredicition: string
    sentiment: string
    riskAssessment: string
  }
}

// Analytics and Reporting Types
export interface PerformanceReport {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  startDate: Date
  endDate: Date
  totalReturn: number
  totalReturnPercentage: number
  winRate: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  averageTradeReturn: number
  totalTrades: number
  tradingDays: number
  bestTrade: Trade
  worstTrade: Trade
  strategyBreakdown: StrategyPerformance[]
  monthlyReturns: number[]
  drawdownHistory: number[]
}

export interface BacktestResult {
  strategyId: string
  startDate: Date
  endDate: Date
  initialCapital: number
  finalCapital: number
  totalReturn: number
  totalReturnPercentage: number
  winRate: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  totalTrades: number
  trades: Trade[]
  equityCurve: { date: Date; value: number }[]
  drawdownCurve: { date: Date; value: number }[]
}

// Utility Types
export type TimeFrame = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M'

export type TradingPair = string // e.g., 'BTCUSDT', 'ETHUSDT'

export type OrderSide = 'BUY' | 'SELL'

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'

export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED'

export type PositionSide = 'LONG' | 'SHORT'

export type MarketRegime = 'BULL' | 'BEAR' | 'RANGE' | 'VOLATILE'

// Dynamic Trailing Stops Types
export interface DynamicTrailingStopConfig {
  enabled: boolean
  baseTrailingPercent: number // Base trailing stop percentage
  atrMultiplier: number // ATR multiplier for volatility adjustment
  minTrailingPercent: number // Minimum trailing stop percentage
  maxTrailingPercent: number // Maximum trailing stop percentage
  confidenceThreshold: number // AI confidence threshold for activation
  updateInterval: number // Update interval in milliseconds
  marketRegimeAdjustment: {
    bull: number // Multiplier for bull markets
    bear: number // Multiplier for bear markets
    range: number // Multiplier for range-bound markets
    volatile: number // Multiplier for volatile markets
  }
}

export interface TrailingStopState {
  id: string
  positionId: string
  symbol: string
  side: PositionSide
  currentStopPrice: number
  highestPrice: number // For long positions
  lowestPrice: number // For short positions
  trailingPercent: number
  lastUpdated: Date
  isActive: boolean
  triggerCount: number
  atrValue: number
  aiConfidence: number
  marketRegime: MarketRegime
  reasoningChain: string[]
}

export interface TrailingStopUpdate {
  positionId: string
  newStopPrice: number
  previousStopPrice: number
  priceMovement: number
  trailingPercent: number
  atrValue: number
  aiConfidence: number
  marketRegime: MarketRegime
  timestamp: Date
  reasoning: string[]
}

export interface TrailingStopTrigger {
  id: string
  positionId: string
  symbol: string
  triggerPrice: number
  executedPrice: number
  side: PositionSide
  quantity: number
  pnl: number
  reason: 'STOP_TRIGGERED' | 'POSITION_CLOSED' | 'MANUAL_OVERRIDE'
  timestamp: Date
  aiConfidence: number
  marketConditions: {
    volatility: number
    atr: number
    regime: MarketRegime
    priceMovement: number
  }
}

export interface ATRCalculation {
  period: number
  values: number[]
  current: number
  average: number
  normalized: number
}

export interface MarketVolatilityMetrics {
  atr14: number // 14-period ATR
  atr21: number // 21-period ATR
  historicalVolatility: number
  impliedVolatility?: number
  volatilityRank: number // 0-100 percentile rank
  volatilityRegime: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME'
}

export interface DynamicTrailingStopAnalysis {
  positionId: string
  symbol: string
  currentPrice: number
  suggestedStopPrice: number
  suggestedTrailingPercent: number
  confidence: number
  reasoning: string[]
  marketMetrics: {
    atr: ATRCalculation
    volatility: MarketVolatilityMetrics
    regime: MarketRegime
    priceDirection: 'UP' | 'DOWN' | 'SIDEWAYS'
    momentum: number
  }
  riskMetrics: {
    maxDrawdown: number
    potentialLoss: number
    riskRewardRatio: number
    positionRisk: number
  }
  timestamp: Date
}

// Telegram Bot Types
export interface TelegramUser {
  telegramId: number
  userId?: string // Link to internal user system
  username?: string
  firstName?: string
  lastName?: string
  isBot: boolean
  languageCode?: string
  isActive: boolean
  permissions: TelegramPermissions
  preferences: TelegramUserPreferences
  createdAt: Date
  lastActive: Date
}

export interface TelegramPermissions {
  canReceiveReports: boolean
  canExecuteTrades: boolean
  canViewPortfolio: boolean
  canModifySettings: boolean
  canAccessAnalytics: boolean
  isAdmin: boolean
  rateLimit: {
    maxRequestsPerMinute: number
    maxRequestsPerHour: number
  }
}

export interface TelegramUserPreferences {
  notifications: {
    dailyReports: boolean
    tradeAlerts: boolean
    riskAlerts: boolean
    marketUpdates: boolean
    systemStatus: boolean
  }
  reporting: {
    frequency: 'DAILY' | 'WEEKLY' | 'ON_DEMAND'
    time: string // HH:MM format
    timezone: string
    format: 'BRIEF' | 'DETAILED' | 'CUSTOM'
    includeCharts: boolean
  }
  trading: {
    confirmBeforeExecution: boolean
    maxTradeSize: number
    allowedSymbols: string[]
  }
}

export interface TelegramMessage {
  messageId: number
  chatId: number
  userId: number
  text?: string
  command?: string
  parameters?: string[]
  timestamp: Date
  processed: boolean
  response?: string
  error?: string
}

export interface TelegramCommand {
  command: string
  description: string
  handler: string
  permissions: string[]
  parameters?: TelegramCommandParameter[]
  examples: string[]
}

export interface TelegramCommandParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'symbol'
  required: boolean
  description: string
  validation?: string
}

export interface TelegramNotification {
  id: string
  type: 'TRADE_ALERT' | 'RISK_ALERT' | 'DAILY_REPORT' | 'MARKET_UPDATE' | 'SYSTEM_STATUS'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  telegramId?: number
  chatId: number
  title: string
  message: string
  data?: any
  scheduled?: Date
  sent?: Date
  delivered: boolean
  error?: string
  retryCount: number
  maxRetries: number
}

export interface TelegramDailyReport {
  id: string
  userId: string
  date: Date
  portfolioSummary: {
    totalBalance: number
    dailyPnL: number
    dailyPnLPercentage: number
    totalReturn: number
    totalReturnPercentage: number
    activePositions: number
  }
  tradingSummary: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    bestTrade: number
    worstTrade: number
  }
  aiInsights: {
    marketRegime: MarketRegime
    confidence: number
    nextAction: 'BUY' | 'SELL' | 'HOLD'
    recommendedSymbol?: string
    reasoning: string[]
  }
  riskMetrics: {
    currentDrawdown: number
    riskScore: number
    alerts: RiskAlert[]
  }
  upcomingEvents: string[]
  generatedAt: Date
  sentAt?: Date
}

export interface TelegramBotConfig {
  token: string
  webhookUrl: string
  allowedUsers: number[]
  adminUsers: number[]
  rateLimiting: {
    enabled: boolean
    windowMs: number
    maxRequests: number
    skipSuccessfulRequests: boolean
  }
  security: {
    secretToken: string
    validateUser: boolean
    logAllMessages: boolean
  }
  features: {
    tradingEnabled: boolean
    reportingEnabled: boolean
    analyticsEnabled: boolean
    adminCommandsEnabled: boolean
  }
}

export interface TelegramWebhookPayload {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      type: 'private' | 'group' | 'supergroup' | 'channel'
    }
    date: number
    text?: string
    entities?: Array<{
      offset: number
      length: number
      type: string
    }>
  }
  callback_query?: {
    id: string
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
    }
    message?: any
    data?: string
  }
}

export interface TelegramRateLimitState {
  userId: number
  requests: Array<{
    timestamp: Date
    endpoint: string
  }>
  isBlocked: boolean
  blockedUntil?: Date
  warningsSent: number
}

export interface TelegramSessionData {
  userId: number
  chatId: number
  state: 'IDLE' | 'AWAITING_CONFIRMATION' | 'TRADING_MODE' | 'SETUP_MODE'
  context?: any
  lastActivity: Date
  commands: string[]
} 