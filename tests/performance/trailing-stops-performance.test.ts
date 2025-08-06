/**
 * Performance tests for Dynamic Trailing Stops
 * Tests real-time performance, memory usage, and scalability
 */

import {
  DynamicTrailingStopConfig,
  TrailingStopState,
  Position,
  MarketRegime
} from '../../types/trading';

import {
  createDefaultTrailingStopConfig,
  createMockPosition,
  createMockATRCalculation,
  createMockVolatilityMetrics,
  generatePriceScenario,
  PRICE_SCENARIOS
} from '../utils/test-helpers';

// Performance testing utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private memoryStart: NodeJS.MemoryUsage;
  private memoryEnd: NodeJS.MemoryUsage;

  start() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    this.memoryStart = process.memoryUsage();
    this.startTime = process.hrtime.bigint();
  }

  end() {
    this.endTime = process.hrtime.bigint();
    this.memoryEnd = process.memoryUsage();
  }

  getExecutionTime(): number {
    return Number(this.endTime - this.startTime) / 1000000; // Convert to milliseconds
  }

  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
    return {
      heapUsed: this.memoryEnd.heapUsed - this.memoryStart.heapUsed,
      heapTotal: this.memoryEnd.heapTotal - this.memoryStart.heapTotal,
      external: this.memoryEnd.external - this.memoryStart.external
    };
  }

  getMetrics() {
    return {
      executionTime: this.getExecutionTime(),
      memory: this.getMemoryUsage()
    };
  }
}

// High-performance Dynamic Trailing Stops Manager for testing
class HighPerformanceDynamicTrailingStops {
  private config: DynamicTrailingStopConfig;
  private trailingStops: Map<string, TrailingStopState> = new Map();
  private priceCache: Map<string, number> = new Map();
  private lastUpdateTime: Map<string, number> = new Map();

  constructor(config: DynamicTrailingStopConfig) {
    this.config = config;
  }

  // Optimized calculation with caching
  calculateTrailingStopOptimized(
    currentPrice: number,
    side: 'LONG' | 'SHORT',
    atrValue: number,
    volatilityMultiplier: number,
    aiConfidence: number,
    marketRegime: MarketRegime
  ): number {
    // Use bitwise operations for performance where possible
    let trailingPercent = this.config.baseTrailingPercent;
    
    // Fast ATR adjustment
    const atrAdjustment = (atrValue / currentPrice) * this.config.atrMultiplier;
    trailingPercent += atrAdjustment;
    
    // Fast regime adjustment lookup
    const regimeMultipliers = {
      'BULL': 1.2,
      'BEAR': 0.8,
      'RANGE': 1.0,
      'VOLATILE': 0.7
    };
    trailingPercent *= regimeMultipliers[marketRegime] || 1.0;
    
    // Fast confidence adjustment
    const confidenceAdjustment = (aiConfidence - 50) * 0.006; // Optimized calculation
    trailingPercent *= (1 + confidenceAdjustment);
    
    // Fast bounds checking
    return Math.max(this.config.minTrailingPercent, 
                   Math.min(this.config.maxTrailingPercent, trailingPercent));
  }

  // Batch update multiple positions
  batchUpdateTrailingStops(
    updates: Array<{
      positionId: string;
      currentPrice: number;
      atrValue: number;
      aiConfidence: number;
      marketRegime: MarketRegime;
    }>
  ): Map<string, boolean> {
    const results = new Map<string, boolean>();
    
    for (const update of updates) {
      const { positionId, currentPrice, atrValue, aiConfidence, marketRegime } = update;
      const trailingStop = this.trailingStops.get(positionId);
      
      if (!trailingStop || !trailingStop.isActive) {
        results.set(positionId, false);
        continue;
      }

      // Check rate limiting
      const lastUpdate = this.lastUpdateTime.get(positionId) || 0;
      if (Date.now() - lastUpdate < this.config.updateInterval) {
        results.set(positionId, false);
        continue;
      }

      const newTrailingPercent = this.calculateTrailingStopOptimized(
        currentPrice,
        trailingStop.side,
        atrValue,
        1.0,
        aiConfidence,
        marketRegime
      );

      let updated = false;

      if (trailingStop.side === 'LONG') {
        if (currentPrice > trailingStop.highestPrice) {
          trailingStop.highestPrice = currentPrice;
          const newStopPrice = currentPrice * (1 - newTrailingPercent / 100);
          if (newStopPrice > trailingStop.currentStopPrice) {
            trailingStop.currentStopPrice = newStopPrice;
            updated = true;
          }
        }
      } else {
        if (currentPrice < trailingStop.lowestPrice) {
          trailingStop.lowestPrice = currentPrice;
          const newStopPrice = currentPrice * (1 + newTrailingPercent / 100);
          if (newStopPrice < trailingStop.currentStopPrice) {
            trailingStop.currentStopPrice = newStopPrice;
            updated = true;
          }
        }
      }

      if (updated) {
        trailingStop.trailingPercent = newTrailingPercent;
        trailingStop.lastUpdated = new Date();
        trailingStop.atrValue = atrValue;
        trailingStop.aiConfidence = aiConfidence;
        trailingStop.marketRegime = marketRegime;
        this.lastUpdateTime.set(positionId, Date.now());
      }

      results.set(positionId, updated);
    }

    return results;
  }

