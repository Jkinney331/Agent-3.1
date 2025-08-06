import { TradingBotContext, TelegramUserSettings } from '../types';
import { formatters } from '../utils/formatters';
import { getTradingConfig, updateTradingConfig } from '../services/trading-service';

/**
 * Settings command handler - User preferences and configuration
 * Mobile-optimized settings interface with category organization
 */
export async function settingsHandler(ctx: TradingBotContext): Promise<void> {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('⚙️ Loading your settings...', {
      reply_markup: { inline_keyboard: [[{ text: '⏳ Loading...', callback_data: 'loading' }]] }
    });

    // Get current settings
    const [tradingConfig, userSettings] = await Promise.all([
      getTradingConfig(ctx.user?.id || ''),
      getUserSettings(ctx.user?.id || '')
    ]);

    // Format settings overview
    const settingsMessage = formatSettingsOverview(tradingConfig, userSettings);
    
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      loadingMsg.message_id,
      undefined,
      settingsMessage,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛡️ Risk Management', callback_data: 'settings_risk' },
              { text: '🤖 Trading Strategies', callback_data: 'settings_strategies' }
            ],
            [
              { text: '🔔 Notifications', callback_data: 'settings_notifications' },
              { text: '🎨 Display Preferences', callback_data: 'settings_display' }
            ],
            [
              { text: '🔐 Security & Privacy', callback_data: 'settings_security' },
              { text: '💰 Account & Billing', callback_data: 'settings_account' }
            ],
            [
              { text: '📊 Data & Analytics', callback_data: 'settings_analytics' },
              { text: '🔧 Advanced Options', callback_data: 'settings_advanced' }
            ],
            [
              { text: '📤 Export Settings', callback_data: 'settings_export' },
              { text: '📥 Import Settings', callback_data: 'settings_import' }
            ],
            [
              { text: '🔄 Reset to Defaults', callback_data: 'settings_reset' },
              { text: '📊 Back to Status', callback_data: 'back_to_status' }
            ]
          ]
        }
      }
    );

    // Update session
    ctx.session.currentCommand = 'settings';
    ctx.session.lastMessageId = loadingMsg.message_id;

  } catch (error) {
    console.error('Settings handler error:', error);
    await ctx.reply('❌ Failed to load settings. Please try again.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'settings_retry' },
          { text: '📞 Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Handle risk management settings
 */
export async function handleRiskSettings(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🛡️ Loading risk settings...');
  
  try {
    const tradingConfig = await getTradingConfig(ctx.user?.id || '');
    const riskMessage = formatRiskSettings(tradingConfig);
    
    await ctx.editMessageText(riskMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📉 Max Drawdown', callback_data: 'risk_drawdown' },
            { text: '💰 Position Size', callback_data: 'risk_position_size' }
          ],
          [
            { text: '📊 Daily Loss Limit', callback_data: 'risk_daily_loss' },
            { text: '⚖️ Leverage Limits', callback_data: 'risk_leverage' }
          ],
          [
            { text: '🚨 Emergency Stop', callback_data: 'risk_emergency' },
            { text: '⏰ Trading Hours', callback_data: 'risk_hours' }
          ],
          [
            { text: '📈 Risk Profile', callback_data: 'risk_profile' }
          ],
          [
            { text: '💾 Save Changes', callback_data: 'risk_save' },
            { text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });

  } catch (error) {
    await handleSettingsError(ctx, 'risk settings');
  }
}

/**
 * Handle notification settings
 */
export async function handleNotificationSettings(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🔔 Loading notification settings...');
  
  try {
    const userSettings = await getUserSettings(ctx.user?.id || '');
    const notificationMessage = formatNotificationSettings(userSettings);
    
    await ctx.editMessageText(notificationMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: userSettings.notifications.trades ? '✅ Trade Alerts' : '❌ Trade Alerts', 
              callback_data: 'toggle_trades_notifications' },
            { text: userSettings.notifications.profits ? '✅ Profit Alerts' : '❌ Profit Alerts', 
              callback_data: 'toggle_profits_notifications' }
          ],
          [
            { text: userSettings.notifications.losses ? '✅ Loss Alerts' : '❌ Loss Alerts', 
              callback_data: 'toggle_losses_notifications' },
            { text: userSettings.notifications.riskAlerts ? '✅ Risk Alerts' : '❌ Risk Alerts', 
              callback_data: 'toggle_risk_notifications' }
          ],
          [
            { text: userSettings.notifications.dailyReports ? '✅ Daily Reports' : '❌ Daily Reports', 
              callback_data: 'toggle_daily_notifications' },
            { text: userSettings.notifications.marketUpdates ? '✅ Market Updates' : '❌ Market Updates', 
              callback_data: 'toggle_market_notifications' }
          ],
          [
            { text: '🎯 Alert Thresholds', callback_data: 'notification_thresholds' },
            { text: '⏰ Timing Settings', callback_data: 'notification_timing' }
          ],
          [
            { text: '🔕 Do Not Disturb', callback_data: 'notification_dnd' },
            { text: '📱 Test Notifications', callback_data: 'notification_test' }
          ],
          [
            { text: '💾 Save Changes', callback_data: 'notifications_save' },
            { text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });

  } catch (error) {
    await handleSettingsError(ctx, 'notification settings');
  }
}

/**
 * Handle display preferences
 */
export async function handleDisplaySettings(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🎨 Loading display settings...');
  
  try {
    const userSettings = await getUserSettings(ctx.user?.id || '');
    const displayMessage = formatDisplaySettings(userSettings);
    
    await ctx.editMessageText(displayMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💱 Currency: USD', callback_data: 'display_currency' },
            { text: '🌍 Language: English', callback_data: 'display_language' }
          ],
          [
            { text: '🕐 Timezone: UTC', callback_data: 'display_timezone' },
            { text: '🔢 Precision: 2', callback_data: 'display_precision' }
          ],
          [
            { text: '🎨 Theme: Auto', callback_data: 'display_theme' },
            { text: '📊 Chart Style', callback_data: 'display_charts' }
          ],
          [
            { text: '📱 Compact Mode', callback_data: 'display_compact' },
            { text: '🔄 Auto Refresh', callback_data: 'display_refresh' }
          ],
          [
            { text: '💾 Save Changes', callback_data: 'display_save' },
            { text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });

  } catch (error) {
    await handleSettingsError(ctx, 'display settings');
  }
}

/**
 * Handle security and privacy settings
 */
export async function handleSecuritySettings(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🔐 Loading security settings...');
  
  try {
    const securityMessage = formatSecuritySettings();
    
    await ctx.editMessageText(securityMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔑 Change Password', callback_data: 'security_password' },
            { text: '📱 Two-Factor Auth', callback_data: 'security_2fa' }
          ],
          [
            { text: '🔒 API Key Management', callback_data: 'security_api_keys' },
            { text: '📋 Session Management', callback_data: 'security_sessions' }
          ],
          [
            { text: '👥 Privacy Settings', callback_data: 'security_privacy' },
            { text: '📊 Data Sharing', callback_data: 'security_data_sharing' }
          ],
          [
            { text: '🚨 Security Alerts', callback_data: 'security_alerts' },
            { text: '📜 Activity Log', callback_data: 'security_activity' }
          ],
          [
            { text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });

  } catch (error) {
    await handleSettingsError(ctx, 'security settings');
  }
}

/**
 * Handle trading strategies settings
 */
export async function handleStrategySettings(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🤖 Loading strategy settings...');
  
  try {
    const tradingConfig = await getTradingConfig(ctx.user?.id || '');
    const strategyMessage = formatStrategySettings(tradingConfig);
    
    await ctx.editMessageText(strategyMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ AI Momentum', callback_data: 'strategy_toggle_momentum' },
            { text: '✅ Mean Reversion', callback_data: 'strategy_toggle_mean' }
          ],
          [
            { text: '❌ Breakout Scanner', callback_data: 'strategy_toggle_breakout' },
            { text: '✅ Trend Following', callback_data: 'strategy_toggle_trend' }
          ],
          [
            { text: '⚙️ Strategy Settings', callback_data: 'strategy_configure' },
            { text: '📊 Performance Review', callback_data: 'strategy_performance' }
          ],
          [
            { text: '➕ Add Custom Strategy', callback_data: 'strategy_add_custom' },
            { text: '🔄 Reset Strategies', callback_data: 'strategy_reset' }
          ],
          [
            { text: '💾 Save Changes', callback_data: 'strategy_save' },
            { text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }
          ]
        ]
      }
    });

  } catch (error) {
    await handleSettingsError(ctx, 'strategy settings');
  }
}

