import { Telegraf, Context } from 'telegraf';
import { TradingBotContext, TelegramBotConfig, BotState } from './types';
import { sessionManager } from './middleware/session-manager';
import { commandMiddleware } from './commands';
import { callbackRouter } from './callbacks/callback-router';

/**
 * Main Telegram Trading Bot Server
 * Mobile-first architecture with comprehensive trading integration
 */
export class TradingBotServer {
  private bot: Telegraf<TradingBotContext>;
  private config: TelegramBotConfig;
  private state: BotState;

  constructor(config: TelegramBotConfig) {
    this.config = config;
    this.bot = new Telegraf<TradingBotContext>(config.token);
    
    this.state = {
      isRunning: false,
      startTime: new Date(),
      activeUsers: new Set(),
      activeSessions: new Map(),
      messageQueue: [],
      metrics: {
        totalUsers: 0,
        activeUsers: 0,
        totalCommands: 0,
        commandsToday: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
        memoryUsage: 0,
        popularCommands: []
      },
      lastHealthCheck: new Date()
    };

    this.setupMiddleware();
    this.setupCommands();
    this.setupCallbacks();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware stack
   */
  private setupMiddleware(): void {
    // Session management
    this.bot.use(sessionManager.middleware());

    // Authentication middleware
    this.bot.use(this.authMiddleware.bind(this));

    // Rate limiting middleware
    this.bot.use(this.rateLimitMiddleware.bind(this));

    // Analytics middleware
    this.bot.use(this.analyticsMiddleware.bind(this));

    // Command processing middleware
    this.bot.use(commandMiddleware);
  }

  /**
   * Setup bot commands
   */
  private setupCommands(): void {
    // Set bot commands for Telegram UI
    this.bot.telegram.setMyCommands([
      { command: 'start', description: '🚀 Initialize bot and welcome' },
      { command: 'status', description: '📊 Current trading status and positions' },
      { command: 'balance', description: '💰 Portfolio balance and performance' },
      { command: 'pause', description: '⏸️ Pause trading operations' },
      { command: 'resume', description: '▶️ Resume trading operations' },
      { command: 'settings', description: '⚙️ User preferences and configuration' },
      { command: 'help', description: '❓ Interactive help and documentation' }
    ]);

    // Handle text messages that aren't commands
    this.bot.on('text', this.handleTextMessage.bind(this));

    // Handle other message types
    this.bot.on('photo', this.handlePhotoMessage.bind(this));
    this.bot.on('document', this.handleDocumentMessage.bind(this));
  }

  /**
   * Setup callback query handling
   */
  private setupCallbacks(): void {
    this.bot.on('callback_query', async (ctx) => {
      await callbackRouter.routeCallback(ctx);
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.bot.catch(this.handleBotError.bind(this));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.logError('SYSTEM_ERROR', error.message, undefined, undefined, error.stack);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.logError('SYSTEM_ERROR', String(reason), undefined, undefined);
    });
  }

  /**
   * Authentication middleware
   */
  private async authMiddleware(ctx: TradingBotContext, next: () => Promise<void>): Promise<void> {
    // Check if user is blacklisted
    if (this.config.security.blacklistedUsers?.includes(ctx.from?.id || 0)) {
      await ctx.reply('❌ Access denied.');
      return;
    }

    // Check if user is in allowed list (if specified)
    if (this.config.security.allowedUsers && 
        !this.config.security.allowedUsers.includes(ctx.from?.id || 0)) {
      await ctx.reply('❌ Access restricted. Contact support for access.');
      return;
    }

    await next();
  }

  /**
   * Rate limiting middleware
   */
  private async rateLimitMiddleware(ctx: TradingBotContext, next: () => Promise<void>): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) {
      await next();
      return;
    }

    // Check rate limit
    if (!sessionManager.checkRateLimit(userId, ctx.message?.text || 'callback')) {
      await ctx.reply('⏱️ Rate limit exceeded. Please wait before sending more commands.');
      return;
    }

