import { NarrowedContext } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { TradingBotContext, CallbackHandler } from '../types';

// Import callback handlers
import { 
  handleSetupAccount, 
  handleDemoUser, 
  handleTutorial, 
  handleFeatureOverview, 
  handleBackToWelcome 
} from '../commands/start-handler';

import {
  handleStatusRefresh,
  handleStatusPositions,
  handleStatusAI,
  handleStatusShare,
  handleBackToStatus
} from '../commands/status-handler';

import {
  handleBalanceRefresh,
  handleBalanceBreakdown,
  handleBalanceChart,
  handleBalanceDeposit,
  handleBalanceWithdraw,
  handleBalanceExport,
  handleBackToBalance
} from '../commands/balance-handler';

import {
  handleConfirmPause,
  handleConfirmResume,
  handleReviewPositionsBeforePause,
  handleCancelControlAction
} from '../commands/control-handler';

import {
  handleRiskSettings,
  handleNotificationSettings,
  handleDisplaySettings,
  handleSecuritySettings,
  handleStrategySettings,
  handleBackToSettings
} from '../commands/settings-handler';

import {
  handleGettingStarted,
  handleCommandsGuide,
  handleTradingHelp,
  handleFAQ,
  handleTroubleshooting,
  handleContactSupport,
  handleBackToHelp
} from '../commands/help-handler';

/**
 * Callback router for handling inline keyboard interactions
 * Mobile-optimized with proper error handling and state management
 */
export class CallbackRouter {
  private handlers: Map<string, CallbackHandler> = new Map();

  constructor() {
    this.registerCallbacks();
  }

  /**
   * Register all callback handlers
   */
  private registerCallbacks(): void {
    // Start command callbacks
    this.handlers.set('setup_account', handleSetupAccount);
    this.handlers.set('demo_dashboard', handleDemoUser);
    this.handlers.set('tutorial_start', handleTutorial);
    this.handlers.set('features_overview', handleFeatureOverview);
    this.handlers.set('back_to_welcome', handleBackToWelcome);

    // Status command callbacks
    this.handlers.set('status_refresh', handleStatusRefresh);
    this.handlers.set('status_positions', handleStatusPositions);
    this.handlers.set('status_ai', handleStatusAI);
    this.handlers.set('status_share', handleStatusShare);
    this.handlers.set('back_to_status', handleBackToStatus);

    // Balance command callbacks
    this.handlers.set('balance_refresh', handleBalanceRefresh);
    this.handlers.set('balance_breakdown', handleBalanceBreakdown);
    this.handlers.set('balance_chart', handleBalanceChart);
    this.handlers.set('balance_deposit', handleBalanceDeposit);
    this.handlers.set('balance_withdraw', handleBalanceWithdraw);
    this.handlers.set('balance_export', handleBalanceExport);
    this.handlers.set('back_to_balance', handleBackToBalance);

    // Control command callbacks
    this.handlers.set('confirm_pause_trading', handleConfirmPause);
    this.handlers.set('confirm_resume_trading', handleConfirmResume);
    this.handlers.set('review_positions_before_pause', handleReviewPositionsBeforePause);
    this.handlers.set('cancel_control_action', handleCancelControlAction);

    // Settings command callbacks
    this.handlers.set('settings_risk', handleRiskSettings);
    this.handlers.set('settings_notifications', handleNotificationSettings);
    this.handlers.set('settings_display', handleDisplaySettings);
    this.handlers.set('settings_security', handleSecuritySettings);
    this.handlers.set('settings_strategies', handleStrategySettings);
    this.handlers.set('back_to_settings', handleBackToSettings);

    // Help command callbacks
    this.handlers.set('help_getting_started', handleGettingStarted);
    this.handlers.set('help_commands', handleCommandsGuide);
    this.handlers.set('help_trading', handleTradingHelp);
    this.handlers.set('help_faq', handleFAQ);
    this.handlers.set('help_troubleshooting', handleTroubleshooting);
    this.handlers.set('help_contact', handleContactSupport);
    this.handlers.set('back_to_help', handleBackToHelp);

    // Interactive feature callbacks
    this.registerInteractiveCallbacks();
  }

