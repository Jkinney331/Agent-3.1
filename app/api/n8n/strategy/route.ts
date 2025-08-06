import { NextRequest, NextResponse } from 'next/server';

// Mock N8N API endpoints - replace with actual N8N instance URLs
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

interface StrategyConfig {
  id: string;
  name: string;
  type: 'momentum' | 'meanReversion' | 'arbitrage' | 'aiAdaptive';
  parameters: {
    riskLevel: number;
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    timeframe: string;
    symbols: string[];
  };
  status: 'active' | 'paused' | 'stopped';
}

interface N8NWorkflowExecution {
  workflowId: string;
  data: any;
  triggerNode: string;
}

async function executeN8NWorkflow(workflowId: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify({
        data: {
          main: [data]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('N8N workflow execution failed:', error);
    throw error;
  }
}

async function updateN8NWorkflowSettings(workflowId: string, settings: any): Promise<any> {
  try {
    // First get the current workflow
    const getResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();

    // Update workflow with new settings
    const updatedWorkflow = {
      ...workflow,
      staticData: {
        ...workflow.staticData,
        strategy: settings
      }
    };

    const updateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(updatedWorkflow)
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update workflow: ${updateResponse.status}`);
    }

    return await updateResponse.json();
  } catch (error) {
    console.error('N8N workflow update failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, strategy, workflowId, data } = body;

    switch (action) {
      case 'create':
        // Create new strategy in N8N Master Trading Orchestrator
        const createResult = await executeN8NWorkflow('master-trading-orchestrator', {
          action: 'createStrategy',
          strategy: strategy,
          timestamp: new Date().toISOString()
        });

        // Also update the strategy management workflow
        await updateN8NWorkflowSettings('strategy-manager', {
          strategies: {
            [strategy.id]: strategy
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Strategy created in N8N workflows',
          data: createResult,
          n8nExecutionId: createResult.executionId
        });

      case 'update':
        // Update existing strategy in N8N
        const updateResult = await executeN8NWorkflow('strategy-manager', {
          action: 'updateStrategy',
          strategyId: strategy.id,
          parameters: strategy.parameters,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'Strategy updated in N8N workflows',
          data: updateResult
        });

      case 'toggle':
        // Toggle strategy status in N8N
        const toggleResult = await executeN8NWorkflow('master-trading-orchestrator', {
          action: 'toggleStrategy',
          strategyId: strategy.id || data.strategyId,
          status: strategy.status === 'active' ? 'paused' : 'active',
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'Strategy status toggled in N8N workflows',
          data: toggleResult
        });

      case 'performance':
        // Request strategy performance data from N8N
        const performanceResult = await executeN8NWorkflow('portfolio-performance', {
          action: 'getStrategyPerformance',
          strategyId: data.strategyId,
          timeframe: data.timeframe || '7d',
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'Strategy performance retrieved from N8N',
          data: performanceResult
        });

      case 'risk-check':
        // Perform risk assessment via N8N Risk Management Monitor
        const riskResult = await executeN8NWorkflow('risk-management-monitor', {
          action: 'assessStrategyRisk',
          strategy: strategy,
          currentPositions: data.positions || [],
          marketConditions: data.marketConditions || {},
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'Risk assessment completed via N8N',
          data: riskResult
        });

      case 'notify':
        // Send notifications via N8N Notification Manager
        const notifyResult = await executeN8NWorkflow('notification-manager', {
          action: 'sendNotification',
          type: data.type || 'strategy',
          message: data.message,
          channels: data.channels || ['telegram', 'email'],
          priority: data.priority || 'medium',
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          message: 'Notification sent via N8N',
          data: notifyResult
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('N8N Strategy API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Failed to communicate with N8N workflows'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const strategyId = searchParams.get('strategyId');

    switch (action) {
      case 'status':
        // Get strategy status from N8N
        const statusResult = await executeN8NWorkflow('strategy-manager', {
          action: 'getStrategyStatus',
          strategyId: strategyId,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          data: statusResult
        });

      case 'performance':
        // Get performance metrics from N8N
        const performanceResult = await executeN8NWorkflow('portfolio-performance', {
          action: 'getPerformanceMetrics',
          strategyId: strategyId,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: true,
          data: performanceResult
        });

      case 'workflows':
        // Get all N8N workflow statuses
        const workflowsResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
          }
        });

        if (!workflowsResponse.ok) {
          throw new Error('Failed to fetch N8N workflows');
        }

        const workflows = await workflowsResponse.json();
        
        return NextResponse.json({
          success: true,
          data: {
            workflows: workflows.data || workflows,
            totalCount: workflows.data?.length || 0,
            activeCount: workflows.data?.filter((w: any) => w.active).length || 0
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('N8N Strategy GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 