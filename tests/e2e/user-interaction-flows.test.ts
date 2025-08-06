/**
 * End-to-End User Interaction Flow Tests
 * Testing complete user interaction scenarios with real-time data integration
 */

import { AIReasoningEngine } from '../../lib/ai/reasoning-engine';
import { TelegramBotServer, TelegramBotConfig } from '../../lib/telegram/bot-server';
import {
  MARKET_DATA_SCENARIOS,
  ADVANCED_DATA_SCENARIOS
} from '../fixtures/ai-analysis-data';
import {
  MOCK_USERS,
  MOCK_CHATS,
  TELEGRAM_API_RESPONSES,
  MOCK_TRADING_DATA
} from '../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Trading Engine for realistic interaction
class MockTradingEngine {
  private positions = MOCK_TRADING_DATA.ACTIVE_POSITIONS;
  private balance = MOCK_TRADING_DATA.PORTFOLIO_BALANCE;
  private status = MOCK_TRADING_DATA.TRADING_STATUS;
  private alerts = MOCK_TRADING_DATA.PRICE_ALERTS;

  async getStatus() {
    return this.status;
  }

  async getBalance() {
    return this.balance;
  }

  async getPositions() {
    return this.positions;
  }

  async getAlerts() {
    return this.alerts;
  }

  async pauseTrading() {
    this.status.tradingEnabled = false;
    return { success: true, message: 'Trading paused' };
  }

  async resumeTrading() {
    this.status.tradingEnabled = true;
    return { success: true, message: 'Trading resumed' };
  }

  simulateMarketMovement() {
    // Simulate position P&L changes
    this.positions.forEach(position => {
      const change = (Math.random() - 0.5) * 0.02; // ±2% change
      position.currentPrice *= (1 + change);
      position.pnl = (position.currentPrice - position.entryPrice) * position.size;
      position.pnlPercentage = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
    });

    // Update total portfolio value
    const totalPositionValue = this.positions.reduce((sum, pos) => sum + pos.pnl, 0);
    this.balance.totalValue = 125847.32 + totalPositionValue;
  }
}

// Complete User Interaction Simulator
class UserInteractionSimulator {
  constructor(
    private botServer: TelegramBotServer,
    private tradingEngine: MockTradingEngine,
    private aiEngine: AIReasoningEngine
  ) {}

  async simulateUserSession(userId: number, commands: string[]): Promise<any[]> {
    const responses = [];
    
    for (const command of commands) {
      const update = {
        update_id: Math.floor(Math.random() * 100000),
        message: {
          message_id: Math.floor(Math.random() * 100000),
          from: userId === MOCK_USERS.AUTHORIZED_USER.id ? MOCK_USERS.AUTHORIZED_USER : MOCK_USERS.VIP_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: command
        }
      };

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await this.botServer.processUpdate(update);
      responses.push({ command, timestamp: new Date() });
    }

    return responses;
  }

  async simulateTypicalTradingDay(): Promise<any> {
    const dayEvents = [];

    // Morning routine
    console.log('🌅 Simulating morning routine...');
    dayEvents.push({
      time: '08:00',
      event: 'Morning check',
      commands: await this.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/status', '/balance', '/positions'])
    });

    // Mid-day check
    console.log('☀️ Simulating mid-day check...');
    this.tradingEngine.simulateMarketMovement();
    dayEvents.push({
      time: '12:00',
      event: 'Lunch break check',
      commands: await this.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/portfolio', '/alerts'])
    });

    // Afternoon analysis
    console.log('🌇 Simulating afternoon analysis...');
    this.tradingEngine.simulateMarketMovement();
    dayEvents.push({
      time: '16:00',
      event: 'Afternoon analysis',
      commands: await this.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/report', '/status'])
    });

    // Evening wrap-up
    console.log('🌙 Simulating evening wrap-up...');
    dayEvents.push({
      time: '20:00',
      event: 'Evening summary',
      commands: await this.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/balance', '/positions'])
    });

    return dayEvents;
  }
}

