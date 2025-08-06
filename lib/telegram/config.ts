import { TelegramBotConfig } from '../../types/trading';

/**
 * Telegram Bot Configuration Manager
 * Handles configuration loading, validation, and environment setup
 */
export class TelegramConfig {
  private static instance: TelegramConfig;
  private config: TelegramBotConfig | null = null;

  private constructor() {}

  public static getInstance(): TelegramConfig {
    if (!TelegramConfig.instance) {
      TelegramConfig.instance = new TelegramConfig();
    }
    return TelegramConfig.instance;
  }

  /**
   * Load and validate configuration from environment variables
   */
  public loadConfig(): TelegramBotConfig {
    if (this.config) {
      return this.config;
    }

    // Load environment variables
    const requiredEnvVars = {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL
    };

    // Check required environment variables
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Build configuration
    this.config = {
      token: requiredEnvVars.TELEGRAM_BOT_TOKEN!,
      webhookUrl: requiredEnvVars.TELEGRAM_WEBHOOK_URL!,
      allowedUsers: this.parseNumberArray(process.env.TELEGRAM_ALLOWED_USERS),
      adminUsers: this.parseNumberArray(process.env.TELEGRAM_ADMIN_USERS),
      rateLimiting: {
        enabled: this.parseBoolean(process.env.TELEGRAM_RATE_LIMITING_ENABLED, true),
        windowMs: this.parseNumber(process.env.TELEGRAM_RATE_LIMIT_WINDOW, 60000),
        maxRequests: this.parseNumber(process.env.TELEGRAM_RATE_LIMIT_MAX, 20),
        skipSuccessfulRequests: this.parseBoolean(process.env.TELEGRAM_RATE_LIMIT_SKIP_SUCCESS, true)
      },
      security: {
        secretToken: process.env.TELEGRAM_SECRET_TOKEN || this.generateSecretToken(),
        validateUser: this.parseBoolean(process.env.TELEGRAM_VALIDATE_USERS, true),
        logAllMessages: this.parseBoolean(process.env.TELEGRAM_LOG_MESSAGES, false)
      },
      features: {
        tradingEnabled: this.parseBoolean(process.env.TELEGRAM_TRADING_ENABLED, false),
        reportingEnabled: this.parseBoolean(process.env.TELEGRAM_REPORTING_ENABLED, true),
        analyticsEnabled: this.parseBoolean(process.env.TELEGRAM_ANALYTICS_ENABLED, true),
        adminCommandsEnabled: this.parseBoolean(process.env.TELEGRAM_ADMIN_COMMANDS_ENABLED, false)
      }
    };

    // Validate configuration
    this.validateConfig(this.config);

    return this.config;
  }

