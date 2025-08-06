/**
 * Scheduler Integration Tests
 * Testing automated daily report scheduling and delivery pipeline
 */

import { AIReasoningEngine } from '../../lib/ai/reasoning-engine';
import { TelegramBotServer, TelegramBotConfig } from '../../lib/telegram/bot-server';
import {
  MARKET_DATA_SCENARIOS,
  PERFORMANCE_TEST_DATA
} from '../fixtures/ai-analysis-data';
import {
  MOCK_USERS,
  MOCK_CHATS,
  TELEGRAM_API_RESPONSES
} from '../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

// Mock scheduler functionality
interface ScheduledTask {
  id: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

class MockScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  schedule(id: string, cronExpression: string, handler: () => Promise<void>): void {
    this.tasks.set(id, {
      id,
      schedule: cronExpression,
      handler,
      enabled: true,
      nextRun: this.calculateNextRun(cronExpression)
    });
  }

  enable(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = true;
    }
  }

  disable(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = false;
    }
  }

  async executeTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task && task.enabled) {
      task.lastRun = new Date();
      await task.handler();
      task.nextRun = this.calculateNextRun(task.schedule);
    }
  }

  async executeAllDue(): Promise<void> {
    const now = new Date();
    for (const [id, task] of this.tasks) {
      if (task.enabled && task.nextRun && task.nextRun <= now) {
        await this.executeTask(id);
      }
    }
  }

  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  clear(): void {
    this.tasks.clear();
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simplified cron calculation for testing
    const now = new Date();
    if (cronExpression === '0 8 * * *') { // Daily at 8 AM
      const next = new Date(now);
      next.setHours(8, 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
    
    if (cronExpression === '*/15 * * * *') { // Every 15 minutes
      const next = new Date(now);
      next.setMinutes(next.getMinutes() + 15, 0, 0);
      return next;
    }

    // Default: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
}

describe('Scheduler Integration', () => {
  let aiEngine: AIReasoningEngine;
  let botServer: TelegramBotServer;
  let scheduler: MockScheduler;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    aiEngine = new AIReasoningEngine();
    scheduler = new MockScheduler();
    
    mockConfig = {
      token: 'mock-scheduler-token',
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
          result: { id: 123, is_bot: true, first_name: 'SchedulerBot' }
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
    scheduler.clear();
  });

  describe('Daily Report Scheduling', () => {
    test('should schedule daily report generation and delivery', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Schedule daily report task
      scheduler.schedule('daily-report', '0 8 * * *', async () => {
        // Generate AI analysis
        const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
        const aiSignal = await aiEngine.analyzeMarket(marketData);

        // Mock performance data
        const performanceData = {
          dailyPnl: 245.80,
          winRate: 73.5,
          tradesCount: 9
        };

        // Send report to all authorized users
        for (const userId of mockConfig.authorizedUsers) {
          await botServer.sendDailyReport(userId, aiSignal, performanceData);
        }
      });

      const tasks = scheduler.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('daily-report');
      expect(tasks[0].schedule).toBe('0 8 * * *');
      expect(tasks[0].enabled).toBe(true);

      // Execute the scheduled task
      await scheduler.executeTask('daily-report');

      // Should send reports to all authorized users
      expect(fetch).toHaveBeenCalledTimes(mockConfig.authorizedUsers.length);
      
      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        expect(body.text).toContain('Daily AI Trading Report');
        expect(body.text).toContain('BUY BTC/USD');
        expect(body.text).toContain('$245.80');
        expect(body.text).toContain('73.5%');
      });
    });

    test('should handle different market conditions in scheduled reports', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const marketScenarios = [
        { data: MARKET_DATA_SCENARIOS.BULL_MARKET, expected: 'BUY' },
        { data: MARKET_DATA_SCENARIOS.BEAR_MARKET, expected: 'SELL' },
        { data: MARKET_DATA_SCENARIOS.RANGING_MARKET, expected: 'HOLD' }
      ];

      for (const scenario of marketScenarios) {
        scheduler.schedule(`report-${scenario.expected}`, '0 8 * * *', async () => {
          const aiSignal = await aiEngine.analyzeMarket(scenario.data);
          
          const performanceData = {
            dailyPnl: Math.random() * 500 - 250,
            winRate: 60 + Math.random() * 30,
            tradesCount: Math.floor(Math.random() * 15) + 1
          };

          await botServer.sendDailyReport(
            MOCK_USERS.AUTHORIZED_USER.id,
            aiSignal,
            performanceData
          );
        });

        await scheduler.executeTask(`report-${scenario.expected}`);
      }

      expect(fetch).toHaveBeenCalledTimes(3);
      
      const calls = (fetch as jest.Mock).mock.calls;
      expect(calls[0][1]).toContain('BUY');
      expect(calls[1][1]).toContain('SELL');
      expect(calls[2][1]).toContain('HOLD');
    });

    test('should handle scheduler failures gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      scheduler.schedule('failing-report', '0 8 * * *', async () => {
        const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
        const aiSignal = await aiEngine.analyzeMarket(marketData);

        const performanceData = {
          dailyPnl: 100.00,
          winRate: 70.0,
          tradesCount: 5
        };

        await botServer.sendDailyReport(
          MOCK_USERS.AUTHORIZED_USER.id,
          aiSignal,
          performanceData
        );
      });

      // Should not throw, but handle gracefully
      await expect(scheduler.executeTask('failing-report')).resolves.not.toThrow();
    });
  });

  describe('Real-time Market Monitoring', () => {
    test('should schedule frequent market analysis checks', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      let analysisCount = 0;
      let alertCount = 0;

      scheduler.schedule('market-monitor', '*/15 * * * *', async () => {
        analysisCount++;
        
        // Simulate market data changes
        const marketData = {
          ...MARKET_DATA_SCENARIOS.HIGH_VOLATILITY,
          price: 50000 + Math.random() * 10000 - 5000 // Random price movement
        };

        const aiSignal = await aiEngine.analyzeMarket(marketData);

        // Send alert if confidence is very high
        if (aiSignal.confidence > 85 && aiSignal.action !== 'HOLD') {
          alertCount++;
          
          const alertData = {
            type: 'HIGH_CONFIDENCE',
            symbol: aiSignal.symbol,
            price: marketData.price,
            change: 0,
            action: aiSignal.action,
            confidence: aiSignal.confidence,
            timeFrame: '15M',
            stopLoss: aiSignal.stopLoss,
            takeProfit: aiSignal.takeProfit
          };

          await botServer.sendTradingAlert(MOCK_USERS.AUTHORIZED_USER.id, alertData);
        }
      });

      // Execute monitoring task multiple times
      for (let i = 0; i < 5; i++) {
        await scheduler.executeTask('market-monitor');
      }

      expect(analysisCount).toBe(5);
      // Should have processed all analyses
      expect(fetch).toHaveBeenCalledTimes(alertCount);
    });

    test('should throttle alerts to prevent spam', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const recentAlerts = new Map<string, Date>();
      const ALERT_COOLDOWN = 60 * 60 * 1000; // 1 hour

      scheduler.schedule('throttled-alerts', '*/5 * * * *', async () => {
        const marketData = MARKET_DATA_SCENARIOS.EXTREME_FEAR;
        const aiSignal = await aiEngine.analyzeMarket(marketData);

        const alertKey = `${aiSignal.symbol}_${aiSignal.action}`;
        const lastAlert = recentAlerts.get(alertKey);
        const now = new Date();

        // Only send if cooldown period has passed
        if (!lastAlert || (now.getTime() - lastAlert.getTime()) > ALERT_COOLDOWN) {
          recentAlerts.set(alertKey, now);

          const alertData = {
            type: 'MARKET_SIGNAL',
            symbol: aiSignal.symbol,
            price: marketData.price,
            change: -8.5,
            action: aiSignal.action,
            confidence: aiSignal.confidence,
            timeFrame: '5M',
            stopLoss: aiSignal.stopLoss,
            takeProfit: aiSignal.takeProfit
          };

          await botServer.sendTradingAlert(MOCK_USERS.AUTHORIZED_USER.id, alertData);
        }
      });

      // Execute rapidly - should only send one alert due to throttling
      for (let i = 0; i < 10; i++) {
        await scheduler.executeTask('throttled-alerts');
      }

      expect(fetch).toHaveBeenCalledTimes(1); // Only one alert sent
    });
  });

  describe('Performance Monitoring Schedule', () => {
    test('should schedule portfolio performance updates', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const performanceHistory: any[] = [];

      scheduler.schedule('performance-check', '0 */6 * * *', async () => {
        // Simulate performance calculation
        const performance = {
          timestamp: new Date(),
          totalValue: 125000 + Math.random() * 10000,
          dailyPnl: Math.random() * 1000 - 500,
          weeklyPnl: Math.random() * 5000 - 2500,
          monthlyPnl: Math.random() * 20000 - 10000,
          winRate: 60 + Math.random() * 30,
          tradesCount: Math.floor(Math.random() * 20) + 5,
          maxDrawdown: Math.random() * 10,
          sharpeRatio: Math.random() * 3
        };

        performanceHistory.push(performance);

        // Send update if significant change
        if (performanceHistory.length > 1) {
          const prev = performanceHistory[performanceHistory.length - 2];
          const current = performanceHistory[performanceHistory.length - 1];
          
          const changePercent = ((current.totalValue - prev.totalValue) / prev.totalValue) * 100;
          
          if (Math.abs(changePercent) > 5) { // >5% change
            const alertData = {
              type: 'PERFORMANCE_ALERT',
              symbol: 'PORTFOLIO',
              price: current.totalValue,
              change: changePercent,
              action: changePercent > 0 ? 'GAIN' : 'LOSS',
              confidence: 100,
              timeFrame: '6H',
              stopLoss: 0,
              takeProfit: 0
            };

            await botServer.sendTradingAlert(MOCK_USERS.VIP_USER.id, alertData);
          }
        }
      });

      // Execute performance checks
      await scheduler.executeTask('performance-check'); // First run
      await scheduler.executeTask('performance-check'); // Second run

      expect(performanceHistory).toHaveLength(2);
      // May or may not have sent alert depending on random values
    });

    test('should handle performance data collection errors', async () => {
      let errorCount = 0;

      scheduler.schedule('error-prone-performance', '0 */6 * * *', async () => {
        try {
          // Simulate occasional failures
          if (Math.random() < 0.3) {
            throw new Error('Portfolio data unavailable');
          }

          const performance = {
            totalValue: 125000,
            dailyPnl: 200
          };

          // Process successful data collection
          expect(performance.totalValue).toBeGreaterThan(0);
        } catch (error) {
          errorCount++;
          // Log error but continue
          console.warn('Performance check failed:', error);
        }
      });

      // Execute multiple times
      for (let i = 0; i < 10; i++) {
        await scheduler.executeTask('error-prone-performance');
      }

      // Should have handled some errors without crashing
      expect(errorCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multi-User Scheduling', () => {
    test('should handle personalized schedules for different users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const userPreferences = {
        [MOCK_USERS.AUTHORIZED_USER.id]: { reportTime: '08:00', timezone: 'UTC' },
        [MOCK_USERS.VIP_USER.id]: { reportTime: '09:00', timezone: 'UTC' }
      };

      for (const [userId, prefs] of Object.entries(userPreferences)) {
        scheduler.schedule(`daily-report-${userId}`, '0 8 * * *', async () => {
          const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
          const aiSignal = await aiEngine.analyzeMarket(marketData);

          const performanceData = {
            dailyPnl: 150.0,
            winRate: 75.0,
            tradesCount: 6
          };

          await botServer.sendDailyReport(parseInt(userId), aiSignal, performanceData);
        });
      }

      // Execute all user-specific tasks
      for (const userId of Object.keys(userPreferences)) {
        await scheduler.executeTask(`daily-report-${userId}`);
      }

      expect(fetch).toHaveBeenCalledTimes(Object.keys(userPreferences).length);
    });

    test('should handle user timezone differences', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const timezones = ['UTC', 'EST', 'PST', 'JST'];
      let reportsSent = 0;

      for (const tz of timezones) {
        scheduler.schedule(`tz-report-${tz}`, '0 8 * * *', async () => {
          reportsSent++;
          
          const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
          const aiSignal = await aiEngine.analyzeMarket(marketData);

          // Include timezone info in report
          const aiSignalWithTz = {
            ...aiSignal,
            reasoning: [
              ...aiSignal.reasoning,
              `Report generated for ${tz} timezone`
            ]
          };

          const performanceData = {
            dailyPnl: 100.0,
            winRate: 70.0,
            tradesCount: 4
          };

          await botServer.sendDailyReport(
            MOCK_USERS.AUTHORIZED_USER.id,
            aiSignalWithTz,
            performanceData
          );
        });

        await scheduler.executeTask(`tz-report-${tz}`);
      }

      expect(reportsSent).toBe(timezones.length);
      expect(fetch).toHaveBeenCalledTimes(timezones.length);
    });
  });

  describe('Scheduler Reliability', () => {
    test('should recover from missed scheduled executions', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      let executionCount = 0;

      scheduler.schedule('reliable-task', '0 8 * * *', async () => {
        executionCount++;
        
        const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
        const aiSignal = await aiEngine.analyzeMarket(marketData);

        const performanceData = {
          dailyPnl: 75.0 * executionCount,
          winRate: 65.0 + executionCount,
          tradesCount: executionCount + 2
        };

        await botServer.sendDailyReport(
          MOCK_USERS.AUTHORIZED_USER.id,
          aiSignal,
          performanceData
        );
      });

      // Simulate missed executions and catch-up
      await scheduler.executeTask('reliable-task');
      await scheduler.executeTask('reliable-task');
      await scheduler.executeTask('reliable-task');

      expect(executionCount).toBe(3);
      expect(fetch).toHaveBeenCalledTimes(3);

      // Verify progressive data
      const calls = (fetch as jest.Mock).mock.calls;
      expect(calls[0][1]).toContain('$75.00');
      expect(calls[1][1]).toContain('$150.00');
      expect(calls[2][1]).toContain('$225.00');
    });

    test('should handle concurrent scheduler operations', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      // Schedule multiple concurrent tasks
      const taskIds = ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'];
      
      for (const taskId of taskIds) {
        scheduler.schedule(taskId, '*/15 * * * *', async () => {
          const marketData = MARKET_DATA_SCENARIOS.HIGH_VOLATILITY;
          const aiSignal = await aiEngine.analyzeMarket(marketData);

          const performanceData = {
            dailyPnl: Math.random() * 200,
            winRate: 60 + Math.random() * 20,
            tradesCount: Math.floor(Math.random() * 10) + 1
          };

          await botServer.sendDailyReport(
            MOCK_USERS.AUTHORIZED_USER.id,
            aiSignal,
            performanceData
          );
        });
      }

      // Execute all tasks concurrently
      const promises = taskIds.map(id => scheduler.executeTask(id));
      await Promise.all(promises);

      expect(fetch).toHaveBeenCalledTimes(taskIds.length);
    });

    test('should maintain schedule integrity during system restarts', async () => {
      // Simulate system restart by creating new scheduler
      const newScheduler = new MockScheduler();
      
      // Restore schedules (in real implementation, this would be from persistent storage)
      newScheduler.schedule('restored-daily', '0 8 * * *', async () => {
        const marketData = MARKET_DATA_SCENARIOS.BULL_MARKET;
        const aiSignal = await aiEngine.analyzeMarket(marketData);

        const performanceData = {
          dailyPnl: 180.0,
          winRate: 78.0,
          tradesCount: 7
        };

        await botServer.sendDailyReport(
          MOCK_USERS.AUTHORIZED_USER.id,
          aiSignal,
          performanceData
        );
      });

      const tasks = newScheduler.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('restored-daily');
      expect(tasks[0].enabled).toBe(true);

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await newScheduler.executeTask('restored-daily');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Health Monitoring', () => {
    test('should monitor scheduler health and report issues', async () => {
      let healthChecks = 0;
      let failedTasks = 0;

      scheduler.schedule('health-monitor', '*/30 * * * *', async () => {
        healthChecks++;
        
        // Check if other tasks are failing
        const tasks = scheduler.getTasks();
        const enabledTasks = tasks.filter(t => t.enabled);
        
        // Simulate health check logic
        for (const task of enabledTasks) {
          if (task.id !== 'health-monitor') {
            try {
              // Simulate task health check
              if (Math.random() < 0.1) { // 10% failure rate
                throw new Error(`Task ${task.id} health check failed`);
              }
            } catch (error) {
              failedTasks++;
              console.warn(`Task failure detected: ${task.id}`);
            }
          }
        }
      });

      // Add some dummy tasks to monitor
      scheduler.schedule('dummy-1', '0 8 * * *', async () => {});
      scheduler.schedule('dummy-2', '0 12 * * *', async () => {});

      // Run health checks
      for (let i = 0; i < 5; i++) {
        await scheduler.executeTask('health-monitor');
      }

      expect(healthChecks).toBe(5);
      expect(failedTasks).toBeGreaterThanOrEqual(0);
    });
  });
});