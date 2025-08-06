import {
  DailyReportTemplate,
  DailyReportData,
  TemplateContext,
  ReportSection,
  MarketConditionTemplate,
  InteractiveElement,
  MessageFormatting
} from '../types';
import { MarketRegime } from '../../../types/trading';

/**
 * Daily Report Template Generator
 * Creates comprehensive daily trading reports formatted for Telegram delivery
 */

// Market condition configurations
export const MARKET_CONDITION_TEMPLATES: Record<MarketRegime | 'EMERGENCY', MarketConditionTemplate> = {
  BULL: {
    regime: 'BULL',
    tone: 'positive',
    colors: {
      primary: '#00C851',
      success: '#00C851',
      warning: '#ffbb33',
      danger: '#ff4444'
    },
    emojis: {
      trend: '📈',
      performance: '🚀',
      warning: '⚠️',
      action: '💪'
    },
    messaging: {
      greeting: 'Great day ahead!',
      summary: 'Market momentum is strong',
      callToAction: 'Consider scaling positions'
    }
  },
  BEAR: {
    regime: 'BEAR',
    tone: 'cautious',
    colors: {
      primary: '#ff4444',
      success: '#00C851',
      warning: '#ffbb33',
      danger: '#ff4444'
    },
    emojis: {
      trend: '📉',
      performance: '🛡️',
      warning: '🚨',
      action: '🤔'
    },
    messaging: {
      greeting: 'Stay vigilant today',
      summary: 'Market showing weakness',
      callToAction: 'Consider risk reduction'
    }
  },
  RANGE: {
    regime: 'RANGE',
    tone: 'neutral',
    colors: {
      primary: '#33b5e5',
      success: '#00C851',
      warning: '#ffbb33',
      danger: '#ff4444'
    },
    emojis: {
      trend: '↔️',
      performance: '⚖️',
      warning: '⚠️',
      action: '🎯'
    },
    messaging: {
      greeting: 'Steady as we go',
      summary: 'Market in consolidation',
      callToAction: 'Focus on range trading'
    }
  },
  VOLATILE: {
    regime: 'VOLATILE',
    tone: 'urgent',
    colors: {
      primary: '#ffbb33',
      success: '#00C851',
      warning: '#ffbb33',
      danger: '#ff4444'
    },
    emojis: {
      trend: '⚡',
      performance: '🎢',
      warning: '🚨',
      action: '⚡'
    },
    messaging: {
      greeting: 'High volatility detected',
      summary: 'Markets moving rapidly',
      callToAction: 'Adjust stop losses'
    }
  },
  EMERGENCY: {
    regime: 'VOLATILE',
    tone: 'urgent',
    colors: {
      primary: '#ff4444',
      success: '#00C851',
      warning: '#ffbb33',
      danger: '#ff4444'
    },
    emojis: {
      trend: '🚨',
      performance: '🛑',
      warning: '⚠️',
      action: '🚨'
    },
    messaging: {
      greeting: 'URGENT ATTENTION REQUIRED',
      summary: 'Critical market conditions',
      callToAction: 'Take immediate action'
    }
  }
};

// Base formatting configurations
export const DEFAULT_FORMATTING: MessageFormatting = {
  parseMode: 'MarkdownV2',
  useEmojis: true,
  boldHeaders: true,
  codeBlocks: true,
  linkPreviews: false,
  compactMode: false
};

export const COMPACT_FORMATTING: MessageFormatting = {
  parseMode: 'MarkdownV2',
  useEmojis: true,
  boldHeaders: false,
  codeBlocks: false,
  linkPreviews: false,
  compactMode: true
};

// Interactive elements configurations
export const STANDARD_INTERACTIVE_ELEMENTS: InteractiveElement[] = [
  {
    type: 'quick_action',
    text: '📊 Full Analytics',
    callbackData: 'show_analytics',
    condition: 'true' // Always show
  },
  {
    type: 'quick_action',
    text: '💼 Positions',
    callbackData: 'show_positions',
    condition: 'data.positions.length > 0'
  },
  {
    type: 'quick_action',
    text: '⚙️ Settings',
    callbackData: 'show_settings',
    condition: 'true'
  },
  {
    type: 'emergency',
    text: '🚨 Emergency Stop',
    callbackData: 'emergency_stop',
    condition: 'data.riskMetrics.portfolioDrawdown > 10'
  },
  {
    type: 'details',
    text: '📈 Market Analysis',
    callbackData: 'show_market_analysis',
    condition: 'data.aiAnalysis.confidence > 0.7'
  }
];

