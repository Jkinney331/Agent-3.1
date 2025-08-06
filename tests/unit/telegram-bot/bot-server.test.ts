/**
 * Telegram Bot Server Unit Tests
 * Comprehensive testing of bot server functionality, command handling, and security
 */

import { TelegramBotServer, TelegramBotConfig } from '../../../lib/telegram/bot-server';
import {
  MOCK_USERS,
  MOCK_CHATS,
  COMMAND_MESSAGES,
  EXPECTED_RESPONSES,
  TELEGRAM_API_RESPONSES,
  WEBHOOK_UPDATES,
  RATE_LIMIT_SCENARIOS,
  ERROR_SCENARIOS,
  SECURITY_SCENARIOS
} from '../../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

describe('TelegramBotServer', () => {
  let botServer: TelegramBotServer;
  let mockConfig: TelegramBotConfig;

  beforeEach(() => {
    mockConfig = {
      token: 'mock-bot-token',
      authorizedUsers: [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id],
      webhookUrl: 'https://example.com/webhook',
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000 // 1 minute
      }
    };

    botServer = new TelegramBotServer(mockConfig);
    jest.clearAllMocks();
  });

  describe('Bot Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(botServer).toBeInstanceOf(TelegramBotServer);
    });

    test('should start successfully with valid token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

      await expect(botServer.start()).resolves.not.toThrow();
    });

    test('should fail to start with invalid token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(botServer.start()).rejects.toThrow();
    });

    test('should set webhook when URL provided', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/setWebhook'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(mockConfig.webhookUrl!)
        })
      );
    });

    test('should stop gracefully', async () => {
      await expect(botServer.stop()).resolves.not.toThrow();
    });
  });

  describe('Command Processing', () => {
    beforeEach(async () => {
      // Mock successful start
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should process /start command correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('AI Crypto Trading Bot')
        })
      );
    });

    test('should process /status command for authorized user', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const statusUpdate = {
        update_id: 10001,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      };

      await botServer.processUpdate(statusUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Bot Status')
        })
      );
    });

    test('should reject unauthorized user for protected commands', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const unauthorizedUpdate = {
        update_id: 10002,
        message: COMMAND_MESSAGES.UNAUTHORIZED_COMMAND
      };

      await botServer.processUpdate(unauthorizedUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Access Denied')
        })
      );
    });

    test('should handle unknown commands gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const invalidUpdate = {
        update_id: 10003,
        message: COMMAND_MESSAGES.INVALID_COMMAND
      };

      await botServer.processUpdate(invalidUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Unknown command')
        })
      );
    });

    test('should handle non-command text messages', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const textUpdate = {
        update_id: 10004,
        message: COMMAND_MESSAGES.TEXT_MESSAGE
      };

      await botServer.processUpdate(textUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('don\'t understand')
        })
      );
    });
  });

  describe('Individual Command Handlers', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should handle /balance command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const balanceUpdate = {
        update_id: 10005,
        message: COMMAND_MESSAGES.BALANCE_COMMAND
      };

      await botServer.processUpdate(balanceUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Account Balance')
        })
      );
    });

    test('should handle /portfolio command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const portfolioUpdate = {
        update_id: 10006,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/portfolio',
          message_id: 1007
        }
      };

      await botServer.processUpdate(portfolioUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Portfolio Overview')
        })
      );
    });

    test('should handle /positions command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const positionsUpdate = {
        update_id: 10007,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/positions',
          message_id: 1008
        }
      };

      await botServer.processUpdate(positionsUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Active Positions')
        })
      );
    });

    test('should handle /pause command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const pauseUpdate = {
        update_id: 10008,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/pause',
          message_id: 1009
        }
      };

      await botServer.processUpdate(pauseUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Paused')
        })
      );
    });

    test('should handle /resume command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const resumeUpdate = {
        update_id: 10009,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/resume',
          message_id: 1010
        }
      };

      await botServer.processUpdate(resumeUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Resumed')
        })
      );
    });

    test('should handle /help command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const helpUpdate = {
        update_id: 10010,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/help',
          message_id: 1011
        }
      };

      await botServer.processUpdate(helpUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Bot Help & Commands')
        })
      );
    });

    test('should handle /report command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const reportUpdate = {
        update_id: 10011,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/report',
          message_id: 1012
        }
      };

      await botServer.processUpdate(reportUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Report')
        })
      );
    });

    test('should handle /alerts command', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const alertsUpdate = {
        update_id: 10012,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/alerts',
          message_id: 1013
        }
      };

      await botServer.processUpdate(alertsUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Price Alerts')
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should allow normal usage within rate limits', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Send requests within rate limit
      for (let i = 0; i < 5; i++) {
        await botServer.processUpdate({
          update_id: 20000 + i,
          message: COMMAND_MESSAGES.STATUS_COMMAND
        });
      }

      // All requests should be processed (5 sendMessage calls)
      expect(fetch).toHaveBeenCalledTimes(5);
    });

    test('should block requests exceeding rate limit', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Send requests exceeding rate limit
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(botServer.processUpdate({
          update_id: 21000 + i,
          message: COMMAND_MESSAGES.STATUS_COMMAND
        }));
      }

      await Promise.all(promises);

      // Should have rate limit responses
      const rateLimitCalls = (fetch as jest.Mock).mock.calls.filter(call => 
        call[1]?.body?.includes('Rate limit exceeded')
      );
      
      expect(rateLimitCalls.length).toBeGreaterThan(0);
    });

    test('should reset rate limit after window expires', async () => {
      // Override config for faster testing
      const fastLimitConfig = {
        ...mockConfig,
        rateLimit: { maxRequests: 2, windowMs: 100 }
      };
      
      const fastBot = new TelegramBotServer(fastLimitConfig);
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await fastBot.start();
      jest.clearAllMocks();

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Send requests to hit rate limit
      await fastBot.processUpdate({
        update_id: 22001,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });
      await fastBot.processUpdate({
        update_id: 22002,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });
      await fastBot.processUpdate({
        update_id: 22003,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow new requests
      await fastBot.processUpdate({
        update_id: 22004,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      // Should have processed the request after reset
      expect(fetch).toHaveBeenCalledTimes(4); // 2 allowed + 1 rate limit + 1 after reset
    });

    test('should apply different rate limits per command', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Balance command has lower rate limit (5 vs 10 for status)
      for (let i = 0; i < 7; i++) {
        await botServer.processUpdate({
          update_id: 23000 + i,
          message: {
            ...COMMAND_MESSAGES.BALANCE_COMMAND,
            message_id: 2000 + i
          }
        });
      }

      // Should have rate limit messages
      const calls = (fetch as jest.Mock).mock.calls;
      const rateLimitMessages = calls.filter(call => 
        call[1]?.body?.includes('Rate limit')
      );
      
      expect(rateLimitMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization and Security', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should authorize configured users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const authorizedUpdate = {
        update_id: 30001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.AUTHORIZED_USER
        }
      };

      await botServer.processUpdate(authorizedUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Bot Status')
        })
      );
    });

    test('should block unauthorized users from protected commands', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const unauthorizedUpdate = {
        update_id: 30002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      };

      await botServer.processUpdate(unauthorizedUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Access Denied')
        })
      );
    });

    test('should allow unauthorized users to use /start and /help', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const startUpdate = {
        update_id: 30003,
        message: {
          ...COMMAND_MESSAGES.START_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      };

      await botServer.processUpdate(startUpdate);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('AI Crypto Trading Bot')
        })
      );
    });

    test('should handle malicious input attempts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const maliciousUpdate = {
        update_id: 30004,
        message: SECURITY_SCENARIOS.SQL_INJECTION_ATTEMPT
      };

      await expect(botServer.processUpdate(maliciousUpdate)).resolves.not.toThrow();
    });

    test('should handle XSS attempts safely', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const xssUpdate = {
        update_id: 30005,
        message: SECURITY_SCENARIOS.XSS_ATTEMPT
      };

      await expect(botServer.processUpdate(xssUpdate)).resolves.not.toThrow();
    });

    test('should handle oversized messages gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const largeMessageUpdate = {
        update_id: 30006,
        message: SECURITY_SCENARIOS.LARGE_MESSAGE
      };

      await expect(botServer.processUpdate(largeMessageUpdate)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should handle Telegram API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      await expect(botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE)).resolves.not.toThrow();
    });

    test('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE)).resolves.not.toThrow();
    });

    test('should handle malformed updates gracefully', async () => {
      const malformedUpdate = ERROR_SCENARIOS.MALFORMED_UPDATE as any;
      
      await expect(botServer.processUpdate(malformedUpdate)).resolves.not.toThrow();
    });

    test('should handle empty messages gracefully', async () => {
      const emptyUpdate = ERROR_SCENARIOS.EMPTY_MESSAGE as any;
      
      await expect(botServer.processUpdate(emptyUpdate)).resolves.not.toThrow();
    });

    test('should handle missing user information', async () => {
      const noUserUpdate = {
        update_id: 40001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: undefined
        }
      };

      await expect(botServer.processUpdate(noUserUpdate)).resolves.not.toThrow();
    });
  });

  describe('Message Formatting and Delivery', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should format messages with HTML parse mode', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE);

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.parse_mode).toBe('HTML');
      expect(body.text).toContain('<b>');
    });

    test('should send daily reports with proper formatting', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const mockSignal = {
        symbol: 'BTC/USD',
        action: 'BUY' as const,
        confidence: 85,
        riskReward: 2.5,
        marketRegime: 'BULL' as const,
        reasoning: ['Test reasoning'],
        timestamp: new Date()
      };

      const mockPerformance = {
        dailyPnl: 250.50,
        winRate: 75.5,
        tradesCount: 8
      };

      await botServer.sendDailyReport(MOCK_CHATS.PRIVATE_CHAT.id, mockSignal, mockPerformance);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Daily AI Trading Report')
        })
      );
    });

    test('should send trading alerts with proper formatting', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const mockAlert = {
        type: 'PRICE',
        symbol: 'BTC/USD',
        price: 52000,
        change: 2.5,
        action: 'BUY',
        confidence: 80,
        timeFrame: '1H',
        stopLoss: 50000,
        takeProfit: 55000
      };

      await botServer.sendTradingAlert(MOCK_CHATS.PRIVATE_CHAT.id, mockAlert);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Alert')
        })
      );
    });
  });

  describe('Health Check and Monitoring', () => {
    test('should provide health check information', async () => {
      const health = await botServer.healthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('authorized_users');
      expect(health.authorized_users).toBe(mockConfig.authorizedUsers.length);
    });

    test('should report correct status when running', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      
      const health = await botServer.healthCheck();
      expect(health.status).toBe('running');
    });

    test('should report correct status when stopped', async () => {
      await botServer.stop();
      
      const health = await botServer.healthCheck();
      expect(health.status).toBe('stopped');
    });
  });

  describe('Webhook Processing', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should process single webhook update', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should process edited messages', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate(WEBHOOK_UPDATES.EDITED_MESSAGE);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should ignore updates when bot is stopped', async () => {
      await botServer.stop();

      await botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE);

      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle callback queries', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate(WEBHOOK_UPDATES.CALLBACK_QUERY);

      // Should not process callback queries as regular messages
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await botServer.start();
      jest.clearAllMocks();
    });

    test('should handle concurrent requests efficiently', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const concurrentUpdates = Array.from({ length: 10 }, (_, i) => ({
        update_id: 50000 + i,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          message_id: 3000 + i
        }
      }));

      const startTime = Date.now();
      await Promise.all(concurrentUpdates.map(update => botServer.processUpdate(update)));
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(fetch).toHaveBeenCalledTimes(10);
    });

    test('should process updates within reasonable time', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const startTime = Date.now();
      await botServer.processUpdate(WEBHOOK_UPDATES.SINGLE_MESSAGE);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});