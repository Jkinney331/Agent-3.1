import {
  DailyReportTemplate,
  MarketConditionTemplate,
  ReportSection,
  DailyReportData,
  InteractiveElement,
  MessageFormatting
} from '../types';
import { MarketRegime } from '../../../types/trading';

/**
 * Market Condition-Specific Templates
 * Dynamic templates that adapt messaging, tone, and recommendations based on market conditions
 */

// Extended market condition configurations with detailed messaging
export const MARKET_CONDITION_CONFIGS: Record<MarketRegime | 'EMERGENCY', MarketConditionTemplate & {
  keywords: string[];
  riskMessages: Record<string, string>;
  actionPhrases: string[];
  urgencyLevel: number; // 1-5 scale
}> = {
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
      trend: '🐂',
      performance: '🚀',
      warning: '⚠️',
      action: '💪'
    },
    messaging: {
      greeting: 'Bulls are charging! 🐂',
      summary: 'Strong upward momentum across the board',
      callToAction: 'Consider scaling into winning positions'
    },
    keywords: ['breakout', 'momentum', 'strength', 'bullish', 'uptrend', 'rally'],
    riskMessages: {
      low: 'Excellent conditions for position building',
      medium: 'Monitor for overextension signals',
      high: 'Bulls running hot - watch for exhaustion'
    },
    actionPhrases: [
      'Time to ride the wave',
      'Momentum is your friend',
      'Let winners run',
      'Scale into strength'
    ],
    urgencyLevel: 2
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
      trend: '🐻',
      performance: '🛡️',
      warning: '🚨',
      action: '🤔'
    },
    messaging: {
      greeting: 'Bears in control 🐻',
      summary: 'Downward pressure continues to dominate',
      callToAction: 'Focus on capital preservation and short opportunities'
    },
    keywords: ['breakdown', 'weakness', 'bearish', 'downtrend', 'selling', 'decline'],
    riskMessages: {
      low: 'Defensive positioning recommended',
      medium: 'Reduce exposure and tighten stops',
      high: 'Maximum caution - consider cash positions'
    },
    actionPhrases: [
      'Preserve capital first',
      'Wait for better entries',
      'Quality over quantity',
      'Cash is a position'
    ],
    urgencyLevel: 3
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
      greeting: 'Markets in balance ⚖️',
      summary: 'Consolidation phase with defined support/resistance',
      callToAction: 'Perfect for range trading strategies'
    },
    keywords: ['consolidation', 'sideways', 'range', 'support', 'resistance', 'balance'],
    riskMessages: {
      low: 'Ideal for swing trading setups',
      medium: 'Watch for range breakouts',
      high: 'Choppy conditions - reduce size'
    },
    actionPhrases: [
      'Buy support, sell resistance',
      'Patience pays in ranges',
      'Small consistent wins',
      'Wait for clear signals'
    ],
    urgencyLevel: 1
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
      greeting: 'High volatility detected ⚡',
      summary: 'Markets moving with extreme speed and unpredictability',
      callToAction: 'Adjust position sizes and tighten risk management'
    },
    keywords: ['volatile', 'whipsaw', 'erratic', 'unstable', 'wild', 'chaotic'],
    riskMessages: {
      low: 'Opportunity in chaos for skilled traders',
      medium: 'Reduce size, increase monitoring',
      high: 'Extreme caution - consider sidelines'
    },
    actionPhrases: [
      'Size down, stay nimble',
      'Quick profits, tight stops',
      'Volatility = opportunity',
      'Stay disciplined'
    ],
    urgencyLevel: 4
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
      greeting: '🚨 EMERGENCY ALERT 🚨',
      summary: 'Critical market conditions require immediate attention',
      callToAction: 'TAKE IMMEDIATE ACTION TO PROTECT CAPITAL'
    },
    keywords: ['crash', 'emergency', 'critical', 'urgent', 'danger', 'alert'],
    riskMessages: {
      low: 'Immediate risk management required',
      medium: 'URGENT: Review all positions',
      high: 'CRITICAL: Emergency protocols activated'
    },
    actionPhrases: [
      'IMMEDIATE ACTION REQUIRED',
      'PROTECT CAPITAL NOW',
      'EMERGENCY PROTOCOLS ACTIVE',
      'CRITICAL SITUATION'
    ],
    urgencyLevel: 5
  }
};

/**
 * Generate market-specific executive summary
 */
