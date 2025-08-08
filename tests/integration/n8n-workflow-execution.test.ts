import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';

/**
 * N8N Workflow Execution Test Suite
 * 
 * This comprehensive test suite validates the execution of all three n8n workflows:
 * 1. 🚀 ADVANCED AI TRADING ENGINE - AI-driven trading decisions and execution
 * 2. 💼 PORTFOLIO & RISK MONITOR - Portfolio tracking and risk management
 * 3. 📱 SMART NOTIFICATION SYSTEM - Alert and notification delivery
 * 
 * Test Coverage:
 * - End-to-end workflow execution
 * - Data flow validation
 * - Integration with external APIs
 * - Error handling and recovery
 * - Performance under various conditions
 */

interface WorkflowTestEnvironment {
  baseUrl: string;
  bearerToken: string;
  n8nWebhookUrl?: string;
  testCredentials: {
    alpaca: { key: string; secret: string };
    coingecko: { key: string };
    alphaVantage: { key: string };
    binance: { key: string };
  };
}

interface WorkflowResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionId?: string;
  workflow?: string;
  timestamp?: string;
  statusCode?: number;
}

interface WorkflowExecutionResult {
  workflowId: string;
  workflowName: string;
  executed: boolean;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
  outputData?: any;
}

// Test environment configuration
const testEnv: WorkflowTestEnvironment = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  bearerToken: process.env.API_INTEGRATION_BEARER_TOKEN || 'ai-trading-bot-secure-2025-integration',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
  testCredentials: {
    alpaca: {
      key: process.env.ALPACA_API_KEY || 'PK6V8YP89R7JPD2O5BA4',
      secret: process.env.ALPACA_API_SECRET || 'XfjX2P0pvowkkQP0fkkwbhMJBBcDnMorBW5e73DZ'
    },
    coingecko: {
      key: process.env.COINGECKO_API_KEY || 'CG-aQhKqxLWkcvpJdBi5gHKfQtB'
    },
    alphaVantage: {
      key: process.env.ALPHA_VANTAGE_API_KEY || '8PQA774S43BSMFME'
    },
    binance: {
      key: process.env.BINANCE_API_KEY || '428pEV4wB7JeFNUS8w5v0QBw7ed12L7A7pCpUwkSSsfnRtPWvJr1lgrFeoqpCpLB'
    }
  }
};

// Common request headers
const getHeaders = (includeAuth: boolean = true) => ({
  'Content-Type': 'application/json',
  ...(includeAuth && { 'Authorization': `Bearer ${testEnv.bearerToken}` })
});

// Helper function for API requests
const makeRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  includeAuth: boolean = true
): Promise<{ response: Response; data: WorkflowResponse; responseTime: number }> => {
  const startTime = Date.now();
  
  const response = await fetch(`${testEnv.baseUrl}${endpoint}`, {
    method,
    headers: getHeaders(includeAuth),
    ...(body && { body: JSON.stringify(body) })
  });
  
  const responseTime = Date.now() - startTime;
  let data: WorkflowResponse;
  
  try {
    data = await response.json();
  } catch {
    data = { success: false, error: 'Failed to parse JSON response' };
  }
  
  return { response, data, responseTime };
};

// Workflow-specific test data generators
const generateTradingWorkflowRequest = (symbol: string = 'BTC', overrides: any = {}) => ({
  action: 'TRADING',
  symbol,
  capital: 50000,
  riskTolerance: 'MEDIUM',
  strategy: 'AI_ADAPTIVE',
  timeframe: '1h',
  indicators: ['RSI', 'MACD', 'BOLLINGER_BANDS'],
  ...overrides
});

const generatePortfolioWorkflowRequest = (overrides: any = {}) => ({
  action: 'PORTFOLIO',
  accountId: 'test-account',
  includeHistory: true,
  timeframe: '1d',
  riskMetrics: true,
  performanceAnalysis: true,
  ...overrides
});

const generateNotificationWorkflowRequest = (overrides: any = {}) => ({
  action: 'NOTIFICATION',
  type: 'TRADING_ALERT',
  message: 'Test notification from workflow execution test',
  priority: 'HIGH',
  channels: ['telegram'],
  metadata: {
    symbol: 'BTC-USD',
    price: 50000,
    change: 2.5
  },
  ...overrides
});