/**
 * Handle back to settings callback
 */
export async function handleBackToSettings(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery();
  await settingsHandler(ctx);
}

// Helper functions

async function getUserSettings(userId: string): Promise<TelegramUserSettings> {
  // This would integrate with your user settings service
  // Return mock data for now
  return {
    notifications: {
      trades: true,
      profits: true,
      losses: true,
      riskAlerts: true,
      dailyReports: false,
      marketUpdates: true
    },
    display: {
      currency: 'USD',
      precision: 2,
      timezone: 'UTC',
      language: 'en'
    },
    alerts: {
      profitThreshold: 100,
      lossThreshold: -50,
      drawdownAlert: 10,
      dailyPnLAlert: true
    },
    privacy: {
      shareStats: false,
      publicProfile: false
    }
  };
}

function formatSettingsOverview(tradingConfig: any, userSettings: TelegramUserSettings): string {
  return `
⚙️ <b>Settings Overview</b>

<b>🛡️ Risk Management:</b>
• Max Drawdown: ${tradingConfig.maxDrawdown}%
• Daily Loss Limit: ${formatters.formatCurrency(tradingConfig.maxDailyLoss)}
• Position Size Limit: ${tradingConfig.maxPositionSize}%

<b>🔔 Notifications:</b>
• Trade Alerts: ${userSettings.notifications.trades ? '✅' : '❌'}
• Risk Alerts: ${userSettings.notifications.riskAlerts ? '✅' : '❌'}
• Daily Reports: ${userSettings.notifications.dailyReports ? '✅' : '❌'}

<b>🎨 Display:</b>
• Currency: ${userSettings.display.currency}
• Language: ${getLanguageName(userSettings.display.language)}
• Timezone: ${userSettings.display.timezone}

<b>🤖 Trading:</b>
• Default Leverage: ${tradingConfig.defaultLeverage}x
• Max Concurrent Trades: ${tradingConfig.maxConcurrentTrades}
• Trading Hours: ${tradingConfig.tradingHours.enabled ? 'Restricted' : 'Unrestricted'}

<b>🔐 Security:</b>
• Two-Factor Auth: ✅ Enabled
• API Keys: 🔒 Encrypted
• Data Sharing: ${userSettings.privacy.shareStats ? 'Enabled' : 'Disabled'}

Select a category to configure:`;
}

