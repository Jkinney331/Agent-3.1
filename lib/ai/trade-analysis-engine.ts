import { EventEmitter } from 'events';
import { supabase } from '../database/supabase-client';
import { 
  Trade, 
  Position, 
  StrategyPerformance, 
  MarketRegime,
  PerformanceReport 
} from '../../types/trading';

// Trade Analysis Interfaces
export interface TradeAnalysisConfig {
  minTradesForSignificance: number;
  confidenceLevel: number; // 0.95 for 95% confidence
  performanceWindowDays: number;
  sharpeRiskFreeRate: number;
  maxDrawdownThreshold: number;
  winRateThreshold: number;
  profitFactorThreshold: number;
}

export interface TradeStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  winRateConfidenceInterval: [number, number];
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  expectancyPerTrade: number;
  statisticalSignificance: boolean;
  confidenceLevel: number;
}

export interface RiskAdjustedMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  valueAtRisk95: number;
  conditionalValueAtRisk: number;
  ulcerIndex: number;
  recoveryFactor: number;
  sterlingRatio: number;
}

export interface TimeBasedAnalysis {
  bestTradingHours: number[];
  bestTradingDays: string[];
  seasonalityPattern: { [month: string]: number };
  holdingTimeAnalysis: {
    averageHoldingTime: number;
    optimalHoldingTime: number;
    holdingTimeVsReturn: Array<{ duration: number; averageReturn: number }>;
  };
  marketRegimePerformance: {
    [regime in MarketRegime]: {
      trades: number;
      winRate: number;
      averageReturn: number;
      volatility: number;
    };
  };
}

export interface StrategyEffectiveness {
  strategyName: string;
  totalTrades: number;
  performance: TradeStatistics;
  riskMetrics: RiskAdjustedMetrics;
  timeAnalysis: TimeBasedAnalysis;
  correlationWithMarket: number;
  adaptabilityScore: number;
  consistencyScore: number;
  robustnessScore: number;
  overallScore: number;
  recommendations: string[];
}

export interface TradingInsight {
  type: 'performance' | 'risk' | 'timing' | 'strategy' | 'market';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number; // -100 to 100
  confidence: number; // 0 to 100
  actionable: boolean;
  recommendations: string[];
  supportingData: any;
  timestamp: Date;
}

export interface PerformanceComparison {
  period: string;
  ourPerformance: number;
  benchmarkPerformance: number;
  outperformance: number;
  volatility: number;
  benchmarkVolatility: number;
  informationRatio: number;
  trackingError: number;
}

// Main Trade Analysis Engine Class
export class TradeAnalysisEngine extends EventEmitter {
  private config: TradeAnalysisConfig;
  private isAnalyzing: boolean = false;
  private lastAnalysisTimestamp: Date | null = null;
  private cachedAnalysis: Map<string, any> = new Map();
  private performanceHistory: PerformanceComparison[] = [];

  constructor(config: Partial<TradeAnalysisConfig> = {}) {
    super();
    this.config = this.mergeWithDefaults(config);
    console.log('📊 Trade Analysis Engine initialized');
  }

  private mergeWithDefaults(config: Partial<TradeAnalysisConfig>): TradeAnalysisConfig {
    return {
      minTradesForSignificance: 30,
      confidenceLevel: 0.95,
      performanceWindowDays: 30,
      sharpeRiskFreeRate: 0.02, // 2% risk-free rate
      maxDrawdownThreshold: 0.15, // 15% max drawdown threshold
      winRateThreshold: 0.55, // 55% win rate threshold
      profitFactorThreshold: 1.25, // 1.25 profit factor threshold
      ...config
    };
  }

  // Main analysis method
  public async performComprehensiveAnalysis(
    accountId?: string,
    timeframeDays: number = 30
  ): Promise<{
    statistics: TradeStatistics;
    riskMetrics: RiskAdjustedMetrics;
    timeAnalysis: TimeBasedAnalysis;
    strategies: StrategyEffectiveness[];
    insights: TradingInsight[];
    performanceReport: PerformanceReport;
  }> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;
    console.log('🔍 Starting comprehensive trade analysis...');

