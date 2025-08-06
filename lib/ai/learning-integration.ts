import { EventEmitter } from 'events';
import { tradeAnalysisEngine, TradeStatistics, RiskAdjustedMetrics, TradingInsight } from './trade-analysis-engine';
import { patternRecognitionEngine, MarketPattern, BehavioralPattern, AnomalyDetection, PatternInsight } from './pattern-recognition';
import { aiReasoningEngine } from './reasoning-engine';
import { supabase } from '../database/supabase-client';
import { 
  Trade, 
  Position, 
  MarketRegime,
  CandlestickData,
  StrategyPerformance 
} from '../../types/trading';

// Learning Integration Interfaces
export interface LearningConfig {
  adaptationRate: number; // How quickly the system adapts to new data (0-1)
  confidenceDecayRate: number; // How confidence in patterns decays over time
  minSampleSize: number; // Minimum samples needed for pattern validation
  performanceWeightingFactor: number; // How much recent performance affects strategy scoring
  patternValidationThreshold: number; // Threshold for pattern validation
  insightGenerationInterval: number; // How often to generate new insights (milliseconds)
  maxStoredInsights: number; // Maximum number of insights to store
  learningRetentionDays: number; // How long to retain learning data
}

export interface AdaptiveStrategy {
  id: string;
  name: string;
  baseStrategy: string;
  adaptations: StrategyAdaptation[];
  currentParameters: StrategyParameters;
  performanceHistory: PerformanceSnapshot[];
  learningMetrics: LearningMetrics;
  lastUpdated: Date;
  confidence: number;
  effectiveness: number;
  marketRegimeOptimization: RegimeOptimization;
}

export interface StrategyAdaptation {
  id: string;
  type: AdaptationType;
  trigger: AdaptationTrigger;
  modification: ParameterModification;
  implementedAt: Date;
  expectedImpact: number;
  actualImpact?: number;
  success: boolean;
  reasoning: string[];
}

export type AdaptationType = 
  | 'PARAMETER_ADJUSTMENT' | 'RISK_MODIFICATION' | 'TIMING_OPTIMIZATION'
  | 'POSITION_SIZING' | 'ENTRY_CRITERIA' | 'EXIT_CRITERIA'
  | 'STOP_LOSS_OPTIMIZATION' | 'TAKE_PROFIT_ADJUSTMENT';

export interface AdaptationTrigger {
  source: 'PERFORMANCE_DECLINE' | 'PATTERN_CHANGE' | 'MARKET_REGIME_SHIFT' | 'BEHAVIORAL_PATTERN' | 'ANOMALY_DETECTION';
  threshold: number;
  timeframe: number;
  confidence: number;
}

export interface ParameterModification {
  parameter: string;
  oldValue: any;
  newValue: any;
  changeType: 'INCREASE' | 'DECREASE' | 'REPLACE' | 'TOGGLE';
  magnitude: number;
}

export interface StrategyParameters {
  confidenceThreshold: number;
  riskPerTrade: number;
  maxPositionSize: number;
  stopLossMultiplier: number;
  takeProfitRatio: number;
  volumeFilter: boolean;
  marketRegimeFilter: MarketRegime[];
  timeframeOptimization: { [timeframe: string]: number };
  indicatorWeights: { [indicator: string]: number };
}

export interface PerformanceSnapshot {
  timestamp: Date;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  avgReturn: number;
  marketRegime: MarketRegime;
  volatility: number;
}

export interface LearningMetrics {
  adaptationSuccessRate: number;
  predictionAccuracy: number;
  patternRecognitionScore: number;
  behavioralInsightUtilization: number;
  marketRegimeAdaptability: number;
  overallLearningScore: number;
  learningVelocity: number;
}

export interface RegimeOptimization {
  [regime in MarketRegime]: {
    parameters: Partial<StrategyParameters>;
    performance: PerformanceSnapshot;
    confidence: number;
    sampleSize: number;
  };
}

