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
      
      case 'execute-ai-decision':
        return await handleExecuteAIDecision(body);

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

async function handleExecuteAIDecision(body: any) {
  const startTime = Date.now();
  const requestId = `ai-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const {
      tradingDecision,
      executionMode = 'paper',
      credentials,
      riskParameters
    } = body;

    console.log('🤖 AI Decision Execution Started:', {
      requestId,
      symbol: tradingDecision?.symbol,
      action: tradingDecision?.action,
      confidence: tradingDecision?.confidence,
      shouldTrade: tradingDecision?.shouldTrade
    });

    // Validate trading decision
    if (!tradingDecision || typeof tradingDecision !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid or missing trading decision',
        requestId
      }, { status: 400 });
    }

    const decision = tradingDecision;
    
    // Enhanced validation
    const validationErrors: string[] = [];
    if (!decision.symbol) validationErrors.push('Missing symbol');
    if (!decision.action || !['BUY', 'SELL', 'HOLD'].includes(decision.action)) {
      validationErrors.push('Invalid action');
    }
    if (typeof decision.confidence !== 'number' || decision.confidence < 0 || decision.confidence > 100) {
      validationErrors.push('Invalid confidence level');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        requestId
      }, { status: 400 });
    }

    // Risk assessment
    const riskChecks = {
      highRisk: decision.riskAssessment?.riskLevel === 'HIGH',
      lowConfidence: decision.confidence < 70,
      largePosition: (decision.positionSize || 0) > 0.1,
      noTradingSignal: !decision.shouldTrade
    };

    const riskWarnings = Object.entries(riskChecks)
      .filter(([_, failed]) => failed)
      .map(([check, _]) => check);

    let executionResult = {
      executed: false,
      orderId: null,
      executionPrice: null,
      quantity: null,
      timestamp: new Date().toISOString(),
      executionMode,
      reason: 'Not executed',
      exchange: null
    };

    // Execute if conditions are met
    if (decision.shouldTrade && !riskChecks.highRisk && decision.action !== 'HOLD') {
      try {
        // Calculate position size
        const capitalToUse = parseFloat(process.env.TRADING_CAPITAL || '50000');
        const positionValue = capitalToUse * (decision.positionSize || 0.05);
        const estimatedPrice = decision.entryPrice || 50000; // Default BTC price
        const quantity = Math.max(0.001, positionValue / estimatedPrice); // Min quantity for crypto

        // Use unified exchange manager for execution
        const orderParams = {
          symbol: decision.symbol,
          side: decision.action.toLowerCase() as 'buy' | 'sell',
          quantity: parseFloat(quantity.toFixed(6)),
          type: 'market' as const,
          price: decision.entryPrice,
          preferredExchange: 'binance',
          allowFallback: true
        };

        // Validate order through risk manager
        const validation = await advancedRiskManager.validateOrder(
          orderParams,
          orderParams.preferredExchange
        );

        if (validation.allowed) {
          const result = await unifiedExchangeManager.executeOrder(orderParams);
          
          if (result.success && result.orderResult) {
            executionResult = {
              executed: true,
              orderId: result.orderResult.orderId,
              executionPrice: result.orderResult.avgFillPrice,
              quantity: result.orderResult.filledQty,
              timestamp: new Date().toISOString(),
              executionMode,
              reason: `Successfully executed via ${result.exchange}`,
              exchange: result.exchange
            };

            // Record for transition tracking
            paperToLiveManager.recordTrade({
              symbol: decision.symbol,
              side: decision.action.toLowerCase(),
              quantity: result.orderResult.filledQty,
              entryPrice: result.orderResult.avgFillPrice,
              entryTime: new Date(),
              status: 'open',
              exchange: result.exchange
            });

            console.log('✅ AI Decision Executed:', {
              requestId,
              orderId: result.orderResult.orderId,
              symbol: decision.symbol,
              quantity: result.orderResult.filledQty,
              exchange: result.exchange
            });
          } else {
            executionResult.reason = `Execution failed: ${result.error}`;
          }
        } else {
          executionResult.reason = `Risk validation failed: ${validation.reason}`;
        }
      } catch (error: any) {
        console.error('❌ AI Decision Execution Error:', error);
        executionResult.reason = `Execution error: ${error.message}`;
      }
    } else {
      const reasons = [
        !decision.shouldTrade ? 'AI signal indicates HOLD' : null,
        riskChecks.highRisk ? 'Risk level too high' : null,
        riskChecks.lowConfidence ? 'Confidence below threshold' : null,
        decision.action === 'HOLD' ? 'Action is HOLD' : null
      ].filter(Boolean);

      executionResult.reason = `Not executed: ${reasons.join(', ')}`;
    }

    const executionTime = Date.now() - startTime;

    const response = {
      success: true,
      requestId,
      timestamp: new Date().toISOString(),
      execution: executionResult,
      tradingDecision: {
        ...decision,
        riskWarnings: riskWarnings.length > 0 ? riskWarnings : undefined
      },
      analysis: {
        riskChecks,
        executionRecommendation: decision.shouldTrade ? 'EXECUTE' : 'HOLD',
        confidenceLevel: decision.confidence >= 80 ? 'HIGH' : 
                        decision.confidence >= 60 ? 'MEDIUM' : 'LOW'
      },
      metadata: {
        executionTimeMs: executionTime,
        version: '2.0.0',
        executionMode
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('💥 AI Decision Execution Critical Error:', {
      requestId,
      error: error.message,
      executionTime: `${executionTime}ms`
    });

    return NextResponse.json({
      success: false,
      error: 'AI decision execution failed',
      details: error.message,
      requestId,
      executionTimeMs: executionTime
    }, { status: 500 });
  }
} 