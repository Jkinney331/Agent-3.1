/**
 * AI-Bot Integration Tests
 * Testing the complete data flow between AI analysis engine and Telegram bot
 */

import { AIReasoningEngine, TradingSignal } from '../../lib/ai/reasoning-engine';
import { TelegramBotServer, TelegramBotConfig } from '../../lib/telegram/bot-server';
import {
  MARKET_DATA_SCENARIOS,
  SAMPLE_TRADING_SIGNALS,
  ADVANCED_DATA_SCENARIOS
} from '../fixtures/ai-analysis-data';
import {
  MOCK_USERS,
  MOCK_CHATS,
  TELEGRAM_API_RESPONSES
} from '../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

describe('AI-Bot Integration', () => {
  let aiEngine: AIReasoningEngine;
  let botServer: TelegramBotServer;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    aiEngine = new AIReasoningEngine();
    
    mockConfig = {
      token: 'mock-integration-token',
      authorizedUsers: [MOCK_USERS.AUTHORIZED_USER.id],
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
          result: { id: 123, is_bot: true, first_name: 'IntegrationBot' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

    await botServer.start();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await botServer.stop();
  });

  describe('AI Analysis to Bot Report Flow', () => {
    test('should generate AI signal and deliver bot report', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Step 1: AI generates trading signal
      const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      const aiSignal = await aiEngine.analyzeMarket(marketData);

      expect(aiSignal).toBeDefined();
      expect(aiSignal.action).toBe('BUY');
      expect(aiSignal.confidence).toBeGreaterThan(60);

      // Step 2: Bot delivers daily report with AI signal
      const mockPerformance = {
        dailyPnl: 250.50,
        winRate: 75.5,
        tradesCount: 8
      };

      await botServer.sendDailyReport(
        MOCK_CHATS.PRIVATE_CHAT.id,
        aiSignal,
        mockPerformance
      );

      // Verify report was sent
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Daily AI Trading Report')
        })
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      // Verify AI signal data is included
      expect(body.text).toContain('BUY BTC/USD');
      expect(body.text).toContain(aiSignal.confidence.toFixed(1));
      expect(body.text).toContain(aiSignal.marketRegime);
      expect(body.text).toContain(aiSignal.riskReward.toFixed(2));
      
      // Verify performance data is included
      expect(body.text).toContain('$250.50');
      expect(body.text).toContain('75.5%');
      expect(body.text).toContain('8');
    });

    test('should handle bear market analysis and alert delivery', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Generate bear market signal
      const bearMarketData = MARKET_DATA_SCENARIOS.BEAR_MARKET;
      const aiSignal = await aiEngine.analyzeMarket(bearMarketData);

      expect(aiSignal.action).toBe('SELL');
      expect(aiSignal.marketRegime).toBe('BEAR');

      // Send trading alert based on AI signal
      const alertData = {
        type: 'AI_SIGNAL',
        symbol: aiSignal.symbol,
        price: bearMarketData.price,
        change: -5.2,
        action: aiSignal.action,
        confidence: aiSignal.confidence,
        timeFrame: '4H',
        stopLoss: aiSignal.stopLoss,
        takeProfit: aiSignal.takeProfit
      };

      await botServer.sendTradingAlert(MOCK_CHATS.PRIVATE_CHAT.id, alertData);

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain('Trading Alert');
      expect(body.text).toContain('SELL');
      expect(body.text).toContain(aiSignal.confidence.toString());
      expect(body.text).toContain(aiSignal.stopLoss.toString());
    });

    test('should integrate advanced market intelligence in reports', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock advanced data gathering
      jest.spyOn(aiEngine as any, 'gatherAdvancedMarketIntelligence')
        .mockResolvedValue(ADVANCED_DATA_SCENARIOS.WHALE_ACCUMULATION);

      const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      const aiSignal = await aiEngine.analyzeMarket(marketData);

      // Verify advanced data is included
      expect(aiSignal.reasoning.some(r => r.includes('Whale activity'))).toBe(true);
      expect(aiSignal.advancedData?.whaleAlerts).toBeDefined();

      const mockPerformance = {
        dailyPnl: 500.25,
        winRate: 80.0,
        tradesCount: 12
      };

      await botServer.sendDailyReport(
        MOCK_CHATS.PRIVATE_CHAT.id,
        aiSignal,
        mockPerformance
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      // Should include advanced insights
      expect(body.text).toContain('Whale activity');
      expect(body.text).toContain('accumulation');
    });

    test('should handle HOLD signals appropriately', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const rangingData = MARKET_DATA_SCENARIOS.RANGING_MARKET;
      const aiSignal = await aiEngine.analyzeMarket(rangingData);

      expect(aiSignal.action).toBe('HOLD');
      expect(aiSignal.positionSize).toBe(0);

      const mockPerformance = {
        dailyPnl: 0,
        winRate: 65.0,
        tradesCount: 2
      };

      await botServer.sendDailyReport(
        MOCK_CHATS.PRIVATE_CHAT.id,
        aiSignal,
        mockPerformance
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain('HOLD');
      expect(body.text).toContain('RANGE');
      expect(body.text).toContain('Challenging conditions');
    });
  });

  describe('Real-time Command Integration', () => {
    test('should process /status command with live AI data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Simulate AI analysis running in background
      const currentMarketData = MARKET_DATA_SCENARIOS.HIGH_VOLATILITY;
      const aiSignal = await aiEngine.analyzeMarket(currentMarketData);

      // Process status command
      await botServer.processUpdate({
        update_id: 1001,
        message: {
          message_id: 1001,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain('Trading Bot Status');
      expect(body.text).toContain('AI Analysis: Active');
      expect(body.text).toContain('Last Analysis: 30s ago');
    });

    test('should provide AI insights in balance command', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 1002,
        message: {
          message_id: 1002,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/balance'
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain('Account Balance');
      expect(body.text).toContain('Performance:');
      expect(body.text).toMatch(/[+-]\$[\d,]+\.\d{2}/); // Performance numbers
    });

    test('should generate report with current AI analysis', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Generate fresh AI signal
      const marketData = MARKET_DATA_SCENARIOS.EXTREME_FEAR;
      const aiSignal = await aiEngine.analyzeMarket(marketData);

      expect(aiSignal.action).toBe('BUY');
      expect(aiSignal.confidence).toBeGreaterThan(70);

      await botServer.processUpdate({
        update_id: 1003,
        message: {
          message_id: 1003,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/report'
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain('Trading Report');
      expect(body.text).toContain('AI Analysis Summary:');
      expect(body.text).toContain('Market regime:');
      expect(body.text).toContain('Confidence avg:');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle AI analysis failures gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock AI analysis failure
      jest.spyOn(aiEngine, 'analyzeMarket').mockRejectedValue(new Error('Market data unavailable'));

      // Bot should still handle commands gracefully
      await botServer.processUpdate({
        update_id: 2001,
        message: {
          message_id: 2001,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.text).toContain('Trading Bot Status');
      // Should not crash the bot
    });

    test('should handle bot delivery failures with AI retry', async () => {
      // First call fails, second succeeds
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        });

      const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
      const aiSignal = await aiEngine.analyzeMarket(marketData);

      const mockPerformance = {
        dailyPnl: 150.75,
        winRate: 70.0,
        tradesCount: 5
      };

      // First attempt should fail, but not crash
      await expect(
        botServer.sendDailyReport(MOCK_CHATS.PRIVATE_CHAT.id, aiSignal, mockPerformance)
      ).rejects.toThrow();

      // Second attempt should succeed
      await expect(
        botServer.sendDailyReport(MOCK_CHATS.PRIVATE_CHAT.id, aiSignal, mockPerformance)
      ).resolves.not.toThrow();
    });

    test('should handle partial AI data gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Create incomplete signal
      const partialSignal: Partial<TradingSignal> = {
        symbol: 'BTC/USD',
        action: 'BUY',
        confidence: 75,
        reasoning: ['Partial analysis available'],
        timestamp: new Date()
      };

      const mockPerformance = {
        dailyPnl: 100.00,
        winRate: 60.0,
        tradesCount: 3
      };

      await expect(
        botServer.sendDailyReport(
          MOCK_CHATS.PRIVATE_CHAT.id,
          partialSignal as TradingSignal,
          mockPerformance
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    test('should handle high-frequency AI analysis requests', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const startTime = Date.now();

      // Generate multiple AI signals concurrently
      const analysisPromises = [];
      for (let i = 0; i < 10; i++) {
        analysisPromises.push(aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET));
      }

      const aiSignals = await Promise.all(analysisPromises);
      
      // Send multiple reports
      const reportPromises = [];
      for (let i = 0; i < aiSignals.length; i++) {
        const mockPerformance = {
          dailyPnl: 50 + i * 10,
          winRate: 65 + i,
          tradesCount: 3 + i
        };
        
        reportPromises.push(
          botServer.sendDailyReport(MOCK_CHATS.PRIVATE_CHAT.id, aiSignals[i], mockPerformance)
        );
      }

      await Promise.all(reportPromises);

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(fetch).toHaveBeenCalledTimes(10);
    });

    test('should maintain accuracy under concurrent load', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Process multiple bot commands while AI is analyzing
      const commandPromises = [];
      const analysisPromises = [];

      for (let i = 0; i < 5; i++) {
        commandPromises.push(
          botServer.processUpdate({
            update_id: 3000 + i,
            message: {
              message_id: 3000 + i,
              from: MOCK_USERS.AUTHORIZED_USER,
              chat: MOCK_CHATS.PRIVATE_CHAT,
              date: Math.floor(Date.now() / 1000),
              text: '/status'
            }
          })
        );

        analysisPromises.push(
          aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET)
        );
      }

      const [commandResults, analysisResults] = await Promise.all([
        Promise.all(commandPromises),
        Promise.all(analysisPromises)
      ]);

      // All operations should complete successfully
      expect(commandResults).toHaveLength(5);
      expect(analysisResults).toHaveLength(5);
      
      // All AI analyses should be consistent
      analysisResults.forEach(signal => {
        expect(signal.action).toBe('BUY');
        expect(signal.confidence).toBeGreaterThan(60);
      });
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain data integrity across AI-Bot pipeline', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Generate AI signal with specific data
      const marketData = {
        ...MARKET_DATA_SCENARIOS.EXTREME_FEAR,
        fearGreed: 15, // Specific fear value
        price: 42500   // Specific price
      };

      const aiSignal = await aiEngine.analyzeMarket(marketData);

      // Verify AI analysis
      expect(aiSignal.reasoning.some(r => r.includes('15.0'))).toBe(true); // Fear value
      expect(aiSignal.action).toBe('BUY'); // Contrarian signal

      const mockPerformance = {
        dailyPnl: 325.75,
        winRate: 82.5,
        tradesCount: 11
      };

      await botServer.sendDailyReport(
        MOCK_CHATS.PRIVATE_CHAT.id,
        aiSignal,
        mockPerformance
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      // Verify all data is consistently transmitted
      expect(body.text).toContain('BUY BTC/USD');
      expect(body.text).toContain(aiSignal.confidence.toFixed(1));
      expect(body.text).toContain('$325.75');
      expect(body.text).toContain('82.5%');
      expect(body.text).toContain('11');
    });

    test('should handle timezone consistency', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const testDate = new Date('2025-01-15T10:30:00Z');
      
      // Mock Date.now to return specific time
      const originalNow = Date.now;
      Date.now = jest.fn(() => testDate.getTime());

      const aiSignal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);
      
      const mockPerformance = {
        dailyPnl: 200.00,
        winRate: 75.0,
        tradesCount: 6
      };

      await botServer.sendDailyReport(
        MOCK_CHATS.PRIVATE_CHAT.id,
        aiSignal,
        mockPerformance
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      // Should contain consistent timestamp
      expect(body.text).toContain('2025');
      
      Date.now = originalNow;
    });

    test('should validate AI signal structure before bot delivery', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const aiSignal = await aiEngine.analyzeMarket(MARKET_DATA_SCENARIOS.BULL_MARKET);

      // Validate signal structure
      expect(aiSignal).toHaveProperty('symbol');
      expect(aiSignal).toHaveProperty('action');
      expect(aiSignal).toHaveProperty('confidence');
      expect(aiSignal).toHaveProperty('reasoning');
      expect(aiSignal).toHaveProperty('riskReward');
      expect(aiSignal).toHaveProperty('timestamp');
      expect(aiSignal).toHaveProperty('marketRegime');

      // Validate data types
      expect(typeof aiSignal.symbol).toBe('string');
      expect(['BUY', 'SELL', 'HOLD']).toContain(aiSignal.action);
      expect(typeof aiSignal.confidence).toBe('number');
      expect(Array.isArray(aiSignal.reasoning)).toBe(true);
      expect(typeof aiSignal.riskReward).toBe('number');
      expect(aiSignal.timestamp).toBeInstanceOf(Date);

      const mockPerformance = {
        dailyPnl: 150.25,
        winRate: 70.0,
        tradesCount: 7
      };

      await expect(
        botServer.sendDailyReport(MOCK_CHATS.PRIVATE_CHAT.id, aiSignal, mockPerformance)
      ).resolves.not.toThrow();
    });
  });

  describe('Webhook Integration', () => {
    test('should process webhook updates with AI context', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Simulate webhook receiving update
      const webhookUpdate = {
        update_id: 4001,
        message: {
          message_id: 4001,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      };

      // Process should complete successfully
      await expect(
        botServer.processUpdate(webhookUpdate)
      ).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Bot Status')
        })
      );
    });

    test('should handle batch webhook updates', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const batchUpdates = [
        {
          update_id: 4101,
          message: {
            message_id: 4101,
            from: MOCK_USERS.AUTHORIZED_USER,
            chat: MOCK_CHATS.PRIVATE_CHAT,
            date: Math.floor(Date.now() / 1000),
            text: '/status'
          }
        },
        {
          update_id: 4102,
          message: {
            message_id: 4102,
            from: MOCK_USERS.AUTHORIZED_USER,
            chat: MOCK_CHATS.PRIVATE_CHAT,
            date: Math.floor(Date.now() / 1000),
            text: '/balance'
          }
        },
        {
          update_id: 4103,
          message: {
            message_id: 4103,
            from: MOCK_USERS.AUTHORIZED_USER,
            chat: MOCK_CHATS.PRIVATE_CHAT,
            date: Math.floor(Date.now() / 1000),
            text: '/report'
          }
        }
      ];

      // Process all updates
      for (const update of batchUpdates) {
        await botServer.processUpdate(update);
      }

      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});