# Telegram Bot Server Infrastructure

This module provides a complete Telegram bot infrastructure for delivering AI-generated daily trading reports and handling user interactions with the AI crypto trading bot.

## 🚀 Features

### Core Functionality
- **Daily Report Delivery**: Automated delivery of AI-generated trading reports
- **Real-time Notifications**: Trade alerts, risk warnings, and market updates
- **Interactive Commands**: Portfolio status, position management, AI insights
- **User Management**: Authentication, permissions, and rate limiting
- **Secure Webhooks**: HTTPS webhook handling with secret token validation

### Security Features
- **Rate Limiting**: Per-user request limits with exponential backoff
- **User Authentication**: Whitelist-based access control
- **Input Validation**: Comprehensive message and command validation
- **Audit Logging**: Security events and message logging
- **Permission System**: Role-based access to different features

### Scheduling System
- **Flexible Scheduling**: Daily, weekly, and custom report schedules
- **Timezone Support**: User-specific timezone handling
- **Retry Mechanism**: Automatic retry for failed deliveries
- **Health Monitoring**: System status and performance tracking

## 📋 Architecture

```
lib/telegram/
├── trading-bot.ts          # Main bot server class
├── bot-middleware.ts       # Authentication & rate limiting
├── message-formatter.ts    # Message formatting utilities
├── scheduler.ts            # Report scheduling system
├── webhook-handler.ts      # Secure webhook processing
├── config.ts              # Configuration management
└── index.ts               # Module exports
```

## 🔧 Setup

### 1. Install Dependencies

The required dependencies are already added to `package.json`:
- `node-telegram-bot-api`: Telegram Bot API SDK
- `@types/node-telegram-bot-api`: TypeScript definitions

### 2. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Save the bot token from BotFather

### 3. Environment Configuration

Add these environment variables:

```env
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook

# Security
TELEGRAM_SECRET_TOKEN=your_secret_token_here
TELEGRAM_ADMIN_TOKEN=your_admin_api_token_here

# User Management
TELEGRAM_ALLOWED_USERS=123456789,987654321
TELEGRAM_ADMIN_USERS=123456789
TELEGRAM_VALIDATE_USERS=true

# Rate Limiting
TELEGRAM_RATE_LIMITING_ENABLED=true
TELEGRAM_RATE_LIMIT_WINDOW=60000
TELEGRAM_RATE_LIMIT_MAX=20

# Features
TELEGRAM_TRADING_ENABLED=false
TELEGRAM_REPORTING_ENABLED=true
TELEGRAM_ANALYTICS_ENABLED=true
TELEGRAM_ADMIN_COMMANDS_ENABLED=false
```

### 4. Database Setup

Run the Telegram schema migration:

```bash
# Apply the schema
psql -h your-db-host -d your-db -f database/telegram-schema.sql

# Or use Supabase migration
supabase migration new telegram_bot_schema
# Copy contents of telegram-schema.sql to the migration file
supabase db push
```

### 5. Webhook Setup

The webhook is automatically handled by the Next.js API route at `/api/telegram/webhook/route.ts`.

Set your webhook URL with BotFather:
```
https://yourdomain.com/api/telegram/webhook
```

## 💻 Usage

### Basic Initialization

```typescript
import { TradingBot, TelegramConfig } from '@/lib/telegram';

// Load configuration
const config = TelegramConfig.getInstance();
const botConfig = config.loadConfig();

// Initialize bot
const bot = new TradingBot(botConfig);
await bot.start();
```

### Quick Start

```typescript
import { initializeTelegramBot } from '@/lib/telegram';

// One-line initialization
const bot = await initializeTelegramBot();
```

### Custom Configuration

```typescript
import { TradingBot, createBasicBotConfig } from '@/lib/telegram';

const customConfig = createBasicBotConfig({
  features: {
    tradingEnabled: true,
    adminCommandsEnabled: true
  },
  rateLimiting: {
    maxRequests: 30,
    windowMs: 60000
  }
});

const bot = new TradingBot(customConfig);
```

## 🤖 Bot Commands

### User Commands
- `/start` - Register and get welcome message
- `/help` - Show available commands
- `/portfolio` - View portfolio status
- `/positions` - Show active positions
- `/trades [limit]` - Recent trades (default: 5)
- `/ai_analysis` - Get AI market insights
- `/report` - Generate daily report
- `/settings` - Manage preferences
- `/status` - System status

### Admin Commands (when enabled)
- `/trade <symbol> <side> <amount>` - Execute trade
- Advanced monitoring and control commands

## 📊 Message Formatting

The bot supports rich message formatting with:
- **Markdown formatting** for emphasis
- **Emojis** for visual indicators
- **Inline keyboards** for interactive responses
- **Dynamic content** based on market conditions

