import {
  UserReportPreferences,
  DailyReportTemplate,
  TemplateContext,
  ReportSection,
  MessagePerformance,
  DailyReportData,
  FormattingOptions
} from '../types';
import { MarketRegime } from '../../../types/trading';

/**
 * Personalization Engine
 * Adapts report content, formatting, and delivery based on user preferences,
 * historical performance, and behavioral patterns
 */

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserReportPreferences = {
  userId: '',
  sections: {
    executive_summary: { enabled: true, priority: 1 },
    performance_metrics: { enabled: true, priority: 2 },
    ai_insights: { enabled: true, priority: 3 },
    active_positions: { enabled: true, priority: 4 },
    risk_alerts: { enabled: true, priority: 5 },
    tomorrow_outlook: { enabled: true, priority: 6 },
    market_opportunities: { enabled: false, priority: 7 }
  },
  formatting: {
    parseMode: 'MarkdownV2',
    useEmojis: true,
    compactMode: false,
    language: 'en'
  },
  notifications: {
    timeZone: 'UTC',
    preferredTime: '09:00',
    frequency: 'daily',
    emergencyOnly: false
  },
  thresholds: {
    significantPnLChange: 5.0, // 5% change threshold
    riskAlertLevel: 'medium',
    minimumConfidence: 0.6
  }
};

// User behavior tracking patterns
interface UserBehaviorPattern {
  userId: string;
  avgReadTime: number;
  preferredSections: string[];
  engagementTimes: string[];
  commonActions: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  tradingStyle: 'conservative' | 'moderate' | 'aggressive';
  lastActivity: Date;
}

/**
 * Analyze user engagement patterns
 */
