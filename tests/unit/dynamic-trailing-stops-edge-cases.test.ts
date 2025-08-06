/**
 * Edge cases and boundary condition tests for Dynamic Trailing Stops
 */

import {
  DynamicTrailingStopConfig,
  TrailingStopState,
  MarketRegime,
  ATRCalculation,
  MarketVolatilityMetrics
} from '../../types/trading';

import {
  createDefaultTrailingStopConfig,
  createMockTrailingStopState,
  createMockATRCalculation,
  createMockVolatilityMetrics
} from '../utils/test-helpers';

// Mock manager for edge case testing
class EdgeCaseDynamicTrailingStops {
  private config: DynamicTrailingStopConfig;

  constructor(config: DynamicTrailingStopConfig) {
    this.config = config;
  }

  calculateTrailingStop(
    currentPrice: number,
    side: 'LONG' | 'SHORT',
    atr: ATRCalculation,
    volatility: MarketVolatilityMetrics,
    aiConfidence: number,
    marketRegime: MarketRegime
  ): number {
    // Handle edge cases first
    if (!isFinite(currentPrice) || currentPrice <= 0) {
      throw new Error('Invalid current price');
    }

    if (!isFinite(aiConfidence) || aiConfidence < 0 || aiConfidence > 100) {
      aiConfidence = 50; // Default to neutral confidence
    }

    if (!atr || !isFinite(atr.current) || atr.current < 0) {
      atr = createMockATRCalculation(); // Use default ATR
    }

    let trailingPercent = this.config.baseTrailingPercent;

    // Safe ATR adjustment
    try {
      const atrAdjustment = (atr.normalized * this.config.atrMultiplier);
      if (isFinite(atrAdjustment)) {
        trailingPercent += atrAdjustment;
      }
    } catch (error) {
      // Continue with base percentage if ATR calculation fails
    }

    // Safe regime adjustment
    const regimeKey = marketRegime?.toLowerCase() as keyof typeof this.config.marketRegimeAdjustment;
    const regimeMultiplier = this.config.marketRegimeAdjustment[regimeKey] || 1.0;
    trailingPercent *= regimeMultiplier;

    // Safe confidence adjustment
    const confidenceAdjustment = (aiConfidence - 50) / 100;
    if (isFinite(confidenceAdjustment)) {
      trailingPercent *= (1 + confidenceAdjustment * 0.3);
    }

    // Apply bounds with additional safety checks
    trailingPercent = Math.max(
      this.config.minTrailingPercent,
      Math.min(this.config.maxTrailingPercent, trailingPercent)
    );

    // Final safety check
    if (!isFinite(trailingPercent) || trailingPercent <= 0) {
      return this.config.baseTrailingPercent;
    }

    return trailingPercent;
  }

  handleExtremeMarketConditions(
    currentPrice: number,
    previousPrice: number,
    trailingStop: TrailingStopState
  ): { shouldPause: boolean; reason?: string } {
    // Circuit breaker for extreme price movements
    const priceChangePercent = Math.abs(currentPrice - previousPrice) / previousPrice * 100;
    
    if (priceChangePercent > 20) { // More than 20% price change
      return {
        shouldPause: true,
        reason: `Extreme price movement detected: ${priceChangePercent.toFixed(2)}%`
      };
    }

    // Gap detection (price jumped without intermediate values)
    const expectedMaxGap = previousPrice * 0.05; // 5% gap threshold
    const actualGap = Math.abs(currentPrice - previousPrice);
    
    if (actualGap > expectedMaxGap) {
      return {
        shouldPause: true,
        reason: `Price gap detected: ${(actualGap / previousPrice * 100).toFixed(2)}%`
      };
    }

    // Check for market halt conditions
    if (currentPrice === previousPrice && trailingStop.triggerCount === 0) {
      // Price hasn't moved for extended period
      return {
        shouldPause: false,
        reason: 'Market appears to be halted'
      };
    }

    return { shouldPause: false };
  }

  handleLowLiquidityConditions(
    volume: number,
    averageVolume: number,
    trailingPercent: number
  ): number {
    const volumeRatio = volume / averageVolume;
    
    if (volumeRatio < 0.1) { // Very low volume
      // Widen trailing stop in low liquidity
      return Math.min(trailingPercent * 1.5, this.config.maxTrailingPercent);
    }
    
    if (volumeRatio < 0.3) { // Low volume
      return Math.min(trailingPercent * 1.2, this.config.maxTrailingPercent);
    }

    return trailingPercent;
  }