  /**
   * Get current configuration (throws if not loaded)
   */
  public getConfig(): TelegramBotConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Update configuration (for runtime changes)
   */
  public updateConfig(updates: Partial<TelegramBotConfig>): TelegramBotConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    this.config = { ...this.config, ...updates };
    this.validateConfig(this.config);
    return this.config;
  }

  /**
   * Reset configuration (force reload on next access)
   */
  public resetConfig(): void {
    this.config = null;
  }

  /**
   * Generate environment variable template
   */
  public generateEnvTemplate(): string {
    return `
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
TELEGRAM_SECRET_TOKEN=your_secret_token_here

# User Management
TELEGRAM_ALLOWED_USERS=123456789,987654321
TELEGRAM_ADMIN_USERS=123456789
TELEGRAM_VALIDATE_USERS=true

# Rate Limiting
TELEGRAM_RATE_LIMITING_ENABLED=true
TELEGRAM_RATE_LIMIT_WINDOW=60000
TELEGRAM_RATE_LIMIT_MAX=20
TELEGRAM_RATE_LIMIT_SKIP_SUCCESS=true

# Security
TELEGRAM_LOG_MESSAGES=false

# Features
TELEGRAM_TRADING_ENABLED=false
TELEGRAM_REPORTING_ENABLED=true
TELEGRAM_ANALYTICS_ENABLED=true
TELEGRAM_ADMIN_COMMANDS_ENABLED=false

# Optional Admin Token for API access
TELEGRAM_ADMIN_TOKEN=your_admin_api_token_here
    `.trim();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: TelegramBotConfig): void {
    const errors: string[] = [];

    // Validate token format
    if (!this.isValidBotToken(config.token)) {
      errors.push('Invalid bot token format');
    }

    // Validate webhook URL
    try {
      const url = new URL(config.webhookUrl);
      if (url.protocol !== 'https:') {
        errors.push('Webhook URL must use HTTPS');
      }
    } catch {
      errors.push('Invalid webhook URL format');
    }

    // Validate rate limiting
    if (config.rateLimiting.enabled) {
      if (config.rateLimiting.windowMs < 1000) {
        errors.push('Rate limit window must be at least 1000ms');
      }
      if (config.rateLimiting.maxRequests < 1) {
        errors.push('Rate limit max requests must be at least 1');
      }
    }

    // Validate admin users are subset of allowed users (if both are specified)
    if (config.allowedUsers.length > 0 && config.adminUsers.length > 0) {
      const invalidAdmins = config.adminUsers.filter(admin => !config.allowedUsers.includes(admin));
      if (invalidAdmins.length > 0) {
        errors.push(`Admin users not in allowed users list: ${invalidAdmins.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Check if bot token format is valid
   */
  private isValidBotToken(token: string): boolean {
    // Bot token should be in format: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    return tokenRegex.test(token) && token.length > 20;
  }

  /**
   * Generate a secure secret token
   */
  private generateSecretToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Parse boolean from environment variable
   */
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Parse number from environment variable
   */
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse comma-separated numbers from environment variable
   */
  private parseNumberArray(value: string | undefined): number[] {
    if (!value) return [];
    return value
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
  }

  /**
   * Get configuration summary for logging
   */
  public getConfigSummary(): any {
    if (!this.config) {
      return { status: 'not_loaded' };
    }

    return {
      status: 'loaded',
      features: this.config.features,
      security: {
        validateUser: this.config.security.validateUser,
        logAllMessages: this.config.security.logAllMessages,
        hasSecretToken: !!this.config.security.secretToken
      },
      rateLimiting: {
        enabled: this.config.rateLimiting.enabled,
        windowMs: this.config.rateLimiting.windowMs,
        maxRequests: this.config.rateLimiting.maxRequests
      },
      users: {
        allowedUsersCount: this.config.allowedUsers.length,
        adminUsersCount: this.config.adminUsers.length
      },
      webhook: {
        hasUrl: !!this.config.webhookUrl,
        urlDomain: this.config.webhookUrl ? new URL(this.config.webhookUrl).hostname : null
      }
    };
  }
}

/**
 * Default export for easy usage
 */
export default TelegramConfig.getInstance();

/**
 * Utility functions for configuration management
 */
export class TelegramConfigUtils {
  /**
   * Validate webhook URL format and accessibility
   */
  static async validateWebhookUrl(url: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const parsedUrl = new URL(url);
      
      if (parsedUrl.protocol !== 'https:') {
        return { valid: false, error: 'Webhook URL must use HTTPS' };
      }

      // Optional: Test if URL is accessible (be careful in production)
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (!response.ok && response.status !== 405) { // 405 = Method Not Allowed is OK
            return { valid: false, error: `Webhook URL returned status: ${response.status}` };
          }
        } catch (fetchError) {
          // Network errors are OK - just means the webhook endpoint doesn't exist yet
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Generate secure webhook path
   */
  static generateWebhookPath(botToken: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(botToken).digest('hex');
    return `/api/telegram/webhook/${hash.substring(0, 16)}`;
  }

  /**
   * Create complete webhook URL
   */
  static createWebhookUrl(baseUrl: string, botToken: string): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const webhookPath = this.generateWebhookPath(botToken);
    return `${cleanBaseUrl}${webhookPath}`;
  }

  /**
   * Parse user ID from various formats
   */
  static parseUserId(input: string | number): number | null {
    if (typeof input === 'number') {
      return input > 0 ? input : null;
    }
    
    if (typeof input === 'string') {
      const parsed = parseInt(input.trim(), 10);
      return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }
    
    return null;
  }

  /**
   * Mask sensitive configuration values for logging
   */
  static maskSensitiveConfig(config: TelegramBotConfig): any {
    return {
      ...config,
      token: config.token ? `${config.token.substring(0, 8)}...` : undefined,
      security: {
        ...config.security,
        secretToken: config.security.secretToken ? '***' : undefined
      }
    };
  }
}

/**
 * Configuration validation middleware for Express/Next.js
 */
export function validateTelegramConfig(req: any, res: any, next: any) {
  try {
    const config = TelegramConfig.getInstance();
    config.loadConfig();
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Configuration error';
    res.status(500).json({ error: errorMessage });
  }
}