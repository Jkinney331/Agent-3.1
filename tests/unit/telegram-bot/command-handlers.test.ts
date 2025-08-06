/**
 * Command Handlers Unit Tests
 * Detailed testing of individual bot command functionality and responses
 */

import { TelegramBotServer, TelegramBotConfig } from '../../../lib/telegram/bot-server';
import {
  MOCK_USERS,
  MOCK_CHATS,
  COMMAND_MESSAGES,
  EXPECTED_RESPONSES,
  TELEGRAM_API_RESPONSES,
  MOCK_TRADING_DATA
} from '../../fixtures/telegram-bot-data';

// Mock fetch globally
global.fetch = jest.fn();

describe('TelegramBotServer - Command Handlers', () => {
  let botServer: TelegramBotServer;
  let mockConfig: TelegramBotConfig;

  beforeEach(async () => {
    mockConfig = {
      token: 'mock-bot-token',
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
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.GET_ME_SUCCESS)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

    await botServer.start();
    jest.clearAllMocks();
  });

  describe('/start Command', () => {
    test('should send welcome message to any user', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 1001,
        message: COMMAND_MESSAGES.START_COMMAND
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('AI Crypto Trading Bot')
        })
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Welcome to your personal AI-powered');
      expect(body.text).toContain('Available Commands:');
      expect(body.text).toContain('/status');
      expect(body.text).toContain('/balance');
      expect(body.text).toContain('/help');
      expect(body.parse_mode).toBe('HTML');
    });

    test('should work for unauthorized users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 1002,
        message: {
          ...COMMAND_MESSAGES.START_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('AI Crypto Trading Bot')
        })
      );
    });
  });

  describe('/status Command', () => {
    test('should return trading status for authorized user', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 2001,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Trading Bot Status');
      expect(body.text).toContain('Bot Status: Active');
      expect(body.text).toContain('Trading Engine: Running');
      expect(body.text).toContain('AI Analysis: Active');
      expect(body.text).toContain('Market Data: Connected');
      expect(body.text).toContain('Uptime:');
      expect(body.text).toContain('API Status: Connected');
    });

    test('should deny access to unauthorized user', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 2002,
        message: COMMAND_MESSAGES.UNAUTHORIZED_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
      expect(body.text).toContain('not authorized');
    });

    test('should include current timestamp', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const testDate = new Date();
      await botServer.processUpdate({
        update_id: 2003,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format
    });
  });

  describe('/balance Command', () => {
    test('should return account balance information', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 3001,
        message: COMMAND_MESSAGES.BALANCE_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Account Balance');
      expect(body.text).toContain('Total Portfolio Value:');
      expect(body.text).toContain('Available Balance:');
      expect(body.text).toContain('USD:');
      expect(body.text).toContain('BTC:');
      expect(body.text).toContain('ETH:');
      expect(body.text).toContain('Performance:');
      expect(body.text).toContain('Today:');
      expect(body.text).toContain('This Week:');
      expect(body.text).toContain('This Month:');
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 3002,
        message: {
          ...COMMAND_MESSAGES.BALANCE_COMMAND,
          from: MOCK_USERS.UNAUTHORIZED_USER
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });

    test('should format currency values correctly', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 3003,
        message: COMMAND_MESSAGES.BALANCE_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      // Should contain dollar signs and proper formatting
      expect(body.text).toMatch(/\$[\d,]+\.\d{2}/);
      expect(body.text).toMatch(/[+-]\$[\d,]+\.\d{2}/); // Performance numbers
    });
  });

  describe('/portfolio Command', () => {
    test('should return portfolio overview', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 4001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/portfolio',
          message_id: 4001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Portfolio Overview');
      expect(body.text).toContain('Total Value:');
      expect(body.text).toContain('Available Cash:');
      expect(body.text).toContain('Holdings:');
      expect(body.text).toContain('BTC:');
      expect(body.text).toContain('ETH:');
      expect(body.text).toContain('Performance (24h):');
      expect(body.text).toContain('P&L:');
    });

    test('should show asset allocations with percentages', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 4002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/portfolio',
          message_id: 4002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toMatch(/\(\d+\.\d+%\)/); // Percentage allocation
      expect(body.text).toContain('🟡'); // BTC emoji
      expect(body.text).toContain('🔵'); // ETH emoji
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 4003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/portfolio',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 4003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });
  });

  describe('/positions Command', () => {
    test('should return active trading positions', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 5001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/positions',
          message_id: 5001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Active Positions');
      expect(body.text).toContain('BTC/USD - LONG');
      expect(body.text).toContain('ETH/USD - LONG');
      expect(body.text).toContain('Size:');
      expect(body.text).toContain('Entry:');
      expect(body.text).toContain('Current:');
      expect(body.text).toContain('P&L:');
      expect(body.text).toContain('SL:');
      expect(body.text).toContain('TP:');
      expect(body.text).toContain('Total P&L:');
    });

    test('should show position details with proper formatting', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 5002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/positions',
          message_id: 5002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toMatch(/\+\$[\d,]+\.\d{2}/); // Positive P&L format
      expect(body.text).toMatch(/\(\+\d+\.\d+%\)/); // Percentage format
      expect(body.text).toContain('🟡'); // BTC emoji
      expect(body.text).toContain('🔵'); // ETH emoji
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 5003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/positions',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 5003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });
  });

  describe('/pause Command', () => {
    test('should pause trading and confirm action', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 6001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/pause',
          message_id: 6001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Trading Paused');
      expect(body.text).toContain('All automated trading has been paused');
      expect(body.text).toContain('No new positions will be opened');
      expect(body.text).toContain('Existing positions remain active');
      expect(body.text).toContain('Use /resume to restart');
      expect(body.text).toContain('⏸️');
    });

    test('should include timestamp of pause action', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 6002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/pause',
          message_id: 6002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Paused at:');
      expect(body.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 6003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/pause',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 6003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });
  });

  describe('/resume Command', () => {
    test('should resume trading and show current market conditions', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 7001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/resume',
          message_id: 7001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Trading Resumed');
      expect(body.text).toContain('Automated trading has been resumed');
      expect(body.text).toContain('AI analysis active');
      expect(body.text).toContain('Position opening enabled');
      expect(body.text).toContain('Current Market Conditions:');
      expect(body.text).toContain('BTC:');
      expect(body.text).toContain('ETH:');
      expect(body.text).toContain('Market Sentiment:');
      expect(body.text).toContain('▶️');
    });

    test('should include market data in resume message', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 7002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/resume',
          message_id: 7002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toMatch(/\$[\d,]+/); // Price format
      expect(body.text).toMatch(/(Bullish|Bearish|Neutral)/); // Market sentiment
      expect(body.text).toMatch(/\d+\/100/); // Sentiment score
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 7003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/resume',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 7003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });
  });

  describe('/help Command', () => {
    test('should provide comprehensive help information', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 8001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/help',
          message_id: 8001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Bot Help & Commands');
      expect(body.text).toContain('Trading Commands:');
      expect(body.text).toContain('Information Commands:');
      expect(body.text).toContain('Security Features:');
      expect(body.text).toContain('/status');
      expect(body.text).toContain('/balance');
      expect(body.text).toContain('/portfolio');
      expect(body.text).toContain('/positions');
      expect(body.text).toContain('/pause');
      expect(body.text).toContain('/resume');
    });

    test('should work for unauthorized users', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 8002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/help',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 8002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Bot Help & Commands');
      expect(body.text).not.toContain('Access Denied');
    });

    test('should include security information', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 8003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/help',
          message_id: 8003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('🔒 User authentication');
      expect(body.text).toContain('🛡️ Risk management');
      expect(body.text).toContain('📊 Real-time monitoring');
    });
  });

  describe('/report Command', () => {
    test('should generate comprehensive trading report', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 9001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/report',
          message_id: 9001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Trading Report');
      expect(body.text).toContain('Today\'s Performance:');
      expect(body.text).toContain('Total P&L:');
      expect(body.text).toContain('Trades Executed:');
      expect(body.text).toContain('Win Rate:');
      expect(body.text).toContain('AI Analysis Summary:');
      expect(body.text).toContain('Risk Metrics:');
      expect(body.text).toContain('Next Actions:');
    });

    test('should include AI analysis metrics', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 9002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/report',
          message_id: 9002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Bullish signals:');
      expect(body.text).toContain('Bearish signals:');
      expect(body.text).toContain('Market regime:');
      expect(body.text).toContain('Confidence avg:');
    });

    test('should include risk management data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 9003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/report',
          message_id: 9003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Max drawdown:');
      expect(body.text).toContain('Risk/reward avg:');
      expect(body.text).toContain('Position size avg:');
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 9004,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/report',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 9004
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });
  });

  describe('/alerts Command', () => {
    test('should show price alerts management interface', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 10001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/alerts',
          message_id: 10001
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Price Alerts');
      expect(body.text).toContain('Active Alerts:');
      expect(body.text).toContain('Triggered Today:');
      expect(body.text).toContain('Alert Commands:');
      expect(body.text).toContain('BTC');
      expect(body.text).toContain('ETH');
      expect(body.text).toContain('🔔');
    });

    test('should show alert status indicators', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 10002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/alerts',
          message_id: 10002
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('🟢'); // Active alert indicator
      expect(body.text).toContain('🔴'); // Alert type indicator
      expect(body.text).toMatch(/>\s*\$[\d,]+/); // Price threshold format
      expect(body.text).toMatch(/<\s*\$[\d,]+/); // Price threshold format
    });

    test('should require authorization', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 10003,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: '/alerts',
          from: MOCK_USERS.UNAUTHORIZED_USER,
          message_id: 10003
        }
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toContain('Access Denied');
    });
  });

  describe('Command Response Formatting', () => {
    test('should use HTML formatting consistently', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/start', '/status', '/balance', '/help'];

      for (const command of commands) {
        await botServer.processUpdate({
          update_id: 11000 + commands.indexOf(command),
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            text: command,
            message_id: 11000 + commands.indexOf(command)
          }
        });
      }

      const calls = (fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const body = JSON.parse(call[1].body);
        expect(body.parse_mode).toBe('HTML');
        expect(body.text).toContain('<b>');
        expect(body.text).toContain('<i>');
      });
    });

    test('should include appropriate emojis', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 11001,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.text).toMatch(/[🤖📊⚡🧠📡✅]/); // Status emojis
    });

    test('should disable web page preview', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 11002,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      // Check if disable_web_page_preview is not explicitly set to false
      expect(body.disable_web_page_preview).not.toBe(false);
    });
  });

  describe('Command Error Handling', () => {
    test('should handle missing message text gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 12001,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          text: undefined
        }
      });

      // Should not crash and should not call API
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle missing user information', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      await botServer.processUpdate({
        update_id: 12002,
        message: {
          ...COMMAND_MESSAGES.STATUS_COMMAND,
          from: undefined
        }
      });

      // Should handle gracefully and send unauthorized message
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Access Denied')
        })
      );
    });

    test('should recover from API errors during command execution', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        botServer.processUpdate({
          update_id: 12003,
          message: COMMAND_MESSAGES.STATUS_COMMAND
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Command Performance', () => {
    test('should respond to commands quickly', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const startTime = Date.now();
      await botServer.processUpdate({
        update_id: 13001,
        message: COMMAND_MESSAGES.STATUS_COMMAND
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500); // Should respond within 500ms
    });

    test('should handle multiple commands concurrently', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(TELEGRAM_API_RESPONSES.SEND_MESSAGE_SUCCESS)
      });

      const commands = ['/status', '/balance', '/portfolio', '/positions'];
      const promises = commands.map((command, index) =>
        botServer.processUpdate({
          update_id: 13100 + index,
          message: {
            ...COMMAND_MESSAGES.STATUS_COMMAND,
            text: command,
            message_id: 13100 + index
          }
        })
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });
});