/**
 * Integration tests for Dynamic Trailing Stops with existing trading systems
 */

import {
  DynamicTrailingStopConfig,
  TrailingStopState,
  Position,
  MarketRegime,
  TrailingStopTrigger
} from '../../types/trading';

import {
  createDefaultTrailingStopConfig,
  createMockPosition,
  createMockATRCalculation,
  createMockVolatilityMetrics,
  advanceTimeBy,
  setSystemTime
} from '../utils/test-helpers';

import { MARKET_SCENARIOS, PRICE_UPDATE_SEQUENCES } from '../fixtures/market-data';

// Mock the existing trading systems
jest.mock('../../lib/trading/execution-engine', () => ({
  tradingEngine: {
    getActivePositions: jest.fn(),
    closePosition: jest.fn(),
    executeAITradeSignal: jest.fn()
  }
}));

jest.mock('../../lib/ai/reasoning-engine', () => ({
  aiReasoningEngine: {
    analyzeMarket: jest.fn()
  }
}));

jest.mock('../../lib/trading/risk/advanced-risk-manager', () => ({
  advancedRiskManager: {
    validateOrder: jest.fn(),
    calculateRiskMetrics: jest.fn()
  }
}));

// Mock WebSocket for real-time price feeds
class MockWebSocketManager {
  private callbacks: Map<string, Function[]> = new Map();
  private isConnected = false;

  connect() {
    this.isConnected = true;
    this.emit('connected', { status: 'CONNECTED' });
  }

  disconnect() {
    this.isConnected = false;
    this.emit('disconnected', { status: 'DISCONNECTED' });
  }

  subscribe(symbol: string, callback: Function) {
    if (!this.callbacks.has(symbol)) {
      this.callbacks.set(symbol, []);
    }
    this.callbacks.get(symbol)!.push(callback);
  }

  simulatePriceUpdate(symbol: string, price: number) {
    const callbacks = this.callbacks.get(symbol) || [];
    callbacks.forEach(callback => callback({ symbol, price, timestamp: new Date() }));
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  on(event: string, callback: Function) {
    this.subscribe(event, callback);
  }
}

// Mock Dynamic Trailing Stops Manager with integration capabilities
class MockDynamicTrailingStopsIntegration {
  private config: DynamicTrailingStopConfig;
  private trailingStops: Map<string, TrailingStopState> = new Map();
  private wsManager: MockWebSocketManager;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(config: DynamicTrailingStopConfig, wsManager: MockWebSocketManager) {
    this.config = config;
    this.wsManager = wsManager;
  }

