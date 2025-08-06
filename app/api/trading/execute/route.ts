import { NextRequest, NextResponse } from 'next/server';
import { tradingEngine } from '../../../../lib/trading/execution-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, capital, action } = body;

    console.log(`🔥 Trade execution request: ${action || 'AUTO'} ${symbol} with $${capital}`);

    if (!symbol || !capital) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: symbol and capital'
      }, { status: 400 });
    }

    if (action === 'execute') {
      // Execute AI-driven trade
      const result = await tradingEngine.executeAITradeSignal(symbol, capital);
      
      return NextResponse.json({
        success: true,
        execution: result,
        mode: tradingEngine.isPaperTrading() ? 'paper' : 'live',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "execute" to execute a trade.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Trade execution API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Trade execution failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'positions':
        const positions = await tradingEngine.getActivePositions();
        return NextResponse.json({
          success: true,
          positions,
          count: positions.length
        });

      case 'history':
        const history = tradingEngine.getTradeHistory();
        const limit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json({
          success: true,
          history: history.slice(-limit),
          total: history.length
        });

      case 'stats':
        const stats = tradingEngine.getPerformanceStats();
        return NextResponse.json({
          success: true,
          stats
        });

      case 'config':
        const config = tradingEngine.getConfig();
        return NextResponse.json({
          success: true,
          config,
          emergencyStop: tradingEngine.isEmergencyStopActive(),
          paperTrading: tradingEngine.isPaperTrading()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: positions, history, stats, or config'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Trading API GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API request failed'
    }, { status: 500 });
  }
} 