    await next();
  }

  /**
   * Analytics middleware
   */
  private async analyticsMiddleware(ctx: TradingBotContext, next: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    // Track active user
    if (ctx.from?.id) {
      this.state.activeUsers.add(ctx.from.id);
    }

    // Track command usage
    if (ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/')) {
      const command = ctx.message.text.split(' ')[0].substring(1);
      this.trackCommand(command);
    }

    await next();

    // Track response time
    const responseTime = Date.now() - startTime;
    this.updateResponseTimeMetrics(responseTime);
  }

  /**
   * Handle text messages
   */
  private async handleTextMessage(ctx: TradingBotContext): Promise<void> {
    const text = ctx.message.text;
    
    // Handle non-command text based on current context
    if (ctx.session.currentCommand) {
      await this.handleContextualInput(ctx, text);
    } else {
      // Provide helpful response for non-command text
      await ctx.reply(
        '💡 <b>Tip:</b> Use the menu buttons or commands to interact with the bot.\n\n' +
        'Type /help to see available commands or tap the buttons below.',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Status', callback_data: 'back_to_status' },
                { text: '💰 Balance', callback_data: 'back_to_balance' }
              ],
              [
                { text: '⚙️ Settings', callback_data: 'back_to_settings' },
                { text: '❓ Help', callback_data: 'back_to_help' }
              ]
            ]
          }
        }
      );
    }
  }

  /**
   * Handle photo messages
   */
  private async handlePhotoMessage(ctx: TradingBotContext): Promise<void> {
    await ctx.reply('📸 Photo received. Currently, I work best with text commands and buttons. Use /help to see what I can do!');
  }

  /**
   * Handle document messages
   */
  private async handleDocumentMessage(ctx: TradingBotContext): Promise<void> {
    await ctx.reply('📄 Document received. For trading configuration, please use the /settings command for a user-friendly interface.');
  }

  /**
   * Handle contextual input based on current command state
   */
  private async handleContextualInput(ctx: TradingBotContext, text: string): Promise<void> {
    const currentCommand = ctx.session.currentCommand;
    
    switch (currentCommand) {
      case 'settings':
        await this.handleSettingsInput(ctx, text);
        break;
      default:
        await ctx.reply('Please use the menu buttons to navigate or type /help for assistance.');
    }
  }

  /**
   * Handle settings input
   */
  private async handleSettingsInput(ctx: TradingBotContext, text: string): Promise<void> {
    // Handle numeric inputs for settings configuration
    if (/^\d+(\.\d+)?$/.test(text)) {
      const value = parseFloat(text);
      await ctx.reply(`Value ${value} received. Please use the settings menu for guided configuration.`, {
        reply_markup: {
          inline_keyboard: [[
            { text: '⚙️ Settings Menu', callback_data: 'back_to_settings' }
          ]]
        }
      });
    } else {
      await ctx.reply('Please use the settings menu for configuration.', {
        reply_markup: {
          inline_keyboard: [[
            { text: '⚙️ Settings Menu', callback_data: 'back_to_settings' }
          ]]
        }
      });
    }
  }

  /**
   * Handle bot errors
   */
  private async handleBotError(error: any, ctx: TradingBotContext): Promise<void> {
    console.error('Bot error:', error);
    
    this.logError(
      'COMMAND_ERROR',
      error.message,
      ctx.from?.id?.toString(),
      ctx.message?.text || 'callback',
      error.stack
    );

    try {
      await ctx.reply(
        '❌ <b>Oops! Something went wrong.</b>\n\n' +
        'Our team has been notified. Please try again in a moment or contact support if the issue persists.',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Try Again', callback_data: 'retry_last_command' },
                { text: '📞 Contact Support', callback_data: 'contact_support' }
              ],
              [
                { text: '📊 Main Menu', callback_data: 'back_to_status' }
              ]
            ]
          }
        }
      );
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting Telegram Trading Bot...');
      
      this.state.isRunning = true;
      this.state.startTime = new Date();

      // Start bot with appropriate method
      if (this.config.webhookUrl) {
        await this.startWebhook();
      } else {
        await this.startPolling();
      }

      // Start periodic tasks
      this.startPeriodicTasks();

      console.log('✅ Telegram Trading Bot started successfully!');
      console.log(`📊 Bot username: @${this.bot.botInfo?.username}`);
      console.log(`🔧 Mode: ${this.config.webhookUrl ? 'Webhook' : 'Polling'}`);

    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * Start webhook mode
   */
  private async startWebhook(): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    await this.bot.telegram.setWebhook(this.config.webhookUrl);
    console.log(`🔗 Webhook set to: ${this.config.webhookUrl}`);
    
    // Start webhook server (implementation depends on your web framework)
    // this.startWebhookServer();
  }

  /**
   * Start polling mode
   */
  private async startPolling(): Promise<void> {
    await this.bot.launch({
      polling: {
        timeout: 30,
        limit: 100,
        allowedUpdates: ['message', 'callback_query', 'inline_query']
      }
    });
    
    console.log('📡 Polling started');
  }

  /**
   * Start periodic background tasks
   */
  private startPeriodicTasks(): void {
    // Update metrics every minute
    setInterval(() => {
      this.updateMetrics();
    }, 60 * 1000);

    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Process message queue every 10 seconds
    setInterval(() => {
      this.processMessageQueue();
    }, 10 * 1000);

    // Cleanup every hour
    setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Telegram Trading Bot...');
    
    this.state.isRunning = false;
    
    // Stop bot
    this.bot.stop();
    
    // Cleanup resources
    sessionManager.destroy();
    
    console.log('✅ Bot stopped successfully');
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: number, message: string, options?: any): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      });
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
    }
  }

  /**
   * Broadcast message to all users
   */
  async broadcastMessage(message: string, options?: any): Promise<void> {
    const users = Array.from(this.state.activeUsers);
    
    for (const userId of users) {
      await this.sendNotification(userId, message, options);
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get bot statistics
   */
  getStats(): any {
    return {
      ...this.state.metrics,
      isRunning: this.state.isRunning,
      uptime: Date.now() - this.state.startTime.getTime(),
      activeUsers: this.state.activeUsers.size,
      sessionStats: sessionManager.getSessionStats()
    };
  }

  // Private helper methods

  private trackCommand(command: string): void {
    this.state.metrics.totalCommands++;
    this.state.metrics.commandsToday++;

    // Update popular commands
    const existing = this.state.metrics.popularCommands.find(c => c.command === command);
    if (existing) {
      existing.count++;
    } else {
      this.state.metrics.popularCommands.push({ command, count: 1 });
    }

    // Sort and keep top 10
    this.state.metrics.popularCommands.sort((a, b) => b.count - a.count);
    this.state.metrics.popularCommands = this.state.metrics.popularCommands.slice(0, 10);
  }

  private updateResponseTimeMetrics(responseTime: number): void {
    // Simple moving average for response time
    const currentAvg = this.state.metrics.averageResponseTime;
    this.state.metrics.averageResponseTime = currentAvg > 0 
      ? Math.round((currentAvg + responseTime) / 2)
      : responseTime;
  }

  private updateMetrics(): void {
    this.state.metrics.uptime = Date.now() - this.state.startTime.getTime();
    this.state.metrics.memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    this.state.metrics.activeUsers = this.state.activeUsers.size;
  }

  private performHealthCheck(): void {
    this.state.lastHealthCheck = new Date();
    
    // Check system health
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    console.log('🏥 Health check:', {
      memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      activeUsers: this.state.activeUsers.size,
      uptime: Math.round((Date.now() - this.state.startTime.getTime()) / 1000 / 60) + ' minutes'
    });
  }

  private processMessageQueue(): void {
    // Process any queued messages
    while (this.state.messageQueue.length > 0) {
      const notification = this.state.messageQueue.shift();
      if (notification) {
        // Process notification
        console.log('Processing queued notification:', notification.title);
      }
    }
  }

  private performCleanup(): void {
    // Clean up old active users (inactive for >24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // This would need more sophisticated tracking in production
    // For now, just clear the set periodically
    if (this.state.activeUsers.size > 10000) {
      this.state.activeUsers.clear();
    }
  }

  private logError(type: string, message: string, userId?: string, command?: string, stack?: string): void {
    const error = {
      type,
      message,
      userId,
      command,
      timestamp: new Date(),
      stack
    };

    console.error('Bot Error:', error);
    
    // In production, send to error tracking service
    // this.errorTracker.log(error);
  }
}

/**
 * Create and configure bot instance
 */
export function createTradingBot(config: TelegramBotConfig): TradingBotServer {
  return new TradingBotServer(config);
}

/**
 * Default bot configuration
 */
export const defaultBotConfig: Partial<TelegramBotConfig> = {
  polling: true,
  rateLimit: {
    window: 60, // 1 minute
    max: 30     // 30 requests per minute
  },
  session: {
    timeout: 24 * 60 * 60, // 24 hours
    cleanup: 5 * 60        // 5 minutes
  },
  features: {
    analytics: true,
    notifications: true,
    exports: true,
    webhooks: false
  },
  security: {
    requireAuth: true,
    encryptSessions: true
  }
};