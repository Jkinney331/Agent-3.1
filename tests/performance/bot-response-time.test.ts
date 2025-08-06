/**
 * Bot Response Time Performance Tests
 * Testing Telegram bot response times, throughput, and performance under load
 */

import { TelegramBotServer, TelegramBotConfig } from '../../lib/telegram/bot-server';
import {
  MOCK_USERS,
  MOCK_CHATS,
  TELEGRAM_API_RESPONSES,
  RATE_LIMIT_SCENARIOS
} from '../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

// Performance metrics collector
interface BotPerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  messageSize?: number;
  userCount?: number;
  error?: Error;
}

class BotPerformanceMonitor {
  private metrics: BotPerformanceMetrics[] = [];

  async measureBotOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: { messageSize?: number; userCount?: number }
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let result: T;
    let error: Error | undefined;

    try {
      result = await fn();
    } catch (e) {
      success = false;
      error = e as Error;
      throw e;
    } finally {
      const endTime = Date.now();
      
      this.metrics.push({
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        messageSize: context?.messageSize,
        userCount: context?.userCount,
        error
      });
    }

    return result!;
  }

  getMetrics(operation?: string): BotPerformanceMetrics[] {
    return operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
  }

  getStats(operation?: string) {
    const metrics = this.getMetrics(operation);
    
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.success).length;

    return {
      count: metrics.length,
      successRate: (successCount / metrics.length) * 100,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p50: this.percentile(durations, 50),
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99)
      },
      throughput: metrics.length / ((Math.max(...metrics.map(m => m.endTime)) - Math.min(...metrics.map(m => m.startTime))) / 1000)
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  clear() {
    this.metrics = [];
  }
}

// Load generation utilities for bot testing
class BotLoadGenerator {
  static generateUserUpdates(userIds: number[], commands: string[], count: number) {
    const updates = [];
    
    for (let i = 0; i < count; i++) {
      const userId = userIds[i % userIds.length];
      const command = commands[i % commands.length];
      
      updates.push({
        update_id: 100000 + i,
        message: {
          message_id: 200000 + i,
          from: userId === MOCK_USERS.AUTHORIZED_USER.id ? MOCK_USERS.AUTHORIZED_USER : MOCK_USERS.VIP_USER,
          chat: { ...MOCK_CHATS.PRIVATE_CHAT, id: userId },
          date: Math.floor(Date.now() / 1000),
          text: command
        }
      });
    }
    
    return updates;
  }

  static generateBurstTraffic(userIds: number[], burstSize: number) {
    const commands = ['/status', '/balance', '/portfolio', '/positions'];
    return this.generateUserUpdates(userIds, commands, burstSize);
  }

  static generateSustainedTraffic(userIds: number[], duration: number, requestsPerSecond: number) {
    const totalRequests = duration * requestsPerSecond;
    const commands = ['/status', '/balance', '/portfolio', '/positions', '/help', '/report'];
    return this.generateUserUpdates(userIds, commands, totalRequests);
  }
}

