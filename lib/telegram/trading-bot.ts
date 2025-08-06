import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import { 
  TelegramUser, 
  TelegramBotConfig, 
  TelegramMessage, 
  TelegramSessionData,
  TelegramCommand,
  PortfolioData,
  AIAnalysis,
  Trade,
  Position
} from '../../types/trading';
import { BotMiddleware } from './bot-middleware';
import { MessageFormatter } from './message-formatter';
import { TelegramScheduler } from './scheduler';
import { WebhookHandler } from './webhook-handler';

export class TradingBot {
  private bot: TelegramBot;
  private supabase: any;
  private middleware: BotMiddleware;
  private formatter: MessageFormatter;
  private scheduler: TelegramScheduler;
  private webhookHandler: WebhookHandler;
  private config: TelegramBotConfig;
  private sessions: Map<number, TelegramSessionData>;
  private commands: Map<string, TelegramCommand>;

  constructor(config: TelegramBotConfig) {
    this.config = config;
    this.sessions = new Map();
    this.commands = new Map();
    
    // Initialize Telegram Bot
    this.bot = new TelegramBot(config.token, { 
      polling: false,
      webHook: true
    });

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize components
    this.middleware = new BotMiddleware(config, this.supabase);
    this.formatter = new MessageFormatter();
    this.scheduler = new TelegramScheduler(this, this.supabase);
    this.webhookHandler = new WebhookHandler(this.bot, config);

    this.initializeCommands();
    this.setupEventHandlers();
  }

  private initializeCommands(): void {
    const commands: TelegramCommand[] = [
      {
        command: 'start',
        description: 'Start the bot and register user',
        handler: 'handleStart',
        permissions: [],
        examples: ['/start']
      },
      {
        command: 'help',
        description: 'Show available commands',
        handler: 'handleHelp',
        permissions: [],
        examples: ['/help']
      },
      {
        command: 'portfolio',
        description: 'View current portfolio status',
        handler: 'handlePortfolio',
        permissions: ['canViewPortfolio'],
        examples: ['/portfolio']
      },
      {
        command: 'positions',
        description: 'View active positions',
        handler: 'handlePositions',
        permissions: ['canViewPortfolio'],
        examples: ['/positions']
      },
      {
        command: 'trades',
        description: 'View recent trades',
        handler: 'handleTrades',
        permissions: ['canViewPortfolio'],
        parameters: [
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Number of trades to show (default: 5, max: 20)'
          }
        ],
        examples: ['/trades', '/trades 10']
      },
      {
        command: 'ai_analysis',
        description: 'Get current AI market analysis',
        handler: 'handleAIAnalysis',
        permissions: ['canAccessAnalytics'],
        examples: ['/ai_analysis']
      },
      {
        command: 'report',
        description: 'Generate daily trading report',
        handler: 'handleDailyReport',
        permissions: ['canReceiveReports'],
        examples: ['/report']
      },
      {
        command: 'settings',
        description: 'Manage notification and report settings',
        handler: 'handleSettings',
        permissions: ['canModifySettings'],
        examples: ['/settings']
      },
      {
        command: 'status',
        description: 'Check system status',
        handler: 'handleStatus',
        permissions: [],
        examples: ['/status']
      },
      {
        command: 'trade',
        description: 'Execute a trade (admin only)',
        handler: 'handleTrade',
        permissions: ['canExecuteTrades', 'isAdmin'],
        parameters: [
          {
            name: 'symbol',
            type: 'symbol',
            required: true,
            description: 'Trading symbol (e.g., BTCUSDT)'
          },
          {
            name: 'side',
            type: 'string',
            required: true,
            description: 'BUY or SELL'
          },
          {
            name: 'amount',
            type: 'number',
            required: true,
            description: 'Amount to trade'
          }
        ],
        examples: ['/trade BTCUSDT BUY 0.01']
      }
    ];

