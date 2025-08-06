'use client';

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert } from '@/components/ui/alert'
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Zap,
  Newspaper,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'

interface AISignal {
  id: string
  symbol: string
  action: 'BUY' | 'SELL'
  confidence: number
  price?: number
  target?: number
  stopLoss?: number
  reasoning: string
  timeframe: string
  strength: 'WEAK' | 'MODERATE' | 'STRONG'
}

interface MarketSentiment {
  overall: number
  fear_greed: number
  social: number
  news: number
  technical: number
  on_chain: number
}

export default function AIAnalysis() {
  // Component state - simplified
  const [signals, setSignals] = useState<AISignal[]>([])
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null)
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(false) // Start with false, not true
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoAnalysis, setAutoAnalysis] = useState(true)
  const [executingSignal, setExecutingSignal] = useState<string | null>(null)

  const fetchAIData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock signals immediately available
      const mockSignals: AISignal[] = [
        {
          id: 'signal_001',
          symbol: 'BTC/USDT',
          action: 'BUY',
          confidence: 87,
          price: 95420,
          target: 98500,
          stopLoss: 93200,
          reasoning: 'Strong bullish momentum with RSI oversold recovery and volume confirmation',
          timeframe: '4H',
          strength: 'STRONG'
        },
        {
          id: 'signal_002', 
          symbol: 'ETH/USDT',
          action: 'SELL',
          confidence: 72,
          price: 3420,
          target: 3200,
          stopLoss: 3520,
          reasoning: 'Bearish divergence detected on higher timeframes with weakening momentum',
          timeframe: '1D',
          strength: 'MODERATE'
        },
        {
          id: 'signal_003',
          symbol: 'SOL/USDT', 
          action: 'BUY',
          confidence: 65,
          price: 185,
          target: 205,
          stopLoss: 175,
          reasoning: 'Bounce from key support level with improving market sentiment',
          timeframe: '1H',
          strength: 'MODERATE'
        }
      ]

      // Set data immediately for better UX
      setSignals(mockSignals)
      setSentiment({
        overall: 52,
        fear_greed: 45,
        social: 42,
        news: 38,
        technical: 52,
        on_chain: 48
      })

      // Set fallback news immediately
      setNews([
        {
          title: "Bitcoin Maintains Strong Support Above $95,000",
          published_at: new Date().toISOString(),
          source: { title: "CryptoDaily" },
          sentiment: "bullish",
          currencies: ["BTC"]
        },
        {
          title: "Ethereum Layer 2 Solutions See Record TVL Growth",
          published_at: new Date(Date.now() - 3600000).toISOString(),
          source: { title: "DeFi Pulse" },
          sentiment: "bullish", 
          currencies: ["ETH"]
        },
        {
          title: "Solana Network Processes 65M Transactions in 24 Hours",
          published_at: new Date(Date.now() - 7200000).toISOString(),
          source: { title: "SolanaBeach" },
          sentiment: "neutral",
          currencies: ["SOL"]
        }
      ])

      // Try to fetch real data in background (non-blocking)
      try {
        const newsResponse = await fetch('/api/crypto?action=news&currencies=BTC,ETH,SOL')
        if (newsResponse.ok) {
          const cryptoNews = await newsResponse.json()
          if (cryptoNews?.results?.length > 0) {
            setNews(cryptoNews.results.slice(0, 5))
          }
        }
      } catch (bgError) {
        console.warn('Background news fetch failed:', bgError)
        // Keep fallback data, don't error out
      }

    } catch (err) {
      console.error('Error in fetchAIData:', err)
      setError('Using demo data due to API issues')
      
      // Ensure we still have data even on error
      if (signals.length === 0) {
        setSignals([{
          id: 'demo_001',
          symbol: 'BTC/USDT',
          action: 'BUY',
          confidence: 75,
          price: 95000,
          target: 98000,
          stopLoss: 93000,
          reasoning: 'Demo signal for testing',
          timeframe: '4H',
          strength: 'MODERATE'
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (dateString: string | undefined | null): string => {
    try {
      const date = dateString ? new Date(dateString) : new Date()
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Recent'
    }
  }

  const executeSignal = async (signal: AISignal) => {
    setExecutingSignal(signal.id)
    try {
      // Simulate trade execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log(`Executed ${signal.action} signal for ${signal.symbol}`)
    } catch (error) {
      console.error('Trade execution failed:', error)
    } finally {
      setExecutingSignal(null)
    }
  }

  // Load data immediately on mount
  useEffect(() => {
    fetchAIData()
    
    // Auto-refresh if enabled
    const interval = autoAnalysis ? setInterval(fetchAIData, 60000) : null
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoAnalysis])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-3 w-3 text-green-500" />
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-blue-500" />
      case 'pending': return <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
      default: return null
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-blue-600'
    return 'text-yellow-600'
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'bg-green-500'
    if (sentiment >= 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Enhanced AI Trading Signals - Full Width Responsive Layout */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">AI Trading Signals</span>
            </div>
            <Badge variant="outline" className="animate-pulse border-green-500 text-green-700">
              {loading ? 'Updating...' : 'Live Analysis'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading && signals.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {signals.map((signal) => (
                <div key={signal.id} className="p-4 rounded-lg bg-gradient-to-r from-white to-gray-50 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-lg text-gray-900">{signal.symbol}</span>
                        <Badge 
                          variant={signal.action === 'BUY' ? 'default' : 'destructive'}
                          className={`px-3 py-1 font-semibold ${
                            signal.action === 'BUY' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {signal.action}
                        </Badge>
                        <div className={`text-sm font-semibold ${getConfidenceColor(signal.confidence)}`}>
                          {signal.confidence}% confidence
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{signal.reasoning}</p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Entry:</span>
                          <div className="font-semibold">${signal.price?.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <div className="font-semibold text-green-600">${signal.target?.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Stop Loss:</span>
                          <div className="font-semibold text-red-600">${signal.stopLoss?.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Timeframe:</span>
                          <div className="font-semibold">{signal.timeframe}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <Button
                        size="default"
                        onClick={() => executeSignal(signal)}
                        disabled={executingSignal === signal.id}
                        className={`px-6 py-2 font-semibold shadow-sm transition-all ${
                          signal.action === 'BUY' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {executingSignal === signal.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Execute {signal.action}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <Button onClick={fetchAIData} disabled={loading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Signals
                </Button>
                <div className="text-xs text-gray-500">
                  Auto-refresh: {autoAnalysis ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Market Sentiment */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {sentiment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-900">{sentiment.overall}</div>
                  <div className="text-sm text-gray-600">Overall</div>
                  <Progress value={sentiment.overall} className="mt-2" />
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-900">{sentiment.fear_greed}</div>
                  <div className="text-sm text-gray-600">Fear & Greed</div>
                  <Progress value={sentiment.fear_greed} className="mt-2" />
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-900">{sentiment.technical}</div>
                  <div className="text-sm text-gray-600">Technical</div>
                  <Progress value={sentiment.technical} className="mt-2" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced News Impact Analysis */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-green-600" />
            News Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {news.length > 0 ? (
              news.slice(0, 4).map((item: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-white to-gray-50 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 leading-relaxed">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="font-medium">
                          {formatTimestamp(item.published_at)}
                        </span>
                        <span>•</span>
                        <span>{item.source?.title || 'News Source'}</span>
                      </div>
                      {item.currencies && item.currencies.length > 0 && (
                        <div className="flex gap-1">
                          {item.currencies.slice(0, 3).map((currency: string) => (
                            <Badge key={currency} variant="secondary" className="text-xs">
                              {currency}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        item.sentiment === 'bullish' ? 'text-green-700 border-green-300' :
                        item.sentiment === 'bearish' ? 'text-red-700 border-red-300' :
                        'text-gray-700 border-gray-300'
                      }`}
                    >
                      {item.sentiment || 'neutral'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No recent news available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 