import { NextRequest, NextResponse } from 'next/server';
import { unifiedExchangeManager } from '../../../../lib/trading/unified-exchange-manager';
import { advancedRiskManager } from '../../../../lib/trading/risk/advanced-risk-manager';
import { paperToLiveManager } from '../../../../lib/trading/transition/paper-to-live-manager';
import { credentialManager } from '../../../../lib/security/credential-manager';
// import { tradingWSManager } from '../../../../lib/trading/websocket/trading-ws-manager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        return NextResponse.json(await getSystemStatus());
      
      case 'risk-metrics':
        const metrics = await advancedRiskManager.calculateRiskMetrics();
        return NextResponse.json({ success: true, data: metrics });
      
      case 'transition-status':
        const transitionStatus = await paperToLiveManager.getStatus();
        return NextResponse.json({ success: true, data: transitionStatus });
      
      case 'portfolio':
        // Get portfolio data from all exchanges
        const portfolioData = await unifiedExchangeManager.getPortfolioSummary();
        return NextResponse.json({ success: true, data: portfolioData });
      
      case 'positions':
        const exchange = searchParams.get('exchange') || 'all';
        const positions = await unifiedExchangeManager.getPositions(exchange);
        return NextResponse.json({ success: true, data: positions });
      
      case 'credentials-status':
        const credStatus = credentialManager.getEncryptionStatus();
        return NextResponse.json({ success: true, data: credStatus });
      
      case 'alerts':
        const alerts = advancedRiskManager.getAlerts();
        return NextResponse.json({ success: true, data: alerts });
      
      case 'trades':
        const mode = searchParams.get('mode') as 'paper' | 'live' | undefined;
        const trades = paperToLiveManager.getTrades(mode);
        return NextResponse.json({ success: true, data: trades });
      
      case 'performance':
        const performanceMode = searchParams.get('mode') as 'paper' | 'live' | undefined;
        const allTrades = paperToLiveManager.getTrades(performanceMode);
        const performance = paperToLiveManager.calculatePerformance(allTrades);
        return NextResponse.json({ success: true, data: performance });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Available actions: status, risk-metrics, transition-status, portfolio, positions, credentials-status, alerts, trades, performance' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Enhanced execution API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'place-order':
        return await handlePlaceOrder(body);
      
      case 'close-position':
        return await handleClosePosition(body);
      
      case 'close-all-positions':
        return await handleCloseAllPositions();
      
      case 'validate-order':
        return await handleValidateOrder(body);
      
      case 'emergency-stop':
        return await handleEmergencyStop();
      
      case 'store-credentials':
        return await handleStoreCredentials(body);
      
      case 'rotate-credentials':
        return await handleRotateCredentials(body);
      
      case 'initiate-transition':
        return await handleInitiateTransition();
      
      case 'approve-transition':
        return await handleApproveTransition();
      
      case 'reject-transition':
        return await handleRejectTransition(body);
      
      case 'revert-to-paper':
        return await handleRevertToPaper(body);
      
      case 'update-risk-config':
        return await handleUpdateRiskConfig(body);
      
      case 'test-connections':
        return await handleTestConnections();

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Enhanced execution POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Handler functions
async function getSystemStatus() {
  const [
    exchangeConnections,
    riskMetrics,
    transitionStatus,
    credentialStatus,
    alerts
  ] = await Promise.all([
    unifiedExchangeManager.testAllConnections(),
    advancedRiskManager.calculateRiskMetrics(),
    paperToLiveManager.getStatus(),
    Promise.resolve(credentialManager.getEncryptionStatus()),
    Promise.resolve(advancedRiskManager.getAlerts())
  ]);

  return {
    timestamp: new Date().toISOString(),
    exchanges: exchangeConnections,
    riskManagement: {
      active: true,
      metrics: riskMetrics,
      alertCount: alerts.length,
      emergencyStop: riskMetrics.riskScore > 90
    },
    transition: {
      currentMode: transitionStatus.currentMode,
      readinessScore: transitionStatus.readinessScore,
      approvalStatus: transitionStatus.approvalStatus
    },
    credentials: credentialStatus,
    websockets: {
      active: false, // Will be implemented when WebSocket is fully integrated
      connections: {}
    }
  };
}

