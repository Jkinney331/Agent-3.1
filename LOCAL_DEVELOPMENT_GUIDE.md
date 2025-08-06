# AI Crypto Trading Bot - Local Development Guide

This comprehensive guide will help you set up and run the complete AI Trading Bot with Telegram integration locally for development and testing.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env.local

# 3. Configure your environment (edit .env.local)
# Add your API keys, database settings, etc.

# 4. Validate your environment
npm run validate:env

# 5. Set up database and seed test data
npm run db:setup
npm run db:seed

# 6. Start the complete development environment
npm run dev:full
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 20.0.0 or higher (18.0.0 minimum)
- **NPM**: Version 8.0.0 or higher
- **Git**: For version control
- **Docker** (optional): For containerized services

### Required API Keys
- **Telegram Bot Token**: Get from [@BotFather](https://t.me/BotFather)
- **CoinGecko API Key**: For market data (free tier available)
- **Alpha Vantage API Key**: For financial data (free tier available)

### Optional API Keys
- **OpenAI API Key**: For enhanced AI features
- **Binance API Keys**: For live crypto trading
- **Alpaca API Keys**: For stock trading
- **Ngrok Auth Token**: For webhook testing

## 🔧 Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Essential Configuration

Edit `.env.local` with your specific values:

```bash
# Database Configuration (Choose one)
DATABASE_TYPE=sqlite                    # or 'postgresql'
SQLITE_DATABASE_PATH=./data/trading_bot.db

# OR for PostgreSQL/Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
TELEGRAM_ALLOWED_USERS=123456789,987654321

# Trading Settings
TRADING_MODE=paper                      # 'paper' for testing, 'live' for real trading
INITIAL_BALANCE=50000
RISK_PER_TRADE=0.02                    # 2% risk per trade

# API Keys
COINGECKO_API_KEY=your-coingecko-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
```

### 3. Validate Configuration
```bash
npm run validate:env
```

This will check all your settings and provide feedback on missing or invalid configurations.

## 🗄️ Database Setup

### Option 1: SQLite (Recommended for Local Development)

SQLite is perfect for local development - no external dependencies required.

```bash
# Set database type to SQLite
echo "DATABASE_TYPE=sqlite" >> .env.local

# Initialize SQLite database
npm run db:setup

# Add realistic test data
npm run db:seed
```

### Option 2: PostgreSQL with Docker

For a more production-like environment:

```bash
# Start PostgreSQL with Docker
npm run docker:dev

# Set database type
echo "DATABASE_TYPE=postgresql" >> .env.local
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_trading_bot" >> .env.local

# Initialize database
npm run db:setup
npm run db:seed
```

### Option 3: Supabase (Cloud)

For full cloud integration:

```bash
# Configure Supabase in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Test connection and setup
npm run db:setup
```

## 🤖 Telegram Bot Setup

### 1. Create Your Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token to your `.env.local` file

### 2. Configure Bot Settings

```bash
# Add your bot token
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ

# Add allowed users (get your user ID from @userinfobot)
TELEGRAM_ALLOWED_USERS=123456789

# Optional: Set admin users
TELEGRAM_ADMIN_USERS=123456789
```

### 3. Local Webhook Testing with Ngrok

For testing webhooks locally:

```bash
# Install ngrok globally
npm install -g ngrok

# Get auth token from https://dashboard.ngrok.com/get-started/your-authtoken
# Add to .env.local
NGROK_AUTH_TOKEN=your-ngrok-token

# Start ngrok tunnel
npm run ngrok:start

# In another terminal, start your app
npm run dev
```

Ngrok will provide a public URL that Telegram can use to send webhooks to your local development server.

### 4. Test Your Bot

```bash
# Run comprehensive bot tests
npm run telegram:test

# Test specific functionality
npm run telegram:test connection  # Test bot connection only
npm run telegram:test webhook     # Test webhook setup only
npm run telegram:test message     # Send test message only
```

## 🚀 Development Server Options

### Full Development Environment
```bash
npm run dev:full
```
Starts:
- Next.js application (port 3000)
- Database setup
- MCP servers
- All background services

### Individual Services
```bash
# Just the Next.js app
npm run dev

# Database services only
npm run docker:dev

# MCP servers only
npm run mcp:all

# Trading engine only
npm run trading:start
```

### Advanced Development
```bash
# Start with monitoring
npm run docker:monitoring

# Start with all Docker services
npm run docker:full
```

## 🧪 Testing Your Setup

### 1. Environment Validation
```bash
# Validate all configuration
npm run validate:env

# Check specific components
npm run test:local          # Complete integration tests
npm run telegram:test       # Telegram bot tests
```

### 2. Integration Testing
```bash
# Run complete test suite
npm run test:local

# Run specific test categories
npm run test:integration    # Integration tests
npm run test:performance    # Performance tests
npm run test:unit          # Unit tests
```

### 3. Manual Testing

1. **Visit the Application**: http://localhost:3000
2. **Check API Health**: http://localhost:3000/api/health
3. **Test Trading Interface**: http://localhost:3000/trading
4. **Test AI Analysis**: http://localhost:3000/analytics

## 📊 Available Scripts

### Development
```bash
npm run dev                 # Start Next.js development server
npm run dev:full           # Start complete development environment
npm run build              # Build for production
npm run start              # Start production server
```

### Database
```bash
npm run db:setup           # Initialize database
npm run db:seed            # Add test data
npm run db:migrate         # Run migrations
```

### Testing
```bash
npm run test               # Run unit tests
npm run test:integration   # Run integration tests
npm run test:local         # Complete local environment test
npm run telegram:test      # Test Telegram bot
```

### Validation
```bash
npm run validate:env       # Validate environment configuration
```

### Docker
```bash
npm run docker:dev         # Start development services
npm run docker:full        # Start all services including app
npm run docker:monitoring  # Start with monitoring stack
```

### MCP Servers
```bash
npm run mcp:crypto         # Start crypto data server
npm run mcp:alpha          # Start Alpha Vantage server
npm run mcp:trading        # Start trading execution server
npm run mcp:all           # Start all MCP servers
```

## 🔍 Monitoring and Debugging

### Log Files
All logs are stored in the `./logs/` directory:
- `nextjs.log` - Main application logs
- `telegram-bot.log` - Telegram bot logs
- `crypto-mcp.log` - Crypto MCP server logs
- `trading-execution-mcp.log` - Trading execution logs

### Monitoring Dashboard
If you enable monitoring:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/grafana_password)

