import {
  InlineKeyboardMarkup,
  InlineKeyboardButton,
  ReplyKeyboardMarkup,
  KeyboardButton,
  QuickAction,
  CallbackData,
  DailyReportData,
  UserReportPreferences
} from '../types';
import { MarketRegime } from '../../../types/trading';

/**
 * Interactive Elements Manager
 * Creates and manages interactive keyboards, buttons, quick actions,
 * and callback handling for Telegram bot interactions
 */

// Action categories and their configurations
export const ACTION_CATEGORIES = {
  QUICK_ACTIONS: {
    id: 'quick_actions',
    name: 'Quick Actions',
    emoji: '⚡',
    description: 'Immediate trading actions'
  },
  ANALYTICS: {
    id: 'analytics',
    name: 'Analytics',
    emoji: '📊',
    description: 'Detailed analysis and reports'
  },
  POSITIONS: {
    id: 'positions',
    name: 'Positions',
    emoji: '💼',
    description: 'Position management'
  },
  SETTINGS: {
    id: 'settings',
    name: 'Settings',
    emoji: '⚙️',
    description: 'User preferences and configuration'
  },
  EMERGENCY: {
    id: 'emergency',
    name: 'Emergency',
    emoji: '🚨',
    description: 'Critical actions and alerts'
  }
};

// Comprehensive quick actions library
export const QUICK_ACTIONS_LIBRARY: Record<string, QuickAction> = {
  // Analytics Actions
  show_full_report: {
    id: 'show_full_report',
    label: '📊 Full Report',
    action: 'display_full_analytics',
    parameters: { type: 'comprehensive' }
  },
  show_performance: {
    id: 'show_performance',
    label: '📈 Performance',
    action: 'display_performance_details',
    parameters: { timeframe: 'daily' }
  },
  show_risk_analysis: {
    id: 'show_risk_analysis',
    label: '⚖️ Risk Analysis',
    action: 'display_risk_dashboard',
    parameters: { detailed: true }
  },
  market_analysis: {
    id: 'market_analysis',
    label: '🔍 Market Analysis',
    action: 'display_market_insights',
    parameters: { includeTA: true }
  },

  // Position Management
  show_positions: {
    id: 'show_positions',
    label: '💼 All Positions',
    action: 'display_positions',
    parameters: { includeHistory: false }
  },
  close_position: {
    id: 'close_position',
    label: '❌ Close Position',
    action: 'close_position_flow',
    parameters: {},
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to close this position?'
  },
  adjust_stops: {
    id: 'adjust_stops',
    label: '🛡️ Adjust Stops',
    action: 'adjust_stop_losses',
    parameters: { mode: 'interactive' }
  },
  scale_position: {
    id: 'scale_position',
    label: '📏 Scale Position',
    action: 'scale_position_flow',
    parameters: { direction: 'ask_user' }
  },

  // Trading Actions
  place_order: {
    id: 'place_order',
    label: '📝 Place Order',
    action: 'create_order_flow',
    parameters: { orderType: 'market' }
  },
  quick_buy: {
    id: 'quick_buy',
    label: '💚 Quick Buy',
    action: 'quick_trade',
    parameters: { side: 'BUY', amount: 'preset' },
    requiresConfirmation: true
  },
  quick_sell: {
    id: 'quick_sell',
    label: '🔴 Quick Sell',
    action: 'quick_trade',
    parameters: { side: 'SELL', amount: 'preset' },
    requiresConfirmation: true
  },

  // Risk Management
  emergency_stop: {
    id: 'emergency_stop',
    label: '🚨 EMERGENCY STOP',
    action: 'emergency_stop_all',
    parameters: { immediate: true },
    requiresConfirmation: true,
    confirmationMessage: 'EMERGENCY STOP: This will close ALL positions immediately!'
  },
  reduce_risk: {
    id: 'reduce_risk',
    label: '🛡️ Reduce Risk',
    action: 'reduce_portfolio_risk',
    parameters: { percentage: 50 }
  },
  pause_trading: {
    id: 'pause_trading',
    label: '⏸️ Pause Trading',
    action: 'pause_all_strategies',
    parameters: { duration: 'until_manual' }
  },

  // Settings and Preferences
  notification_settings: {
    id: 'notification_settings',
    label: '🔔 Notifications',
    action: 'configure_notifications',
    parameters: {}
  },
  report_settings: {
    id: 'report_settings',
    label: '📋 Report Settings',
    action: 'configure_reports',
    parameters: {}
  },
  risk_settings: {
    id: 'risk_settings',
    label: '⚖️ Risk Settings',
    action: 'configure_risk_management',
    parameters: {}
  },

  // Market-Specific Actions
  momentum_scan: {
    id: 'momentum_scan',
    label: '🚀 Momentum Scan',
    action: 'scan_momentum_opportunities',
    parameters: { marketRegime: 'BULL' }
  },
  short_scan: {
    id: 'short_scan',
    label: '📉 Short Opportunities',
    action: 'scan_short_opportunities',
    parameters: { marketRegime: 'BEAR' }
  },
  range_setups: {
    id: 'range_setups',
    label: '🎯 Range Setups',
    action: 'scan_range_opportunities',
    parameters: { marketRegime: 'RANGE' }
  },
  volatility_strategies: {
    id: 'volatility_strategies',
    label: '⚡ Vol Strategies',
    action: 'display_volatility_strategies',
    parameters: { marketRegime: 'VOLATILE' }
  }
};

