import {
  DailyReportTemplate,
  TemplateContext,
  TelegramMessageChunk,
  FormattingOptions,
  UserReportPreferences,
  MessagePerformance,
  DailyReportData
} from './types';

// Import all the components
import { formatDailyReport } from './formatters/message-formatter';
import { PersonalizationUtils } from './formatters/personalization-engine';
import { InteractiveUtils } from './formatters/interactive-elements';
import { abTestManager } from './formatters/ab-testing-framework';
import { MARKET_TEMPLATES } from './templates/market-condition-templates';
import { QUICK_TEMPLATES } from './templates/daily-report-template';

/**
 * Main Template Renderer
 * Orchestrates the entire template generation and rendering process,
 * integrating personalization, A/B testing, and market-specific adaptations
 */

export interface RenderOptions extends FormattingOptions {
  enablePersonalization?: boolean;
  enableABTesting?: boolean;
  forceMarketRegime?: string;
  includeInteractiveElements?: boolean;
}

/**
 * Main template rendering function
 */
export async function renderDailyReport(
  data: DailyReportData,
  preferences: UserReportPreferences,
  performances: MessagePerformance[] = [],
  options: RenderOptions = {}
): Promise<TelegramMessageChunk> {
  const {
    enablePersonalization = true,
    enableABTesting = true,
    forceMarketRegime,
    includeInteractiveElements = true,
    ...formattingOptions
  } = options;

  // 1. Create base template based on market conditions
  let template: DailyReportTemplate;
  
  if (forceMarketRegime && MARKET_TEMPLATES[forceMarketRegime as keyof typeof MARKET_TEMPLATES]) {
    template = MARKET_TEMPLATES[forceMarketRegime as keyof typeof MARKET_TEMPLATES](data);
  } else {
    template = MARKET_TEMPLATES.AUTO(data);
  }

  // 2. Apply A/B testing if enabled
  if (enableABTesting) {
    const activeTests = abTestManager.getActiveTestsForUser(preferences.userId);
    
    for (const testId of activeTests) {
      const variantId = abTestManager.assignUserToVariant(preferences.userId, testId);
      if (variantId) {
        template = abTestManager.applyVariant(template, testId, variantId);
      }
    }
  }

  // 3. Apply personalization if enabled
  if (enablePersonalization) {
    template = PersonalizationUtils.createPersonalizedReport(
      template,
      {
        user: {
          id: preferences.userId,
          preferences,
          timeZone: preferences.notifications.timeZone,
          language: preferences.formatting.language
        },
        data,
        market: {
          regime: data.aiAnalysis.marketRegime,
          volatility: determineVolatilityLevel(data),
          sentiment: data.aiAnalysis.sentiment
        },
        previousReport: getPreviousReportMetrics(performances)
      },
      performances
    );
  }

  // 4. Add interactive elements if enabled
  if (includeInteractiveElements) {
    template.interactiveElements = [
      ...template.interactiveElements,
      ...InteractiveUtils.createContextualActions(data, preferences)
    ];
  }

  // 5. Create template context
  const context: TemplateContext = {
    user: {
      id: preferences.userId,
      preferences,
      timeZone: preferences.notifications.timeZone,
      language: preferences.formatting.language
    },
    data,
    market: {
      regime: data.aiAnalysis.marketRegime,
      volatility: determineVolatilityLevel(data),
      sentiment: data.aiAnalysis.sentiment
    },
    previousReport: getPreviousReportMetrics(performances)
  };

  // 6. Format and render the final message
  const messageChunk = formatDailyReport(template, context, formattingOptions);

  // 7. Validate the output
  for (const message of messageChunk.messages) {
    const validation = require('./formatters/message-formatter').validateMessage(message);
    if (!validation.valid) {
      console.warn('Message validation failed:', validation.errors);
      // In production, you might want to fallback to a simpler format
    }
  }

  return messageChunk;
}

/**
 * Quick template renderers for specific scenarios
 */
