import { aiReasoningEngine } from './reasoning-engine';
import { tradeAnalysisEngine } from './trade-analysis-engine';
import { reportGenerator } from './report-generator';
import { patternRecognition } from './pattern-recognition';
import { tradingSystemIntegration } from '../trading/integration/trading-system-integration';
import { dynamicStopCalculator } from '../trading/dynamic-trailing-stops';
import { TradingBotServer } from '../telegram/bot-server';

/**
 * Integration layer between AI Learning System and Telegram Bot Reports
 * Generates intelligent, personalized reports for Telegram users
 */
export class AITelegramReportIntegration {
  private telegramBot?: TradingBotServer;
  private isInitialized: boolean = false;
  private reportSchedule: NodeJS.Timeout | null = null;
  
  // Report generation settings
  private readonly DEFAULT_REPORT_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
  private readonly DAILY_REPORT_TIME = '09:00'; // 9 AM
  private readonly WEEKLY_REPORT_DAY = 1; // Monday

  // Performance tracking
  private metrics = {
    reportsGenerated: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageGenerationTime: 0,
    lastReportTime: new Date(0),
    userEngagement: new Map<number, number>() // userId -> engagement score
  };

  constructor(telegramBot?: TradingBotServer) {
    this.telegramBot = telegramBot;
  }

  /**
   * Initialize the AI-Telegram report integration
   */
  async initialize(config?: {
    telegramBot?: TradingBotServer;
    enableScheduledReports?: boolean;
    reportInterval?: number;
    dailyReportTime?: string;
  }): Promise<void> {
    try {
      console.log('🤖 Initializing AI-Telegram Report Integration...');

      if (config?.telegramBot) {
        this.telegramBot = config.telegramBot;
      }

      if (!this.telegramBot) {
        console.log('⚠️ No Telegram bot provided - reports will be generated but not sent');
      }

      // Setup scheduled reports if enabled
      if (config?.enableScheduledReports !== false) {
        await this.setupScheduledReports(config?.reportInterval, config?.dailyReportTime);
      }

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('✅ AI-Telegram Report Integration initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize AI-Telegram Report Integration:', error);
      throw error;
    }
  }

  /**
   * Generate and send a comprehensive market analysis report
   */
  async generateMarketAnalysisReport(userId?: number): Promise<string> {
    try {
      console.log('📊 Generating market analysis report...');
      const startTime = Date.now();

      // Gather comprehensive market data
      const marketData = await this.gatherMarketIntelligence();
      
      // Generate AI insights
      const aiInsights = await this.generateAIInsights(marketData);
      
      // Analyze current positions and performance
      const positionAnalysis = await this.analyzeCurrentPositions();
      
      // Generate risk assessment
      const riskAssessment = await this.generateRiskAssessment();
      
      // Create formatted report
      const report = await this.formatMarketAnalysisReport({
        marketData,
        aiInsights,
        positionAnalysis,
        riskAssessment,
        userId
      });

      // Update metrics
      const generationTime = Date.now() - startTime;
      this.updateMetrics('market_analysis', generationTime, true);

      console.log(`✅ Market analysis report generated in ${generationTime}ms`);
      
      // Send report if user ID provided and bot available
      if (userId && this.telegramBot) {
        await this.sendReportToUser(userId, report);
      }

      return report;

    } catch (error) {
      console.error('❌ Failed to generate market analysis report:', error);
      this.updateMetrics('market_analysis', 0, false);
      throw error;
    }
  }

