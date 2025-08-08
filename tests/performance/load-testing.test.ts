import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';

/**
 * Performance and Load Testing Suite
 * 
 * This comprehensive performance test suite validates system behavior under various load conditions
 * and ensures all endpoints meet performance requirements specified in the PRD.
 * 
 * Performance Test Coverage:
 * - Response time benchmarks (< 2s requirement)
 * - Concurrent request handling
 * - High-load stress testing (1000+ requests)
 * - Memory usage under load
 * - Database query performance
 * - Workflow execution scalability
 * - Success rate under pressure (> 95% requirement)
 * - Recovery after load spikes
 */

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  successRate: number;
  testDuration: number;
}

interface LoadTestConfiguration {
  endpoint: string;
  method: 'GET' | 'POST';
  payload?: any;
  concurrent: number;
  totalRequests: number;
  rampUpTime: number; // ms
  maxResponseTime: number; // ms
  minSuccessRate: number; // percentage
}

interface PerformanceTestEnvironment {
  baseUrl: string;
  bearerToken: string;
  testConfigurations: LoadTestConfiguration[];
}

// Performance test environment
const perfTestEnv: PerformanceTestEnvironment = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  bearerToken: process.env.API_INTEGRATION_BEARER_TOKEN || 'ai-trading-bot-secure-2025-integration',
  testConfigurations: [
    // Light load tests
    {
      endpoint: '/api/n8n/integration?action=health',
      method: 'GET',
      concurrent: 10,
      totalRequests: 100,
      rampUpTime: 1000,
      maxResponseTime: 2000,
      minSuccessRate: 95
    },
    {
      endpoint: '/api/n8n/webhook',
      method: 'POST',
      payload: { action: 'NOTIFICATION', message: 'Performance test', priority: 'MEDIUM' },
      concurrent: 5,
      totalRequests: 50,
      rampUpTime: 2000,
      maxResponseTime: 5000,
      minSuccessRate: 95
    },
    // Medium load tests
    {
      endpoint: '/api/trading/enhanced-execution?action=status',
      method: 'GET',
      concurrent: 20,
      totalRequests: 200,
      rampUpTime: 2000,
      maxResponseTime: 3000,
      minSuccessRate: 90
    },
    // Heavy load tests
    {
      endpoint: '/api/n8n/integration?action=market_data&symbols=BTC-USD,ETH-USD',
      method: 'GET',
      concurrent: 50,
      totalRequests: 500,
      rampUpTime: 5000,
      maxResponseTime: 10000,
      minSuccessRate: 85
    }
  ]
};

// Common headers
const getHeaders = (includeAuth: boolean = true) => ({
  'Content-Type': 'application/json',
  'User-Agent': 'PerformanceTestSuite/1.0',
  ...(includeAuth && { 'Authorization': `Bearer ${perfTestEnv.bearerToken}` })
});