  // Create multiple positions efficiently
  createMultipleTrailingStops(positions: Position[]): TrailingStopState[] {
    const results: TrailingStopState[] = [];
    
    for (const position of positions) {
      const trailingStop: TrailingStopState = {
        id: `ts_${position.id}`,
        positionId: position.id,
        symbol: position.symbol,
        side: position.side,
        currentStopPrice: position.side === 'LONG'
          ? position.currentPrice * (1 - this.config.baseTrailingPercent / 100)
          : position.currentPrice * (1 + this.config.baseTrailingPercent / 100),
        highestPrice: position.side === 'LONG' ? position.currentPrice : 0,
        lowestPrice: position.side === 'LONG' ? 999999 : position.currentPrice,
        trailingPercent: this.config.baseTrailingPercent,
        lastUpdated: new Date(),
        isActive: true,
        triggerCount: 0,
        atrValue: 1200,
        aiConfidence: 75,
        marketRegime: 'BULL',
        reasoningChain: ['Created via batch operation']
      };
      
      this.trailingStops.set(position.id, trailingStop);
      results.push(trailingStop);
    }

    return results;
  }

  // Fast stop trigger checking
  batchCheckStopTriggers(priceUpdates: Map<string, number>): string[] {
    const triggeredPositions: string[] = [];
    
    for (const [positionId, currentPrice] of priceUpdates) {
      const trailingStop = this.trailingStops.get(positionId);
      if (!trailingStop || !trailingStop.isActive) continue;
      
      const isTriggered = trailingStop.side === 'LONG'
        ? currentPrice <= trailingStop.currentStopPrice
        : currentPrice >= trailingStop.currentStopPrice;
        
      if (isTriggered) {
        triggeredPositions.push(positionId);
        trailingStop.isActive = false;
        trailingStop.triggerCount++;
      }
    }
    
    return triggeredPositions;
  }

  getActiveStopsCount(): number {
    let count = 0;
    for (const stop of this.trailingStops.values()) {
      if (stop.isActive) count++;
    }
    return count;
  }

  clear() {
    this.trailingStops.clear();
    this.priceCache.clear();
    this.lastUpdateTime.clear();
  }

  getMemoryFootprint(): number {
    // Rough calculation of memory usage
    return this.trailingStops.size * 500; // Approximate bytes per trailing stop
  }
}

