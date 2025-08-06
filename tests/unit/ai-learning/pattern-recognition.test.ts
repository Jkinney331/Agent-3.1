/**
 * Pattern Recognition Unit Tests
 * Testing AI engine's ability to detect market patterns and technical formations
 */

import { AIReasoningEngine } from '../../../lib/ai/reasoning-engine';
import { 
  PATTERN_TEST_DATA,
  MARKET_DATA_SCENARIOS,
  PERFORMANCE_TEST_DATA 
} from '../../fixtures/ai-analysis-data';

describe('AIReasoningEngine - Pattern Recognition', () => {
  let aiEngine: AIReasoningEngine;

  beforeEach(() => {
    aiEngine = new AIReasoningEngine();
    jest.clearAllMocks();
  });

  describe('Technical Indicator Calculations', () => {
    describe('RSI Calculation', () => {
      test('should calculate RSI correctly for trending up market', () => {
        const upTrendPrices = [100, 102, 105, 108, 110, 112, 115, 118, 120, 122, 125, 128, 130, 132, 135];
        const rsi = (aiEngine as any).calculateRSI(upTrendPrices);
        
        expect(rsi).toBeGreaterThan(50);
        expect(rsi).toBeLessThan(100);
        expect(typeof rsi).toBe('number');
      });

      test('should calculate RSI correctly for trending down market', () => {
        const downTrendPrices = [135, 132, 130, 128, 125, 122, 120, 118, 115, 112, 110, 108, 105, 102, 100];
        const rsi = (aiEngine as any).calculateRSI(downTrendPrices);
        
        expect(rsi).toBeLessThan(50);
        expect(rsi).toBeGreaterThan(0);
      });

      test('should return 50 for insufficient data', () => {
        const shortPrices = [100, 101, 102];
        const rsi = (aiEngine as any).calculateRSI(shortPrices);
        
        expect(rsi).toBe(50);
      });

      test('should handle extreme scenarios', () => {
        // All prices going up
        const extremeUp = Array.from({ length: 20 }, (_, i) => 100 + i * 5);
        const rsiUp = (aiEngine as any).calculateRSI(extremeUp);
        expect(rsiUp).toBeGreaterThan(80);
        
        // All prices going down
        const extremeDown = Array.from({ length: 20 }, (_, i) => 200 - i * 5);
        const rsiDown = (aiEngine as any).calculateRSI(extremeDown);
        expect(rsiDown).toBeLessThan(20);
      });

      test('should handle flat prices', () => {
        const flatPrices = Array(20).fill(100);
        const rsi = (aiEngine as any).calculateRSI(flatPrices);
        
        expect(rsi).toBe(100); // No losses, so RS approaches infinity
      });
    });

    describe('MACD Calculation', () => {
      test('should calculate MACD for trending market', () => {
        const trendingPrices = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
        const macd = (aiEngine as any).calculateMACD(trendingPrices);
        
        expect(macd).toHaveProperty('signal');
        expect(macd).toHaveProperty('histogram');
        expect(typeof macd.signal).toBe('number');
        expect(typeof macd.histogram).toBe('number');
        
        // In uptrend, MACD line should generally be positive
        expect(macd.histogram).toBeGreaterThan(0);
      });

      test('should return zero values for insufficient data', () => {
        const shortPrices = [100, 101, 102];
        const macd = (aiEngine as any).calculateMACD(shortPrices);
        
        expect(macd.signal).toBe(0);
        expect(macd.histogram).toBe(0);
      });

      test('should calculate different values for different trends', () => {
        const upTrend = Array.from({ length: 30 }, (_, i) => 100 + i * 3);
        const downTrend = Array.from({ length: 30 }, (_, i) => 200 - i * 3);
        
        const macdUp = (aiEngine as any).calculateMACD(upTrend);
        const macdDown = (aiEngine as any).calculateMACD(downTrend);
        
        expect(macdUp.histogram).toBeGreaterThan(macdDown.histogram);
      });
    });

    describe('EMA Calculation', () => {
      test('should calculate EMA correctly', () => {
        const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120];
        const ema12 = (aiEngine as any).calculateEMA(prices, 12);
        const ema26 = (aiEngine as any).calculateEMA(prices, 26);
        
        expect(typeof ema12).toBe('number');
        expect(typeof ema26).toBe('number');
        expect(ema12).toBeGreaterThan(100);
        expect(ema12).toBeLessThan(120);
      });

      test('should return last price for insufficient data', () => {
        const prices = [100, 102];
        const ema12 = (aiEngine as any).calculateEMA(prices, 12);
        
        expect(ema12).toBe(102);
      });

      test('should be more responsive than SMA', () => {
        const prices = [100, 100, 100, 100, 120]; // Sudden spike
        const ema = (aiEngine as any).calculateEMA(prices, 4);
        const sma = prices.slice(-4).reduce((sum, p) => sum + p, 0) / 4;
        
        expect(ema).toBeGreaterThan(sma); // EMA reacts faster to new data
      });
    });
  });

  describe('Pattern Detection', () => {
    test('should detect double bottom pattern', async () => {
      const doubleBottomData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: PATTERN_TEST_DATA.DOUBLE_BOTTOM
      };
      
      const signal = await aiEngine.analyzeMarket(doubleBottomData);
      
      // Double bottom is typically bullish
      expect(signal.action).toBe('BUY');
      expect(signal.confidence).toBeGreaterThan(60);
    });

    test('should detect head and shoulders pattern', async () => {
      const headShouldersData = {
        ...MARKET_DATA_SCENARIOS.BEAR_MARKET,
        prices: PATTERN_TEST_DATA.HEAD_SHOULDERS
      };
      
      const signal = await aiEngine.analyzeMarket(headShouldersData);
      
      // Head and shoulders is typically bearish
      expect(signal.marketRegime).toBe('BEAR');
    });

    test('should detect ascending triangle pattern', async () => {
      const ascendingTriangleData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: PATTERN_TEST_DATA.ASCENDING_TRIANGLE
      };
      
      const signal = await aiEngine.analyzeMarket(ascendingTriangleData);
      
      // Ascending triangle is typically bullish
      expect(signal.action).toBe('BUY');
    });

    test('should detect bull flag pattern', async () => {
      const bullFlagData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: PATTERN_TEST_DATA.BULL_FLAG
      };
      
      const signal = await aiEngine.analyzeMarket(bullFlagData);
      
      expect(signal.action).toBe('BUY');
      expect(signal.riskReward).toBeGreaterThan(1.5);
    });

    test('should detect bear flag pattern', async () => {
      const bearFlagData = {
        ...MARKET_DATA_SCENARIOS.BEAR_MARKET,
        prices: PATTERN_TEST_DATA.BEAR_FLAG
      };
      
      const signal = await aiEngine.analyzeMarket(bearFlagData);
      
      expect(signal.action).toBe('SELL');
      expect(signal.marketRegime).toBe('BEAR');
    });
  });

  describe('Market Regime Detection', () => {
    test('should detect bull market regime correctly', async () => {
      const bullishPrices = Array.from({ length: 10 }, (_, i) => 100 + i * 5);
      const bullData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: bullishPrices,
        price: bullishPrices[bullishPrices.length - 1]
      };
      
      const regime = await (aiEngine as any).detectMarketRegime(bullData);
      
      expect(regime).toBe('BULL');
    });

    test('should detect bear market regime correctly', async () => {
      const bearishPrices = Array.from({ length: 10 }, (_, i) => 200 - i * 8);
      const bearData = {
        ...MARKET_DATA_SCENARIOS.BEAR_MARKET,
        prices: bearishPrices,
        price: bearishPrices[bearishPrices.length - 1]
      };
      
      const regime = await (aiEngine as any).detectMarketRegime(bearData);
      
      expect(regime).toBe('BEAR');
    });

    test('should detect range-bound market correctly', async () => {
      const rangePrices = [100, 102, 98, 101, 99, 103, 97, 102, 100, 101];
      const rangeData = {
        ...MARKET_DATA_SCENARIOS.RANGING_MARKET,
        prices: rangePrices,
        price: 100
      };
      
      const regime = await (aiEngine as any).detectMarketRegime(rangeData);
      
      expect(regime).toBe('RANGE');
    });

    test('should calculate volatility correctly', () => {
      const lowVolPrices = [100, 100.5, 99.8, 100.2, 99.9];
      const highVolPrices = [100, 105, 95, 110, 90];
      
      const lowVol = (aiEngine as any).calculateVolatility(lowVolPrices);
      const highVol = (aiEngine as any).calculateVolatility(highVolPrices);
      
      expect(highVol).toBeGreaterThan(lowVol);
      expect(lowVol).toBeGreaterThan(0);
    });
  });

  describe('Volume Analysis', () => {
    test('should detect volume surge correctly', () => {
      const highVolume = 5000000; // 5x average
      const normalVolume = 1000000;
      
      const highVolAnalysis = (aiEngine as any).analyzeVolume(highVolume, [100, 105]);
      const normalVolAnalysis = (aiEngine as any).analyzeVolume(normalVolume, [100, 101]);
      
      expect(highVolAnalysis.surge).toBe(true);
      expect(normalVolAnalysis.surge).toBe(false);
      expect(highVolAnalysis.profile).toBeGreaterThan(normalVolAnalysis.profile);
    });

    test('should calculate volume profile accurately', () => {
      const doubleVolume = 2000000;
      const analysis = (aiEngine as any).analyzeVolume(doubleVolume, [100]);
      
      expect(analysis.profile).toBe(100); // 2x average = 100 profile
      expect(analysis.surge).toBe(true); // >2x = surge
    });
  });

  describe('Sentiment Analysis Integration', () => {
    test('should incorporate fear & greed into analysis', async () => {
      const extremeFearData = {
        ...MARKET_DATA_SCENARIOS.EXTREME_FEAR,
        fearGreed: 5
      };
      
      const signal = await aiEngine.analyzeMarket(extremeFearData);
      
      expect(signal.reasoning.some(r => r.toLowerCase().includes('fear'))).toBe(true);
      expect(signal.action).toBe('BUY'); // Contrarian signal
    });

    test('should handle extreme greed appropriately', async () => {
      const extremeGreedData = {
        ...MARKET_DATA_SCENARIOS.EXTREME_GREED,
        fearGreed: 95
      };
      
      const signal = await aiEngine.analyzeMarket(extremeGreedData);
      
      expect(signal.reasoning.some(r => r.toLowerCase().includes('greed'))).toBe(true);
    });

    test('should calculate social sentiment correctly', () => {
      const fearGreed75 = (aiEngine as any).calculateSocialSentiment(75);
      const fearGreed25 = (aiEngine as any).calculateSocialSentiment(25);
      
      expect(typeof fearGreed75).toBe('number');
      expect(typeof fearGreed25).toBe('number');
      expect(Math.abs(fearGreed75 - 75)).toBeLessThan(20); // Some randomness added
    });
  });

  describe('Multi-Timeframe Analysis', () => {
    test('should handle different price history lengths', async () => {
      const shortHistory = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: [100, 105, 110]
      };
      
      const longHistory = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: Array.from({ length: 100 }, (_, i) => 100 + i * 0.5)
      };
      
      const shortSignal = await aiEngine.analyzeMarket(shortHistory);
      const longSignal = await aiEngine.analyzeMarket(longHistory);
      
      expect(shortSignal).toBeDefined();
      expect(longSignal).toBeDefined();
      expect(longSignal.confidence).toBeGreaterThan(shortSignal.confidence);
    });

    test('should provide more confident signals with more data', async () => {
      const minimalData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: [100, 105]
      };
      
      const richData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: Array.from({ length: 50 }, (_, i) => 100 + i * 2)
      };
      
      const minimalSignal = await aiEngine.analyzeMarket(minimalData);
      const richSignal = await aiEngine.analyzeMarket(richData);
      
      expect(richSignal.confidence).toBeGreaterThanOrEqual(minimalSignal.confidence);
    });
  });

  describe('Pattern Recognition Performance', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: PERFORMANCE_TEST_DATA.LARGE_PRICE_HISTORY
      };
      
      const startTime = Date.now();
      const signal = await aiEngine.analyzeMarket(largeDataset);
      const endTime = Date.now();
      
      expect(signal).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should maintain accuracy with noisy data', async () => {
      // Add noise to a clear bull trend
      const noisyBullTrend = Array.from({ length: 50 }, (_, i) => {
        const trend = 100 + i * 2;
        const noise = (Math.random() - 0.5) * 10;
        return trend + noise;
      });
      
      const noisyData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: noisyBullTrend,
        price: noisyBullTrend[noisyBullTrend.length - 1]
      };
      
      const signal = await aiEngine.analyzeMarket(noisyData);
      
      // Should still detect the underlying bull trend
      expect(signal.marketRegime).toBe('BULL');
      expect(signal.action).toBe('BUY');
    });

    test('should handle real-time price updates', () => {
      const prices = [100, 101, 102, 103, 104];
      
      // Simulate real-time updates
      for (let i = 1; i <= prices.length; i++) {
        const currentPrices = prices.slice(0, i);
        const rsi = (aiEngine as any).calculateRSI(currentPrices);
        
        expect(typeof rsi).toBe('number');
        expect(rsi).toBeGreaterThanOrEqual(0);
        expect(rsi).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Pattern Validation and Confidence', () => {
    test('should provide higher confidence for clear patterns', async () => {
      const clearBullTrend = Array.from({ length: 20 }, (_, i) => 100 + i * 5);
      const weakBullTrend = [100, 101, 100.5, 102, 101.5, 103];
      
      const clearData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: clearBullTrend,
        price: clearBullTrend[clearBullTrend.length - 1]
      };
      
      const weakData = {
        ...MARKET_DATA_SCENARIOS.BULL_MARKET,
        prices: weakBullTrend,
        price: weakBullTrend[weakBullTrend.length - 1]
      };
      
      const clearSignal = await aiEngine.analyzeMarket(clearData);
      const weakSignal = await aiEngine.analyzeMarket(weakData);
      
      expect(clearSignal.confidence).toBeGreaterThan(weakSignal.confidence);
    });

    test('should adjust confidence based on pattern strength', async () => {
      const strongPattern = {
        ...MARKET_DATA_SCENARIOS.EXTREME_FEAR,
        volume: 10000000 // Very high volume
      };
      
      const weakPattern = {
        ...MARKET_DATA_SCENARIOS.EXTREME_FEAR,
        volume: 100000 // Low volume
      };
      
      const strongSignal = await aiEngine.analyzeMarket(strongPattern);
      const weakSignal = await aiEngine.analyzeMarket(weakPattern);
      
      expect(strongSignal.confidence).toBeGreaterThan(weakSignal.confidence);
    });
  });

  describe('Cross-Validation of Patterns', () => {
    test('should require multiple confirming indicators', async () => {
      // Mock conflicting indicators
      jest.spyOn(aiEngine as any, 'calculateRSI').mockReturnValue(25); // Oversold
      jest.spyOn(aiEngine as any, 'calculateMACD').mockReturnValue({
        signal: -100,
        histogram: -500 // Bearish MACD
      });
      
      const conflictingData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      const signal = await aiEngine.analyzeMarket(conflictingData);
      
      // Should be cautious with conflicting signals
      expect(signal.confidence).toBeLessThan(70);
    });

    test('should boost confidence with confirming indicators', async () => {
      // Mock confirming bullish indicators
      jest.spyOn(aiEngine as any, 'calculateRSI').mockReturnValue(35); // Oversold
      jest.spyOn(aiEngine as any, 'calculateMACD').mockReturnValue({
        signal: 200,
        histogram: 400 // Bullish MACD
      });
      jest.spyOn(aiEngine as any, 'analyzeVolume').mockReturnValue({
        profile: 95,
        surge: true // Volume confirmation
      });
      
      const confirmingData = MARKET_DATA_SCENARIOS.EXTREME_FEAR;
      const signal = await aiEngine.analyzeMarket(confirmingData);
      
      expect(signal.confidence).toBeGreaterThan(75);
      expect(signal.action).toBe('BUY');
    });
  });
});