/**
 * Telegram Bot Test Fixtures
 * Mock data for bot commands, responses, and user interactions
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot: boolean;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: any[];
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: any;
}

/**
 * Mock Users for Testing
 */
export const MOCK_USERS = {
  AUTHORIZED_USER: {
    id: 123456789,
    first_name: 'John',
    last_name: 'Trader',
    username: 'johntrader',
    language_code: 'en',
    is_bot: false
  } as TelegramUser,

  UNAUTHORIZED_USER: {
    id: 987654321,
    first_name: 'Random',
    last_name: 'User',
    username: 'randomuser',
    language_code: 'en',
    is_bot: false
  } as TelegramUser,

  BOT_USER: {
    id: 555666777,
    first_name: 'TestBot',
    username: 'testbot',
    is_bot: true
  } as TelegramUser,

  VIP_USER: {
    id: 111222333,
    first_name: 'VIP',
    last_name: 'Trader',
    username: 'viptrader',
    language_code: 'en',
    is_bot: false
  } as TelegramUser
};

/**
 * Mock Chats for Testing
 */
export const MOCK_CHATS = {
  PRIVATE_CHAT: {
    id: 123456789,
    type: 'private' as const,
    first_name: 'John',
    last_name: 'Trader',
    username: 'johntrader'
  } as TelegramChat,

  GROUP_CHAT: {
    id: -100111222333,
    type: 'group' as const,
    title: 'Trading Group',
    username: 'tradinggroup'
  } as TelegramChat,

  SUPERGROUP_CHAT: {
    id: -100444555666,
    type: 'supergroup' as const,
    title: 'Pro Traders',
    username: 'protraders'
  } as TelegramChat
};

/**
 * Bot Commands Test Data
 */
export const BOT_COMMANDS = {
  START: '/start',
  STATUS: '/status',
  BALANCE: '/balance',
  PORTFOLIO: '/portfolio',
  POSITIONS: '/positions',
  PAUSE: '/pause',
  RESUME: '/resume',
  HELP: '/help',
  SETTINGS: '/settings',
  ALERTS: '/alerts',
  REPORT: '/report',
  STOP: '/stop'
};

/**
 * Mock Command Messages
 */
export const COMMAND_MESSAGES = {
  START_COMMAND: {
    message_id: 1001,
    from: MOCK_USERS.AUTHORIZED_USER,
    chat: MOCK_CHATS.PRIVATE_CHAT,
    date: Math.floor(Date.now() / 1000),
    text: '/start',
    entities: [{ type: 'bot_command', offset: 0, length: 6 }]
  } as TelegramMessage,

  STATUS_COMMAND: {
    message_id: 1002,
    from: MOCK_USERS.AUTHORIZED_USER,
    chat: MOCK_CHATS.PRIVATE_CHAT,
    date: Math.floor(Date.now() / 1000),
    text: '/status',
    entities: [{ type: 'bot_command', offset: 0, length: 7 }]
  } as TelegramMessage,

  BALANCE_COMMAND: {
    message_id: 1003,
    from: MOCK_USERS.AUTHORIZED_USER,
    chat: MOCK_CHATS.PRIVATE_CHAT,
    date: Math.floor(Date.now() / 1000),
    text: '/balance',
    entities: [{ type: 'bot_command', offset: 0, length: 8 }]
  } as TelegramMessage,

  UNAUTHORIZED_COMMAND: {
    message_id: 1004,
    from: MOCK_USERS.UNAUTHORIZED_USER,
    chat: MOCK_CHATS.PRIVATE_CHAT,
    date: Math.floor(Date.now() / 1000),
    text: '/status',
    entities: [{ type: 'bot_command', offset: 0, length: 7 }]
  } as TelegramMessage,

  INVALID_COMMAND: {
    message_id: 1005,
    from: MOCK_USERS.AUTHORIZED_USER,
    chat: MOCK_CHATS.PRIVATE_CHAT,
    date: Math.floor(Date.now() / 1000),
    text: '/invalidcommand',
    entities: [{ type: 'bot_command', offset: 0, length: 15 }]
  } as TelegramMessage,

  TEXT_MESSAGE: {
    message_id: 1006,
    from: MOCK_USERS.AUTHORIZED_USER,
    chat: MOCK_CHATS.PRIVATE_CHAT,
    date: Math.floor(Date.now() / 1000),
    text: 'Hello bot, how are you?'
  } as TelegramMessage
};