    try {
      // Fetch trade data
      const trades = await this.fetchTradeData(accountId, timeframeDays);
      const positions = await this.fetchPositionData(accountId, timeframeDays);

      console.log(`📊 Analyzing ${trades.length} trades and ${positions.length} positions`);

      // Core statistical analysis
      const statistics = await this.calculateTradeStatistics(trades);
      
      // Risk-adjusted metrics
      const riskMetrics = await this.calculateRiskAdjustedMetrics(trades, positions);
      
      // Time-based analysis
      const timeAnalysis = await this.performTimeBasedAnalysis(trades);
      
      // Strategy effectiveness analysis
      const strategies = await this.analyzeStrategyEffectiveness(trades);
      
      // Generate insights
      const insights = await this.generateTradingInsights(statistics, riskMetrics, timeAnalysis, strategies);
      
      // Create performance report
      const performanceReport = await this.generatePerformanceReport(
        trades, 
        statistics, 
        riskMetrics, 
        timeframeDays
      );

      this.lastAnalysisTimestamp = new Date();
      
      // Cache results
      this.cachedAnalysis.set('latest', {
        statistics,
        riskMetrics,
        timeAnalysis,
        strategies,
        insights,
        performanceReport,
        timestamp: this.lastAnalysisTimestamp
      });

      console.log('✅ Comprehensive trade analysis completed');
      this.emit('analysisCompleted', { statistics, riskMetrics, insights });

      return {
        statistics,
        riskMetrics,
        timeAnalysis,
        strategies,
        insights,
        performanceReport
      };

    } catch (error) {
      console.error('❌ Trade analysis failed:', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Fetch trade data from database
  private async fetchTradeData(accountId?: string, days: number = 30): Promise<Trade[]> {
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

      if (error) {
        throw new Error(`Failed to fetch trade data: ${error.message}`);
      }

      // Transform database records to Trade interface
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
        commission: 0, // Would need to be calculated or stored
        commissionAsset: 'USDT',
        strategy: record.strategy_used,
        reason: record.ai_reasoning,
        confidence: parseFloat(record.confidence_score || '0') * 100
      }));

    } catch (error) {
      console.error('❌ Failed to fetch trade data:', error);
      return [];
    }
  }

  // Fetch position data from database
  private async fetchPositionData(accountId?: string, days: number = 30): Promise<Position[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('trading_positions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch position data: ${error.message}`);
      }

      // Transform database records to Position interface
      return (data || []).map(record => ({
        id: record.id,
        symbol: record.symbol,
        side: record.side.toUpperCase() as 'LONG' | 'SHORT',
        size: parseFloat(record.quantity),
        entryPrice: parseFloat(record.entry_price),
        currentPrice: parseFloat(record.current_price),
        markPrice: parseFloat(record.current_price),
        unrealizedPnL: parseFloat(record.unrealized_pnl),
        unrealizedPnLPercentage: (parseFloat(record.unrealized_pnl) / parseFloat(record.market_value)) * 100,
        leverage: 1, // Would need to be stored if using leverage
        margin: parseFloat(record.market_value),
        liquidationPrice: 0, // Would need to be calculated
        createdAt: new Date(record.created_at),
        strategy: record.strategy_used
      }));

    } catch (error) {
      console.error('❌ Failed to fetch position data:', error);
      return [];
    }
  }

  // Calculate comprehensive trade statistics
  private async calculateTradeStatistics(trades: Trade[]): Promise<TradeStatistics> {
    if (trades.length === 0) {
      return this.getEmptyStatistics();
    }

    // Group trades by symbol and calculate PnL
    const tradePairs = this.groupTradesIntoPairs(trades);
    const pnlValues = tradePairs.map(pair => pair.pnl).filter(pnl => pnl !== 0);
    
    const winningTrades = pnlValues.filter(pnl => pnl > 0);
    const losingTrades = pnlValues.filter(pnl => pnl < 0);
    
    const winRate = pnlValues.length > 0 ? winningTrades.length / pnlValues.length : 0;
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, pnl) => sum + pnl, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0) / losingTrades.length) : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades)) : 0;
    
    const profitFactor = averageLoss > 0 ? (averageWin * winningTrades.length) / (averageLoss * losingTrades.length) : 0;
    const expectancy = (winRate * averageWin) - ((1 - winRate) * averageLoss);
    
    // Calculate confidence interval for win rate
    const winRateConfidenceInterval = this.calculateWinRateConfidenceInterval(
      winningTrades.length,
      pnlValues.length,
      this.config.confidenceLevel
    );

    // Statistical significance test
    const statisticalSignificance = this.assessStatisticalSignificance(pnlValues, winRate);

    return {
      totalTrades: pnlValues.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      winRateConfidenceInterval,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
      expectancyPerTrade: expectancy,
      statisticalSignificance,
      confidenceLevel: this.config.confidenceLevel
    };
  }

  // Calculate risk-adjusted performance metrics
  private async calculateRiskAdjustedMetrics(trades: Trade[], positions: Position[]): Promise<RiskAdjustedMetrics> {
    const tradePairs = this.groupTradesIntoPairs(trades);
    const returns = tradePairs.map(pair => pair.pnl / (pair.entryValue || 1));
    
    if (returns.length === 0) {
      return this.getEmptyRiskMetrics();
    }

    // Calculate Sharpe ratio
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnStdDev = this.calculateStandardDeviation(returns);
    const annualizedReturn = avgReturn * 252; // Assuming daily returns
    const annualizedVolatility = returnStdDev * Math.sqrt(252);
    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - this.config.sharpeRiskFreeRate) / annualizedVolatility : 0;

    // Calculate Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(ret => ret < avgReturn);
    const downsideDeviation = downsideReturns.length > 0 ? this.calculateStandardDeviation(downsideReturns) : 0;
    const sortinoRatio = downsideDeviation > 0 ? (annualizedReturn - this.config.sharpeRiskFreeRate) / (downsideDeviation * Math.sqrt(252)) : 0;

    // Calculate drawdown metrics
    const drawdownMetrics = this.calculateDrawdownMetrics(returns);
    
    // Calculate Value at Risk (95%)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk95 = sortedReturns.length > 0 ? Math.abs(sortedReturns[var95Index] || 0) : 0;
    
    // Calculate Conditional VaR (expected shortfall)
    const conditionalValueAtRisk = var95Index > 0 ? 
      Math.abs(sortedReturns.slice(0, var95Index).reduce((sum, ret) => sum + ret, 0) / var95Index) : 0;

    // Calculate Ulcer Index
    const ulcerIndex = this.calculateUlcerIndex(returns);

    // Calculate recovery factor
    const totalReturn = returns.reduce((sum, ret) => sum + ret, 0);
    const recoveryFactor = drawdownMetrics.maxDrawdown > 0 ? totalReturn / drawdownMetrics.maxDrawdown : 0;

    // Calculate Calmar ratio
    const calmarRatio = drawdownMetrics.maxDrawdown > 0 ? annualizedReturn / drawdownMetrics.maxDrawdown : 0;

    // Calculate Sterling ratio
    const avgDrawdown = drawdownMetrics.maxDrawdown; // Simplified
    const sterlingRatio = avgDrawdown > 0 ? annualizedReturn / avgDrawdown : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown: drawdownMetrics.maxDrawdown,
      maxDrawdownDuration: drawdownMetrics.maxDrawdownDuration,
      valueAtRisk95,
      conditionalValueAtRisk,
      ulcerIndex,
      recoveryFactor,
      sterlingRatio
    };
  }

  // Perform time-based analysis
  private async performTimeBasedAnalysis(trades: Trade[]): Promise<TimeBasedAnalysis> {
    const tradePairs = this.groupTradesIntoPairs(trades);
    
    // Analyze trading hours
    const hourlyPerformance = new Array(24).fill(0).map((_, hour) => ({ hour, trades: 0, totalPnL: 0 }));
    
    // Analyze daily performance
    const dailyPerformance: { [day: string]: { trades: number; totalPnL: number } } = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Analyze monthly performance
    const monthlyPerformance: { [month: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize structures
    days.forEach(day => dailyPerformance[day] = { trades: 0, totalPnL: 0 });
    months.forEach(month => monthlyPerformance[month] = 0);

    // Analyze holding times
    const holdingTimes: number[] = [];
    
    // Market regime performance
    const regimePerformance: TimeBasedAnalysis['marketRegimePerformance'] = {
      BULL: { trades: 0, winRate: 0, averageReturn: 0, volatility: 0 },
      BEAR: { trades: 0, winRate: 0, averageReturn: 0, volatility: 0 },
      RANGE: { trades: 0, winRate: 0, averageReturn: 0, volatility: 0 },
      VOLATILE: { trades: 0, winRate: 0, averageReturn: 0, volatility: 0 }
    };

    tradePairs.forEach(pair => {
      if (pair.exitTime) {
        // Hour analysis
        const hour = pair.exitTime.getHours();
        hourlyPerformance[hour].trades++;
        hourlyPerformance[hour].totalPnL += pair.pnl;

        // Day analysis
        const dayName = days[pair.exitTime.getDay()];
        dailyPerformance[dayName].trades++;
        dailyPerformance[dayName].totalPnL += pair.pnl;

        // Month analysis
        const monthName = months[pair.exitTime.getMonth()];
        monthlyPerformance[monthName] += pair.pnl;

        // Holding time analysis
        const holdingTime = pair.exitTime.getTime() - pair.entryTime.getTime();
        holdingTimes.push(holdingTime);

        // Market regime analysis (simplified - would need actual regime data)
        const estimatedRegime = this.estimateMarketRegime(pair);
        regimePerformance[estimatedRegime].trades++;
        regimePerformance[estimatedRegime].averageReturn += pair.pnl;
      }
    });

    // Calculate final metrics
    const bestTradingHours = hourlyPerformance
      .filter(h => h.trades > 0)
      .sort((a, b) => (b.totalPnL / b.trades) - (a.totalPnL / a.trades))
      .slice(0, 5)
      .map(h => h.hour);

    const bestTradingDays = Object.entries(dailyPerformance)
      .filter(([_, data]) => data.trades > 0)
      .sort(([_, a], [__, b]) => (b.totalPnL / b.trades) - (a.totalPnL / a.trades))
      .slice(0, 3)
      .map(([day, _]) => day);

    // Calculate optimal holding time
    const avgHoldingTime = holdingTimes.length > 0 ? holdingTimes.reduce((sum, time) => sum + time, 0) / holdingTimes.length : 0;
    
    // Holding time vs return analysis
    const holdingTimeVsReturn = this.analyzeHoldingTimeVsReturn(tradePairs);

    // Finalize regime performance
    Object.keys(regimePerformance).forEach(regime => {
      const data = regimePerformance[regime as MarketRegime];
      if (data.trades > 0) {
        data.averageReturn = data.averageReturn / data.trades;
        data.winRate = tradePairs.filter(p => this.estimateMarketRegime(p) === regime && p.pnl > 0).length / data.trades;
      }
    });

    return {
      bestTradingHours,
      bestTradingDays,
      seasonalityPattern: monthlyPerformance,
      holdingTimeAnalysis: {
        averageHoldingTime: avgHoldingTime,
        optimalHoldingTime: this.findOptimalHoldingTime(holdingTimeVsReturn),
        holdingTimeVsReturn
      },
      marketRegimePerformance: regimePerformance
    };
  }

  // Analyze strategy effectiveness
  private async analyzeStrategyEffectiveness(trades: Trade[]): Promise<StrategyEffectiveness[]> {
    const strategies = new Map<string, Trade[]>();
    
    // Group trades by strategy
    trades.forEach(trade => {
      if (!strategies.has(trade.strategy)) {
        strategies.set(trade.strategy, []);
      }
      strategies.get(trade.strategy)!.push(trade);
    });

    const effectiveness: StrategyEffectiveness[] = [];

    for (const [strategyName, strategyTrades] of strategies) {
      if (strategyTrades.length < 5) continue; // Skip strategies with too few trades

      const statistics = await this.calculateTradeStatistics(strategyTrades);
      const riskMetrics = await this.calculateRiskAdjustedMetrics(strategyTrades, []);
      const timeAnalysis = await this.performTimeBasedAnalysis(strategyTrades);

      // Calculate strategy-specific metrics
      const correlationWithMarket = this.calculateMarketCorrelation(strategyTrades);
      const adaptabilityScore = this.calculateAdaptabilityScore(strategyTrades);
      const consistencyScore = this.calculateConsistencyScore(strategyTrades);
      const robustnessScore = this.calculateRobustnessScore(statistics, riskMetrics);
      
      // Overall strategy score
      const overallScore = this.calculateOverallStrategyScore(
        statistics,
        riskMetrics,
        adaptabilityScore,
        consistencyScore,
        robustnessScore
      );

      // Generate recommendations
      const recommendations = this.generateStrategyRecommendations(
        strategyName,
        statistics,
        riskMetrics,
        overallScore
      );

      effectiveness.push({
        strategyName,
        totalTrades: strategyTrades.length,
        performance: statistics,
        riskMetrics,
        timeAnalysis,
        correlationWithMarket,
        adaptabilityScore,
        consistencyScore,
        robustnessScore,
        overallScore,
        recommendations
      });
    }

    return effectiveness.sort((a, b) => b.overallScore - a.overallScore);
  }

  // Generate trading insights
  private async generateTradingInsights(
    statistics: TradeStatistics,
    riskMetrics: RiskAdjustedMetrics,
    timeAnalysis: TimeBasedAnalysis,
    strategies: StrategyEffectiveness[]
  ): Promise<TradingInsight[]> {
    const insights: TradingInsight[] = [];

    // Performance insights
    if (statistics.winRate < this.config.winRateThreshold) {
      insights.push({
        type: 'performance',
        priority: 'high',
        title: 'Low Win Rate Detected',
        description: `Current win rate of ${(statistics.winRate * 100).toFixed(1)}% is below the target threshold of ${(this.config.winRateThreshold * 100).toFixed(1)}%`,
        impact: -30,
        confidence: 85,
        actionable: true,
        recommendations: [
          'Review entry criteria to improve trade selection',
          'Consider adjusting position sizing strategy',
          'Analyze losing trades for common patterns'
        ],
        supportingData: { winRate: statistics.winRate, threshold: this.config.winRateThreshold },
        timestamp: new Date()
      });
    }

    // Risk insights
    if (riskMetrics.maxDrawdown > this.config.maxDrawdownThreshold) {
      insights.push({
        type: 'risk',
        priority: 'critical',
        title: 'Excessive Drawdown Risk',
        description: `Maximum drawdown of ${(riskMetrics.maxDrawdown * 100).toFixed(1)}% exceeds risk tolerance`,
        impact: -50,
        confidence: 95,
        actionable: true,
        recommendations: [
          'Implement stricter position sizing rules',
          'Consider using dynamic stop losses',
          'Review risk management parameters'
        ],
        supportingData: { maxDrawdown: riskMetrics.maxDrawdown, threshold: this.config.maxDrawdownThreshold },
        timestamp: new Date()
      });
    }

    // Timing insights
    if (timeAnalysis.bestTradingHours.length > 0) {
      insights.push({
        type: 'timing',
        priority: 'medium',
        title: 'Optimal Trading Hours Identified',
        description: `Performance is strongest during hours: ${timeAnalysis.bestTradingHours.join(', ')}`,
        impact: 20,
        confidence: 70,
        actionable: true,
        recommendations: [
          'Focus trading activity during identified optimal hours',
          'Consider reducing activity during poor-performing hours',
          'Monitor if pattern persists over longer timeframes'
        ],
        supportingData: { bestHours: timeAnalysis.bestTradingHours },
        timestamp: new Date()
      });
    }

    // Strategy insights
    if (strategies.length > 1) {
      const bestStrategy = strategies[0];
      const worstStrategy = strategies[strategies.length - 1];
      
      if (bestStrategy.overallScore - worstStrategy.overallScore > 0.3) {
        insights.push({
          type: 'strategy',
          priority: 'high',
          title: 'Strategy Performance Disparity',
          description: `${bestStrategy.strategyName} significantly outperforms ${worstStrategy.strategyName}`,
          impact: 35,
          confidence: 80,
          actionable: true,
          recommendations: [
            `Increase allocation to ${bestStrategy.strategyName}`,
            `Review and potentially pause ${worstStrategy.strategyName}`,
            'Analyze what makes the best strategy more effective'
          ],
          supportingData: { 
            bestStrategy: bestStrategy.strategyName, 
            worstStrategy: worstStrategy.strategyName,
            scoreDifference: bestStrategy.overallScore - worstStrategy.overallScore
          },
          timestamp: new Date()
        });
      }
    }

    // Statistical significance insight
    if (!statistics.statisticalSignificance) {
      insights.push({
        type: 'performance',
        priority: 'medium',
        title: 'Insufficient Data for Statistical Significance',
        description: `Only ${statistics.totalTrades} trades analyzed. Need ${this.config.minTradesForSignificance}+ for reliable conclusions`,
        impact: -10,
        confidence: 90,
        actionable: true,
        recommendations: [
          'Continue trading to build larger sample size',
          'Be cautious about making major strategy changes',
          'Focus on consistent execution of current strategy'
        ],
        supportingData: { totalTrades: statistics.totalTrades, minRequired: this.config.minTradesForSignificance },
        timestamp: new Date()
      });
    }

    return insights.sort((a, b) => {
      // Sort by priority first, then by impact
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return Math.abs(b.impact) - Math.abs(a.impact);
    });
  }

  // Generate performance report
  private async generatePerformanceReport(
    trades: Trade[],
    statistics: TradeStatistics,
    riskMetrics: RiskAdjustedMetrics,
    timeframeDays: number
  ): Promise<PerformanceReport> {
    const tradePairs = this.groupTradesIntoPairs(trades);
    const totalReturn = tradePairs.reduce((sum, pair) => sum + pair.pnl, 0);
    const totalReturnPercentage = totalReturn / 10000; // Assuming 10k starting capital
    
    const bestTrade = tradePairs.reduce((best, current) => 
      current.pnl > best.pnl ? this.convertTradePairToTrade(current) : best, 
      this.convertTradePairToTrade(tradePairs[0]) || trades[0]
    );
    
    const worstTrade = tradePairs.reduce((worst, current) => 
      current.pnl < worst.pnl ? this.convertTradePairToTrade(current) : worst, 
      this.convertTradePairToTrade(tradePairs[0]) || trades[0]
    );

    // Calculate monthly returns (simplified)
    const monthlyReturns = new Array(12).fill(0);
    tradePairs.forEach(pair => {
      if (pair.exitTime) {
        const month = pair.exitTime.getMonth();
        monthlyReturns[month] += pair.pnl;
      }
    });

    // Calculate drawdown history
    const drawdownHistory = this.calculateDrawdownHistory(tradePairs);

    return {
      period: 'DAILY',
      startDate: new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      totalReturn,
      totalReturnPercentage,
      winRate: statistics.winRate,
      profitFactor: statistics.profitFactor,
      sharpeRatio: riskMetrics.sharpeRatio,
      maxDrawdown: riskMetrics.maxDrawdown,
      averageTradeReturn: statistics.expectancyPerTrade,
      totalTrades: statistics.totalTrades,
      tradingDays: timeframeDays,
      bestTrade,
      worstTrade,
      strategyBreakdown: [], // Would be populated from strategy analysis
      monthlyReturns,
      drawdownHistory
    };
  }

  // Helper methods
  private groupTradesIntoPairs(trades: Trade[]): Array<{
    symbol: string;
    entryTime: Date;
    exitTime: Date | null;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    pnl: number;
    entryValue: number;
    strategy: string;
  }> {
    const pairs = [];
    const openPositions = new Map<string, Trade[]>();

    // Sort trades by time
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.executedAt || a.createdAt).getTime() - new Date(b.executedAt || b.createdAt).getTime()
    );

    for (const trade of sortedTrades) {
      const key = `${trade.symbol}_${trade.strategy}`;
      
      if (!openPositions.has(key)) {
        openPositions.set(key, []);
      }
      
      const positions = openPositions.get(key)!;
      
      if (trade.side === 'BUY') {
        positions.push(trade);
      } else if (trade.side === 'SELL' && positions.length > 0) {
        const buyTrade = positions.shift()!;
        const entryValue = buyTrade.quantity * buyTrade.executedPrice!;
        const exitValue = trade.quantity * trade.executedPrice!;
        const pnl = exitValue - entryValue;
        
        pairs.push({
          symbol: trade.symbol,
          entryTime: new Date(buyTrade.executedAt || buyTrade.createdAt),
          exitTime: new Date(trade.executedAt || trade.createdAt),
          entryPrice: buyTrade.executedPrice!,
          exitPrice: trade.executedPrice!,
          quantity: Math.min(buyTrade.quantity, trade.quantity),
          pnl,
          entryValue,
          strategy: trade.strategy
        });
      }
    }

    return pairs;
  }

  private calculateWinRateConfidenceInterval(wins: number, total: number, confidence: number): [number, number] {
    if (total === 0) return [0, 0];
    
    const p = wins / total;
    const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
    const margin = z * Math.sqrt((p * (1 - p)) / total);
    
    return [Math.max(0, p - margin), Math.min(1, p + margin)];
  }

  private assessStatisticalSignificance(pnlValues: number[], winRate: number): boolean {
    if (pnlValues.length < this.config.minTradesForSignificance) {
      return false;
    }
    
    // Simple significance test - could be enhanced with more sophisticated statistical tests
    const expectedWinRate = 0.5; // Null hypothesis: 50% win rate
    const sampleSize = pnlValues.length;
    const standardError = Math.sqrt((expectedWinRate * (1 - expectedWinRate)) / sampleSize);
    const zScore = Math.abs(winRate - expectedWinRate) / standardError;
    
    // For 95% confidence level
    return zScore > 1.96;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private calculateDrawdownMetrics(returns: number[]): { maxDrawdown: number; maxDrawdownDuration: number } {
    let runningMax = 0;
    let maxDrawdown = 0;
    let currentDrawdownDuration = 0;
    let maxDrawdownDuration = 0;
    let cumulativeReturn = 0;
    
    for (const ret of returns) {
      cumulativeReturn += ret;
      runningMax = Math.max(runningMax, cumulativeReturn);
      
      const drawdown = (runningMax - cumulativeReturn) / (runningMax || 1);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
      
      if (cumulativeReturn < runningMax) {
        currentDrawdownDuration++;
        maxDrawdownDuration = Math.max(maxDrawdownDuration, currentDrawdownDuration);
      } else {
        currentDrawdownDuration = 0;
      }
    }
    
    return { maxDrawdown, maxDrawdownDuration };
  }

  private calculateUlcerIndex(returns: number[]): number {
    let runningMax = 0;
    let squaredDrawdowns = 0;
    let cumulativeReturn = 0;
    
    for (const ret of returns) {
      cumulativeReturn += ret;
      runningMax = Math.max(runningMax, cumulativeReturn);
      
      const drawdown = runningMax > 0 ? ((runningMax - cumulativeReturn) / runningMax) * 100 : 0;
      squaredDrawdowns += drawdown * drawdown;
    }
    
    return returns.length > 0 ? Math.sqrt(squaredDrawdowns / returns.length) : 0;
  }

  private estimateMarketRegime(tradePair: any): MarketRegime {
    // Simplified regime estimation - in practice would use actual market data
    const priceChange = (tradePair.exitPrice - tradePair.entryPrice) / tradePair.entryPrice;
    const volatility = Math.abs(priceChange);
    
    if (volatility > 0.1) return 'VOLATILE';
    if (priceChange > 0.05) return 'BULL';
    if (priceChange < -0.05) return 'BEAR';
    return 'RANGE';
  }

  private analyzeHoldingTimeVsReturn(tradePairs: any[]): Array<{ duration: number; averageReturn: number }> {
    const buckets = new Map<number, number[]>();
    
    tradePairs.forEach(pair => {
      if (pair.exitTime) {
        const duration = Math.floor((pair.exitTime.getTime() - pair.entryTime.getTime()) / (1000 * 60 * 60)); // Hours
        const bucket = Math.floor(duration / 6) * 6; // 6-hour buckets
        
        if (!buckets.has(bucket)) {
          buckets.set(bucket, []);
        }
        buckets.get(bucket)!.push(pair.pnl);
      }
    });
    
    return Array.from(buckets.entries())
      .map(([duration, returns]) => ({
        duration,
        averageReturn: returns.reduce((sum, ret) => sum + ret, 0) / returns.length
      }))
      .sort((a, b) => a.duration - b.duration);
  }

  private findOptimalHoldingTime(holdingTimeVsReturn: Array<{ duration: number; averageReturn: number }>): number {
    if (holdingTimeVsReturn.length === 0) return 0;
    
    const best = holdingTimeVsReturn.reduce((best, current) => 
      current.averageReturn > best.averageReturn ? current : best
    );
    
    return best.duration;
  }

  private calculateMarketCorrelation(trades: Trade[]): number {
    // Simplified correlation calculation - would need actual market data
    return Math.random() * 0.4 + 0.3; // Mock correlation between 0.3-0.7
  }

  private calculateAdaptabilityScore(trades: Trade[]): number {
    // Measure how well strategy adapts to different market conditions
    const tradePairs = this.groupTradesIntoPairs(trades);
    const regimePerformance = new Map<string, number[]>();
    
    tradePairs.forEach(pair => {
      const regime = this.estimateMarketRegime(pair);
      if (!regimePerformance.has(regime)) {
        regimePerformance.set(regime, []);
      }
      regimePerformance.get(regime)!.push(pair.pnl);
    });
    
    // Score based on consistency across regimes
    const regimeScores = Array.from(regimePerformance.values()).map(returns => {
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      return avgReturn > 0 ? 1 : 0;
    });
    
    return regimeScores.length > 0 ? regimeScores.reduce((sum, score) => sum + score, 0) / regimeScores.length : 0;
  }

  private calculateConsistencyScore(trades: Trade[]): number {
    const tradePairs = this.groupTradesIntoPairs(trades);
    const returns = tradePairs.map(pair => pair.pnl);
    
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const stdDev = this.calculateStandardDeviation(returns);
    
    // Consistency score: lower volatility relative to returns is better
    return stdDev > 0 ? Math.max(0, 1 - (stdDev / Math.abs(avgReturn))) : 1;
  }

  private calculateRobustnessScore(statistics: TradeStatistics, riskMetrics: RiskAdjustedMetrics): number {
    let score = 0;
    
    // Win rate component
    if (statistics.winRate > this.config.winRateThreshold) score += 0.25;
    
    // Profit factor component
    if (statistics.profitFactor > this.config.profitFactorThreshold) score += 0.25;
    
    // Sharpe ratio component
    if (riskMetrics.sharpeRatio > 1.0) score += 0.25;
    
    // Drawdown component
    if (riskMetrics.maxDrawdown < this.config.maxDrawdownThreshold) score += 0.25;
    
    return score;
  }

  private calculateOverallStrategyScore(
    statistics: TradeStatistics,
    riskMetrics: RiskAdjustedMetrics,
    adaptabilityScore: number,
    consistencyScore: number,
    robustnessScore: number
  ): number {
    // Weighted combination of different scores
    const weights = {
      robustness: 0.3,
      adaptability: 0.25,
      consistency: 0.25,
      sharpe: 0.2
    };
    
    const normalizedSharpe = Math.max(0, Math.min(1, (riskMetrics.sharpeRatio + 2) / 4)); // Normalize to 0-1
    
    return (
      weights.robustness * robustnessScore +
      weights.adaptability * adaptabilityScore +
      weights.consistency * consistencyScore +
      weights.sharpe * normalizedSharpe
    );
  }

  private generateStrategyRecommendations(
    strategyName: string,
    statistics: TradeStatistics,
    riskMetrics: RiskAdjustedMetrics,
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallScore > 0.8) {
      recommendations.push(`Excellent performance - consider increasing allocation to ${strategyName}`);
    } else if (overallScore < 0.4) {
      recommendations.push(`Poor performance - consider pausing or modifying ${strategyName}`);
    }
    
    if (statistics.winRate < this.config.winRateThreshold) {
      recommendations.push('Improve entry criteria to increase win rate');
    }
    
    if (riskMetrics.maxDrawdown > this.config.maxDrawdownThreshold) {
      recommendations.push('Implement stricter risk management to reduce drawdown');
    }
    
    if (riskMetrics.sharpeRatio < 0.5) {
      recommendations.push('Focus on risk-adjusted returns rather than absolute returns');
    }
    
    return recommendations;
  }

  private calculateDrawdownHistory(tradePairs: any[]): number[] {
    let runningMax = 0;
    let cumulativeReturn = 0;
    const drawdowns: number[] = [];
    
    tradePairs.forEach(pair => {
      cumulativeReturn += pair.pnl;
      runningMax = Math.max(runningMax, cumulativeReturn);
      const drawdown = runningMax > 0 ? (runningMax - cumulativeReturn) / runningMax : 0;
      drawdowns.push(drawdown);
    });
    
    return drawdowns;
  }

  private convertTradePairToTrade(tradePair: any): Trade {
    return {
      id: `${tradePair.symbol}_${tradePair.entryTime.getTime()}`,
      symbol: tradePair.symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: tradePair.quantity,
      price: tradePair.entryPrice,
      executedPrice: tradePair.entryPrice,
      executedQuantity: tradePair.quantity,
      status: 'FILLED',
      timeInForce: 'GTC',
      createdAt: tradePair.entryTime,
      executedAt: tradePair.entryTime,
      commission: 0,
      commissionAsset: 'USDT',
      realizedPnL: tradePair.pnl,
      strategy: tradePair.strategy,
      reason: 'Historical trade',
      confidence: 70
    };
  }

  private getEmptyStatistics(): TradeStatistics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      winRateConfidenceInterval: [0, 0],
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      expectancyPerTrade: 0,
      statisticalSignificance: false,
      confidenceLevel: this.config.confidenceLevel
    };
  }

  private getEmptyRiskMetrics(): RiskAdjustedMetrics {
    return {
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      valueAtRisk95: 0,
      conditionalValueAtRisk: 0,
      ulcerIndex: 0,
      recoveryFactor: 0,
      sterlingRatio: 0
    };
  }

  // Public methods for external access
  public async getLatestAnalysis(): Promise<any> {
    return this.cachedAnalysis.get('latest');
  }

  public getConfiguration(): TradeAnalysisConfig {
    return { ...this.config };
  }

  public updateConfiguration(newConfig: Partial<TradeAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Trade Analysis Engine configuration updated');
  }

  public isCurrentlyAnalyzing(): boolean {
    return this.isAnalyzing;
  }

  public getLastAnalysisTime(): Date | null {
    return this.lastAnalysisTimestamp;
  }
}

// Export singleton instance
export const tradeAnalysisEngine = new TradeAnalysisEngine();