export function generateMarketSpecificExecutiveSummary(
  data: DailyReportData,
  regime: MarketRegime | 'EMERGENCY'
): ReportSection {
  const config = MARKET_CONDITION_CONFIGS[regime];
  const { portfolio, aiAnalysis } = data;
  
  const pnlEmoji = portfolio.dailyPnL >= 0 ? '📈' : '📉';
  const confidenceBar = '█'.repeat(Math.floor(aiAnalysis.confidence * 10)) + 
                        '░'.repeat(10 - Math.floor(aiAnalysis.confidence * 10));
  
  // Dynamic messaging based on performance and market conditions
  let performanceMessage = '';
  if (portfolio.dailyPnLPercentage > 2) {
    performanceMessage = regime === 'BULL' ? 'Riding the bull wave perfectly!' : 'Exceptional performance in tough conditions!';
  } else if (portfolio.dailyPnLPercentage > 0) {
    performanceMessage = 'Steady gains maintained';
  } else if (portfolio.dailyPnLPercentage > -2) {
    performanceMessage = regime === 'BEAR' ? 'Defensive positioning working' : 'Minor pullback, staying disciplined';
  } else {
    performanceMessage = 'Challenging conditions require attention';
  }
  
  const actionPhrase = config.actionPhrases[Math.floor(Math.random() * config.actionPhrases.length)];
  
  const content = `${config.messaging.greeting}

${pnlEmoji} **Today's Performance**
• P&L: ${portfolio.dailyPnL >= 0 ? '+' : ''}$${portfolio.dailyPnL.toFixed(2)} (${portfolio.dailyPnLPercentage >= 0 ? '+' : ''}${portfolio.dailyPnLPercentage.toFixed(2)}%)
• ${performanceMessage}

${config.emojis.action} **AI Analysis**
• Confidence: ${confidenceBar} ${(aiAnalysis.confidence * 100).toFixed(0)}%
• Next Action: **${aiAnalysis.nextAction}** ${aiAnalysis.recommendedSymbol || ''}
• Market State: ${config.messaging.summary}

💡 **Strategy Focus:** ${actionPhrase}`;

  return {
    id: 'market_executive_summary',
    title: `${config.emojis.trend} Market Status`,
    content,
    priority: 'high',
    emoji: config.emojis.trend
  };
}

/**
 * Generate market-specific risk assessment
 */
export function generateMarketRiskAssessment(
  data: DailyReportData,
  regime: MarketRegime | 'EMERGENCY'
): ReportSection {
  const config = MARKET_CONDITION_CONFIGS[regime];
  const { riskMetrics, positions } = data;
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskMetrics.portfolioDrawdown > 15 || riskMetrics.leverage > 5) {
    riskLevel = 'high';
  } else if (riskMetrics.portfolioDrawdown > 8 || riskMetrics.leverage > 3) {
    riskLevel = 'medium';
  }
  
  const currentExposure = positions.reduce((sum, pos) => sum + Math.abs(pos.size * pos.currentPrice), 0);
  const exposureRatio = currentExposure / data.portfolio.totalBalance;
  
  const riskEmoji = riskLevel === 'high' ? '🚨' : riskLevel === 'medium' ? '⚠️' : '✅';
  const riskMessage = config.riskMessages[riskLevel];
  
  const content = `${riskEmoji} **Risk Level: ${riskLevel.toUpperCase()}**

**Current Metrics:**
• Drawdown: ${riskMetrics.portfolioDrawdown.toFixed(2)}% / ${riskMetrics.maxDrawdownLimit.toFixed(2)}%
• Leverage: ${riskMetrics.leverage.toFixed(1)}x / ${riskMetrics.maxLeverage.toFixed(1)}x
• Exposure: ${(exposureRatio * 100).toFixed(1)}% of portfolio
• VaR (95%): ${riskMetrics.var95.toFixed(2)}%

**${regime} Market Guidance:**
${riskMessage}

**Recommended Actions:**
${regime === 'EMERGENCY' ? '🚨 EMERGENCY: Close risky positions immediately' :
  regime === 'VOLATILE' ? '⚡ Reduce position sizes by 30-50%' :
  regime === 'BEAR' ? '🐻 Tighten stops, consider defensive positions' :
  '🎯 Current risk management is appropriate'}`;

  return {
    id: 'market_risk_assessment',
    title: 'Risk Assessment',
    content,
    priority: riskLevel === 'high' ? 'high' : 'medium',
    emoji: riskEmoji,
    action: riskLevel === 'high' ? [{
      text: '🚨 Emergency Actions',
      callbackData: 'emergency_risk_actions'
    }] : undefined
  };
}

