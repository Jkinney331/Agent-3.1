/**
 * N8N Integration Client
 * Provides a typed interface for communicating with the n8n API Integration Workflow
 */

interface N8NRequestBase {
  action: string;
  workflow?: 'trading' | 'portfolio' | 'notification' | 'auto';
  payload: Record<string, any>;
  metadata?: {
    userId?: string;
    source?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };
}

interface N8NResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'trading_engine' | 'portfolio_monitor' | 'notification_system';
  timestamp: string;
  executionId?: string;
  workflow?: string;
  statusCode: number;
  requestId?: string;
}

// Trading Engine Actions
export interface TradingRequest extends N8NRequestBase {
  action: 'execute_trade' | 'get_market_data' | 'manage_positions' | 'create_strategy';
  payload: {
    symbol?: string;
    side?: 'buy' | 'sell';
    quantity?: number;
    orderType?: 'market' | 'limit' | 'stop';
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    strategy?: {
      id: string;
      type: 'momentum' | 'meanReversion' | 'arbitrage' | 'aiAdaptive';
      parameters: Record<string, any>;
    };
  };
}

// Portfolio Monitor Actions
export interface PortfolioRequest extends N8NRequestBase {
  action: 'check_portfolio' | 'assess_risk' | 'get_performance' | 'monitor_positions';
  payload: {
    timeframe?: '1h' | '1d' | '1w' | '1m';
    includeMetrics?: boolean;
    riskThreshold?: number;
    symbols?: string[];
  };
}

// Notification System Actions
export interface NotificationRequest extends N8NRequestBase {
  action: 'send_notification' | 'create_alert' | 'send_report';
  payload: {
    type: 'trade_execution' | 'risk_alert' | 'portfolio_update' | 'system_status' | 'daily_report';
    message: string;
    channels: ('telegram' | 'email' | 'webhook' | 'sms')[];
    recipients?: string[];
    attachments?: {
      type: 'chart' | 'report' | 'data';
      url?: string;
      data?: any;
    }[];
  };
}

export type N8NRequest = TradingRequest | PortfolioRequest | NotificationRequest;

export class N8NIntegrationClient {
  private baseUrl: string;
  private bearerToken: string;
  private timeout: number;

  constructor(config: {
    baseUrl?: string;
    bearerToken: string;
    timeout?: number;
  }) {
    this.baseUrl = config.baseUrl || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
    this.bearerToken = config.bearerToken;
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Execute a trading action via n8n
   */
  async executeTradingAction(request: Omit<TradingRequest, 'workflow'>): Promise<N8NResponse> {
    return this.makeRequest({
      ...request,
      workflow: 'trading'
    });
  }

  /**
   * Execute a portfolio monitoring action via n8n
   */
  async executePortfolioAction(request: Omit<PortfolioRequest, 'workflow'>): Promise<N8NResponse> {
    return this.makeRequest({
      ...request,
      workflow: 'portfolio'
    });
  }

  /**
   * Execute a notification action via n8n
   */
  async executeNotificationAction(request: Omit<NotificationRequest, 'workflow'>): Promise<N8NResponse> {
    return this.makeRequest({
      ...request,
      workflow: 'notification'
    });
  }

  /**
   * Execute market data retrieval
   */
  async getMarketData(symbols: string[], timeframe: '1m' | '5m' | '15m' | '1h' | '1d' = '1m'): Promise<N8NResponse> {
    return this.executeTradingAction({
      action: 'get_market_data',
      payload: { symbols, timeframe },
      metadata: { source: 'market-data-request' }
    });
  }

  /**
   * Execute a trade
   */
  async executeTrade(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    orderType?: 'market' | 'limit';
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
  }): Promise<N8NResponse> {
    return this.executeTradingAction({
      action: 'execute_trade',
      payload: params,
      metadata: { 
        source: 'trade-execution',
        priority: 'high'
      }
    });
  }

