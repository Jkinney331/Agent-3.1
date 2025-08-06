/**
 * Telegram Bot Server Infrastructure
 * 
 * This module provides a complete Telegram bot infrastructure for delivering
 * AI-generated daily trading reports and handling user interactions.
 */

// Main bot class
export { TradingBot } from './trading-bot';

// Core components
export { BotMiddleware, type MiddlewareResult } from './bot-middleware';
export { MessageFormatter } from './message-formatter';
export { TelegramScheduler, type ScheduledJob } from './scheduler';
export { WebhookHandler, type WebhookValidationResult } from './webhook-handler';

// Configuration management
export { TelegramConfig, TelegramConfigUtils, validateTelegramConfig } from './config';

// Re-export types for convenience
export type {
  TelegramUser,
  TelegramPermissions,
  TelegramUserPreferences,
  TelegramMessage,
  TelegramCommand,
  TelegramCommandParameter,
  TelegramNotification,
  TelegramDailyReport,
  TelegramBotConfig,
  TelegramWebhookPayload,
  TelegramRateLimitState,
  TelegramSessionData
} from '../../types/trading';

/**
 * Quick start function to initialize the Telegram bot
 */
export async function initializeTelegramBot(): Promise<TradingBot> {
  const config = TelegramConfig.getInstance();
  const botConfig = config.loadConfig();
  
  const bot = new TradingBot(botConfig);
  await bot.start();
  
  return bot;
}

/**
 * Utility function to create a basic bot configuration
 */
export function createBasicBotConfig(overrides: Partial<TelegramBotConfig> = {}): TelegramBotConfig {
  const defaultConfig: TelegramBotConfig = {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    allowedUsers: [],
    adminUsers: [],
    rateLimiting: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 20,
      skipSuccessfulRequests: true
    },
    security: {
      secretToken: process.env.TELEGRAM_SECRET_TOKEN || '',
      validateUser: true,
      logAllMessages: false
    },
    features: {
      tradingEnabled: false,
      reportingEnabled: true,
      analyticsEnabled: true,
      adminCommandsEnabled: false
    }
  };

  return { ...defaultConfig, ...overrides };
}

/**
 * Health check function for the Telegram bot system
 */
export async function healthCheckTelegramBot(bot: TradingBot): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
}> {
  try {
    const webhookHandler = bot.getWebhookHandler();
    const scheduler = bot.getScheduler();
    
    const [webhookHealth, schedulerStatus] = await Promise.all([
      webhookHandler.healthCheck(),
      Promise.resolve({
        running: scheduler.isRunning(),
        jobsCount: scheduler.getScheduledJobsCount()
      })
    ]);

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (webhookHealth.status === 'unhealthy' || !schedulerStatus.running) {
      overallStatus = 'unhealthy';
    } else if (webhookHealth.status === 'warning') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      details: {
        webhook: webhookHealth,
        scheduler: schedulerStatus,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Configuration validation helper
 */
export function validateTelegramBotSetup(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  if (!process.env.TELEGRAM_WEBHOOK_URL) {
    errors.push('TELEGRAM_WEBHOOK_URL environment variable is required');
  }

  // Check optional but recommended variables
  if (!process.env.TELEGRAM_SECRET_TOKEN) {
    warnings.push('TELEGRAM_SECRET_TOKEN not set - webhook security is disabled');
  }

  if (!process.env.TELEGRAM_ALLOWED_USERS && !process.env.TELEGRAM_ADMIN_USERS) {
    warnings.push('No allowed users configured - bot will accept messages from anyone');
  }

  // Check database connection
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('Supabase configuration missing - required for user management');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Default export - main TradingBot class
 */
export default TradingBot;