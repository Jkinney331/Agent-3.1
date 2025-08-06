/**
 * Unit tests for Dynamic Trailing Stops core functionality
 */

import {
  DynamicTrailingStopConfig,
  TrailingStopState,
  TrailingStopUpdate,
  MarketRegime,
  PositionSide,
  ATRCalculation,
  MarketVolatilityMetrics
} from '../../types/trading';

import {
  createDefaultTrailingStopConfig,
  createMockTrailingStopState,
  createMockPosition,
  createMockATRCalculation,
  createMockVolatilityMetrics,
  assertTrailingStopWithinBounds,
  MARKET_REGIME_SCENARIOS,
  AI_CONFIDENCE_SCENARIOS,
  generatePriceScenario,
  PRICE_SCENARIOS
} from '../utils/test-helpers';

import { MARKET_SCENARIOS, ATR_SCENARIOS } from '../fixtures/market-data';

// Mock implementation of the DynamicTrailingStopsManager
// This represents the class that will be implemented by the backend architect
class MockDynamicTrailingStopsManager {
  private config: DynamicTrailingStopConfig;
  private trailingStops: Map<string, TrailingStopState> = new Map();

  constructor(config: DynamicTrailingStopConfig) {
    this.config = config;
  }

  /**
   * Calculate trailing stop percentage based on market conditions
   */
  calculateTrailingStop(
    currentPrice: number,
    side: PositionSide,
    atr: ATRCalculation,
    volatility: MarketVolatilityMetrics,
    aiConfidence: number,
    marketRegime: MarketRegime
  ): number {
    // Base trailing percentage
    let trailingPercent = this.config.baseTrailingPercent;

    // Adjust for volatility using ATR
    const atrAdjustment = (atr.normalized * this.config.atrMultiplier);
    trailingPercent += atrAdjustment;

    // Adjust for market regime
    const regimeMultiplier = this.config.marketRegimeAdjustment[marketRegime.toLowerCase() as keyof typeof this.config.marketRegimeAdjustment];
    trailingPercent *= regimeMultiplier;

    // Adjust for AI confidence
    const confidenceAdjustment = (aiConfidence - 50) / 100; // Scale confidence to -0.5 to +0.5
    trailingPercent *= (1 + confidenceAdjustment * 0.3); // Up to 30% adjustment

    // Apply bounds
    trailingPercent = Math.max(this.config.minTrailingPercent, Math.min(this.config.maxTrailingPercent, trailingPercent));

    return trailingPercent;
  }

  /**
   * Update trailing stop for a position
   */
  updateTrailingStop(
    positionId: string,
    currentPrice: number,
    atr: ATRCalculation,
    volatility: MarketVolatilityMetrics,
    aiConfidence: number,
    marketRegime: MarketRegime
  ): TrailingStopUpdate | null {
    const trailingStop = this.trailingStops.get(positionId);
    if (!trailingStop || !trailingStop.isActive) {
      return null;
    }

    const newTrailingPercent = this.calculateTrailingStop(
      currentPrice,
      trailingStop.side,
      atr,
      volatility,
      aiConfidence,
      marketRegime
    );

    let newStopPrice: number;
    let shouldUpdate = false;

    if (trailingStop.side === 'LONG') {
      // For long positions, stop moves up as price moves up
      if (currentPrice > trailingStop.highestPrice) {
        trailingStop.highestPrice = currentPrice;
        shouldUpdate = true;
      }
      newStopPrice = trailingStop.highestPrice * (1 - newTrailingPercent / 100);
    } else {
      // For short positions, stop moves down as price moves down
      if (currentPrice < trailingStop.lowestPrice) {
        trailingStop.lowestPrice = currentPrice;
        shouldUpdate = true;
      }
      newStopPrice = trailingStop.lowestPrice * (1 + newTrailingPercent / 100);
    }

    // Only update if the stop should move in favorable direction
    const favorableMove = trailingStop.side === 'LONG' 
      ? newStopPrice > trailingStop.currentStopPrice
      : newStopPrice < trailingStop.currentStopPrice;

    if (shouldUpdate && favorableMove) {
      const previousStopPrice = trailingStop.currentStopPrice;
      
      trailingStop.currentStopPrice = newStopPrice;
      trailingStop.trailingPercent = newTrailingPercent;
      trailingStop.lastUpdated = new Date();
      trailingStop.atrValue = atr.current;
      trailingStop.aiConfidence = aiConfidence;
      trailingStop.marketRegime = marketRegime;

      return {
        positionId,
        newStopPrice,
        previousStopPrice,
        priceMovement: trailingStop.side === 'LONG' 
          ? currentPrice - trailingStop.highestPrice
          : trailingStop.lowestPrice - currentPrice,
        trailingPercent: newTrailingPercent,
        atrValue: atr.current,
        aiConfidence,
        marketRegime,
        timestamp: new Date(),
        reasoning: [
          `Trailing stop updated to ${newStopPrice.toFixed(2)}`,
          `Market regime: ${marketRegime}`,
          `AI confidence: ${aiConfidence}%`,
          `ATR: ${atr.current.toFixed(2)}`
        ]
      };
    }

    return null;
  }

