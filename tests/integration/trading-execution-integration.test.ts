import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';

/**
 * Trading Execution Integration Test Suite
 * 
 * This test suite validates the enhanced trading execution endpoint
 * and ensures proper integration with risk management, portfolio tracking,
 * and credential management systems.
 * 
 * Test Coverage:
 * - /api/trading/enhanced-execution GET endpoints
 * - /api/trading/enhanced-execution POST endpoints
 * - Risk management integration
 * - Portfolio management
 * - Credential security
 * - AI decision execution
 * - Paper to live trading transition
 */

interface TestEnvironment {
  baseUrl: string;
  bearerToken: string;
  testCapital: number;
  testRiskTolerance: string;
}

interface TradingResponse {
  success: boolean;
  data?: any;
  error?: string;
  validation?: any;
  timestamp?: string;
}

interface AIDecisionRequest {
  tradingDecision: {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    shouldTrade: boolean;
    positionSize?: number;
    entryPrice?: number;
    riskAssessment?: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      maxLoss: number;
    };
  };
  executionMode: 'paper' | 'live';
  riskParameters?: {
    maxRisk: number;
    stopLoss: number;
  };
}

// Test environment configuration
const testEnv: TestEnvironment = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  bearerToken: process.env.API_INTEGRATION_BEARER_TOKEN || 'ai-trading-bot-secure-2025-integration',
  testCapital: 50000,
  testRiskTolerance: 'MEDIUM'
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
): Promise<{ response: Response; data: TradingResponse; responseTime: number }> => {
  const startTime = Date.now();
  
  const response = await fetch(`${testEnv.baseUrl}${endpoint}`, {
    method,
    headers: getHeaders(includeAuth),
    ...(body && { body: JSON.stringify(body) })
  });
  
  const responseTime = Date.now() - startTime;
  let data: TradingResponse;
  
  try {
    data = await response.json();
  } catch {
    data = { success: false, error: 'Failed to parse JSON response' };
  }
  
  return { response, data, responseTime };
};

// Test data generators
const generatePlaceOrderRequest = (overrides: any = {}) => ({
  action: 'place-order',
  symbol: 'BTC-USD',
  side: 'buy',
  quantity: 0.001,
  type: 'market',
  exchange: 'binance',
  ...overrides
});

const generateAIDecisionRequest = (overrides: Partial<AIDecisionRequest> = {}): AIDecisionRequest => ({
  tradingDecision: {
    symbol: 'BTC-USD',
    action: 'BUY',
    confidence: 85,
    shouldTrade: true,
    positionSize: 0.05,
    entryPrice: 50000,
    riskAssessment: {
      riskLevel: 'MEDIUM',
      maxLoss: 500
    },
    ...overrides.tradingDecision
  },
  executionMode: 'paper',
  riskParameters: {
    maxRisk: 0.02,
    stopLoss: 0.05
  },
  ...overrides
});

const generateCredentialRequest = () => ({
  action: 'store-credentials',
  exchange: 'binance',
  apiKey: 'test_api_key_' + Date.now(),
  apiSecret: 'test_api_secret_' + Date.now(),
  environment: 'testnet'
});

