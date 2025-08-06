import { NextRequest, NextResponse } from 'next/server';
import { tradingEngine } from '../../../../lib/trading/execution-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    const positions = await tradingEngine.getActivePositions();
    
    if (symbol) {
      const position = positions.find(p => p.symbol.toLowerCase().includes(symbol.toLowerCase()));
      if (!position) {
        return NextResponse.json({
          success: false,
          error: `No active position found for ${symbol}`
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        position
      });
    }

    return NextResponse.json({
      success: true,
      positions,
      count: positions.length,
      mode: tradingEngine.isPaperTrading() ? 'paper' : 'live'
    });

  } catch (error) {
    console.error('❌ Positions API GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch positions'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const action = searchParams.get('action');

    if (action === 'close-all') {
      console.log('🚨 Closing ALL positions via API');
      const results = await tradingEngine.closeAllPositions('API request - Close all');
      
      return NextResponse.json({
        success: true,
        message: 'All positions closed',
        results,
        closed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    }

    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter required for closing individual positions'
      }, { status: 400 });
    }

    console.log(`🔄 Closing position for ${symbol} via API`);
    const result = await tradingEngine.closePosition(symbol, 'API request - Manual close');

    return NextResponse.json({
      success: true,
      message: `Position closed for ${symbol}`,
      result
    });

  } catch (error) {
    console.error('❌ Position close API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close position'
    }, { status: 500 });
  }
} 