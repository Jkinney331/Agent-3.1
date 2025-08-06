import {
  ABTest,
  ABTestVariant,
  DailyReportTemplate,
  TemplateContext,
  MessagePerformance,
  TemplatePerformance,
  UserReportPreferences,
  ReportSection,
  MessageFormatting,
  InteractiveElement
} from '../types';

/**
 * A/B Testing Framework for Message Optimization
 * Enables systematic testing of different message formats, content structures,
 * and interactive elements to optimize user engagement and effectiveness
 */

// Test configuration types
export interface TestConfiguration {
  minSampleSize: number;
  maxTestDuration: number; // days
  significanceLevel: number; // 0.05 for 95% confidence
  minimumEffectSize: number; // minimum meaningful difference
  metrics: TestMetric[];
}

export interface TestMetric {
  name: string;
  type: 'rate' | 'time' | 'count' | 'rating';
  weight: number; // importance weight (0-1)
  higherIsBetter: boolean;
}

// Default test configuration
export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  minSampleSize: 100,
  maxTestDuration: 14,
  significanceLevel: 0.05,
  minimumEffectSize: 0.1, // 10% improvement
  metrics: [
    { name: 'readRate', type: 'rate', weight: 0.3, higherIsBetter: true },
    { name: 'engagementRate', type: 'rate', weight: 0.25, higherIsBetter: true },
    { name: 'avgRating', type: 'rating', weight: 0.2, higherIsBetter: true },
    { name: 'timeSpent', type: 'time', weight: 0.15, higherIsBetter: true },
    { name: 'actionRate', type: 'rate', weight: 0.1, higherIsBetter: true }
  ]
};

// Pre-defined test variants for common scenarios
export const TEST_VARIANT_TEMPLATES = {
  CONCISE_VS_DETAILED: {
    name: 'Content Length Test',
    description: 'Compare concise vs detailed report formats',
    variants: [
      {
        id: 'concise',
        name: 'Concise Format',
        modifications: {
          formatting: { compactMode: true },
          sections: [{ priority: 'high' }] // Only show high priority sections
        }
      },
      {
        id: 'detailed',
        name: 'Detailed Format',
        modifications: {
          formatting: { compactMode: false },
          sections: [] // Show all sections
        }
      }
    ]
  },
  
  EMOJI_USAGE: {
    name: 'Emoji Usage Test',
    description: 'Test impact of emoji usage on engagement',
    variants: [
      {
        id: 'emoji_heavy',
        name: 'Heavy Emoji Usage',
        modifications: {
          formatting: { useEmojis: true, boldHeaders: true }
        }
      },
      {
        id: 'emoji_minimal',
        name: 'Minimal Emoji Usage',
        modifications: {
          formatting: { useEmojis: false, boldHeaders: false }
        }
      }
    ]
  },

  INTERACTIVE_ELEMENTS: {
    name: 'Interactive Elements Test',
    description: 'Compare different interactive element configurations',
    variants: [
      {
        id: 'full_interactive',
        name: 'Full Interactive',
        modifications: {
          interactiveElements: [
            { type: 'quick_action', text: '📊 Analytics', callbackData: 'analytics' },
            { type: 'quick_action', text: '💼 Positions', callbackData: 'positions' },
            { type: 'settings', text: '⚙️ Settings', callbackData: 'settings' }
          ]
        }
      },
      {
        id: 'minimal_interactive',
        name: 'Minimal Interactive',
        modifications: {
          interactiveElements: [
            { type: 'quick_action', text: '📊 Full Report', callbackData: 'full_report' }
          ]
        }
      }
    ]
  }
};

/**
 * A/B Test Manager Class
 */
export class ABTestManager {
  private activeTests: Map<string, ABTest> = new Map();
  private testAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private config: TestConfiguration;

  constructor(config: TestConfiguration = DEFAULT_TEST_CONFIG) {
    this.config = config;
  }

  /**
   * Create a new A/B test
   */
  createTest(
    name: string,
    description: string,
    templateId: string,
    variants: Omit<ABTestVariant, 'id'>[],
    duration?: number
  ): ABTest {
    const testId = this.generateTestId(name);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (duration || this.config.maxTestDuration));

    const test: ABTest = {
      id: testId,
      name,
      description,
      startDate,
      endDate,
      status: 'draft',
      variants: variants.map((variant, index) => ({
        ...variant,
        id: `${testId}_variant_${index}`,
        templateId
      })),
      metrics: {},
      winningVariant: undefined
    };

    // Initialize metrics for each variant
    test.variants.forEach(variant => {
      test.metrics[variant.id] = {
        sent: 0,
        read: 0,
        engaged: 0,
        rated: 0,
        avgRating: 0
      };
    });