/**
 * Create standard report keyboard with common actions
 */
export function createStandardReportKeyboard(
  data: DailyReportData,
  preferences: UserReportPreferences
): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  // Row 1: Primary actions
  buttons.push([
    {
      text: QUICK_ACTIONS_LIBRARY.show_full_report.label,
      callbackData: encodeCallbackData('show_full_report', {}, preferences.userId)
    },
    {
      text: QUICK_ACTIONS_LIBRARY.show_positions.label,
      callbackData: encodeCallbackData('show_positions', {}, preferences.userId)
    }
  ]);

  // Row 2: Analytics
  buttons.push([
    {
      text: QUICK_ACTIONS_LIBRARY.show_performance.label,
      callbackData: encodeCallbackData('show_performance', {}, preferences.userId)
    },
    {
      text: QUICK_ACTIONS_LIBRARY.market_analysis.label,
      callbackData: encodeCallbackData('market_analysis', {}, preferences.userId)
    }
  ]);

  // Row 3: Risk management (conditional)
  const hasRiskAlerts = data.alerts.length > 0;
  const hasHighRisk = data.riskMetrics.portfolioDrawdown > 10;
  
  if (hasRiskAlerts || hasHighRisk) {
    buttons.push([
      {
        text: QUICK_ACTIONS_LIBRARY.show_risk_analysis.label,
        callbackData: encodeCallbackData('show_risk_analysis', {}, preferences.userId)
      },
      {
        text: QUICK_ACTIONS_LIBRARY.reduce_risk.label,
        callbackData: encodeCallbackData('reduce_risk', {}, preferences.userId)
      }
    ]);
  }

  // Row 4: Settings
  buttons.push([
    {
      text: QUICK_ACTIONS_LIBRARY.report_settings.label,
      callbackData: encodeCallbackData('report_settings', {}, preferences.userId)
    },
    {
      text: QUICK_ACTIONS_LIBRARY.notification_settings.label,
      callbackData: encodeCallbackData('notification_settings', {}, preferences.userId)
    }
  ]);

  return { inlineKeyboard: buttons };
}

/**
 * Create market-specific action keyboard
 */
export function createMarketSpecificKeyboard(
  marketRegime: MarketRegime,
  data: DailyReportData,
  userId: string
): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  // Base actions for all markets
  buttons.push([
    {
      text: QUICK_ACTIONS_LIBRARY.show_full_report.label,
      callbackData: encodeCallbackData('show_full_report', {}, userId)
    }
  ]);

  // Market-specific actions
  switch (marketRegime) {
    case 'BULL':
      buttons.push([
        {
          text: QUICK_ACTIONS_LIBRARY.momentum_scan.label,
          callbackData: encodeCallbackData('momentum_scan', {}, userId)
        },
        {
          text: '📈 Scale Up',
          callbackData: encodeCallbackData('scale_position', { direction: 'up' }, userId)
        }
      ]);
      break;

    case 'BEAR':
      buttons.push([
        {
          text: QUICK_ACTIONS_LIBRARY.short_scan.label,
          callbackData: encodeCallbackData('short_scan', {}, userId)
        },
        {
          text: QUICK_ACTIONS_LIBRARY.reduce_risk.label,
          callbackData: encodeCallbackData('reduce_risk', {}, userId)
        }
      ]);
      break;

    case 'RANGE':
      buttons.push([
        {
          text: QUICK_ACTIONS_LIBRARY.range_setups.label,
          callbackData: encodeCallbackData('range_setups', {}, userId)
        },
        {
          text: '⚖️ Swing Trades',
          callbackData: encodeCallbackData('swing_trade_scan', {}, userId)
        }
      ]);
      break;

    case 'VOLATILE':
      buttons.push([
        {
          text: QUICK_ACTIONS_LIBRARY.volatility_strategies.label,
          callbackData: encodeCallbackData('volatility_strategies', {}, userId)
        },
        {
          text: QUICK_ACTIONS_LIBRARY.adjust_stops.label,
          callbackData: encodeCallbackData('adjust_stops', { mode: 'volatility' }, userId)
        }
      ]);
      break;
  }

  // Emergency actions if needed
  const hasEmergencyConditions = 
    data.riskMetrics.portfolioDrawdown > 20 ||
    data.alerts.some(alert => alert.type === 'CRITICAL');

  if (hasEmergencyConditions) {
    buttons.push([
      {
        text: QUICK_ACTIONS_LIBRARY.emergency_stop.label,
        callbackData: encodeCallbackData('emergency_stop', {}, userId)
      }
    ]);
  }

  return { inlineKeyboard: buttons };
}

