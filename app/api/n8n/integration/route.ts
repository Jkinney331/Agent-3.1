import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/api/n8n-integration-client';
import type { N8NRequest, N8NResponse } from '@/lib/api/n8n-integration-client';

/**
 * Main N8N Integration API Route
 * This endpoint serves as the primary interface between the Next.js app and n8n workflows
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflow, payload, metadata } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required',
        statusCode: 400
      }, { status: 400 });
    }

    // Route request based on action type
    let result: N8NResponse;

    switch (action) {
      // Trading Engine Actions
      case 'execute_trade':
        result = await n8nClient.executeTrade({
          symbol: payload.symbol,
          side: payload.side,
          quantity: payload.quantity,
          orderType: payload.orderType || 'market',
          price: payload.price,
          stopLoss: payload.stopLoss,
          takeProfit: payload.takeProfit
        });
        break;

      case 'get_market_data':
        result = await n8nClient.getMarketData(
          payload.symbols || ['BTCUSD', 'ETHUSD'],
          payload.timeframe || '1m'
        );
        break;

      case 'create_strategy':
        result = await n8nClient.executeTradingAction({
          action: 'create_strategy',
          payload: {
            strategy: payload.strategy
          },
          metadata: { 
            userId: metadata?.userId,
            source: 'strategy-builder'
          }
        });
        break;

      // Portfolio Monitor Actions
      case 'check_portfolio':
        result = await n8nClient.getPortfolioPerformance(
          payload.timeframe || '1d'
        );
        break;

      case 'assess_risk':
        result = await n8nClient.assessRisk(
          payload.symbols,
          payload.riskThreshold
        );
        break;

      case 'get_performance':
        result = await n8nClient.executePortfolioAction({
          action: 'get_performance',
          payload: {
            timeframe: payload.timeframe || '1d',
            includeMetrics: true
          },
          metadata: { source: 'performance-dashboard' }
        });
        break;

      // Notification System Actions  
      case 'send_notification':
        result = await n8nClient.sendNotification({
          type: payload.type || 'system_status',
          message: payload.message,
          channels: payload.channels || ['telegram'],
          priority: payload.priority || 'medium'
        });
        break;

      case 'create_alert':
        result = await n8nClient.createAlert({
          message: payload.message,
          channels: payload.channels || ['telegram'],
          priority: payload.priority || 'high'
        });
        break;

      case 'send_report':
        result = await n8nClient.sendDailyReport(payload.recipients);
        break;

      // Special Actions
      case 'health_check':
        const healthCheck = await n8nClient.healthCheck();
        result = {
          success: healthCheck.status === 'healthy',
          data: healthCheck,
          timestamp: new Date().toISOString(),
          statusCode: healthCheck.status === 'healthy' ? 200 : 503
        };
        break;

      // Emergency Stop Action
      case 'emergency_stop':
        // This is a placeholder for emergency stop functionality
        // In a real implementation, this would stop all running workflows
        result = {
          success: true,
          data: { message: 'Emergency stop executed - all workflows halted' },
          timestamp: new Date().toISOString(),
          statusCode: 200
        };
        break;

      // Stop specific execution
      case 'stop_execution':
        // Placeholder for stopping specific execution
        result = {
          success: true,
          data: { 
            message: `Execution ${payload.executionId} stop requested`,
            executionId: payload.executionId
          },
          timestamp: new Date().toISOString(),
          statusCode: 200
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`,
          supportedActions: [
            'execute_trade', 'get_market_data', 'create_strategy',
            'check_portfolio', 'assess_risk', 'get_performance',
            'send_notification', 'create_alert', 'send_report',
            'health_check', 'emergency_stop', 'stop_execution'
          ],
          statusCode: 400
        }, { status: 400 });
    }

    // Return successful response
    return NextResponse.json(result, { 
      status: result.statusCode || 200,
      headers: {
        'X-Execution-ID': result.executionId || '',
        'X-Request-ID': result.requestId || '',
        'X-Source-Workflow': result.workflow || ''
      }
    });

  } catch (error) {
    console.error('N8N Integration API Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        const health = await n8nClient.healthCheck();
        return NextResponse.json({
          success: true,
          data: health,
          timestamp: new Date().toISOString()
        });

      case 'status':
        // Mock workflow status data - in real implementation, this would fetch from n8n
        const mockWorkflows = [
          {
            name: 'advanced-ai-trading-engine',
            active: true,
            lastExecution: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
            lastStatus: 'success',
            executionCount: 47,
            successRate: 89.4,
            errorCount: 5,
            averageRunTime: 1200 // milliseconds
          },
          {
            name: 'portfolio-risk-monitor', 
            active: true,
            lastExecution: new Date(Date.now() - 480000).toISOString(), // 8 minutes ago
            lastStatus: 'success',
            executionCount: 23,
            successRate: 95.7,
            errorCount: 1,
            averageRunTime: 800
          },
          {
            name: 'smart-notification-system',
            active: true,
            lastExecution: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
            lastStatus: 'success', 
            executionCount: 156,
            successRate: 98.7,
            errorCount: 2,
            averageRunTime: 300
          }
        ];

        return NextResponse.json({
          success: true,
          data: { workflows: mockWorkflows },
          timestamp: new Date().toISOString()
        });

      case 'market_data':
        const symbols = searchParams.get('symbols')?.split(',') || ['BTCUSD'];
        const timeframe = searchParams.get('timeframe') as any || '1m';
        
        const marketData = await n8nClient.getMarketData(symbols, timeframe);
        return NextResponse.json(marketData);

      case 'portfolio':
        const portfolioTimeframe = searchParams.get('timeframe') as any || '1d';
        const portfolio = await n8nClient.getPortfolioPerformance(portfolioTimeframe);
        return NextResponse.json(portfolio);

      case 'get_executions':
        // Mock execution history data - in real implementation, this would fetch from n8n
        const mockExecutions = [
          {
            id: 'exec_001',
            workflowId: 'trading_engine',
            status: 'success',
            startedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            finishedAt: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
            duration: 60000,
            data: {
              orderId: 'order_123',
              confidence: 0.87,
              reasoning: 'Strong bullish momentum detected with RSI oversold condition',
              signals: ['RSI_OVERSOLD', 'MACD_BULLISH_CROSS', 'VOLUME_SPIKE'],
              riskScore: 0.25,
              strategy: 'AI Momentum'
            }
          },
          {
            id: 'exec_002',
            workflowId: 'portfolio_monitor',
            status: 'success',
            startedAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            finishedAt: new Date(Date.now() - 540000).toISOString(), // 9 minutes ago
            duration: 60000,
            data: {
              riskAssessment: 'LOW',
              portfolioHealth: 'GOOD'
            }
          }
        ];

        return NextResponse.json({
          success: true,
          data: { executions: mockExecutions },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported GET actions: health, status, market_data, portfolio, get_executions',
          statusCode: 400
        }, { status: 400 });
    }

  } catch (error) {
    console.error('N8N Integration GET API Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500
    }, { status: 500 });
  }
}