export const QuickRenderers = {
  /**
   * Morning briefing - optimized for quick consumption
   */
  morningBrieifing: async (
    data: DailyReportData,
    preferences: UserReportPreferences
  ): Promise<TelegramMessageChunk> => {
    const template = QUICK_TEMPLATES.MORNING_BRIEFING(data);
    template.formatting.compactMode = true;
    
    const context: TemplateContext = {
      user: {
        id: preferences.userId,
        preferences,
        timeZone: preferences.notifications.timeZone,
        language: preferences.formatting.language
      },
      data,
      market: {
        regime: data.aiAnalysis.marketRegime,
        volatility: determineVolatilityLevel(data),
        sentiment: data.aiAnalysis.sentiment
      }
    };

    return formatDailyReport(template, context, { compactMode: true });
  },

  /**
   * Emergency alert - critical information only
   */
  emergencyAlert: async (
    data: DailyReportData,
    preferences: UserReportPreferences
  ): Promise<TelegramMessageChunk> => {
    const template = QUICK_TEMPLATES.EMERGENCY_ALERT(data);
    
    const context: TemplateContext = {
      user: {
        id: preferences.userId,
        preferences,
        timeZone: preferences.notifications.timeZone,
        language: preferences.formatting.language
      },
      data,
      market: {
        regime: data.aiAnalysis.marketRegime,
        volatility: 'high',
        sentiment: data.aiAnalysis.sentiment
      }
    };

    // Add emergency keyboard
    template.interactiveElements = [
      ...template.interactiveElements,
      ...InteractiveUtils.createEmergencyKeyboard(data, preferences.userId).inlineKeyboard.flat().map(button => ({
        type: 'emergency' as const,
        text: button.text,
        callbackData: button.callbackData || ''
      }))
    ];

    return formatDailyReport(template, context, { 
      compactMode: true,
      includeActions: true
    });
  },

  /**
   * End of day summary - performance focused
   */
  endOfDaySummary: async (
    data: DailyReportData,
    preferences: UserReportPreferences
  ): Promise<TelegramMessageChunk> => {
    const template = QUICK_TEMPLATES.EOD_SUMMARY(data);
    
    const context: TemplateContext = {
      user: {
        id: preferences.userId,
        preferences,
        timeZone: preferences.notifications.timeZone,
        language: preferences.formatting.language
      },
      data,
      market: {
        regime: data.aiAnalysis.marketRegime,
        volatility: determineVolatilityLevel(data),
        sentiment: data.aiAnalysis.sentiment
      }
    };

    return formatDailyReport(template, context);
  },

  /**
   * Quick update - minimal information for busy users
   */
  quickUpdate: async (
    data: DailyReportData,
    preferences: UserReportPreferences
  ): Promise<TelegramMessageChunk> => {
    const { formatQuickSummary } = require('./formatters/message-formatter');
    
    const context: TemplateContext = {
      user: {
        id: preferences.userId,
        preferences,
        timeZone: preferences.notifications.timeZone,
        language: preferences.formatting.language
      },
      data,
      market: {
        regime: data.aiAnalysis.marketRegime,
        volatility: determineVolatilityLevel(data),
        sentiment: data.aiAnalysis.sentiment
      }
    };

    const message = formatQuickSummary(context, {
      parseMode: preferences.formatting.parseMode,
      useEmojis: preferences.formatting.useEmojis
    });

    return {
      messages: [message],
      totalLength: message.text.length,
      chunkCount: 1
    };
  }
};

/**
 * Template performance tracking
 */
export class TemplatePerformanceTracker {
  private performances: Map<string, MessagePerformance[]> = new Map();

  recordPerformance(performance: MessagePerformance): void {
    const key = performance.templateId;
    if (!this.performances.has(key)) {
      this.performances.set(key, []);
    }
    this.performances.get(key)!.push(performance);

    // Record for A/B testing if applicable
    const activeTests = abTestManager.getActiveTestsForUser(performance.userId);
    for (const testId of activeTests) {
      const variantId = abTestManager.assignUserToVariant(performance.userId, testId);
      if (variantId) {
        abTestManager.recordMetric(testId, variantId, performance);
      }
    }
  }

  getTemplatePerformance(templateId: string, days: number = 30): any {
    const performances = this.performances.get(templateId) || [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentPerformances = performances.filter(p => p.sentAt >= cutoff);

    if (recentPerformances.length === 0) {
      return null;
    }

    const totalSent = recentPerformances.length;
    const totalRead = recentPerformances.filter(p => p.readAt).length;
    const totalEngaged = recentPerformances.filter(p => p.engagement.actionsPerformed > 0).length;
    const totalRated = recentPerformances.filter(p => p.userRating).length;
    const avgRating = totalRated > 0 
      ? recentPerformances.reduce((sum, p) => sum + (p.userRating || 0), 0) / totalRated
      : 0;

    return {
      templateId,
      totalSent,
      avgReadRate: totalRead / totalSent,
      avgEngagement: totalEngaged / totalSent,
      avgUserRating: avgRating,
      conversionRate: totalEngaged / totalSent,
      responseTime: recentPerformances.reduce((sum, p) => sum + (p.responseTime || 0), 0) / totalSent,
      lastOptimized: new Date()
    };
  }

  suggestOptimizations(templateId: string): string[] {
    const performance = this.getTemplatePerformance(templateId);
    if (!performance) return [];

    const suggestions: string[] = [];

    if (performance.avgReadRate < 0.6) {
      suggestions.push('Consider shorter, more concise content');
      suggestions.push('Try A/B testing different opening lines');
    }

    if (performance.avgEngagement < 0.3) {
      suggestions.push('Add more interactive elements');
      suggestions.push('Include clearer call-to-action buttons');
    }

    if (performance.avgUserRating < 3.5) {
      suggestions.push('Improve content relevance and accuracy');
      suggestions.push('Test different formatting styles');
    }

    if (performance.responseTime > 30) {
      suggestions.push('Simplify message structure');
      suggestions.push('Reduce cognitive load with better organization');
    }

    return suggestions;
  }
}

// Helper functions
function determineVolatilityLevel(data: DailyReportData): 'low' | 'medium' | 'high' {
  const avgPriceChange = data.marketData.reduce((sum, market) => 
    sum + Math.abs(market.priceChangePercent), 0) / data.marketData.length;
  
  if (avgPriceChange > 8) return 'high';
  if (avgPriceChange > 4) return 'medium';
  return 'low';
}

function getPreviousReportMetrics(performances: MessagePerformance[]) {
  if (performances.length === 0) return undefined;

  const latest = performances[performances.length - 1];
  return {
    performance: latest.engagement.actionsPerformed / 10, // Normalize to 0-1
    engagement: latest.engagement.timeSpent / 60, // Convert to minutes
    rating: latest.userRating || 0
  };
}

// Export singleton tracker
export const performanceTracker = new TemplatePerformanceTracker();

// Main export - the primary interface for rendering reports
export default {
  renderDailyReport,
  QuickRenderers,
  performanceTracker,
  abTestManager
};