    this.activeTests.set(testId, test);
    return test;
  }

  /**
   * Start a test
   */
  startTest(testId: string): boolean {
    const test = this.activeTests.get(testId);
    if (!test) return false;

    test.status = 'running';
    test.startDate = new Date();
    return true;
  }

  /**
   * Assign user to test variant
   */
  assignUserToVariant(userId: string, testId: string): string | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return null;

    // Check if user is already assigned
    const userAssignments = this.testAssignments.get(userId) || new Map();
    if (userAssignments.has(testId)) {
      return userAssignments.get(testId)!;
    }

    // Assign user to variant based on weighted distribution
    const variantId = this.selectVariantForUser(userId, test);
    
    if (!userAssignments.has(testId)) {
      this.testAssignments.set(userId, new Map());
    }
    this.testAssignments.get(userId)!.set(testId, variantId);

    return variantId;
  }

  /**
   * Apply test variant to template
   */
  applyVariant(
    template: DailyReportTemplate,
    testId: string,
    variantId: string
  ): DailyReportTemplate {
    const test = this.activeTests.get(testId);
    if (!test) return template;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return template;

    const modifiedTemplate = { ...template };

    // Apply section modifications
    if (variant.modifications.sections) {
      modifiedTemplate.sections = this.applySectionModifications(
        template.sections,
        variant.modifications.sections
      );
    }

    // Apply formatting modifications
    if (variant.modifications.formatting) {
      modifiedTemplate.formatting = {
        ...template.formatting,
        ...variant.modifications.formatting
      };
    }

    // Apply interactive element modifications
    if (variant.modifications.interactiveElements) {
      modifiedTemplate.interactiveElements = [
        ...template.interactiveElements,
        ...variant.modifications.interactiveElements
      ];
    }

    return modifiedTemplate;
  }

  /**
   * Record test metrics
   */
  recordMetric(
    testId: string,
    variantId: string,
    performance: MessagePerformance
  ): void {
    const test = this.activeTests.get(testId);
    if (!test || !test.metrics[variantId]) return;

    const metrics = test.metrics[variantId];
    
    // Update counts
    metrics.sent++;
    
    if (performance.readAt) {
      metrics.read++;
    }

    if (performance.engagement.actionsPerformed > 0) {
      metrics.engaged++;
    }

    if (performance.userRating) {
      const prevTotal = metrics.avgRating * metrics.rated;
      metrics.rated++;
      metrics.avgRating = (prevTotal + performance.userRating) / metrics.rated;
    }
  }

  /**
   * Get test results with statistical analysis
   */
  getTestResults(testId: string): TestResults | null {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    const results: TestResults = {
      testId,
      status: test.status,
      variants: [],
      conclusion: 'insufficient_data',
      confidence: 0,
      recommendedVariant: null
    };

    // Calculate metrics for each variant
    test.variants.forEach(variant => {
      const metrics = test.metrics[variant.id];
      const variantResult: VariantResult = {
        variantId: variant.id,
        name: variant.name,
        sampleSize: metrics.sent,
        metrics: {
          readRate: metrics.sent > 0 ? metrics.read / metrics.sent : 0,
          engagementRate: metrics.sent > 0 ? metrics.engaged / metrics.sent : 0,
          avgRating: metrics.avgRating,
          actionRate: metrics.sent > 0 ? metrics.engaged / metrics.sent : 0
        },
        score: 0
      };

      // Calculate composite score
      variantResult.score = this.calculateCompositeScore(variantResult.metrics);
      results.variants.push(variantResult);
    });

    // Statistical analysis
    if (this.hasSufficientData(test)) {
      const analysis = this.performStatisticalAnalysis(results.variants);
      results.conclusion = analysis.conclusion;
      results.confidence = analysis.confidence;
      results.recommendedVariant = analysis.winningVariant;
    }

    return results;
  }

  /**
   * End test and determine winner
   */
  endTest(testId: string): TestResults | null {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    const results = this.getTestResults(testId);
    if (!results) return null;

    test.status = 'completed';
    test.endDate = new Date();

    if (results.recommendedVariant) {
      test.winningVariant = results.recommendedVariant;
    }

    return results;
  }

  /**
   * Get active tests for user
   */
  getActiveTestsForUser(userId: string): string[] {
    const userAssignments = this.testAssignments.get(userId);
    if (!userAssignments) return [];

    return Array.from(userAssignments.keys()).filter(testId => {
      const test = this.activeTests.get(testId);
      return test && test.status === 'running';
    });
  }

  /**
   * Auto-create tests based on performance patterns
   */
  suggestTests(
    templatePerformances: TemplatePerformance[],
    userPreferences: UserReportPreferences[]
  ): ABTest[] {
    const suggestions: ABTest[] = [];

    // Analyze template performance
    const lowPerformingTemplates = templatePerformances.filter(
      tp => tp.avgEngagement < 0.3 || tp.avgUserRating < 3.5
    );

    lowPerformingTemplates.forEach(template => {
      // Suggest content length test
      if (template.avgReadRate < 0.5) {
        const test = this.createTest(
          `Content Length - ${template.templateId}`,
          'Test if concise format improves read rate',
          template.templateId,
          TEST_VARIANT_TEMPLATES.CONCISE_VS_DETAILED.variants
        );
        suggestions.push(test);
      }

      // Suggest emoji test
      if (template.avgEngagement < 0.25) {
        const test = this.createTest(
          `Emoji Usage - ${template.templateId}`,
          'Test if emoji usage improves engagement',
          template.templateId,
          TEST_VARIANT_TEMPLATES.EMOJI_USAGE.variants
        );
        suggestions.push(test);
      }
    });

    return suggestions;
  }

  // Private helper methods

  private generateTestId(name: string): string {
    const timestamp = Date.now();
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `test_${nameSlug}_${timestamp}`;
  }

  private selectVariantForUser(userId: string, test: ABTest): string {
    // Simple hash-based assignment for consistent user experience
    const hash = this.hashString(userId + test.id);
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    
    let cumulativeWeight = 0;
    const target = (hash % 1000) / 1000 * totalWeight;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (target <= cumulativeWeight) {
        return variant.id;
      }
    }
    
    return test.variants[0].id; // Fallback
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private applySectionModifications(
    sections: ReportSection[],
    modifications: Partial<ReportSection>[]
  ): ReportSection[] {
    if (modifications.length === 0) return sections;

    // If modifications specify priority filtering
    const priorityFilter = modifications.find(mod => mod.priority);
    if (priorityFilter) {
      return sections.filter(section => section.priority === priorityFilter.priority);
    }

    return sections;
  }

  private calculateCompositeScore(metrics: any): number {
    let score = 0;
    
    this.config.metrics.forEach(metric => {
      const value = metrics[metric.name] || 0;
      const normalizedValue = metric.higherIsBetter ? value : (1 - value);
      score += normalizedValue * metric.weight;
    });

    return score;
  }

  private hasSufficientData(test: ABTest): boolean {
    return test.variants.every(variant => 
      test.metrics[variant.id].sent >= this.config.minSampleSize
    );
  }

  private performStatisticalAnalysis(variants: VariantResult[]): StatisticalAnalysis {
    if (variants.length < 2) {
      return {
        conclusion: 'insufficient_variants',
        confidence: 0,
        winningVariant: null
      };
    }

    // Simple comparison - in production, use proper statistical tests
    variants.sort((a, b) => b.score - a.score);
    
    const winner = variants[0];
    const runnerUp = variants[1];
    
    const difference = winner.score - runnerUp.score;
    const confidence = Math.min(difference / this.config.minimumEffectSize, 1);
    
    return {
      conclusion: confidence > 0.8 ? 'significant_winner' : 'inconclusive',
      confidence,
      winningVariant: confidence > 0.8 ? winner.variantId : null
    };
  }
}

