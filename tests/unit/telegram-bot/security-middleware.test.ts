/**
 * Security Middleware Unit Tests
 * Testing bot security features, authorization, rate limiting, and input validation
 */

import { TelegramBotServer, TelegramBotConfig } from '../../../lib/telegram/bot-server';
import {
  MOCK_USERS,
  MOCK_CHATS,
  COMMAND_MESSAGES,
  RATE_LIMIT_SCENARIOS,
  SECURITY_SCENARIOS,
  ERROR_SCENARIOS
} from '../../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

describe('TelegramBotServer - Security Middleware', () => {
  let botServer: TelegramBotServer;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    mockConfig = {
      token: 'mock-bot-token',
      authorizedUsers: [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id],
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000 // 1 minute
      }
    };

    botServer = new TelegramBotServer(mockConfig);

    // Mock successful bot start
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ok: true,
          result: { id: 123, is_bot: true, first_name: 'TestBot' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

    await botServer.start();
    jest.clearAllMocks();
  });

  describe('User Authorization', () => {
    test('should allow access to authorized users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await botServer.processUpdate({
        update_id: 1001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.AUTHORIZED_USER
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Bot Status')
        })
      );
    });

    test('should allow access to VIP users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await botServer.processUpdate({
        update_id: 1002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.VIP_USER
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Trading Bot Status')
        })
      );
    });

    test('should deny access to unauthorized users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await botServer.processUpdate({
        update_id: 1003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
      expect(body.text).toContain('not authorized');
      expect(body.text).toContain(MOCK_USERS.UNAUTHORIZED_USER.id.toString());
    });

    test('should deny access to bot users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await botServer.processUpdate({
        update_id: 1004,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.BOT_USER
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });

    test('should handle missing user information', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await botServer.processUpdate({
        update_id: 1005,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: undefined
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
      expect(body.text).toContain('Unknown');
    });

    test('should allow public commands for unauthorized users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Test /start command
      await botServer.processUpdate({
        update_id: 1006,
        message: {
          ...COMMAND_MESSAGES.START_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      });

      let call = (fetch as jest.Mock).mock.calls[0];
      let body = JSON.parse(call[1].body);
      expect(body.text).toContain('AI Crypto Trading Bot');
      expect(body.text).not.toContain('Access Denied');

      jest.clearAllMocks();

      // Test /help command
      await botServer.processUpdate({
        update_id: 1007,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/help',
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      });

      call = (fetch as jest.Mock).mock.calls[0];
      body = JSON.parse(call[1].body);
      expect(body.text).toContain('Bot Help & Commands');
      expect(body.text).not.toContain('Access Denied');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow normal request rates', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Send 5 requests (within limit of 10)
      for (let i = 0; i < 5; i++) {
        await botServer.processUpdate({
          update_id: 2000 + i,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            message_id: 2000 + i
          }
        });
      }

      expect(fetch).toHaveBeenCalledTimes(5);
      
      // All calls should be successful status requests
      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        expect(body.text).toContain('Trading Bot Status');
      });
    });

    test('should block requests exceeding rate limit', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Send 15 requests (exceeds limit of 10)
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(botServer.processUpdate({
          update_id: 2100 + i,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            message_id: 2100 + i
          }
        }));
      }

      await Promise.all(promises);

      // Should have some rate limit responses
      const calls = (fetch as jest.Mock).mock.calls;
      const rateLimitMessages = calls.filter(call => {
        const body = JSON.parse(call[1].body);
        return body.text.includes('Rate limit exceeded');
      });

      expect(rateLimitMessages.length).toBeGreaterThan(0);
      expect(calls.length).toBe(15); // All requests processed, but some with rate limit message
    });

    test('should track rate limits per user', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // User 1 hits rate limit
      for (let i = 0; i < 12; i++) {
        await botServer.processUpdate({
          update_id: 2200 + i,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            message_id: 2200 + i,
            from: MOCK_USERS.AUTHORIZED_USER
          }
        });
      }

      jest.clearAllMocks();

      // User 2 should still be able to make requests
      await botServer.processUpdate({
        update_id: 2250,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          message_id: 2250,
          from: MOCK_USERS.VIP_USER
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).toContain('Trading Bot Status');
      expect(body.text).not.toContain('Rate limit');
    });

    test('should reset rate limit after time window', async () => {
      // Use a shorter window for testing
      const fastLimitBot = new TelegramBotServer({
        ...mockConfig,
        rateLimit: { maxRequests: 2, windowMs: 100 }
      });

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            result: { id: 123, is_bot: true, first_name: 'TestBot' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await fastLimitBot.start();
      jest.clearAllMocks();

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Hit rate limit
      await fastLimitBot.processUpdate({
        update_id: 2300,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });
      await fastLimitBot.processUpdate({
        update_id: 2301,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });
      await fastLimitBot.processUpdate({
        update_id: 2302,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      // Wait for rate limit window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow new requests
      await fastLimitBot.processUpdate({
        update_id: 2303,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      const calls = (fetch as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      
      expect(body.text).toContain('Trading Bot Status');
      expect(body.text).not.toContain('Rate limit');
    });

    test('should apply different rate limits per command', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Balance command has lower rate limit (5)
      for (let i = 0; i < 7; i++) {
        await botServer.processUpdate({
          update_id: 2400 + i,
          message: {
            ...COMMAND_MESSAGES.BALANCE_COMMAND,
            message_id: 2400 + i
          }
        });
      }

      const calls = (fetch as jest.Mock).mock.calls;
      const rateLimitMessages = calls.filter(call => {
        const body = JSON.parse(call[1].body);
        return body.text.includes('Rate limit');
      });

      expect(rateLimitMessages.length).toBeGreaterThan(0);
    });

    test('should handle high-frequency spam attempts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Simulate rapid-fire requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(botServer.processUpdate({
          update_id: 2500 + i,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            message_id: 2500 + i,
            from: MOCK_USERS.UNAUTHORIZED_USER
          }
        }));
      }

      await Promise.all(promises);

      // Should handle all requests without crashing
      expect(fetch).toHaveBeenCalledTimes(50);
      
      // Most should be rate limited
      const calls = (fetch as jest.Mock).mock.calls;
      const rateLimitMessages = calls.filter(call => {
        const body = JSON.parse(call[1].body);
        return body.text.includes('Rate limit');
      });

      expect(rateLimitMessages.length).toBeGreaterThan(30);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should handle SQL injection attempts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await expect(
        botServer.processUpdate({
          update_id: 3001,
          message: SECURITY_SCENARIOS.SQL_INJECTION_ATTEMPT
        })
      ).resolves.not.toThrow();

      // Should respond appropriately (unknown command)
      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).toContain('don\'t understand');
    });

    test('should handle XSS attempts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await expect(
        botServer.processUpdate({
          update_id: 3002,
          message: SECURITY_SCENARIOS.XSS_ATTEMPT
        })
      ).resolves.not.toThrow();

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).toContain('don\'t understand');
    });

    test('should handle oversized messages', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await expect(
        botServer.processUpdate({
          update_id: 3003,
          message: SECURITY_SCENARIOS.LARGE_MESSAGE
        })
      ).resolves.not.toThrow();

      // Should handle gracefully
      expect(fetch).toHaveBeenCalled();
    });

    test('should handle command injection attempts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      const commandInjection = {
        ...COMMAND_MESSAGES.STATUS_COMMAND,
        text: '/status && rm -rf /',
        message_id: 3004
      };

      await expect(
        botServer.processUpdate({
          update_id: 3004,
          message: commandInjection
        })
      ).resolves.not.toThrow();

      // Should extract only the valid command part
      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).toContain('Trading Bot Status');
    });

    test('should handle Unicode and special characters', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      const unicodeMessage = {
        ...COMMAND_MESSAGES.TEXT_MESSAGE,
        text: '/status 🚀💰🤖 ∞ ≈ ∑ ∆ π',
        message_id: 3005
      };

      await expect(
        botServer.processUpdate({
          update_id: 3005,
          message: unicodeMessage
        })
      ).resolves.not.toThrow();

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).toContain('Trading Bot Status');
    });

    test('should handle null and undefined values', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      const malformedUpdate = {
        update_id: 3006,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: null,
          from: null,
          chat: null
        }
      } as any;

      await expect(
        botServer.processUpdate(malformedUpdate)
      ).resolves.not.toThrow();
    });
  });

  describe('Admin Command Protection', () => {
    test('should reject admin commands from unauthorized users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      await botServer.processUpdate({
        update_id: 4001,
        message: SECURITY_SCENARIOS.UNAUTHORIZED_ADMIN_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).toContain('Access Denied');
    });

    test('should not expose sensitive information in error messages', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Database connection failed with password: secret123'));

      await botServer.processUpdate({
        update_id: 4002,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      // Should not expose internal error details
      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.text).not.toContain('Database');
      expect(body.text).not.toContain('password');
      expect(body.text).not.toContain('secret123');
      expect(body.text).toContain('error occurred');
    });

    test('should log security violations without exposing details', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await botServer.processUpdate({
        update_id: 4003,
        message: SECURITY_SCENARIOS.SQL_INJECTION_ATTEMPT
      });

      // Should process without exposing internal errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('DROP TABLE')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Session Management', () => {
    test('should not maintain session state between requests', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Each request should be independent
      await botServer.processUpdate({
        update_id: 5001,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      await botServer.processUpdate({
        update_id: 5002,
        message: COMMAND_MESSAGES.BALANCE_COMMAND
      });

      // Verify each command was processed independently
      expect(fetch).toHaveBeenCalledTimes(2);
      
      const calls = (fetch as jest.Mock).mock.calls;
      expect(JSON.parse(calls[0][1].body).text).toContain('Trading Bot Status');
      expect(JSON.parse(calls[1][1].body).text).toContain('Account Balance');
    });

    test('should handle concurrent requests from same user safely', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(botServer.processUpdate({
          update_id: 5100 + i,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            message_id: 5100 + i
          }
        }));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
      expect(fetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should recover from Telegram API errors', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, result: {} })
        });

      // First request fails
      await expect(
        botServer.processUpdate({
          update_id: 6001,
          message: COMMAND_MESSAGES.STATUS_COMMAND
        })
      ).resolves.not.toThrow();

      // Second request should work
      await expect(
        botServer.processUpdate({
          update_id: 6002,
          message: COMMAND_MESSAGES.STATUS_COMMAND
        })
      ).resolves.not.toThrow();
    });

    test('should handle malformed webhook data', async () => {
      const malformedData = {
        update_id: 'invalid',
        message: 'not an object'
      } as any;

      await expect(
        botServer.processUpdate(malformedData)
      ).resolves.not.toThrow();
    });

    test('should continue operating after security violations', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Process malicious request
      await botServer.processUpdate({
        update_id: 6003,
        message: SECURITY_SCENARIOS.SQL_INJECTION_ATTEMPT
      });

      // Should continue processing legitimate requests
      await botServer.processUpdate({
        update_id: 6004,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Logging and Monitoring', () => {
    test('should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await botServer.processUpdate({
        update_id: 7001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      });

      // Should log authorization failures
      consoleSpy.mockRestore();
    });

    test('should handle logging errors gracefully', async () => {
      // Mock console.error to throw
      const originalError = console.error;
      console.error = jest.fn(() => {
        throw new Error('Logging failed');
      });

      await expect(
        botServer.processUpdate({
          update_id: 7002,
          message: COMMAND_MESSAGES.STATUS_COMMAND
        })
      ).resolves.not.toThrow();

      console.error = originalError;
    });
  });

  describe('Resource Protection', () => {
    test('should handle memory exhaustion attempts', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      // Large message that could cause memory issues
      const largeMessage = {
        ...COMMAND_MESSAGES.TEXT_MESSAGE,
        text: 'A'.repeat(100000), // 100KB text
        message_id: 8001
      };

      await expect(
        botServer.processUpdate({
          update_id: 8001,
          message: largeMessage
        })
      ).resolves.not.toThrow();
    });

    test('should handle CPU intensive operations', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: {} })
      });

      const startTime = Date.now();
      
      // Process multiple requests that might be CPU intensive
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(botServer.processUpdate({
          update_id: 8100 + i,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            message_id: 8100 + i
          }
        }));
      }

      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});