export interface ActionableInsight {
  id: string;
  type: InsightType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: InsightCategory;
  title: string;
  description: string;
  impact: number; // -100 to 100
  confidence: number; // 0 to 100
  urgency: number; // 0 to 100
  implementationComplexity: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  actionableSteps: ActionStep[];
  requiredData: string[];
  riskFactors: string[];
  successMetrics: string[];
  supportingEvidence: Evidence[];
  relatedPatterns: string[];
  marketContext: MarketContext;
  timeframe: string;
  expirationDate: Date;
  implementationStatus: 'pending' | 'in_progress' | 'completed' | 'rejected';
  actualOutcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InsightType = 
  | 'PERFORMANCE_OPTIMIZATION' | 'RISK_REDUCTION' | 'MARKET_OPPORTUNITY'
  | 'BEHAVIORAL_CORRECTION' | 'STRATEGY_ADAPTATION' | 'PATTERN_EXPLOITATION'
  | 'ANOMALY_RESPONSE' | 'REGIME_ADJUSTMENT';

export type InsightCategory = 
  | 'STRATEGY' | 'RISK_MANAGEMENT' | 'TIMING' | 'POSITION_SIZING'
  | 'MARKET_ANALYSIS' | 'BEHAVIORAL' | 'TECHNICAL' | 'FUNDAMENTAL';

export interface ActionStep {
  step: number;
  description: string;
  estimatedTime: number;
  dependencies: string[];
  validation: string;
}

export interface Evidence {
  type: 'STATISTICAL' | 'PATTERN' | 'HISTORICAL' | 'CORRELATION';
  description: string;
  strength: number;
  source: string;
  data: any;
}

export interface MarketContext {
  regime: MarketRegime;
  volatility: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  volume: 'LOW' | 'NORMAL' | 'HIGH';
  sentiment: number;
  keyLevels: number[];
}

export interface PerformanceImprovement {
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvementPercent: number;
  confidence: number;
  attribution: string[];
}

export interface LearningSession {
  id: string;
  startTime: Date;
  endTime: Date;
  tradesAnalyzed: number;
  patternsDetected: number;
  insightsGenerated: number;
  adaptationsMade: number;
  performanceImprovements: PerformanceImprovement[];
  keyFindings: string[];
  nextSteps: string[];
}

// Main Learning Integration Engine
export class LearningIntegrationEngine extends EventEmitter {
  private config: LearningConfig;
  private adaptiveStrategies: Map<string, AdaptiveStrategy> = new Map();
  private actionableInsights: ActionableInsight[] = [];
  private learningHistory: LearningSession[] = [];
  private performanceBaseline: Map<string, PerformanceSnapshot> = new Map();
  private isLearning: boolean = false;
  private learningInterval: NodeJS.Timeout | null = null;
  private lastLearningSession: Date | null = null;

  constructor(config: Partial<LearningConfig> = {}) {
    super();
    this.config = this.mergeWithDefaults(config);
    console.log('🧠 Learning Integration Engine initialized');
  }

  private mergeWithDefaults(config: Partial<LearningConfig>): LearningConfig {
    return {
      adaptationRate: 0.1, // 10% adaptation rate
      confidenceDecayRate: 0.05, // 5% decay per day
      minSampleSize: 20,
      performanceWeightingFactor: 0.7, // 70% weight on recent performance
      patternValidationThreshold: 0.75,
      insightGenerationInterval: 3600000, // 1 hour
      maxStoredInsights: 100,
      learningRetentionDays: 90,
      ...config
    };
  }

  // Start the learning system
  public start(): void {
    if (this.isLearning) {
      console.log('⚠️ Learning Integration Engine is already running');
      return;
    }

    this.isLearning = true;
    console.log('🚀 Starting Learning Integration Engine...');

    // Start periodic learning sessions
    this.learningInterval = setInterval(() => {
      this.performLearningSession();
    }, this.config.insightGenerationInterval);

    this.emit('started', { timestamp: new Date() });
  }

  // Stop the learning system
  public stop(): void {
    if (!this.isLearning) {
      console.log('⚠️ Learning Integration Engine is not running');
      return;
    }

    this.isLearning = false;
    console.log('🛑 Stopping Learning Integration Engine...');

    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }

    this.emit('stopped', { timestamp: new Date() });
  }

  // Main learning session orchestrator
  public async performLearningSession(
    accountId?: string,
    timeframeDays: number = 7
  ): Promise<LearningSession> {
    console.log('🎓 Starting learning session...');

    const sessionId = `learning_${Date.now()}`;
    const startTime = new Date();

    try {
      // Step 1: Gather latest data
      const { trades, marketData } = await this.gatherLearningData(accountId, timeframeDays);
      
      // Step 2: Perform comprehensive analysis
      const tradeAnalysis = await tradeAnalysisEngine.performComprehensiveAnalysis(accountId, timeframeDays);
      const patternAnalysis = await this.analyzeMultipleSymbols(marketData, trades);

      // Step 3: Generate cross-correlated insights
      const insights = await this.generateActionableInsights(
        tradeAnalysis,
        patternAnalysis,
        trades
      );

      // Step 4: Adapt strategies based on learnings
      const adaptations = await this.adaptStrategies(tradeAnalysis, insights);

      // Step 5: Validate and implement improvements
      const improvements = await this.validateAndImplementImprovements(adaptations);

      // Step 6: Update learning metrics
      await this.updateLearningMetrics(tradeAnalysis, insights, adaptations);

      const endTime = new Date();
      const session: LearningSession = {
        id: sessionId,
        startTime,
        endTime,
        tradesAnalyzed: trades.length,
        patternsDetected: patternAnalysis.totalPatterns,
        insightsGenerated: insights.length,
        adaptationsMade: adaptations.length,
        performanceImprovements: improvements,
        keyFindings: await this.extractKeyFindings(tradeAnalysis, patternAnalysis, insights),
        nextSteps: await this.generateNextSteps(insights, adaptations)
      };

      this.learningHistory.push(session);
      this.lastLearningSession = endTime;

      console.log(`✅ Learning session completed: ${insights.length} insights, ${adaptations.length} adaptations`);
      this.emit('learningSessionCompleted', session);

      return session;

    } catch (error) {
      console.error('❌ Learning session failed:', error);
      throw error;
    }
  }