/**
 * Generate executive summary section
 */
export function generateExecutiveSummary(data: DailyReportData, template: MarketConditionTemplate): ReportSection {
  const { portfolio, aiAnalysis } = data;
  const pnlEmoji = portfolio.dailyPnL >= 0 ? '📈' : '📉';
  const confidenceEmoji = aiAnalysis.confidence >= 0.8 ? '🎯' : aiAnalysis.confidence >= 0.6 ? '🤔' : '❓';
  
  const performanceVsMarket = portfolio.dailyPnLPercentage > 0 ? 'outperforming' : 'underperforming';
  
  const content = `*${template.messaging.greeting}* ${template.emojis.trend}

${pnlEmoji} **Daily P&L:** ${portfolio.dailyPnL >= 0 ? '+' : ''}$${portfolio.dailyPnL.toFixed(2)} (${portfolio.dailyPnLPercentage >= 0 ? '+' : ''}${portfolio.dailyPnLPercentage.toFixed(2)}%)
${confidenceEmoji} **AI Confidence:** ${(aiAnalysis.confidence * 100).toFixed(0)}% | ${aiAnalysis.nextAction}
🎯 **Status:** ${performanceVsMarket} market, ${template.messaging.summary.toLowerCase()}`;

  return {
    id: 'executive_summary',
    title: 'Executive Summary',
    content,
    priority: 'high',
    emoji: template.emojis.performance
  };
}

/**
 * Generate performance metrics section
 */
export function generatePerformanceMetrics(data: DailyReportData, template: MarketConditionTemplate): ReportSection {
  const { portfolio, performance } = data;
  
  const winRateEmoji = performance.winRate >= 70 ? '🔥' : performance.winRate >= 50 ? '👍' : '⚠️';
  const drawdownEmoji = portfolio.totalReturnPercentage >= 0 ? '💚' : portfolio.totalReturnPercentage <= -10 ? '🚨' : '📊';

  const content = `${winRateEmoji} **Win Rate:** ${performance.winRate.toFixed(1)}% (${performance.profitable}/${performance.totalTrades})
💰 **Total Return:** ${portfolio.totalReturnPercentage >= 0 ? '+' : ''}${portfolio.totalReturnPercentage.toFixed(2)}%
📊 **Sharpe Ratio:** ${performance.sharpeRatio.toFixed(2)}
${drawdownEmoji} **Max Drawdown:** ${performance.maxDrawdown.toFixed(2)}%
⚖️ **Risk Metrics:** ${data.riskMetrics.var95.toFixed(2)}% VaR | ${data.riskMetrics.leverage.toFixed(1)}x Leverage`;

  return {
    id: 'performance_metrics',
    title: 'Performance Metrics',
    content,
    priority: 'high',
    emoji: '📊'
  };
}

/**
 * Generate AI insights section
 */
export function generateAIInsights(data: DailyReportData, template: MarketConditionTemplate): ReportSection {
  const { aiAnalysis } = data;
  
  const regimeEmoji = {
    'BULL': '🐂',
    'BEAR': '🐻',
    'RANGE': '↔️',
    'VOLATILE': '⚡'
  }[aiAnalysis.marketRegime] || '❓';

  const sentimentEmoji = aiAnalysis.sentiment > 0.3 ? '😊' : aiAnalysis.sentiment < -0.3 ? '😰' : '😐';
  const fearGreedEmoji = aiAnalysis.fearGreedIndex > 70 ? '🤑' : aiAnalysis.fearGreedIndex < 30 ? '😨' : '🤔';

  // Format reasoning points
  const reasoningText = aiAnalysis.reasoning
    .slice(0, 3) // Limit to top 3 reasons
    .map((reason, index) => `${index + 1}\\. ${reason}`)
    .join('\n');

  const content = `${regimeEmoji} **Market Regime:** ${aiAnalysis.marketRegime}
${sentimentEmoji} **Sentiment:** ${(aiAnalysis.sentiment * 100).toFixed(0)}% | ${fearGreedEmoji} Fear/Greed: ${aiAnalysis.fearGreedIndex}
🎯 **Next Action:** ${aiAnalysis.nextAction}${aiAnalysis.recommendedSymbol ? ` (${aiAnalysis.recommendedSymbol})` : ''}

**Key Insights:**
${reasoningText}`;

  return {
    id: 'ai_insights',
    title: 'AI Analysis',
    content,
    priority: 'high',
    emoji: '🤖'
  };
}