### Debug Tools
```bash
# Start with debug logging
DEBUG=* npm run dev

# Check service status
npm run test:local

# Monitor real-time logs
tail -f logs/nextjs.log
```

## 🎯 Testing Scenarios

### 1. Paper Trading Test
```bash
# Ensure paper trading mode
echo "TRADING_MODE=paper" >> .env.local

# Start the app and place test orders
npm run dev

# Visit http://localhost:3000/trading
# Place buy/sell orders with test data
```

### 2. AI Analysis Test
```bash
# Test AI analysis
curl http://localhost:3000/api/ai-analysis \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC-USD", "timeframe": "1h"}'
```

### 3. Telegram Bot Test
1. Start your bot: `npm run dev`
2. Message your bot on Telegram
3. Try commands: `/start`, `/help`, `/status`, `/balance`
4. Test interactive buttons and menus

### 4. Market Data Test
```bash
# Test market data endpoints
curl http://localhost:3000/api/crypto?action=trending
curl http://localhost:3000/api/crypto?action=prices&symbols=BTC,ETH
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# For SQLite
rm ./data/trading_bot.db
npm run db:setup

# For PostgreSQL
npm run docker:dev
# Wait for container to start, then:
npm run db:setup
```

#### Port Conflicts
```bash
# Kill processes on ports 3000, 5678, 5432
lsof -ti:3000,5678,5432 | xargs kill -9

# Or use different ports in .env.local
```

#### Telegram Webhook Issues
```bash
# Reset webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"

# Check webhook info
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

#### Missing Dependencies
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. **Check Logs**: Always check `./logs/` directory for error messages
2. **Run Validation**: `npm run validate:env` to check configuration
3. **Test Components**: `npm run test:local` for comprehensive testing
4. **Check Documentation**: Review API documentation in `/app/api/`

## 🚀 Next Steps

Once your local environment is running:

1. **Explore the Dashboard**: http://localhost:3000
2. **Test Trading Features**: Place paper trades and monitor performance
3. **Configure AI Analysis**: Set up OpenAI integration for enhanced features
4. **Customize Telegram Bot**: Modify commands and responses
5. **Add Custom Strategies**: Implement your own trading algorithms
6. **Monitor Performance**: Use the analytics dashboard to track results

## 📚 Additional Resources

- **API Documentation**: Check `/app/api/` for endpoint details
- **Database Schema**: See `/database/complete-trading-schema.sql`
- **Telegram Bot Config**: Review `/lib/telegram/config.ts`
- **Trading Engine**: Explore `/lib/trading/` for trading logic
- **MCP Servers**: Check `/lib/mcp/` for data server implementations

## 🛟 Support

If you encounter issues:

1. Run the validation script: `npm run validate:env`
2. Check the integration tests: `npm run test:local`
3. Review the logs in the `./logs/` directory
4. Ensure all required environment variables are set
5. Verify your API keys are valid and have proper permissions

Happy trading! 🚀📈