  /**
   * Create trailing stop for a position
   */
  createTrailingStop(positionId: string, symbol: string, side: PositionSide, currentPrice: number): TrailingStopState {
    const trailingStop = createMockTrailingStopState(positionId, symbol, side, {
      currentStopPrice: side === 'LONG' 
        ? currentPrice * (1 - this.config.baseTrailingPercent / 100)
        : currentPrice * (1 + this.config.baseTrailingPercent / 100),
      highestPrice: side === 'LONG' ? currentPrice : 0,
      lowestPrice: side === 'LONG' ? 999999 : currentPrice,
      trailingPercent: this.config.baseTrailingPercent
    });

    this.trailingStops.set(positionId, trailingStop);
    return trailingStop;
  }

  /**
   * Check if stop should be triggered
   */
  shouldTriggerStop(positionId: string, currentPrice: number): boolean {
    const trailingStop = this.trailingStops.get(positionId);
    if (!trailingStop || !trailingStop.isActive) {
      return false;
    }

    if (trailingStop.side === 'LONG') {
      return currentPrice <= trailingStop.currentStopPrice;
    } else {
      return currentPrice >= trailingStop.currentStopPrice;
    }
  }

  getTrailingStop(positionId: string): TrailingStopState | undefined {
    return this.trailingStops.get(positionId);
  }
}

