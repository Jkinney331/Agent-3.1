import { NextRequest, NextResponse } from 'next/server'
import { alpacaClient } from '@/lib/trading/exchanges/alpaca-client'
import { paperTradingEngine } from '@/lib/trading/enhanced-paper-trading-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const symbol = searchParams.get('symbol')

    switch (action) {
      case 'current-price':
        if (!symbol) {
          return NextResponse.json({
            success: false,
            error: 'Symbol is required for price data'
          }, { status: 400 })
        }

        try {
          // Try to get real price from Alpaca positions first
          const positions = await alpacaClient.getPositions()
          const position = positions.find(p => p.symbol === symbol)
          
          if (position && position.current_price) {
            const currentPrice = parseFloat(position.current_price)
            const lastDayPrice = parseFloat(position.lastday_price)
            const change24h = currentPrice - lastDayPrice
            const changePercent = (change24h / lastDayPrice) * 100
            
            return NextResponse.json({
              success: true,
              data: {
                symbol,
                price: Number(currentPrice.toFixed(2)),
                change24h: Number(change24h.toFixed(2)),
                changePercent: Number(changePercent.toFixed(2)),
                timestamp: new Date().toISOString(),
                source: 'alpaca_live'
              }
            })
          }
        } catch (error) {
          console.log(`⚠️ Could not get real price for ${symbol} from Alpaca`)
        }

        // Fallback to mock prices for demo
        const mockPrices: { [key: string]: number } = {
          'AAPL': 150 + (Math.random() - 0.5) * 5,
          'GOOGL': 2800 + (Math.random() - 0.5) * 50,
          'MSFT': 420 + (Math.random() - 0.5) * 10,
          'AMZN': 180 + (Math.random() - 0.5) * 5,
          'TSLA': 800 + (Math.random() - 0.5) * 20,
          'NVDA': 900 + (Math.random() - 0.5) * 30,
          'META': 520 + (Math.random() - 0.5) * 15,
          'BTC/USD': 50000 + (Math.random() - 0.5) * 1000,
          'ETH/USD': 3000 + (Math.random() - 0.5) * 100,
        }

        const currentPrice = mockPrices[symbol] || 100 + (Math.random() - 0.5) * 10
        const change24h = (Math.random() - 0.5) * 10 // -5% to +5% change
        const changePercent = (change24h / currentPrice) * 100

        return NextResponse.json({
          success: true,
          data: {
            symbol,
            price: Number(currentPrice.toFixed(2)),
            change24h: Number(change24h.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            timestamp: new Date().toISOString(),
            source: 'mock_data'
          }
        })

      case 'portfolio-data':
        try {
          // First try to get real Alpaca data
          const alpacaData = await paperTradingEngine.getAlpacaPortfolioData()
          
          return NextResponse.json({
            success: true,
            data: alpacaData,
            source: 'alpaca_live'
          })
          
        } catch (error) {
          console.log('⚠️ Alpaca API not available, using paper trading data')
          
          // Fallback to paper trading engine data
          try {
            await paperTradingEngine.initialize('demo-user')
            const account = paperTradingEngine.getAccount()
            const portfolioMetrics = await paperTradingEngine.getPortfolioMetrics()
            const positions = await paperTradingEngine.getAllPositions()
            const orders = await paperTradingEngine.getAllOrders(10)
            
            return NextResponse.json({
              success: true,
              data: {
                account: {
                  cash: account?.balance || 50000,
                  buyingPower: account?.buying_power || 50000,
                  portfolioValue: account?.total_equity || 50000,
                  equity: account?.total_equity || 50000,
                  dayPnL: portfolioMetrics?.dayPnL || 0,
                  totalPnL: portfolioMetrics?.totalPnL || 0
                },
                positions: positions.map(pos => ({
                  symbol: pos.symbol,
                  quantity: pos.quantity,
                  marketValue: pos.market_value,
                  unrealizedPnL: pos.unrealized_pnl,
                  unrealizedPnLPercent: pos.market_value > 0 ? (pos.unrealized_pnl / pos.market_value) * 100 : 0,
                  side: pos.side,
                  avgEntryPrice: pos.avg_cost,
                  currentPrice: pos.current_price
                })),
                recentOrders: orders.map(order => ({
                  id: order.id,
                  symbol: order.symbol,
                  side: order.side,
                  quantity: order.quantity,
                  price: order.price,
                  status: order.status,
                  orderType: order.order_type,
                  createdAt: order.created_at,
                  filledAt: order.filled_at
                }))
              },
              source: 'paper_trading'
            })
          } catch (fallbackError) {
            // Final fallback to mock data
            return NextResponse.json({
              success: true,
              data: {
                account: {
                  cash: 50000,
                  buyingPower: 50000,
                  portfolioValue: 50000,
                  equity: 50000,
                  dayPnL: 0,
                  totalPnL: 0
                },
                positions: [],
                recentOrders: []
              },
              source: 'mock'
            })
          }
        }

      case 'market-status':
        // Simple market status check
        const now = new Date()
        const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
        const hour = now.getHours()
        
        // Simple US market hours check (9:30 AM - 4:00 PM EST, Mon-Fri)
        const isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 16
        
        return NextResponse.json({
          success: true,
          data: {
            isOpen: isMarketOpen,
            nextOpenTime: !isMarketOpen ? 'Next trading day at 9:30 AM EST' : null,
            timezone: 'EST',
            lastUpdate: new Date().toISOString()
          }
        })

      case 'sync-alpaca':
        try {
          // Initialize paper trading engine if needed
          await paperTradingEngine.initialize('demo-user')
          
          // Sync with Alpaca
          await paperTradingEngine.syncWithAlpaca()
          
          return NextResponse.json({
            success: true,
            message: 'Successfully synced with Alpaca',
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Sync failed'
          }, { status: 500 })
        }

      case 'alpaca-account-status':
        try {
          const account = await alpacaClient.getAccount()
          
          return NextResponse.json({
            success: true,
            data: {
              accountId: account.id,
              accountNumber: account.account_number,
              status: account.status,
              cash: parseFloat(account.cash),
              buyingPower: parseFloat(account.buying_power),
              portfolioValue: parseFloat(account.portfolio_value),
              equity: parseFloat(account.equity),
              dayPnL: parseFloat(account.equity) - parseFloat(account.last_equity),
              isPatternDayTrader: account.pattern_day_trader,
              tradingBlocked: account.trading_blocked,
              lastUpdate: new Date().toISOString()
            }
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Could not fetch Alpaca account status',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }

      case 'connection-status':
        const connectionStatus = await alpacaClient.checkConnection()
        
        return NextResponse.json({
          success: true,
          data: {
            alpaca: connectionStatus,
            paperTrading: {
              connected: paperTradingEngine.getAccount() !== null,
              message: paperTradingEngine.getAccount() ? 'Paper trading engine initialized' : 'Paper trading engine not initialized'
            },
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Real-time data API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, symbols } = body

    if (action === 'subscribe-prices') {
      // This would normally set up WebSocket connections to Alpaca
      // For demo purposes, we'll return success
      console.log(`📊 Subscribing to price feeds for: ${symbols?.join(', ') || 'no symbols'}`)
      
      return NextResponse.json({
        success: true,
        message: `Subscribed to ${symbols?.length || 0} symbols`,
        data: {
          subscribed: symbols || [],
          timestamp: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Real-time data POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}