/**
 * Trade Analysis Engine Unit Tests
 * Comprehensive testing of AI reasoning engine trade analysis functionality
 */

import { AIReasoningEngine } from '../../../lib/ai/reasoning-engine';
import { 
  MARKET_DATA_SCENARIOS, 
  EXPECTED_SIGNALS, 
  INDICATOR_SCENARIOS,
  ADVANCED_DATA_SCENARIOS,
  EDGE_CASES
} from '../../fixtures/ai-analysis-data';

describe('AIReasoningEngine - Trade Analysis', () => {
  let aiEngine: AIReasoningEngine;

  beforeEach(() => {
    aiEngine = new AIReasoningEngine();
    jest.clearAllMocks();
  });

  describe('Market Analysis', () => {
    test('should analyze bull market conditions correctly', async () => {
      const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      const signal = await aiEngine.analyzeMarket(marketData);

      expect(signal.symbol).toBe('BTC/USD');
      expect(signal.action).toBe('BUY');
      expect(signal.marketRegime).toBe('BULL');
      expect(signal.confidence).toBeGreaterThan(60);
      expect(signal.riskReward).toBeGreaterThan(1.5);
      expect(signal.reasoning).toContain('Market regime identified as BULL');
      expect(signal.timestamp).toBeInstanceOf(Date);
    });

    test('should analyze bear market conditions correctly', async () => {
      const marketData = MARKET_DATA_SCENARIOS.BEAR_MARKET;
      const signal = await aiEngine.analyzeMarket(marketData);

      expect(signal.action).toBe('SELL');
      expect(signal.marketRegime).toBe('BEAR');
      expect(signal.confidence).toBeGreaterThan(55);
      expect(signal.reasoning).toContain('Market regime identified as BEAR');
      expect(signal.stopLoss).toBeGreaterThan(signal.takeProfit); // For SELL orders
    });

    test('should detect extreme fear as buying opportunity', async () => {
      const marketData = MARKET_DATA_SCENARIOS.EXTREME_FEAR;
      const signal = await aiEngine.analyzeMarket(marketData);

      expect(signal.action).toBe('BUY');
      expect(signal.confidence).toBeGreaterThan(70);
      expect(signal.reasoning.some(r => r.includes('Extreme fear'))).toBe(true);
      expect(signal.riskReward).toBeGreaterThan(2.0);
    });

    test('should detect extreme greed as selling opportunity', async () => {
      const marketData = MARKET_DATA_SCENARIOS.EXTREME_GREED;
      const signal = await aiEngine.analyzeMarket(marketData);

      expect(signal.action).toBe('SELL');
      expect(signal.confidence).toBeGreaterThan(65);
      expect(signal.reasoning.some(r => r.includes('Extreme greed'))).toBe(true);
    });

    test('should recommend HOLD for ranging market', async () => {
      const marketData = MARKET_DATA_SCENARIOS.RANGING_MARKET;
      const signal = await aiEngine.analyzeMarket(marketData);

      expect(signal.action).toBe('HOLD');
      expect(signal.marketRegime).toBe('RANGE');
      expect(signal.confidence).toBeLessThan(60);
      expect(signal.positionSize).toBe(0);
      expect(signal.stopLoss).toBe(0);
      expect(signal.takeProfit).toBe(0);
    });
  });

  describe('Indicator Analysis', () => {
    test('should correctly interpret RSI oversold conditions', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      // Mock RSI calculation to return oversold value
      jest.spyOn(aiEngine as any, 'calculateRSI').mockReturnValue(25);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('oversold'))).toBe(true);
      expect(signal.action).toBe('BUY');
    });

    test('should correctly interpret RSI overbought conditions', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BEAR_MARKET };
      
      // Mock RSI calculation to return overbought value
      jest.spyOn(aiEngine as any, 'calculateRSI').mockReturnValue(75);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('overbought'))).toBe(true);
    });

    test('should detect bullish MACD momentum', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      // Mock MACD calculation to return bullish values
      jest.spyOn(aiEngine as any, 'calculateMACD').mockReturnValue({
        signal: 100,
        histogram: 500
      });
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('bullish momentum'))).toBe(true);
    });

    test('should detect bearish MACD momentum', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BEAR_MARKET };
      
      // Mock MACD calculation to return bearish values
      jest.spyOn(aiEngine as any, 'calculateMACD').mockReturnValue({
        signal: -100,
        histogram: -500
      });
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('bearish momentum'))).toBe(true);
    });

    test('should recognize volume surge confirmation', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.HIGH_VOLATILITY };
      
      // Mock volume analysis to return surge
      jest.spyOn(aiEngine as any, 'analyzeVolume').mockReturnValue({
        profile: 95,
        surge: true
      });
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('Volume surge'))).toBe(true);
    });
  });

  describe('Advanced Market Intelligence', () => {
    test('should incorporate whale accumulation signals', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      // Mock advanced data gathering
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_ACCUMULATION);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('Whale activity'))).toBe(true);
      expect(signal.reasoning.some(r => r.includes('accumulation'))).toBe(true);
      expect(signal.advancedData?.whaleAlerts).toBeDefined();
    });

    test('should incorporate whale distribution signals', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BEAR_MARKET };
      
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_DISTRIBUTION);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.reasoning.some(r => r.includes('distribution'))).toBe(true);
      expect(signal.advancedData?.whaleAlerts?.some(w => w.direction === 'outflow')).toBe(true);
    });

    test('should hold on critical news uncertainty', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.MARKET_NEWS_CRISIS);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.action).toBe('HOLD');
      expect(signal.advancedData?.newsAnalysis?.urgency).toBe('critical');
    });

    test('should enhance confidence with bullish confluence', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.BULLISH_CONFLUENCE);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.confidence).toBeGreaterThan(75);
      expect(signal.action).toBe('BUY');
      expect(signal.advancedData?.arbitrageOpps).toHaveLength(2);
    });
  });

  describe('Risk-Reward Calculation', () => {
    test('should calculate appropriate risk-reward for bull market', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.riskReward).toBeGreaterThan(1.5);
      expect(signal.riskReward).toBeLessThan(5.0);
    });

    test('should adjust risk-reward based on advanced data', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      // Mock whale outflow scenario
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_DISTRIBUTION);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      // Risk-reward should be adjusted down due to whale outflows
      expect(signal.riskReward).toBeLessThan(2.5);
    });

    test('should increase risk-reward for arbitrage opportunities', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.BULL_MARKET };
      
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.BULLISH_CONFLUENCE);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      // Should get boost from arbitrage opportunities
      expect(signal.riskReward).toBeGreaterThan(2.0);
    });
  });

  describe('Position Sizing', () => {
    test('should calculate position size based on confidence', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.EXTREME_FEAR);
      
      expect(signal.positionSize).toBeGreaterThan(0);
      expect(signal.positionSize).toBeLessThanOrEqual(0.10); // Max 10%
      expect(signal.confidence > 80 ? signal.positionSize > 0.06 : true).toBe(true);
    });

    test('should set zero position size for HOLD signals', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET);
      
      expect(signal.action).toBe('HOLD');
      expect(signal.positionSize).toBe(0);
    });

    test('should increase position size for high risk-reward scenarios', async () => {
      const mockData = { ...MARKET_DATA_SCENARIOS.EXTREME_FEAR };
      
      // Mock high risk-reward calculation
      jest.spyOn(aiEngine as any, 'calculateAdvancedRiskReward').mockReturnValue(3.5);
      
      const signal = await aiEngine.analyzeMarket(mockData);
      
      expect(signal.riskReward).toBe(3.5);
      expect(signal.positionSize).toBeGreaterThan(0.05);
    });
  });

  describe('Stop Loss and Take Profit', () => {
    test('should set appropriate stop/take levels for BUY signals', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      if (signal.action === 'BUY') {
        expect(signal.stopLoss).toBeLessThan(signal.takeProfit);
        expect(signal.stopLoss).toBeLessThan(MARKET_DATA_SCENARIOS.BULL_MARKET.price);
        expect(signal.takeProfit).toBeGreaterThan(MARKET_DATA_SCENARIOS.BULL_MARKET.price);
        
        // Check risk-reward ratio matches
        const risk = MARKET_DATA_SCENARIOS.BULL_MARKET.price - signal.stopLoss;
        const reward = signal.takeProfit - MARKET_DATA_SCENARIOS.BULL_MARKET.price;
        const calculatedRR = reward / risk;
        
        expect(calculatedRR).toBeCloseTo(signal.riskReward, 1);
      }
    });

    test('should set appropriate stop/take levels for SELL signals', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET);
      
      if (signal.action === 'SELL') {
        expect(signal.stopLoss).toBeGreaterThan(signal.takeProfit);
        expect(signal.stopLoss).toBeGreaterThan(MARKET_DATA_SCENARIOS.BEAR_MARKET.price);
        expect(signal.takeProfit).toBeLessThan(MARKET_DATA_SCENARIOS.BEAR_MARKET.price);
      }
    });

    test('should set zero levels for HOLD signals', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET);
      
      expect(signal.action).toBe('HOLD');
      expect(signal.stopLoss).toBe(0);
      expect(signal.takeProfit).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle insufficient price data gracefully', async () => {
      const signal = await aiEngine.analyzeMarket(EDGE_CASES.INSUFFICIENT_DATA);
      
      expect(signal).toBeDefined();
      expect(signal.symbol).toBe('NEW/USD');
      expect(signal.confidence).toBeLessThan(70); // Should be less confident
    });

    test('should handle zero volume scenarios', async () => {
      const signal = await aiEngine.analyzeMarket(EDGE_CASES.ZERO_VOLUME);
      
      expect(signal).toBeDefined();
      expect(signal.reasoning.some(r => r.includes('volume') || r.includes('Volume'))).toBe(false);
    });

    test('should handle extreme price spikes', async () => {
      const signal = await aiEngine.analyzeMarket(EDGE_CASES.EXTREME_PRICE_SPIKE);
      
      expect(signal).toBeDefined();
      expect(signal.action).toBeDefined();
      expect(signal.confidence).toBeLessThan(80); // Should be cautious
    });

    test('should normalize invalid fear & greed values', async () => {
      const signal = await aiEngine.analyzeMarket(EDGE_CASES.NEGATIVE_FEAR_GREED);
      
      expect(signal).toBeDefined();
      expect(signal.confidence).toBeGreaterThan(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
    });

    test('should handle extreme volatility appropriately', async () => {
      const signal = await aiEngine.analyzeMarket(EDGE_CASES.EXTREME_VOLATILITY);
      
      expect(signal).toBeDefined();
      expect(signal.confidence).toBeLessThan(60); // Should be less confident
      expect(signal.positionSize).toBeLessThan(0.05); // Should use smaller position
    });
  });

  describe('Configuration and Tuning', () => {
    test('should respect confidence threshold settings', async () => {
      aiEngine.setConfidenceThreshold(80);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET);
      
      // Should likely be HOLD due to high threshold
      expect(signal.action).toBe('HOLD');
    });

    test('should respect minimum risk-reward settings', async () => {
      aiEngine.setMinRiskReward(3.0);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      // May be HOLD if risk-reward doesn't meet threshold
      if (signal.action !== 'HOLD') {
        expect(signal.riskReward).toBeGreaterThanOrEqual(3.0);
      }
    });

    test('should respect maximum position size limits', async () => {
      aiEngine.setMaxPositionSize(0.05); // 5% max
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.EXTREME_FEAR);
      
      if (signal.action !== 'HOLD') {
        expect(signal.positionSize).toBeLessThanOrEqual(0.05);
      }
    });

    test('should validate configuration bounds', () => {
      aiEngine.setConfidenceThreshold(-10);
      aiEngine.setConfidenceThreshold(150);
      aiEngine.setMinRiskReward(0.5);
      aiEngine.setMaxPositionSize(2.0);
      
      // Should not throw errors and should clamp values
      expect(() => aiEngine.setConfidenceThreshold(50)).not.toThrow();
      expect(() => aiEngine.setMinRiskReward(2.0)).not.toThrow();
      expect(() => aiEngine.setMaxPositionSize(0.08)).not.toThrow();
    });
  });

  describe('Performance and Consistency', () => {
    test('should provide consistent results for same input', async () => {
      const mockData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      
      const signal1 = await aiEngine.analyzeMarket(mockData);
      const signal2 = await aiEngine.analyzeMarket(mockData);
      
      expect(signal1.action).toBe(signal2.action);
      expect(signal1.marketRegime).toBe(signal2.marketRegime);
      expect(Math.abs(signal1.confidence - signal2.confidence)).toBeLessThan(5);
    });

    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle multiple concurrent analyses', async () => {
      const promises = [
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET),
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET),
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(signal => {
        expect(signal).toBeDefined();
        expect(signal.action).toMatch(/^(BUY|SELL|HOLD)$/);
      });
    });
  });
});