describe('Trading Execution Integration Tests', () => {
  let testResults: any[] = [];
  
  beforeAll(async () => {
    console.log('🚀 Starting Trading Execution Integration Test Suite...');
    console.log(`Base URL: ${testEnv.baseUrl}`);
    console.log(`Test Capital: $${testEnv.testCapital}`);
    
    // Verify trading endpoint is accessible
    const { response } = await makeRequest('/api/trading/enhanced-execution?action=status');
    if (!response.ok) {
      console.warn('⚠️  Trading endpoint not fully accessible, some tests may fail');
    }
  });

  afterAll(async () => {
    // Generate test report
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const avgResponseTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests || 0;
    
    console.log('\n📊 Trading Execution Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  });

  describe('GET Endpoints', () => {
    it('should get system status', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=status');
      
      testResults.push({
        test: 'System Status',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.timestamp).toBeDefined();
      expect(data.data.exchanges).toBeDefined();
      expect(data.data.riskManagement).toBeDefined();
      expect(responseTime).toBeLessThan(3000);
    });

    it('should get risk metrics', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=risk-metrics');
      
      testResults.push({
        test: 'Risk Metrics',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(responseTime).toBeLessThan(2000);
    });

    it('should get transition status', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=transition-status');
      
      testResults.push({
        test: 'Transition Status',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.currentMode).toBeDefined();
      expect(data.data.readinessScore).toBeDefined();
    });

    it('should get portfolio data', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=portfolio');
      
      testResults.push({
        test: 'Portfolio Data',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(responseTime).toBeLessThan(3000);
    });

    it('should get positions', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=positions&exchange=all');
      
      testResults.push({
        test: 'Positions Data',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should get credentials status', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=credentials-status');
      
      testResults.push({
        test: 'Credentials Status',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should get alerts', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=alerts');
      
      testResults.push({
        test: 'Risk Alerts',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get trades', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=trades&mode=paper');
      
      testResults.push({
        test: 'Trades History',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get performance metrics', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=performance&mode=paper');
      
      testResults.push({
        test: 'Performance Metrics',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle invalid GET action', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution?action=invalid_action');
      
      testResults.push({
        test: 'Invalid GET Action',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('Order Management', () => {
    it('should validate order before placement', async () => {
      const orderRequest = {
        action: 'validate-order',
        symbol: 'BTC-USD',
        side: 'buy',
        quantity: 0.001,
        type: 'market',
        exchange: 'binance'
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', orderRequest);
      
      testResults.push({
        test: 'Order Validation',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.validation).toBeDefined();
      expect(data.validation.allowed).toBeDefined();
    });

    it('should place a market order (paper trading)', async () => {
      const orderRequest = generatePlaceOrderRequest();
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', orderRequest);
      
      testResults.push({
        test: 'Place Market Order',
        passed: response.ok,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Orders can take time
    });

    it('should place a limit order', async () => {
      const orderRequest = generatePlaceOrderRequest({
        type: 'limit',
        price: 45000 // Below current market price for buy
      });
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', orderRequest);
      
      testResults.push({
        test: 'Place Limit Order',
        passed: response.ok,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
    });

    it('should handle order validation failure', async () => {
      const invalidOrderRequest = generatePlaceOrderRequest({
        quantity: 1000, // Extremely large quantity to trigger risk management
        side: 'buy'
      });
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', invalidOrderRequest);
      
      testResults.push({
        test: 'Order Validation Failure',
        passed: response.status === 400 || (response.ok && !data.success),
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      // Either 400 status or success=false with validation error
      if (response.status === 400) {
        expect(data.error).toContain('risk management');
      } else if (response.ok) {
        expect(data.success).toBe(false);
      }
    });

    it('should close a position', async () => {
      const closeRequest = {
        action: 'close-position',
        symbol: 'BTC-USD',
        exchange: 'binance'
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', closeRequest);
      
      testResults.push({
        test: 'Close Position',
        passed: response.ok,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const invalidRequest = {
        action: 'place-order'
        // Missing symbol, side, quantity
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', invalidRequest);
      
      testResults.push({
        test: 'Missing Order Fields',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('Risk Management', () => {
    it('should update risk configuration', async () => {
      const riskConfigRequest = {
        action: 'update-risk-config',
        config: {
          maxPositionSize: 0.1,
          maxDailyLoss: 0.02,
          emergencyStopLoss: 0.05,
          maxOpenPositions: 5
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', riskConfigRequest);
      
      testResults.push({
        test: 'Update Risk Config',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Risk management configuration updated');
    });

    it('should test exchange connections', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', { action: 'test-connections' });
      
      testResults.push({
        test: 'Test Exchange Connections',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(responseTime).toBeLessThan(10000); // Connection tests can be slow
    });

    it('should trigger emergency stop', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', { action: 'emergency-stop' });
      
      testResults.push({
        test: 'Emergency Stop',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Emergency stop activated');
    });
  });

  describe('AI Decision Execution', () => {
    it('should execute high-confidence AI decision', async () => {
      const aiRequest = generateAIDecisionRequest({
        tradingDecision: {
          symbol: 'BTC-USD',
          action: 'BUY',
          confidence: 90,
          shouldTrade: true,
          positionSize: 0.02,
          entryPrice: 50000,
          riskAssessment: {
            riskLevel: 'LOW',
            maxLoss: 200
          }
        }
      });
      aiRequest.action = 'execute-ai-decision';
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', aiRequest);
      
      testResults.push({
        test: 'AI Decision Execution - High Confidence',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.execution).toBeDefined();
      expect(data.tradingDecision).toBeDefined();
      expect(data.analysis).toBeDefined();
      expect(responseTime).toBeLessThan(8000); // AI execution can be complex
    });

    it('should reject low-confidence AI decision', async () => {
      const aiRequest = generateAIDecisionRequest({
        tradingDecision: {
          symbol: 'BTC-USD',
          action: 'BUY',
          confidence: 40, // Low confidence
          shouldTrade: true,
          positionSize: 0.05,
          riskAssessment: {
            riskLevel: 'MEDIUM',
            maxLoss: 500
          }
        }
      });
      aiRequest.action = 'execute-ai-decision';
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', aiRequest);
      
      testResults.push({
        test: 'AI Decision Rejection - Low Confidence',
        passed: response.ok && data.success && !data.execution.executed,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.execution.executed).toBe(false);
      expect(data.execution.reason).toContain('Confidence below threshold');
    });

    it('should reject high-risk AI decision', async () => {
      const aiRequest = generateAIDecisionRequest({
        tradingDecision: {
          symbol: 'BTC-USD',
          action: 'BUY',
          confidence: 85,
          shouldTrade: true,
          positionSize: 0.05,
          riskAssessment: {
            riskLevel: 'HIGH', // High risk
            maxLoss: 2000
          }
        }
      });
      aiRequest.action = 'execute-ai-decision';
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', aiRequest);
      
      testResults.push({
        test: 'AI Decision Rejection - High Risk',
        passed: response.ok && data.success && !data.execution.executed,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.execution.executed).toBe(false);
      expect(data.execution.reason).toContain('Risk level too high');
    });

    it('should handle HOLD AI decision', async () => {
      const aiRequest = generateAIDecisionRequest({
        tradingDecision: {
          symbol: 'BTC-USD',
          action: 'HOLD',
          confidence: 75,
          shouldTrade: false,
          positionSize: 0,
          riskAssessment: {
            riskLevel: 'MEDIUM',
            maxLoss: 0
          }
        }
      });
      aiRequest.action = 'execute-ai-decision';
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', aiRequest);
      
      testResults.push({
        test: 'AI Decision - HOLD Action',
        passed: response.ok && data.success && !data.execution.executed,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.execution.executed).toBe(false);
      expect(data.execution.reason).toContain('HOLD');
    });

    it('should validate AI decision format', async () => {
      const invalidAIRequest = {
        action: 'execute-ai-decision',
        tradingDecision: {
          // Missing required fields
          symbol: 'BTC-USD'
          // Missing action, confidence, shouldTrade
        }
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', invalidAIRequest);
      
      testResults.push({
        test: 'AI Decision Validation',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });
  });

  describe('Credential Management', () => {
    it('should store trading credentials securely', async () => {
      const credRequest = generateCredentialRequest();
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', credRequest);
      
      testResults.push({
        test: 'Store Credentials',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Credentials stored');
    });

    it('should rotate credentials', async () => {
      const rotateRequest = {
        action: 'rotate-credentials',
        exchange: 'binance',
        environment: 'testnet',
        newApiKey: 'rotated_key_' + Date.now(),
        newApiSecret: 'rotated_secret_' + Date.now()
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', rotateRequest);
      
      testResults.push({
        test: 'Rotate Credentials',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Credentials rotated');
    });

    it('should validate required credential fields', async () => {
      const invalidCredRequest = {
        action: 'store-credentials',
        exchange: 'binance'
        // Missing apiKey, apiSecret, environment
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', invalidCredRequest);
      
      testResults.push({
        test: 'Credential Validation',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('Paper to Live Trading Transition', () => {
    it('should initiate transition process', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', { action: 'initiate-transition' });
      
      testResults.push({
        test: 'Initiate Transition',
        passed: response.ok,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
    });

    it('should approve transition', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', { action: 'approve-transition' });
      
      testResults.push({
        test: 'Approve Transition',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('approved');
    });

    it('should reject transition with reason', async () => {
      const rejectRequest = {
        action: 'reject-transition',
        reason: 'Not meeting performance criteria'
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', rejectRequest);
      
      testResults.push({
        test: 'Reject Transition',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('rejected');
    });

    it('should revert to paper trading', async () => {
      const revertRequest = {
        action: 'revert-to-paper',
        reason: 'Test revert functionality'
      };
      
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', revertRequest);
      
      testResults.push({
        test: 'Revert to Paper',
        passed: response.ok && data.success,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Reverted to paper trading');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid action', async () => {
      const { response, data, responseTime } = await makeRequest('/api/trading/enhanced-execution', 'POST', { action: 'invalid-action' });
      
      testResults.push({
        test: 'Invalid POST Action',
        passed: response.status === 400,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
    });

    it('should handle malformed request body', async () => {
      const startTime = Date.now();
      const response = await fetch(`${testEnv.baseUrl}/api/trading/enhanced-execution`, {
        method: 'POST',
        headers: getHeaders(),
        body: 'invalid-json'
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      testResults.push({
        test: 'Malformed Request Body',
        passed: response.status === 500 || response.status === 400,
        responseTime,
        endpoint: '/api/trading/enhanced-execution'
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Performance Requirements', () => {
    it('should meet response time requirements', async () => {
      const performanceTests = [
        { action: 'status', maxTime: 3000 },
        { action: 'risk-metrics', maxTime: 2000 },
        { action: 'portfolio', maxTime: 3000 },
        { action: 'positions', maxTime: 2000 }
      ];
      
      for (const test of performanceTests) {
        const { responseTime } = await makeRequest(`/api/trading/enhanced-execution?action=${test.action}`);
        
        testResults.push({
          test: `Performance: ${test.action}`,
          passed: responseTime < test.maxTime,
          responseTime,
          endpoint: '/api/trading/enhanced-execution'
        });
        
        expect(responseTime).toBeLessThan(test.maxTime);
      }
    });
  });
});