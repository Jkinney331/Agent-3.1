import { useState, useEffect } from 'react'

interface PortfolioData {
  totalBalance: number
  dailyPnL: number
  dailyPnLPercentage: number
  activePositions: number
  availableBalance: number
  totalReturn: number
  totalReturnPercentage: number
}

interface TradingData {
  portfolioData: PortfolioData | null
  connectionStatus: 'connected' | 'disconnected' | 'error'
  latency: string | null
  isLoading: boolean
}

export function useTradingData(): TradingData {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [latency, setLatency] = useState<string | null>('87')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading and connecting to Binance
    const timer = setTimeout(() => {
      setPortfolioData({
        totalBalance: 50247.85,
        dailyPnL: 1247.85,
        dailyPnLPercentage: 2.49,
        activePositions: 3,
        availableBalance: 34999.65,
        totalReturn: 247.85,
        totalReturnPercentage: 0.50,
      })
      setConnectionStatus('connected')
      setLatency('87')
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    if (!portfolioData) return

    const interval = setInterval(() => {
      setPortfolioData(prev => {
        if (!prev) return null
        
        // Simulate small fluctuations
        const variation = (Math.random() - 0.5) * 0.002 // ±0.2%
        const newBalance = prev.totalBalance * (1 + variation)
        const newDailyPnL = newBalance - 50000 // Initial balance
        
        return {
          ...prev,
          totalBalance: newBalance,
          dailyPnL: newDailyPnL,
          dailyPnLPercentage: (newDailyPnL / 50000) * 100,
        }
      })

      // Simulate latency changes
      setLatency(prev => {
        const currentLatency = parseInt(prev || '87')
        const newLatency = Math.max(10, Math.min(500, currentLatency + (Math.random() - 0.5) * 20))
        return Math.round(newLatency).toString()
      })
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [portfolioData])

  return {
    portfolioData,
    connectionStatus,
    latency,
    isLoading,
  }
} 