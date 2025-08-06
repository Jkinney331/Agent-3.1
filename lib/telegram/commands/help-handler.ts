import { TradingBotContext } from '../types';
import { formatters } from '../utils/formatters';

/**
 * Help command handler - Interactive help system and documentation
 * Mobile-optimized help interface with contextual assistance
 */
export async function helpHandler(ctx: TradingBotContext): Promise<void> {
  try {
    const helpMessage = formatters.formatHelpMenu();
    
    await ctx.reply(helpMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Getting Started', callback_data: 'help_getting_started' },
            { text: '📊 Commands Guide', callback_data: 'help_commands' }
          ],
          [
            { text: '🤖 Trading Features', callback_data: 'help_trading' },
            { text: '⚠️ Risk Management', callback_data: 'help_risk' }
          ],
          [
            { text: '🔔 Notifications', callback_data: 'help_notifications' },
            { text: '⚙️ Settings Guide', callback_data: 'help_settings' }
          ],
          [
            { text: '❓ FAQ', callback_data: 'help_faq' },
            { text: '🛠️ Troubleshooting', callback_data: 'help_troubleshooting' }
          ],
          [
            { text: '📞 Contact Support', callback_data: 'help_contact' },
            { text: '📋 Feature Requests', callback_data: 'help_features' }
          ],
          [
            { text: '🎓 Video Tutorials', callback_data: 'help_videos' },
            { text: '📚 Documentation', callback_data: 'help_docs' }
          ]
        ]
      }
    });

    // Update session
    ctx.session.currentCommand = 'help';

  } catch (error) {
    console.error('Help handler error:', error);
    await ctx.reply('❌ Failed to load help menu. Please try again.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'help_retry' },
          { text: '📞 Direct Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Handle getting started guide
 */
export async function handleGettingStarted(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🚀 Loading getting started guide...');
  
  const gettingStartedMessage = `
🚀 <b>Getting Started Guide</b>

<b>👋 Welcome to AI Crypto Trading Bot!</b>

<b>🎯 Quick Setup (2 minutes):</b>

<b>1. Connect Your Exchange</b> 🔐
• Tap "Connect Trading Account"
• Choose your exchange (Binance recommended)
• Enter API credentials securely
• Verify connection

<b>2. Configure Risk Settings</b> ⚠️
• Set maximum drawdown (recommended: 10-15%)
• Define position size limits
• Configure daily loss limits
• Enable emergency stops

<b>3. Choose Trading Strategies</b> 🤖
• AI Momentum (recommended for beginners)
• Mean Reversion (stable performance)
• Trend Following (trending markets)
• Or start with Paper Trading

<b>4. Set Up Notifications</b> 🔔
• Enable trade alerts
• Configure profit/loss thresholds
• Set up daily reports
• Choose notification timing

<b>💡 Pro Tips:</b>
• Start with small position sizes
• Use paper trading to test strategies
• Monitor your first few trades closely
• Gradually increase risk as you gain confidence

Ready to begin? Choose your next step:`;

  await ctx.editMessageText(gettingStartedMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔐 Connect Exchange', callback_data: 'setup_account' },
          { text: '🎯 Paper Trading', callback_data: 'setup_paper' }
        ],
        [
          { text: '⚠️ Risk Settings', callback_data: 'help_risk_setup' },
          { text: '🤖 Strategy Guide', callback_data: 'help_strategies_guide' }
        ],
        [
          { text: '📱 Mobile Tips', callback_data: 'help_mobile_tips' },
          { text: '🎓 Video Tutorial', callback_data: 'help_setup_video' }
        ],
        [
          { text: '⬅️ Back to Help', callback_data: 'back_to_help' }
        ]
      ]
    }
  });
}

/**
 * Handle commands guide
 */