// Workflow execution helper
const executeWorkflow = async (workflowRequest: any): Promise<WorkflowExecutionResult> => {
  const startTime = Date.now();
  const workflowName = `${workflowRequest.action}_WORKFLOW`;
  
  try {
    // Execute via webhook endpoint
    const { response, data } = await makeRequest('/api/n8n/webhook', 'POST', workflowRequest);
    const executionTime = Date.now() - startTime;
    
    return {
      workflowId: data.requestId || 'unknown',
      workflowName,
      executed: true,
      executionTime,
      success: response.ok && data.success,
      errorMessage: data.error,
      outputData: data.data
    };
  } catch (error: any) {
    return {
      workflowId: 'error',
      workflowName,
      executed: false,
      executionTime: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
      outputData: null
    };
  }
};

describe('N8N Workflow Execution Tests', () => {
  let testResults: any[] = [];
  let workflowExecutions: WorkflowExecutionResult[] = [];
  
  beforeAll(async () => {
    console.log('🚀 Starting N8N Workflow Execution Test Suite...');
    console.log(`Base URL: ${testEnv.baseUrl}`);
    console.log(`Bearer Token Set: ${!!testEnv.bearerToken}`);
    console.log(`API Keys Available: ${Object.keys(testEnv.testCredentials).join(', ')}`);
    
    // Verify webhook endpoint is accessible
    const { response } = await makeRequest('/api/n8n/webhook', 'GET', null, false);
    if (!response.ok) {
      console.warn('⚠️  N8N webhook endpoint not accessible, workflow tests may fail');
    }
  });

  afterAll(async () => {
    // Generate comprehensive workflow execution report
    const totalExecutions = workflowExecutions.length;
    const successfulExecutions = workflowExecutions.filter(e => e.success).length;
    const avgExecutionTime = workflowExecutions.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions || 0;
    
    console.log('\n📊 N8N Workflow Execution Summary:');
    console.log(`✅ Successful Executions: ${successfulExecutions}/${totalExecutions}`);
    console.log(`⏱️  Average Execution Time: ${avgExecutionTime.toFixed(2)}ms`);
    console.log(`🎯 Success Rate: ${((successfulExecutions / totalExecutions) * 100).toFixed(1)}%`);
    
    // Log individual workflow performance
    console.log('\n📋 Workflow Performance Breakdown:');
    const workflowGroups = workflowExecutions.reduce((acc, e) => {
      if (!acc[e.workflowName]) acc[e.workflowName] = [];
      acc[e.workflowName].push(e);
      return acc;
    }, {} as Record<string, WorkflowExecutionResult[]>);
    
    Object.entries(workflowGroups).forEach(([name, executions]) => {
      const successRate = (executions.filter(e => e.success).length / executions.length) * 100;
      const avgTime = executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length;
      console.log(`  ${name}: ${successRate.toFixed(1)}% success, ${avgTime.toFixed(0)}ms avg`);
    });
  });

  describe('🚀 ADVANCED AI TRADING ENGINE Workflow', () => {
    it('should execute basic trading decision workflow', async () => {
      const workflowRequest = generateTradingWorkflowRequest('BTC');
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'AI Trading Engine - Basic Execution',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.executed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(10000); // AI processing can take time
    });

    it('should handle multiple cryptocurrency symbols', async () => {
      const symbols = ['BTC', 'ETH', 'SOL', 'ADA'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const symbol of symbols) {
        const workflowRequest = generateTradingWorkflowRequest(symbol);
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'AI Trading Engine - Multiple Symbols',
        passed: successfulExecutions >= symbols.length * 0.8, // 80% success rate acceptable
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(symbols.length * 0.8);
    });

    it('should handle different risk tolerance levels', async () => {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const riskTolerance of riskLevels) {
        const workflowRequest = generateTradingWorkflowRequest('BTC', { riskTolerance });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const allSuccessful = results.every(r => r.success);
      testResults.push({
        test: 'AI Trading Engine - Risk Tolerance Levels',
        passed: allSuccessful,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(allSuccessful).toBe(true);
    });

    it('should process different trading strategies', async () => {
      const strategies = ['AI_ADAPTIVE', 'MOMENTUM', 'MEAN_REVERSION', 'BREAKOUT'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const strategy of strategies) {
        const workflowRequest = generateTradingWorkflowRequest('BTC', { strategy });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'AI Trading Engine - Trading Strategies',
        passed: successfulExecutions >= strategies.length * 0.75,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(strategies.length * 0.75);
    });

    it('should handle various timeframes', async () => {
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const timeframe of timeframes) {
        const workflowRequest = generateTradingWorkflowRequest('BTC', { timeframe });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'AI Trading Engine - Timeframes',
        passed: successfulExecutions >= timeframes.length * 0.8,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(timeframes.length * 0.8);
    });

    it('should validate capital allocation', async () => {
      const capitalAmounts = [1000, 10000, 50000, 100000];
      const results: WorkflowExecutionResult[] = [];
      
      for (const capital of capitalAmounts) {
        const workflowRequest = generateTradingWorkflowRequest('BTC', { capital });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      const allSuccessful = results.every(r => r.success);
      testResults.push({
        test: 'AI Trading Engine - Capital Allocation',
        passed: allSuccessful,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(allSuccessful).toBe(true);
    });
  });

  describe('💼 PORTFOLIO & RISK MONITOR Workflow', () => {
    it('should execute portfolio monitoring workflow', async () => {
      const workflowRequest = generatePortfolioWorkflowRequest();
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Portfolio Monitor - Basic Execution',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.executed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(8000); // Portfolio analysis can be complex
    });

    it('should monitor different portfolio timeframes', async () => {
      const timeframes = ['1h', '4h', '1d', '7d', '30d'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const timeframe of timeframes) {
        const workflowRequest = generatePortfolioWorkflowRequest({ timeframe });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'Portfolio Monitor - Timeframes',
        passed: successfulExecutions >= timeframes.length * 0.8,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(timeframes.length * 0.8);
    });

    it('should calculate risk metrics', async () => {
      const workflowRequest = generatePortfolioWorkflowRequest({
        riskMetrics: true,
        includeVaR: true,
        includeMaxDrawdown: true,
        includeSharpeRatio: true
      });
      
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Portfolio Monitor - Risk Metrics',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(10000); // Risk calculations can be intensive
    });

    it('should perform performance analysis', async () => {
      const workflowRequest = generatePortfolioWorkflowRequest({
        performanceAnalysis: true,
        benchmarkComparison: true,
        includeAlpha: true,
        includeBeta: true
      });
      
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Portfolio Monitor - Performance Analysis',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.success).toBe(true);
    });

    it('should handle multiple account monitoring', async () => {
      const accounts = ['test-account-1', 'test-account-2', 'test-account-3'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const accountId of accounts) {
        const workflowRequest = generatePortfolioWorkflowRequest({ accountId });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'Portfolio Monitor - Multiple Accounts',
        passed: successfulExecutions >= accounts.length * 0.7,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(accounts.length * 0.7);
    });

    it('should detect risk threshold breaches', async () => {
      const workflowRequest = generatePortfolioWorkflowRequest({
        riskThresholds: {
          maxDrawdown: 0.05,
          dailyVaR: 0.02,
          portfolioRisk: 0.8
        },
        alertOnBreach: true
      });
      
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Portfolio Monitor - Risk Threshold Detection',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('📱 SMART NOTIFICATION SYSTEM Workflow', () => {
    it('should execute basic notification workflow', async () => {
      const workflowRequest = generateNotificationWorkflowRequest();
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Notification System - Basic Execution',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.executed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(5000); // Notifications should be fast
    });

    it('should handle different notification types', async () => {
      const notificationTypes = [
        'TRADING_ALERT',
        'RISK_WARNING',
        'PORTFOLIO_UPDATE',
        'SYSTEM_STATUS',
        'PRICE_ALERT',
        'PERFORMANCE_REPORT'
      ];
      const results: WorkflowExecutionResult[] = [];
      
      for (const type of notificationTypes) {
        const workflowRequest = generateNotificationWorkflowRequest({
          type,
          message: `Test ${type.toLowerCase()} notification`
        });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'Notification System - Notification Types',
        passed: successfulExecutions >= notificationTypes.length * 0.8,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(notificationTypes.length * 0.8);
    });

    it('should handle different priority levels', async () => {
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const results: WorkflowExecutionResult[] = [];
      
      for (const priority of priorities) {
        const workflowRequest = generateNotificationWorkflowRequest({
          priority,
          message: `${priority} priority test notification`
        });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const allSuccessful = results.every(r => r.success);
      testResults.push({
        test: 'Notification System - Priority Levels',
        passed: allSuccessful,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(allSuccessful).toBe(true);
    });

    it('should support multiple notification channels', async () => {
      const channelConfigs = [
        { channels: ['telegram'] },
        { channels: ['email'] },
        { channels: ['webhook'] },
        { channels: ['telegram', 'email'] },
        { channels: ['telegram', 'webhook'] },
        { channels: ['telegram', 'email', 'webhook'] }
      ];
      const results: WorkflowExecutionResult[] = [];
      
      for (const config of channelConfigs) {
        const workflowRequest = generateNotificationWorkflowRequest({
          ...config,
          message: `Multi-channel test: ${config.channels.join(', ')}`
        });
        const result = await executeWorkflow(workflowRequest);
        results.push(result);
        workflowExecutions.push(result);
        
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      const successfulExecutions = results.filter(r => r.success).length;
      testResults.push({
        test: 'Notification System - Multiple Channels',
        passed: successfulExecutions >= channelConfigs.length * 0.7,
        responseTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(channelConfigs.length * 0.7);
    });

    it('should handle rich notification metadata', async () => {
      const workflowRequest = generateNotificationWorkflowRequest({
        type: 'TRADING_ALERT',
        message: 'BTC price movement detected',
        metadata: {
          symbol: 'BTC-USD',
          currentPrice: 52500,
          previousPrice: 50000,
          change: 5.0,
          volume: 1250000,
          timestamp: new Date().toISOString(),
          indicators: {
            RSI: 65.4,
            MACD: 0.025,
            BB_Upper: 53000,
            BB_Lower: 49000
          },
          recommendation: 'BUY',
          confidence: 0.85
        }
      });
      
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Notification System - Rich Metadata',
        passed: result.success,
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.success).toBe(true);
    });

    it('should batch notifications efficiently', async () => {
      // Send multiple notifications in quick succession
      const batchSize = 5;
      const requests = Array(batchSize).fill(null).map((_, i) => 
        generateNotificationWorkflowRequest({
          message: `Batch notification ${i + 1}`,
          metadata: { batchId: Date.now(), sequence: i + 1 }
        })
      );
      
      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => executeWorkflow(req))
      );
      const totalTime = Date.now() - startTime;
      
      workflowExecutions.push(...results);
      
      const successfulExecutions = results.filter(r => r.success).length;
      const avgTimePerNotification = totalTime / batchSize;
      
      testResults.push({
        test: 'Notification System - Batch Processing',
        passed: successfulExecutions >= batchSize * 0.8 && avgTimePerNotification < 2000,
        responseTime: avgTimePerNotification,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(batchSize * 0.8);
      expect(avgTimePerNotification).toBeLessThan(2000);
      console.log(`📊 Batch notification: ${successfulExecutions}/${batchSize} successful, ${avgTimePerNotification.toFixed(0)}ms avg`);
    });
  });

  describe('Cross-Workflow Integration', () => {
    it('should execute trading workflow followed by portfolio monitoring', async () => {
      // First execute a trading decision
      const tradingRequest = generateTradingWorkflowRequest('BTC');
      const tradingResult = await executeWorkflow(tradingRequest);
      workflowExecutions.push(tradingResult);
      
      // Wait for trade to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then monitor portfolio
      const portfolioRequest = generatePortfolioWorkflowRequest({
        includeRecentTrades: true
      });
      const portfolioResult = await executeWorkflow(portfolioRequest);
      workflowExecutions.push(portfolioResult);
      
      testResults.push({
        test: 'Cross-Workflow - Trading to Portfolio',
        passed: tradingResult.success && portfolioResult.success,
        responseTime: tradingResult.executionTime + portfolioResult.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(tradingResult.success).toBe(true);
      expect(portfolioResult.success).toBe(true);
    });

    it('should trigger notification after portfolio risk detection', async () => {
      // First monitor portfolio with risk thresholds
      const portfolioRequest = generatePortfolioWorkflowRequest({
        riskThresholds: { maxDrawdown: 0.01 }, // Very low threshold to trigger alert
        alertOnBreach: true
      });
      const portfolioResult = await executeWorkflow(portfolioRequest);
      workflowExecutions.push(portfolioResult);
      
      // Wait for risk assessment
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Then send risk notification
      const notificationRequest = generateNotificationWorkflowRequest({
        type: 'RISK_WARNING',
        priority: 'CRITICAL',
        message: 'Portfolio risk threshold exceeded',
        metadata: { triggeredBy: 'portfolio_monitor' }
      });
      const notificationResult = await executeWorkflow(notificationRequest);
      workflowExecutions.push(notificationResult);
      
      testResults.push({
        test: 'Cross-Workflow - Portfolio to Notification',
        passed: portfolioResult.success && notificationResult.success,
        responseTime: portfolioResult.executionTime + notificationResult.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(portfolioResult.success).toBe(true);
      expect(notificationResult.success).toBe(true);
    });
  });

  describe('Workflow Error Handling', () => {
    it('should handle invalid workflow parameters gracefully', async () => {
      const invalidRequests = [
        { action: 'TRADING', symbol: 'INVALID_SYMBOL' },
        { action: 'PORTFOLIO', accountId: 'non_existent_account' },
        { action: 'NOTIFICATION', channels: ['invalid_channel'] }
      ];
      
      for (const invalidRequest of invalidRequests) {
        const result = await executeWorkflow(invalidRequest);
        workflowExecutions.push(result);
        
        testResults.push({
          test: `Workflow Error Handling - ${invalidRequest.action}`,
          passed: result.executed, // Should execute but may fail gracefully
          responseTime: result.executionTime,
          endpoint: '/api/n8n/webhook'
        });

        expect(result.executed).toBe(true);
        // We expect the workflow to either succeed or fail gracefully, not crash
      }
    });

    it('should recover from temporary API failures', async () => {
      // This test simulates API failures by using invalid parameters
      // In a real scenario, you might mock external API failures
      const workflowRequest = generateTradingWorkflowRequest('BTC', {
        // Parameters that might cause external API calls to fail
        useInvalidApiKey: true
      });
      
      const result = await executeWorkflow(workflowRequest);
      workflowExecutions.push(result);
      
      testResults.push({
        test: 'Workflow Error Recovery',
        passed: result.executed, // Should handle the error and not crash
        responseTime: result.executionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(result.executed).toBe(true);
      expect(result.executionTime).toBeLessThan(15000); // Should timeout/fail fast
    });
  });

  describe('Workflow Performance', () => {
    it('should meet performance requirements under normal load', async () => {
      const performanceTests = [
        { workflow: generateTradingWorkflowRequest('BTC'), maxTime: 10000 },
        { workflow: generatePortfolioWorkflowRequest(), maxTime: 8000 },
        { workflow: generateNotificationWorkflowRequest(), maxTime: 5000 }
      ];
      
      for (const test of performanceTests) {
        const result = await executeWorkflow(test.workflow);
        workflowExecutions.push(result);
        
        testResults.push({
          test: `Performance - ${test.workflow.action} Workflow`,
          passed: result.success && result.executionTime < test.maxTime,
          responseTime: result.executionTime,
          endpoint: '/api/n8n/webhook'
        });

        expect(result.success).toBe(true);
        expect(result.executionTime).toBeLessThan(test.maxTime);
      }
    });

    it('should handle concurrent workflow executions', async () => {
      const concurrentRequests = [
        generateTradingWorkflowRequest('BTC'),
        generatePortfolioWorkflowRequest(),
        generateNotificationWorkflowRequest(),
        generateTradingWorkflowRequest('ETH'),
        generateNotificationWorkflowRequest({ priority: 'HIGH' })
      ];
      
      const startTime = Date.now();
      const results = await Promise.all(
        concurrentRequests.map(req => executeWorkflow(req))
      );
      const totalTime = Date.now() - startTime;
      
      workflowExecutions.push(...results);
      
      const successfulExecutions = results.filter(r => r.success).length;
      const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
      
      testResults.push({
        test: 'Workflow Performance - Concurrent Execution',
        passed: successfulExecutions >= concurrentRequests.length * 0.8,
        responseTime: avgExecutionTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(successfulExecutions).toBeGreaterThanOrEqual(concurrentRequests.length * 0.8);
      expect(totalTime).toBeLessThan(15000); // All workflows should complete within 15 seconds
      console.log(`📊 Concurrent execution: ${successfulExecutions}/${concurrentRequests.length} successful in ${totalTime}ms`);
    });
  });
});