import { NextRequest, NextResponse } from 'next/server';
import { TradingBot } from '../../../../lib/telegram/trading-bot';
import { TelegramBotConfig } from '../../../../types/trading';

// Global bot instance (in production, you might want to use a singleton pattern)
let botInstance: TradingBot | null = null;

// Initialize bot configuration
function getBotConfig(): TelegramBotConfig {
  const config: TelegramBotConfig = {
    token: process.env.TELEGRAM_BOT_TOKEN!,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL!,
    allowedUsers: process.env.TELEGRAM_ALLOWED_USERS?.split(',').map(Number) || [],
    adminUsers: process.env.TELEGRAM_ADMIN_USERS?.split(',').map(Number) || [],
    rateLimiting: {
      enabled: process.env.TELEGRAM_RATE_LIMITING_ENABLED === 'true',
      windowMs: parseInt(process.env.TELEGRAM_RATE_LIMIT_WINDOW || '60000'),
      maxRequests: parseInt(process.env.TELEGRAM_RATE_LIMIT_MAX || '20'),
      skipSuccessfulRequests: true
    },
    security: {
      secretToken: process.env.TELEGRAM_SECRET_TOKEN!,
      validateUser: process.env.TELEGRAM_VALIDATE_USERS === 'true',
      logAllMessages: process.env.TELEGRAM_LOG_MESSAGES === 'true'
    },
    features: {
      tradingEnabled: process.env.TELEGRAM_TRADING_ENABLED === 'true',
      reportingEnabled: process.env.TELEGRAM_REPORTING_ENABLED !== 'false',
      analyticsEnabled: process.env.TELEGRAM_ANALYTICS_ENABLED !== 'false',
      adminCommandsEnabled: process.env.TELEGRAM_ADMIN_COMMANDS_ENABLED === 'true'
    }
  };

  // Validate required configuration
  if (!config.token) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  if (!config.webhookUrl) {
    throw new Error('TELEGRAM_WEBHOOK_URL environment variable is required');
  }

  if (!config.security.secretToken) {
    console.warn('TELEGRAM_SECRET_TOKEN not set - webhook security is disabled');
  }

  return config;
}

// Initialize bot instance
function getBotInstance(): TradingBot {
  if (!botInstance) {
    const config = getBotConfig();
    botInstance = new TradingBot(config);
  }
  return botInstance;
}

// POST handler for webhook
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Get request headers
    const headers: { [key: string]: string } = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Get bot instance
    const bot = getBotInstance();
    
    // Process webhook directly through the bot
    const result = await bot.processWebhook(body, headers);

    if (result.success) {
      return NextResponse.json({ ok: true });
    } else {
      console.error('Webhook processing failed:', result.error);
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Telegram webhook error:', error);
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET handler for webhook info (for debugging)
export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.TELEGRAM_ADMIN_TOKEN;
    
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bot = getBotInstance();
    const webhookHandler = bot.getWebhookHandler();
    
    // Get webhook info and stats
    const [webhookInfo, stats, healthCheck] = await Promise.all([
      webhookHandler.getWebhookInfo(),
      Promise.resolve(webhookHandler.getStats()),
      webhookHandler.healthCheck()
    ]);

    return NextResponse.json({
      webhook: webhookInfo,
      stats,
      health: healthCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PUT handler for webhook setup
export async function PUT(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.TELEGRAM_ADMIN_TOKEN;
    
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bot = getBotInstance();
    const webhookHandler = bot.getWebhookHandler();
    
    // Setup webhook
    const result = await webhookHandler.setupWebhook();
    
    if (result.success) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Webhook setup successful' 
      });
    } else {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE handler for webhook removal
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.TELEGRAM_ADMIN_TOKEN;
    
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bot = getBotInstance();
    const webhookHandler = bot.getWebhookHandler();
    
    // Remove webhook
    const result = await webhookHandler.removeWebhook();
    
    if (result.success) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Webhook removed successfully' 
      });
    } else {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error removing webhook:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const bot = getBotInstance();
    const webhookHandler = bot.getWebhookHandler();
    const health = await webhookHandler.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    return new NextResponse(null, { status: statusCode });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}