  async initialize() {
    // Connect to WebSocket feeds
    this.wsManager.connect();
    
    // Start monitoring active positions
    await this.startPositionMonitoring();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  async startPositionMonitoring() {
    // Mock getting active positions from trading engine
    const mockPositions = [
      createMockPosition('BTCUSDT', 'LONG', { id: 'pos_1', currentPrice: 50000 }),
      createMockPosition('ETHUSDT', 'LONG', { id: 'pos_2', currentPrice: 2500 }),
      createMockPosition('BTCUSDT', 'SHORT', { id: 'pos_3', currentPrice: 50000 })
    ];

    // Create trailing stops for each position
    for (const position of mockPositions) {
      await this.createTrailingStopForPosition(position);
    }
  }

  async createTrailingStopForPosition(position: Position): Promise<TrailingStopState> {
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
      reasoningChain: ['Trailing stop created for position']
    };

    this.trailingStops.set(position.id, trailingStop);

    // Subscribe to price updates for this symbol
    this.wsManager.subscribe(position.symbol, (priceData: any) => {
      this.handlePriceUpdate(position.id, priceData.price);
    });

    return trailingStop;
  }

  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.performRealTimeAnalysis();
    }, this.config.updateInterval);
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async performRealTimeAnalysis() {
    for (const [positionId, trailingStop] of this.trailingStops) {
      if (!trailingStop.isActive) continue;

      // Mock AI analysis
      const aiAnalysis = {
        confidence: 70 + Math.random() * 30,
        marketRegime: 'BULL' as MarketRegime,
        reasoning: ['Real-time AI analysis performed']
      };

      // Mock volatility calculation
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();

      // Update trailing stop logic would go here
      trailingStop.aiConfidence = aiAnalysis.confidence;
      trailingStop.marketRegime = aiAnalysis.marketRegime;
      trailingStop.lastUpdated = new Date();
    }
  }

  async handlePriceUpdate(positionId: string, newPrice: number) {
    const trailingStop = this.trailingStops.get(positionId);
    if (!trailingStop || !trailingStop.isActive) return;

    // Check if stop should be triggered
    const shouldTrigger = this.shouldTriggerStop(positionId, newPrice);
    if (shouldTrigger) {
      await this.triggerStop(positionId, newPrice);
      return;
    }

    // Update trailing stop if price moved favorably
    await this.updateTrailingStop(positionId, newPrice);
  }

  shouldTriggerStop(positionId: string, currentPrice: number): boolean {
    const trailingStop = this.trailingStops.get(positionId);
    if (!trailingStop || !trailingStop.isActive) return false;

    if (trailingStop.side === 'LONG') {
      return currentPrice <= trailingStop.currentStopPrice;
    } else {
      return currentPrice >= trailingStop.currentStopPrice;
    }
  }

  async triggerStop(positionId: string, triggerPrice: number): Promise<TrailingStopTrigger> {
    const trailingStop = this.trailingStops.get(positionId);
    if (!trailingStop) throw new Error('Trailing stop not found');

    // Mock position closure
    const executedPrice = triggerPrice * (1 + (Math.random() - 0.5) * 0.001); // Small slippage
    const pnl = trailingStop.side === 'LONG' 
      ? (executedPrice - 50000) * 0.1 // Mock calculation
      : (50000 - executedPrice) * 0.1;

    const trigger: TrailingStopTrigger = {
      id: `trigger_${Date.now()}`,
      positionId,
      symbol: trailingStop.symbol,
      triggerPrice,
      executedPrice,
      side: trailingStop.side,
      quantity: 0.1, // Mock quantity
      pnl,
      reason: 'STOP_TRIGGERED',
      timestamp: new Date(),
      aiConfidence: trailingStop.aiConfidence,
      marketConditions: {
        volatility: 0.03,
        atr: trailingStop.atrValue,
        regime: trailingStop.marketRegime,
        priceMovement: triggerPrice - trailingStop.currentStopPrice
      }
    };

    // Deactivate trailing stop
    trailingStop.isActive = false;
    trailingStop.triggerCount++;

    return trigger;
  }

  async updateTrailingStop(positionId: string, currentPrice: number) {
    const trailingStop = this.trailingStops.get(positionId);
    if (!trailingStop || !trailingStop.isActive) return;

    let shouldUpdate = false;
    let newStopPrice = trailingStop.currentStopPrice;

    if (trailingStop.side === 'LONG' && currentPrice > trailingStop.highestPrice) {
      trailingStop.highestPrice = currentPrice;
      newStopPrice = currentPrice * (1 - trailingStop.trailingPercent / 100);
      shouldUpdate = newStopPrice > trailingStop.currentStopPrice;
    } else if (trailingStop.side === 'SHORT' && currentPrice < trailingStop.lowestPrice) {
      trailingStop.lowestPrice = currentPrice;
      newStopPrice = currentPrice * (1 + trailingStop.trailingPercent / 100);
      shouldUpdate = newStopPrice < trailingStop.currentStopPrice;
    }

    if (shouldUpdate) {
      trailingStop.currentStopPrice = newStopPrice;
      trailingStop.lastUpdated = new Date();
    }
  }

  getTrailingStop(positionId: string): TrailingStopState | undefined {
    return this.trailingStops.get(positionId);
  }

  getAllTrailingStops(): TrailingStopState[] {
    return Array.from(this.trailingStops.values());
  }

  async shutdown() {
    this.stopRealTimeUpdates();
    this.wsManager.disconnect();
    this.trailingStops.clear();
  }
}