/**
 * Generate tomorrow's outlook section
 */
export function generateTomorrowOutlook(data: DailyReportData, template: MarketConditionTemplate): ReportSection {
  const { aiAnalysis, marketData } = data;
  
  const topSymbol = marketData
    .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))[0];
  
  const outlookEmoji = template.emojis.trend;
  const actionEmoji = template.emojis.action;

  const content = `${outlookEmoji} **Market Outlook:** ${template.messaging.summary}

🎯 **Recommended Focus:** ${aiAnalysis.recommendedSymbol || topSymbol?.symbol || 'Market monitoring'}
${actionEmoji} **Strategy:** ${template.messaging.callToAction}

**Watch List:**
• **${topSymbol?.symbol}:** ${topSymbol?.priceChangePercent >= 0 ? '+' : ''}${topSymbol?.priceChangePercent?.toFixed(2)}%
• **Risk Level:** ${data.riskMetrics.portfolioDrawdown < 5 ? 'Low' : data.riskMetrics.portfolioDrawdown < 15 ? 'Medium' : 'High'}

**Tomorrow's Targets:**
${aiAnalysis.targetPrice ? `🎯 Target: $${aiAnalysis.targetPrice.toFixed(2)}` : ''}
${aiAnalysis.stopLoss ? `🛡️ Stop Loss: $${aiAnalysis.stopLoss.toFixed(2)}` : ''}`;

  return {
    id: 'tomorrow_outlook',
    title: "Tomorrow's Outlook",
    content,
    priority: 'medium',
    emoji: '🔮'
  };
}

/**
 * Generate active positions section
 */
export function generateActivePositions(data: DailyReportData, template: MarketConditionTemplate): ReportSection {
  const { positions } = data;
  
  if (positions.length === 0) {
    return {
      id: 'active_positions',
      title: 'Active Positions',
      content: '📭 **No active positions**\n\nAll clear! Ready for new opportunities.',
      priority: 'low',
      emoji: '📭'
    };
  }

  const positionsText = positions
    .slice(0, 5) // Limit to top 5 positions
    .map(pos => {
      const pnlEmoji = pos.unrealizedPnL >= 0 ? '💚' : '🔴';
      const sideEmoji = pos.side === 'LONG' ? '📈' : '📉';
      return `${sideEmoji} **${pos.symbol}** ${pos.side}\n` +
             `   Size: ${pos.size} | ${pnlEmoji} ${pos.unrealizedPnL >= 0 ? '+' : ''}$${pos.unrealizedPnL.toFixed(2)} (${pos.unrealizedPnLPercentage >= 0 ? '+' : ''}${pos.unrealizedPnLPercentage.toFixed(2)}%)`;
    })
    .join('\n\n');

  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalPnLEmoji = totalPnL >= 0 ? '💚' : '🔴';

  const content = `**${positions.length} Active Position${positions.length !== 1 ? 's' : ''}**
${totalPnLEmoji} **Total Unrealized:** ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}

${positionsText}

${positions.length > 5 ? `\n*...and ${positions.length - 5} more positions*` : ''}`;

  return {
    id: 'active_positions',
    title: 'Active Positions',
    content,
    priority: 'high',
    emoji: '💼'
  };
}

/**
 * Generate risk alerts section
 */