export async function handleCommandsGuide(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📊 Loading commands guide...');
  
  const commandsMessage = `
📊 <b>Commands Guide</b>

<b>🎯 Essential Commands:</b>

<b>/start</b> 🚀
• Initialize bot and setup
• Access welcome menu
• Quick account setup

<b>/status</b> 📊
• View current trading status
• Check active positions
• See real-time P&L
• Monitor AI recommendations

<b>/balance</b> 💰
• Portfolio overview
• Performance metrics
• Asset allocation
• Transaction history

<b>/pause</b> ⏸️
• Safely pause all trading
• Keep existing positions
• Stop new trade signals
• Maintain risk monitoring

<b>/resume</b> ▶️
• Resume trading operations
• Activate all strategies
• Re-enable trade signals
• Continue AI analysis

<b>/settings</b> ⚙️
• Configure risk parameters
• Adjust notifications
• Modify display preferences
• Manage security settings

<b>/help</b> ❓
• Access this help system
• Get contextual assistance
• Find troubleshooting guides
• Contact support

<b>💡 Command Tips:</b>
• Commands work in any chat with the bot
• Use buttons for faster navigation
• Commands have cooldowns to prevent spam
• Some commands require authentication

<b>📱 Mobile Shortcuts:</b>
• Tap buttons instead of typing
• Use quick actions menu
• Swipe for navigation options
• Long press for additional options

Select a command to learn more:`;

  await ctx.editMessageText(commandsMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 /status Details', callback_data: 'help_status_cmd' },
          { text: '💰 /balance Details', callback_data: 'help_balance_cmd' }
        ],
        [
          { text: '⏸️ /pause Guide', callback_data: 'help_pause_cmd' },
          { text: '▶️ /resume Guide', callback_data: 'help_resume_cmd' }
        ],
        [
          { text: '⚙️ /settings Guide', callback_data: 'help_settings_cmd' },
          { text: '🚀 /start Guide', callback_data: 'help_start_cmd' }
        ],
        [
          { text: '🎯 Quick Actions', callback_data: 'help_quick_actions' },
          { text: '📱 Mobile Tips', callback_data: 'help_mobile_usage' }
        ],
        [
          { text: '⬅️ Back to Help', callback_data: 'back_to_help' }
        ]
      ]
    }
  });
}

/**
 * Handle trading features help
 */
export async function handleTradingHelp(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🤖 Loading trading features...');
  
  const tradingMessage = `
🤖 <b>Trading Features Guide</b>

<b>🎯 AI-Powered Trading:</b>

<b>Smart Strategies</b> 🧠
• AI Momentum: Detects trend acceleration
• Mean Reversion: Finds overextended moves  
• Breakout Scanner: Identifies key levels
• Trend Following: Rides established trends

<b>Market Analysis</b> 📊
• Real-time sentiment analysis
• Fear & Greed index monitoring
• Technical indicator synthesis
• Multi-timeframe analysis

<b>Position Management</b> 💼
• Dynamic position sizing
• Automated stop losses
• Trailing stop optimization
• Take profit management

<b>Risk Controls</b> 🛡️
• Portfolio drawdown limits
• Daily loss protection
• Leverage restrictions
• Emergency stop mechanisms

<b>🔥 Advanced Features:</b>

<b>Auto-Trading</b> ⚡
• 24/7 market monitoring
• Instant signal execution
• Multi-exchange support
• Latency optimization

<b>Portfolio Rebalancing</b> ⚖️
• Automatic allocation adjustment
• Risk parity maintenance
• Correlation monitoring
• Diversification optimization

<b>Performance Analytics</b> 📈
• Real-time P&L tracking
• Strategy performance metrics
• Risk-adjusted returns
• Drawdown analysis

<b>📱 Mobile Optimization:</b>
• One-tap trade approval
• Push notifications
• Offline capability
• Touch-friendly interface

Learn more about specific features:`;

  await ctx.editMessageText(tradingMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🧠 AI Strategies', callback_data: 'help_ai_strategies' },
          { text: '📊 Market Analysis', callback_data: 'help_market_analysis' }
        ],
        [
          { text: '💼 Position Management', callback_data: 'help_position_mgmt' },
          { text: '🛡️ Risk Controls', callback_data: 'help_risk_controls' }
        ],
        [
          { text: '⚡ Auto-Trading', callback_data: 'help_auto_trading' },
          { text: '📈 Analytics', callback_data: 'help_analytics' }
        ],
        [
          { text: '🎓 Strategy Tutorial', callback_data: 'help_strategy_tutorial' },
          { text: '📱 Mobile Features', callback_data: 'help_mobile_features' }
        ],
        [
          { text: '⬅️ Back to Help', callback_data: 'back_to_help' }
        ]
      ]
    }
  });
}