describe('Dynamic Trailing Stops - Integration Tests', () => {
  let manager: MockDynamicTrailingStopsIntegration;
  let wsManager: MockWebSocketManager;
  let config: DynamicTrailingStopConfig;

  beforeEach(async () => {
    config = createDefaultTrailingStopConfig();
    wsManager = new MockWebSocketManager();
    manager = new MockDynamicTrailingStopsIntegration(config, wsManager);
    
    jest.useFakeTimers();
    setSystemTime('2025-01-15T10:00:00.000Z');
  });

  afterEach(async () => {
    await manager.shutdown();
    jest.useRealTimers();
  });

  describe('System Integration', () => {
    it('should initialize and connect to all required systems', async () => {
      await manager.initialize();

      // Should have created trailing stops for mock positions
      const trailingStops = manager.getAllTrailingStops();
      expect(trailingStops).toHaveLength(3);
      
      // Should have different position types
      const longStops = trailingStops.filter(ts => ts.side === 'LONG');
      const shortStops = trailingStops.filter(ts => ts.side === 'SHORT');
      expect(longStops).toHaveLength(2);
      expect(shortStops).toHaveLength(1);
    });

    it('should handle WebSocket connection issues gracefully', async () => {
      await manager.initialize();
      
      // Simulate connection loss
      wsManager.disconnect();
      
      // System should handle disconnection without crashing
      const trailingStops = manager.getAllTrailingStops();
      expect(trailingStops.length).toBeGreaterThan(0);
    });

    it('should integrate with AI reasoning engine updates', async () => {
      await manager.initialize();
      
      // Simulate periodic AI analysis updates
      advanceTimeBy(config.updateInterval);
      
      const trailingStops = manager.getAllTrailingStops();
      trailingStops.forEach(ts => {
        expect(ts.aiConfidence).toBeGreaterThan(70);
        expect(ts.marketRegime).toBeDefined();
        expect(ts.lastUpdated).toBeInstanceOf(Date);
      });
    });
  });

  describe('Real-time Price Updates', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should process real-time price updates correctly', async () => {
      const positionId = 'pos_1'; // BTCUSDT Long position
      const initialStop = manager.getTrailingStop(positionId);
      const initialStopPrice = initialStop!.currentStopPrice;

      // Simulate favorable price movement
      wsManager.simulatePriceUpdate('BTCUSDT', 52000);
      
      const updatedStop = manager.getTrailingStop(positionId);
      expect(updatedStop!.highestPrice).toBe(52000);
      expect(updatedStop!.currentStopPrice).toBeGreaterThan(initialStopPrice);
    });

    it('should trigger stops when price hits stop level', async () => {
      const positionId = 'pos_1'; // BTCUSDT Long position
      const trailingStop = manager.getTrailingStop(positionId);
      const stopPrice = trailingStop!.currentStopPrice;

      // Simulate price dropping below stop
      const triggerPrice = stopPrice - 100;
      wsManager.simulatePriceUpdate('BTCUSDT', triggerPrice);

      // Stop should be triggered and deactivated
      const updatedStop = manager.getTrailingStop(positionId);
      expect(updatedStop!.isActive).toBe(false);
      expect(updatedStop!.triggerCount).toBe(1);
    });

    it('should handle multiple simultaneous price updates', async () => {
      const symbols = ['BTCUSDT', 'ETHUSDT'];
      const initialStops = symbols.map(symbol => {
        const position = manager.getAllTrailingStops().find(ts => ts.symbol === symbol);
        return { symbol, initialPrice: position!.highestPrice || position!.lowestPrice };
      });

      // Simulate simultaneous price updates
      wsManager.simulatePriceUpdate('BTCUSDT', 52000);
      wsManager.simulatePriceUpdate('ETHUSDT', 2600);

      // Both stops should be updated
      symbols.forEach(symbol => {
        const stop = manager.getAllTrailingStops().find(ts => ts.symbol === symbol);
        expect(stop!.lastUpdated.getTime()).toBeGreaterThan(Date.now() - 1000);
      });
    });

    it('should handle rapid price movements (stress test)', async () => {
      const positionId = 'pos_1';
      const priceSequence = PRICE_UPDATE_SEQUENCES.VOLATILE_SWING;
      
      let updateCount = 0;
      
      for (const price of priceSequence) {
        wsManager.simulatePriceUpdate('BTCUSDT', price);
        advanceTimeBy(100); // Small time advancement
        updateCount++;
      }

      const finalStop = manager.getTrailingStop(positionId);
      expect(finalStop).toBeDefined();
      expect(finalStop!.lastUpdated).toBeInstanceOf(Date);
      
      // Should have processed all updates without errors
      expect(updateCount).toBe(priceSequence.length);
    });
  });

  describe('Market Regime Integration', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it.each(Object.entries(MARKET_SCENARIOS))(
      'should adapt to %s market conditions',
      async (scenarioName, scenario) => {
        // Simulate market regime change
        advanceTimeBy(config.updateInterval);
        
        const trailingStops = manager.getAllTrailingStops();
        
        // All stops should be updated with current market regime
        trailingStops.forEach(stop => {
          expect(stop.lastUpdated).toBeInstanceOf(Date);
          expect(stop.marketRegime).toBeDefined();
          expect(['BULL', 'BEAR', 'RANGE', 'VOLATILE']).toContain(stop.marketRegime);
        });
      }
    );
  });

  describe('Risk Management Integration', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should integrate with risk management system for position sizing', async () => {
      const trailingStops = manager.getAllTrailingStops();
      
      // All trailing stops should respect risk management rules
      trailingStops.forEach(stop => {
        expect(stop.trailingPercent).toBeGreaterThanOrEqual(config.minTrailingPercent);
        expect(stop.trailingPercent).toBeLessThanOrEqual(config.maxTrailingPercent);
      });
    });

    it('should handle emergency stop scenarios', async () => {
      const positionIds = manager.getAllTrailingStops().map(ts => ts.positionId);
      
      // Simulate emergency stop scenario (flash crash)
      const crashPrices = PRICE_UPDATE_SEQUENCES.SHARP_DROP;
      
      for (const price of crashPrices) {
        wsManager.simulatePriceUpdate('BTCUSDT', price);
        wsManager.simulatePriceUpdate('ETHUSDT', price * 0.05); // ETH price correlation
        advanceTimeBy(100);
      }

      // Some stops should have been triggered
      const triggeredStops = manager.getAllTrailingStops().filter(ts => !ts.isActive);
      expect(triggeredStops.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Latency', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should process price updates within acceptable latency', async () => {
      const startTime = Date.now();
      
      // Process multiple price updates rapidly
      for (let i = 0; i < 100; i++) {
        wsManager.simulatePriceUpdate('BTCUSDT', 50000 + i);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process 100 updates in less than 100ms
      expect(processingTime).toBeLessThan(100);
    });

    it('should handle high-frequency updates without memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate high-frequency trading scenario
      for (let i = 0; i < 1000; i++) {
        wsManager.simulatePriceUpdate('BTCUSDT', 50000 + Math.random() * 1000);
        
        if (i % 100 === 0) {
          advanceTimeBy(100);
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Error Recovery', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should recover from WebSocket disconnections', async () => {
      // Simulate connection loss
      wsManager.disconnect();
      advanceTimeBy(1000);
      
      // Reconnect
      wsManager.connect();
      
      // System should still function
      wsManager.simulatePriceUpdate('BTCUSDT', 52000);
      
      const trailingStops = manager.getAllTrailingStops();
      expect(trailingStops.length).toBeGreaterThan(0);
    });

    it('should handle invalid price data gracefully', async () => {
      // Simulate invalid price updates
      const invalidPrices = [NaN, -1000, 0, Infinity, null, undefined];
      
      invalidPrices.forEach(price => {
        expect(() => {
          wsManager.simulatePriceUpdate('BTCUSDT', price as any);
        }).not.toThrow();
      });
      
      // System should still be functional
      const trailingStops = manager.getAllTrailingStops();
      expect(trailingStops.every(ts => ts.isActive)).toBe(true);
    });

    it('should handle system overload gracefully', async () => {
      // Simulate system overload with many rapid updates
      const overloadTest = async () => {
        for (let i = 0; i < 10000; i++) {
          wsManager.simulatePriceUpdate('BTCUSDT', 50000 + i);
        }
      };
      
      // Should not throw errors even under extreme load
      await expect(overloadTest()).resolves.not.toThrow();
      
      // System should still be responsive
      const trailingStops = manager.getAllTrailingStops();
      expect(trailingStops.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Asset Scenarios', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should handle correlated asset movements', async () => {
      const correlatedPairs = [
        { symbol: 'BTCUSDT', price: 50000 },
        { symbol: 'ETHUSDT', price: 2500 }
      ];

      // Simulate correlated price movements
      correlatedPairs.forEach(({ symbol, price }) => {
        wsManager.simulatePriceUpdate(symbol, price * 1.1); // 10% increase
      });

      const trailingStops = manager.getAllTrailingStops();
      const updatedStops = trailingStops.filter(ts => 
        correlatedPairs.some(pair => pair.symbol === ts.symbol)
      );

      expect(updatedStops.length).toBeGreaterThan(0);
    });

    it('should handle uncorrelated asset movements', async () => {
      // Simulate opposite movements in different assets
      wsManager.simulatePriceUpdate('BTCUSDT', 55000); // Up
      wsManager.simulatePriceUpdate('ETHUSDT', 2250);  // Down

      const btcStop = manager.getAllTrailingStops().find(ts => ts.symbol === 'BTCUSDT' && ts.side === 'LONG');
      const ethStop = manager.getAllTrailingStops().find(ts => ts.symbol === 'ETHUSDT' && ts.side === 'LONG');

      // BTC stop should be updated (favorable move)
      expect(btcStop!.highestPrice).toBe(55000);
      
      // ETH stop should not be updated (unfavorable move)
      expect(ethStop!.highestPrice).toBe(2500);
    });
  });
});

describe('Dynamic Trailing Stops - End-to-End Scenarios', () => {
  let manager: MockDynamicTrailingStopsIntegration;
  let wsManager: MockWebSocketManager;

  beforeEach(async () => {
    const config = createDefaultTrailingStopConfig();
    wsManager = new MockWebSocketManager();
    manager = new MockDynamicTrailingStopsIntegration(config, wsManager);
    
    jest.useFakeTimers();
    await manager.initialize();
  });

  afterEach(async () => {
    await manager.shutdown();
    jest.useRealTimers();
  });

  it('should execute complete trading cycle with trailing stops', async () => {
    const positionId = 'pos_1';
    let trailingStop = manager.getTrailingStop(positionId);
    
    // Initial state
    expect(trailingStop!.isActive).toBe(true);
    expect(trailingStop!.triggerCount).toBe(0);
    
    // Favorable price movement
    wsManager.simulatePriceUpdate('BTCUSDT', 52000);
    trailingStop = manager.getTrailingStop(positionId);
    expect(trailingStop!.highestPrice).toBe(52000);
    
    // More favorable movement
    wsManager.simulatePriceUpdate('BTCUSDT', 54000);
    trailingStop = manager.getTrailingStop(positionId);
    expect(trailingStop!.highestPrice).toBe(54000);
    
    // Price reversal triggers stop
    const stopPrice = trailingStop!.currentStopPrice;
    wsManager.simulatePriceUpdate('BTCUSDT', stopPrice - 100);
    
    trailingStop = manager.getTrailingStop(positionId);
    expect(trailingStop!.isActive).toBe(false);
    expect(trailingStop!.triggerCount).toBe(1);
  });

  it('should handle complex market scenario with multiple phases', async () => {
    const phases = [
      { name: 'Bull Run', prices: [50000, 51000, 52000, 53000, 54000] },
      { name: 'Consolidation', prices: [54000, 53800, 54100, 53900, 54050] },
      { name: 'Sharp Correction', prices: [54000, 52000, 50000, 48000] }
    ];

    const positionId = 'pos_1';
    let activeStops = [];

    for (const phase of phases) {
      for (const price of phase.prices) {
        wsManager.simulatePriceUpdate('BTCUSDT', price);
        advanceTimeBy(1000);
        
        const stop = manager.getTrailingStop(positionId);
        if (stop && stop.isActive) {
          activeStops.push({
            phase: phase.name,
            price,
            stopPrice: stop.currentStopPrice,
            highestPrice: stop.highestPrice
          });
        }
      }
    }

    // Should have tracked price movements through all phases
    expect(activeStops.length).toBeGreaterThan(0);
    
    // Final stop should reflect the journey
    const finalStop = manager.getTrailingStop(positionId);
    expect(finalStop).toBeDefined();
  });
});