### Example Daily Report Format

```
📊 Daily Trading Report - Jan 15, 2024

💰 Portfolio Summary
Total Balance: $50,247.83
🟢 Daily P&L: $1,247.83 (2.55%)
📈 Total Return: $10,247.83 (25.64%)
🎯 Active Positions: 3

📋 Trading Activity
Total Trades: 8
Win Rate: 62.50%
💚 Best Trade: $487.22
💔 Worst Trade: -$156.33

🧠 AI Insights
🐂 Market: BULL
🟢 Next Action: BUY
🎯 Symbol: BTCUSDT
🎯 Confidence: 78.50%

💡 Key Insights:
• Strong bullish momentum detected
• Volume surge indicates institutional buying
• Technical indicators aligned for uptrend

⚠️ Risk Status
Drawdown: 2.10%
Risk Score: 35/100

🕐 Generated: Jan 15, 2024 9:00 AM
```

## 🔒 Security

### Rate Limiting
- **Per-user limits**: Configurable requests per minute/hour
- **Exponential backoff**: Increasing penalties for violations
- **Whitelist protection**: Only allowed users can interact

### Webhook Security
- **Secret token validation**: Prevents unauthorized webhook calls
- **HTTPS enforcement**: All webhooks must use HTTPS
- **Request validation**: Comprehensive payload validation

### User Management
- **Permission system**: Granular control over bot features
- **Admin controls**: Special privileges for administrators
- **Activity tracking**: User interaction logging

## 📈 Monitoring

### Health Checks
```typescript
import { healthCheckTelegramBot } from '@/lib/telegram';

const health = await healthCheckTelegramBot(bot);
console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'
```

### Webhook Info
```bash
# Get webhook status (requires admin token)
curl -H "Authorization: Bearer $TELEGRAM_ADMIN_TOKEN" \
     https://yourdomain.com/api/telegram/webhook
```

### Statistics
- **Message processing stats**: Success/failure rates
- **User activity**: Active users and interaction patterns  
- **Scheduler performance**: Job execution metrics
- **Error tracking**: Failed operations and retry attempts

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: All required vars set
2. **Database Schema**: Telegram tables created
3. **Webhook URL**: HTTPS endpoint configured
4. **Bot Token**: Valid token from BotFather  
5. **User Whitelist**: Authorized users configured
6. **Rate Limits**: Appropriate limits set
7. **Monitoring**: Health checks enabled

### Next.js Deployment

The bot integrates seamlessly with Next.js:
- **API Routes**: Webhook handling at `/api/telegram/webhook`
- **Server Components**: Bot status in admin dashboard
- **Environment Config**: Vercel/Netlify compatible
- **Database**: Works with Supabase/PostgreSQL

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving updates**
   - Check HTTPS certificate
   - Verify webhook URL with BotFather
   - Check secret token configuration

2. **Users can't access bot**
   - Verify user IDs in TELEGRAM_ALLOWED_USERS
   - Check rate limiting settings
   - Review permission configuration

3. **Reports not sending**
   - Check scheduler status
   - Verify database connectivity
   - Review user notification preferences

4. **Database connection errors**
   - Confirm Supabase credentials
   - Check RLS policies
   - Verify schema migration

### Debug Mode

Enable debug logging:
```env
TELEGRAM_LOG_MESSAGES=true
NODE_ENV=development
```

## 📚 API Reference

### TradingBot Class

```typescript
class TradingBot {
  constructor(config: TelegramBotConfig)
  async start(): Promise<void>
  async stop(): Promise<void>
  async sendNotification(chatId: number, message: string): Promise<void>
  getScheduler(): TelegramScheduler
  getWebhookHandler(): WebhookHandler
}
```

### Configuration

```typescript
interface TelegramBotConfig {
  token: string
  webhookUrl: string
  allowedUsers: number[]
  adminUsers: number[]
  rateLimiting: RateLimitConfig
  security: SecurityConfig
  features: FeatureConfig
}
```

## 🤝 Integration

### With AI System

```typescript
// Get AI analysis for reports
const analysis = await fetch('/api/ai-analysis').then(r => r.json());
const report = await scheduler.generateDailyReport(userId);
```

### With Trading Engine

```typescript
// Execute trades through bot
await bot.executeTrade(userId, 'BTCUSDT', 'BUY', 0.01);
```

### With Risk Management

```typescript
// Send risk alerts
await bot.sendRiskAlert(chatId, riskAlert);
```

## 📄 License

Part of the AI Crypto Trading Bot project. See main LICENSE file for details.

## 🔗 Links

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Documentation](https://supabase.io/docs)