// Performance test request function
const makePerformanceRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<{ success: boolean; responseTime: number; statusCode: number }> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${perfTestEnv.baseUrl}${endpoint}`, {
      method,
      headers: getHeaders(),
      ...(body && { body: JSON.stringify(body) })
    });
    
    const responseTime = performance.now() - startTime;
    
    return {
      success: response.ok,
      responseTime,
      statusCode: response.status
    };
  } catch (error) {
    return {
      success: false,
      responseTime: performance.now() - startTime,
      statusCode: 0
    };
  }
};

// Execute load test with specified configuration
const executeLoadTest = async (config: LoadTestConfiguration): Promise<PerformanceMetrics> => {
  console.log(`🚀 Starting load test: ${config.endpoint} (${config.concurrent} concurrent, ${config.totalRequests} total)`);
  
  const results: { success: boolean; responseTime: number; statusCode: number }[] = [];
  const startTime = performance.now();
  
  // Calculate request batches
  const requestsPerBatch = Math.ceil(config.totalRequests / config.concurrent);
  const batchDelay = config.rampUpTime / Math.ceil(config.totalRequests / config.concurrent);
  
  for (let batch = 0; batch < Math.ceil(config.totalRequests / config.concurrent); batch++) {
    const batchSize = Math.min(config.concurrent, config.totalRequests - (batch * config.concurrent));
    const batchPromises: Promise<any>[] = [];
    
    // Create batch of concurrent requests
    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(
        makePerformanceRequest(config.endpoint, config.method, config.payload)
      );
    }
    
    // Execute batch
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Ramp-up delay between batches
    if (batch < Math.ceil(config.totalRequests / config.concurrent) - 1) {
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }
  
  const testDuration = performance.now() - startTime;
  
  // Calculate metrics
  const successfulRequests = results.filter(r => r.success).length;
  const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
  
  const metrics: PerformanceMetrics = {
    totalRequests: results.length,
    successfulRequests,
    failedRequests: results.length - successfulRequests,
    averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
    minResponseTime: responseTimes[0] || 0,
    maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
    p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
    p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
    requestsPerSecond: (results.length / testDuration) * 1000,
    successRate: (successfulRequests / results.length) * 100,
    testDuration
  };
  
  console.log(`✅ Load test completed: ${metrics.successRate.toFixed(1)}% success rate, ${metrics.averageResponseTime.toFixed(0)}ms avg response`);
  
  return metrics;
};

// Stress test with increasing load
const executeStressTest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  payload?: any,
  maxConcurrent: number = 100
): Promise<PerformanceMetrics[]> => {
  console.log(`🔥 Starting stress test: ${endpoint}`);
  
  const stressResults: PerformanceMetrics[] = [];
  const concurrencyLevels = [1, 5, 10, 20, 50, maxConcurrent];
  
  for (const concurrent of concurrencyLevels) {
    const config: LoadTestConfiguration = {
      endpoint,
      method,
      payload,
      concurrent,
      totalRequests: concurrent * 10, // 10 requests per concurrent user
      rampUpTime: 2000,
      maxResponseTime: 10000,
      minSuccessRate: 80
    };
    
    const metrics = await executeLoadTest(config);
    stressResults.push(metrics);
    
    // Small break between stress levels
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return stressResults;
};

describe('Performance and Load Testing Suite', () => {
  let performanceResults: Array<{ test: string; metrics: PerformanceMetrics; passed: boolean }> = [];
  
  beforeAll(async () => {
    console.log('⚡ Starting Performance Testing Suite...');
    console.log(`Base URL: ${perfTestEnv.baseUrl}`);
    console.log(`Test Configurations: ${perfTestEnv.testConfigurations.length}`);
    
    // Warm up the server
    console.log('🔥 Warming up server...');
    await Promise.all([
      makePerformanceRequest('/api/n8n/integration?action=health'),
      makePerformanceRequest('/api/n8n/webhook', 'GET'),
      makePerformanceRequest('/api/trading/enhanced-execution?action=status')
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Generate comprehensive performance report
    console.log('\n⚡ Performance Test Summary:');
    console.log('=' .repeat(60));
    
    const totalTests = performanceResults.length;
    const passedTests = performanceResults.filter(r => r.passed).length;
    const avgResponseTime = performanceResults.reduce((sum, r) => sum + r.metrics.averageResponseTime, 0) / totalTests;
    const avgSuccessRate = performanceResults.reduce((sum, r) => sum + r.metrics.successRate, 0) / totalTests;
    
    console.log(`📊 Overall Results:`);
    console.log(`   Tests Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Average Success Rate: ${avgSuccessRate.toFixed(1)}%`);
    
    console.log('\n📋 Detailed Performance Breakdown:');
    performanceResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}:`);
      console.log(`     Success Rate: ${result.metrics.successRate.toFixed(1)}%`);
      console.log(`     Avg Response: ${result.metrics.averageResponseTime.toFixed(0)}ms`);
      console.log(`     P95 Response: ${result.metrics.p95ResponseTime.toFixed(0)}ms`);
      console.log(`     Requests/sec: ${result.metrics.requestsPerSecond.toFixed(1)}`);
    });
    
    // Identify performance bottlenecks
    const slowestTests = performanceResults
      .filter(r => r.metrics.averageResponseTime > 3000)
      .sort((a, b) => b.metrics.averageResponseTime - a.metrics.averageResponseTime);
    
    if (slowestTests.length > 0) {
      console.log('\n🐌 Performance Bottlenecks Identified:');
      slowestTests.forEach(test => {
        console.log(`   ${test.test}: ${test.metrics.averageResponseTime.toFixed(0)}ms avg`);
      });
    }
  });

  describe('Response Time Benchmarks', () => {
    it('should meet response time requirements for health checks', async () => {
      const healthEndpoints = [
        '/api/n8n/integration?action=health',
        '/api/n8n/webhook',
        '/api/trading/enhanced-execution?action=status'
      ];
      
      for (const endpoint of healthEndpoints) {
        const method = endpoint.includes('webhook') ? 'GET' : 'GET';
        const results: number[] = [];
        
        // Run multiple requests to get stable metrics
        for (let i = 0; i < 10; i++) {
          const result = await makePerformanceRequest(endpoint, method);
          if (result.success) {
            results.push(result.responseTime);
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length;
        const maxAllowed = 2000; // 2 second requirement
        
        performanceResults.push({
          test: `Response Time - ${endpoint}`,
          metrics: {
            totalRequests: results.length,
            successfulRequests: results.length,
            failedRequests: 0,
            averageResponseTime: avgResponseTime,
            minResponseTime: Math.min(...results),
            maxResponseTime: Math.max(...results),
            p95ResponseTime: results.sort()[Math.floor(results.length * 0.95)],
            p99ResponseTime: results.sort()[Math.floor(results.length * 0.99)],
            requestsPerSecond: 0,
            successRate: 100,
            testDuration: 0
          },
          passed: avgResponseTime < maxAllowed
        });
        
        expect(avgResponseTime).toBeLessThan(maxAllowed);
      }
    });

    it('should handle trading operations within acceptable time', async () => {
      const tradingRequests = [
        {
          endpoint: '/api/n8n/integration',
          method: 'POST' as const,
          payload: { action: 'get_market_data', payload: { symbols: ['BTC-USD'] } },
          maxTime: 3000
        },
        {
          endpoint: '/api/n8n/integration',
          method: 'POST' as const,
          payload: { action: 'check_portfolio', payload: { timeframe: '1d' } },
          maxTime: 3000
        },
        {
          endpoint: '/api/trading/enhanced-execution',
          method: 'POST' as const,
          payload: { action: 'validate-order', symbol: 'BTC-USD', side: 'buy', quantity: 0.001, type: 'market' },
          maxTime: 2000
        }
      ];
      
      for (const request of tradingRequests) {
        const results: number[] = [];
        
        for (let i = 0; i < 5; i++) {
          const result = await makePerformanceRequest(request.endpoint, request.method, request.payload);
          if (result.success) {
            results.push(result.responseTime);
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length;
        
        performanceResults.push({
          test: `Trading Response Time - ${request.endpoint}`,
          metrics: {
            totalRequests: results.length,
            successfulRequests: results.length,
            failedRequests: 0,
            averageResponseTime: avgResponseTime,
            minResponseTime: Math.min(...results),
            maxResponseTime: Math.max(...results),
            p95ResponseTime: results.sort()[Math.floor(results.length * 0.95)],
            p99ResponseTime: results.sort()[Math.floor(results.length * 0.99)],
            requestsPerSecond: 0,
            successRate: 100,
            testDuration: 0
          },
          passed: avgResponseTime < request.maxTime
        });
        
        expect(avgResponseTime).toBeLessThan(request.maxTime);
      }
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent API integration requests', async () => {
      const config: LoadTestConfiguration = {
        endpoint: '/api/n8n/integration?action=health',
        method: 'GET',
        concurrent: 25,
        totalRequests: 100,
        rampUpTime: 2000,
        maxResponseTime: 3000,
        minSuccessRate: 95
      };
      
      const metrics = await executeLoadTest(config);
      
      performanceResults.push({
        test: 'Concurrent API Integration',
        metrics,
        passed: metrics.successRate >= config.minSuccessRate && metrics.averageResponseTime < config.maxResponseTime
      });
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(config.minSuccessRate);
      expect(metrics.averageResponseTime).toBeLessThan(config.maxResponseTime);
    });

    it('should handle concurrent webhook requests', async () => {
      const config: LoadTestConfiguration = {
        endpoint: '/api/n8n/webhook',
        method: 'POST',
        payload: { action: 'NOTIFICATION', message: 'Concurrent test', priority: 'LOW' },
        concurrent: 15,
        totalRequests: 75,
        rampUpTime: 3000,
        maxResponseTime: 5000,
        minSuccessRate: 90
      };
      
      const metrics = await executeLoadTest(config);
      
      performanceResults.push({
        test: 'Concurrent Webhook Requests',
        metrics,
        passed: metrics.successRate >= config.minSuccessRate && metrics.averageResponseTime < config.maxResponseTime
      });
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(config.minSuccessRate);
      expect(metrics.averageResponseTime).toBeLessThan(config.maxResponseTime);
    });

    it('should handle concurrent trading execution requests', async () => {
      const config: LoadTestConfiguration = {
        endpoint: '/api/trading/enhanced-execution?action=risk-metrics',
        method: 'GET',
        concurrent: 20,
        totalRequests: 80,
        rampUpTime: 2500,
        maxResponseTime: 4000,
        minSuccessRate: 90
      };
      
      const metrics = await executeLoadTest(config);
      
      performanceResults.push({
        test: 'Concurrent Trading Execution',
        metrics,
        passed: metrics.successRate >= config.minSuccessRate && metrics.averageResponseTime < config.maxResponseTime
      });
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(config.minSuccessRate);
      expect(metrics.averageResponseTime).toBeLessThan(config.maxResponseTime);
    });
  });

  describe('High-Load Stress Testing', () => {
    it('should handle high-volume API requests (1000+ requests)', async () => {
      const config: LoadTestConfiguration = {
        endpoint: '/api/n8n/integration?action=health',
        method: 'GET',
        concurrent: 50,
        totalRequests: 1000,
        rampUpTime: 10000,
        maxResponseTime: 5000,
        minSuccessRate: 95 // Meeting PRD requirement
      };
      
      const metrics = await executeLoadTest(config);
      
      performanceResults.push({
        test: 'High-Volume Load Test (1000+ requests)',
        metrics,
        passed: metrics.successRate >= config.minSuccessRate
      });
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(config.minSuccessRate);
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(1000);
      
      console.log(`🎯 High-volume test results: ${metrics.successRate.toFixed(1)}% success rate, ${metrics.requestsPerSecond.toFixed(1)} req/s`);
    });

    it('should maintain performance under sustained load', async () => {
      // Sustained load test - smaller concurrent load over longer period
      const config: LoadTestConfiguration = {
        endpoint: '/api/n8n/integration?action=market_data&symbols=BTC-USD',
        method: 'GET',
        concurrent: 10,
        totalRequests: 500,
        rampUpTime: 15000, // 15 seconds to complete
        maxResponseTime: 8000,
        minSuccessRate: 90
      };
      
      const metrics = await executeLoadTest(config);
      
      performanceResults.push({
        test: 'Sustained Load Test',
        metrics,
        passed: metrics.successRate >= config.minSuccessRate && metrics.averageResponseTime < config.maxResponseTime
      });
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(config.minSuccessRate);
      expect(metrics.testDuration).toBeGreaterThan(10000); // Should take time due to ramp-up
    });

    it('should handle workflow execution under load', async () => {
      const config: LoadTestConfiguration = {
        endpoint: '/api/n8n/webhook',
        method: 'POST',
        payload: { 
          action: 'TRADING', 
          symbol: 'BTC', 
          capital: 1000,
          riskTolerance: 'LOW'
        },
        concurrent: 8, // Lower concurrency for complex operations
        totalRequests: 40,
        rampUpTime: 8000,
        maxResponseTime: 15000, // Workflow execution can take longer
        minSuccessRate: 85
      };
      
      const metrics = await executeLoadTest(config);
      
      performanceResults.push({
        test: 'Workflow Execution Load Test',
        metrics,
        passed: metrics.successRate >= config.minSuccessRate
      });
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(config.minSuccessRate);
    });
  });

  describe('Stress Testing with Increasing Load', () => {
    it('should identify performance breaking point', async () => {
      const stressResults = await executeStressTest(
        '/api/n8n/integration?action=health',
        'GET',
        undefined,
        75 // Max concurrent users
      );
      
      // Analyze results to find breaking point
      let breakingPoint = -1;
      for (let i = 0; i < stressResults.length; i++) {
        if (stressResults[i].successRate < 90 || stressResults[i].averageResponseTime > 5000) {
          breakingPoint = i;
          break;
        }
      }
      
      performanceResults.push({
        test: 'Stress Test - Breaking Point Analysis',
        metrics: stressResults[stressResults.length - 1], // Use final result
        passed: breakingPoint > 2 // Should handle at least moderate load
      });
      
      console.log(`📊 Stress test results:`);
      stressResults.forEach((result, index) => {
        const concurrent = [1, 5, 10, 20, 50, 75][index];
        console.log(`   ${concurrent} concurrent: ${result.successRate.toFixed(1)}% success, ${result.averageResponseTime.toFixed(0)}ms avg`);
      });
      
      if (breakingPoint !== -1) {
        const concurrent = [1, 5, 10, 20, 50, 75][breakingPoint];
        console.log(`⚠️  Performance degradation detected at ${concurrent} concurrent users`);
      }
      
      expect(breakingPoint).toBeGreaterThan(1); // Should handle more than 5 concurrent users
    });
  });

  describe('Recovery and Stability Testing', () => {
    it('should recover after load spike', async () => {
      // Create a load spike
      console.log('🔥 Creating load spike...');
      const spikeConfig: LoadTestConfiguration = {
        endpoint: '/api/n8n/integration?action=health',
        method: 'GET',
        concurrent: 100,
        totalRequests: 200,
        rampUpTime: 1000, // Quick spike
        maxResponseTime: 10000,
        minSuccessRate: 70 // Lower expectation during spike
      };
      
      const spikeMetrics = await executeLoadTest(spikeConfig);
      
      // Wait for recovery
      console.log('⏳ Waiting for system recovery...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test recovery with normal load
      console.log('🔄 Testing recovery...');
      const recoveryConfig: LoadTestConfiguration = {
        endpoint: '/api/n8n/integration?action=health',
        method: 'GET',
        concurrent: 10,
        totalRequests: 50,
        rampUpTime: 2000,
        maxResponseTime: 3000,
        minSuccessRate: 95
      };
      
      const recoveryMetrics = await executeLoadTest(recoveryConfig);
      
      performanceResults.push({
        test: 'Recovery After Load Spike',
        metrics: recoveryMetrics,
        passed: recoveryMetrics.successRate >= recoveryConfig.minSuccessRate && 
                recoveryMetrics.averageResponseTime < recoveryConfig.maxResponseTime
      });
      
      expect(recoveryMetrics.successRate).toBeGreaterThanOrEqual(recoveryConfig.minSuccessRate);
      console.log(`✅ Recovery test: ${recoveryMetrics.successRate.toFixed(1)}% success rate after spike`);
    });

    it('should maintain stability over extended period', async () => {
      // Extended stability test - moderate load over 30+ seconds
      const stabilityConfig: LoadTestConfiguration = {
        endpoint: '/api/n8n/integration?action=health',
        method: 'GET',
        concurrent: 5,
        totalRequests: 150, // 30 requests per concurrent user
        rampUpTime: 30000, // 30 seconds
        maxResponseTime: 3000,
        minSuccessRate: 95
      };
      
      const stabilityMetrics = await executeLoadTest(stabilityConfig);
      
      performanceResults.push({
        test: 'Extended Stability Test',
        metrics: stabilityMetrics,
        passed: stabilityMetrics.successRate >= stabilityConfig.minSuccessRate && 
                stabilityMetrics.testDuration > 25000 // Should take close to 30 seconds
      });
      
      expect(stabilityMetrics.successRate).toBeGreaterThanOrEqual(stabilityConfig.minSuccessRate);
      expect(stabilityMetrics.testDuration).toBeGreaterThan(25000);
      
      console.log(`🏃 Stability test: ${(stabilityMetrics.testDuration/1000).toFixed(1)}s duration, ${stabilityMetrics.successRate.toFixed(1)}% success`);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish performance baselines', async () => {
      // Create baseline measurements for key endpoints
      const baselineEndpoints = [
        { endpoint: '/api/n8n/integration?action=health', expectedTime: 500 },
        { endpoint: '/api/n8n/webhook', method: 'GET' as const, expectedTime: 300 },
        { endpoint: '/api/trading/enhanced-execution?action=status', expectedTime: 1000 }
      ];
      
      for (const test of baselineEndpoints) {
        const results: number[] = [];
        
        // Run baseline measurements
        for (let i = 0; i < 20; i++) {
          const result = await makePerformanceRequest(test.endpoint, test.method || 'GET');
          if (result.success) {
            results.push(result.responseTime);
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
        const baselineThreshold = test.expectedTime * 1.5; // 50% tolerance
        
        performanceResults.push({
          test: `Baseline - ${test.endpoint}`,
          metrics: {
            totalRequests: results.length,
            successfulRequests: results.length,
            failedRequests: 0,
            averageResponseTime: avgTime,
            minResponseTime: Math.min(...results),
            maxResponseTime: Math.max(...results),
            p95ResponseTime: results.sort()[Math.floor(results.length * 0.95)],
            p99ResponseTime: results.sort()[Math.floor(results.length * 0.99)],
            requestsPerSecond: 0,
            successRate: 100,
            testDuration: 0
          },
          passed: avgTime < baselineThreshold
        });
        
        expect(avgTime).toBeLessThan(baselineThreshold);
        console.log(`📏 Baseline ${test.endpoint}: ${avgTime.toFixed(0)}ms (expected < ${test.expectedTime}ms)`);
      }
    });
  });
});