  /**
   * Check portfolio performance
   */
  async getPortfolioPerformance(timeframe: '1h' | '1d' | '1w' | '1m' = '1d'): Promise<N8NResponse> {
    return this.executePortfolioAction({
      action: 'get_performance',
      payload: { timeframe, includeMetrics: true },
      metadata: { source: 'performance-check' }
    });
  }

  /**
   * Assess risk levels
   */
  async assessRisk(symbols?: string[], riskThreshold?: number): Promise<N8NResponse> {
    return this.executePortfolioAction({
      action: 'assess_risk',
      payload: { symbols, riskThreshold },
      metadata: { source: 'risk-assessment' }
    });
  }

  /**
   * Send notification
   */
  async sendNotification(params: {
    type: 'trade_execution' | 'risk_alert' | 'portfolio_update' | 'system_status' | 'daily_report';
    message: string;
    channels: ('telegram' | 'email' | 'webhook' | 'sms')[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<N8NResponse> {
    return this.executeNotificationAction({
      action: 'send_notification',
      payload: {
        type: params.type,
        message: params.message,
        channels: params.channels
      },
      metadata: { 
        source: 'notification-service',
        priority: params.priority || 'medium'
      }
    });
  }

  /**
   * Create an alert
   */
  async createAlert(params: {
    message: string;
    channels: ('telegram' | 'email' | 'webhook' | 'sms')[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<N8NResponse> {
    return this.executeNotificationAction({
      action: 'create_alert',
      payload: {
        type: 'risk_alert',
        message: params.message,
        channels: params.channels
      },
      metadata: {
        source: 'alert-system',
        priority: params.priority
      }
    });
  }

  /**
   * Generate and send daily report
   */
  async sendDailyReport(recipients?: string[]): Promise<N8NResponse> {
    return this.executeNotificationAction({
      action: 'send_report',
      payload: {
        type: 'daily_report',
        message: 'Daily trading performance report',
        channels: ['telegram', 'email'],
        recipients
      },
      metadata: {
        source: 'daily-report-generator',
        priority: 'low'
      }
    });
  }

  /**
   * Generic method to make requests to n8n
   */
  private async makeRequest(request: N8NRequest): Promise<N8NResponse> {
    const url = `${this.baseUrl}/webhook/api-integration`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bearerToken}`,
          'Accept': 'application/json',
          'User-Agent': 'NextJS-Trading-Bot/1.0'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `N8N API request failed: ${response.status} ${response.statusText}. ${errorData.error || ''}`
        );
      }

      const data = await response.json();

      // Validate response format
      if (!data.hasOwnProperty('success')) {
        throw new Error('Invalid response format from N8N workflow');
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`N8N request timed out after ${this.timeout}ms`);
        }
        throw error;
      }
      
      throw new Error(`Unknown error occurred during N8N request: ${error}`);
    }
  }

  /**
   * Health check to verify n8n integration is working
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      const response = await this.getMarketData(['BTCUSD'], '1m');
      
      if (response.success) {
        return {
          status: 'healthy',
          details: `Connected to n8n. Execution ID: ${response.executionId}`
        };
      } else {
        return {
          status: 'unhealthy',
          details: `N8N responded but with error: ${response.error}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: `Failed to connect to n8n: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get workflow status and statistics
   */
  async getWorkflowStatus(): Promise<N8NResponse> {
    // This would require a custom endpoint in n8n or use the n8n API directly
    // For now, we'll use a market data request as a proxy for workflow health
    return this.getMarketData(['BTCUSD'], '1m');
  }
}

// Export a pre-configured instance
export const n8nClient = new N8NIntegrationClient({
  bearerToken: process.env.N8N_API_INTEGRATION_TOKEN || 'your-bearer-token-here',
  baseUrl: process.env.N8N_WEBHOOK_URL,
  timeout: 45000 // 45 seconds for trading operations
});

// Export types for use in other files
export type {
  N8NRequest,
  N8NResponse,
  TradingRequest,
  PortfolioRequest,
  NotificationRequest
};