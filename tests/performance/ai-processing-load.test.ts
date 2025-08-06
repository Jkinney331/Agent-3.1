/**
 * AI Processing Load Performance Tests
 * Testing AI engine performance under various load conditions and data volumes
 */

import { AIReasoningEngine } from '../../lib/ai/reasoning-engine';
import {
  MARKET_DATA_SCENARIOS,
  PERFORMANCE_TEST_DATA,
  ADVANCED_DATA_SCENARIOS,
  EDGE_CASES
} from '../fixtures/ai-analysis-data';

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Array<{
    operation: string;
    duration: number;
    memoryUsage: number;
    timestamp: Date;
    success: boolean;
    dataSize?: number;
  }> = [];

  async measure<T>(operation: string, fn: () => Promise<T>, dataSize?: number): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    let success = true;
    let result: T;
    
    try {
      result = await fn();
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      this.metrics.push({
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        timestamp: new Date(),
        success,
        dataSize
      });
    }
    
    return result!;
  }

  getMetrics() {
    return this.metrics;
  }

  getStats(operation?: string) {
    const relevantMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return null;
    }

    const durations = relevantMetrics.map(m => m.duration);
    const memoryUsages = relevantMetrics.map(m => m.memoryUsage);
    const successCount = relevantMetrics.filter(m => m.success).length;

    return {
      count: relevantMetrics.length,
      successRate: (successCount / relevantMetrics.length) * 100,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99)
      },
      memory: {
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
        avg: memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length
      }
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  clear() {
    this.metrics = [];
  }
}

// Load generation utilities
class LoadGenerator {
  static generateMarketDataBatch(count: number): any[] {
    const scenarios = Object.values(MARKET_DATA_SCENARIOS);
    const batch = [];
    
    for (let i = 0; i < count; i++) {
      const baseScenario = scenarios[i % scenarios.length];
      batch.push({
        ...baseScenario,
        price: baseScenario.price + (Math.random() - 0.5) * 1000,
        volume: baseScenario.volume * (0.8 + Math.random() * 0.4),
        fearGreed: Math.max(0, Math.min(100, baseScenario.fearGreed + (Math.random() - 0.5) * 20)),
        prices: baseScenario.prices.map(p => p + (Math.random() - 0.5) * 100)
      });
    }
    
    return batch;
  }

  static generateLargePriceHistory(length: number): number[] {
    const prices = [50000]; // Starting price
    
    for (let i = 1; i < length; i++) {
      const change = (Math.random() - 0.5) * 0.02; // ±2% change
      prices.push(prices[i - 1] * (1 + change));
    }
    
    return prices;
  }

  static generateHighFrequencyData(count: number): any[] {
    const data = [];
    let currentPrice = 50000;
    
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 0.001; // ±0.1% change
      currentPrice *= (1 + change);
      
      data.push({
        timestamp: Date.now() + i * 1000,
        price: currentPrice,
        volume: 1000 + Math.random() * 2000
      });
    }
    
    return data;
  }
}

