import { useState, useEffect, useCallback } from 'react'

interface PortfolioData {
  totalBalance: number
  dailyPnL: number
  dailyPnLPercentage: number
  activePositions: number
  availableBalance: number
  totalReturn: number
  totalReturnPercentage: number
}

interface Position {
  symbol: string
  quantity: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  side: string
  avgEntryPrice: number
  currentPrice: number
}

interface RecentOrder {
  id: string
  symbol: string
  side: string
  quantity: number
  price: number
  status: string
  orderType: string
  createdAt: string
  filledAt?: string
}

interface MarketData {
  symbol: string
  price: number
  change24h: number
  changePercent: number
  timestamp: string
  source: string
}

interface TradingData {
  portfolioData: PortfolioData | null
  positions: Position[]
  recentOrders: RecentOrder[]
  marketData: { [symbol: string]: MarketData }
  connectionStatus: 'connected' | 'disconnected' | 'error'
  latency: string | null
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  getMarketPrice: (symbol: string) => Promise<MarketData | null>
}

export function useTradingData(): TradingData {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [marketData, setMarketData] = useState<{ [symbol: string]: MarketData }>({})
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [latency, setLatency] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolioData = useCallback(async () => {
    try {
      const startTime = Date.now()
      setError(null)
      
      const response = await fetch('/api/trading/real-time-data?action=portfolio-data')
      const result = await response.json()
      
      const endTime = Date.now()
      const responseLatency = (endTime - startTime).toString()
      setLatency(responseLatency)

      if (result.success && result.data) {
        const { account, positions: positionsData, recentOrders: ordersData } = result.data

        // Update portfolio data
        setPortfolioData({
          totalBalance: account.portfolioValue || account.equity,
          dailyPnL: account.dayPnL,
          dailyPnLPercentage: account.portfolioValue > 0 ? (account.dayPnL / account.portfolioValue) * 100 : 0,
          activePositions: positionsData.length,
          availableBalance: account.cash,
          totalReturn: account.totalPnL,
          totalReturnPercentage: account.totalPnL > 0 ? (account.totalPnL / 50000) * 100 : 0, // Assuming $50k initial
        })

        // Update positions
        setPositions(positionsData || [])
        
        // Update recent orders
        setRecentOrders(ordersData || [])

        setConnectionStatus('connected')
      } else {
        console.warn('Portfolio data API returned non-success response:', result)
        setConnectionStatus('error')
        setError(result.error || 'Failed to fetch portfolio data')
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err)
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error fetching portfolio data')
    }
  }, [])

  const getMarketPrice = useCallback(async (symbol: string): Promise<MarketData | null> => {
    try {
      const startTime = Date.now()
      const response = await fetch(`/api/trading/real-time-data?action=current-price&symbol=${encodeURIComponent(symbol)}`)
      const result = await response.json()
      
      const endTime = Date.now()
      const responseLatency = (endTime - startTime).toString()
      setLatency(responseLatency)

      if (result.success && result.data) {
        const priceData = result.data as MarketData
        
        // Cache the market data
        setMarketData(prev => ({
          ...prev,
          [symbol]: priceData
        }))

        return priceData
      } else {
        console.warn(`Failed to fetch price for ${symbol}:`, result.error)
        return null
      }
    } catch (err) {
      console.error(`Error fetching price for ${symbol}:`, err)
      return null
    }
  }, [])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    await fetchPortfolioData()
    setIsLoading(false)
  }, [fetchPortfolioData])

  // Initial data fetch
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Real-time updates via polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPortfolioData()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [fetchPortfolioData])

  // Market data updates for active positions
  useEffect(() => {
    if (positions.length === 0) return

    const updateMarketData = async () => {
      for (const position of positions) {
        await getMarketPrice(position.symbol)
      }
    }

    updateMarketData()

    const interval = setInterval(updateMarketData, 15000) // Update prices every 15 seconds
    return () => clearInterval(interval)
  }, [positions, getMarketPrice])

  return {
    portfolioData,
    positions,
    recentOrders,
    marketData,
    connectionStatus,
    latency,
    isLoading,
    error,
    refreshData,
    getMarketPrice,
  }
} 