  /**
   * Register interactive feature callbacks
   */
  private registerInteractiveCallbacks(): void {
    // Quick actions
    this.handlers.set('quick_pause', this.handleQuickPause.bind(this));
    this.handlers.set('quick_resume', this.handleQuickResume.bind(this));
    this.handlers.set('quick_status', this.handleQuickStatus.bind(this));
    this.handlers.set('quick_balance', this.handleQuickBalance.bind(this));

    // Notification toggles
    this.handlers.set('toggle_trades_notifications', this.handleToggleNotification.bind(this, 'trades'));
    this.handlers.set('toggle_profits_notifications', this.handleToggleNotification.bind(this, 'profits'));
    this.handlers.set('toggle_losses_notifications', this.handleToggleNotification.bind(this, 'losses'));
    this.handlers.set('toggle_risk_notifications', this.handleToggleNotification.bind(this, 'riskAlerts'));
    this.handlers.set('toggle_daily_notifications', this.handleToggleNotification.bind(this, 'dailyReports'));
    this.handlers.set('toggle_market_notifications', this.handleToggleNotification.bind(this, 'marketUpdates'));

    // Subscription and upgrade callbacks
    this.handlers.set('upgrade_premium', this.handleUpgrade.bind(this, 'premium'));
    this.handlers.set('upgrade_pro', this.handleUpgrade.bind(this, 'pro'));
    this.handlers.set('subscription_plans', this.handleSubscriptionPlans.bind(this));

    // System callbacks
    this.handlers.set('system_status', this.handleSystemStatus.bind(this));
    this.handlers.set('contact_support', this.handleSupportContact.bind(this));
    this.handlers.set('loading', this.handleLoading.bind(this));

    // Error handling callbacks
    this.handlers.set('retry_last_command', this.handleRetryLastCommand.bind(this));
    this.handlers.set('refresh_data', this.handleRefreshData.bind(this));
  }

  /**
   * Route callback to appropriate handler
   */
  async routeCallback(ctx: NarrowedContext<TradingBotContext, Update.CallbackQueryUpdate>): Promise<void> {
    try {
      const callbackData = ctx.callbackQuery.data;
      if (!callbackData) return;

      // Parse callback data (support for complex data structures)
      const [action, ...params] = callbackData.split('_');
      const fullAction = callbackData;

      const handler = this.handlers.get(fullAction) || this.handlers.get(action);
      
      if (handler) {
        await handler(ctx);
      } else {
        console.warn(`No handler found for callback: ${callbackData}`);
        await this.handleUnknownCallback(ctx, callbackData);
      }

    } catch (error) {
      console.error('Callback routing error:', error);
      await this.handleCallbackError(ctx, error);
    }
  }

  // Interactive callback handlers

  private async handleQuickPause(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('⏸️ Quick pause initiated...');
    await handleConfirmPause(ctx);
  }

  private async handleQuickResume(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('▶️ Quick resume initiated...');
    await handleConfirmResume(ctx);
  }

  private async handleQuickStatus(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('📊 Loading status...');
    await handleStatusRefresh(ctx);
  }

  private async handleQuickBalance(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('💰 Loading balance...');
    await handleBalanceRefresh(ctx);
  }

  private async handleToggleNotification(
    notificationType: string, 
    ctx: TradingBotContext
  ): Promise<void> {
    await ctx.answerCbQuery(`🔔 Toggling ${notificationType} notifications...`);
    
    try {
      // Update notification setting
      const currentSettings = ctx.user?.settings || await this.getUserSettings(ctx.user?.id || '');
      const newValue = !currentSettings.notifications[notificationType as keyof typeof currentSettings.notifications];
      
      // Save updated settings
      await this.updateNotificationSetting(ctx.user?.id || '', notificationType, newValue);
      
      // Refresh settings display
      await handleNotificationSettings(ctx);
      
    } catch (error) {
      console.error('Toggle notification error:', error);
      await ctx.editMessageText('❌ Failed to update notification setting. Please try again.');
    }
  }

