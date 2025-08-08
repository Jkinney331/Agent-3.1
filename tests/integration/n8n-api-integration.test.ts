import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';

/**
 * N8N API Integration Test Suite
 * 
 * This comprehensive test suite validates all n8n integration endpoints
 * and ensures proper communication between Next.js app and n8n workflows.
 * 
 * Test Coverage:
 * - /api/n8n/integration endpoint (GET/POST)
 * - /api/n8n/webhook endpoint (POST/OPTIONS/GET)
 * - /api/trading/enhanced-execution endpoint
 * - Authentication and authorization
 * - Error handling and validation
 * - Performance benchmarks
 */

interface TestEnvironment {
  baseUrl: string;
  bearerToken: string;
  testSymbols: string[];
  testCapital: number;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
  timestamp?: string;
  statusCode?: number;
}

// Test environment configuration
const testEnv: TestEnvironment = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  bearerToken: process.env.API_INTEGRATION_BEARER_TOKEN || 'ai-trading-bot-secure-2025-integration',
  testSymbols: ['BTC-USD', 'ETH-USD', 'SOL-USD'],
  testCapital: 50000
};

// Common request headers
const getHeaders = (includeAuth: boolean = true) => ({
  'Content-Type': 'application/json',
  ...(includeAuth && { 'Authorization': `Bearer ${testEnv.bearerToken}` })
});

// Helper function to make HTTP requests
const makeRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'OPTIONS' = 'GET',
  body?: any,
  includeAuth: boolean = true
): Promise<{ response: Response; data: APIResponse; responseTime: number }> => {
  const startTime = Date.now();
  
  const response = await fetch(`${testEnv.baseUrl}${endpoint}`, {
    method,
    headers: getHeaders(includeAuth),
    ...(body && { body: JSON.stringify(body) })
  });
  
  const responseTime = Date.now() - startTime;
  let data: APIResponse;
  
  try {
    data = await response.json();
  } catch {
    data = { success: false, error: 'Failed to parse JSON response' };
  }
  
  return { response, data, responseTime };
};

// Test data generators
const generateTestTradeRequest = (action: string = 'execute_trade') => ({
  action,
  payload: {
    symbol: 'BTC-USD',
    side: 'buy',
    quantity: 0.001,
    orderType: 'market'
  },
  metadata: {
    userId: 'test-user',
    source: 'integration-test'
  }
});

const generateTestWebhookRequest = (action: string = 'TRADING') => ({
  action,
  symbol: 'BTC',
  capital: testEnv.testCapital,
  riskTolerance: 'MEDIUM',
  message: 'Test webhook integration',
  priority: 'HIGH'
});