describe('AI Processing Load Performance', () => {
  let aiEngine: AIReasoningEngine;
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    aiEngine = new AIReasoningEngine();
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.clear();
  });

  describe('Single Analysis Performance Benchmarks', () => {
    test('should analyze market data within performance thresholds', async () => {
      const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      
      const result = await monitor.measure('single-analysis', async () => {
        return aiEngine.analyzeMarket(marketData);
      });

      const stats = monitor.getStats('single-analysis');
      
      expect(result).toBeDefined();
      expect(result.action).toMatch(/^(BUY|SELL|HOLD)$/);
      expect(stats?.duration.avg).toBeLessThan(1000); // Under 1 second
      expect(stats?.memory.avg).toBeLessThan(50 * 1024 * 1024); // Under 50MB
      expect(stats?.successRate).toBe(100);
    });

    test('should handle different market scenarios with consistent performance', async () => {
      const scenarios = Object.values(MARKET_DATA_SCENARIOS);
      
      for (const scenario of scenarios) {
        await monitor.measure('scenario-analysis', async () => {
          return aiEngine.analyzeMarket(scenario);
        }, JSON.stringify(scenario).length);
      }

      const stats = monitor.getStats('scenario-analysis');
      
      expect(stats?.count).toBe(scenarios.length);
      expect(stats?.successRate).toBe(100);
      expect(stats?.duration.max).toBeLessThan(2000); // All under 2 seconds
      expect(stats?.duration.avg).toBeLessThan(1000); // Average under 1 second
      
      // Verify performance consistency (low variance)
      const variance = Math.abs(stats!.duration.max - stats!.duration.min);
      expect(variance).toBeLessThan(1500); // Less than 1.5s variance
    });

    test('should handle large price history datasets efficiently', async () => {
      const largePriceHistory = LoadGenerator.generateLargePriceHistory(10000);
      const marketData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: largePriceHistory
      };

      const result = await monitor.measure('large-dataset', async () => {
        return aiEngine.analyzeMarket(marketData);
      }, largePriceHistory.length);

      const stats = monitor.getStats('large-dataset');
      
      expect(result).toBeDefined();
      expect(stats?.duration.avg).toBeLessThan(3000); // Under 3 seconds for large dataset
      expect(stats?.memory.avg).toBeLessThan(100 * 1024 * 1024); // Under 100MB
    });

    test('should perform technical indicator calculations efficiently', async () => {
      const testPrices = LoadGenerator.generateLargePriceHistory(1000);
      
      // Test RSI calculation performance
      await monitor.measure('rsi-calculation', async () => {
        return (aiEngine as any).calculateRSI(testPrices);
      }, testPrices.length);

      // Test MACD calculation performance
      await monitor.measure('macd-calculation', async () => {
        return (aiEngine as any).calculateMACD(testPrices);
      }, testPrices.length);

      // Test EMA calculation performance
      await monitor.measure('ema-calculation', async () => {
        return (aiEngine as any).calculateEMA(testPrices, 26);
      }, testPrices.length);

      const rsiStats = monitor.getStats('rsi-calculation');
      const macdStats = monitor.getStats('macd-calculation');
      const emaStats = monitor.getStats('ema-calculation');

      expect(rsiStats?.duration.avg).toBeLessThan(100); // Under 100ms
      expect(macdStats?.duration.avg).toBeLessThan(150); // Under 150ms
      expect(emaStats?.duration.avg).toBeLessThan(50); // Under 50ms
    });
  });

  describe('Batch Processing Performance', () => {
    test('should handle batch market analysis efficiently', async () => {
      const batchSize = 50;
      const marketDataBatch = LoadGenerator.generateMarketDataBatch(batchSize);
      
      const results = await monitor.measure('batch-analysis', async () => {
        const promises = marketDataBatch.map(data => aiEngine.analyzeMarket(data));
        return Promise.all(promises);
      }, batchSize);

      const stats = monitor.getStats('batch-analysis');
      
      expect(results).toHaveLength(batchSize);
      expect(results.every(r => r.action.match(/^(BUY|SELL|HOLD)$/))).toBe(true);
      expect(stats?.duration.avg).toBeLessThan(10000); // Under 10 seconds for batch of 50
      expect(stats?.memory.avg).toBeLessThan(200 * 1024 * 1024); // Under 200MB
    });

    test('should handle concurrent analysis requests', async () => {
      const concurrentCount = 20;
      const promises = [];

      for (let i = 0; i < concurrentCount; i++) {
        const marketData = {
          ...MARKET_DATA_SCENARIOS.HIGH_VOLATILITY,
          price: 50000 + i * 100
        };
        
        promises.push(
          monitor.measure(`concurrent-${i}`, async () => {
            return aiEngine.analyzeMarket(marketData);
          })
        );
      }

      const results = await Promise.all(promises);
      const allStats = monitor.getMetrics();

      expect(results).toHaveLength(concurrentCount);
      expect(allStats.every(stat => stat.success)).toBe(true);
      
      // Calculate concurrent performance stats
      const totalDuration = Math.max(...allStats.map(s => s.duration));
      const avgDuration = allStats.reduce((sum, s) => sum + s.duration, 0) / allStats.length;
      
      expect(totalDuration).toBeLessThan(5000); // Total time under 5 seconds
      expect(avgDuration).toBeLessThan(2000); // Average time under 2 seconds
    });

    test('should maintain performance under sustained load', async () => {
      const sustainedLoadDuration = 30; // 30 iterations
      
      for (let i = 0; i < sustainedLoadDuration; i++) {
        const marketData = {
          ...MARKET_DATA_SCENARIOS.BULL_MARKET,
          price: 50000 + Math.random() * 10000,
          fearGreed: Math.random() * 100
        };

        await monitor.measure('sustained-load', async () => {
          return aiEngine.analyzeMarket(marketData);
        });

        // Small delay to simulate real-world timing
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const stats = monitor.getStats('sustained-load');
      
      expect(stats?.count).toBe(sustainedLoadDuration);
      expect(stats?.successRate).toBe(100);
      
      // Check for performance degradation
      const firstHalf = monitor.getMetrics().slice(0, 15);
      const secondHalf = monitor.getMetrics().slice(15);
      
      const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length;
      
      // Performance should not degrade significantly
      expect(secondHalfAvg / firstHalfAvg).toBeLessThan(1.5); // Less than 50% degradation
    });
  });

  describe('Memory Usage and Resource Management', () => {
    test('should not cause memory leaks during repeated analysis', async () => {
      const iterations = 100;
      const memorySnapshots = [];

      for (let i = 0; i < iterations; i++) {
        await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
        
        if (i % 10 === 0) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      // Memory should not continuously increase
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryIncrease = lastSnapshot - firstSnapshot;
      
      // Allow for some memory increase but not excessive
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    test('should handle memory pressure gracefully', async () => {
      // Create large datasets to simulate memory pressure
      const largePriceHistories = Array.from({ length: 10 }, () => 
        LoadGenerator.generateLargePriceHistory(5000)
      );

      const promises = largePriceHistories.map((prices, index) => {
        const marketData = {
          ...MARKET_DATA_SCENARIOS.HIGH_VOLATILITY,
          prices,
          symbol: `TEST${index}/USD`
        };

        return monitor.measure('memory-pressure', async () => {
          return aiEngine.analyzeMarket(marketData);
        });
      });

      const results = await Promise.all(promises);
      const stats = monitor.getStats('memory-pressure');

      expect(results).toHaveLength(10);
      expect(stats?.successRate).toBe(100);
      expect(stats?.memory.max).toBeLessThan(500 * 1024 * 1024); // Under 500MB max
    });

    test('should efficiently manage advanced data processing', async () => {
      // Mock advanced data to test memory usage
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.BULLISH_CONFLUENCE);

      const result = await monitor.measure('advanced-processing', async () => {
        return aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      });

      const stats = monitor.getStats('advanced-processing');

      expect(result.advancedData).toBeDefined();
      expect(stats?.duration.avg).toBeLessThan(1500); // Under 1.5 seconds
      expect(stats?.memory.avg).toBeLessThan(75 * 1024 * 1024); // Under 75MB
    });
  });

  describe('Edge Case Performance', () => {
    test('should handle edge cases without performance degradation', async () => {
      const edgeCases = Object.values(EDGE_CASES);
      
      for (const edgeCase of edgeCases) {
        await monitor.measure('edge-case', async () => {
          return aiEngine.analyzeMarket(edgeCase);
        });
      }

      const stats = monitor.getStats('edge-case');
      
      expect(stats?.successRate).toBe(100);
      expect(stats?.duration.max).toBeLessThan(2000); // Under 2 seconds even for edge cases
    });

    test('should handle extreme volatility data efficiently', async () => {
      const extremeVolatilityData = {
        ...MARKET_DATA_SCENARIOS.HIGH_VOLATILITY,
        prices: Array.from({ length: 1000 }, (_, i) => {
          // Extreme price swings
          return 50000 * (1 + Math.sin(i / 10) * 0.5 + (Math.random() - 0.5) * 0.2);
        })
      };

      const result = await monitor.measure('extreme-volatility', async () => {
        return aiEngine.analyzeMarket(extremeVolatilityData);
      });

      const stats = monitor.getStats('extreme-volatility');

      expect(result).toBeDefined();
      expect(stats?.duration.avg).toBeLessThan(2000); // Under 2 seconds
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    test('should handle insufficient data scenarios quickly', async () => {
      const insufficientDataScenarios = [
        { ...EDGE_CASES.INSUFFICIENT_DATA },
        { ...EDGE_CASES.ZERO_VOLUME },
        {
          symbol: 'EMPTY/USD',
          price: 1.0,
          volume: 1,
          prices: [1.0],
          fearGreed: 50,
          capital: 1000
        }
      ];

      for (const scenario of insufficientDataScenarios) {
        await monitor.measure('insufficient-data', async () => {
          return aiEngine.analyzeMarket(scenario);
        });
      }

      const stats = monitor.getStats('insufficient-data');

      expect(stats?.successRate).toBe(100);
      expect(stats?.duration.max).toBeLessThan(500); // Should be very fast for insufficient data
    });
  });

  describe('Scalability Tests', () => {
    test('should scale linearly with data size', async () => {
      const dataSizes = [100, 500, 1000, 2000, 5000];
      const scalabilityResults = [];

      for (const size of dataSizes) {
        const prices = LoadGenerator.generateLargePriceHistory(size);
        const marketData = {
          ...MARKET_DATA_SCENARIOS.BULL_MARKET,
          prices
        };

        const result = await monitor.measure(`scale-${size}`, async () => {
          return aiEngine.analyzeMarket(marketData);
        }, size);

        const stats = monitor.getStats(`scale-${size}`);
        scalabilityResults.push({
          size,
          duration: stats?.duration.avg || 0,
          memory: stats?.memory.avg || 0
        });
      }

      // Check that scaling is reasonable (not exponential)
      for (let i = 1; i < scalabilityResults.length; i++) {
        const prev = scalabilityResults[i - 1];
        const curr = scalabilityResults[i];
        const sizeRatio = curr.size / prev.size;
        const durationRatio = curr.duration / prev.duration;
        
        // Duration should not scale worse than O(n log n)
        expect(durationRatio).toBeLessThan(sizeRatio * Math.log(sizeRatio) * 2);
      }
    });

    test('should handle high-frequency analysis requests', async () => {
      const highFrequencyData = LoadGenerator.generateHighFrequencyData(1000);
      const batchSize = 100;
      const batches = [];

      // Split into batches
      for (let i = 0; i < highFrequencyData.length; i += batchSize) {
        batches.push(highFrequencyData.slice(i, i + batchSize));
      }

      const startTime = Date.now();
      
      for (const batch of batches) {
        const batchPromises = batch.map(data => {
          const marketData = {
            ...MARKET_DATA_SCENARIOS.HIGH_VOLATILITY,
            price: data.price,
            volume: data.volume
          };
          
          return aiEngine.analyzeMarket(marketData);
        });

        await Promise.all(batchPromises);
      }

      const totalTime = Date.now() - startTime;
      const throughput = highFrequencyData.length / (totalTime / 1000); // analyses per second

      expect(throughput).toBeGreaterThan(10); // At least 10 analyses per second
      expect(totalTime).toBeLessThan(60000); // Complete within 1 minute
    });

    test('should maintain accuracy under high load', async () => {
      const highLoadBatch = LoadGenerator.generateMarketDataBatch(100);
      const accuracyResults = [];

      const results = await Promise.all(
        highLoadBatch.map(async (data, index) => {
          const result = await aiEngine.analyzeMarket(data);
          
          // Track accuracy metrics
          accuracyResults.push({
            index,
            hasReasoning: result.reasoning.length > 0,
            hasValidConfidence: result.confidence >= 0 && result.confidence <= 100,
            hasValidAction: ['BUY', 'SELL', 'HOLD'].includes(result.action),
            hasValidRiskReward: result.riskReward > 0,
            reasoningQuality: result.reasoning.every(r => r.length > 10)
          });

          return result;
        })
      );

      const accuracyMetrics = {
        allHaveReasoning: accuracyResults.every(r => r.hasReasoning),
        allHaveValidConfidence: accuracyResults.every(r => r.hasValidConfidence),
        allHaveValidAction: accuracyResults.every(r => r.hasValidAction),
        allHaveValidRiskReward: accuracyResults.every(r => r.hasValidRiskReward),
        allHaveQualityReasoning: accuracyResults.every(r => r.reasoningQuality)
      };

      expect(results).toHaveLength(100);
      expect(accuracyMetrics.allHaveReasoning).toBe(true);
      expect(accuracyMetrics.allHaveValidConfidence).toBe(true);
      expect(accuracyMetrics.allHaveValidAction).toBe(true);
      expect(accuracyMetrics.allHaveValidRiskReward).toBe(true);
      expect(accuracyMetrics.allHaveQualityReasoning).toBe(true);
    });
  });

  describe('Performance Regression Detection', () => {
    test('should detect performance regressions', async () => {
      // Baseline performance measurement
      const baselineMetrics = [];
      for (let i = 0; i < 10; i++) {
        const result = await monitor.measure('baseline', async () => {
          return aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
        });
        baselineMetrics.push(result);
      }

      const baselineStats = monitor.getStats('baseline');
      monitor.clear();

      // Current performance measurement
      const currentMetrics = [];
      for (let i = 0; i < 10; i++) {
        const result = await monitor.measure('current', async () => {
          return aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
        });
        currentMetrics.push(result);
      }

      const currentStats = monitor.getStats('current');

      // Performance should not regress significantly
      const performanceRatio = currentStats!.duration.avg / baselineStats!.duration.avg;
      expect(performanceRatio).toBeLessThan(1.2); // No more than 20% slower

      const memoryRatio = currentStats!.memory.avg / baselineStats!.memory.avg;
      expect(memoryRatio).toBeLessThan(1.3); // No more than 30% more memory
    });
  });
});