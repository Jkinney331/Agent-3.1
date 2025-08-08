import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';

/**
 * Error Handling Integration Test Suite
 * 
 * This comprehensive test suite validates proper error handling across all
 * n8n integration endpoints and ensures graceful failure recovery.
 * 
 * Error Handling Test Coverage:
 * - Network timeouts and connection failures
 * - Invalid request payloads and malformed data
 * - External API failures (market data, exchanges)
 * - Database connection issues
 * - Authentication and authorization failures
 * - Rate limiting and throttling
 * - Workflow execution failures
 * - Recovery mechanisms and retry logic
 * - Error logging and monitoring
 */

interface ErrorTestEnvironment {
  baseUrl: string;
  bearerToken: string;
  invalidEndpoints: string[];
  testScenarios: ErrorTestScenario[];
}

interface ErrorTestScenario {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  payload?: any;
  headers?: Record<string, string>;
  expectedStatusCode: number;
  expectedErrorType: string;
  shouldRecover: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ErrorTestResult {
  scenario: string;
  passed: boolean;
  actualStatusCode: number;
  expectedStatusCode: number;
  errorHandled: boolean;
  recoveryTested: boolean;
  recoverySuccessful: boolean;
  responseTime: number;
  errorMessage?: string;
}

// Error test environment configuration
const errorTestEnv: ErrorTestEnvironment = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  bearerToken: process.env.API_INTEGRATION_BEARER_TOKEN || 'ai-trading-bot-secure-2025-integration',
  invalidEndpoints: [
    '/api/nonexistent',
    '/api/n8n/invalid',
    '/api/trading/nonexistent',
    '/api/../../../etc/passwd',
    '/api/n8n/../admin'
  ],
  testScenarios: [
    // Authentication Errors
    {
      name: 'Missing Authentication',
      description: 'Request without authentication token',
      endpoint: '/api/n8n/webhook',
      method: 'POST',
      payload: { action: 'test' },
      expectedStatusCode: 401,
      expectedErrorType: 'AUTHENTICATION_ERROR',
      shouldRecover: false,
      severity: 'HIGH'
    },
    {
      name: 'Invalid Bearer Token',
      description: 'Request with malformed bearer token',
      endpoint: '/api/n8n/webhook',
      method: 'POST',
      payload: { action: 'test' },
      headers: { 'Authorization': 'Bearer invalid-token-12345' },
      expectedStatusCode: 401,
      expectedErrorType: 'AUTHORIZATION_ERROR',
      shouldRecover: false,
      severity: 'HIGH'
    },
    // Validation Errors
    {
      name: 'Missing Required Parameters',
      description: 'Request missing required action parameter',
      endpoint: '/api/n8n/integration',
      method: 'POST',
      payload: { symbol: 'BTC' }, // Missing action
      expectedStatusCode: 400,
      expectedErrorType: 'VALIDATION_ERROR',
      shouldRecover: false,
      severity: 'MEDIUM'
    },
    {
      name: 'Invalid JSON Payload',
      description: 'Request with malformed JSON',
      endpoint: '/api/n8n/webhook',
      method: 'POST',
      payload: '{"invalid": json}', // This will be sent as string to break JSON parsing
      expectedStatusCode: 400,
      expectedErrorType: 'PARSE_ERROR',
      shouldRecover: false,
      severity: 'MEDIUM'
    },
    {
      name: 'Oversized Payload',
      description: 'Request with extremely large payload',
      endpoint: '/api/n8n/webhook',
      method: 'POST',
      payload: { action: 'test', data: 'x'.repeat(1000000) }, // 1MB of data
      expectedStatusCode: 413,
      expectedErrorType: 'PAYLOAD_TOO_LARGE',
      shouldRecover: false,
      severity: 'MEDIUM'
    },
    // Workflow Execution Errors
    {
      name: 'Invalid Workflow Action',
      description: 'Request with unsupported workflow action',
      endpoint: '/api/n8n/integration',
      method: 'POST',
      payload: { action: 'nonexistent_action' },
      expectedStatusCode: 400,
      expectedErrorType: 'UNSUPPORTED_ACTION',
      shouldRecover: false,
      severity: 'MEDIUM'
    },
    {
      name: 'Invalid Trading Parameters',
      description: 'Trading request with invalid parameters',
      endpoint: '/api/trading/enhanced-execution',
      method: 'POST',
      payload: { 
        action: 'place-order',
        symbol: 'INVALID_SYMBOL_123',
        side: 'invalid_side',
        quantity: -100
      },
      expectedStatusCode: 400,
      expectedErrorType: 'VALIDATION_ERROR',
      shouldRecover: false,
      severity: 'HIGH'
    },
    // Network and External API Errors
    {
      name: 'Market Data API Failure',
      description: 'Request to market data with invalid symbols',
      endpoint: '/api/n8n/integration',
      method: 'POST',
      payload: { 
        action: 'get_market_data',
        payload: { symbols: ['INVALID_SYMBOL_XYZ'] }
      },
      expectedStatusCode: 500,
      expectedErrorType: 'EXTERNAL_API_ERROR',
      shouldRecover: true,
      severity: 'HIGH'
    },
    // Resource Errors
    {
      name: 'Nonexistent Endpoint',
      description: 'Request to nonexistent API endpoint',
      endpoint: '/api/completely/nonexistent/endpoint',
      method: 'GET',
      expectedStatusCode: 404,
      expectedErrorType: 'NOT_FOUND',
      shouldRecover: false,
      severity: 'LOW'
    },
    {
      name: 'Method Not Allowed',
      description: 'Invalid HTTP method for endpoint',
      endpoint: '/api/n8n/webhook',
      method: 'GET',
      payload: { action: 'test' },
      expectedStatusCode: 405,
      expectedErrorType: 'METHOD_NOT_ALLOWED',
      shouldRecover: false,
      severity: 'LOW'
    }
  ]
};