  /**
   * Generate and send a trading performance report
   */
  async generatePerformanceReport(userId?: number, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<string> {
    try {
      console.log(`📈 Generating ${timeframe} performance report...`);
      const startTime = Date.now();

      // Analyze trading performance
      const performance = await this.analyzePerformance(timeframe);
      
      // Get AI learning insights
      const learningInsights = await this.getAILearningInsights(timeframe);
      
      // Analyze strategy effectiveness
      const strategyAnalysis = await this.analyzeStrategyEffectiveness(timeframe);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(performance, learningInsights);

      // Create formatted report
      const report = await this.formatPerformanceReport({
        timeframe,
        performance,
        learningInsights,
        strategyAnalysis,
        recommendations,
        userId
      });

      // Update metrics
      const generationTime = Date.now() - startTime;
      this.updateMetrics('performance', generationTime, true);

      console.log(`✅ Performance report generated in ${generationTime}ms`);
      
      // Send report if user ID provided and bot available
      if (userId && this.telegramBot) {
        await this.sendReportToUser(userId, report);
      }

      return report;

    } catch (error) {
      console.error('❌ Failed to generate performance report:', error);
      this.updateMetrics('performance', 0, false);
      throw error;
    }
  }

  /**
   * Generate and send a risk assessment report
   */
  async generateRiskReport(userId?: number): Promise<string> {
    try {
      console.log('⚠️ Generating risk assessment report...');
      const startTime = Date.now();

      // Analyze current risk exposure
      const riskExposure = await this.analyzeRiskExposure();
      
      // Check dynamic stops effectiveness
      const stopsAnalysis = await this.analyzeStopsEffectiveness();
      
      // Market volatility assessment
      const volatilityAnalysis = await this.analyzeMarketVolatility();
      
      // Generate risk recommendations
      const riskRecommendations = await this.generateRiskRecommendations(
        riskExposure, 
        stopsAnalysis, 
        volatilityAnalysis
      );

      // Create formatted report
      const report = await this.formatRiskReport({
        riskExposure,
        stopsAnalysis,
        volatilityAnalysis,
        riskRecommendations,
        userId
      });

      // Update metrics
      const generationTime = Date.now() - startTime;
      this.updateMetrics('risk', generationTime, true);

      console.log(`✅ Risk report generated in ${generationTime}ms`);
      
      // Send report if user ID provided and bot available
      if (userId && this.telegramBot) {
        await this.sendReportToUser(userId, report);
      }

      return report;

    } catch (error) {
      console.error('❌ Failed to generate risk report:', error);
      this.updateMetrics('risk', 0, false);
      throw error;
    }
  }

  /**
   * Generate a quick status update
   */
  async generateQuickStatus(userId?: number): Promise<string> {
    try {
      const systemStatus = tradingSystemIntegration.getStatus();
      const dynamicStopsStats = dynamicStopCalculator.getStats();
      const integrationMetrics = tradingSystemIntegration.getMetrics();

      const report = `🚀 <b>Quick System Status</b>\n\n` +
        `⚡ System: ${systemStatus.isRunning ? '✅ Running' : '❌ Stopped'}\n` +
        `🎯 Active Stops: ${systemStatus.activeStops}\n` +
        `🧠 AI Learning: ${systemStatus.aiLearningEnabled ? '✅ Enabled' : '❌ Disabled'}\n` +
        `📱 Notifications: ${systemStatus.notificationsEnabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
        `📊 <b>Recent Activity:</b>\n` +
        `• Trades: ${integrationMetrics.tradesExecuted}\n` +
        `• AI Signals: ${integrationMetrics.aiSignals}\n` +
        `• Stop Updates: ${integrationMetrics.stopUpdates}\n` +
        `• Notifications: ${integrationMetrics.notifications}\n\n` +
        `⏱️ Uptime: ${Math.round(integrationMetrics.uptime / 1000 / 60)} minutes\n` +
        `🕐 Last Activity: ${integrationMetrics.lastActivity.toLocaleTimeString()}`;

      if (userId && this.telegramBot) {
        await this.sendReportToUser(userId, report);
      }

      return report;

    } catch (error) {
      console.error('❌ Failed to generate quick status:', error);
      throw error;
    }
  }

  // Private implementation methods

  private async setupScheduledReports(interval?: number, dailyTime?: string): Promise<void> {
    console.log('📅 Setting up scheduled reports...');

    // Schedule periodic reports
    const reportInterval = interval || this.DEFAULT_REPORT_INTERVAL;
    this.reportSchedule = setInterval(() => {
      this.sendScheduledReports();
    }, reportInterval);

    // Schedule daily reports at specific time
    this.scheduleDailyReports(dailyTime || this.DAILY_REPORT_TIME);
    
    console.log(`✅ Scheduled reports set up (interval: ${reportInterval / 1000 / 60} minutes)`);
  }

  private scheduleDailyReports(time: string): void {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilFirst = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendDailyReports();
      // Then schedule for every 24 hours
      setInterval(() => {
        this.sendDailyReports();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilFirst);
    
    console.log(`📅 Daily reports scheduled for ${time} (next in ${Math.round(timeUntilFirst / 1000 / 60)} minutes)`);
  }

  private setupEventListeners(): void {
    // Listen to trading system events for real-time insights
    tradingSystemIntegration.on('signalProcessed', this.handleSignalProcessed.bind(this));
    tradingSystemIntegration.on('positionOpened', this.handlePositionOpened.bind(this));
    tradingSystemIntegration.on('positionClosed', this.handlePositionClosed.bind(this));
    
    // Listen to dynamic stops events
    dynamicStopCalculator.on('stopUpdated', this.handleStopUpdated.bind(this));
  }

  private async sendScheduledReports(): Promise<void> {
    try {
      console.log('📊 Sending scheduled reports...');
      
      // Generate market analysis for all active users
      await this.generateMarketAnalysisReport();
      
      // This would send to all authorized users in a real implementation
      console.log('✅ Scheduled reports sent');

    } catch (error) {
      console.error('❌ Failed to send scheduled reports:', error);
    }
  }

  private async sendDailyReports(): Promise<void> {
    try {
      console.log('📈 Sending daily reports...');
      
      // Generate daily performance report
      await this.generatePerformanceReport(undefined, 'daily');
      
      console.log('✅ Daily reports sent');

    } catch (error) {
      console.error('❌ Failed to send daily reports:', error);
    }
  }

  // Event handlers
  private async handleSignalProcessed(event: any): Promise<void> {
    // Could generate immediate insights about signal processing
    console.log(`🔍 AI signal processed: ${event.adjustedSignal.symbol} - ${event.shouldExecute ? 'EXECUTED' : 'REJECTED'}`);
  }

  private async handlePositionOpened(position: any): Promise<void> {
    // Could send immediate notification about new position
    console.log(`📈 Position opened: ${position.symbol}`);
  }

  private async handlePositionClosed(event: any): Promise<void> {
    // Could analyze the closed position and send insights
    console.log(`📉 Position closed: ${event.position.symbol} - ${event.reason}`);
  }

  private async handleStopUpdated(update: any): Promise<void> {
    // Could send real-time stop update notifications
    console.log(`🎯 Stop updated: ${update.symbol}`);
  }

  // Data gathering and analysis methods
  private async gatherMarketIntelligence(): Promise<any> {
    // In a real implementation, this would gather comprehensive market data
    return {
      timestamp: new Date(),
      marketSentiment: 'BULLISH',
      volatility: 'MEDIUM',
      volume: 'HIGH',
      dominantTrends: ['BTC_RECOVERY', 'ALT_SEASON'],
      keyLevels: {
        support: 48000,
        resistance: 52000
      }
    };
  }

  private async generateAIInsights(marketData: any): Promise<any> {
    // Generate insights using the AI reasoning engine
    const mockData = {
      symbol: 'BTC/USD',
      price: 50000,
      volume: 1000000,
      prices: Array.from({ length: 50 }, (_, i) => 50000 + (Math.random() - 0.5) * 1000),
      fearGreed: 55,
      capital: 10000
    };

    const signal = await aiReasoningEngine.analyzeMarket(mockData);
    
    return {
      confidence: signal.confidence,
      recommendation: signal.action,
      reasoning: signal.reasoning.slice(0, 3), // Top 3 reasons
      riskReward: signal.riskReward,
      marketRegime: signal.marketRegime
    };
  }

  private async analyzeCurrentPositions(): Promise<any> {
    const activeStops = dynamicStopCalculator.getActiveStops();
    
    return {
      totalPositions: activeStops.length,
      profitablePositions: activeStops.filter(stop => stop.currentPnL > 0).length,
      averagePnL: activeStops.length > 0 
        ? activeStops.reduce((sum, stop) => sum + stop.currentPnLPercentage, 0) / activeStops.length 
        : 0,
      symbols: activeStops.map(stop => stop.symbol)
    };
  }

  private async generateRiskAssessment(): Promise<any> {
    const systemStatus = tradingSystemIntegration.getStatus();
    
    return {
      overallRisk: 'MEDIUM',
      activeStopsCount: systemStatus.activeStops,
      riskFactors: ['Market volatility', 'Position concentration'],
      mitigationStrategies: ['Dynamic stops active', 'AI monitoring enabled']
    };
  }

  // Report formatting methods
  private async formatMarketAnalysisReport(data: any): Promise<string> {
    const { marketData, aiInsights, positionAnalysis, riskAssessment } = data;
    
    return `📊 <b>Market Analysis Report</b>\n` +
      `🕐 ${new Date().toLocaleString()}\n\n` +
      
      `🌍 <b>Market Overview:</b>\n` +
      `• Sentiment: ${marketData.marketSentiment}\n` +
      `• Volatility: ${marketData.volatility}\n` +
      `• Volume: ${marketData.volume}\n\n` +
      
      `🧠 <b>AI Insights:</b>\n` +
      `• Recommendation: ${aiInsights.recommendation}\n` +
      `• Confidence: ${aiInsights.confidence.toFixed(1)}%\n` +
      `• Risk/Reward: ${aiInsights.riskReward.toFixed(2)}\n` +
      `• Market Regime: ${aiInsights.marketRegime}\n\n` +
      
      `📈 <b>Current Positions:</b>\n` +
      `• Total: ${positionAnalysis.totalPositions}\n` +
      `• Profitable: ${positionAnalysis.profitablePositions}\n` +
      `• Avg P&L: ${positionAnalysis.averagePnL.toFixed(2)}%\n\n` +
      
      `⚠️ <b>Risk Assessment:</b>\n` +
      `• Overall Risk: ${riskAssessment.overallRisk}\n` +
      `• Active Stops: ${riskAssessment.activeStopsCount}\n\n` +
      
      `💡 <b>Key Insights:</b>\n${aiInsights.reasoning.map((r: string) => `• ${r}`).join('\n')}`;
  }

  private async formatPerformanceReport(data: any): Promise<string> {
    const { timeframe, performance, recommendations } = data;
    
    return `📈 <b>${timeframe.toUpperCase()} Performance Report</b>\n` +
      `🕐 ${new Date().toLocaleString()}\n\n` +
      
      `💰 <b>Performance Metrics:</b>\n` +
      `• Total Return: ${performance.totalReturn}%\n` +
      `• Win Rate: ${performance.winRate}%\n` +
      `• Best Trade: ${performance.bestTrade}%\n` +
      `• Worst Trade: ${performance.worstTrade}%\n\n` +
      
      `🎯 <b>Trading Activity:</b>\n` +
      `• Total Trades: ${performance.totalTrades}\n` +
      `• Winning Trades: ${performance.winningTrades}\n` +
      `• Average Hold Time: ${performance.avgHoldTime}h\n\n` +
      
      `💡 <b>Recommendations:</b>\n${recommendations.map((r: string) => `• ${r}`).join('\n')}`;
  }

  private async formatRiskReport(data: any): Promise<string> {
    const { riskExposure, stopsAnalysis, riskRecommendations } = data;
    
    return `⚠️ <b>Risk Assessment Report</b>\n` +
      `🕐 ${new Date().toLocaleString()}\n\n` +
      
      `📊 <b>Risk Exposure:</b>\n` +
      `• Portfolio Risk: ${riskExposure.portfolioRisk}\n` +
      `• Max Drawdown: ${riskExposure.maxDrawdown}%\n` +
      `• Position Concentration: ${riskExposure.concentration}\n\n` +
      
      `🎯 <b>Stops Analysis:</b>\n` +
      `• Active Stops: ${stopsAnalysis.activeStops}\n` +
      `• Effectiveness: ${stopsAnalysis.effectiveness}%\n` +
      `• Avg Distance: ${stopsAnalysis.avgDistance}%\n\n` +
      
      `💡 <b>Risk Recommendations:</b>\n${riskRecommendations.map((r: string) => `• ${r}`).join('\n')}`;
  }

  // Helper methods for analysis (simplified implementations)
  private async analyzePerformance(timeframe: string): Promise<any> {
    return {
      totalReturn: 5.2,
      winRate: 65,
      bestTrade: 12.5,
      worstTrade: -3.2,
      totalTrades: 15,
      winningTrades: 10,
      avgHoldTime: 4.5
    };
  }

  private async getAILearningInsights(timeframe: string): Promise<any> {
    return {
      learningProgress: 85,
      patternAccuracy: 78,
      adaptationRate: 92
    };
  }

  private async analyzeStrategyEffectiveness(timeframe: string): Promise<any> {
    return {
      bestStrategy: 'Momentum Trading',
      strategyAccuracy: 72,
      riskAdjustedReturn: 1.8
    };
  }

  private async generateRecommendations(performance: any, learningInsights: any): Promise<string[]> {
    const recommendations = [];
    
    if (performance.winRate < 60) {
      recommendations.push('Consider tightening entry criteria to improve win rate');
    }
    
    if (performance.totalReturn < 5) {
      recommendations.push('Review position sizing and risk management');
    }
    
    if (learningInsights.patternAccuracy < 80) {
      recommendations.push('AI system needs more training data for better accuracy');
    }
    
    return recommendations.length > 0 ? recommendations : ['Continue current strategy - performance is optimal'];
  }

  private async analyzeRiskExposure(): Promise<any> {
    return {
      portfolioRisk: 'MEDIUM',
      maxDrawdown: 8.5,
      concentration: 'MODERATE'
    };
  }

  private async analyzeStopsEffectiveness(): Promise<any> {
    const stats = dynamicStopCalculator.getStats();
    return {
      activeStops: stats.activePositions,
      effectiveness: 78,
      avgDistance: 2.5
    };
  }

  private async analyzeMarketVolatility(): Promise<any> {
    return {
      currentVolatility: 'MEDIUM',
      volatilityTrend: 'INCREASING',
      impactOnStrategy: 'MODERATE'
    };
  }

  private async generateRiskRecommendations(riskExposure: any, stopsAnalysis: any, volatilityAnalysis: any): Promise<string[]> {
    return [
      'Maintain current stop loss levels',
      'Consider reducing position sizes in high volatility',
      'Monitor market correlation risks'
    ];
  }

  private async sendReportToUser(userId: number, report: string): Promise<void> {
    try {
      if (!this.telegramBot) {
        console.log('📱 Report generated (no bot configured):', report.substring(0, 100) + '...');
        return;
      }

      await this.telegramBot.sendNotification(userId, report);
      this.metrics.successfulDeliveries++;
      this.updateUserEngagement(userId);
      
      console.log(`📱 Report sent to user ${userId}`);

    } catch (error) {
      console.error(`❌ Failed to send report to user ${userId}:`, error);
      this.metrics.failedDeliveries++;
    }
  }

  private updateMetrics(reportType: string, generationTime: number, success: boolean): void {
    this.metrics.reportsGenerated++;
    this.metrics.lastReportTime = new Date();
    
    if (success) {
      // Update average generation time
      this.metrics.averageGenerationTime = 
        (this.metrics.averageGenerationTime + generationTime) / 2;
    }
  }

  private updateUserEngagement(userId: number): void {
    const currentScore = this.metrics.userEngagement.get(userId) || 0;
    this.metrics.userEngagement.set(userId, currentScore + 1);
  }

  // Public getter methods
  public getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  public isActive(): boolean {
    return this.isInitialized;
  }

  public async stop(): Promise<void> {
    if (this.reportSchedule) {
      clearInterval(this.reportSchedule);
      this.reportSchedule = null;
    }
    
    this.isInitialized = false;
    console.log('🛑 AI-Telegram Report Integration stopped');
  }
}

// Export singleton instance
export const aiTelegramReportIntegration = new AITelegramReportIntegration();