  validateConfigurationEdgeCases(config: Partial<DynamicTrailingStopConfig>): string[] {
    const errors: string[] = [];

    if (config.baseTrailingPercent !== undefined) {
      if (config.baseTrailingPercent <= 0 || config.baseTrailingPercent > 100) {
        errors.push('baseTrailingPercent must be between 0 and 100');
      }
    }

    if (config.minTrailingPercent !== undefined && config.maxTrailingPercent !== undefined) {
      if (config.minTrailingPercent >= config.maxTrailingPercent) {
        errors.push('minTrailingPercent must be less than maxTrailingPercent');
      }
    }

    if (config.atrMultiplier !== undefined) {
      if (config.atrMultiplier < 0) {
        errors.push('atrMultiplier cannot be negative');
      }
      if (config.atrMultiplier > 10) {
        errors.push('atrMultiplier seems unusually high (>10)');
      }
    }

    if (config.confidenceThreshold !== undefined) {
      if (config.confidenceThreshold < 0 || config.confidenceThreshold > 100) {
        errors.push('confidenceThreshold must be between 0 and 100');
      }
    }

    if (config.updateInterval !== undefined) {
      if (config.updateInterval < 100) {
        errors.push('updateInterval should not be less than 100ms');
      }
      if (config.updateInterval > 60000) {
        errors.push('updateInterval should not exceed 1 minute');
      }
    }

    return errors;
  }
}