/**
 * Expected Bot Responses
 */
export const EXPECTED_RESPONSES = {
  START_RESPONSE: `🤖 <b>AI Crypto Trading Bot</b>

Welcome to your personal AI-powered crypto trading assistant!

<b>Available Commands:</b>
/status - Check bot and trading status
/balance - View account balance
/portfolio - Show portfolio overview
/positions - Current trading positions  
/pause - Pause trading
/resume - Resume trading
/alerts - Manage price alerts
/report - Get trading report
/help - Show this help message

<i>🔒 Secure • 🧠 AI-Powered • 📊 Real-time</i>`,

  STATUS_RESPONSE: `📊 <b>Trading Bot Status</b>

🤖 <b>Bot Status:</b> Active ✅
⚡ <b>Trading Engine:</b> Running
🧠 <b>AI Analysis:</b> Active
📡 <b>Market Data:</b> Connected

<b>Current Session:</b>
• Uptime: 2h 35m
• API Status: Connected ✅
• Last Analysis: 30s ago

<i>🕐 2025-01-15 10:00:00 UTC</i>`,

  BALANCE_RESPONSE: `💰 <b>Account Balance</b>

<b>Total Portfolio Value:</b> $125,847.32

<b>Available Balance:</b>
• USD: $12,500.00
• BTC: 0.85432 ($42,716.00)
• ETH: 15.2 ($38,456.00)
• Other: $32,175.32

<b>Performance:</b>
• Today: +$2,847.32 (+2.31%)
• This Week: +$8,234.15 (+6.98%)
• This Month: +$15,847.32 (+14.42%)

<i>🕐 Last updated: 30s ago</i>`,

  PORTFOLIO_RESPONSE: `📊 <b>Portfolio Overview</b>

<b>Total Value:</b> $125,847.32
<b>Available Cash:</b> $12,500.00 (9.9%)

<b>Holdings:</b>
🟡 BTC: 0.85432 (33.9%) - $42,716.00
🔵 ETH: 15.2 (30.5%) - $38,456.00  
🟠 SOL: 125.5 (15.2%) - $19,125.00
🟢 ADA: 8,500 (10.4%) - $13,050.00

<b>Performance (24h):</b>
• P&L: +$2,847.32 (+2.31%)
• Best: SOL +5.2%
• Worst: ADA -1.8%

<i>🕐 Last updated: 1m ago</i>`,

  UNAUTHORIZED_RESPONSE: `🚫 <b>Access Denied</b>

You are not authorized to use this bot.

If you believe this is an error, please contact the administrator.

<i>User ID: 987654321</i>`,

  HELP_RESPONSE: `❓ <b>Bot Help & Commands</b>

<b>Trading Commands:</b>
/status - Bot and system status
/balance - Account balance overview
/portfolio - Portfolio holdings
/positions - Active positions
/pause - Pause all trading
/resume - Resume trading

<b>Information Commands:</b>
/alerts - Manage price alerts
/report - Generate trading report
/help - This help message

<b>Settings:</b>
/settings - Bot configuration

<b>Security Features:</b>
🔒 User authentication
🛡️ Risk management
📊 Real-time monitoring

Need help? Contact support.`,

  ERROR_RESPONSE: `❌ <b>Error</b>

Something went wrong while processing your request.

Please try again later or contact support if the problem persists.

<i>Error ID: ERR_001</i>`
};