describe('Bot Response Time Performance', () => {
  let botServer: TelegramBotServer;
  let monitor: BotPerformanceMonitor;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    monitor = new BotPerformanceMonitor();
    
    mockConfig = {
      token: 'mock-performance-token',
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
          result: { id: 123, is_bot: true, first_name: 'PerformanceBot' }
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
    monitor.clear();
  });

  describe('Individual Command Response Times', () => {
    test('should respond to /status command within acceptable time', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const update = {
        update_id: 1001,
        message: {
          message_id: 1001,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      };

      await monitor.measureBotOperation('status-command', async () => {
        return botServer.processUpdate(update);
      });

      const stats = monitor.getStats('status-command');
      
      expect(stats?.duration.avg).toBeLessThan(500); // Under 500ms
      expect(stats?.successRate).toBe(100);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle all commands within performance thresholds', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/start', '/status', '/balance', '/portfolio', '/positions', '/help', '/report', '/alerts'];
      
      for (const command of commands) {
        const update = {
          update_id: Math.floor(Math.random() * 100000),
          message: {
            message_id: Math.floor(Math.random() * 100000),
            from: MOCK_USERS.AUTHORIZED_USER,
            chat: MOCK_CHATS.PRIVATE_CHAT,
            date: Math.floor(Date.now() / 1000),
            text: command
          }
        };

        await monitor.measureBotOperation(`command-${command}`, async () => {
          return botServer.processUpdate(update);
        }, { messageSize: command.length });
      }

      // Verify all commands meet performance requirements
      for (const command of commands) {
        const stats = monitor.getStats(`command-${command}`);
        expect(stats?.duration.avg).toBeLessThan(1000); // Under 1 second
        expect(stats?.successRate).toBe(100);
      }

      expect(fetch).toHaveBeenCalledTimes(commands.length);
    });

    test('should handle unauthorized commands quickly', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const update = {
        update_id: 2001,
        message: {
          message_id: 2001,
          from: MOCK_USERS.UNAUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      };

      await monitor.measureBotOperation('unauthorized-command', async () => {
        return botServer.processUpdate(update);
      });

      const stats = monitor.getStats('unauthorized-command');
      
      expect(stats?.duration.avg).toBeLessThan(200); // Should be very fast (no complex processing)
      expect(stats?.successRate).toBe(100);
      
      const call = (fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(call[1].body).text).toContain('Access Denied');
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle moderate concurrent load efficiently', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const concurrentUsers = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
      const concurrentUpdates = BotLoadGenerator.generateBurstTraffic(concurrentUsers, 20);

      const startTime = Date.now();
      
      const promises = concurrentUpdates.map((update, index) => 
        monitor.measureBotOperation('concurrent-request', async () => {
          return botServer.processUpdate(update);
        }, { userCount: concurrentUsers.length })
      );

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const stats = monitor.getStats('concurrent-request');
      
      expect(stats?.count).toBe(20);
      expect(stats?.successRate).toBe(100);
      expect(stats?.duration.p95).toBeLessThan(2000); // 95th percentile under 2 seconds
      expect(totalTime).toBeLessThan(5000); // Total processing under 5 seconds
      expect(stats?.throughput).toBeGreaterThan(4); // At least 4 requests per second
    });

    test('should handle high concurrent load with graceful degradation', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const concurrentUsers = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
      const highLoadUpdates = BotLoadGenerator.generateBurstTraffic(concurrentUsers, 100);

      const promises = highLoadUpdates.map((update, index) => 
        monitor.measureBotOperation('high-load', async () => {
          return botServer.processUpdate(update);
        })
      );

      await Promise.all(promises);

      const stats = monitor.getStats('high-load');
      
      expect(stats?.count).toBe(100);
      expect(stats?.successRate).toBeGreaterThan(90); // At least 90% success rate under high load
      expect(stats?.duration.p99).toBeLessThan(5000); // 99th percentile under 5 seconds
      expect(stats?.throughput).toBeGreaterThan(10); // Maintain reasonable throughput
    });

    test('should maintain response quality under concurrent load', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const concurrentUsers = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
      const commands = ['/status', '/balance', '/portfolio'];
      const updates = BotLoadGenerator.generateUserUpdates(concurrentUsers, commands, 30);

      const promises = updates.map(update => 
        monitor.measureBotOperation('quality-check', async () => {
          return botServer.processUpdate(update);
        })
      );

      await Promise.all(promises);

      const stats = monitor.getStats('quality-check');
      
      expect(stats?.successRate).toBe(100);
      
      // Verify response quality
      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        expect(body.text).not.toContain('undefined');
        expect(body.text).not.toContain('null');
        expect(body.parse_mode).toBe('HTML');
        expect(body.text.length).toBeGreaterThan(50); // Meaningful response length
      });
    });
  });

  describe('Rate Limiting Performance', () => {
    test('should apply rate limiting without significant performance impact', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Configure strict rate limiting for testing
      const strictBot = new TelegramBotServer({
        ...mockConfig,
        rateLimit: { maxRequests: 5, windowMs: 10000 }
      });

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            result: { id: 123, is_bot: true, first_name: 'RateLimitBot' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await strictBot.start();
      jest.clearAllMocks();

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Send requests that will hit rate limit
      const rapidUpdates = Array.from({ length: 10 }, (_, i) => ({
        update_id: 3000 + i,
        message: {
          message_id: 3000 + i,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      }));

      const promises = rapidUpdates.map((update, index) => 
        monitor.measureBotOperation('rate-limit-test', async () => {
          return strictBot.processUpdate(update);
        })
      );

      await Promise.all(promises);

      const stats = monitor.getStats('rate-limit-test');
      
      expect(stats?.count).toBe(10);
      expect(stats?.successRate).toBe(100); // All processed, some with rate limit messages
      expect(stats?.duration.max).toBeLessThan(1000); // Even rate limiting is fast
      
      await strictBot.stop();
    });

    test('should handle rate limit recovery efficiently', async () => {
      // Use a very short window for testing
      const fastRecoveryBot = new TelegramBotServer({
        ...mockConfig,
        rateLimit: { maxRequests: 2, windowMs: 500 }
      });

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            result: { id: 123, is_bot: true, first_name: 'RecoveryBot' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true })
        });

      await fastRecoveryBot.start();
      jest.clearAllMocks();

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Hit rate limit
      const update1 = {
        update_id: 4001,
        message: {
          message_id: 4001,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      };

      await fastRecoveryBot.processUpdate(update1);
      await fastRecoveryBot.processUpdate({ ...update1, update_id: 4002, message: { ...update1.message, message_id: 4002 } });
      await fastRecoveryBot.processUpdate({ ...update1, update_id: 4003, message: { ...update1.message, message_id: 4003 } }); // Should be rate limited

      // Wait for rate limit to reset
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should work again
      await monitor.measureBotOperation('rate-limit-recovery', async () => {
        return fastRecoveryBot.processUpdate({ ...update1, update_id: 4004, message: { ...update1.message, message_id: 4004 } });
      });

      const stats = monitor.getStats('rate-limit-recovery');
      
      expect(stats?.duration.avg).toBeLessThan(500);
      expect(stats?.successRate).toBe(100);
      
      await fastRecoveryBot.stop();
    });
  });

  describe('Sustained Load Performance', () => {
    test('should handle sustained traffic without performance degradation', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const sustainedDuration = 20; // 20 seconds worth of requests
      const requestsPerSecond = 5;
      const totalRequests = sustainedDuration * requestsPerSecond;

      const users = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
      const sustainedUpdates = BotLoadGenerator.generateSustainedTraffic(users, sustainedDuration, requestsPerSecond);

      const startTime = Date.now();
      
      // Process requests with realistic timing
      for (let i = 0; i < sustainedUpdates.length; i++) {
        const update = sustainedUpdates[i];
        
        await monitor.measureBotOperation('sustained-load', async () => {
          return botServer.processUpdate(update);
        });

        // Simulate realistic request spacing
        if (i < sustainedUpdates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms between requests
        }
      }

      const totalTime = Date.now() - startTime;
      const stats = monitor.getStats('sustained-load');

      expect(stats?.count).toBe(totalRequests);
      expect(stats?.successRate).toBeGreaterThan(95);
      
      // Check for performance degradation over time
      const firstQuarter = monitor.getMetrics('sustained-load').slice(0, Math.floor(totalRequests / 4));
      const lastQuarter = monitor.getMetrics('sustained-load').slice(-Math.floor(totalRequests / 4));
      
      const firstQuarterAvg = firstQuarter.reduce((sum, m) => sum + m.duration, 0) / firstQuarter.length;
      const lastQuarterAvg = lastQuarter.reduce((sum, m) => sum + m.duration, 0) / lastQuarter.length;
      
      // Performance should not degrade significantly
      expect(lastQuarterAvg / firstQuarterAvg).toBeLessThan(1.5); // Less than 50% degradation
    });

    test('should maintain throughput under continuous load', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const continuousRequests = 50;
      const users = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
      const commands = ['/status', '/balance'];
      
      const updates = BotLoadGenerator.generateUserUpdates(users, commands, continuousRequests);

      const startTime = Date.now();
      
      const promises = updates.map((update, index) => {
        return new Promise(resolve => {
          setTimeout(async () => {
            await monitor.measureBotOperation('throughput-test', async () => {
              return botServer.processUpdate(update);
            });
            resolve(undefined);
          }, index * 100); // Stagger requests by 100ms
        });
      });

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const stats = monitor.getStats('throughput-test');
      
      expect(stats?.count).toBe(continuousRequests);
      expect(stats?.successRate).toBeGreaterThan(95);
      expect(stats?.throughput).toBeGreaterThan(8); // At least 8 requests per second
      expect(totalTime).toBeLessThan(8000); // Complete within 8 seconds
    });
  });

  describe('Memory and Resource Performance', () => {
    test('should not cause memory leaks during extended operation', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const iterations = 100;
      const memorySnapshots = [];

      for (let i = 0; i < iterations; i++) {
        const update = {
          update_id: 5000 + i,
          message: {
            message_id: 5000 + i,
            from: MOCK_USERS.AUTHORIZED_USER,
            chat: MOCK_CHATS.PRIVATE_CHAT,
            date: Math.floor(Date.now() / 1000),
            text: '/status'
          }
        };

        await botServer.processUpdate(update);

        if (i % 20 === 0) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      // Memory should not continuously increase
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryIncrease = lastSnapshot - firstSnapshot;
      
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });

    test('should handle resource cleanup properly', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Process many requests
      const heavyUpdates = Array.from({ length: 200 }, (_, i) => ({
        update_id: 6000 + i,
        message: {
          message_id: 6000 + i,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/portfolio' // More complex command
        }
      }));

      for (const update of heavyUpdates) {
        await botServer.processUpdate(update);
      }

      // Force cleanup
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDifference = finalMemory - initialMemory;

      expect(memoryDifference).toBeLessThan(20 * 1024 * 1024); // Less than 20MB difference
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors without impacting overall performance', async () => {
      // Mix of successful and failing requests
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        })
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        })
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        });

      const mixedUpdates = Array.from({ length: 10 }, (_, i) => ({
        update_id: 7000 + i,
        message: {
          message_id: 7000 + i,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      }));

      const promises = mixedUpdates.map(update => 
        monitor.measureBotOperation('error-handling', async () => {
          return botServer.processUpdate(update);
        })
      );

      await Promise.all(promises);

      const stats = monitor.getStats('error-handling');
      
      expect(stats?.count).toBe(10);
      expect(stats?.successRate).toBe(100); // Bot should handle all updates, even if API fails
      expect(stats?.duration.max).toBeLessThan(2000); // Error handling should be fast
    });

    test('should recover quickly from API failures', async () => {
      // Simulate API failure then recovery
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
        });

      const recoveryUpdates = Array.from({ length: 5 }, (_, i) => ({
        update_id: 8000 + i,
        message: {
          message_id: 8000 + i,
          from: MOCK_USERS.AUTHORIZED_USER,
          chat: MOCK_CHATS.PRIVATE_CHAT,
          date: Math.floor(Date.now() / 1000),
          text: '/status'
        }
      }));

      for (const update of recoveryUpdates) {
        await monitor.measureBotOperation('recovery-test', async () => {
          return botServer.processUpdate(update);
        });
      }

      const stats = monitor.getStats('recovery-test');
      
      expect(stats?.count).toBe(5);
      expect(stats?.successRate).toBe(100);
      
      // Later requests should be fast after recovery
      const laterRequests = monitor.getMetrics('recovery-test').slice(-2);
      const avgLaterDuration = laterRequests.reduce((sum, m) => sum + m.duration, 0) / laterRequests.length;
      
      expect(avgLaterDuration).toBeLessThan(500);
    });
  });

  describe('Performance Benchmarks and SLA', () => {
    test('should meet response time SLA requirements', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const slaTests = [
        { command: '/status', maxResponse: 500 },
        { command: '/balance', maxResponse: 800 },
        { command: '/portfolio', maxResponse: 1000 },
        { command: '/positions', maxResponse: 1000 },
        { command: '/help', maxResponse: 300 },
        { command: '/start', maxResponse: 500 }
      ];

      for (const test of slaTests) {
        const update = {
          update_id: Math.floor(Math.random() * 100000),
          message: {
            message_id: Math.floor(Math.random() * 100000),
            from: MOCK_USERS.AUTHORIZED_USER,
            chat: MOCK_CHATS.PRIVATE_CHAT,
            date: Math.floor(Date.now() / 1000),
            text: test.command
          }
        };

        await monitor.measureBotOperation(`sla-${test.command}`, async () => {
          return botServer.processUpdate(update);
        });

        const stats = monitor.getStats(`sla-${test.command}`);
        expect(stats?.duration.avg).toBeLessThan(test.maxResponse);
      }
    });

    test('should achieve target throughput benchmarks', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const benchmarkRequests = 100;
      const users = [MOCK_USERS.AUTHORIZED_USER.id, MOCK_USERS.VIP_USER.id];
      const commands = ['/status', '/balance', '/help'];
      
      const updates = BotLoadGenerator.generateUserUpdates(users, commands, benchmarkRequests);

      const startTime = Date.now();
      
      const promises = updates.map(update => 
        monitor.measureBotOperation('throughput-benchmark', async () => {
          return botServer.processUpdate(update);
        })
      );

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const stats = monitor.getStats('throughput-benchmark');
      
      expect(stats?.count).toBe(benchmarkRequests);
      expect(stats?.successRate).toBeGreaterThan(98); // At least 98% success rate
      expect(stats?.throughput).toBeGreaterThan(20); // At least 20 requests per second
      expect(stats?.duration.p95).toBeLessThan(2000); // 95th percentile under 2 seconds
      expect(totalTime).toBeLessThan(8000); // Complete within 8 seconds
    });
  });
});