/**
 * Handle FAQ
 */
export async function handleFAQ(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('❓ Loading FAQ...');
  
  const faqMessage = `
❓ <b>Frequently Asked Questions</b>

<b>🔐 Security & Safety:</b>

<b>Q: Is my money safe?</b>
A: Yes! We use read-only API keys and never hold your funds. Your crypto stays in your exchange account.

<b>Q: How secure are my API keys?</b>
A: All credentials are encrypted with bank-level security. We never store trading permissions.

<b>Q: Can you withdraw my funds?</b>
A: No. We only use read and trade permissions, never withdrawal access.

<b>💰 Trading & Performance:</b>

<b>Q: How much can I expect to earn?</b>
A: Returns vary by market conditions. Our AI aims for consistent, risk-adjusted profits.

<b>Q: What's the minimum deposit?</b>
A: Most exchanges require $100-500 minimum. We recommend starting with $1000+.

<b>Q: How often does the bot trade?</b>
A: Varies by strategy and market conditions. Could be 0-10 trades per day.

<b>⚙️ Technical Questions:</b>

<b>Q: Which exchanges are supported?</b>
A: Binance, Coinbase Pro, Kraken, and Alpaca (stocks).

<b>Q: Does it work on mobile?</b>
A: Yes! Fully optimized for mobile trading on-the-go.

<b>Q: Can I override the AI?</b>
A: Absolutely. You have full control and can pause/resume anytime.

<b>💎 Subscription & Features:</b>

<b>Q: What's included in free plan?</b>
A: Basic monitoring, manual trading, 50 commands/day.

<b>Q: When should I upgrade?</b>
A: When you want auto-trading, advanced strategies, unlimited commands.

Browse more topics:`;

  await ctx.editMessageText(faqMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔐 Security FAQ', callback_data: 'faq_security' },
          { text: '💰 Trading FAQ', callback_data: 'faq_trading' }
        ],
        [
          { text: '⚙️ Technical FAQ', callback_data: 'faq_technical' },
          { text: '💎 Subscription FAQ', callback_data: 'faq_subscription' }
        ],
        [
          { text: '🤖 AI & Strategy FAQ', callback_data: 'faq_ai' },
          { text: '📱 Mobile FAQ', callback_data: 'faq_mobile' }
        ],
        [
          { text: '💡 Tips & Tricks', callback_data: 'help_tips' },
          { text: '📞 Ask Question', callback_data: 'help_ask_question' }
        ],
        [
          { text: '⬅️ Back to Help', callback_data: 'back_to_help' }
        ]
      ]
    }
  });
}

/**
 * Handle troubleshooting
 */