/**
 * Mock Bot API Responses
 */
export const TELEGRAM_API_RESPONSES = {
  SEND_MESSAGE_SUCCESS: {
    ok: true,
    result: {
      message_id: 2001,
      from: {
        id: 987654321,
        is_bot: true,
        first_name: 'AI Trading Bot',
        username: 'aitradingbot'
      },
      chat: MOCK_CHATS.PRIVATE_CHAT,
      date: Math.floor(Date.now() / 1000),
      text: 'Message sent successfully'
    }
  },

  SEND_MESSAGE_ERROR: {
    ok: false,
    error_code: 400,
    description: 'Bad Request: message is too long'
  },

  GET_ME_SUCCESS: {
    ok: true,
    result: {
      id: 987654321,
      is_bot: true,
      first_name: 'AI Trading Bot',
      username: 'aitradingbot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false
    }
  },

  WEBHOOK_INFO_SUCCESS: {
    ok: true,
    result: {
      url: 'https://example.com/webhook',
      has_custom_certificate: false,
      pending_update_count: 0,
      last_error_date: null,
      last_error_message: null,
      max_connections: 40,
      allowed_updates: ['message', 'callback_query']
    }
  }
};

/**
 * Mock Trading Data for Bot Responses
 */
export const MOCK_TRADING_DATA = {
  PORTFOLIO_BALANCE: {
    totalValue: 125847.32,
    availableCash: 12500.00,
    positions: [
      { symbol: 'BTC', amount: 0.85432, value: 42716.00, percentage: 33.9, change24h: 2.1 },
      { symbol: 'ETH', amount: 15.2, value: 38456.00, percentage: 30.5, change24h: 1.8 },
      { symbol: 'SOL', amount: 125.5, value: 19125.00, percentage: 15.2, change24h: 5.2 },
      { symbol: 'ADA', amount: 8500, value: 13050.00, percentage: 10.4, change24h: -1.8 }
    ],
    performance: {
      today: { pnl: 2847.32, percentage: 2.31 },
      week: { pnl: 8234.15, percentage: 6.98 },
      month: { pnl: 15847.32, percentage: 14.42 }
    }
  },

  ACTIVE_POSITIONS: [
    {
      id: 'pos_001',
      symbol: 'BTC/USD',
      side: 'LONG',
      size: 0.25,
      entryPrice: 49500,
      currentPrice: 50200,
      pnl: 175.00,
      pnlPercentage: 1.41,
      stopLoss: 48000,
      takeProfit: 52000,
      openTime: '2025-01-15T08:30:00Z'
    },
    {
      id: 'pos_002', 
      symbol: 'ETH/USD',
      side: 'LONG',
      size: 2.5,
      entryPrice: 2420,
      currentPrice: 2480,
      pnl: 150.00,
      pnlPercentage: 2.48,
      stopLoss: 2350,
      takeProfit: 2600,
      openTime: '2025-01-15T09:15:00Z'
    }
  ],

  TRADING_STATUS: {
    botActive: true,
    tradingEnabled: true,
    aiAnalysisActive: true,
    marketDataConnected: true,
    uptime: '2h 35m',
    lastAnalysis: '30s ago',
    apiStatus: 'Connected'
  },

  PRICE_ALERTS: [
    { id: 'alert_001', symbol: 'BTC/USD', price: 52000, type: 'above', active: true },
    { id: 'alert_002', symbol: 'ETH/USD', price: 2300, type: 'below', active: true },
    { id: 'alert_003', symbol: 'SOL/USD', price: 200, type: 'above', active: false }
  ]
};

/**
 * Webhook Test Data
 */