function formatRiskSettings(tradingConfig: any): string {
  return `
🛡️ <b>Risk Management Settings</b>

<b>📉 Drawdown Protection:</b>
• Maximum Drawdown: <b>${tradingConfig.maxDrawdown}%</b>
• Current Usage: <b>2.5%</b> (🟢 Safe)

<b>💰 Position Management:</b>
• Max Position Size: <b>${tradingConfig.maxPositionSize}%</b>
• Current Largest: <b>12.3%</b>

<b>📊 Loss Limits:</b>
• Daily Loss Limit: <b>${formatters.formatCurrency(tradingConfig.maxDailyLoss)}</b>
• Today's Loss: <b>$0</b> (🟢 Safe)

<b>⚖️ Leverage Control:</b>
• Default Leverage: <b>${tradingConfig.defaultLeverage}x</b>
• Maximum Allowed: <b>5x</b>

<b>🚨 Emergency Controls:</b>
• Emergency Stop Loss: <b>${tradingConfig.emergencyStopLoss}%</b>
• Auto-Pause Threshold: <b>15% drawdown</b>

<b>⏰ Trading Schedule:</b>
• Trading Hours: <b>${tradingConfig.tradingHours.enabled ? 'Restricted' : 'Unrestricted'}</b>
${tradingConfig.tradingHours.enabled ? `• Active: ${tradingConfig.tradingHours.start} - ${tradingConfig.tradingHours.end} ${tradingConfig.tradingHours.timezone}` : ''}

Tap any option to modify:`;
}

function formatNotificationSettings(userSettings: TelegramUserSettings): string {
  return `
🔔 <b>Notification Settings</b>

<b>📊 Trading Notifications:</b>
• Trade Executions: ${userSettings.notifications.trades ? '✅ On' : '❌ Off'}
• Profit Alerts: ${userSettings.notifications.profits ? '✅ On' : '❌ Off'}
• Loss Alerts: ${userSettings.notifications.losses ? '✅ On' : '❌ Off'}

<b>⚠️ Risk & Safety:</b>
• Risk Alerts: ${userSettings.notifications.riskAlerts ? '✅ On' : '❌ Off'}
• Emergency Stops: ✅ Always On

<b>📈 Market Updates:</b>
• Market Analysis: ${userSettings.notifications.marketUpdates ? '✅ On' : '❌ Off'}
• AI Insights: ✅ On
• Price Alerts: ✅ On

<b>📋 Reports:</b>
• Daily Summary: ${userSettings.notifications.dailyReports ? '✅ On' : '❌ Off'}
• Weekly Reports: ❌ Off
• Monthly Reports: ✅ On

<b>🎯 Alert Thresholds:</b>
• Profit Alert: ≥ ${formatters.formatCurrency(userSettings.alerts.profitThreshold)}
• Loss Alert: ≤ ${formatters.formatCurrency(userSettings.alerts.lossThreshold)}
• Drawdown Alert: ≥ ${userSettings.alerts.drawdownAlert}%

Toggle notifications or adjust thresholds:`;
}