describe('Dynamic Trailing Stops - Core Logic', () => {
  let manager: MockDynamicTrailingStopsManager;
  let config: DynamicTrailingStopConfig;

  beforeEach(() => {
    config = createDefaultTrailingStopConfig();
    manager = new MockDynamicTrailingStopsManager(config);
    jest.clearAllMocks();
  });

  describe('calculateTrailingStop', () => {
    it('should calculate base trailing stop percentage', () => {
      const atr = createMockATRCalculation(14, 1200);
      const volatility = createMockVolatilityMetrics('NORMAL');
      const aiConfidence = 75;
      const marketRegime: MarketRegime = 'BULL';

      const result = manager.calculateTrailingStop(
        50000,
        'LONG',
        atr,
        volatility,
        aiConfidence,
        marketRegime
      );

      expect(result).toBeGreaterThan(config.minTrailingPercent);
      expect(result).toBeLessThan(config.maxTrailingPercent);
      expect(typeof result).toBe('number');
    });

    it('should adjust trailing stop for high volatility', () => {
      const normalATR = createMockATRCalculation(14, 1200);
      const highATR = createMockATRCalculation(14, 2500);
      const volatility = createMockVolatilityMetrics('HIGH');
      const aiConfidence = 75;
      const marketRegime: MarketRegime = 'BULL';

      const normalResult = manager.calculateTrailingStop(50000, 'LONG', normalATR, volatility, aiConfidence, marketRegime);
      const highVolResult = manager.calculateTrailingStop(50000, 'LONG', highATR, volatility, aiConfidence, marketRegime);

      expect(highVolResult).toBeGreaterThan(normalResult);
    });

    it('should adjust trailing stop for different market regimes', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const aiConfidence = 75;

      const bullResult = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, aiConfidence, 'BULL');
      const bearResult = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, aiConfidence, 'BEAR');
      const volatileResult = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, aiConfidence, 'VOLATILE');

      expect(bullResult).toBeGreaterThan(bearResult);
      expect(bearResult).toBeGreaterThan(volatileResult);
    });

    it('should adjust trailing stop based on AI confidence', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const marketRegime: MarketRegime = 'BULL';

      const highConfidence = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, 90, marketRegime);
      const lowConfidence = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, 40, marketRegime);

      expect(highConfidence).toBeGreaterThan(lowConfidence);
    });

    it('should respect minimum and maximum trailing percentages', () => {
      const extremeATR = createMockATRCalculation(14, 5000); // Very high ATR
      const volatility = createMockVolatilityMetrics('EXTREME');
      const aiConfidence = 95;
      const marketRegime: MarketRegime = 'BULL';

      const result = manager.calculateTrailingStop(50000, 'LONG', extremeATR, volatility, aiConfidence, marketRegime);

      expect(result).toBeGreaterThanOrEqual(config.minTrailingPercent);
      expect(result).toBeLessThanOrEqual(config.maxTrailingPercent);
    });
  });

  describe('createTrailingStop', () => {
    it('should create trailing stop for long position', () => {
      const positionId = 'pos_123';
      const symbol = 'BTCUSDT';
      const currentPrice = 50000;

      const trailingStop = manager.createTrailingStop(positionId, symbol, 'LONG', currentPrice);

      expect(trailingStop.positionId).toBe(positionId);
      expect(trailingStop.symbol).toBe(symbol);
      expect(trailingStop.side).toBe('LONG');
      expect(trailingStop.highestPrice).toBe(currentPrice);
      expect(trailingStop.currentStopPrice).toBeLessThan(currentPrice);
      expect(trailingStop.isActive).toBe(true);
    });

    it('should create trailing stop for short position', () => {
      const positionId = 'pos_456';
      const symbol = 'ETHUSDT';
      const currentPrice = 2500;

      const trailingStop = manager.createTrailingStop(positionId, symbol, 'SHORT', currentPrice);

      expect(trailingStop.positionId).toBe(positionId);
      expect(trailingStop.symbol).toBe(symbol);
      expect(trailingStop.side).toBe('SHORT');
      expect(trailingStop.lowestPrice).toBe(currentPrice);
      expect(trailingStop.currentStopPrice).toBeGreaterThan(currentPrice);
      expect(trailingStop.isActive).toBe(true);
    });
  });

  describe('updateTrailingStop', () => {
    let positionId: string;
    let trailingStop: TrailingStopState;

    beforeEach(() => {
      positionId = 'pos_123';
      trailingStop = manager.createTrailingStop(positionId, 'BTCUSDT', 'LONG', 50000);
    });

    it('should update trailing stop when price moves favorably', () => {
      const newPrice = 52000; // Price moved up for long position
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const aiConfidence = 80;
      const marketRegime: MarketRegime = 'BULL';

      const update = manager.updateTrailingStop(positionId, newPrice, atr, volatility, aiConfidence, marketRegime);

      expect(update).not.toBeNull();
      expect(update!.newStopPrice).toBeGreaterThan(update!.previousStopPrice);
      expect(update!.positionId).toBe(positionId);
      
      const updatedStop = manager.getTrailingStop(positionId);
      expect(updatedStop!.highestPrice).toBe(newPrice);
    });

    it('should not update trailing stop when price moves unfavorably', () => {
      const newPrice = 48000; // Price moved down for long position
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const aiConfidence = 75;
      const marketRegime: MarketRegime = 'BULL';

      const update = manager.updateTrailingStop(positionId, newPrice, atr, volatility, aiConfidence, marketRegime);

      expect(update).toBeNull();
      
      const trailingStopAfter = manager.getTrailingStop(positionId);
      expect(trailingStopAfter!.highestPrice).toBe(50000); // Should remain unchanged
    });

    it('should update short position trailing stop correctly', () => {
      const shortPositionId = 'pos_short';
      manager.createTrailingStop(shortPositionId, 'BTCUSDT', 'SHORT', 50000);
      
      const newPrice = 48000; // Price moved down for short position (favorable)
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const aiConfidence = 75;
      const marketRegime: MarketRegime = 'BEAR';

      const update = manager.updateTrailingStop(shortPositionId, newPrice, atr, volatility, aiConfidence, marketRegime);

      expect(update).not.toBeNull();
      expect(update!.newStopPrice).toBeLessThan(update!.previousStopPrice);
      
      const updatedStop = manager.getTrailingStop(shortPositionId);
      expect(updatedStop!.lowestPrice).toBe(newPrice);
    });
  });

  describe('shouldTriggerStop', () => {
    it('should trigger stop for long position when price hits stop', () => {
      const positionId = 'pos_123';
      const trailingStop = manager.createTrailingStop(positionId, 'BTCUSDT', 'LONG', 50000);
      
      const triggerPrice = trailingStop.currentStopPrice - 100; // Below stop price
      
      const shouldTrigger = manager.shouldTriggerStop(positionId, triggerPrice);
      expect(shouldTrigger).toBe(true);
    });

    it('should not trigger stop for long position when price above stop', () => {
      const positionId = 'pos_123';
      const trailingStop = manager.createTrailingStop(positionId, 'BTCUSDT', 'LONG', 50000);
      
      const priceAboveStop = trailingStop.currentStopPrice + 100;
      
      const shouldTrigger = manager.shouldTriggerStop(positionId, priceAboveStop);
      expect(shouldTrigger).toBe(false);
    });

    it('should trigger stop for short position when price hits stop', () => {
      const positionId = 'pos_456';
      const trailingStop = manager.createTrailingStop(positionId, 'BTCUSDT', 'SHORT', 50000);
      
      const triggerPrice = trailingStop.currentStopPrice + 100; // Above stop price
      
      const shouldTrigger = manager.shouldTriggerStop(positionId, triggerPrice);
      expect(shouldTrigger).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely low prices', () => {
      const atr = createMockATRCalculation(14, 1);
      const volatility = createMockVolatilityMetrics('LOW');
      const result = manager.calculateTrailingStop(1, 'LONG', atr, volatility, 75, 'RANGE');
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('should handle extremely high prices', () => {
      const atr = createMockATRCalculation(14, 10000);
      const volatility = createMockVolatilityMetrics('HIGH');
      const result = manager.calculateTrailingStop(1000000, 'LONG', atr, volatility, 75, 'BULL');
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('should handle zero confidence', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const result = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, 0, 'BULL');
      
      expect(result).toBeGreaterThanOrEqual(config.minTrailingPercent);
    });

    it('should handle maximum confidence', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const result = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, 100, 'BULL');
      
      expect(result).toBeLessThanOrEqual(config.maxTrailingPercent);
    });

    it('should handle inactive trailing stops', () => {
      const positionId = 'pos_inactive';
      const trailingStop = manager.createTrailingStop(positionId, 'BTCUSDT', 'LONG', 50000);
      trailingStop.isActive = false;

      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const update = manager.updateTrailingStop(positionId, 52000, atr, volatility, 75, 'BULL');

      expect(update).toBeNull();
    });
  });

  describe('Market Regime Scenarios', () => {
    it.each(Object.entries(MARKET_REGIME_SCENARIOS))(
      'should handle %s market regime correctly',
      (regimeName, scenario) => {
        const atr = createMockATRCalculation();
        const volatility = createMockVolatilityMetrics(scenario.volatilityRegime);
        
        scenario.confidenceScores.forEach(confidence => {
          const result = manager.calculateTrailingStop(
            50000,
            'LONG',
            atr,
            volatility,
            confidence,
            scenario.regime
          );
          
          expect(result).toBeGreaterThanOrEqual(config.minTrailingPercent);
          expect(result).toBeLessThanOrEqual(config.maxTrailingPercent);
        });
      }
    );
  });

  describe('Price Movement Scenarios', () => {
    it.each(PRICE_SCENARIOS)(
      'should handle $name price scenario',
      (scenario) => {
        const positionId = 'pos_scenario';
        const trailingStop = manager.createTrailingStop(positionId, 'BTCUSDT', 'LONG', scenario.startPrice);
        const prices = generatePriceScenario(scenario);
        
        const atr = createMockATRCalculation();
        const volatility = createMockVolatilityMetrics();
        
        let updateCount = 0;
        
        prices.forEach(price => {
          const update = manager.updateTrailingStop(
            positionId,
            price,
            atr,
            volatility,
            75,
            'BULL'
          );
          
          if (update) {
            updateCount++;
            assertTrailingStopWithinBounds(
              update.newStopPrice,
              price,
              'LONG',
              config.maxTrailingPercent
            );
          }
        });
        
        // Should have some updates for trending scenarios
        if (scenario.trend !== 'SIDEWAYS') {
          expect(updateCount).toBeGreaterThan(0);
        }
      }
    );
  });
});

