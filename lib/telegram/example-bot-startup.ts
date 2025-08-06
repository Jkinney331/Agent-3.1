import { createTradingBot, defaultBotConfig } from './bot-server';
import { TelegramBotConfig } from './types';

/**
 * Example bot startup configuration
 * Shows how to initialize and run the Telegram trading bot
 */

// Bot configuration
const botConfig: TelegramBotConfig = {
  // Required: Your Telegram bot token from @BotFather
  token: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  
  // Optional: Webhook URL for production deployment
  webhookUrl: process.env.WEBHOOK_URL,
  
  // Use polling for development, webhook for production
  polling: !process.env.WEBHOOK_URL,
  
  // Rate limiting configuration
  rateLimit: {
    window: 60, // 1 minute window
    max: 30     // 30 requests per minute per user
  },
  
  // Session configuration
  session: {
    timeout: 24 * 60 * 60, // 24 hours
    cleanup: 5 * 60        // cleanup every 5 minutes
  },
  
  // Feature toggles
  features: {
    analytics: true,
    notifications: true,
    exports: true,
    webhooks: !!process.env.WEBHOOK_URL
  },
  
  // Security settings
  security: {
    allowedUsers: process.env.ALLOWED_USERS ? 
      process.env.ALLOWED_USERS.split(',').map(id => parseInt(id)) : 
      undefined,
    blacklistedUsers: process.env.BLACKLISTED_USERS ? 
      process.env.BLACKLISTED_USERS.split(',').map(id => parseInt(id)) : 
      undefined,
    requireAuth: true,
    encryptSessions: true
  }
};

/**
 * Initialize and start the trading bot
 */
async function startTradingBot(): Promise<void> {
  try {
    console.log('🚀 Initializing Telegram Trading Bot...');
    
    // Validate required environment variables
    if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN_HERE') {
      throw new Error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
    }
    
    // Create bot instance
    const bot = createTradingBot(botConfig);
    
    // Start the bot
    await bot.start();
    
    // Log initial statistics
    console.log('📊 Initial Bot Statistics:', bot.getStats());
    
    // Set up graceful shutdown
    setupGracefulShutdown(bot);
    
    console.log('✅ Telegram Trading Bot is now running!');
    console.log('🔗 Bot features:');
    console.log('  • Real-time portfolio monitoring');
    console.log('  • AI-powered trading signals');  
    console.log('  • Mobile-optimized interface');
    console.log('  • Interactive command system');
    console.log('  • Advanced risk management');
    console.log('');
    console.log('📱 Available commands:');
    console.log('  • /start - Initialize and welcome');
    console.log('  • /status - Trading status and positions');
    console.log('  • /balance - Portfolio overview');
    console.log('  • /pause - Pause trading operations');
    console.log('  • /resume - Resume trading');
    console.log('  • /settings - Configure preferences');
    console.log('  • /help - Interactive help system');
    console.log('');
    console.log('🎯 Mobile UX Features:');
    console.log('  • Inline keyboard navigation');
    console.log('  • One-tap quick actions');
    console.log('  • Real-time notifications');
    console.log('  • Touch-friendly interface');
    console.log('  • Contextual help system');
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(bot: any): void {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      await bot.stop();
      console.log('✅ Bot stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle different shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart
}

/**
 * Health check endpoint (for monitoring services)
 */
function setupHealthCheck(bot: any): void {
  // Example health check that could be exposed via HTTP endpoint
  setInterval(() => {
    const stats = bot.getStats();
    const isHealthy = stats.isRunning && stats.uptime > 0;
    
    if (!isHealthy) {
      console.warn('⚠️ Bot health check failed:', stats);
    }
  }, 60000); // Check every minute
}

/**
 * Start the bot if this file is run directly
 */
if (require.main === module) {
  startTradingBot().catch(error => {
    console.error('💥 Bot startup failed:', error);
    process.exit(1);
  });
}

// Export for use in other modules
export { startTradingBot, botConfig };

/**
 * Example environment variables setup:
 * 
 * # Required
 * TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
 * 
 * # Optional - for webhook deployment
 * WEBHOOK_URL=https://yourdomain.com/webhook/telegram
 * 
 * # Optional - user access control
 * ALLOWED_USERS=123456789,987654321
 * BLACKLISTED_USERS=111111111
 * 
 * # Optional - external service URLs
 * TRADING_API_URL=https://your-trading-api.com
 * DATABASE_URL=postgresql://user:pass@host:port/db
 * REDIS_URL=redis://host:port
 * 
 * # Optional - feature flags
 * ENABLE_ANALYTICS=true
 * ENABLE_NOTIFICATIONS=true
 * ENABLE_EXPORTS=true
 */

/**
 * Example Docker deployment:
 * 
 * FROM node:18-alpine
 * WORKDIR /app
 * COPY package*.json ./
 * RUN npm ci --only=production
 * COPY . .
 * RUN npm run build
 * EXPOSE 3000
 * CMD ["node", "dist/lib/telegram/example-bot-startup.js"]
 */

/**
 * Example systemd service:
 * 
 * [Unit]
 * Description=Telegram Trading Bot
 * After=network.target
 * 
 * [Service]
 * Type=simple
 * User=trading-bot
 * WorkingDirectory=/opt/trading-bot
 * ExecStart=/usr/bin/node dist/lib/telegram/example-bot-startup.js
 * Restart=always
 * RestartSec=10
 * Environment=NODE_ENV=production
 * EnvironmentFile=/opt/trading-bot/.env
 * 
 * [Install]
 * WantedBy=multi-user.target
 */