async function handlePlaceOrder(body: any) {
  const { symbol, side, quantity, type, price, stopPrice, exchange, preferredExchange } = body;

  if (!symbol || !side || !quantity) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing required fields: symbol, side, quantity' 
    }, { status: 400 });
  }

  // Risk validation
  const validation = await advancedRiskManager.validateOrder({
    symbol,
    side,
    quantity,
    type: type || 'market',
    price,
    stopPrice
  }, exchange || preferredExchange || 'binance');

  if (!validation.allowed) {
    return NextResponse.json({ 
      success: false, 
      error: `Order rejected by risk management: ${validation.reason}`,
      validation 
    }, { status: 400 });
  }

  // Execute order
  const result = await unifiedExchangeManager.executeOrder({
    symbol,
    side,
    quantity: validation.adjustedQuantity || quantity,
    type: type || 'market',
    price,
    stopPrice,
    preferredExchange: exchange || preferredExchange,
    allowFallback: true
  });

  // Record trade for transition tracking
  if (result.success && result.orderResult) {
    paperToLiveManager.recordTrade({
      symbol,
      side,
      quantity: result.orderResult.filledQty,
      entryPrice: result.orderResult.avgFillPrice,
      entryTime: new Date(),
      status: 'open',
      exchange: result.exchange
    });
  }

  return NextResponse.json(result);
}

async function handleClosePosition(body: any) {
  const { symbol, exchange } = body;

  if (!symbol) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing required field: symbol' 
    }, { status: 400 });
  }

  const result = await unifiedExchangeManager.closePosition(symbol, exchange);
  return NextResponse.json(result);
}

async function handleCloseAllPositions() {
  const result = await unifiedExchangeManager.closeAllPositions();
  return NextResponse.json(result);
}

async function handleValidateOrder(body: any) {
  const { symbol, side, quantity, type, price, stopPrice, exchange } = body;

  const validation = await advancedRiskManager.validateOrder({
    symbol,
    side,
    quantity,
    type: type || 'market',
    price,
    stopPrice
  }, exchange || 'binance');

  return NextResponse.json({ success: true, validation });
}

async function handleEmergencyStop() {
  await advancedRiskManager.emergencyStop();
  return NextResponse.json({ 
    success: true, 
    message: 'Emergency stop activated. All positions closed and trading suspended.' 
  });
}

async function handleStoreCredentials(body: any) {
  const { exchange, apiKey, apiSecret, environment } = body;

  if (!exchange || !apiKey || !apiSecret || !environment) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing required fields: exchange, apiKey, apiSecret, environment' 
    }, { status: 400 });
  }

  await credentialManager.storeCredential({
    exchange,
    apiKey,
    apiSecret,
    environment: environment as 'testnet' | 'live'
  });

  return NextResponse.json({ 
    success: true, 
    message: `Credentials stored for ${exchange} (${environment})` 
  });
}

async function handleRotateCredentials(body: any) {
  const { exchange, environment, newApiKey, newApiSecret } = body;

  await credentialManager.rotateCredential(
    exchange,
    environment,
    newApiKey,
    newApiSecret
  );

  return NextResponse.json({ 
    success: true, 
    message: `Credentials rotated for ${exchange} (${environment})` 
  });
}

async function handleInitiateTransition() {
  const result = await paperToLiveManager.initiateTransition();
  return NextResponse.json(result);
}

async function handleApproveTransition() {
  paperToLiveManager.approveTransition();
  return NextResponse.json({ 
    success: true, 
    message: 'Transition to live trading approved' 
  });
}

async function handleRejectTransition(body: any) {
  const { reason } = body;
  paperToLiveManager.rejectTransition(reason || 'Manual rejection');
  return NextResponse.json({ 
    success: true, 
    message: 'Transition to live trading rejected' 
  });
}

async function handleRevertToPaper(body: any) {
  const { reason } = body;
  await paperToLiveManager.revertToPaperTrading(reason || 'Manual revert');
  return NextResponse.json({ 
    success: true, 
    message: 'Reverted to paper trading' 
  });
}

async function handleUpdateRiskConfig(body: any) {
  const { config } = body;
  advancedRiskManager.updateConfig(config);
  return NextResponse.json({ 
    success: true, 
    message: 'Risk management configuration updated' 
  });
}

async function handleTestConnections() {
  const connections = await unifiedExchangeManager.testAllConnections();
  return NextResponse.json({ 
    success: true, 
    data: connections 
  });
} 