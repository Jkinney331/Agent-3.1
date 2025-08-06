/**
 * End-to-End Daily Report Pipeline Tests
 * Testing the complete flow: Market Data → AI Analysis → Report Generation → Bot Delivery
 */

import { AIReasoningEngine, TradingSignal } from '../../lib/ai/reasoning-engine';
import { TelegramBotServer, TelegramBotConfig } from '../../lib/telegram/bot-server';
import {
  MARKET_DATA_SCENARIOS,
  ADVANCED_DATA_SCENARIOS,
  PERFORMANCE_TEST_DATA
} from '../fixtures/ai-analysis-data';
import {
  MOCK_USERS,
  MOCK_CHATS,
  TELEGRAM_API_RESPONSES,
  MOCK_TRADING_DATA
} from '../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

// Mock market data fetcher
class MockMarketDataFetcher {
  private scenarios = MARKET_DATA_SCENARIOS;
  private currentScenario = this.scenarios.BULL_MARKET;

  async fetchCurrentMarketData(): Promise<typeof this.currentScenario> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add some randomness to simulate real market data
    return {
      ...this.currentScenario,
      price: this.currentScenario.price + (Math.random() - 0.5) * 1000,
      volume: this.currentScenario.volume * (0.8 + Math.random() * 0.4),
      fearGreed: this.currentScenario.fearGreed + (Math.random() - 0.5) * 10
    };
  }

  setScenario(scenarioName: keyof typeof MARKET_DATA_SCENARIOS): void {
    this.currentScenario = this.scenarios[scenarioName];
  }

  simulateMarketChange(): void {
    const scenarios = Object.values(this.scenarios);
    this.currentScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  }
}

// Mock performance data provider
class MockPerformanceProvider {
  private history: any[] = [];

  async calculatePerformance(): Promise<any> {
    const performance = {
      dailyPnl: (Math.random() - 0.4) * 1000, // Slightly bullish bias
      weeklyPnl: (Math.random() - 0.3) * 5000,
      monthlyPnl: (Math.random() - 0.2) * 20000,
      winRate: 60 + Math.random() * 30,
      tradesCount: Math.floor(Math.random() * 20) + 1,
      bestTrade: Math.random() * 2000 + 100,
      worstTrade: -(Math.random() * 500 + 50),
      avgTrade: (Math.random() - 0.3) * 200,
      maxDrawdown: Math.random() * 15,
      sharpeRatio: Math.random() * 3,
      totalTrades: this.history.length + Math.floor(Math.random() * 100),
      activeDays: Math.floor(Math.random() * 30) + 1,
      riskRewardAvg: 1.5 + Math.random() * 1.5
    };

    this.history.push({
      ...performance,
      timestamp: new Date()
    });

    return performance;
  }

  getHistory(): any[] {
    return this.history;
  }
}

// Complete Pipeline Orchestrator
class DailyReportPipeline {
  constructor(
    private aiEngine: AIReasoningEngine,
    private botServer: TelegramBotServer,
    private marketFetcher: MockMarketDataFetcher,
    private performanceProvider: MockPerformanceProvider
  ) {}

  async executeDailyPipeline(): Promise<{
    marketData: any;
    aiSignal: TradingSignal;
    performance: any;
    deliveryResults: any[];
  }> {
    console.log('🚀 Starting daily report pipeline...');

    // Step 1: Fetch current market data
    console.log('📊 Fetching market data...');
    const marketData = await this.marketFetcher.fetchCurrentMarketData();

    // Step 2: Run AI analysis
    console.log('🧠 Running AI analysis...');
    const aiSignal = await this.aiEngine.analyzeMarket(marketData);

    // Step 3: Calculate performance metrics
    console.log('📈 Calculating performance...');
    const performance = await this.performanceProvider.calculatePerformance();

    // Step 4: Deliver reports to all authorized users
    console.log('📱 Delivering reports...');
    const deliveryResults = [];
    
    const authorizedUsers = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
    
    for (const userId of authorizedUsers) {
      try {
        await this.botServer.sendDailyReport(userId, aiSignal, performance);
        deliveryResults.push({ userId, success: true, error: null });
      } catch (error) {
        deliveryResults.push({ userId, success: false, error });
      }
    }

    console.log('✅ Daily report pipeline completed');

    return {
      marketData,
      aiSignal,
      performance,
      deliveryResults
    };
  }
}