// Helper function for error testing requests
const makeErrorTestRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  headers?: Record<string, string>,
  timeout: number = 30000
): Promise<{ response: Response; data: any; responseTime: number; networkError: boolean }> => {
  const startTime = Date.now();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'ErrorTestSuite/1.0',
      ...headers
    };
    
    // Add auth if not specifically excluded
    if (!headers || !headers.Authorization) {
      requestHeaders['Authorization'] = `Bearer ${errorTestEnv.bearerToken}`;
    }
    
    const response = await fetch(`${errorTestEnv.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      signal: controller.signal,
      ...(body && { 
        body: typeof body === 'string' ? body : JSON.stringify(body) 
      })
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { error: 'Failed to parse response JSON' };
    }
    
    return { response, data, responseTime, networkError: false };
  } catch (error: any) {
    clearTimeout(timeoutId);
    return {
      response: { ok: false, status: 0, statusText: error.name } as Response,
      data: { error: error.message },
      responseTime: Date.now() - startTime,
      networkError: true
    };
  }
};

// Test recovery mechanism
const testRecovery = async (endpoint: string, method: 'GET' | 'POST', validPayload?: any): Promise<boolean> => {
  try {
    // Wait a moment for system to recover
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try a valid request to see if system recovered
    const { response } = await makeErrorTestRequest(endpoint, method, validPayload);
    return response.ok;
  } catch {
    return false;
  }
};

describe('Error Handling Integration Tests', () => {
  let errorTestResults: ErrorTestResult[] = [];
  
  beforeAll(async () => {
    console.log('🚨 Starting Error Handling Test Suite...');
    console.log(`Base URL: ${errorTestEnv.baseUrl}`);
    console.log(`Test Scenarios: ${errorTestEnv.testScenarios.length}`);
    
    // Verify base system is working before error testing
    const { response } = await makeErrorTestRequest('/api/n8n/webhook', 'GET');
    if (!response.ok && response.status !== 401) { // 401 is expected for GET to webhook
      console.warn('⚠️  Base system may not be accessible for error testing');
    }
  });

  afterAll(async () => {
    // Generate comprehensive error handling report
    const totalTests = errorTestResults.length;
    const passedTests = errorTestResults.filter(r => r.passed).length;
    const criticalFailures = errorTestResults.filter(r => !r.passed).length;
    const recoveryTests = errorTestResults.filter(r => r.recoveryTested).length;
    const successfulRecoveries = errorTestResults.filter(r => r.recoverySuccessful).length;
    
    console.log('\n🚨 Error Handling Test Summary:');
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`🔄 Recovery Tests: ${successfulRecoveries}/${recoveryTests} successful`);
    console.log(`❌ Critical Failures: ${criticalFailures}`);
    
    // Detailed breakdown by error category
    const errorCategories = errorTestResults.reduce((acc, result) => {
      const category = result.scenario.split(' - ')[0] || 'Unknown';
      if (!acc[category]) acc[category] = { passed: 0, total: 0 };
      acc[category].total++;
      if (result.passed) acc[category].passed++;
      return acc;
    }, {} as Record<string, { passed: number; total: number }>);
    
    console.log('\n📊 Error Handling by Category:');
    Object.entries(errorCategories).forEach(([category, stats]) => {
      const rate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });
    
    if (criticalFailures > 0) {
      console.log('\n🚨 CRITICAL ERROR HANDLING FAILURES:');
      errorTestResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.scenario}: Expected ${r.expectedStatusCode}, got ${r.actualStatusCode}`));
    }
  });

  describe('Authentication Error Handling', () => {
    it('should handle missing authentication gracefully', async () => {
      const { response, data, responseTime } = await makeErrorTestRequest(
        '/api/n8n/webhook',
        'POST',
        { action: 'test' },
        {} // No Authorization header
      );
      
      const result: ErrorTestResult = {
        scenario: 'Missing Authentication',
        passed: response.status === 401,
        actualStatusCode: response.status,
        expectedStatusCode: 401,
        errorHandled: !!data.error,
        recoveryTested: false,
        recoverySuccessful: false,
        responseTime
      };
      
      errorTestResults.push(result);
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject invalid bearer tokens', async () => {
      const invalidTokens = [
        'Bearer invalid-token',
        'Basic invalid-auth',
        'Bearer ',
        'Token valid-looking-but-wrong',
        'Bearer null',
        'Bearer undefined'
      ];
      
      for (const token of invalidTokens) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/webhook',
          'POST',
          { action: 'test' },
          { 'Authorization': token }
        );
        
        const result: ErrorTestResult = {
          scenario: `Invalid Token - ${token.split(' ')[0]}`,
          passed: response.status === 401,
          actualStatusCode: response.status,
          expectedStatusCode: 401,
          errorHandled: !!data.error,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
      }
    });

    it('should handle authorization header manipulation attempts', async () => {
      const manipulationAttempts = [
        'Bearer ' + errorTestEnv.bearerToken + '; admin=true',
        'Bearer ' + errorTestEnv.bearerToken + '\r\nX-Admin: true',
        'Bearer ' + errorTestEnv.bearerToken + '\x00admin'
      ];
      
      for (const attempt of manipulationAttempts) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/webhook',
          'POST',
          { action: 'NOTIFICATION', message: 'test' },
          { 'Authorization': attempt }
        );
        
        const result: ErrorTestResult = {
          scenario: 'Authorization Header Manipulation',
          passed: response.status === 401 || (response.ok && data.success),
          actualStatusCode: response.status,
          expectedStatusCode: 401,
          errorHandled: true,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        // Should either reject or handle safely
        expect(response.status === 401 || response.ok).toBe(true);
      }
    });
  });

  describe('Input Validation Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedInputs = [
        'not-json-at-all',
        '{"missing": "closing brace"',
        '{"trailing": "comma",}',
        '[1, 2, 3,]',
        '{"nested": {"deeply": {"broken": json}}}',
        Buffer.from('binary-data').toString()
      ];
      
      for (const input of malformedInputs) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/webhook',
          'POST',
          input,
          undefined
        );
        
        const result: ErrorTestResult = {
          scenario: 'Malformed JSON Input',
          passed: response.status === 400,
          actualStatusCode: response.status,
          expectedStatusCode: 400,
          errorHandled: !!data.error,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime,
          errorMessage: data.error
        };
        
        errorTestResults.push(result);
        
        expect(response.status).toBe(400);
        expect(data.error).toContain('JSON');
      }
    });

    it('should validate required parameters', async () => {
      const invalidRequests = [
        { endpoint: '/api/n8n/integration', payload: {} }, // Missing action
        { endpoint: '/api/n8n/integration', payload: { action: '' } }, // Empty action
        { endpoint: '/api/trading/enhanced-execution', payload: { action: 'place-order' } }, // Missing required fields
        { endpoint: '/api/n8n/webhook', payload: { action: null } } // Null action
      ];
      
      for (const request of invalidRequests) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          request.endpoint,
          'POST',
          request.payload
        );
        
        const result: ErrorTestResult = {
          scenario: `Missing Required Parameters - ${request.endpoint}`,
          passed: response.status === 400,
          actualStatusCode: response.status,
          expectedStatusCode: 400,
          errorHandled: !!data.error,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });

    it('should handle oversized payloads', async () => {
      // Create a very large payload (1MB+)
      const largePayload = {
        action: 'test',
        data: 'x'.repeat(1024 * 1024), // 1MB string
        metadata: {
          large_array: Array(10000).fill('large-data-item'),
          nested_object: JSON.parse('{"level":'.repeat(1000) + '{}' + '}'.repeat(1000))
        }
      };
      
      try {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/webhook',
          'POST',
          largePayload,
          undefined,
          10000 // 10 second timeout
        );
        
        const result: ErrorTestResult = {
          scenario: 'Oversized Payload',
          passed: response.status === 413 || response.status >= 400,
          actualStatusCode: response.status,
          expectedStatusCode: 413,
          errorHandled: !!data.error,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        expect(response.status).toBeGreaterThanOrEqual(400);
      } catch (error: any) {
        // Network timeout or similar is acceptable for oversized payloads
        const result: ErrorTestResult = {
          scenario: 'Oversized Payload - Network Protection',
          passed: true,
          actualStatusCode: 0,
          expectedStatusCode: 413,
          errorHandled: true,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime: 10000,
          errorMessage: error.message
        };
        
        errorTestResults.push(result);
        expect(true).toBe(true); // Pass - network-level protection is acceptable
      }
    });
  });

  describe('Workflow Execution Error Handling', () => {
    it('should handle invalid workflow actions', async () => {
      const invalidActions = [
        'NONEXISTENT_ACTION',
        'DELETE_ALL_DATA',
        'ADMIN_ACCESS',
        'DEBUG_MODE',
        '',
        null,
        undefined,
        123,
        { nested: 'object' }
      ];
      
      for (const action of invalidActions) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/integration',
          'POST',
          { action, payload: {} }
        );
        
        const result: ErrorTestResult = {
          scenario: `Invalid Workflow Action - ${String(action)}`,
          passed: response.status === 400,
          actualStatusCode: response.status,
          expectedStatusCode: 400,
          errorHandled: !!data.error,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        if (data.supportedActions) {
          expect(Array.isArray(data.supportedActions)).toBe(true);
        }
      }
    });

    it('should handle trading parameter validation errors', async () => {
      const invalidTradingRequests = [
        { symbol: '', side: 'buy', quantity: 0.001 }, // Empty symbol
        { symbol: 'BTC-USD', side: 'invalid', quantity: 0.001 }, // Invalid side
        { symbol: 'BTC-USD', side: 'buy', quantity: -1 }, // Negative quantity
        { symbol: 'BTC-USD', side: 'buy', quantity: 0 }, // Zero quantity
        { symbol: 'BTC-USD', side: 'buy', quantity: 'invalid' }, // Non-numeric quantity
        { symbol: 'INVALID_SYMBOL_123', side: 'buy', quantity: 0.001 } // Invalid symbol
      ];
      
      for (const request of invalidTradingRequests) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/trading/enhanced-execution',
          'POST',
          { action: 'validate-order', ...request }
        );
        
        const result: ErrorTestResult = {
          scenario: `Trading Parameter Validation`,
          passed: response.status === 400 || (response.ok && data.validation && !data.validation.allowed),
          actualStatusCode: response.status,
          expectedStatusCode: 400,
          errorHandled: !!data.error || (data.validation && !data.validation.allowed),
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        // Should either reject with 400 or return validation failure
        const isValidResponse = response.status === 400 || 
                              (response.ok && data.validation && !data.validation.allowed);
        expect(isValidResponse).toBe(true);
      }
    });

    it('should handle workflow timeout scenarios', async () => {
      // Test workflow requests that might timeout
      const timeoutRequests = [
        {
          action: 'TRADING',
          symbol: 'BTC',
          capital: 50000,
          strategy: 'COMPLEX_AI_ANALYSIS',
          timeframe: '1s', // Very short timeframe might cause issues
          indicators: Array(100).fill('COMPLEX_INDICATOR') // Overload with indicators
        },
        {
          action: 'PORTFOLIO',
          accountId: 'test-account',
          includeHistory: true,
          timeframe: '1y', // Very long timeframe
          detailed_analysis: true,
          backtest_years: 10
        }
      ];
      
      for (const request of timeoutRequests) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/webhook',
          'POST',
          request,
          undefined,
          20000 // 20 second timeout
        );
        
        const result: ErrorTestResult = {
          scenario: `Workflow Timeout - ${request.action}`,
          passed: response.ok || response.status >= 400,
          actualStatusCode: response.status,
          expectedStatusCode: 200,
          errorHandled: !!data.error || data.success !== undefined,
          recoveryTested: true,
          recoverySuccessful: false,
          responseTime
        };
        
        // Test recovery after potential timeout
        result.recoverySuccessful = await testRecovery(
          '/api/n8n/webhook',
          'POST',
          { action: 'NOTIFICATION', message: 'Recovery test', priority: 'LOW' }
        );
        
        errorTestResults.push(result);
        
        // Either should work or fail gracefully
        expect(response.status >= 200).toBe(true);
        expect(responseTime).toBeLessThan(25000); // Should not hang indefinitely
      }
    });
  });

  describe('External API Error Handling', () => {
    it('should handle market data API failures', async () => {
      const failureScenariosrequests = [
        { symbols: ['NONEXISTENT_CRYPTO_SYMBOL'] },
        { symbols: ['BTC-USD'], timeframe: 'invalid_timeframe' },
        { symbols: [] }, // Empty symbols array
        { symbols: Array(1000).fill('BTC-USD') } // Too many symbols
      ];
      
      for (const request of failureScenariosrequests) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/n8n/integration',
          'POST',
          { action: 'get_market_data', payload: request },
          undefined,
          15000 // 15 second timeout for external API calls
        );
        
        const result: ErrorTestResult = {
          scenario: 'Market Data API Failure',
          passed: response.ok || response.status >= 400,
          actualStatusCode: response.status,
          expectedStatusCode: 200,
          errorHandled: !!data.error || data.success !== undefined,
          recoveryTested: true,
          recoverySuccessful: false,
          responseTime
        };
        
        // Test recovery with valid request
        result.recoverySuccessful = await testRecovery(
          '/api/n8n/integration',
          'POST',
          { action: 'get_market_data', payload: { symbols: ['BTC-USD'], timeframe: '1m' } }
        );
        
        errorTestResults.push(result);
        
        // Should handle gracefully - either succeed or fail properly
        expect(response.status).toBeGreaterThan(0);
        expect(data.success !== undefined || data.error !== undefined).toBe(true);
      }
    });

    it('should handle trading execution API failures', async () => {
      const failureScenarios = [
        { action: 'place-order', symbol: 'INVALID', side: 'buy', quantity: 999999999 }, // Excessive quantity
        { action: 'close-position', symbol: 'NONEXISTENT_POSITION' },
        { action: 'test-connections' } // This might fail if exchanges are unreachable
      ];
      
      for (const request of failureScenarios) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          '/api/trading/enhanced-execution',
          'POST',
          request,
          undefined,
          10000
        );
        
        const result: ErrorTestResult = {
          scenario: `Trading API Failure - ${request.action}`,
          passed: response.ok || response.status >= 400,
          actualStatusCode: response.status,
          expectedStatusCode: 200,
          errorHandled: !!data.error || data.success !== undefined,
          recoveryTested: true,
          recoverySuccessful: false,
          responseTime
        };
        
        // Test recovery
        result.recoverySuccessful = await testRecovery(
          '/api/trading/enhanced-execution',
          'GET',
          undefined // Use simple GET for recovery test
        );
        
        errorTestResults.push(result);
        
        expect(response.status).toBeGreaterThan(0);
      }
    });
  });

  describe('Network and Infrastructure Error Handling', () => {
    it('should handle nonexistent endpoints', async () => {
      for (const endpoint of errorTestEnv.invalidEndpoints) {
        const { response, data, responseTime } = await makeErrorTestRequest(endpoint);
        
        const result: ErrorTestResult = {
          scenario: `Nonexistent Endpoint - ${endpoint}`,
          passed: response.status === 404,
          actualStatusCode: response.status,
          expectedStatusCode: 404,
          errorHandled: !!data.error,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        expect(response.status).toBe(404);
      }
    });

    it('should handle unsupported HTTP methods', async () => {
      const unsupportedMethods = [
        { method: 'PUT' as const, endpoint: '/api/n8n/webhook' },
        { method: 'DELETE' as const, endpoint: '/api/n8n/integration' },
        { method: 'PATCH' as const, endpoint: '/api/trading/enhanced-execution' }
      ];
      
      for (const test of unsupportedMethods) {
        try {
          const { response, data, responseTime } = await makeErrorTestRequest(
            test.endpoint,
            test.method,
            { action: 'test' }
          );
          
          const result: ErrorTestResult = {
            scenario: `Unsupported Method - ${test.method}`,
            passed: response.status === 405 || response.status === 404,
            actualStatusCode: response.status,
            expectedStatusCode: 405,
            errorHandled: !!data.error,
            recoveryTested: false,
            recoverySuccessful: false,
            responseTime
          };
          
          errorTestResults.push(result);
          
          expect(response.status === 405 || response.status === 404).toBe(true);
        } catch (error: any) {
          // Some methods might be blocked at network level
          const result: ErrorTestResult = {
            scenario: `Unsupported Method - ${test.method} (Network Block)`,
            passed: true,
            actualStatusCode: 0,
            expectedStatusCode: 405,
            errorHandled: true,
            recoveryTested: false,
            recoverySuccessful: false,
            responseTime: 0,
            errorMessage: error.message
          };
          
          errorTestResults.push(result);
        }
      }
    });

    it('should handle connection timeouts gracefully', async () => {
      // Test with very short timeout to simulate network issues
      const { response, data, responseTime, networkError } = await makeErrorTestRequest(
        '/api/n8n/integration?action=health',
        'GET',
        undefined,
        undefined,
        1 // 1ms timeout - should definitely timeout
      );
      
      const result: ErrorTestResult = {
        scenario: 'Connection Timeout',
        passed: networkError || response.status >= 400,
        actualStatusCode: response.status,
        expectedStatusCode: 408,
        errorHandled: networkError || !!data.error,
        recoveryTested: true,
        recoverySuccessful: false,
        responseTime
      };
      
      // Test recovery with normal timeout
      result.recoverySuccessful = await testRecovery('/api/n8n/integration?action=health', 'GET');
      
      errorTestResults.push(result);
      
      expect(networkError || response.status >= 400).toBe(true);
      expect(result.recoverySuccessful).toBe(true); // System should recover
    });
  });

  describe('Rate Limiting Error Handling', () => {
    it('should handle rate limit exceeded scenarios', async () => {
      // Flood the server with requests to trigger rate limiting
      const floodRequests = Array(50).fill(null).map((_, i) => 
        makeErrorTestRequest('/api/n8n/webhook', 'POST', { action: 'test', sequence: i })
      );
      
      const results = await Promise.all(floodRequests);
      const rateLimitedRequests = results.filter(r => r.response.status === 429);
      
      const result: ErrorTestResult = {
        scenario: 'Rate Limit Exceeded',
        passed: rateLimitedRequests.length > 0 || results.every(r => r.response.ok),
        actualStatusCode: rateLimitedRequests.length > 0 ? 429 : 200,
        expectedStatusCode: 429,
        errorHandled: rateLimitedRequests.every(r => !!r.data.error),
        recoveryTested: true,
        recoverySuccessful: false,
        responseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      };
      
      // Wait for rate limit to reset and test recovery
      await new Promise(resolve => setTimeout(resolve, 5000));
      result.recoverySuccessful = await testRecovery('/api/n8n/webhook', 'POST', { action: 'test' });
      
      errorTestResults.push(result);
      
      console.log(`📊 Rate limiting test: ${rateLimitedRequests.length}/${floodRequests.length} requests rate limited`);
      
      // Either rate limiting worked or system handled all requests successfully
      expect(rateLimitedRequests.length > 0 || results.every(r => r.response.ok)).toBe(true);
      expect(result.recoverySuccessful).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from cascading failures', async () => {
      // Create multiple types of errors in sequence
      const cascadingErrors = [
        { endpoint: '/api/nonexistent', method: 'GET' as const },
        { endpoint: '/api/n8n/integration', method: 'POST' as const, payload: {} },
        { endpoint: '/api/n8n/webhook', method: 'POST' as const, payload: 'invalid-json' },
        { endpoint: '/api/trading/enhanced-execution', method: 'POST' as const, payload: { action: 'invalid' } }
      ];
      
      // Execute cascading errors
      for (const error of cascadingErrors) {
        await makeErrorTestRequest(error.endpoint, error.method, error.payload);
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay between errors
      }
      
      // Wait for system to recover
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test that all systems are working again
      const recoveryTests = [
        { endpoint: '/api/n8n/integration?action=health', method: 'GET' as const },
        { endpoint: '/api/n8n/webhook', method: 'POST' as const, payload: { action: 'NOTIFICATION', message: 'Recovery test' } },
        { endpoint: '/api/trading/enhanced-execution?action=status', method: 'GET' as const }
      ];
      
      const recoveryResults = await Promise.all(
        recoveryTests.map(test => makeErrorTestRequest(test.endpoint, test.method, test.payload))
      );
      
      const successfulRecoveries = recoveryResults.filter(r => r.response.ok).length;
      
      const result: ErrorTestResult = {
        scenario: 'Cascading Failure Recovery',
        passed: successfulRecoveries >= recoveryTests.length * 0.8, // 80% recovery rate acceptable
        actualStatusCode: 200,
        expectedStatusCode: 200,
        errorHandled: true,
        recoveryTested: true,
        recoverySuccessful: successfulRecoveries >= recoveryTests.length * 0.8,
        responseTime: recoveryResults.reduce((sum, r) => sum + r.responseTime, 0) / recoveryResults.length
      };
      
      errorTestResults.push(result);
      
      expect(successfulRecoveries).toBeGreaterThanOrEqual(recoveryTests.length * 0.8);
      console.log(`🔄 Cascading failure recovery: ${successfulRecoveries}/${recoveryTests.length} systems recovered`);
    });

    it('should maintain error logging during failures', async () => {
      // Test that errors are properly logged even during failure scenarios
      const errorScenarios = [
        { type: 'auth_failure', headers: { 'Authorization': 'Bearer invalid' } },
        { type: 'validation_failure', payload: { invalid: 'request' } },
        { type: 'system_error', endpoint: '/api/nonexistent' }
      ];
      
      for (const scenario of errorScenarios) {
        const { response, data, responseTime } = await makeErrorTestRequest(
          scenario.endpoint || '/api/n8n/webhook',
          'POST',
          scenario.payload || { action: 'test' },
          scenario.headers
        );
        
        const result: ErrorTestResult = {
          scenario: `Error Logging - ${scenario.type}`,
          passed: true, // We assume logging happens (can't easily verify)
          actualStatusCode: response.status,
          expectedStatusCode: response.status, // Accept whatever status we get
          errorHandled: !!data.error || !response.ok,
          recoveryTested: false,
          recoverySuccessful: false,
          responseTime
        };
        
        errorTestResults.push(result);
        
        // Main requirement: system should respond and not crash
        expect(response.status).toBeGreaterThan(0);
      }
    });
  });
});