import { NextRequest, NextResponse } from 'next/server'
import { simplePaperTradingEngine as paperTradingEngine } from '@/lib/trading/simple-paper-trading'
import { adaptiveStrategyManager } from '@/lib/trading/adaptive-strategy-manager'

// Helper function to ensure trading engine is initialized
async function ensureInitialized(userId: string = 'demo-user') {
  if (!paperTradingEngine.getAccount()) {
    console.log('🔄 Re-initializing trading engine...')
    await paperTradingEngine.initialize(userId)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId') || 'demo-user'

    switch (action) {
      case 'status':
        // Ensure trading engine is initialized before getting status
        await ensureInitialized(userId)
        
        const account = paperTradingEngine.getAccount()
        const portfolioMetrics = await paperTradingEngine.getPortfolioMetrics()
        const positions = await paperTradingEngine.getAllPositions()
        const orders = await paperTradingEngine.getAllOrders(10)
        const config = paperTradingEngine.getConfig()
        const marketCondition = adaptiveStrategyManager.getCurrentMarketCondition()
        const strategies = adaptiveStrategyManager.getAllStrategies()

        return NextResponse.json({
          success: true,
          data: {
            account,
            portfolioMetrics,
            positions,
            recentOrders: orders,
            config,
            marketCondition,
            availableStrategies: strategies,
            autoTradingEnabled: paperTradingEngine.isAutoTradingEnabled()
          }
        })

      case 'initialize':
        await paperTradingEngine.initialize(userId)
        return NextResponse.json({
          success: true,
          message: `Paper trading account initialized for user: ${userId}`,
          account: paperTradingEngine.getAccount()
        })

      case 'balance':
        // Ensure trading engine is initialized before getting balance
        await ensureInitialized(userId)
        
        const balanceAccount = paperTradingEngine.getAccount()
        return NextResponse.json({
          success: true,
          data: {
            balance: balanceAccount?.balance || 50000,
            account: balanceAccount
          }
        })

      case 'portfolio':
        const metrics = await paperTradingEngine.getPortfolioMetrics()
        return NextResponse.json({
          success: true,
          data: metrics
        })

      case 'positions':
        const allPositions = await paperTradingEngine.getAllPositions()
        return NextResponse.json({
          success: true,
          data: allPositions
        })

      case 'orders':
        const limit = parseInt(searchParams.get('limit') || '50')
        const allOrders = await paperTradingEngine.getAllOrders(limit)
        return NextResponse.json({
          success: true,
          data: allOrders
        })

      case 'market-analysis':
        const symbol = searchParams.get('symbol') || 'BTC/USD'
        const condition = await adaptiveStrategyManager.analyzeMarketConditions(symbol)
        const optimalStrategies = adaptiveStrategyManager.selectOptimalStrategies(condition)
        
        return NextResponse.json({
          success: true,
          data: {
            symbol,
            marketCondition: condition,
            optimalStrategies: optimalStrategies.map(strategy => ({
              ...strategy,
              explanation: adaptiveStrategyManager.getStrategyExplanation(strategy, condition)
            }))
          }
        })

      case 'generate-signals':
        const signalSymbol = searchParams.get('symbol') || 'BTC/USD'
        const accountId = paperTradingEngine.getAccount()?.id
        
        if (!accountId) {
          return NextResponse.json({
            success: false,
            error: 'Trading account not initialized'
          }, { status: 400 })
        }

        const signals = await adaptiveStrategyManager.generateSignals(signalSymbol, accountId)
        return NextResponse.json({
          success: true,
          data: signals
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Enhanced Paper Trading API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'execute-order':
        const { symbol, side, quantity, orderType, price, strategy, reasoning, confidence } = body
        
        // Ensure trading engine is initialized before executing order
        await ensureInitialized()
        
        const result = await paperTradingEngine.executeOrder({
          symbol,
          side,
          quantity: parseFloat(quantity),
          orderType: orderType || 'market',
          price: price ? parseFloat(price) : undefined,
          strategy: strategy || 'Manual Trade',
          reasoning: reasoning || 'Manual execution',
          confidence: confidence || 0.8
        })

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.message
        })

      case 'close-position':
        const { symbol: closeSymbol, reason } = body
        
        // Ensure trading engine is initialized before closing position
        await ensureInitialized()
        
        const closeResult = await paperTradingEngine.closePosition(closeSymbol, reason)
        
        return NextResponse.json({
          success: closeResult.success,
          data: closeResult,
          message: closeResult.message
        })

      case 'enable-auto-trading':
        await paperTradingEngine.enableAutoTrading()
        return NextResponse.json({
          success: true,
          message: 'Auto trading enabled'
        })

      case 'disable-auto-trading':
        await paperTradingEngine.disableAutoTrading()
        return NextResponse.json({
          success: true,
          message: 'Auto trading disabled'
        })

      case 'process-ai-signals':
        await paperTradingEngine.processAISignals()
        return NextResponse.json({
          success: true,
          message: 'AI signals processed'
        })

      case 'update-config':
        const { config } = body
        paperTradingEngine.updateConfig(config)
        return NextResponse.json({
          success: true,
          message: 'Configuration updated',
          config: paperTradingEngine.getConfig()
        })

      case 'initialize-with-balance':
        const { userId, initialBalance } = body
        
        // Update config with custom balance
        if (initialBalance) {
          paperTradingEngine.updateConfig({ initialBalance: parseFloat(initialBalance) })
        }
        
        await paperTradingEngine.initialize(userId || 'demo-user')
        
        return NextResponse.json({
          success: true,
          message: `Paper trading initialized with $${initialBalance || 50000} balance`,
          account: paperTradingEngine.getAccount()
        })

      case 'activate-strategy':
        const { strategyId } = body
        adaptiveStrategyManager.activateStrategy(strategyId)
        return NextResponse.json({
          success: true,
          message: `Strategy ${strategyId} activated`
        })

      case 'deactivate-strategy':
        const { strategyId: deactivateId } = body
        adaptiveStrategyManager.deactivateStrategy(deactivateId)
        return NextResponse.json({
          success: true,
          message: `Strategy ${deactivateId} deactivated`
        })

      case 'emergency-stop':
        // Disable auto trading and close all positions
        await paperTradingEngine.disableAutoTrading()
        
        const positions = await paperTradingEngine.getAllPositions()
        const closeResults = []
        
        for (const position of positions) {
          if (position.quantity > 0) {
            const result = await paperTradingEngine.closePosition(position.symbol, 'Emergency stop')
            closeResults.push(result)
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Emergency stop executed - all trading disabled and positions closed',
          data: {
            positionsClosed: closeResults.length,
            results: closeResults
          }
        })

      case 'start-demo-trading':
        // Initialize with demo data and start auto trading
        await paperTradingEngine.initialize('demo-user')
        await paperTradingEngine.enableAutoTrading()
        
        // Process initial signals
        setTimeout(async () => {
          await paperTradingEngine.processAISignals()
        }, 2000)
        
        return NextResponse.json({
          success: true,
          message: 'Demo trading started successfully',
          data: {
            account: paperTradingEngine.getAccount(),
            autoTradingEnabled: true
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Enhanced Paper Trading POST Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'reset-account':
        const userId = searchParams.get('userId') || 'demo-user'
        
        // This would typically delete all positions and reset account
        // For now, we'll reinitialize
        await paperTradingEngine.initialize(userId)
        
        return NextResponse.json({
          success: true,
          message: 'Account reset successfully',
          account: paperTradingEngine.getAccount()
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Enhanced Paper Trading DELETE Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 