describe('Dynamic Trailing Stops - ATR Integration', () => {
  let manager: MockDynamicTrailingStopsManager;

  beforeEach(() => {
    const config = createDefaultTrailingStopConfig();
    manager = new MockDynamicTrailingStopsManager(config);
  });

  it.each(Object.entries(ATR_SCENARIOS))(
    'should handle %s ATR scenario',
    (scenarioName, atrData) => {
      const atr: ATRCalculation = {
        period: atrData.period,
        values: atrData.values,
        current: atrData.values[atrData.values.length - 1],
        average: atrData.average,
        normalized: atrData.normalized
      };
      
      const volatility = createMockVolatilityMetrics();
      const result = manager.calculateTrailingStop(50000, 'LONG', atr, volatility, 75, 'BULL');
      
      expect(result).toBeGreaterThan(0);
      
      // Higher ATR should generally result in wider trailing stops
      if (scenarioName.includes('HIGH') || scenarioName.includes('EXTREME')) {
        expect(result).toBeGreaterThan(2.5); // Should be wider than base
      }
    }
  );
});

describe('Dynamic Trailing Stops - Error Handling', () => {
  let manager: MockDynamicTrailingStopsManager;

  beforeEach(() => {
    const config = createDefaultTrailingStopConfig();
    manager = new MockDynamicTrailingStopsManager(config);
  });

  it('should handle non-existent position gracefully', () => {
    const atr = createMockATRCalculation();
    const volatility = createMockVolatilityMetrics();
    
    const update = manager.updateTrailingStop('non_existent', 50000, atr, volatility, 75, 'BULL');
    expect(update).toBeNull();
    
    const shouldTrigger = manager.shouldTriggerStop('non_existent', 50000);
    expect(shouldTrigger).toBe(false);
  });

  it('should handle invalid ATR data', () => {
    const invalidATR: ATRCalculation = {
      period: 0,
      values: [],
      current: 0,
      average: 0,
      normalized: 0
    };
    
    const volatility = createMockVolatilityMetrics();
    const result = manager.calculateTrailingStop(50000, 'LONG', invalidATR, volatility, 75, 'BULL');
    
    // Should still return a valid result using base configuration
    expect(result).toBeCloseTo(2.0, 1); // Should be close to base percentage
  });
});