export const WEBHOOK_UPDATES = {
  SINGLE_MESSAGE: {
    update_id: 10001,
    message: COMMAND_MESSAGES.STATUS_COMMAND
  } as TelegramUpdate,

  BATCH_UPDATES: [
    { update_id: 10001, message: COMMAND_MESSAGES.START_COMMAND },
    { update_id: 10002, message: COMMAND_MESSAGES.STATUS_COMMAND },
    { update_id: 10003, message: COMMAND_MESSAGES.BALANCE_COMMAND }
  ] as TelegramUpdate[],

  EDITED_MESSAGE: {
    update_id: 10004,
    edited_message: {
      ...COMMAND_MESSAGES.STATUS_COMMAND,
      text: '/status edited',
      edit_date: Math.floor(Date.now() / 1000)
    }
  } as TelegramUpdate,

  CALLBACK_QUERY: {
    update_id: 10005,
    callback_query: {
      id: 'callback_001',
      from: MOCK_USERS.AUTHORIZED_USER,
      message: COMMAND_MESSAGES.STATUS_COMMAND,
      data: 'refresh_status'
    }
  } as TelegramUpdate
};

/**
 * Rate Limiting Test Data
 */
export const RATE_LIMIT_SCENARIOS = {
  NORMAL_USAGE: Array.from({ length: 10 }, (_, i) => ({
    userId: MOCK_USERS.AUTHORIZED_USER.id,
    timestamp: Date.now() + i * 5000, // 5 seconds apart
    command: '/status'
  })),

  SPAM_ATTEMPT: Array.from({ length: 50 }, (_, i) => ({
    userId: MOCK_USERS.UNAUTHORIZED_USER.id,
    timestamp: Date.now() + i * 100, // 100ms apart (spam)
    command: '/status'
  })),

  BURST_THEN_NORMAL: [
    // Burst
    ...Array.from({ length: 20 }, (_, i) => ({
      userId: MOCK_USERS.AUTHORIZED_USER.id,
      timestamp: Date.now() + i * 200,
      command: '/balance'
    })),
    // Then normal
    ...Array.from({ length: 5 }, (_, i) => ({
      userId: MOCK_USERS.AUTHORIZED_USER.id,
      timestamp: Date.now() + 10000 + i * 5000,
      command: '/status'
    }))
  ]
};

/**
 * Error Scenarios
 */
export const ERROR_SCENARIOS = {
  NETWORK_ERROR: new Error('Network timeout'),
  API_ERROR: new Error('Telegram API returned 429: Too Many Requests'),
  INVALID_TOKEN: new Error('Unauthorized: Invalid bot token'),
  MALFORMED_UPDATE: { invalid: 'update', missing: 'required fields' },
  EMPTY_MESSAGE: { update_id: 10006, message: { ...COMMAND_MESSAGES.STATUS_COMMAND, text: '' } }
};

/**
 * Security Test Data
 */
export const SECURITY_SCENARIOS = {
  SQL_INJECTION_ATTEMPT: {
    ...COMMAND_MESSAGES.TEXT_MESSAGE,
    text: '/status; DROP TABLE users; --'
  },

  XSS_ATTEMPT: {
    ...COMMAND_MESSAGES.TEXT_MESSAGE,
    text: '<script>alert("xss")</script>'
  },

  LARGE_MESSAGE: {
    ...COMMAND_MESSAGES.TEXT_MESSAGE,
    text: 'A'.repeat(5000) // Oversized message
  },

  UNAUTHORIZED_ADMIN_COMMAND: {
    ...COMMAND_MESSAGES.STATUS_COMMAND,
    from: MOCK_USERS.UNAUTHORIZED_USER,
    text: '/admin shutdown'
  }
};

export default {
  MOCK_USERS,
  MOCK_CHATS,
  BOT_COMMANDS,
  COMMAND_MESSAGES,
  EXPECTED_RESPONSES,
  TELEGRAM_API_RESPONSES,
  MOCK_TRADING_DATA,
  WEBHOOK_UPDATES,
  RATE_LIMIT_SCENARIOS,
  ERROR_SCENARIOS,
  SECURITY_SCENARIOS
};