/**
 * Generate market-specific opportunity analysis
 */
export function generateMarketOpportunities(
  data: DailyReportData,
  regime: MarketRegime | 'EMERGENCY'
): ReportSection {
  const config = MARKET_CONDITION_CONFIGS[regime];
  const { marketData, aiAnalysis } = data;
  
  if (regime === 'EMERGENCY') {
    return {
      id: 'market_opportunities',
      title: 'Opportunities',
      content: '🚨 **EMERGENCY MODE**\n\nNo new opportunities recommended during emergency conditions.\nFocus on capital preservation and risk reduction.',
      priority: 'low',
      emoji: '🚨'
    };
  }
  
  // Find top movers
  const topMovers = marketData
    .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
    .slice(0, 3);
  
  const opportunities: string[] = [];
  
  // Market-specific opportunity identification
  switch (regime) {
    case 'BULL':
      opportunities.push('🎯 Look for momentum breakouts above resistance');
      opportunities.push('📈 Scale into trending positions on pullbacks');
      opportunities.push('🚀 Consider leveraging strong performers');
      break;
    case 'BEAR':
      opportunities.push('📉 Short rallies into resistance');
      opportunities.push('💰 Accumulate quality assets at discounts');
      opportunities.push('🛡️ Defensive plays in stable sectors');
      break;
    case 'RANGE':
      opportunities.push('🎯 Buy near support, sell near resistance');
      opportunities.push('⚖️ Range-bound swing trading setups');
      opportunities.push('📊 Mean reversion strategies');
      break;
    case 'VOLATILE':
      opportunities.push('⚡ Quick scalping on volatility spikes');
      opportunities.push('🎢 Options strategies for high IV');
      opportunities.push('⚖️ Market neutral approaches');
      break;
  }
  
  const topMoversList = topMovers.map(market => 
    `• **${market.symbol}**: ${market.priceChangePercent >= 0 ? '+' : ''}${market.priceChangePercent.toFixed(2)}%`
  ).join('\n');
  
  const content = `${config.emojis.action} **${regime} Market Opportunities**

**Key Focus Areas:**
${opportunities.map(opp => opp).join('\n')}

**Top Movers to Watch:**
${topMoversList}

**AI Recommendation:**
${aiAnalysis.recommendedSymbol ? `🎯 Primary Focus: **${aiAnalysis.recommendedSymbol}**` : '📊 Continue monitoring for setups'}
${aiAnalysis.entryPrice ? `📍 Entry Zone: $${aiAnalysis.entryPrice.toFixed(2)}` : ''}
${aiAnalysis.targetPrice ? `🎯 Target: $${aiAnalysis.targetPrice.toFixed(2)}` : ''}`;

  return {
    id: 'market_opportunities',
    title: 'Market Opportunities',
    content,
    priority: 'medium',
    emoji: config.emojis.action
  };
}

/**
 * Create interactive elements based on market conditions
 */
export function createMarketSpecificInteractiveElements(
  regime: MarketRegime | 'EMERGENCY'
): InteractiveElement[] {
  const config = MARKET_CONDITION_CONFIGS[regime];
  const baseElements: InteractiveElement[] = [
    {
      type: 'quick_action',
      text: '📊 Full Analytics',
      callbackData: 'show_analytics'
    },
    {
      type: 'settings',
      text: '⚙️ Settings',
      callbackData: 'show_settings'
    }
  ];
  
  // Add market-specific actions
  const marketSpecific: InteractiveElement[] = [];
  
  switch (regime) {
    case 'BULL':
      marketSpecific.push(
        {
          type: 'quick_action',
          text: '🚀 Scale Positions',
          callbackData: 'scale_positions',
          condition: 'data.portfolio.dailyPnL > 0'
        },
        {
          type: 'quick_action',
          text: '📈 Momentum Scan',
          callbackData: 'momentum_scan'
        }
      );
      break;
    case 'BEAR':
      marketSpecific.push(
        {
          type: 'quick_action',
          text: '🛡️ Reduce Risk',
          callbackData: 'reduce_risk'
        },
        {
          type: 'quick_action',
          text: '📉 Short Opportunities',
          callbackData: 'short_scan'
        }
      );
      break;
    case 'RANGE':
      marketSpecific.push(
        {
          type: 'quick_action',
          text: '🎯 Range Setups',
          callbackData: 'range_setups'
        }
      );
      break;
    case 'VOLATILE':
      marketSpecific.push(
        {
          type: 'quick_action',
          text: '⚡ Adjust Stops',
          callbackData: 'adjust_stops_volatility'
        },
        {
          type: 'quick_action',
          text: '📊 Volatility Plays',
          callbackData: 'volatility_strategies'
        }
      );
      break;
    case 'EMERGENCY':
      marketSpecific.push(
        {
          type: 'emergency',
          text: '🚨 EMERGENCY STOP',
          callbackData: 'emergency_stop_all'
        },
        {
          type: 'emergency',
          text: '⚠️ Risk Review',
          callbackData: 'emergency_risk_review'
        }
      );
      break;
  }
  
  return [...baseElements, ...marketSpecific];
}