/**
 * Create position management keyboard
 */
export function createPositionManagementKeyboard(
  position: any,
  userId: string
): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  // Row 1: Position actions
  buttons.push([
    {
      text: '❌ Close',
      callbackData: encodeCallbackData('close_position', { positionId: position.id }, userId)
    },
    {
      text: '📏 Scale',
      callbackData: encodeCallbackData('scale_position', { positionId: position.id }, userId)
    }
  ]);

  // Row 2: Risk management
  buttons.push([
    {
      text: '🛡️ Set Stop',
      callbackData: encodeCallbackData('set_stop_loss', { positionId: position.id }, userId)
    },
    {
      text: '🎯 Set Target',
      callbackData: encodeCallbackData('set_take_profit', { positionId: position.id }, userId)
    }
  ]);

  // Row 3: Analysis
  buttons.push([
    {
      text: '📊 Analysis',
      callbackData: encodeCallbackData('position_analysis', { positionId: position.id }, userId)
    },
    {
      text: '📈 Chart',
      callbackData: encodeCallbackData('show_chart', { symbol: position.symbol }, userId)
    }
  ]);

  return { inlineKeyboard: buttons };
}

/**
 * Create emergency action keyboard
 */
export function createEmergencyKeyboard(
  data: DailyReportData,
  userId: string
): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  // Critical actions
  buttons.push([
    {
      text: '🚨 STOP ALL',
      callbackData: encodeCallbackData('emergency_stop', { immediate: true }, userId)
    }
  ]);

  buttons.push([
    {
      text: '❌ Close All Positions',
      callbackData: encodeCallbackData('close_all_positions', {}, userId)
    },
    {
      text: '⏸️ Pause Trading',
      callbackData: encodeCallbackData('pause_trading', {}, userId)
    }
  ]);

  buttons.push([
    {
      text: '📞 Contact Support',
      callbackData: encodeCallbackData('contact_support', { emergency: true }, userId)
    },
    {
      text: '📊 Risk Dashboard',
      callbackData: encodeCallbackData('emergency_risk_dashboard', {}, userId)
    }
  ]);

  return { inlineKeyboard: buttons };
}

/**
 * Create settings configuration keyboard
 */
export function createSettingsKeyboard(userId: string): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  // Main settings categories
  buttons.push([
    {
      text: '📋 Report Settings',
      callbackData: encodeCallbackData('configure_reports', {}, userId)
    },
    {
      text: '🔔 Notifications',
      callbackData: encodeCallbackData('configure_notifications', {}, userId)
    }
  ]);

  buttons.push([
    {
      text: '⚖️ Risk Management',
      callbackData: encodeCallbackData('configure_risk_management', {}, userId)
    },
    {
      text: '🤖 AI Settings',
      callbackData: encodeCallbackData('configure_ai_settings', {}, userId)
    }
  ]);

  buttons.push([
    {
      text: '📊 Display Options',
      callbackData: encodeCallbackData('configure_display', {}, userId)
    },
    {
      text: '🔧 Advanced',
      callbackData: encodeCallbackData('advanced_settings', {}, userId)
    }
  ]);

  // Navigation
  buttons.push([
    {
      text: '🔙 Back to Report',
      callbackData: encodeCallbackData('show_main_report', {}, userId)
    }
  ]);

  return { inlineKeyboard: buttons };
}

/**
 * Create quick reply keyboard for text input scenarios
 */
export function createQuickReplyKeyboard(
  options: string[],
  oneTime: boolean = true
): ReplyKeyboardMarkup {
  const keyboard: KeyboardButton[][] = [];
  
  // Group options into rows (max 3 per row for mobile)
  for (let i = 0; i < options.length; i += 3) {
    const row = options.slice(i, i + 3).map(option => ({ text: option }));
    keyboard.push(row);
  }

  return {
    keyboard,
    resizeKeyboard: true,
    oneTimeKeyboard: oneTime,
    selective: true
  };
}

/**
 * Encode callback data for button interactions
 */