describe('Dynamic Trailing Stops - Performance Tests', () => {
  let manager: HighPerformanceDynamicTrailingStops;
  let monitor: PerformanceMonitor;
  let config: DynamicTrailingStopConfig;

  beforeEach(() => {
    config = createDefaultTrailingStopConfig({
      updateInterval: 100 // Faster updates for performance testing
    });
    manager = new HighPerformanceDynamicTrailingStops(config);
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    manager.clear();
  });

  describe('Core Calculation Performance', () => {
    it('should calculate trailing stops within 1ms for single position', () => {
      monitor.start();
      
      for (let i = 0; i < 1000; i++) {
        manager.calculateTrailingStopOptimized(
          50000 + i,
          'LONG',
          1200,
          1.0,
          75,
          'BULL'
        );
      }
      
      monitor.end();
      const metrics = monitor.getMetrics();
      
      expect(metrics.executionTime).toBeLessThan(10); // 1000 calculations in < 10ms
      expect(metrics.memory.heapUsed).toBeLessThan(1024 * 1024); // < 1MB
    });

    it('should handle extreme market conditions efficiently', () => {
      const extremeScenarios = [
        { price: 1, atr: 0.1, confidence: 0, regime: 'VOLATILE' as MarketRegime },
        { price: 1000000, atr: 50000, confidence: 100, regime: 'BULL' as MarketRegime },
        { price: 0.0001, atr: 0.000001, confidence: 50, regime: 'RANGE' as MarketRegime }
      ];

      monitor.start();
      
      extremeScenarios.forEach(scenario => {
        for (let i = 0; i < 100; i++) {
          manager.calculateTrailingStopOptimized(
            scenario.price,
            'LONG',
            scenario.atr,
            1.0,
            scenario.confidence,
            scenario.regime
          );
        }
      });
      
      monitor.end();
      const metrics = monitor.getMetrics();
      
      expect(metrics.executionTime).toBeLessThan(5);
    });
  });

  describe('Batch Processing Performance', () => {
    it('should handle 1000 positions efficiently', () => {
      // Create 1000 mock positions
      const positions = Array.from({ length: 1000 }, (_, i) => 
        createMockPosition(`SYMBOL${i}`, 'LONG', { 
          id: `pos_${i}`,
          currentPrice: 50000 + i 
        })
      );

      monitor.start();
      const trailingStops = manager.createMultipleTrailingStops(positions);
      monitor.end();
      
      const metrics = monitor.getMetrics();
      
      expect(trailingStops).toHaveLength(1000);
      expect(metrics.executionTime).toBeLessThan(100); // Should complete in < 100ms
      expect(metrics.memory.heapUsed).toBeLessThan(10 * 1024 * 1024); // < 10MB
    });

    it('should batch update 1000 positions within performance threshold', () => {
      // Setup 1000 positions
      const positions = Array.from({ length: 1000 }, (_, i) => 
        createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
      );
      manager.createMultipleTrailingStops(positions);

      // Create batch update data
      const updates = positions.map((pos, i) => ({
        positionId: pos.id,
        currentPrice: 50000 + i * 10,
        atrValue: 1200 + i,
        aiConfidence: 70 + (i % 30),
        marketRegime: ['BULL', 'BEAR', 'RANGE', 'VOLATILE'][i % 4] as MarketRegime
      }));

      monitor.start();
      const results = manager.batchUpdateTrailingStops(updates);
      monitor.end();
      
      const metrics = monitor.getMetrics();
      
      expect(results.size).toBe(1000);
      expect(metrics.executionTime).toBeLessThan(50); // Should complete in < 50ms
    });

    it('should batch check stop triggers efficiently', () => {
      // Setup positions
      const positions = Array.from({ length: 1000 }, (_, i) => 
        createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
      );
      manager.createMultipleTrailingStops(positions);

      // Create price updates that will trigger some stops
      const priceUpdates = new Map<string, number>();
      positions.forEach((pos, i) => {
        // Every 10th position gets a price that triggers the stop
        const triggerPrice = i % 10 === 0 ? 45000 : 52000;
        priceUpdates.set(pos.id, triggerPrice);
      });

      monitor.start();
      const triggeredPositions = manager.batchCheckStopTriggers(priceUpdates);
      monitor.end();
      
      const metrics = monitor.getMetrics();
      
      expect(triggeredPositions.length).toBeGreaterThan(90); // Should trigger ~100 stops
      expect(metrics.executionTime).toBeLessThan(20); // Should complete in < 20ms
    });
  });

  describe('High-Frequency Trading Simulation', () => {
    it('should handle 10,000 price updates per second', async () => {
      // Setup 100 positions
      const positions = Array.from({ length: 100 }, (_, i) => 
        createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
      );
      manager.createMultipleTrailingStops(positions);

      const totalUpdates = 10000;
      const batchSize = 100;
      const batches = totalUpdates / batchSize;

      monitor.start();
      
      for (let batch = 0; batch < batches; batch++) {
        const updates = positions.map(pos => ({
          positionId: pos.id,
          currentPrice: 50000 + Math.random() * 1000,
          atrValue: 1200 + Math.random() * 200,
          aiConfidence: 70 + Math.random() * 30,
          marketRegime: ['BULL', 'BEAR', 'RANGE', 'VOLATILE'][
            Math.floor(Math.random() * 4)
          ] as MarketRegime
        }));
        
        manager.batchUpdateTrailingStops(updates);
      }
      
      monitor.end();
      const metrics = monitor.getMetrics();
      
      // Should process 10,000 updates in less than 1 second
      expect(metrics.executionTime).toBeLessThan(1000);
      
      const updatesPerSecond = totalUpdates / (metrics.executionTime / 1000);
      expect(updatesPerSecond).toBeGreaterThan(10000);
    });

    it('should maintain performance under sustained load', async () => {
      const positions = Array.from({ length: 50 }, (_, i) => 
        createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
      );
      manager.createMultipleTrailingStops(positions);

      const performanceResults: number[] = [];
      
      // Run 10 rounds of intensive processing
      for (let round = 0; round < 10; round++) {
        monitor.start();
        
        for (let i = 0; i < 1000; i++) {
          const updates = positions.map(pos => ({
            positionId: pos.id,
            currentPrice: 50000 + Math.random() * 2000,
            atrValue: 1200,
            aiConfidence: 75,
            marketRegime: 'BULL' as MarketRegime
          }));
          
          manager.batchUpdateTrailingStops(updates);
        }
        
        monitor.end();
        performanceResults.push(monitor.getExecutionTime());
      }
      
      // Performance should remain consistent (variance < 50%)
      const avgTime = performanceResults.reduce((a, b) => a + b) / performanceResults.length;
      const maxTime = Math.max(...performanceResults);
      const minTime = Math.min(...performanceResults);
      
      expect(maxTime / minTime).toBeLessThan(1.5); // Less than 50% variance
      expect(avgTime).toBeLessThan(100); // Average under 100ms
    });
  });

  describe('Memory Efficiency', () => {
    it('should maintain stable memory usage with position churn', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate continuous position creation and destruction
      for (let cycle = 0; cycle < 100; cycle++) {
        // Create positions
        const positions = Array.from({ length: 100 }, (_, i) => 
          createMockPosition(`TEMP_${cycle}_${i}`, 'LONG', { id: `temp_${cycle}_${i}` })
        );
        
        manager.createMultipleTrailingStops(positions);
        
        // Simulate some trading activity
        const updates = positions.map(pos => ({
          positionId: pos.id,
          currentPrice: 50000 + Math.random() * 1000,
          atrValue: 1200,
          aiConfidence: 75,
          marketRegime: 'BULL' as MarketRegime
        }));
        
        manager.batchUpdateTrailingStops(updates);
        
        // Clear positions (simulate closing)
        if (cycle % 10 === 0) {
          manager.clear();
          if (global.gc) global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should efficiently handle large position counts', () => {
      const positionCounts = [100, 500, 1000, 2500, 5000];
      const memoryUsages: number[] = [];
      
      positionCounts.forEach(count => {
        manager.clear();
        if (global.gc) global.gc();
        
        const initialMemory = process.memoryUsage().heapUsed;
        
        const positions = Array.from({ length: count }, (_, i) => 
          createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
        );
        
        manager.createMultipleTrailingStops(positions);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryPerPosition = (finalMemory - initialMemory) / count;
        memoryUsages.push(memoryPerPosition);
      });
      
      // Memory per position should be consistent and reasonable
      const avgMemoryPerPosition = memoryUsages.reduce((a, b) => a + b) / memoryUsages.length;
      expect(avgMemoryPerPosition).toBeLessThan(2048); // Less than 2KB per position
      
      // Memory usage should scale linearly (no memory leaks)
      const variance = Math.max(...memoryUsages) / Math.min(...memoryUsages);
      expect(variance).toBeLessThan(2.0); // Less than 2x variance
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle crypto flash crash scenario efficiently', () => {
      // Setup portfolio similar to real trading
      const cryptoPositions = [
        ...Array.from({ length: 50 }, (_, i) => createMockPosition('BTCUSDT', 'LONG', { id: `btc_long_${i}` })),
        ...Array.from({ length: 30 }, (_, i) => createMockPosition('ETHUSDT', 'LONG', { id: `eth_long_${i}` })),
        ...Array.from({ length: 20 }, (_, i) => createMockPosition('BTCUSDT', 'SHORT', { id: `btc_short_${i}` }))
      ];
      
      manager.createMultipleTrailingStops(cryptoPositions);
      
      // Simulate flash crash - rapid price drops
      const crashPrices = [50000, 47000, 44000, 40000, 35000, 30000, 32000, 35000];
      
      monitor.start();
      
      crashPrices.forEach(price => {
        const priceUpdates = new Map<string, number>();
        cryptoPositions.forEach(pos => {
          if (pos.symbol === 'BTCUSDT') {
            priceUpdates.set(pos.id, price);
          } else {
            priceUpdates.set(pos.id, price * 0.05); // ETH correlation
          }
        });
        
        manager.batchCheckStopTriggers(priceUpdates);
      });
      
      monitor.end();
      const metrics = monitor.getMetrics();
      
      // Should handle flash crash scenario quickly
      expect(metrics.executionTime).toBeLessThan(50);
      
      // Many stops should have been triggered
      const activeStops = manager.getActiveStopsCount();
      expect(activeStops).toBeLessThan(cryptoPositions.length);
    });

    it('should maintain performance during market open volatility', () => {
      const positions = Array.from({ length: 200 }, (_, i) => 
        createMockPosition(`STOCK${i}`, Math.random() > 0.5 ? 'LONG' : 'SHORT', { id: `pos_${i}` })
      );
      
      manager.createMultipleTrailingStops(positions);
      
      // Simulate market open - high volatility, frequent updates
      const marketOpenSimulation = () => {
        const updates = positions.map(pos => ({
          positionId: pos.id,
          currentPrice: 50000 + (Math.random() - 0.5) * 5000, // ±5% volatility
          atrValue: 1200 + Math.random() * 800,
          aiConfidence: 50 + Math.random() * 50,
          marketRegime: ['VOLATILE', 'RANGE'][Math.floor(Math.random() * 2)] as MarketRegime
        }));
        
        return manager.batchUpdateTrailingStops(updates);
      };
      
      monitor.start();
      
      // Run for "5 minutes" of market open simulation
      for (let minute = 0; minute < 5; minute++) {
        for (let second = 0; second < 60; second++) {
          marketOpenSimulation();
        }
      }
      
      monitor.end();
      const metrics = monitor.getMetrics();
      
      // Should handle 300 batch updates (5 minutes * 60 seconds) efficiently
      expect(metrics.executionTime).toBeLessThan(500); // Less than 500ms total
      
      const updatesPerSecond = 300 / (metrics.executionTime / 1000);
      expect(updatesPerSecond).toBeGreaterThan(600); // More than 600 updates/second
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with position count', () => {
      const positionCounts = [100, 500, 1000];
      const executionTimes: number[] = [];
      
      positionCounts.forEach(count => {
        manager.clear();
        
        const positions = Array.from({ length: count }, (_, i) => 
          createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
        );
        
        monitor.start();
        manager.createMultipleTrailingStops(positions);
        monitor.end();
        
        executionTimes.push(monitor.getExecutionTime());
      });
      
      // Should scale roughly linearly
      const scalingFactor1 = executionTimes[1] / executionTimes[0]; // 500/100
      const scalingFactor2 = executionTimes[2] / executionTimes[1]; // 1000/500
      
      expect(scalingFactor1).toBeLessThan(6); // Should be close to 5x
      expect(scalingFactor2).toBeLessThan(2.5); // Should be close to 2x
    });

    it('should handle concurrent processing efficiently', async () => {
      const positions = Array.from({ length: 1000 }, (_, i) => 
        createMockPosition(`SYMBOL${i}`, 'LONG', { id: `pos_${i}` })
      );
      
      manager.createMultipleTrailingStops(positions);
      
      // Simulate concurrent operations
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        async () => {
          const updates = positions.slice(i * 100, (i + 1) * 100).map(pos => ({
            positionId: pos.id,
            currentPrice: 50000 + Math.random() * 1000,
            atrValue: 1200,
            aiConfidence: 75,
            marketRegime: 'BULL' as MarketRegime
          }));
          
          return manager.batchUpdateTrailingStops(updates);
        }
      );
      
      monitor.start();
      await Promise.all(concurrentOperations.map(op => op()));
      monitor.end();
      
      const metrics = monitor.getMetrics();
      
      // Concurrent operations should complete efficiently
      expect(metrics.executionTime).toBeLessThan(100);
    });
  });
});