  private async handleUpgrade(tier: string, ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery(`💎 Loading ${tier} upgrade...`);
    
    const upgradeMessage = `
💎 <b>${tier.toUpperCase()} Subscription</b>

<b>🚀 Unlock Premium Features:</b>
${tier === 'premium' ? this.getPremiumFeatures() : this.getProFeatures()}

<b>💰 Pricing:</b>
• Monthly: $${tier === 'premium' ? '29' : '99'}/month
• Yearly: $${tier === 'premium' ? '299' : '999'}/year (2 months free!)

<b>🎁 Special Offer:</b>
• 7-day free trial
• 30-day money-back guarantee
• Cancel anytime

<b>⚡ Instant Activation:</b>
Upgrade takes effect immediately upon purchase.`;

    await ctx.editMessageText(upgradeMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: `🚀 Start ${tier.toUpperCase()} Trial`, callback_data: `trial_${tier}` }
          ],
          [
            { text: '💳 Monthly Plan', callback_data: `purchase_${tier}_monthly` },
            { text: '💰 Yearly Plan', callback_data: `purchase_${tier}_yearly` }
          ],
          [
            { text: '📋 Compare Plans', callback_data: 'subscription_plans' },
            { text: '❓ FAQ', callback_data: 'subscription_faq' }
          ],
          [
            { text: '⬅️ Back', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });
  }

  private async handleSubscriptionPlans(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('📋 Loading subscription plans...');
    
    const plansMessage = `
📋 <b>Subscription Plans Comparison</b>

<b>🆓 FREE Plan</b>
• Basic portfolio monitoring
• Manual trade execution
• 50 commands per day
• Email support

<b>💎 PREMIUM Plan - $29/month</b>
• AI-powered auto trading
• Advanced risk management
• 500 commands per day
• Real-time notifications
• Priority support
• Advanced analytics

<b>🚀 PRO Plan - $99/month</b>
• Everything in Premium
• Unlimited commands
• Multiple exchanges
• Custom strategies
• White-glove support
• API access
• Advanced reporting

<b>💡 Which plan is right for you?</b>
• FREE: Testing and learning
• PREMIUM: Active trading
• PRO: Professional traders`;

    await ctx.editMessageText(plansMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💎 Try Premium', callback_data: 'trial_premium' },
            { text: '🚀 Try Pro', callback_data: 'trial_pro' }
          ],
          [
            { text: '💳 Upgrade Premium', callback_data: 'upgrade_premium' },
            { text: '💰 Upgrade Pro', callback_data: 'upgrade_pro' }
          ],
          [
            { text: '❓ Subscription FAQ', callback_data: 'subscription_faq' },
            { text: '💬 Talk to Sales', callback_data: 'contact_sales' }
          ],
          [
            { text: '⬅️ Back', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });
  }

  private async handleSystemStatus(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('📊 Checking system status...');
    
    const statusMessage = `
📊 <b>System Status</b>

<b>🟢 All Systems Operational</b>

<b>🔧 Core Services:</b>
• Trading Engine: 🟢 Operational
• AI Analysis: 🟢 Operational  
• Market Data: 🟢 Operational
• Risk Management: 🟢 Operational
• Notifications: 🟢 Operational

<b>📈 Exchange Connections:</b>
• Binance: 🟢 Connected (15ms)
• Coinbase Pro: 🟢 Connected (22ms)
• Kraken: 🟢 Connected (18ms)
• Alpaca: 🟢 Connected (12ms)

<b>📊 Performance Metrics:</b>
• Uptime: 99.98% (30 days)
• Avg Response Time: 0.12s
• Success Rate: 99.95%
• Active Users: 15,247

<b>🕐 Last Updated:</b> ${new Date().toLocaleString()}

<b>📞 Report an Issue:</b>
If you're experiencing problems, please contact support.`;

    await ctx.editMessageText(statusMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Refresh Status', callback_data: 'system_status' },
            { text: '📈 Performance Details', callback_data: 'system_performance' }
          ],
          [
            { text: '🚨 Report Issue', callback_data: 'report_system_issue' },
            { text: '📞 Contact Support', callback_data: 'contact_support' }
          ],
          [
            { text: '⬅️ Back', callback_data: 'back_to_help' }
          ]
        ]
      }
    });
  }

  private async handleSupportContact(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('📞 Connecting to support...');
    await handleContactSupport(ctx);
  }

  private async handleLoading(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('⏳ Loading...', { show_alert: false });
  }

  private async handleRetryLastCommand(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('🔄 Retrying...');
    
    const lastCommand = ctx.session.currentCommand;
    if (lastCommand) {
      // Re-execute the last command based on session state
      switch (lastCommand) {
        case 'status':
          await handleStatusRefresh(ctx);
          break;
        case 'balance':
          await handleBalanceRefresh(ctx);
          break;
        case 'settings':
          await handleBackToSettings(ctx);
          break;
        default:
          await ctx.editMessageText('🔄 Please use the menu to navigate.');
      }
    } else {
      await ctx.editMessageText('🔄 Please use /start to begin.');
    }
  }

  private async handleRefreshData(ctx: TradingBotContext): Promise<void> {
    await ctx.answerCbQuery('🔄 Refreshing data...');
    
    // Refresh based on current context
    const currentCommand = ctx.session.currentCommand;
    switch (currentCommand) {
      case 'status':
        await handleStatusRefresh(ctx);
        break;
      case 'balance':
        await handleBalanceRefresh(ctx);
        break;
      default:
        await ctx.editMessageText('🔄 Data refreshed. Use the menu to navigate.');
    }
  }

  // Error handlers

  private async handleUnknownCallback(ctx: TradingBotContext, callbackData: string): Promise<void> {
    await ctx.answerCbQuery('❓ Unknown action', { show_alert: true });
    
    console.warn(`Unknown callback: ${callbackData} from user ${ctx.from?.id}`);
    
    await ctx.editMessageText(
      '❓ <b>Unknown Action</b>\n\n' +
      'The requested action is not recognized. Please use the menu buttons below.',
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

  private async handleCallbackError(ctx: TradingBotContext, error: any): Promise<void> {
    console.error('Callback error:', error);
    
    await ctx.answerCbQuery('❌ Error occurred', { show_alert: true });
    
    await ctx.editMessageText(
      '❌ <b>An Error Occurred</b>\n\n' +
      'Sorry, there was an error processing your request. Please try again or contact support if the problem persists.',
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
  }

  // Helper methods

  private async getUserSettings(userId: string): Promise<any> {
    // Mock implementation - replace with actual service call
    return {
      notifications: {
        trades: true,
        profits: true,
        losses: true,
        riskAlerts: true,
        dailyReports: false,
        marketUpdates: true
      }
    };
  }

  private async updateNotificationSetting(userId: string, type: string, value: boolean): Promise<void> {
    // Mock implementation - replace with actual service call
    console.log(`Updated ${type} notification to ${value} for user ${userId}`);
  }

  private getPremiumFeatures(): string {
    return `
• 🤖 AI-powered auto trading
• 📊 Advanced analytics
• ⚡ Real-time notifications  
• 🛡️ Enhanced risk management
• 📈 Performance tracking
• 💬 Priority support`;
  }

  private getProFeatures(): string {
    return `
• 🚀 Everything in Premium
• 🔄 Unlimited commands
• 🏢 Multiple exchanges
• 🎯 Custom strategies
• 📞 White-glove support
• 🔌 API access
• 📊 Advanced reporting`;
  }
}

// Export singleton instance
export const callbackRouter = new CallbackRouter();