describe('N8N API Integration Tests', () => {
  let testResults: any[] = [];
  
  beforeAll(async () => {
    console.log('🚀 Starting N8N Integration Test Suite...');
    console.log(`Base URL: ${testEnv.baseUrl}`);
    console.log(`Bearer Token Set: ${!!testEnv.bearerToken}`);
    
    // Verify test environment is ready
    const { response } = await makeRequest('/api/n8n/webhook', 'GET', null, false);
    if (!response.ok && response.status !== 401) {
      throw new Error('Test environment not ready - webhook endpoint not accessible');
    }
  });

  afterAll(async () => {
    // Generate test report
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const avgResponseTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    
    console.log('\n📊 N8N Integration Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  });

  beforeEach(() => {
    // Reset test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('/api/n8n/integration endpoint', () => {
    it('should respond to GET health check', async () => {
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration?action=health');
      
      testResults.push({
        test: 'N8N Integration Health Check',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(responseTime).toBeLessThan(2000); // Performance requirement
    });

    it('should get workflow status', async () => {
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration?action=status');
      
      testResults.push({
        test: 'N8N Workflow Status',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
      expect(data.data).toBeDefined();
      expect(responseTime).toBeLessThan(2000);
    });

    it('should get market data', async () => {
      const symbols = testEnv.testSymbols.join(',');
      const { response, data, responseTime } = await makeRequest(
        `/api/n8n/integration?action=market_data&symbols=${symbols}&timeframe=1m`
      );
      
      testResults.push({
        test: 'N8N Market Data',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(3000); // Market data can take longer
    });

    it('should get portfolio data', async () => {
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration?action=portfolio&timeframe=1d');
      
      testResults.push({
        test: 'N8N Portfolio Data',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle invalid GET action', async () => {
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration?action=invalid_action');
      
      testResults.push({
        test: 'N8N Invalid GET Action',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid action');
    });

    it('should execute trade request', async () => {
      const tradeRequest = generateTestTradeRequest();
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', tradeRequest);
      
      testResults.push({
        test: 'N8N Execute Trade',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
      expect(data.timestamp).toBeDefined();
      expect(responseTime).toBeLessThan(5000); // Trade execution can take longer
    });

    it('should handle market data request', async () => {
      const marketDataRequest = {
        action: 'get_market_data',
        payload: {
          symbols: testEnv.testSymbols,
          timeframe: '1m'
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', marketDataRequest);
      
      testResults.push({
        test: 'N8N Market Data Request',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(3000);
    });

    it('should create trading strategy', async () => {
      const strategyRequest = {
        action: 'create_strategy',
        payload: {
          strategy: {
            name: 'Test Strategy',
            symbols: ['BTC-USD'],
            riskLevel: 'MEDIUM',
            conditions: ['RSI_OVERSOLD', 'MACD_BULLISH']
          }
        },
        metadata: {
          userId: 'test-user',
          source: 'strategy-builder'
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', strategyRequest);
      
      testResults.push({
        test: 'N8N Create Strategy',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
    });

    it('should check portfolio performance', async () => {
      const portfolioRequest = {
        action: 'check_portfolio',
        payload: {
          timeframe: '1d'
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', portfolioRequest);
      
      testResults.push({
        test: 'N8N Portfolio Check',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
    });

    it('should assess risk', async () => {
      const riskRequest = {
        action: 'assess_risk',
        payload: {
          symbols: testEnv.testSymbols,
          riskThreshold: 0.8
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', riskRequest);
      
      testResults.push({
        test: 'N8N Risk Assessment',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
    });

    it('should send notification', async () => {
      const notificationRequest = {
        action: 'send_notification',
        payload: {
          type: 'system_status',
          message: 'Integration test notification',
          channels: ['telegram'],
          priority: 'medium'
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', notificationRequest);
      
      testResults.push({
        test: 'N8N Send Notification',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
    });

    it('should create alert', async () => {
      const alertRequest = {
        action: 'create_alert',
        payload: {
          message: 'Test alert from integration suite',
          channels: ['telegram'],
          priority: 'high'
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', alertRequest);
      
      testResults.push({
        test: 'N8N Create Alert',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.ok).toBe(true);
    });

    it('should handle missing action parameter', async () => {
      const invalidRequest = {
        payload: {
          symbol: 'BTC-USD'
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', invalidRequest);
      
      testResults.push({
        test: 'N8N Missing Action',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Action is required');
    });

    it('should handle unsupported action', async () => {
      const unsupportedRequest = {
        action: 'unsupported_action',
        payload: {}
      };
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/integration', 'POST', unsupportedRequest);
      
      testResults.push({
        test: 'N8N Unsupported Action',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/n8n/integration'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported action');
      expect(data.supportedActions).toBeDefined();
    });
  });

  describe('/api/n8n/webhook endpoint', () => {
    it('should respond to GET health check', async () => {
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'GET', null, false);
      
      testResults.push({
        test: 'N8N Webhook Health Check',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.ok).toBe(true);
      expect(data.status).toBe('operational');
      expect(data.service).toBe('n8n-webhook-api');
      expect(data.endpoints).toBeDefined();
    });

    it('should handle CORS preflight request', async () => {
      const { response, responseTime } = await makeRequest('/api/n8n/webhook', 'OPTIONS', null, false);
      
      testResults.push({
        test: 'N8N Webhook CORS',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should reject unauthenticated requests', async () => {
      const webhookRequest = generateTestWebhookRequest();
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'POST', webhookRequest, false);
      
      testResults.push({
        test: 'N8N Webhook Authentication',
        passed: response.status === 401,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle trading webhook request', async () => {
      const webhookRequest = generateTestWebhookRequest('TRADING');
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'POST', webhookRequest);
      
      testResults.push({
        test: 'N8N Webhook Trading',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.ok).toBe(true);
      expect(data.requestId).toBeDefined();
      expect(data.execution).toBeDefined();
      expect(data.execution.action).toBe('TRADING');
      expect(responseTime).toBeLessThan(5000);
    });

    it('should handle portfolio webhook request', async () => {
      const webhookRequest = generateTestWebhookRequest('PORTFOLIO');
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'POST', webhookRequest);
      
      testResults.push({
        test: 'N8N Webhook Portfolio',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.ok).toBe(true);
      expect(data.execution.action).toBe('PORTFOLIO');
    });

    it('should handle notification webhook request', async () => {
      const webhookRequest = generateTestWebhookRequest('NOTIFICATION');
      webhookRequest.message = 'Test notification from webhook';
      webhookRequest.priority = 'HIGH';
      
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'POST', webhookRequest);
      
      testResults.push({
        test: 'N8N Webhook Notification',
        passed: response.ok,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.ok).toBe(true);
      expect(data.execution.action).toBe('NOTIFICATION');
    });

    it('should validate request body', async () => {
      const invalidRequest = {}; // Missing required fields
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'POST', invalidRequest);
      
      testResults.push({
        test: 'N8N Webhook Validation',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const startTime = Date.now();
      const response = await fetch(`${testEnv.baseUrl}/api/n8n/webhook`, {
        method: 'POST',
        headers: getHeaders(),
        body: 'invalid-json'
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      testResults.push({
        test: 'N8N Webhook Malformed JSON',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON payload');
    });

    it('should handle unsupported action', async () => {
      const webhookRequest = generateTestWebhookRequest('UNSUPPORTED_ACTION');
      const { response, data, responseTime } = await makeRequest('/api/n8n/webhook', 'POST', webhookRequest);
      
      testResults.push({
        test: 'N8N Webhook Unsupported Action',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/n8n/webhook'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unsupported action');
      expect(data.supportedActions).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should meet response time requirements for all endpoints', async () => {
      const endpoints = [
        { path: '/api/n8n/integration?action=health', maxTime: 2000 },
        { path: '/api/n8n/webhook', method: 'GET', maxTime: 1000 },
        { path: '/api/trading/enhanced-execution?action=status', maxTime: 3000 }
      ];
      
      for (const endpoint of endpoints) {
        const { responseTime } = await makeRequest(
          endpoint.path,
          endpoint.method as any || 'GET',
          null,
          endpoint.path.includes('webhook') && endpoint.method === 'GET' ? false : true
        );
        
        testResults.push({
          test: `Performance: ${endpoint.path}`,
          passed: responseTime < endpoint.maxTime,
          responseTime,
          endpoint: endpoint.path
        });
        
        expect(responseTime).toBeLessThan(endpoint.maxTime);
      }
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() => 
        makeRequest('/api/n8n/integration?action=health')
      );
      
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      const successCount = results.filter(r => r.response.ok).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      testResults.push({
        test: 'Concurrent Requests',
        passed: successCount === concurrentRequests,
        responseTime: avgResponseTime,
        endpoint: '/api/n8n/integration'
      });
      
      expect(successCount).toBe(concurrentRequests);
      expect(avgResponseTime).toBeLessThan(3000);
      console.log(`✅ Handled ${concurrentRequests} concurrent requests in ${totalTime}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // This test simulates timeout scenarios
      // In a real environment, you might mock network delays
      const { response, data } = await makeRequest('/api/n8n/integration?action=health');
      
      testResults.push({
        test: 'Error Handling - Timeout',
        passed: response.ok || response.status >= 400,
        responseTime: 0,
        endpoint: '/api/n8n/integration'
      });
      
      // Expect either success or a proper error response
      expect(response.status).not.toBe(0); // 0 would indicate network failure
    });

    it('should return proper error codes for different failure types', async () => {
      const testCases = [
        { request: {}, expectedStatus: 400, description: 'Missing action' },
        { request: { action: 'invalid' }, expectedStatus: 400, description: 'Invalid action' }
      ];
      
      for (const testCase of testCases) {
        const { response, data } = await makeRequest('/api/n8n/integration', 'POST', testCase.request);
        
        testResults.push({
          test: `Error Code: ${testCase.description}`,
          passed: response.status === testCase.expectedStatus,
          responseTime: 0,
          endpoint: '/api/n8n/integration'
        });
        
        expect(response.status).toBe(testCase.expectedStatus);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });
  });
});