    commands.forEach(cmd => {
      this.commands.set(cmd.command, cmd);
    });
  }

  private setupEventHandlers(): void {
    // Handle all messages
    this.bot.on('message', async (msg) => {
      try {
        await this.handleMessage(msg);
      } catch (error) {
        console.error('Error handling message:', error);
        await this.bot.sendMessage(msg.chat.id, 
          'Sorry, an error occurred while processing your message. Please try again.'
        );
      }
    });

    // Handle callback queries (inline keyboard responses)
    this.bot.on('callback_query', async (query) => {
      try {
        await this.handleCallbackQuery(query);
      } catch (error) {
        console.error('Error handling callback query:', error);
      }
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });

    // Handle webhook errors
    this.bot.on('webhook_error', (error) => {
      console.error('Telegram webhook error:', error);
    });
  }

  public async handleMessage(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || '';

    // Apply middleware checks
    const middlewareResult = await this.middleware.processMessage(msg);
    if (!middlewareResult.allowed) {
      await this.bot.sendMessage(chatId, middlewareResult.message!);
      return;
    }

    // Update user session
    this.updateSession(userId, chatId);

    // Log message
    await this.logMessage(msg);

    // Handle commands
    if (text.startsWith('/')) {
      await this.handleCommand(msg);
    } else {
      await this.handleTextMessage(msg);
    }
  }

  private async handleCommand(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || '';
    
    const [commandName, ...args] = text.slice(1).split(' ');
    const command = this.commands.get(commandName);

    if (!command) {
      await this.bot.sendMessage(chatId, 
        `Unknown command: /${commandName}\n\nUse /help to see available commands.`
      );
      return;
    }

    // Check permissions
    const user = await this.getOrCreateUser(userId, msg.from);
    const hasPermission = await this.middleware.checkCommandPermissions(user, command);
    
    if (!hasPermission) {
      await this.bot.sendMessage(chatId, 
        'You do not have permission to use this command.'
      );
      return;
    }

    // Execute command handler
    try {
      await this.executeCommand(command.handler, msg, args);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      await this.bot.sendMessage(chatId, 
        'An error occurred while executing the command. Please try again.'
      );
    }
  }

  private async executeCommand(handler: string, msg: any, args: string[]): Promise<void> {
    const chatId = msg.chat.id;
    
    switch (handler) {
      case 'handleStart':
        await this.handleStart(msg);
        break;
      case 'handleHelp':
        await this.handleHelp(msg);
        break;
      case 'handlePortfolio':
        await this.handlePortfolio(msg);
        break;
      case 'handlePositions':
        await this.handlePositions(msg);
        break;
      case 'handleTrades':
        await this.handleTrades(msg, args);
        break;
      case 'handleAIAnalysis':
        await this.handleAIAnalysis(msg);
        break;
      case 'handleDailyReport':
        await this.handleDailyReport(msg);
        break;
      case 'handleSettings':
        await this.handleSettings(msg);
        break;
      case 'handleStatus':
        await this.handleStatus(msg);
        break;
      case 'handleTrade':
        await this.handleTrade(msg, args);
        break;
      default:
        await this.bot.sendMessage(chatId, 'Command handler not implemented.');
    }
  }

  // Command Handlers
  private async handleStart(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const user = await this.getOrCreateUser(msg.from.id, msg.from);
    
    const welcomeMessage = this.formatter.formatWelcomeMessage(user);
    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  private async handleHelp(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = await this.getOrCreateUser(userId, msg.from);
    
    const helpMessage = this.formatter.formatHelpMessage(user, Array.from(this.commands.values()));
    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  private async handlePortfolio(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      const portfolioData = await this.getPortfolioData(userId);
      const message = this.formatter.formatPortfolioSummary(portfolioData);
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Unable to fetch portfolio data at the moment.');
    }
  }

  private async handlePositions(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      const positions = await this.getActivePositions(userId);
      const message = this.formatter.formatPositions(positions);
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Unable to fetch positions data at the moment.');
    }
  }

  private async handleTrades(msg: any, args: string[]): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const limit = args[0] ? Math.min(parseInt(args[0]), 20) : 5;
    
    try {
      const trades = await this.getRecentTrades(userId, limit);
      const message = this.formatter.formatTrades(trades);
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Unable to fetch trades data at the moment.');
    }
  }

  private async handleAIAnalysis(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    
    try {
      const analysis = await this.getAIAnalysis();
      const message = this.formatter.formatAIAnalysis(analysis);
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Unable to fetch AI analysis at the moment.');
    }
  }

  private async handleDailyReport(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
      const report = await this.scheduler.generateDailyReport(userId);
      const message = this.formatter.formatDailyReport(report);
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Unable to generate daily report at the moment.');
    }
  }

  private async handleSettings(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    // Show settings menu with inline keyboard
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'Notifications', callback_data: 'settings_notifications' },
          { text: 'Reports', callback_data: 'settings_reports' }
        ],
        [
          { text: 'Trading', callback_data: 'settings_trading' },
          { text: 'Back', callback_data: 'settings_back' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, 
      'Select a setting category to configure:', 
      { reply_markup: keyboard }
    );
  }

  private async handleStatus(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    
    const status = {
      botStatus: 'Online',
      tradingEngine: 'Active',
      dataFeeds: 'Connected',
      lastUpdate: new Date()
    };

    const message = this.formatter.formatSystemStatus(status);
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  private async handleTrade(msg: any, args: string[]): Promise<void> {
    const chatId = msg.chat.id;
    
    if (args.length < 3) {
      await this.bot.sendMessage(chatId, 
        'Usage: /trade <symbol> <side> <amount>\nExample: /trade BTCUSDT BUY 0.01'
      );
      return;
    }

    const [symbol, side, amountStr] = args;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      await this.bot.sendMessage(chatId, 'Invalid amount specified.');
      return;
    }

    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
      await this.bot.sendMessage(chatId, 'Side must be BUY or SELL.');
      return;
    }

    // Show confirmation keyboard
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'Confirm', callback_data: `trade_confirm_${symbol}_${side}_${amount}` },
          { text: 'Cancel', callback_data: 'trade_cancel' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, 
      `Confirm trade:\n*Symbol:* ${symbol}\n*Side:* ${side}\n*Amount:* ${amount}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }

  private async handleTextMessage(msg: any): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.sessions.get(userId);

    if (session?.state === 'AWAITING_CONFIRMATION') {
      // Handle confirmation responses
      await this.handleConfirmationResponse(msg, session);
    } else {
      // Default response for unrecognized text
      await this.bot.sendMessage(chatId, 
        'I didn\'t understand that command. Use /help to see available commands.'
      );
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    const chatId = query.message.chat.id;
    const data = query.data;

    await this.bot.answerCallbackQuery(query.id);

    if (data.startsWith('settings_')) {
      await this.handleSettingsCallback(query);
    } else if (data.startsWith('trade_')) {
      await this.handleTradeCallback(query);
    }
  }

  private async handleSettingsCallback(query: any): Promise<void> {
    const chatId = query.message.chat.id;
    const data = query.data.replace('settings_', '');

    // Implementation for settings callbacks
    switch (data) {
      case 'notifications':
        // Show notification settings
        break;
      case 'reports':
        // Show report settings
        break;
      case 'trading':
        // Show trading settings
        break;
      case 'back':
        // Go back to main menu
        break;
    }
  }

  private async handleTradeCallback(query: any): Promise<void> {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data.replace('trade_', '');

    if (data === 'cancel') {
      await this.bot.editMessageText('Trade cancelled.', {
        chat_id: chatId,
        message_id: query.message.message_id
      });
      return;
    }

    if (data.startsWith('confirm_')) {
      const [, symbol, side, amountStr] = data.split('_');
      const amount = parseFloat(amountStr);

      try {
        // Execute the trade through trading engine
        const result = await this.executeTrade(userId, symbol, side, amount);
        
        await this.bot.editMessageText(
          `Trade executed successfully!\n*Order ID:* ${result.orderId}\n*Status:* ${result.status}`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'Markdown'
          }
        );
      } catch (error) {
        await this.bot.editMessageText(
          `Trade execution failed: ${error}`,
          {
            chat_id: chatId,
            message_id: query.message.message_id
          }
        );
      }
    }
  }

  // Utility Methods
  private updateSession(userId: number, chatId: number): void {
    const session = this.sessions.get(userId) || {
      userId,
      chatId,
      state: 'IDLE',
      lastActivity: new Date(),
      commands: []
    };

    session.lastActivity = new Date();
    this.sessions.set(userId, session);
  }

  private async getOrCreateUser(telegramId: number, telegramData: any): Promise<TelegramUser> {
    // Try to get existing user
    const { data: existingUser } = await this.supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (existingUser) {
      // Update last active
      await this.supabase
        .from('telegram_users')
        .update({ last_active: new Date() })
        .eq('telegram_id', telegramId);
      
      return existingUser;
    }

    // Create new user
    const newUser: Partial<TelegramUser> = {
      telegramId,
      username: telegramData.username,
      firstName: telegramData.first_name,
      lastName: telegramData.last_name,
      isBot: telegramData.is_bot || false,
      languageCode: telegramData.language_code,
      isActive: true,
      permissions: {
        canReceiveReports: true,
        canExecuteTrades: false,
        canViewPortfolio: true,
        canModifySettings: true,
        canAccessAnalytics: true,
        isAdmin: this.config.adminUsers.includes(telegramId),
        rateLimit: {
          maxRequestsPerMinute: 10,
          maxRequestsPerHour: 100
        }
      },
      preferences: {
        notifications: {
          dailyReports: true,
          tradeAlerts: true,
          riskAlerts: true,
          marketUpdates: false,
          systemStatus: true
        },
        reporting: {
          frequency: 'DAILY',
          time: '09:00',
          timezone: 'UTC',
          format: 'DETAILED',
          includeCharts: false
        },
        trading: {
          confirmBeforeExecution: true,
          maxTradeSize: 1000,
          allowedSymbols: ['BTCUSDT', 'ETHUSDT']
        }
      },
      createdAt: new Date(),
      lastActive: new Date()
    };

    const { data: user } = await this.supabase
      .from('telegram_users')
      .insert(newUser)
      .select()
      .single();

    return user;
  }

  private async logMessage(msg: any): Promise<void> {
    if (!this.config.security.logAllMessages) return;

    const logData: Partial<TelegramMessage> = {
      messageId: msg.message_id,
      chatId: msg.chat.id,
      userId: msg.from.id,
      text: msg.text,
      timestamp: new Date(msg.date * 1000),
      processed: true
    };

    await this.supabase
      .from('telegram_messages')
      .insert(logData);
  }

  private async getPortfolioData(userId: number): Promise<PortfolioData> {
    // Fetch portfolio data from trading system
    const response = await fetch('/api/trading/positions');
    return response.json();
  }

  private async getActivePositions(userId: number): Promise<Position[]> {
    // Fetch active positions from trading system
    const response = await fetch('/api/trading/positions');
    const data = await response.json();
    return data.positions || [];
  }

  private async getRecentTrades(userId: number, limit: number): Promise<Trade[]> {
    // Fetch recent trades from trading system
    const response = await fetch(`/api/trading/trades?limit=${limit}`);
    const data = await response.json();
    return data.trades || [];
  }

  private async getAIAnalysis(): Promise<AIAnalysis> {
    // Fetch AI analysis from AI system
    const response = await fetch('/api/ai-analysis');
    return response.json();
  }

  private async executeTrade(userId: number, symbol: string, side: string, amount: number): Promise<any> {
    // Execute trade through trading engine
    const response = await fetch('/api/trading/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, side, amount, userId })
    });
    
    if (!response.ok) {
      throw new Error(`Trade execution failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  private async handleConfirmationResponse(msg: any, session: TelegramSessionData): Promise<void> {
    // Handle confirmation responses based on session context
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase();

    if (text === 'yes' || text === 'confirm') {
      await this.bot.sendMessage(chatId, 'Action confirmed.');
    } else if (text === 'no' || text === 'cancel') {
      await this.bot.sendMessage(chatId, 'Action cancelled.');
    } else {
      await this.bot.sendMessage(chatId, 'Please respond with "yes" or "no".');
      return;
    }

    // Reset session state
    session.state = 'IDLE';
    session.context = null;
  }

  // Public methods for external use
  public async sendNotification(chatId: number, message: string, options?: any): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message, options);
    } catch (error) {
      console.error(`Failed to send notification to ${chatId}:`, error);
    }
  }

  public async setWebhook(url: string): Promise<void> {
    await this.bot.setWebHook(url, {
      secret_token: this.config.security.secretToken
    });
  }

  public async deleteWebhook(): Promise<void> {
    await this.bot.deleteWebHook();
  }

  public getBot(): TelegramBot {
    return this.bot;
  }

  public getScheduler(): TelegramScheduler {
    return this.scheduler;
  }

  public getWebhookHandler(): WebhookHandler {
    return this.webhookHandler;
  }

  public async processWebhook(body: any, headers: { [key: string]: string }): Promise<{ success: boolean; error?: string }> {
    return this.webhookHandler.processWebhook(body, headers);
  }

  public async start(): Promise<void> {
    console.log('Trading Bot started successfully');
    
    // Start scheduler
    await this.scheduler.start();
    
    // Set webhook if configured
    if (this.config.webhookUrl) {
      await this.setWebhook(this.config.webhookUrl);
      console.log(`Webhook set to: ${this.config.webhookUrl}`);
    }
  }

  public async stop(): Promise<void> {
    // Stop scheduler
    await this.scheduler.stop();
    
    // Remove webhook
    await this.deleteWebhook();
    
    console.log('Trading Bot stopped');
  }
}