  // Gather data for learning
  private async gatherLearningData(
    accountId?: string,
    timeframeDays: number = 7
  ): Promise<{
    trades: Trade[];
    marketData: { [symbol: string]: CandlestickData[] };
  }> {
    // Fetch recent trades
    const trades = await this.fetchRecentTrades(accountId, timeframeDays);
    
    // Fetch market data for analyzed symbols
    const symbols = [...new Set(trades.map(t => t.symbol))];
    const marketData: { [symbol: string]: CandlestickData[] } = {};
    
    for (const symbol of symbols) {
      marketData[symbol] = await this.fetchMarketData(symbol, timeframeDays);
    }

    return { trades, marketData };
  }

  // Analyze patterns across multiple symbols
  private async analyzeMultipleSymbols(
    marketData: { [symbol: string]: CandlestickData[] },
    trades: Trade[]
  ): Promise<{
    totalPatterns: number;
    marketPatterns: MarketPattern[];
    behavioralPatterns: BehavioralPattern[];
    anomalies: AnomalyDetection[];
    correlations: any[];
  }> {
    let totalPatterns = 0;
    const allMarketPatterns: MarketPattern[] = [];
    const allBehavioralPatterns: BehavioralPattern[] = [];
    const allAnomalies: AnomalyDetection[] = [];
    const correlations: any[] = [];

    for (const [symbol, data] of Object.entries(marketData)) {
      const symbolTrades = trades.filter(t => t.symbol === symbol);
      const analysis = await patternRecognitionEngine.analyzePatterns(symbol, data, symbolTrades);
      
      totalPatterns += analysis.marketPatterns.length + analysis.behavioralPatterns.length;
      allMarketPatterns.push(...analysis.marketPatterns);
      allBehavioralPatterns.push(...analysis.behavioralPatterns);
      allAnomalies.push(...analysis.anomalies);
      correlations.push(analysis.correlations);
    }

    return {
      totalPatterns,
      marketPatterns: allMarketPatterns,
      behavioralPatterns: allBehavioralPatterns,
      anomalies: allAnomalies,
      correlations
    };
  }

  // Generate actionable insights by combining trade analysis and pattern recognition
  public async generateActionableInsights(
    tradeAnalysis: {
      statistics: TradeStatistics;
      riskMetrics: RiskAdjustedMetrics;
      insights: TradingInsight[];
    },
    patternAnalysis: {
      marketPatterns: MarketPattern[];
      behavioralPatterns: BehavioralPattern[];
      anomalies: AnomalyDetection[];
    },
    trades: Trade[]
  ): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // Performance optimization insights
    insights.push(...await this.generatePerformanceOptimizationInsights(tradeAnalysis, trades));

    // Pattern exploitation insights
    insights.push(...await this.generatePatternExploitationInsights(patternAnalysis.marketPatterns));

    // Behavioral correction insights
    insights.push(...await this.generateBehavioralCorrectionInsights(patternAnalysis.behavioralPatterns));

    // Risk management insights
    insights.push(...await this.generateRiskManagementInsights(tradeAnalysis, patternAnalysis.anomalies));

    // Market regime adaptation insights
    insights.push(...await this.generateRegimeAdaptationInsights(tradeAnalysis, patternAnalysis));

    // Cross-correlation insights
    insights.push(...await this.generateCrossCorrelationInsights(tradeAnalysis, patternAnalysis));

    // Filter and prioritize insights
    const filteredInsights = insights
      .filter(insight => insight.confidence >= 60 && insight.impact !== 0)
      .sort((a, b) => {
        // Sort by priority first, then by impact and confidence
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (Math.abs(b.impact) * b.confidence) - (Math.abs(a.impact) * a.confidence);
      })
      .slice(0, this.config.maxStoredInsights);

    // Update stored insights
    this.actionableInsights.push(...filteredInsights);
    this.cleanupOldInsights();

