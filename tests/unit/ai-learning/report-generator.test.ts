/**
 * Report Generator Unit Tests
 * Testing AI engine's report generation and reasoning capabilities
 */

import { AIReasoningEngine, TradingSignal } from '../../../lib/ai/reasoning-engine';
import { 
  MARKET_DATA_SCENARIOS,
  SAMPLE_TRADING_SIGNALS,
  ADVANCED_DATA_SCENARIOS
} from '../../fixtures/ai-analysis-data';

describe('AIReasoningEngine - Report Generator', () => {
  let aiEngine: AIReasoningEngine;

  beforeEach(() => {
    aiEngine = new AIReasoningEngine();
    jest.clearAllMocks();
  });

  describe('Reasoning Chain Generation', () => {
    test('should generate comprehensive reasoning for bull market', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning).toBeInstanceOf(Array);
      expect(signal.reasoning.length).toBeGreaterThan(3);
      expect(signal.reasoning.some(r => r.includes('Market regime'))).toBe(true);
      expect(signal.reasoning.some(r => r.includes('RSI'))).toBe(true);
      expect(signal.reasoning.some(r => r.includes('MACD'))).toBe(true);
      expect(signal.reasoning.some(r => r.includes('Risk-reward'))).toBe(true);
    });

    test('should generate appropriate reasoning for bear market', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET);
      
      expect(signal.reasoning).toContain('Market regime identified as BEAR');
      expect(signal.reasoning.some(r => r.includes('bearish') || r.includes('negative'))).toBe(true);
      expect(signal.reasoning.length).toBeGreaterThan(2);
    });

    test('should include advanced market intelligence in reasoning', async () => {
      // Mock advanced data gathering
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_ACCUMULATION);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning.some(r => r.includes('Whale activity'))).toBe(true);
      expect(signal.reasoning.some(r => r.includes('accumulation'))).toBe(true);
      expect(signal.reasoning.some(r => r.includes('Market-moving news') || r.includes('options flow'))).toBe(true);
    });

    test('should provide specific RSI reasoning', async () => {
      // Mock oversold RSI
      jest.spyOn(aiEngine as any, 'calculateRSI').mockReturnValue(25);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning.some(r => r.includes('RSI at 25.0') && r.includes('oversold'))).toBe(true);
    });

    test('should provide specific MACD reasoning', async () => {
      // Mock bullish MACD
      jest.spyOn(aiEngine as any, 'calculateMACD').mockReturnValue({
        signal: 100,
        histogram: 500
      });
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning.some(r => r.includes('MACD histogram positive') && r.includes('bullish momentum'))).toBe(true);
    });

    test('should include volume analysis in reasoning', async () => {
      // Mock volume surge
      jest.spyOn(aiEngine as any, 'analyzeVolume').mockReturnValue({
        profile: 95,
        surge: true
      });
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.HIGH_VOLATILITY);
      
      expect(signal.reasoning.some(r => r.includes('Volume surge') && r.includes('confirming'))).toBe(true);
    });

    test('should include sentiment analysis in reasoning', async () => {
      const extremeFearSignal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.EXTREME_FEAR);
      const extremeGreedSignal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.EXTREME_GREED);
      
      expect(extremeFearSignal.reasoning.some(r => r.includes('Extreme fear'))).toBe(true);
      expect(extremeGreedSignal.reasoning.some(r => r.includes('Extreme greed'))).toBe(true);
    });
  });

  describe('Enhanced Reasoning with Advanced Data', () => {
    test('should incorporate whale alert analysis', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_DISTRIBUTION);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET);
      
      expect(signal.reasoning.some(r => 
        r.includes('Whale activity') && r.includes('distribution')
      )).toBe(true);
    });

    test('should incorporate news sentiment analysis', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.MARKET_NEWS_CRISIS);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET);
      
      expect(signal.reasoning.some(r => r.includes('Market-moving news'))).toBe(true);
    });

    test('should incorporate options flow analysis', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.BULLISH_CONFLUENCE);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning.some(r => r.includes('options flow'))).toBe(true);
    });

    test('should incorporate arbitrage opportunities', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.BULLISH_CONFLUENCE);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning.some(r => r.includes('arbitrage opportunities'))).toBe(true);
    });
  });

  describe('Signal Completeness and Structure', () => {
    test('should generate complete trading signal structure', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      // Check all required fields are present
      expect(signal).toHaveProperty('symbol');
      expect(signal).toHaveProperty('action');
      expect(signal).toHaveProperty('confidence');
      expect(signal).toHaveProperty('reasoning');
      expect(signal).toHaveProperty('riskReward');
      expect(signal).toHaveProperty('positionSize');
      expect(signal).toHaveProperty('stopLoss');
      expect(signal).toHaveProperty('takeProfit');
      expect(signal).toHaveProperty('timestamp');
      expect(signal).toHaveProperty('marketRegime');
      expect(signal).toHaveProperty('indicators');
      expect(signal).toHaveProperty('advancedData');
    });

    test('should have valid field types and ranges', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(typeof signal.symbol).toBe('string');
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal.action);
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
      expect(signal.riskReward).toBeGreaterThan(0);
      expect(signal.positionSize).toBeGreaterThanOrEqual(0);
      expect(signal.positionSize).toBeLessThanOrEqual(1);
      expect(signal.timestamp).toBeInstanceOf(Date);
      expect(['BULL', 'BEAR', 'RANGE']).toContain(signal.marketRegime);
    });

    test('should include indicators with proper structure', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.indicators).toHaveProperty('rsi');
      expect(signal.indicators).toHaveProperty('macd');
      expect(signal.indicators).toHaveProperty('volume');
      expect(signal.indicators).toHaveProperty('sentiment');
      
      expect(typeof signal.indicators.rsi).toBe('number');
      expect(signal.indicators.macd).toHaveProperty('signal');
      expect(signal.indicators.macd).toHaveProperty('histogram');
      expect(signal.indicators.volume).toHaveProperty('profile');
      expect(signal.indicators.volume).toHaveProperty('surge');
      expect(signal.indicators.sentiment).toHaveProperty('fearGreed');
    });

    test('should populate advanced data when available', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.BULLISH_CONFLUENCE);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.advancedData).toBeDefined();
      expect(signal.advancedData?.whaleAlerts).toBeDefined();
      expect(signal.advancedData?.newsAnalysis).toBeDefined();
      expect(signal.advancedData?.optionsFlow).toBeDefined();
      expect(signal.advancedData?.arbitrageOpps).toBeDefined();
    });
  });

  describe('Report Quality and Consistency', () => {
    test('should generate consistent reasoning structure', async () => {
      const signals = await Promise.all([
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET),
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET),
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET)
      ]);
      
      signals.forEach(signal => {
        expect(signal.reasoning.length).toBeGreaterThan(2);
        expect(signal.reasoning[0]).toMatch(/Market regime identified as/);
        expect(signal.reasoning.some(r => r.includes('Risk-reward'))).toBe(true);
      });
    });

    test('should maintain reasoning quality across different scenarios', async () => {
      const scenarios = [
        MARKET_DATA_SCENARIOS.BULL_MARKET,
        MARKET_DATA_SCENARIOS.BEAR_MARKET,
        MARKET_DATA_SCENARIOS.EXTREME_FEAR,
        MARKET_DATA_SCENARIOS.EXTREME_GREED,
        MARKET_DATA_SCENARIOS.HIGH_VOLATILITY
      ];
      
      for (const scenario of scenarios) {
        const signal = await aiEngine.analyzeMarket(scenario);
        
        expect(signal.reasoning.length).toBeGreaterThan(3);
        expect(signal.reasoning.every(r => typeof r === 'string' && r.length > 10)).toBe(true);
        expect(signal.reasoning.some(r => r.includes('Market regime'))).toBe(true);
      }
    });

    test('should provide actionable insights in reasoning', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.EXTREME_FEAR);
      
      // Should explain why the action was chosen
      const actionRelevantReasoning = signal.reasoning.filter(r => 
        r.toLowerCase().includes(signal.action.toLowerCase()) ||
        r.includes('opportunity') ||
        r.includes('signal') ||
        r.includes('conditions')
      );
      
      expect(actionRelevantReasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Reasoning Chain Edge Cases', () => {
    test('should handle empty advanced data gracefully', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue({});
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal.reasoning).toBeDefined();
      expect(signal.reasoning.length).toBeGreaterThan(2);
      // Should still have basic reasoning even without advanced data
      expect(signal.reasoning.some(r => r.includes('Market regime'))).toBe(true);
    });

    test('should handle advanced data gathering errors', async () => {
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockRejectedValue(new Error('API Error'));
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      expect(signal).toBeDefined();
      expect(signal.reasoning).toBeDefined();
      expect(signal.reasoning.length).toBeGreaterThan(2);
    });

    test('should provide reasoning for HOLD decisions', async () => {
      // Force a HOLD decision
      aiEngine.setConfidenceThreshold(90);
      
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET);
      
      expect(signal.action).toBe('HOLD');
      expect(signal.reasoning).toBeDefined();
      expect(signal.reasoning.some(r => 
        r.includes('confidence') || 
        r.includes('threshold') || 
        r.includes('range') ||
        r.includes('mixed')
      )).toBe(true);
    });
  });

  describe('Report Formatting and Readability', () => {
    test('should generate human-readable reasoning statements', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      signal.reasoning.forEach(statement => {
        expect(statement).toMatch(/^[A-Z]/); // Should start with capital letter
        expect(statement.length).toBeGreaterThan(10); // Should be meaningful
        expect(statement.length).toBeLessThan(200); // Should be concise
        expect(statement).not.toMatch(/undefined|null|NaN/); // No undefined values
      });
    });

    test('should use consistent terminology', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      // Check for consistent use of technical terms
      const terminology = [
        'Market regime',
        'RSI',
        'MACD',
        'Risk-reward',
        'bullish',
        'bearish',
        'oversold',
        'overbought'
      ];
      
      const reasoningText = signal.reasoning.join(' ');
      const usedTerms = terminology.filter(term => 
        reasoningText.toLowerCase().includes(term.toLowerCase())
      );
      
      expect(usedTerms.length).toBeGreaterThan(3); // Should use multiple technical terms
    });

    test('should include numerical values in reasoning', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.EXTREME_FEAR);
      
      const numericalReasons = signal.reasoning.filter(r => 
        /\d+\.?\d*/.test(r) // Contains numbers
      );
      
      expect(numericalReasons.length).toBeGreaterThan(1);
    });
  });

  describe('Signal Validation and Integrity', () => {
    test('should validate signal consistency', async () => {
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      if (signal.action === 'BUY') {
        expect(signal.stopLoss).toBeLessThan(MARKET_DATA_SCENARIOS.BULL_MARKET.price);
        expect(signal.takeProfit).toBeGreaterThan(MARKET_DATA_SCENARIOS.BULL_MARKET.price);
        expect(signal.positionSize).toBeGreaterThan(0);
      } else if (signal.action === 'SELL') {
        expect(signal.stopLoss).toBeGreaterThan(MARKET_DATA_SCENARIOS.BULL_MARKET.price);
        expect(signal.takeProfit).toBeLessThan(MARKET_DATA_SCENARIOS.BULL_MARKET.price);
        expect(signal.positionSize).toBeGreaterThan(0);
      } else if (signal.action === 'HOLD') {
        expect(signal.positionSize).toBe(0);
        expect(signal.stopLoss).toBe(0);
        expect(signal.takeProfit).toBe(0);
      }
    });

    test('should validate reasoning aligns with action', async () => {
      const bullSignal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      const bearSignal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET);
      
      if (bullSignal.action === 'BUY') {
        expect(bullSignal.reasoning.some(r => 
          r.includes('bullish') || 
          r.includes('oversold') || 
          r.includes('opportunity')
        )).toBe(true);
      }
      
      if (bearSignal.action === 'SELL') {
        expect(bearSignal.reasoning.some(r => 
          r.includes('bearish') || 
          r.includes('overbought') || 
          r.includes('risk')
        )).toBe(true);
      }
    });

    test('should validate timestamp accuracy', async () => {
      const before = new Date();
      const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      const after = new Date();
      
      expect(signal.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(signal.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Report Performance', () => {
    test('should generate reports efficiently', async () => {
      const startTime = Date.now();
      
      await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle concurrent report generation', async () => {
      const promises = [
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET),
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BEAR_MARKET),
        aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.RANGING_MARKET)
      ];
      
      const signals = await Promise.all(promises);
      
      expect(signals).toHaveLength(3);
      signals.forEach(signal => {
        expect(signal.reasoning).toBeDefined();
        expect(signal.reasoning.length).toBeGreaterThan(2);
      });
    });

    test('should maintain report quality under load', async () => {
      const reports = [];
      
      // Generate multiple reports rapidly
      for (let i = 0; i < 10; i++) {
        const signal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
        reports.push(signal);
      }
      
      // All reports should maintain quality
      reports.forEach(signal => {
        expect(signal.reasoning.length).toBeGreaterThan(3);
        expect(signal.confidence).toBeGreaterThan(0);
        expect(signal.riskReward).toBeGreaterThan(0);
      });
    });
  });
});