export function generateRiskAlerts(data: DailyReportData, template: MarketConditionTemplate): ReportSection {
  const { alerts, riskMetrics } = data;
  
  const criticalAlerts = alerts.filter(alert => alert.type === 'CRITICAL');
  const warningAlerts = alerts.filter(alert => alert.type === 'WARNING');
  
  if (alerts.length === 0) {
    return {
      id: 'risk_alerts',
      title: 'Risk Status',
      content: '✅ **All systems normal**\n\nNo active risk alerts. Portfolio within safe parameters.',
      priority: 'low',
      emoji: '✅'
    };
  }

  let content = '';

  if (criticalAlerts.length > 0) {
    content += '🚨 **CRITICAL ALERTS:**\n';
    content += criticalAlerts
      .slice(0, 3)
      .map(alert => `• ${alert.message}`)
      .join('\n');
    content += '\n\n';
  }

  if (warningAlerts.length > 0) {
    content += '⚠️ **Warnings:**\n';
    content += warningAlerts
      .slice(0, 3)
      .map(alert => `• ${alert.message}`)
      .join('\n');
  }

  // Add risk metrics summary
  content += `\n\n📊 **Risk Summary:**\n`;
  content += `• Drawdown: ${riskMetrics.portfolioDrawdown.toFixed(2)}% / ${riskMetrics.maxDrawdownLimit.toFixed(2)}%\n`;
  content += `• Daily P&L: ${riskMetrics.dailyPnL >= 0 ? '+' : ''}${riskMetrics.dailyPnL.toFixed(2)} / ${riskMetrics.dailyPnLLimit.toFixed(2)}`;

  return {
    id: 'risk_alerts',
    title: 'Risk Alerts',
    content,
    priority: criticalAlerts.length > 0 ? 'high' : 'medium',
    emoji: criticalAlerts.length > 0 ? '🚨' : '⚠️',
    action: criticalAlerts.length > 0 ? [{
      text: '🚨 View Details',
      callbackData: 'show_risk_details'
    }] : undefined
  };
}

/**
 * Main template generator function
 */
export function createDailyReportTemplate(
  marketRegime: MarketRegime = 'RANGE',
  isEmergency: boolean = false
): DailyReportTemplate {
  const template = isEmergency ? MARKET_CONDITION_TEMPLATES.EMERGENCY : MARKET_CONDITION_TEMPLATES[marketRegime];
  
  return {
    templateId: `daily_report_${isEmergency ? 'emergency' : marketRegime.toLowerCase()}`,
    name: `Daily Report - ${isEmergency ? 'Emergency' : marketRegime}`,
    description: `Comprehensive daily trading report optimized for ${isEmergency ? 'emergency conditions' : marketRegime + ' market conditions'}`,
    marketRegime: isEmergency ? 'ALL' : marketRegime,
    sections: [], // Will be populated by the generator functions
    maxMessageLength: 4096, // Telegram limit
    formatting: isEmergency ? COMPACT_FORMATTING : DEFAULT_FORMATTING,
    interactiveElements: STANDARD_INTERACTIVE_ELEMENTS
  };
}

/**
 * Generate complete daily report with all sections
 */
export function generateDailyReport(
  data: DailyReportData,
  marketRegime?: MarketRegime,
  isEmergency: boolean = false
): DailyReportTemplate {
  const regime = marketRegime || data.aiAnalysis.marketRegime;
  const template = createDailyReportTemplate(regime, isEmergency);
  const conditionTemplate = isEmergency ? MARKET_CONDITION_TEMPLATES.EMERGENCY : MARKET_CONDITION_TEMPLATES[regime];

  // Generate all sections
  const sections: ReportSection[] = [
    generateExecutiveSummary(data, conditionTemplate),
    generatePerformanceMetrics(data, conditionTemplate),
    generateAIInsights(data, conditionTemplate),
    generateActivePositions(data, conditionTemplate),
    generateRiskAlerts(data, conditionTemplate),
    generateTomorrowOutlook(data, conditionTemplate)
  ];

  // Filter out empty sections and sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  template.sections = sections
    .filter(section => section.content.length > 0)
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return template;
}

/**
 * Quick templates for different scenarios
 */
export const QUICK_TEMPLATES = {
  MORNING_BRIEFING: (data: DailyReportData) => generateDailyReport(data, data.aiAnalysis.marketRegime, false),
  EMERGENCY_ALERT: (data: DailyReportData) => generateDailyReport(data, data.aiAnalysis.marketRegime, true),
  EOD_SUMMARY: (data: DailyReportData) => {
    const template = generateDailyReport(data, data.aiAnalysis.marketRegime, false);
    // Customize for end-of-day focus
    template.sections = template.sections.filter(s => 
      ['executive_summary', 'performance_metrics', 'tomorrow_outlook'].includes(s.id)
    );
    return template;
  }
};