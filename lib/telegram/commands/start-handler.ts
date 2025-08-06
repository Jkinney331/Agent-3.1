import { TradingBotContext } from '../types';
import { formatters } from '../utils/formatters';

/**
 * Start command handler - Bot initialization and welcome
 * Mobile-optimized welcome experience with clear next steps
 */
export async function startHandler(ctx: TradingBotContext): Promise<void> {
  const user = ctx.from;
  if (!user) return;

  const welcomeMessage = formatters.buildWelcomeMessage(user);
  
  // Send welcome message with setup options
  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔐 Connect Trading Account', callback_data: 'setup_account' }
        ],
        [
          { text: '📊 View Demo Dashboard', callback_data: 'demo_dashboard' },
          { text: '📚 Quick Tutorial', callback_data: 'tutorial_start' }
        ],
        [
          { text: '⚙️ Configure Settings', callback_data: 'settings_initial' },
          { text: '💬 Get Support', callback_data: 'support_menu' }
        ],
        [
          { text: '📋 Feature Overview', callback_data: 'features_overview' }
        ]
      ]
    }
  });

  // Track user if new
  if (ctx.user?.isAuthenticated === false) {
    await handleNewUser(ctx);
  }

  // Update session
  ctx.session.currentCommand = 'start';
  ctx.session.commandState = { step: 'welcome' };
}

/**
 * Handle new user onboarding
 */
async function handleNewUser(ctx: TradingBotContext): Promise<void> {
  // Send additional onboarding info after a short delay
  setTimeout(async () => {
    const onboardingMessage = formatters.buildOnboardingMessage();
    
    await ctx.reply(onboardingMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Start Setup Now', callback_data: 'onboarding_setup' },
            { text: '⏸️ Setup Later', callback_data: 'onboarding_skip' }
          ]
        ]
      }
    });
  }, 2000);
}

/**
 * Handle setup account callback
 */
export async function handleSetupAccount(ctx: TradingBotContext): Promise<void> {
  const setupMessage = 
    '🔐 <b>Trading Account Setup</b>\n\n' +
    '🔒 Your credentials are encrypted and stored securely\n' +
    '📱 Setup is optimized for mobile devices\n' +
    '⚡ Takes less than 2 minutes\n\n' +
    '<b>Supported Exchanges:</b>\n' +
    '• Binance (Recommended)\n' +
    '• Coinbase Pro\n' +
    '• Kraken\n' +
    '• Alpaca (Stocks)\n\n' +
    'Choose your preferred exchange to continue:';

  await ctx.editMessageText(setupMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🟡 Binance', callback_data: 'setup_binance' },
          { text: '🔵 Coinbase Pro', callback_data: 'setup_coinbase' }
        ],
        [
          { text: '🟣 Kraken', callback_data: 'setup_kraken' },
          { text: '📈 Alpaca', callback_data: 'setup_alpaca' }
        ],
        [
          { text: '📋 Paper Trading (Demo)', callback_data: 'setup_paper' }
        ],
        [
          { text: '⬅️ Back to Welcome', callback_data: 'back_to_welcome' }
        ]
      ]
    }
  });
}

/**
 * Handle demo dashboard callback
 */
export async function handleDemoUser(ctx: TradingBotContext): Promise<void> {
  const demoMessage = 
    '📊 <b>Demo Dashboard</b>\n\n' +
    '🎯 <b>Current Status:</b> Demo Mode\n' +
    '💰 <b>Virtual Balance:</b> $10,000\n' +
    '📈 <b>Today\'s P&L:</b> +$127.50 (+1.28%)\n' +
    '🎪 <b>Active Positions:</b> 3\n\n' +
    '📱 <b>Quick Actions:</b>';

  await ctx.editMessageText(demoMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 View Positions', callback_data: 'demo_positions' },
          { text: '💰 Portfolio', callback_data: 'demo_balance' }
        ],
        [
          { text: '📈 Performance', callback_data: 'demo_performance' },
          { text: '⚠️ Risk Metrics', callback_data: 'demo_risk' }
        ],
        [
          { text: '🤖 AI Insights', callback_data: 'demo_ai' }
        ],
        [
          { text: '🔐 Setup Real Account', callback_data: 'setup_account' },
          { text: '⬅️ Back', callback_data: 'back_to_welcome' }
        ]
      ]
    }
  });
}

/**
 * Handle tutorial start callback
 */
export async function handleTutorial(ctx: TradingBotContext): Promise<void> {
  const tutorialMessage = 
    '📚 <b>Quick Tutorial</b>\n\n' +
    '👋 Welcome to your AI-powered trading assistant!\n\n' +
    '<b>🎯 What I can do for you:</b>\n' +
    '• 📊 Monitor your portfolio 24/7\n' +
    '• 🤖 Execute AI-driven trades\n' +
    '• ⚠️ Manage risk automatically\n' +
    '• 📱 Send real-time notifications\n\n' +
    '<b>🚀 Getting started is easy:</b>\n' +
    '1. Connect your exchange account\n' +
    '2. Configure your risk preferences\n' +
    '3. Choose trading strategies\n' +
    '4. Start automated trading!\n\n' +
    'Select a topic to learn more:';

  await ctx.editMessageText(tutorialMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔐 Account Setup', callback_data: 'tutorial_setup' },
          { text: '⚙️ Configuration', callback_data: 'tutorial_config' }
        ],
        [
          { text: '🤖 Trading Strategies', callback_data: 'tutorial_strategies' },
          { text: '⚠️ Risk Management', callback_data: 'tutorial_risk' }
        ],
        [
          { text: '📱 Commands Guide', callback_data: 'tutorial_commands' }
        ],
        [
          { text: '✅ Skip Tutorial', callback_data: 'tutorial_complete' },
          { text: '⬅️ Back', callback_data: 'back_to_welcome' }
        ]
      ]
    }
  });
}

/**
 * Handle feature overview callback
 */
export async function handleFeatureOverview(ctx: TradingBotContext): Promise<void> {
  const featuresMessage = 
    '📋 <b>Feature Overview</b>\n\n' +
    '🆓 <b>FREE Features:</b>\n' +
    '• Basic portfolio monitoring\n' +
    '• Manual trade execution\n' +
    '• Basic risk alerts\n' +
    '• 50 commands/day\n\n' +
    '💎 <b>PREMIUM Features:</b>\n' +
    '• AI-powered auto trading\n' +
    '• Advanced risk management\n' +
    '• Real-time market analysis\n' +
    '• Custom strategies\n' +
    '• 500 commands/day\n\n' +
    '🚀 <b>PRO Features:</b>\n' +
    '• Unlimited everything\n' +
    '• Priority support\n' +
    '• Advanced analytics\n' +
    '• Multiple exchanges\n' +
    '• Custom indicators';

  await ctx.editMessageText(featuresMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Start Free Trial', callback_data: 'trial_start' }
        ],
        [
          { text: '💎 View Premium', callback_data: 'premium_info' },
          { text: '🚀 View Pro', callback_data: 'pro_info' }
        ],
        [
          { text: '🔐 Setup Account', callback_data: 'setup_account' },
          { text: '⬅️ Back', callback_data: 'back_to_welcome' }
        ]
      ]
    }
  });
}

/**
 * Handle back to welcome callback
 */
export async function handleBackToWelcome(ctx: TradingBotContext): Promise<void> {
  await ctx.deleteMessage();
  await startHandler(ctx);
}