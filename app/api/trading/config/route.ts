import { NextRequest, NextResponse } from 'next/server';
import { tradingEngine } from '../../../../lib/trading/execution-engine';

export async function GET(request: NextRequest) {
  try {
    const config = tradingEngine.getConfig();
    const stats = tradingEngine.getPerformanceStats();

    return NextResponse.json({
      success: true,
      config,
      status: {
        emergencyStop: tradingEngine.isEmergencyStopActive(),
        paperTrading: tradingEngine.isPaperTrading(),
        activeTrades: stats.activeTrades
      },
      performance: stats
    });

  } catch (error) {
    console.error('❌ Config API GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch config'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    console.log(`⚙️ Trading config action: ${action}`);

    switch (action) {
      case 'update-config':
        if (!config) {
          return NextResponse.json({
            success: false,
            error: 'Config object required for update-config action'
          }, { status: 400 });
        }
        
        tradingEngine.updateConfig(config);
        return NextResponse.json({
          success: true,
          message: 'Trading configuration updated',
          config: tradingEngine.getConfig()
        });

      case 'emergency-stop':
        tradingEngine.enableEmergencyStop();
        return NextResponse.json({
          success: true,
          message: 'Emergency stop activated',
          emergencyStop: true
        });

      case 'disable-emergency-stop':
        tradingEngine.disableEmergencyStop();
        return NextResponse.json({
          success: true,
          message: 'Emergency stop deactivated',
          emergencyStop: false
        });

      case 'switch-to-paper':
        tradingEngine.switchToPaperTrading();
        return NextResponse.json({
          success: true,
          message: 'Switched to paper trading mode',
          paperTrading: true
        });

      case 'switch-to-live':
        // Add extra safety check
        const activePositions = await tradingEngine.getActivePositions();
        if (activePositions.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Cannot switch to live trading with active paper positions. Close all positions first.'
          }, { status: 400 });
        }
        
        tradingEngine.switchToLiveTrading();
        return NextResponse.json({
          success: true,
          message: '⚠️ SWITCHED TO LIVE TRADING MODE ⚠️',
          paperTrading: false,
          warning: 'You are now trading with real money!'
        });

      case 'close-all-positions':
        console.log('🚨 Emergency close all positions via config API');
        const results = await tradingEngine.closeAllPositions('Emergency close via config');
        
        return NextResponse.json({
          success: true,
          message: 'All positions closed',
          results,
          closed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Invalid action: ${action}. Valid actions: update-config, emergency-stop, disable-emergency-stop, switch-to-paper, switch-to-live, close-all-positions`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Config API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Config update failed'
    }, { status: 500 });
  }
} 