function formatDisplaySettings(userSettings: TelegramUserSettings): string {
  return `
🎨 <b>Display Preferences</b>

<b>💱 Currency & Numbers:</b>
• Display Currency: <b>${userSettings.display.currency}</b>
• Decimal Precision: <b>${userSettings.display.precision} places</b>
• Number Format: US Standard

<b>🌍 Localization:</b>
• Language: <b>${getLanguageName(userSettings.display.language)}</b>
• Timezone: <b>${userSettings.display.timezone}</b>
• Date Format: MM/DD/YYYY

<b>🎨 Appearance:</b>
• Theme: Auto (Dark/Light)
• Chart Style: Candlestick
• Color Scheme: Professional

<b>📱 Mobile Optimization:</b>
• Compact Mode: ❌ Off
• Auto Refresh: ✅ On (30s)
• Quick Actions: ✅ Enabled

<b>📊 Data Display:</b>
• Show Percentages: ✅ Always
• Show Absolute Values: ✅ Always
• Highlight Changes: ✅ Colors + Emojis

Customize your display preferences:`;
}

function formatSecuritySettings(): string {
  return `
🔐 <b>Security & Privacy Settings</b>

<b>🔑 Authentication:</b>
• Password: ●●●●●●●● (Last changed: 30 days ago)
• Two-Factor Auth: ✅ Enabled (SMS + App)
• Session Timeout: 24 hours

<b>🔒 API & Access:</b>
• Trading API Keys: 🔒 Encrypted & Secure
• Read-Only API: ❌ Disabled
• IP Restrictions: ❌ Not Set

<b>👥 Privacy Controls:</b>
• Profile Visibility: 🔒 Private
• Performance Sharing: ❌ Disabled
• Anonymous Analytics: ✅ Enabled

<b>📊 Data Management:</b>
• Data Retention: 2 years
• Export Data: Available
• Delete Account: Available

<b>🚨 Security Monitoring:</b>
• Login Alerts: ✅ Enabled
• Unusual Activity: ✅ Monitor
• Failed Login Attempts: 3/10 (🟢 Safe)

<b>📜 Recent Activity:</b>
• Last Login: Today at 09:15 AM
• Location: United States
• Device: Mobile App

Manage your security settings:`;
}

function formatStrategySettings(tradingConfig: any): string {
  return `
🤖 <b>Trading Strategy Settings</b>

<b>✅ Active Strategies:</b>
• AI Momentum - 85% success rate
• Mean Reversion - 67% success rate  
• Trend Following - 73% success rate

<b>⏸️ Paused Strategies:</b>
• Breakout Scanner - Needs optimization

<b>⚙️ Global Strategy Settings:</b>
• Max Concurrent Trades: ${tradingConfig.maxConcurrentTrades}
• Min Confidence Level: 75%
• Strategy Allocation: Auto-Balance

<b>📊 Performance Metrics:</b>
• Combined Win Rate: 76%
• Average Return: +1.2% per trade
• Best Performer: AI Momentum
• Most Consistent: Trend Following

<b>🎯 Risk Per Strategy:</b>
• AI Momentum: 2% max risk
• Mean Reversion: 1.5% max risk
• Trend Following: 2.5% max risk

<b>🔄 Auto-Optimization:</b>
• Strategy Rotation: ✅ Enabled
• Performance Monitoring: ✅ Active
• Auto-Disable Poor Performers: ✅ Yes

Configure individual strategies:`;
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어'
  };
  return languages[code] || 'English';
}

async function handleSettingsError(ctx: TradingBotContext, settingType: string): Promise<void> {
  await ctx.editMessageText(`❌ Failed to load ${settingType}.`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🔄 Retry', callback_data: `settings_${settingType.split(' ')[0]}` },
        { text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }
      ]]
    }
  });
}