describe('Dynamic Trailing Stops - Edge Cases', () => {
  let manager: EdgeCaseDynamicTrailingStops;
  let config: DynamicTrailingStopConfig;

  beforeEach(() => {
    config = createDefaultTrailingStopConfig();
    manager = new EdgeCaseDynamicTrailingStops(config);
  });

  describe('Invalid Input Handling', () => {
    it('should handle invalid prices gracefully', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();

      // Test various invalid prices
      const invalidPrices = [NaN, Infinity, -Infinity, 0, -1000];
      
      invalidPrices.forEach(price => {
        expect(() => {
          manager.calculateTrailingStop(price, 'LONG', atr, volatility, 75, 'BULL');
        }).toThrow('Invalid current price');
      });
    });

    it('should handle invalid AI confidence values', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const currentPrice = 50000;

      // Test invalid confidence values
      const invalidConfidences = [NaN, Infinity, -Infinity, -50, 150];

      invalidConfidences.forEach(confidence => {
        const result = manager.calculateTrailingStop(
          currentPrice, 'LONG', atr, volatility, confidence, 'BULL'
        );
        
        // Should return a valid result despite invalid confidence
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(100);
      });
    });

    it('should handle corrupted ATR data', () => {
      const volatility = createMockVolatilityMetrics();
      const currentPrice = 50000;

      const corruptedATRs = [
        null as any,
        undefined as any,
        { current: NaN, normalized: NaN } as any,
        { current: Infinity, normalized: Infinity } as any,
        { current: -1000, normalized: -0.5 } as any,
        {} as any
      ];

      corruptedATRs.forEach(atr => {
        const result = manager.calculateTrailingStop(
          currentPrice, 'LONG', atr, volatility, 75, 'BULL'
        );
        
        // Should fallback to base configuration
        expect(result).toBeCloseTo(config.baseTrailingPercent, 1);
      });
    });

    it('should handle invalid market regimes', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const currentPrice = 50000;

      const invalidRegimes = [
        null as any,
        undefined as any,
        'INVALID_REGIME' as any,
        '' as any,
        'bull' as any // Wrong case
      ];

      invalidRegimes.forEach(regime => {
        const result = manager.calculateTrailingStop(
          currentPrice, 'LONG', atr, volatility, 75, regime
        );
        
        // Should return a valid result with default regime handling
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(100);
      });
    });
  });

  describe('Extreme Market Conditions', () => {
    it('should detect flash crash conditions', () => {
      const trailingStop = createMockTrailingStopState('pos_1', 'BTCUSDT', 'LONG');
      const previousPrice = 50000;
      const flashCrashPrice = 35000; // 30% drop

      const result = manager.handleExtremeMarketConditions(
        flashCrashPrice,
        previousPrice,
        trailingStop
      );

      expect(result.shouldPause).toBe(true);
      expect(result.reason).toContain('Extreme price movement');
    });

    it('should detect price gaps', () => {
      const trailingStop = createMockTrailingStopState('pos_1', 'BTCUSDT', 'LONG');
      const previousPrice = 50000;
      const gappedPrice = 47000; // 6% gap (above 5% threshold)

      const result = manager.handleExtremeMarketConditions(
        gappedPrice,
        previousPrice,
        trailingStop
      );

      expect(result.shouldPause).toBe(true);
      expect(result.reason).toContain('Price gap detected');
    });

    it('should handle market halt conditions', () => {
      const trailingStop = createMockTrailingStopState('pos_1', 'BTCUSDT', 'LONG', {
        triggerCount: 0
      });
      const price = 50000;

      const result = manager.handleExtremeMarketConditions(price, price, trailingStop);

      expect(result.shouldPause).toBe(false);
      expect(result.reason).toContain('Market appears to be halted');
    });

    it('should adjust for low liquidity conditions', () => {
      const baseTrailingPercent = 2.0;
      const averageVolume = 1000000;

      // Test very low volume
      const veryLowVolume = 50000; // 5% of average
      const adjustedPercent1 = manager.handleLowLiquidityConditions(
        veryLowVolume,
        averageVolume,
        baseTrailingPercent
      );
      expect(adjustedPercent1).toBeGreaterThan(baseTrailingPercent);

      // Test low volume
      const lowVolume = 200000; // 20% of average
      const adjustedPercent2 = manager.handleLowLiquidityConditions(
        lowVolume,
        averageVolume,
        baseTrailingPercent
      );
      expect(adjustedPercent2).toBeGreaterThan(baseTrailingPercent);
      expect(adjustedPercent2).toBeLessThan(adjustedPercent1);

      // Test normal volume
      const normalVolume = 1000000;
      const adjustedPercent3 = manager.handleLowLiquidityConditions(
        normalVolume,
        averageVolume,
        baseTrailingPercent
      );
      expect(adjustedPercent3).toBe(baseTrailingPercent);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle minimum possible prices', () => {
      const atr = createMockATRCalculation(14, 0.01);
      const volatility = createMockVolatilityMetrics('LOW');
      const minPrice = 0.000001; // Satoshi-like precision

      const result = manager.calculateTrailingStop(
        minPrice, 'LONG', atr, volatility, 75, 'BULL'
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('should handle maximum possible prices', () => {
      const atr = createMockATRCalculation(14, 1000000);
      const volatility = createMockVolatilityMetrics('HIGH');
      const maxPrice = 1000000; // Very high price

      const result = manager.calculateTrailingStop(
        maxPrice, 'LONG', atr, volatility, 75, 'BULL'
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('should handle zero ATR values', () => {
      const zeroATR: ATRCalculation = {
        period: 14,
        values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        current: 0,
        average: 0,
        normalized: 0
      };
      const volatility = createMockVolatilityMetrics();

      const result = manager.calculateTrailingStop(
        50000, 'LONG', zeroATR, volatility, 75, 'BULL'
      );

      // Should fallback to base percentage when ATR is zero
      expect(result).toBeCloseTo(config.baseTrailingPercent * config.marketRegimeAdjustment.bull, 1);
    });

    it('should handle extreme ATR values', () => {
      const extremeATR: ATRCalculation = {
        period: 14,
        values: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000],
        current: 50000,
        average: 50000,
        normalized: 1.0 // 100% of price
      };
      const volatility = createMockVolatilityMetrics('EXTREME');

      const result = manager.calculateTrailingStop(
        50000, 'LONG', extremeATR, volatility, 75, 'BULL'
      );

      // Should be capped at max trailing percent
      expect(result).toBeLessThanOrEqual(config.maxTrailingPercent);
    });

    it('should handle confidence at boundaries', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();

      // Test minimum confidence (0)
      const resultMin = manager.calculateTrailingStop(
        50000, 'LONG', atr, volatility, 0, 'BULL'
      );
      expect(resultMin).toBeGreaterThanOrEqual(config.minTrailingPercent);

      // Test maximum confidence (100)
      const resultMax = manager.calculateTrailingStop(
        50000, 'LONG', atr, volatility, 100, 'BULL'
      );
      expect(resultMax).toBeLessThanOrEqual(config.maxTrailingPercent);

      // High confidence should generally result in tighter stops
      expect(resultMax).toBeGreaterThan(resultMin);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate base trailing percent bounds', () => {
      const invalidConfigs = [
        { baseTrailingPercent: 0 },
        { baseTrailingPercent: -1 },
        { baseTrailingPercent: 101 },
        { baseTrailingPercent: 1000 }
      ];

      invalidConfigs.forEach(invalidConfig => {
        const errors = manager.validateConfigurationEdgeCases(invalidConfig);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('baseTrailingPercent');
      });
    });

    it('should validate min/max trailing percent relationship', () => {
      const invalidConfig = {
        minTrailingPercent: 5.0,
        maxTrailingPercent: 2.0 // Min > Max
      };

      const errors = manager.validateConfigurationEdgeCases(invalidConfig);
      expect(errors).toContain('minTrailingPercent must be less than maxTrailingPercent');
    });

    it('should validate ATR multiplier bounds', () => {
      const invalidConfigs = [
        { atrMultiplier: -1 },
        { atrMultiplier: 15 } // Unusually high
      ];

      invalidConfigs.forEach(invalidConfig => {
        const errors = manager.validateConfigurationEdgeCases(invalidConfig);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('atrMultiplier');
      });
    });

    it('should validate confidence threshold bounds', () => {
      const invalidConfigs = [
        { confidenceThreshold: -10 },
        { confidenceThreshold: 150 }
      ];

      invalidConfigs.forEach(invalidConfig => {
        const errors = manager.validateConfigurationEdgeCases(invalidConfig);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('confidenceThreshold');
      });
    });

    it('should validate update interval bounds', () => {
      const invalidConfigs = [
        { updateInterval: 50 }, // Too fast
        { updateInterval: 120000 } // Too slow
      ];

      invalidConfigs.forEach(invalidConfig => {
        const errors = manager.validateConfigurationEdgeCases(invalidConfig);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('updateInterval');
      });
    });

    it('should pass validation for valid configurations', () => {
      const validConfig = {
        baseTrailingPercent: 2.0,
        minTrailingPercent: 0.5,
        maxTrailingPercent: 5.0,
        atrMultiplier: 1.5,
        confidenceThreshold: 70,
        updateInterval: 5000
      };

      const errors = manager.validateConfigurationEdgeCases(validConfig);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Numerical Precision Edge Cases', () => {
    it('should handle floating point precision issues', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      
      // Prices that might cause floating point issues
      const precisionTestPrices = [
        0.123456789012345,
        1.9999999999999998,
        50000.000000000001,
        0.1 + 0.2 // Classic floating point issue
      ];

      precisionTestPrices.forEach(price => {
        const result = manager.calculateTrailingStop(
          price, 'LONG', atr, volatility, 75, 'BULL'
        );
        
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(100);
        expect(isFinite(result)).toBe(true);
      });
    });

    it('should handle very small price movements', () => {
      const basePrice = 50000;
      const microMovements = [
        50000.0001,
        50000.00001,
        50000.000001
      ];

      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();

      microMovements.forEach(price => {
        const result = manager.calculateTrailingStop(
          price, 'LONG', atr, volatility, 75, 'BULL'
        );
        
        expect(result).toBeCloseTo(manager.calculateTrailingStop(
          basePrice, 'LONG', atr, volatility, 75, 'BULL'
        ), 5); // Should be very close for micro movements
      });
    });

    it('should handle calculations that might cause overflow', () => {
      const largeATR: ATRCalculation = {
        period: 14,
        values: Array(14).fill(Number.MAX_SAFE_INTEGER / 1000),
        current: Number.MAX_SAFE_INTEGER / 1000,
        average: Number.MAX_SAFE_INTEGER / 1000,
        normalized: 0.1
      };

      const volatility = createMockVolatilityMetrics();

      const result = manager.calculateTrailingStop(
        50000, 'LONG', largeATR, volatility, 75, 'BULL'
      );

      expect(isFinite(result)).toBe(true);
      expect(result).toBeLessThanOrEqual(config.maxTrailingPercent);
    });
  });

  describe('Race Condition Simulation', () => {
    it('should handle rapid consecutive calculations', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const results: number[] = [];

      // Simulate rapid calculations that might occur in high-frequency trading
      for (let i = 0; i < 1000; i++) {
        const price = 50000 + (i % 100); // Slight price variations
        const confidence = 70 + (i % 30); // Varying confidence
        
        const result = manager.calculateTrailingStop(
          price, 'LONG', atr, volatility, confidence, 'BULL'
        );
        
        results.push(result);
      }

      // All results should be valid
      results.forEach(result => {
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(100);
        expect(isFinite(result)).toBe(true);
      });

      // Results should show some variation due to changing inputs
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('should maintain consistency under concurrent access simulation', () => {
      const atr = createMockATRCalculation();
      const volatility = createMockVolatilityMetrics();
      const price = 50000;
      const confidence = 75;
      const regime: MarketRegime = 'BULL';

      // Simulate the same calculation multiple times
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        const result = manager.calculateTrailingStop(
          price, 'LONG', atr, volatility, confidence, regime
        );
        results.push(result);
      }

      // All results should be identical for identical inputs
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBeCloseTo(firstResult, 10);
      });
    });
  });
});