// Supporting interfaces
export interface TestResults {
  testId: string;
  status: string;
  variants: VariantResult[];
  conclusion: 'insufficient_data' | 'insufficient_variants' | 'inconclusive' | 'significant_winner';
  confidence: number;
  recommendedVariant: string | null;
}

export interface VariantResult {
  variantId: string;
  name: string;
  sampleSize: number;
  metrics: {
    readRate: number;
    engagementRate: number;
    avgRating: number;
    actionRate: number;
  };
  score: number;
}

export interface StatisticalAnalysis {
  conclusion: 'insufficient_data' | 'insufficient_variants' | 'inconclusive' | 'significant_winner';
  confidence: number;
  winningVariant: string | null;
}

/**
 * Utility functions for A/B testing
 */
export function createQuickTest(
  templateId: string,
  testType: keyof typeof TEST_VARIANT_TEMPLATES,
  duration?: number
): ABTest {
  const manager = new ABTestManager();
  const template = TEST_VARIANT_TEMPLATES[testType];
  
  return manager.createTest(
    template.name,
    template.description,
    templateId,
    template.variants,
    duration
  );
}

export function shouldRunTest(
  templatePerformance: TemplatePerformance,
  thresholds: {
    minReadRate?: number;
    minEngagement?: number;
    minRating?: number;
  } = {}
): boolean {
  const {
    minReadRate = 0.6,
    minEngagement = 0.3,
    minRating = 3.5
  } = thresholds;

  return (
    templatePerformance.avgReadRate < minReadRate ||
    templatePerformance.avgEngagement < minEngagement ||
    templatePerformance.avgUserRating < minRating
  );
}

// Export singleton instance
export const abTestManager = new ABTestManager();