    console.log(`💡 Generated ${filteredInsights.length} actionable insights`);
    return filteredInsights;
  }

  // Generate performance optimization insights
  private async generatePerformanceOptimizationInsights(
    tradeAnalysis: { statistics: TradeStatistics; riskMetrics: RiskAdjustedMetrics; insights: TradingInsight[] },
    trades: Trade[]
  ): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // Win rate optimization
    if (tradeAnalysis.statistics.winRate < 0.55) {
      insights.push({
        id: `perf_opt_winrate_${Date.now()}`,
        type: 'PERFORMANCE_OPTIMIZATION',
        priority: 'high',
        category: 'STRATEGY',
        title: 'Win Rate Below Optimal Threshold',
        description: `Current win rate of ${(tradeAnalysis.statistics.winRate * 100).toFixed(1)}% suggests entry criteria need refinement`,
        impact: (0.55 - tradeAnalysis.statistics.winRate) * 100,
        confidence: 85,
        urgency: 70,
        implementationComplexity: 'medium',
        expectedOutcome: 'Improved win rate through better trade selection',
        actionableSteps: [
          {
            step: 1,
            description: 'Analyze losing trades for common patterns',
            estimatedTime: 60,
            dependencies: [],
            validation: 'Pattern analysis report generated'
          },
          {
            step: 2,
            description: 'Implement stricter entry criteria based on findings',
            estimatedTime: 120,
            dependencies: ['Step 1'],
            validation: 'Entry criteria updated and backtested'
          },
          {
            step: 3,
            description: 'Monitor win rate improvement over next 50 trades',
            estimatedTime: 1440,
            dependencies: ['Step 2'],
            validation: 'Win rate improvement measured'
          }
        ],
        requiredData: ['Trade history', 'Entry signals', 'Market conditions'],
        riskFactors: ['Reduced trading frequency', 'Missed opportunities'],
        successMetrics: ['Win rate increase to >55%', 'Maintained profit factor'],
        supportingEvidence: [
          {
            type: 'STATISTICAL',
            description: 'Win rate significantly below industry average',
            strength: 0.85,
            source: 'Trade Analysis Engine',
            data: tradeAnalysis.statistics
          }
        ],
        relatedPatterns: [],
        marketContext: await this.getCurrentMarketContext(),
        timeframe: '30 days',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        implementationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Sharpe ratio improvement
    if (tradeAnalysis.riskMetrics.sharpeRatio < 1.0) {
      insights.push({
        id: `perf_opt_sharpe_${Date.now()}`,
        type: 'PERFORMANCE_OPTIMIZATION',
        priority: 'medium',
        category: 'RISK_MANAGEMENT',
        title: 'Risk-Adjusted Returns Suboptimal',
        description: `Sharpe ratio of ${tradeAnalysis.riskMetrics.sharpeRatio.toFixed(2)} indicates risk-adjusted returns can be improved`,
        impact: (1.0 - tradeAnalysis.riskMetrics.sharpeRatio) * 50,
        confidence: 75,
        urgency: 60,
        implementationComplexity: 'medium',
        expectedOutcome: 'Better risk-adjusted returns through optimized position sizing',
        actionableSteps: [
          {
            step: 1,
            description: 'Implement volatility-adjusted position sizing',
            estimatedTime: 90,
            dependencies: [],
            validation: 'Position sizing algorithm implemented'
          },
          {
            step: 2,
            description: 'Optimize stop-loss levels based on volatility',
            estimatedTime: 60,
            dependencies: [],
            validation: 'Dynamic stop-loss system active'
          }
        ],
        requiredData: ['Volatility data', 'Position sizes', 'Risk metrics'],
        riskFactors: ['Smaller position sizes', 'Increased complexity'],
        successMetrics: ['Sharpe ratio >1.0', 'Reduced volatility'],
        supportingEvidence: [
          {
            type: 'STATISTICAL',
            description: 'Risk-adjusted returns below benchmark',
            strength: 0.75,
            source: 'Risk Analysis',
            data: tradeAnalysis.riskMetrics
          }
        ],
        relatedPatterns: [],
        marketContext: await this.getCurrentMarketContext(),
        timeframe: '60 days',
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        implementationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return insights;
  }

  // Generate pattern exploitation insights
  private async generatePatternExploitationInsights(patterns: MarketPattern[]): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // High-confidence patterns
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8 && p.historicalSuccessRate > 0.7);
    
    for (const pattern of highConfidencePatterns) {
      insights.push({
        id: `pattern_exploit_${pattern.id}`,
        type: 'PATTERN_EXPLOITATION',
        priority: pattern.expectedOutcome !== 'NEUTRAL' ? 'high' : 'medium',
        category: 'TECHNICAL',
        title: `High-Probability ${pattern.type} Pattern`,
        description: `${pattern.type} pattern with ${(pattern.confidence * 100).toFixed(1)}% confidence suggests ${pattern.expectedOutcome} movement`,
        impact: pattern.riskReward * 25,
        confidence: pattern.confidence * 100,
        urgency: this.calculatePatternUrgency(pattern),
        implementationComplexity: 'low',
        expectedOutcome: `${pattern.expectedOutcome} price movement to ${pattern.targetPrice?.toFixed(2)}`,
        actionableSteps: [
          {
            step: 1,
            description: `Monitor ${pattern.symbol} for pattern confirmation`,
            estimatedTime: 30,
            dependencies: [],
            validation: 'Pattern confirmation signals active'
          },
          {
            step: 2,
            description: `Prepare ${pattern.expectedOutcome.toLowerCase()} position with appropriate sizing`,
            estimatedTime: 15,
            dependencies: ['Step 1'],
            validation: 'Position parameters calculated'
          },
          {
            step: 3,
            description: 'Execute trade upon pattern breakout',
            estimatedTime: 5,
            dependencies: ['Step 2'],
            validation: 'Trade executed'
          }
        ],
        requiredData: ['Live price data', 'Volume confirmation', 'Technical indicators'],
        riskFactors: ['Pattern failure', 'False breakout', 'Market disruption'],
        successMetrics: ['Pattern completion', 'Target achievement', 'Risk/reward ratio'],
        supportingEvidence: [
          {
            type: 'PATTERN',
            description: `${pattern.type} pattern with strong historical performance`,
            strength: pattern.confidence,
            source: 'Pattern Recognition Engine',
            data: pattern
          }
        ],
        relatedPatterns: [pattern.id],
        marketContext: {
          regime: pattern.metadata.marketRegime,
          volatility: pattern.metadata.volatility,
          trend: pattern.expectedOutcome === 'BULLISH' ? 'UP' : pattern.expectedOutcome === 'BEARISH' ? 'DOWN' : 'SIDEWAYS',
          volume: pattern.volumeProfile.volumeSignificance === 'HIGH' ? 'HIGH' : 'NORMAL',
          sentiment: 50,
          keyLevels: pattern.pricePoints.map(p => p.price)
        },
        timeframe: `${pattern.projectedDuration} hours`,
        expirationDate: new Date(Date.now() + (pattern.projectedDuration || 24) * 60 * 60 * 1000),
        implementationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return insights;
  }

  // Generate behavioral correction insights
  private async generateBehavioralCorrectionInsights(behavioralPatterns: BehavioralPattern[]): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    for (const pattern of behavioralPatterns) {
      if (pattern.frequency > 0.3 && pattern.profitability < 0) {
        insights.push({
          id: `behavioral_correction_${pattern.id}`,
          type: 'BEHAVIORAL_CORRECTION',
          priority: pattern.profitability < -0.05 ? 'high' : 'medium',
          category: 'BEHAVIORAL',
          title: `${pattern.type.replace('_', ' ')} Pattern Detected`,
          description: pattern.description,
          impact: Math.abs(pattern.profitability) * 100,
          confidence: pattern.consistency * 100,
          urgency: pattern.frequency * 100,
          implementationComplexity: 'medium',
          expectedOutcome: 'Reduced behavioral bias and improved performance',
          actionableSteps: pattern.adaptationSuggestions.map((suggestion, index) => ({
            step: index + 1,
            description: suggestion,
            estimatedTime: 60,
            dependencies: index > 0 ? [`Step ${index}`] : [],
            validation: 'Implementation verified'
          })),
          requiredData: ['Trading history', 'Execution logs', 'Performance metrics'],
          riskFactors: ['Behavioral change resistance', 'Overcompensation'],
          successMetrics: ['Reduced pattern frequency', 'Improved profitability'],
          supportingEvidence: [
            {
              type: 'STATISTICAL',
              description: 'Significant behavioral pattern with negative impact',
              strength: pattern.consistency,
              source: 'Behavioral Analysis',
              data: pattern
            }
          ],
          relatedPatterns: [pattern.id],
          marketContext: await this.getCurrentMarketContext(),
          timeframe: '90 days',
          expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          implementationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return insights;
  }

  // Generate risk management insights
  private async generateRiskManagementInsights(
    tradeAnalysis: { riskMetrics: RiskAdjustedMetrics },
    anomalies: AnomalyDetection[]
  ): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // Drawdown insights
    if (tradeAnalysis.riskMetrics.maxDrawdown > 0.15) {
      insights.push({
        id: `risk_mgmt_drawdown_${Date.now()}`,
        type: 'RISK_REDUCTION',
        priority: 'critical',
        category: 'RISK_MANAGEMENT',
        title: 'Excessive Drawdown Risk',
        description: `Maximum drawdown of ${(tradeAnalysis.riskMetrics.maxDrawdown * 100).toFixed(1)}% exceeds risk tolerance`,
        impact: -tradeAnalysis.riskMetrics.maxDrawdown * 100,
        confidence: 95,
        urgency: 90,
        implementationComplexity: 'high',
        expectedOutcome: 'Reduced drawdown through improved risk management',
        actionableSteps: [
          {
            step: 1,
            description: 'Implement dynamic position sizing based on portfolio heat',
            estimatedTime: 180,
            dependencies: [],
            validation: 'Position sizing algorithm active'
          },
          {
            step: 2,
            description: 'Add portfolio-level stop loss at 10% drawdown',
            estimatedTime: 60,
            dependencies: [],
            validation: 'Portfolio stop loss implemented'
          },
          {
            step: 3,
            description: 'Implement correlation-based position limits',
            estimatedTime: 120,
            dependencies: ['Step 1'],
            validation: 'Correlation monitoring active'
          }
        ],
        requiredData: ['Portfolio value', 'Position correlations', 'Risk metrics'],
        riskFactors: ['Reduced position sizes', 'Missed opportunities'],
        successMetrics: ['Max drawdown <10%', 'Improved Calmar ratio'],
        supportingEvidence: [
          {
            type: 'STATISTICAL',
            description: 'Drawdown exceeds industry best practices',
            strength: 0.95,
            source: 'Risk Analysis',
            data: tradeAnalysis.riskMetrics
          }
        ],
        relatedPatterns: [],
        marketContext: await this.getCurrentMarketContext(),
        timeframe: '30 days',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        implementationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Anomaly response insights
    const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
    for (const anomaly of criticalAnomalies) {
      insights.push({
        id: `anomaly_response_${anomaly.id}`,
        type: 'ANOMALY_RESPONSE',
        priority: anomaly.severity === 'CRITICAL' ? 'critical' : 'high',
        category: 'RISK_MANAGEMENT',
        title: `${anomaly.type.replace('_', ' ')} Anomaly Detected`,
        description: anomaly.description,
        impact: -anomaly.expectedImpact * 0.5,
        confidence: anomaly.probability * 100,
        urgency: 95,
        implementationComplexity: 'low',
        expectedOutcome: 'Mitigated risk from market anomaly',
        actionableSteps: anomaly.recommendations.map((rec, index) => ({
          step: index + 1,
          description: rec,
          estimatedTime: 30,
          dependencies: [],
          validation: 'Action implemented'
        })),
        requiredData: ['Market data', 'Position exposure', 'Volatility metrics'],
        riskFactors: ['Market disruption', 'Liquidity issues'],
        successMetrics: ['Reduced exposure', 'Protected capital'],
        supportingEvidence: [
          {
            type: 'STATISTICAL',
            description: 'High-probability market anomaly detected',
            strength: anomaly.probability,
            source: 'Anomaly Detection',
            data: anomaly
          }
        ],
        relatedPatterns: [],
        marketContext: await this.getCurrentMarketContext(),
        timeframe: `${anomaly.duration} hours`,
        expirationDate: new Date(Date.now() + anomaly.duration * 60 * 60 * 1000),
        implementationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return insights;
  }

  // Generate regime adaptation insights
  private async generateRegimeAdaptationInsights(
    tradeAnalysis: any,
    patternAnalysis: any
  ): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // This would analyze if current strategies are optimized for the current market regime
    // and suggest adaptations based on regime changes

    return insights;
  }

  // Generate cross-correlation insights
  private async generateCrossCorrelationInsights(
    tradeAnalysis: any,
    patternAnalysis: any
  ): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // This would find correlations between trade performance and detected patterns
    // to identify the most profitable pattern types and timing

    return insights;
  }

  // Adapt strategies based on learnings
  private async adaptStrategies(
    tradeAnalysis: any,
    insights: ActionableInsight[]
  ): Promise<StrategyAdaptation[]> {
    const adaptations: StrategyAdaptation[] = [];

    // Process high-priority insights for immediate adaptations
    const highPriorityInsights = insights.filter(i => i.priority === 'high' || i.priority === 'critical');

    for (const insight of highPriorityInsights) {
      if (insight.implementationComplexity === 'low' && insight.confidence > 80) {
        const adaptation = await this.createStrategyAdaptation(insight);
        if (adaptation) {
          adaptations.push(adaptation);
        }
      }
    }

    return adaptations;
  }

  // Create strategy adaptation from insight
  private async createStrategyAdaptation(insight: ActionableInsight): Promise<StrategyAdaptation | null> {
    try {
      // This would create specific parameter modifications based on the insight
      const adaptation: StrategyAdaptation = {
        id: `adaptation_${Date.now()}`,
        type: this.mapInsightToAdaptationType(insight.type),
        trigger: {
          source: this.mapInsightToTriggerSource(insight.type),
          threshold: insight.confidence / 100,
          timeframe: this.parseTimeframe(insight.timeframe),
          confidence: insight.confidence / 100
        },
        modification: {
          parameter: this.determineParameterToModify(insight),
          oldValue: null, // Would be fetched from current strategy
          newValue: null, // Would be calculated based on insight
          changeType: 'INCREASE', // Would be determined based on insight
          magnitude: Math.abs(insight.impact) / 100
        },
        implementedAt: new Date(),
        expectedImpact: insight.impact,
        success: false, // Will be determined later
        reasoning: [insight.description, ...insight.actionableSteps.map(s => s.description)]
      };

      return adaptation;
    } catch (error) {
      console.error('❌ Failed to create strategy adaptation:', error);
      return null;
    }
  }

  // Validate and implement improvements
  private async validateAndImplementImprovements(
    adaptations: StrategyAdaptation[]
  ): Promise<PerformanceImprovement[]> {
    const improvements: PerformanceImprovement[] = [];

    // This would implement the adaptations and measure their impact
    // For now, returning empty array as implementation would require
    // integration with the actual trading system

    return improvements;
  }

  // Update learning metrics
  private async updateLearningMetrics(
    tradeAnalysis: any,
    insights: ActionableInsight[],
    adaptations: StrategyAdaptation[]
  ): Promise<void> {
    // Update metrics for each adaptive strategy
    for (const [strategyId, strategy] of this.adaptiveStrategies) {
      strategy.learningMetrics.adaptationSuccessRate = this.calculateAdaptationSuccessRate(strategy);
      strategy.learningMetrics.predictionAccuracy = this.calculatePredictionAccuracy(strategy);
      strategy.learningMetrics.patternRecognitionScore = this.calculatePatternRecognitionScore(strategy);
      strategy.learningMetrics.overallLearningScore = this.calculateOverallLearningScore(strategy.learningMetrics);
      strategy.lastUpdated = new Date();
    }
  }

  // Helper methods
  private async fetchRecentTrades(accountId?: string, days: number = 7): Promise<Trade[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('trading_orders')
        .select('*')
        .eq('status', 'filled')
        .gte('filled_at', startDate.toISOString())
        .order('filled_at', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        symbol: record.symbol,
        side: record.side.toUpperCase() as 'BUY' | 'SELL',
        type: record.order_type.toUpperCase() as 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT',
        quantity: parseFloat(record.quantity),
        price: parseFloat(record.price || '0'),
        executedPrice: parseFloat(record.price || '0'),
        executedQuantity: parseFloat(record.quantity),
        status: 'FILLED',
        timeInForce: 'GTC',
        createdAt: new Date(record.created_at),
        executedAt: record.filled_at ? new Date(record.filled_at) : new Date(record.created_at),
        commission: 0,
        commissionAsset: 'USDT',
        strategy: record.strategy_used,
        reason: record.ai_reasoning,
        confidence: parseFloat(record.confidence_score || '0') * 100
      }));
    } catch (error) {
      console.error('❌ Failed to fetch recent trades:', error);
      return [];
    }
  }

  private async fetchMarketData(symbol: string, days: number): Promise<CandlestickData[]> {
    // Mock implementation - would fetch from exchange API
    const data: CandlestickData[] = [];
    const basePrice = 50000;
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    for (let i = 0; i < days * 24; i++) {
      const openTime = startTime + (i * 60 * 60 * 1000);
      const price = basePrice + (Math.random() - 0.5) * 1000;
      
      data.push({
        openTime,
        open: price,
        high: price * (1 + Math.random() * 0.02),
        low: price * (1 - Math.random() * 0.02),
        close: price + (Math.random() - 0.5) * 100,
        volume: 1000 + Math.random() * 500,
        closeTime: openTime + 3600000,
        quoteAssetVolume: 0,
        numberOfTrades: 100,
        takerBuyBaseAssetVolume: 0,
        takerBuyQuoteAssetVolume: 0
      });
    }

    return data;
  }

  private async getCurrentMarketContext(): Promise<MarketContext> {
    return {
      regime: 'RANGE',
      volatility: 0.3,
      trend: 'SIDEWAYS',
      volume: 'NORMAL',
      sentiment: 50,
      keyLevels: [50000, 45000, 55000]
    };
  }

  private calculatePatternUrgency(pattern: MarketPattern): number {
    const timeUntilExpiration = (pattern.projectedDuration || 24) * 60 * 60 * 1000;
    const urgencyFromTime = Math.max(0, 100 - (timeUntilExpiration / (24 * 60 * 60 * 1000)) * 100);
    const urgencyFromConfidence = pattern.confidence * 100;
    return (urgencyFromTime + urgencyFromConfidence) / 2;
  }

  private mapInsightToAdaptationType(insightType: InsightType): AdaptationType {
    const mapping: { [key in InsightType]: AdaptationType } = {
      'PERFORMANCE_OPTIMIZATION': 'PARAMETER_ADJUSTMENT',
      'RISK_REDUCTION': 'RISK_MODIFICATION',
      'MARKET_OPPORTUNITY': 'ENTRY_CRITERIA',
      'BEHAVIORAL_CORRECTION': 'PARAMETER_ADJUSTMENT',
      'STRATEGY_ADAPTATION': 'PARAMETER_ADJUSTMENT',
      'PATTERN_EXPLOITATION': 'ENTRY_CRITERIA',
      'ANOMALY_RESPONSE': 'RISK_MODIFICATION',
      'REGIME_ADJUSTMENT': 'PARAMETER_ADJUSTMENT'
    };
    return mapping[insightType];
  }

  private mapInsightToTriggerSource(insightType: InsightType): AdaptationTrigger['source'] {
    const mapping: { [key in InsightType]: AdaptationTrigger['source'] } = {
      'PERFORMANCE_OPTIMIZATION': 'PERFORMANCE_DECLINE',
      'RISK_REDUCTION': 'PERFORMANCE_DECLINE',
      'MARKET_OPPORTUNITY': 'PATTERN_CHANGE',
      'BEHAVIORAL_CORRECTION': 'BEHAVIORAL_PATTERN',
      'STRATEGY_ADAPTATION': 'MARKET_REGIME_SHIFT',
      'PATTERN_EXPLOITATION': 'PATTERN_CHANGE',
      'ANOMALY_RESPONSE': 'ANOMALY_DETECTION',
      'REGIME_ADJUSTMENT': 'MARKET_REGIME_SHIFT'
    };
    return mapping[insightType];
  }

  private parseTimeframe(timeframe: string): number {
    // Convert timeframe string to hours
    const match = timeframe.match(/(\d+)\s*(hour|day|week)s?/);
    if (!match) return 24;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'hour': return value;
      case 'day': return value * 24;
      case 'week': return value * 24 * 7;
      default: return 24;
    }
  }

  private determineParameterToModify(insight: ActionableInsight): string {
    // Determine which parameter to modify based on insight category
    const categoryMapping: { [key in InsightCategory]: string } = {
      'STRATEGY': 'confidenceThreshold',
      'RISK_MANAGEMENT': 'riskPerTrade',
      'TIMING': 'timeframeOptimization',
      'POSITION_SIZING': 'maxPositionSize',
      'MARKET_ANALYSIS': 'marketRegimeFilter',
      'BEHAVIORAL': 'confidenceThreshold',
      'TECHNICAL': 'indicatorWeights',
      'FUNDAMENTAL': 'marketRegimeFilter'
    };
    return categoryMapping[insight.category];
  }

  private calculateAdaptationSuccessRate(strategy: AdaptiveStrategy): number {
    const successfulAdaptations = strategy.adaptations.filter(a => a.success).length;
    return strategy.adaptations.length > 0 ? successfulAdaptations / strategy.adaptations.length : 0;
  }

  private calculatePredictionAccuracy(strategy: AdaptiveStrategy): number {
    // Mock calculation - would analyze actual vs predicted outcomes
    return 0.7 + Math.random() * 0.2;
  }

  private calculatePatternRecognitionScore(strategy: AdaptiveStrategy): number {
    // Mock calculation - would analyze pattern recognition effectiveness
    return 0.6 + Math.random() * 0.3;
  }

  private calculateOverallLearningScore(metrics: LearningMetrics): number {
    return (
      metrics.adaptationSuccessRate * 0.3 +
      metrics.predictionAccuracy * 0.25 +
      metrics.patternRecognitionScore * 0.25 +
      metrics.marketRegimeAdaptability * 0.2
    );
  }

  private async extractKeyFindings(tradeAnalysis: any, patternAnalysis: any, insights: ActionableInsight[]): Promise<string[]> {
    const findings: string[] = [];

    if (insights.length > 0) {
      findings.push(`Generated ${insights.length} actionable insights`);
    }

    const highPriorityInsights = insights.filter(i => i.priority === 'high' || i.priority === 'critical');
    if (highPriorityInsights.length > 0) {
      findings.push(`${highPriorityInsights.length} high-priority issues identified`);
    }

    if (patternAnalysis.totalPatterns > 0) {
      findings.push(`Detected ${patternAnalysis.totalPatterns} market patterns`);
    }

    return findings;
  }

  private async generateNextSteps(insights: ActionableInsight[], adaptations: StrategyAdaptation[]): Promise<string[]> {
    const steps: string[] = [];

    const pendingInsights = insights.filter(i => i.implementationStatus === 'pending');
    if (pendingInsights.length > 0) {
      steps.push(`Implement ${pendingInsights.length} pending insights`);
    }

    if (adaptations.length > 0) {
      steps.push(`Monitor ${adaptations.length} strategy adaptations`);
    }

    steps.push('Continue performance monitoring');
    steps.push('Validate adaptation effectiveness');

    return steps;
  }

  private cleanupOldInsights(): void {
    const cutoffDate = new Date(Date.now() - this.config.learningRetentionDays * 24 * 60 * 60 * 1000);
    this.actionableInsights = this.actionableInsights.filter(
      insight => insight.createdAt > cutoffDate || insight.implementationStatus === 'in_progress'
    );
  }

  // Public access methods
  public getActionableInsights(): ActionableInsight[] {
    return [...this.actionableInsights];
  }

  public getPendingInsights(): ActionableInsight[] {
    return this.actionableInsights.filter(i => i.implementationStatus === 'pending');
  }

  public getAdaptiveStrategies(): AdaptiveStrategy[] {
    return Array.from(this.adaptiveStrategies.values());
  }

  public getLearningHistory(): LearningSession[] {
    return [...this.learningHistory];
  }

  public getLastLearningSession(): Date | null {
    return this.lastLearningSession;
  }

  public getConfiguration(): LearningConfig {
    return { ...this.config };
  }

  public updateConfiguration(newConfig: Partial<LearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Learning Integration Engine configuration updated');
  }

  public isCurrentlyLearning(): boolean {
    return this.isLearning;
  }
}

// Export singleton instance
export const learningIntegrationEngine = new LearningIntegrationEngine();