/**
 * Create complete market-specific template
 */
export function createMarketSpecificTemplate(
  data: DailyReportData,
  regime?: MarketRegime | 'EMERGENCY'
): DailyReportTemplate {
  const marketRegime = regime || data.aiAnalysis.marketRegime;
  const isEmergency = regime === 'EMERGENCY' || 
    data.riskMetrics.portfolioDrawdown > 20 || 
    data.alerts.some(alert => alert.type === 'CRITICAL');
  
  const finalRegime = isEmergency ? 'EMERGENCY' : marketRegime;
  const config = MARKET_CONDITION_CONFIGS[finalRegime];
  
  const sections: ReportSection[] = [
    generateMarketSpecificExecutiveSummary(data, finalRegime),
    generateMarketRiskAssessment(data, finalRegime),
    generateMarketOpportunities(data, finalRegime)
  ];
  
  // Add standard sections with market-specific styling
  if (!isEmergency) {
    // Import standard generators
    const { generatePerformanceMetrics, generateActivePositions } = 
      require('./daily-report-template');
    
    sections.push(
      generatePerformanceMetrics(data, config),
      generateActivePositions(data, config)
    );
  }
  
  const formatting: MessageFormatting = {
    parseMode: 'MarkdownV2',
    useEmojis: true,
    boldHeaders: true,
    codeBlocks: !isEmergency, // Simpler formatting for emergencies
    linkPreviews: false,
    compactMode: isEmergency || finalRegime === 'VOLATILE'
  };
  
  return {
    templateId: `market_specific_${finalRegime.toLowerCase()}`,
    name: `${finalRegime} Market Report`,
    description: `Dynamic report optimized for ${finalRegime} market conditions`,
    marketRegime: finalRegime === 'EMERGENCY' ? 'ALL' : marketRegime,
    sections: sections.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    maxMessageLength: 4096,
    formatting,
    interactiveElements: createMarketSpecificInteractiveElements(finalRegime)
  };
}

/**
 * Market condition detection and template selection
 */
export function detectMarketConditionAndCreateTemplate(
  data: DailyReportData
): DailyReportTemplate {
  const { aiAnalysis, riskMetrics, alerts } = data;
  
  // Emergency condition detection
  const hasEmergencyConditions = 
    riskMetrics.portfolioDrawdown > 20 ||
    alerts.some(alert => alert.type === 'CRITICAL') ||
    Math.abs(data.portfolio.dailyPnLPercentage) > 15;
  
  if (hasEmergencyConditions) {
    return createMarketSpecificTemplate(data, 'EMERGENCY');
  }
  
  // Enhanced volatility detection
  const volatilityScore = 
    (data.marketData.reduce((sum, market) => sum + Math.abs(market.priceChangePercent), 0) / data.marketData.length) +
    (aiAnalysis.confidence < 0.5 ? 20 : 0) + // Low confidence indicates uncertainty
    (riskMetrics.portfolioDrawdown > 10 ? 15 : 0); // High drawdown indicates volatility
  
  let detectedRegime: MarketRegime = aiAnalysis.marketRegime;
  
  if (volatilityScore > 25) {
    detectedRegime = 'VOLATILE';
  }
  
  return createMarketSpecificTemplate(data, detectedRegime);
}

// Export quick access templates
export const MARKET_TEMPLATES = {
  BULL: (data: DailyReportData) => createMarketSpecificTemplate(data, 'BULL'),
  BEAR: (data: DailyReportData) => createMarketSpecificTemplate(data, 'BEAR'),
  RANGE: (data: DailyReportData) => createMarketSpecificTemplate(data, 'RANGE'),
  VOLATILE: (data: DailyReportData) => createMarketSpecificTemplate(data, 'VOLATILE'),
  EMERGENCY: (data: DailyReportData) => createMarketSpecificTemplate(data, 'EMERGENCY'),
  AUTO: (data: DailyReportData) => detectMarketConditionAndCreateTemplate(data)
};