export function analyzeUserEngagement(
  performances: MessagePerformance[],
  timeframeHours: number = 720 // 30 days default
): UserBehaviorPattern {
  const recentPerformances = performances.filter(
    p => Date.now() - p.sentAt.getTime() < timeframeHours * 60 * 60 * 1000
  );

  if (recentPerformances.length === 0) {
    return {
      userId: performances[0]?.userId || '',
      avgReadTime: 30,
      preferredSections: ['executive_summary', 'performance_metrics'],
      engagementTimes: ['09:00', '18:00'],
      commonActions: [],
      riskTolerance: 'medium',
      tradingStyle: 'moderate',
      lastActivity: new Date()
    };
  }

  const avgReadTime = recentPerformances
    .filter(p => p.engagement.timeSpent > 0)
    .reduce((sum, p) => sum + p.engagement.timeSpent, 0) / recentPerformances.length;

  // Analyze clicked buttons to determine preferred sections
  const buttonClicks = recentPerformances.flatMap(p => p.clickedButtons);
  const sectionPreferences = buttonClicks.reduce((acc, button) => {
    acc[button] = (acc[button] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const preferredSections = Object.entries(sectionPreferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)
    .map(([section]) => section);

  // Determine engagement times
  const hours = recentPerformances
    .filter(p => p.readAt)
    .map(p => p.readAt!.getHours());
  
  const hourCounts = hours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const topHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([hour]) => `${hour.padStart(2, '0')}:00`);

  // Determine risk tolerance based on engagement with risk alerts
  const riskEngagement = buttonClicks.filter(button => 
    button.includes('risk') || button.includes('alert') || button.includes('emergency')
  ).length;
  
  const riskTolerance: 'low' | 'medium' | 'high' = 
    riskEngagement > performances.length * 0.7 ? 'low' :
    riskEngagement > performances.length * 0.3 ? 'medium' : 'high';

  return {
    userId: recentPerformances[0].userId,
    avgReadTime,
    preferredSections: preferredSections.length > 0 ? preferredSections : ['executive_summary'],
    engagementTimes: topHours.length > 0 ? topHours : ['09:00'],
    commonActions: buttonClicks.slice(0, 5),
    riskTolerance,
    tradingStyle: riskTolerance === 'low' ? 'conservative' : 
                  riskTolerance === 'high' ? 'aggressive' : 'moderate',
    lastActivity: new Date(Math.max(...recentPerformances.map(p => p.sentAt.getTime())))
  };
}

/**
 * Adapt template based on user preferences and behavior
 */
export function personalizeTemplate(
  template: DailyReportTemplate,
  preferences: UserReportPreferences,
  behaviorPattern?: UserBehaviorPattern
): DailyReportTemplate {
  const personalizedTemplate = { ...template };

  // Filter and reorder sections based on preferences
  personalizedTemplate.sections = template.sections
    .filter(section => preferences.sections[section.id]?.enabled !== false)
    .map(section => {
      const sectionPref = preferences.sections[section.id];
      if (sectionPref?.customFormat) {
        // Apply custom formatting if provided
        return {
          ...section,
          content: applyCustomFormat(section.content, sectionPref.customFormat)
        };
      }
      return section;
    })
    .sort((a, b) => {
      const aPriority = preferences.sections[a.id]?.priority || 999;
      const bPriority = preferences.sections[b.id]?.priority || 999;
      return aPriority - bPriority;
    });

  // Adapt formatting based on preferences
  personalizedTemplate.formatting = {
    ...template.formatting,
    ...preferences.formatting
  };

  // Adjust content based on behavior patterns
  if (behaviorPattern) {
    personalizedTemplate.sections = adaptForBehaviorPattern(
      personalizedTemplate.sections,
      behaviorPattern,
      preferences
    );
  }

  return personalizedTemplate;
}

/**
 * Adapt sections based on user behavior patterns
 */
function adaptForBehaviorPattern(
  sections: ReportSection[],
  pattern: UserBehaviorPattern,
  preferences: UserReportPreferences
): ReportSection[] {
  return sections.map(section => {
    let adaptedSection = { ...section };

    // Adjust content length based on reading time
    if (pattern.avgReadTime < 20) {
      // User reads quickly - provide condensed content
      adaptedSection.content = condenseContent(section.content);
    } else if (pattern.avgReadTime > 60) {
      // User spends time reading - can handle detailed content
      adaptedSection.content = expandContent(section.content, section.id, pattern);
    }

    // Adjust risk messaging based on risk tolerance
    if (section.id.includes('risk') || section.id.includes('alert')) {
      adaptedSection.content = adjustRiskMessaging(
        section.content,
        pattern.riskTolerance,
        pattern.tradingStyle
      );
    }

    // Highlight preferred sections
    if (pattern.preferredSections.includes(section.id)) {
      adaptedSection.priority = 'high';
      if (section.emoji) {
        adaptedSection.emoji = `⭐ ${section.emoji}`;
      }
    }

    return adaptedSection;
  });
}

/**
 * Condense content for quick readers
 */
function condenseContent(content: string): string {
  const lines = content.split('\n');
  const condensed = lines
    .filter(line => {
      // Keep headers, key metrics, and important alerts
      return line.includes('**') || 
             line.includes('🚨') || 
             line.includes('P&L') ||
             line.includes('Risk') ||
             line.includes('%');
    })
    .slice(0, 6); // Limit to 6 most important lines

  return condensed.join('\n');
}

/**
 * Expand content for engaged readers
 */
function expandContent(
  content: string,
  sectionId: string,
  pattern: UserBehaviorPattern
): string {
  let expanded = content;

  // Add contextual insights based on section type
  switch (sectionId) {
    case 'ai_insights':
      expanded += '\n\n📊 **Additional Context:**\n';
      expanded += '• Market conditions align with historical patterns\n';
      expanded += '• Consider correlation with traditional markets\n';
      break;
    case 'performance_metrics':
      expanded += '\n\n📈 **Benchmark Comparison:**\n';
      expanded += '• vs. BTC: Performance tracking available\n';
      expanded += '• vs. Portfolio avg: Historical context\n';
      break;
    case 'active_positions':
      expanded += '\n\n⚖️ **Position Analysis:**\n';
      expanded += '• Correlation risk assessment\n';
      expanded += '• Sector exposure breakdown\n';
      break;
  }

  return expanded;
}

/**
 * Adjust risk messaging based on user risk tolerance
 */
function adjustRiskMessaging(
  content: string,
  riskTolerance: 'low' | 'medium' | 'high',
  tradingStyle: 'conservative' | 'moderate' | 'aggressive'
): string {
  let adjusted = content;

  // Replace generic risk messages with personalized ones
  const riskMessages = {
    low: {
      'reduce risk': 'consider significant position reduction',
      'monitor closely': 'immediate attention required',
      'caution advised': 'strong caution - consider defensive posture'
    },
    medium: {
      'reduce risk': 'moderate position adjustment recommended',
      'monitor closely': 'increased monitoring suggested',
      'caution advised': 'exercise normal caution'
    },
    high: {
      'reduce risk': 'slight position adjustment may be prudent',
      'monitor closely': 'keep an eye on developments',
      'caution advised': 'normal market conditions'
    }
  };

  const messagesToReplace = riskMessages[riskTolerance];
  Object.entries(messagesToReplace).forEach(([generic, personalized]) => {
    adjusted = adjusted.replace(new RegExp(generic, 'gi'), personalized);
  });

  // Add style-specific recommendations
  const styleRecommendations = {
    conservative: '\n💡 Conservative approach: Focus on capital preservation',
    moderate: '\n⚖️ Balanced approach: Maintain risk-adjusted returns',
    aggressive: '\n🚀 Growth focus: Leverage opportunities with managed risk'
  };

  if (content.includes('Risk') && !content.includes('Conservative approach')) {
    adjusted += styleRecommendations[tradingStyle];
  }

  return adjusted;
}

/**
 * Apply custom format string to content
 */
function applyCustomFormat(content: string, formatString: string): string {
  // Simple template engine for custom formats
  // Supports variables like {value}, {emoji}, etc.
  
  const variables = {
    timestamp: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
    separator: '─'.repeat(20)
  };

  let formatted = formatString;
  Object.entries(variables).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  // Insert original content where {content} placeholder is found
  formatted = formatted.replace('{content}', content);

  return formatted;
}

/**
 * Generate personalized greeting
 */
export function generatePersonalizedGreeting(
  preferences: UserReportPreferences,
  behaviorPattern?: UserBehaviorPattern,
  data?: DailyReportData
): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  let greeting = timeGreeting;

  if (behaviorPattern) {
    // Personalize based on trading performance and style
    if (data && data.portfolio.dailyPnL > 0) {
      greeting += behaviorPattern.tradingStyle === 'aggressive' ? ', champion trader!' : ', well done!';
    } else if (data && data.portfolio.dailyPnL < 0) {
      greeting += behaviorPattern.riskTolerance === 'low' ? '. Stay steady.' : '. Ready to bounce back?';
    } else {
      greeting += `, ${behaviorPattern.tradingStyle} trader`;
    }
  }

  return greeting;
}

/**
 * Determine optimal message timing
 */
export function getOptimalSendTime(
  preferences: UserReportPreferences,
  behaviorPattern?: UserBehaviorPattern
): Date {
  const now = new Date();
  const targetTime = new Date(now);

  // Use behavior pattern engagement times if available
  if (behaviorPattern && behaviorPattern.engagementTimes.length > 0) {
    const [hour, minute] = behaviorPattern.engagementTimes[0].split(':').map(Number);
    targetTime.setHours(hour, minute, 0, 0);
  } else {
    // Use preference time
    const [hour, minute] = preferences.notifications.preferredTime.split(':').map(Number);
    targetTime.setHours(hour, minute, 0, 0);
  }

  // If the time has passed today, schedule for tomorrow
  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  return targetTime;
}

/**
 * Smart content filtering based on significance thresholds
 */
export function filterSignificantContent(
  template: DailyReportTemplate,
  preferences: UserReportPreferences,
  data: DailyReportData
): DailyReportTemplate {
  const filtered = { ...template };

  // Filter based on significance thresholds
  const { significantPnLChange, minimumConfidence } = preferences.thresholds;

  // Only include performance section if change is significant
  if (Math.abs(data.portfolio.dailyPnLPercentage) < significantPnLChange) {
    filtered.sections = filtered.sections.filter(s => s.id !== 'performance_metrics');
  }

  // Only include AI insights if confidence meets threshold
  if (data.aiAnalysis.confidence < minimumConfidence) {
    filtered.sections = filtered.sections.map(section => {
      if (section.id === 'ai_insights') {
        return {
          ...section,
          content: section.content + '\n\n⚠️ *AI confidence below your threshold - exercise additional caution*'
        };
      }
      return section;
    });
  }

  // Emergency alerts always override preferences
  const hasEmergencyAlerts = data.alerts.some(alert => alert.type === 'CRITICAL');
  if (hasEmergencyAlerts && preferences.notifications.emergencyOnly) {
    filtered.sections = filtered.sections.filter(s => 
      s.id === 'risk_alerts' || s.id === 'executive_summary'
    );
  }

  return filtered;
}

/**
 * Generate A/B test variant for user
 */
export function generateABTestVariant(
  userId: string,
  template: DailyReportTemplate,
  testId: string
): DailyReportTemplate {
  // Simple hash-based assignment for consistent user experience
  const hash = Array.from(userId + testId)
    .reduce((hash, char) => char.charCodeAt(0) + hash, 0);
  
  const variant = hash % 2; // Simple A/B split
  
  if (variant === 0) {
    // Variant A: Original template
    return template;
  } else {
    // Variant B: Modified template
    const modified = { ...template };
    
    // Test: More concise format
    modified.sections = modified.sections.map(section => ({
      ...section,
      content: condenseContent(section.content)
    }));
    
    modified.formatting.compactMode = true;
    
    return modified;
  }
}

/**
 * Main personalization function
 */
export function createPersonalizedReport(
  template: DailyReportTemplate,
  context: TemplateContext,
  performances: MessagePerformance[] = []
): DailyReportTemplate {
  const { user, data } = context;
  
  // Analyze user behavior if performance data is available
  const behaviorPattern = performances.length > 5 
    ? analyzeUserEngagement(performances)
    : undefined;

  // Apply personalization layers
  let personalizedTemplate = personalizeTemplate(template, user.preferences, behaviorPattern);
  personalizedTemplate = filterSignificantContent(personalizedTemplate, user.preferences, data);

  // Add personalized greeting to first section
  if (personalizedTemplate.sections.length > 0) {
    const greeting = generatePersonalizedGreeting(user.preferences, behaviorPattern, data);
    personalizedTemplate.sections[0].content = 
      `${greeting}!\n\n${personalizedTemplate.sections[0].content}`;
  }

  return personalizedTemplate;
}

/**
 * Export convenience functions
 */
export const PersonalizationUtils = {
  createPersonalizedReport,
  analyzeUserEngagement,
  personalizeTemplate,
  generatePersonalizedGreeting,
  getOptimalSendTime,
  filterSignificantContent,
  generateABTestVariant
};