export function encodeCallbackData(
  action: string,
  data: Record<string, any> = {},
  userId: string
): string {
  const callbackData: CallbackData = {
    action,
    data,
    userId,
    timestamp: Date.now()
  };

  // Telegram callback data is limited to 64 bytes
  const encoded = JSON.stringify(callbackData);
  if (encoded.length > 64) {
    // Truncate data if too long, keeping essential info
    const essential: CallbackData = {
      action,
      data: Object.keys(data).length > 0 ? { id: data.id || data.positionId } : {},
      userId,
      timestamp: Date.now()
    };
    return JSON.stringify(essential).substring(0, 64);
  }

  return encoded;
}

/**
 * Decode callback data from button interactions
 */
export function decodeCallbackData(encoded: string): CallbackData | null {
  try {
    return JSON.parse(encoded) as CallbackData;
  } catch (error) {
    console.error('Failed to decode callback data:', error);
    return null;
  }
}

/**
 * Create contextual action suggestions
 */
export function createContextualActions(
  data: DailyReportData,
  preferences: UserReportPreferences
): InlineKeyboardButton[] {
  const actions: InlineKeyboardButton[] = [];

  // Based on performance
  if (data.portfolio.dailyPnL > 0) {
    actions.push({
      text: '🚀 Scale Winners',
      callbackData: encodeCallbackData('scale_winners', {}, preferences.userId)
    });
  } else if (data.portfolio.dailyPnL < -100) {
    actions.push({
      text: '🛡️ Review Losses',
      callbackData: encodeCallbackData('review_losses', {}, preferences.userId)
    });
  }

  // Based on AI confidence
  if (data.aiAnalysis.confidence > 0.8) {
    actions.push({
      text: '🎯 High Confidence Play',
      callbackData: encodeCallbackData('high_confidence_trade', { 
        symbol: data.aiAnalysis.recommendedSymbol 
      }, preferences.userId)
    });
  }

  // Based on risk metrics
  if (data.riskMetrics.portfolioDrawdown > 15) {
    actions.push({
      text: '⚠️ Risk Review',
      callbackData: encodeCallbackData('emergency_risk_review', {}, preferences.userId)
    });
  }

  // Based on market volatility
  const avgVolatility = data.marketData.reduce((sum, market) => 
    sum + Math.abs(market.priceChangePercent), 0) / data.marketData.length;
  
  if (avgVolatility > 5) {
    actions.push({
      text: '⚡ Volatility Alert',
      callbackData: encodeCallbackData('volatility_analysis', {}, preferences.userId)
    });
  }

  return actions.slice(0, 4); // Limit to 4 contextual actions
}

/**
 * Create pagination keyboard for long lists
 */
export function createPaginationKeyboard(
  currentPage: number,
  totalPages: number,
  baseAction: string,
  userId: string,
  additionalData: Record<string, any> = {}
): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  if (totalPages <= 1) {
    return { inlineKeyboard: buttons };
  }

  const row: InlineKeyboardButton[] = [];

  // Previous button
  if (currentPage > 1) {
    row.push({
      text: '⬅️ Previous',
      callbackData: encodeCallbackData(baseAction, {
        ...additionalData,
        page: currentPage - 1
      }, userId)
    });
  }

  // Page indicator
  row.push({
    text: `${currentPage}/${totalPages}`,
    callbackData: encodeCallbackData('noop', {}, userId)
  });

  // Next button
  if (currentPage < totalPages) {
    row.push({
      text: 'Next ➡️',
      callbackData: encodeCallbackData(baseAction, {
        ...additionalData,
        page: currentPage + 1
      }, userId)
    });
  }

  buttons.push(row);
  return { inlineKeyboard: buttons };
}

/**
 * Validate keyboard structure
 */
export function validateKeyboard(keyboard: InlineKeyboardMarkup): boolean {
  if (!keyboard.inlineKeyboard || keyboard.inlineKeyboard.length === 0) {
    return false;
  }

  const totalButtons = keyboard.inlineKeyboard.flat().length;
  if (totalButtons > 100) { // Telegram limit
    return false;
  }

  for (const row of keyboard.inlineKeyboard) {
    if (row.length > 8) { // Telegram limit per row
      return false;
    }

    for (const button of row) {
      if (!button.text || button.text.length > 64) {
        return false;
      }

      if (button.callbackData && button.callbackData.length > 64) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Export utility functions
 */
export const InteractiveUtils = {
  createStandardReportKeyboard,
  createMarketSpecificKeyboard,
  createPositionManagementKeyboard,
  createEmergencyKeyboard,
  createSettingsKeyboard,
  createQuickReplyKeyboard,
  createContextualActions,
  createPaginationKeyboard,
  encodeCallbackData,
  decodeCallbackData,
  validateKeyboard
};