describe('User Interaction Flows E2E', () => {
  let aiEngine: AIReasoningEngine;
  let botServer: TelegramBotServer;
  let tradingEngine: MockTradingEngine;
  let simulator: UserInteractionSimulator;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    // Initialize components
    aiEngine = new AIReasoningEngine();
    tradingEngine = new MockTradingEngine();
    
    mockConfig = {
      token: 'mock-interaction-token',
      authorizedUsers: [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id],
      rateLimit: {
        maxRequests: 50,
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
          result: { id: 123, is_bot: true, first_name: 'InteractionBot' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

    await botServer.start();

    simulator = new UserInteractionSimulator(botServer, tradingEngine, aiEngine);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await botServer.stop();
  });

  describe('Single User Command Flows', () => {
    test('should handle complete status check flow', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/start', '/status', '/balance', '/portfolio', '/positions'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, commands);

      expect(responses).toHaveLength(5);
      expect(fetch).toHaveBeenCalledTimes(5);

      // Verify each command was processed
      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('AI Crypto Trading Bot');
      expect(JSON.parse(calls[1][1].body).text).toContain('Trading Bot Status');
      expect(JSON.parse(calls[2][1].body).text).toContain('Account Balance');
      expect(JSON.parse(calls[3][1].body).text).toContain('Portfolio Overview');
      expect(JSON.parse(calls[4][1].body).text).toContain('Active Positions');
    });

    test('should handle trading control flow', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/status', '/pause', '/status', '/resume', '/status'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, commands);

      expect(responses).toHaveLength(5);
      expect(fetch).toHaveBeenCalledTimes(5);

      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[1][1].body).text).toContain('Trading Paused');
      expect(JSON.parse(calls[3][1].body).text).toContain('Trading Resumed');
    });

    test('should handle information gathering flow', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/help', '/report', '/alerts', '/portfolio'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, commands);

      expect(responses).toHaveLength(4);
      expect(fetch).toHaveBeenCalledTimes(4);

      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('Bot Help & Commands');
      expect(JSON.parse(calls[1][1].body).text).toContain('Trading Report');
      expect(JSON.parse(calls[2][1].body).text).toContain('Price Alerts');
      expect(JSON.parse(calls[3][1].body).text).toContain('Portfolio Overview');
    });

    test('should handle unauthorized user interaction', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/start', '/status', '/balance'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.UNAUTHORIZED_USER.id, commands);

      expect(responses).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(3);

      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('AI Crypto Trading Bot'); // /start allowed
      expect(JSON.parse(calls[1][1].body).text).toContain('Access Denied'); // /status denied  
      expect(JSON.parse(calls[2][1].body).text).toContain('Access Denied'); // /balance denied
    });
  });

  describe('Multi-User Concurrent Flows', () => {
    test('should handle multiple users accessing simultaneously', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const user1Commands = ['/status', '/balance'];
      const user2Commands = ['/portfolio', '/positions'];

      const [user1Responses, user2Responses] = await Promise.all([
        simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, user1Commands),
        simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, user2Commands)
      ]);

      expect(user1Responses).toHaveLength(2);
      expect(user2Responses).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(4);

      // Verify no interference between users
      const calls = (fetch as jest.Mock).mock.calls;
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Trading Bot Status'))).toBe(true);
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Account Balance'))).toBe(true);
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Portfolio Overview'))).toBe(true);
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Active Positions'))).toBe(true);
    });

    test('should maintain rate limiting per user', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const rapidCommands = Array(15).fill('/status'); // Exceeds rate limit

      const [user1Responses, user2Responses] = await Promise.all([
        simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, rapidCommands),
        simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, ['/balance'])
      ]);

      expect(user1Responses).toHaveLength(15);
      expect(user2Responses).toHaveLength(1);

      // User 2 should not be affected by User 1's rate limiting
      const calls = (fetch as jest.Mock).mock.calls;
      const rateLimitMessages = calls.filter(call => 
        JSON.parse(call[1].body).text.includes('Rate limit')
      );
      const balanceMessage = calls.find(call =>
        JSON.parse(call[1].body).text.includes('Account Balance')
      );

      expect(rateLimitMessages.length).toBeGreaterThan(0);
      expect(balanceMessage).toBeDefined();
    });

    test('should handle user conflicts gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Both users try to pause/resume simultaneously
      const conflictingCommands = [
        simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/pause']),
        simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, ['/resume'])
      ];

      const results = await Promise.all(conflictingCommands);

      expect(results[0]).toHaveLength(1);
      expect(results[1]).toHaveLength(1);

      // Both commands should be processed
      const calls = (fetch as jest.Mock).mock.calls;
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Paused'))).toBe(true);
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Resumed'))).toBe(true);
    });
  });

  describe('Real-Time Data Integration', () => {
    test('should reflect live market changes in user commands', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // First position check
      await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/positions']);
      
      // Simulate market movement
      tradingEngine.simulateMarketMovement();
      
      // Second position check should show different values
      await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/positions']);

      expect(fetch).toHaveBeenCalledTimes(2);
      
      const calls = (fetch as jest.Mock).mock.calls;
      const firstResponse = JSON.parse(calls[0][1].body).text;
      const secondResponse = JSON.parse(calls[1][1].body).text;

      // Both should contain position data, but values may differ due to simulation
      expect(firstResponse).toContain('Active Positions');
      expect(secondResponse).toContain('Active Positions');
      expect(firstResponse).toContain('BTC/USD');
      expect(secondResponse).toContain('BTC/USD');
    });

    test('should integrate AI analysis with user commands', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Mock AI analysis in background
      const marketData = MARKET_DATA_SCENARIOS.HIGH_VOLATILITY;
      const aiSignal = await aiEngine.analyzeMarket(marketData);

      // User requests report which should include AI insights
      await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/report']);

      const call = (fetch as jest.Mock).mock.calls[0];
      const responseText = JSON.parse(call[1].body).text;

      expect(responseText).toContain('Trading Report');
      expect(responseText).toContain('AI Analysis Summary');
      expect(responseText).toContain('Market regime:');
      expect(responseText).toContain('Confidence avg:');
    });

    test('should handle live alert scenarios', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Generate high-confidence AI signal
      const marketData = MARKET_DATA_SCENARIOS.EXTREME_FEAR;
      const aiSignal = await aiEngine.analyzeMarket(marketData);

      if (aiSignal.confidence > 80) {
        // Send alert to user
        const alertData = {
          type: 'HIGH_CONFIDENCE',
          symbol: aiSignal.symbol,
          price: marketData.price,
          change: -8.5,
          action: aiSignal.action,
          confidence: aiSignal.confidence,
          timeFrame: '1H',
          stopLoss: aiSignal.stopLoss,
          takeProfit: aiSignal.takeProfit
        };

        await botServer.sendTradingAlert(MOCK_USERS.AUTHORIZED_USER.id, alertData);
        
        // User checks status after alert
        await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/status']);

        expect(fetch).toHaveBeenCalledTimes(2);
        
        const alertCall = (fetch as jest.Mock).mock.calls[0];
        const statusCall = (fetch as jest.Mock).mock.calls[1];
        
        expect(JSON.parse(alertCall[1].body).text).toContain('Trading Alert');
        expect(JSON.parse(statusCall[1].body).text).toContain('Trading Bot Status');
      }
    });
  });

  describe('Complex User Scenarios', () => {
    test('should handle typical trading day workflow', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const dayEvents = await simulator.simulateTypicalTradingDay();

      expect(dayEvents).toHaveLength(4);
      expect(dayEvents[0].event).toBe('Morning check');
      expect(dayEvents[1].event).toBe('Lunch break check');
      expect(dayEvents[2].event).toBe('Afternoon analysis');
      expect(dayEvents[3].event).toBe('Evening summary');

      // Verify all commands were processed
      const totalCommands = dayEvents.reduce((sum, event) => sum + event.commands.length, 0);
      expect(fetch).toHaveBeenCalledTimes(totalCommands);
    });

    test('should handle emergency trading scenario', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Simulate market crash emergency
      const emergencyCommands = [
        '/status',      // Check current status
        '/positions',   // Check current positions
        '/pause',       // Pause trading immediately
        '/balance',     // Check damage
        '/report',      // Get AI analysis
        '/resume'       // Resume when ready
      ];

      const startTime = Date.now();
      const responses = await simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, emergencyCommands);
      const responseTime = Date.now() - startTime;

      expect(responses).toHaveLength(6);
      expect(responseTime).toBeLessThan(3000); // Should handle emergency quickly

      const calls = (fetch as jest.Mock).mock.calls;
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Trading Paused'))).toBe(true);
      expect(calls.some(call => JSON.parse(call[1].body).text.includes('Trading Resumed'))).toBe(true);
    });

    test('should handle new user onboarding flow', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const onboardingCommands = [
        '/start',       // Initial greeting
        '/help',        // Learn about commands
        '/status',      // Attempt protected command (should fail)
        '/help'         // Get help again
      ];

      const responses = await simulator.simulateUserSession(MOCK_USERS.UNAUTHORIZED_USER.id, onboardingCommands);

      expect(responses).toHaveLength(4);
      expect(fetch).toHaveBeenCalledTimes(4);

      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('Welcome to your personal AI-powered');
      expect(JSON.parse(calls[1][1].body).text).toContain('Bot Help & Commands');
      expect(JSON.parse(calls[2][1].body).text).toContain('Access Denied');
      expect(JSON.parse(calls[3][1].body).text).toContain('Bot Help & Commands');
    });

    test('should handle power user advanced workflow', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const advancedCommands = [
        '/status',
        '/balance', 
        '/portfolio',
        '/positions',
        '/alerts',
        '/report',
        '/pause',
        '/resume',
        '/balance'  // Final check
      ];

      const responses = await simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, advancedCommands);

      expect(responses).toHaveLength(9);
      expect(fetch).toHaveBeenCalledTimes(9);

      // Verify all advanced commands were handled
      const calls = (fetch as jest.Mock).mock.calls;
      const responseTexts = calls.map(call => JSON.parse(call[1].body).text);
      
      expect(responseTexts.some(text => text.includes('Trading Bot Status'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Account Balance'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Portfolio Overview'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Active Positions'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Price Alerts'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Trading Report'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Trading Paused'))).toBe(true);
      expect(responseTexts.some(text => text.includes('Trading Resumed'))).toBe(true);
    });
  });

  describe('Error Recovery Flows', () => {
    test('should handle and recover from temporary failures', async () => {
      // First few calls fail, then succeed
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        });

      const commands = ['/status', '/status', '/balance'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, commands);

      expect(responses).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(3);
      
      // Last command should succeed
      const lastCall = (fetch as jest.Mock).mock.calls[2];
      expect(JSON.parse(lastCall[1].body).text).toContain('Account Balance');
    });

    test('should handle user retry patterns', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        });

      // User tries same command twice after failure
      const retryCommands = ['/status', '/status'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, retryCommands);

      expect(responses).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should maintain session state during errors', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        })
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        });

      const commands = ['/pause', '/status', '/resume'];
      const responses = await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, commands);

      expect(responses).toHaveLength(3);
      expect(fetch).toHaveBeenCalledTimes(3);

      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('Trading Paused');
      expect(JSON.parse(calls[2][1].body).text).toContain('Trading Resumed');
    });
  });

  describe('Performance Under Load', () => {
    test('should handle rapid user interactions', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const rapidCommands = ['/status', '/balance', '/portfolio', '/positions', '/alerts'];
      const startTime = Date.now();
      
      const responses = await simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, rapidCommands);
      
      const totalTime = Date.now() - startTime;

      expect(responses).toHaveLength(5);
      expect(totalTime).toBeLessThan(2000); // Should handle rapidly
      expect(fetch).toHaveBeenCalledTimes(5);
    });

    test('should maintain quality under concurrent load', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Multiple users with different command patterns
      const userSessions = [
        simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/status', '/balance']),
        simulator.simulateUserSession(MOCK_USERS.VIP_USER.id, ['/portfolio', '/positions']),
        simulator.simulateUserSession(MOCK_USERS.AUTHORIZED_USER.id, ['/report', '/alerts'])
      ];

      const results = await Promise.all(userSessions);

      expect(results[0]).toHaveLength(2);
      expect(results[1]).toHaveLength(2);
      expect(results[2]).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(6);

      // Verify all responses are properly formatted
      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        expect(body.text).not.toContain('undefined');
        expect(body.text).not.toContain('null');
        expect(body.parse_mode).toBe('HTML');
      });
    });
  });
});