export async function handleTroubleshooting(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🛠️ Loading troubleshooting guide...');
  
  const troubleshootingMessage = `
🛠️ <b>Troubleshooting Guide</b>

<b>🔧 Common Issues & Solutions:</b>

<b>❌ "API Key Error"</b>
• Verify API key and secret are correct
• Check if key has trading permissions
• Ensure IP restrictions allow our servers
• Try regenerating API keys

<b>📊 "No Trading Signals"</b>
• Check if trading is paused
• Verify strategies are enabled
• Confirm market conditions meet criteria
• Review risk limits aren't restricting

<b>💰 "Balance Not Updating"</b>
• Check exchange connection status
• Verify API permissions include account info
• Try refreshing manually with /balance
• Check if exchange is under maintenance

<b>🔔 "Missing Notifications"</b>
• Verify notification settings are enabled
• Check Telegram notification permissions
• Ensure you haven't muted the bot
• Review alert thresholds

<b>⚡ "Slow Response"</b>
• Check your internet connection
• Try restarting the command
• Clear Telegram cache
• Contact support if persistent

<b>🛡️ "Risk Alerts Firing"</b>
• Review your risk settings
• Check current drawdown levels
• Verify position sizes are appropriate
• Consider pausing trading temporarily

<b>🔄 Quick Fixes:</b>
• Restart bot: /start
• Refresh data: Use refresh buttons
• Clear session: Close and reopen chat
• Update app: Ensure latest Telegram version

<b>📞 When to Contact Support:</b>
• API connection fails repeatedly
• Unexpected trade executions
• Data showing incorrectly for >1 hour
• Security concerns

Get specific help:`;

  await ctx.editMessageText(troubleshootingMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔐 API Issues', callback_data: 'troubleshoot_api' },
          { text: '📊 Data Problems', callback_data: 'troubleshoot_data' }
        ],
        [
          { text: '🔔 Notification Issues', callback_data: 'troubleshoot_notifications' },
          { text: '💰 Balance Problems', callback_data: 'troubleshoot_balance' }
        ],
        [
          { text: '🤖 Trading Issues', callback_data: 'troubleshoot_trading' },
          { text: '📱 Mobile Problems', callback_data: 'troubleshoot_mobile' }
        ],
        [
          { text: '🔧 System Status', callback_data: 'system_status' },
          { text: '📞 Contact Support', callback_data: 'contact_support_urgent' }
        ],
        [
          { text: '⬅️ Back to Help', callback_data: 'back_to_help' }
        ]
      ]
    }
  });
}

/**
 * Handle contact support
 */
export async function handleContactSupport(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📞 Loading support options...');
  
  const supportMessage = `
📞 <b>Contact Support</b>

<b>🚀 Get Help Fast:</b>

<b>💬 Live Chat Support</b>
• Available 24/7
• Average response: 2 minutes
• For urgent trading issues

<b>📧 Email Support</b>
• support@aitradingbot.com
• Detailed issue tracking
• Response within 4 hours

<b>📋 Support Ticket</b>
• Structured problem reporting
• Priority handling
• Include screenshots/logs

<b>🎓 Self-Service Options:</b>
• Video tutorials
• Knowledge base
• Community forum
• FAQ section

<b>🆘 Emergency Support:</b>
For critical issues (funds at risk):
• Call: +1-800-TRADE-AI
• Telegram: @TradingBotSupport
• Email: emergency@aitradingbot.com

<b>📊 Before Contacting Support:</b>
• Note your user ID: ${ctx.from?.id}
• Describe the exact issue
• Include error messages
• Mention when it started

<b>💡 Faster Resolution Tips:</b>
• Check FAQ first
• Try troubleshooting steps
• Provide specific details
• Include screenshots if relevant

Choose your preferred support method:`;

  await ctx.editMessageText(supportMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💬 Live Chat', callback_data: 'support_live_chat' },
          { text: '📧 Email Support', callback_data: 'support_email' }
        ],
        [
          { text: '📋 Create Ticket', callback_data: 'support_ticket' },
          { text: '🆘 Emergency', callback_data: 'support_emergency' }
        ],
        [
          { text: '🎓 Self-Help', callback_data: 'support_self_help' },
          { text: '👥 Community', callback_data: 'support_community' }
        ],
        [
          { text: '📊 System Status', callback_data: 'support_status' },
          { text: '💰 Account Issues', callback_data: 'support_account' }
        ],
        [
          { text: '⬅️ Back to Help', callback_data: 'back_to_help' }
        ]
      ]
    }
  });
}

/**
 * Handle back to help callback
 */
export async function handleBackToHelp(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery();
  await helpHandler(ctx);
}