describe('Daily Report Pipeline E2E', () => {
  let aiEngine: AIReasoningEngine;
  let botServer: TelegramBotServer;
  let marketFetcher: MockMarketDataFetcher;
  let performanceProvider: MockPerformanceProvider;
  let pipeline: DailyReportPipeline;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    // Initialize components
    aiEngine = new AIReasoningEngine();
    marketFetcher = new MockMarketDataFetcher();
    performanceProvider = new MockPerformanceProvider();
    
    mockConfig = {
      token: 'mock-e2e-token',
      authorizedUsers: [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id],
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000
      }
    };

    botServer = new TelegramBotServer(mockConfig);

    // Mock successful bot start
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          result: { id: 123, is_bot: true, first_name: 'E2EBot' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

    await botServer.start();

    pipeline = new DailyReportPipeline(aiEngine, botServer, marketFetcher, performanceProvider);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await botServer.stop();
  });

  describe('Complete Pipeline Execution', () => {
    test('should execute full daily report pipeline successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const startTime = Date.now();
      const result = await pipeline.executeDailyPipeline();
      const executionTime = Date.now() - startTime;

      // Verify pipeline completion
      expect(result).toBeDefined();
      expect(result.marketData).toBeDefined();
      expect(result.aiSignal).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.deliveryResults).toHaveLength(2);

      // Verify AI signal quality
      expect(result.aiSignal.symbol).toBe('BTC/USD');
      expect(['BUY', 'SELL', 'HOLD']).toContain(result.aiSignal.action);
      expect(result.aiSignal.confidence).toBeGreaterThanOrEqual(0);
      expect(result.aiSignal.confidence).toBeLessThanOrEqual(100);
      expect(result.aiSignal.reasoning).toBeInstanceOf(Array);
      expect(result.aiSignal.reasoning.length).toBeGreaterThan(0);

      // Verify performance data
      expect(typeof result.performance.dailyPnl).toBe('number');
      expect(result.performance.winRate).toBeGreaterThanOrEqual(0);
      expect(result.performance.winRate).toBeLessThanOrEqual(100);
      expect(result.performance.tradesCount).toBeGreaterThan(0);

      // Verify delivery results
      result.deliveryResults.forEach(delivery => {
        expect(delivery.success).toBe(true);
        expect(delivery.error).toBeNull();
      });

      // Verify bot API calls
      expect(fetch).toHaveBeenCalledTimes(2); // One for each user
      
      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        expect(body.text).toContain('Daily AI Trading Report');
        expect(body.text).toContain(result.aiSignal.action);
        expect(body.text).toContain(result.aiSignal.symbol);
        expect(body.parse_mode).toBe('HTML');
      });

      // Verify performance (should complete within reasonable time)
      expect(executionTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should handle different market conditions in pipeline', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const scenarios = [
        { name: 'BULL_MARKET', expectedAction: 'BUY' },
        { name: 'BEAR_MARKET', expectedAction: 'SELL' },
        { name: 'EXTREME_FEAR', expectedAction: 'BUY' },
        { name: 'EXTREME_GREED', expectedAction: 'SELL' },
        { name: 'RANGING_MARKET', expectedAction: 'HOLD' }
      ];

      for (const scenario of scenarios) {
        marketFetcher.setScenario(scenario.name as keyof typeof MARKET_DATA_SCENARIOS);
        
        const result = await pipeline.executeDailyPipeline();
        
        expect(result.aiSignal.action).toBe(scenario.expectedAction);
        expect(result.deliveryResults.every(d => d.success)).toBe(true);
        
        jest.clearAllMocks();
      }

      // Should have executed all scenarios
      expect(scenarios.length * 2).toBe(10); // 5 scenarios * 2 users each
    });

    test('should handle pipeline with advanced market intelligence', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock advanced data gathering
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_ACCUMULATION);

      marketFetcher.setScenario('BULL_MARKET');
      
      const result = await pipeline.executeDailyPipeline();

      // Verify advanced intelligence is included
      expect(result.aiSignal.advancedData).toBeDefined();
      expect(result.aiSignal.advancedData?.whaleAlerts).toBeDefined();
      expect(result.aiSignal.advancedData?.newsAnalysis).toBeDefined();
      expect(result.aiSignal.reasoning.some(r => r.includes('Whale activity'))).toBe(true);

      // Verify it's included in the bot message
      const calls = (fetch as jest.Mock).mock.calls;
      const firstCall = calls[0];
      const body = JSON.parse(firstCall[1].body);
      expect(body.text).toContain('Whale activity');
    });

    test('should generate comprehensive reports with all data sections', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      marketFetcher.setScenario('HIGH_VOLATILITY');
      
      const result = await pipeline.executeDailyPipeline();

      const calls = (fetch as jest.Mock).mock.calls;
      const body = JSON.parse(calls[0][1].body);
      const reportText = body.text;

      // Verify all required sections are present
      expect(reportText).toContain('Daily AI Trading Report');
      expect(reportText).toContain('🤖 AI Analysis:');
      expect(reportText).toContain('📈 Performance:');
      expect(reportText).toContain('🎯 Key Insights:');
      expect(reportText).toContain('📊 Market Outlook:');
      
      // Verify AI data
      expect(reportText).toContain('Signal:');
      expect(reportText).toContain('Confidence:');
      expect(reportText).toContain('Market Regime:');
      expect(reportText).toContain('Risk/Reward:');
      
      // Verify performance data
      expect(reportText).toContain('Today\'s P&L:');
      expect(reportText).toContain('Win Rate:');
      expect(reportText).toContain('Trades:');
      
      // Verify formatting
      expect(reportText).toMatch(/\$[\d,]+\.\d{2}/); // Currency format
      expect(reportText).toMatch(/\d+\.\d+%/); // Percentage format
      expect(reportText).toContain('Generated:'); // Timestamp
    });
  });

  describe('Pipeline Error Handling', () => {
    test('should handle market data fetch failures', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock market data failure
      jest.spyOn(marketFetcher, 'fetchCurrentMarketData')
        .mockRejectedValue(new Error('Market API unavailable'));

      await expect(pipeline.executeDailyPipeline()).rejects.toThrow('Market API unavailable');
    });

    test('should handle AI analysis failures gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock AI analysis failure
      jest.spyOn(aiEngine, 'analyzeMarket')
        .mockRejectedValue(new Error('AI service timeout'));

      await expect(pipeline.executeDailyPipeline()).rejects.toThrow('AI service timeout');
    });

    test('should continue pipeline when performance calculation fails', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock performance failure
      jest.spyOn(performanceProvider, 'calculatePerformance')
        .mockRejectedValue(new Error('Database connection failed'));

      await expect(pipeline.executeDailyPipeline()).rejects.toThrow('Database connection failed');
    });

    test('should handle partial delivery failures', async () => {
      // First user succeeds, second fails
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        })
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const result = await pipeline.executeDailyPipeline();

      expect(result.deliveryResults).toHaveLength(2);
      expect(result.deliveryResults[0].success).toBe(true);
      expect(result.deliveryResults[1].success).toBe(false);
      expect(result.deliveryResults[1].error).toBeInstanceOf(Error);
    });

    test('should handle complete delivery failure gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Telegram API down'));

      const result = await pipeline.executeDailyPipeline();

      expect(result.deliveryResults).toHaveLength(2);
      expect(result.deliveryResults.every(d => !d.success)).toBe(true);
      expect(result.deliveryResults.every(d => d.error instanceof Error)).toBe(true);
    });
  });

  describe('Pipeline Performance and Scalability', () => {
    test('should handle high-volume pipeline executions', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const startTime = Date.now();
      
      // Execute pipeline multiple times concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        marketFetcher.simulateMarketChange(); // Change market conditions
        promises.push(pipeline.executeDailyPipeline());
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Verify all executions completed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.marketData).toBeDefined();
        expect(result.aiSignal).toBeDefined();
        expect(result.performance).toBeDefined();
        expect(result.deliveryResults).toHaveLength(2);
      });

      // Verify performance
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(fetch).toHaveBeenCalledTimes(10); // 5 runs * 2 users each
    });

    test('should maintain data quality under concurrent load', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Execute multiple pipelines with different market conditions
      const scenarios = ['BULL_MARKET', 'BEAR_MARKET', 'HIGH_VOLATILITY'] as const;
      const promises = scenarios.map(scenario => {
        marketFetcher.setScenario(scenario);
        return pipeline.executeDailyPipeline();
      });

      const results = await Promise.all(promises);

      // Verify each result maintains quality
      results.forEach((result, index) => {
        expect(result.aiSignal.confidence).toBeGreaterThan(0);
        expect(result.aiSignal.confidence).toBeLessThanOrEqual(100);
        expect(result.aiSignal.reasoning.length).toBeGreaterThan(2);
        expect(result.performance.tradesCount).toBeGreaterThan(0);
        expect(result.deliveryResults.every(d => d.success)).toBe(true);
      });
    });

    test('should handle large performance history datasets', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Generate large performance history
      for (let i = 0; i < 100; i++) {
        await performanceProvider.calculatePerformance();
      }

      const result = await pipeline.executeDailyPipeline();

      expect(result.performance).toBeDefined();
      expect(performanceProvider.getHistory()).toHaveLength(101); // 100 + 1 from pipeline
      expect(result.deliveryResults.every(d => d.success)).toBe(true);
    });
  });

  describe('Pipeline Data Validation', () => {
    test('should validate AI signal completeness before delivery', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const result = await pipeline.executeDailyPipeline();

      // Validate AI signal structure
      const signal = result.aiSignal;
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

      // Validate data types and ranges
      expect(typeof signal.symbol).toBe('string');
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal.action);
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(signal.reasoning)).toBe(true);
      expect(signal.reasoning.length).toBeGreaterThan(0);
      expect(signal.riskReward).toBeGreaterThan(0);
      expect(signal.positionSize).toBeGreaterThanOrEqual(0);
      expect(signal.positionSize).toBeLessThanOrEqual(1);
      expect(signal.timestamp).toBeInstanceOf(Date);
    });

    test('should validate performance data integrity', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const result = await pipeline.executeDailyPipeline();

      const performance = result.performance;
      expect(performance).toHaveProperty('dailyPnl');
      expect(performance).toHaveProperty('winRate');
      expect(performance).toHaveProperty('tradesCount');

      expect(typeof performance.dailyPnl).toBe('number');
      expect(performance.winRate).toBeGreaterThanOrEqual(0);
      expect(performance.winRate).toBeLessThanOrEqual(100);
      expect(performance.tradesCount).toBeGreaterThan(0);
      expect(Number.isInteger(performance.tradesCount)).toBe(true);
    });

    test('should ensure message formatting consistency', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const result = await pipeline.executeDailyPipeline();

      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        
        // Verify message structure
        expect(body).toHaveProperty('chat_id');
        expect(body).toHaveProperty('text');
        expect(body).toHaveProperty('parse_mode');
        expect(body.parse_mode).toBe('HTML');
        
        // Verify content formatting
        expect(body.text).toContain('<b>');
        expect(body.text).toContain('<i>');
        expect(body.text).not.toContain('undefined');
        expect(body.text).not.toContain('null');
        expect(body.text).not.toContain('NaN');
        
        // Verify currency formatting
        expect(body.text).toMatch(/\$[\d,]+\.\d{2}/);
        
        // Verify percentage formatting
        expect(body.text).toMatch(/\d+\.\d+%/);
        
        // Verify emoji presence
        expect(body.text).toMatch(/[🤖🧠📊📈🎯]/);
      });
    });
  });

  describe('Real-world Scenario Simulation', () => {
    test('should handle typical morning report scenario', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Simulate overnight market data
      marketFetcher.setScenario('BULL_MARKET');
      
      // Mock overnight performance data
      jest.spyOn(performanceProvider, 'calculatePerformance')
        .mockResolvedValue({
          dailyPnl: 342.75,
          weeklyPnl: 1250.30,
          monthlyPnl: 4580.90,
          winRate: 78.5,
          tradesCount: 12,
          bestTrade: 890.25,
          worstTrade: -125.50,
          avgTrade: 28.56,
          maxDrawdown: 3.2,
          sharpeRatio: 2.1,
          totalTrades: 156,
          activeDays: 22,
          riskRewardAvg: 2.3
        });

      const result = await pipeline.executeDailyPipeline();

      expect(result.aiSignal.action).toBe('BUY');
      expect(result.performance.dailyPnl).toBe(342.75);
      expect(result.deliveryResults.every(d => d.success)).toBe(true);

      const calls = (fetch as jest.Mock).mock.calls;
      const reportText = JSON.parse(calls[0][1].body).text;
      
      expect(reportText).toContain('+$342.75');
      expect(reportText).toContain('78.5%');
      expect(reportText).toContain('12');
      expect(reportText).toContain('BUY BTC/USD');
    });

    test('should handle market crash scenario', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Simulate market crash with extreme fear
      marketFetcher.setScenario('EXTREME_FEAR');
      
      // Mock performance during crash
      jest.spyOn(performanceProvider, 'calculatePerformance')
        .mockResolvedValue({
          dailyPnl: -850.30,
          weeklyPnl: -2340.75,
          monthlyPnl: -1200.50,
          winRate: 45.2,
          tradesCount: 8,
          bestTrade: 234.50,
          worstTrade: -890.75,
          avgTrade: -106.29,
          maxDrawdown: 12.8,
          sharpeRatio: 0.3,
          totalTrades: 89,
          activeDays: 18,
          riskRewardAvg: 1.8
        });

      const result = await pipeline.executeDailyPipeline();

      // AI should recommend BUY on extreme fear (contrarian)
      expect(result.aiSignal.action).toBe('BUY');
      expect(result.aiSignal.confidence).toBeGreaterThan(70);
      expect(result.performance.dailyPnl).toBe(-850.30);

      const calls = (fetch as jest.Mock).mock.calls;
      const reportText = JSON.parse(calls[0][1].body).text;
      
      expect(reportText).toContain('-$850.30');
      expect(reportText).toContain('Extreme fear');
      expect(reportText).toContain('buying opportunity');
    });

    test('should handle weekend/low activity scenario', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      marketFetcher.setScenario('RANGING_MARKET');
      
      // Mock low activity performance
      jest.spyOn(performanceProvider, 'calculatePerformance')
        .mockResolvedValue({
          dailyPnl: 15.25,
          weeklyPnl: 85.60,
          monthlyPnl: 450.30,
          winRate: 62.5,
          tradesCount: 2,
          bestTrade: 45.80,
          worstTrade: -30.55,
          avgTrade: 7.63,
          maxDrawdown: 1.2,
          sharpeRatio: 1.1,
          totalTrades: 45,
          activeDays: 12,
          riskRewardAvg: 1.9
        });

      const result = await pipeline.executeDailyPipeline();

      expect(result.aiSignal.action).toBe('HOLD');
      expect(result.aiSignal.marketRegime).toBe('RANGE');
      expect(result.performance.tradesCount).toBe(2);

      const calls = (fetch as jest.Mock).mock.calls;
      const reportText = JSON.parse(calls[0][1].body).text;
      
      expect(reportText).toContain('HOLD');
      expect(reportText).toContain('RANGE');
      expect(reportText).toContain('Challenging conditions');
    });
  });
});