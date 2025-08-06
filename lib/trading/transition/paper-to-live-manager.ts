import { EventEmitter } from 'events';
import { unifiedExchangeManager } from '../unified-exchange-manager';
import { advancedRiskManager } from '../risk/advanced-risk-manager';
import { credentialManager } from '../../security/credential-manager';

export interface TransitionConfig {
  // Performance criteria for live trading
  minSuccessRate: number; // Minimum win rate %
  minProfitFactor: number; // Minimum profit factor
  minSharpeRatio: number; // Minimum Sharpe ratio
  minTradeCount: number; // Minimum number of trades
  maxDrawdown: number; // Maximum drawdown %
  evaluationPeriodDays: number; // Period to evaluate performance
  
  // Transition settings
  transitionMode: 'gradual' | 'immediate' | 'threshold';
  initialLiveCapital: number; // Starting live capital
  maxLiveCapital: number; // Maximum live capital
  capitalIncrementPercent: number; // Capital increase % on milestones
  
  // Safety settings
  requireManualApproval: boolean;
  emergencyRevertThreshold: number; // Revert to paper if loss exceeds %
  liveMonitoringInterval: number; // Monitoring interval in ms
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  successRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  calmarRatio: number;
  startDate: Date;
  endDate: Date;
  tradingDays: number;
}

export interface TransitionMilestone {
  name: string;
  description: string;
  achieved: boolean;
  achievedDate?: Date;
  requiredMetric: string;
  requiredValue: number;
  currentValue: number;
  capitalIncrease?: number;
}

export interface TransitionStatus {
  currentMode: 'paper' | 'live' | 'transitioning';
  paperPerformance: PerformanceMetrics;
  livePerformance?: PerformanceMetrics;
  milestones: TransitionMilestone[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  transitionStartDate?: Date;
  currentLiveCapital: number;
  readinessScore: number; // 0-100
  recommendation: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTime: Date;
  exitTime?: Date;
  profit?: number;
  status: 'open' | 'closed';
  exchange: string;
  mode: 'paper' | 'live' | 'transitioning';
}

class PaperToLiveManager extends EventEmitter {
  private config: TransitionConfig;
  private paperTrades: Trade[] = [];
  private liveTrades: Trade[] = [];
  private currentMode: 'paper' | 'live' | 'transitioning' = 'paper';
  private approvalStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  private transitionStartDate?: Date;
  private currentLiveCapital: number = 0;
  private isMonitoring: boolean = false;

  constructor(config: TransitionConfig) {
    super();
    this.config = config;
    this.currentLiveCapital = config.initialLiveCapital;
    this.startPaperTrading();
  }

  // Initialize paper trading
  private startPaperTrading() {
    console.log('📝 Starting paper trading evaluation period');
    this.currentMode = 'paper';
    this.startPerformanceTracking();
    
    this.emit('paperTradingStarted', {
      timestamp: new Date(),
      evaluationPeriod: this.config.evaluationPeriodDays
    });
  }

  // Performance tracking
  private startPerformanceTracking() {
    // Monitor performance every hour
    setInterval(() => {
      this.evaluatePerformance();
    }, 60 * 60 * 1000);

    // Daily detailed analysis
    setInterval(() => {
      this.performDailyAnalysis();
    }, 24 * 60 * 60 * 1000);
  }

  // Record a trade
  recordTrade(trade: Omit<Trade, 'id' | 'mode'>): void {
    const fullTrade: Trade = {
      ...trade,
      id: this.generateTradeId(),
      mode: this.currentMode
    };

    if (this.currentMode === 'paper') {
      this.paperTrades.push(fullTrade);
      console.log(`📝 Paper trade recorded: ${trade.symbol} ${trade.side} ${trade.quantity}`);
    } else {
      this.liveTrades.push(fullTrade);
      console.log(`💰 Live trade recorded: ${trade.symbol} ${trade.side} ${trade.quantity}`);
    }

    this.emit('tradeRecorded', fullTrade);
  }

  // Calculate performance metrics
  calculatePerformance(trades: Trade[]): PerformanceMetrics {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.profit !== undefined);
    
    if (closedTrades.length === 0) {
      return this.getEmptyMetrics();
    }

    const winningTrades = closedTrades.filter(t => (t.profit || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.profit || 0) < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0));
    const netProfit = totalProfit - totalLoss;
    
    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const successRate = (winningTrades.length / closedTrades.length) * 100;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    
    // Calculate drawdown
    const maxDrawdown = this.calculateMaxDrawdown(closedTrades);
    
    // Calculate Sharpe ratio (simplified)
    const sharpeRatio = this.calculateSharpeRatio(closedTrades);
    
    // Calculate Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? (netProfit / Math.abs(maxDrawdown)) : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      successRate,
      totalProfit,
      totalLoss,
      netProfit,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin: Math.max(...winningTrades.map(t => t.profit || 0), 0),
      largestLoss: Math.min(...losingTrades.map(t => t.profit || 0), 0),
      maxDrawdown,
      sharpeRatio,
      calmarRatio,
      startDate: closedTrades[0]?.entryTime || new Date(),
      endDate: closedTrades[closedTrades.length - 1]?.exitTime || new Date(),
      tradingDays: this.calculateTradingDays(closedTrades)
    };
  }

  // Evaluate if ready for live trading
  async evaluateTransitionReadiness(): Promise<TransitionStatus> {
    const paperPerformance = this.calculatePerformance(this.paperTrades);
    const livePerformance = this.liveTrades.length > 0 ? this.calculatePerformance(this.liveTrades) : undefined;
    
    const milestones = this.evaluateMilestones(paperPerformance);
    const readinessScore = this.calculateReadinessScore(paperPerformance, milestones);
    const recommendation = this.generateRecommendation(paperPerformance, milestones, readinessScore);

    return {
      currentMode: this.currentMode,
      paperPerformance,
      livePerformance,
      milestones,
      approvalStatus: this.approvalStatus,
      transitionStartDate: this.transitionStartDate,
      currentLiveCapital: this.currentLiveCapital,
      readinessScore,
      recommendation
    };
  }

  // Evaluate milestones
  private evaluateMilestones(performance: PerformanceMetrics): TransitionMilestone[] {
    const milestones: TransitionMilestone[] = [
      {
        name: 'Minimum Trade Count',
        description: `Complete at least ${this.config.minTradeCount} trades`,
        achieved: performance.totalTrades >= this.config.minTradeCount,
        requiredMetric: 'totalTrades',
        requiredValue: this.config.minTradeCount,
        currentValue: performance.totalTrades
      },
      {
        name: 'Success Rate',
        description: `Achieve minimum ${this.config.minSuccessRate}% win rate`,
        achieved: performance.successRate >= this.config.minSuccessRate,
        requiredMetric: 'successRate',
        requiredValue: this.config.minSuccessRate,
        currentValue: performance.successRate
      },
      {
        name: 'Profit Factor',
        description: `Achieve minimum ${this.config.minProfitFactor} profit factor`,
        achieved: performance.profitFactor >= this.config.minProfitFactor,
        requiredMetric: 'profitFactor',
        requiredValue: this.config.minProfitFactor,
        currentValue: performance.profitFactor
      },
      {
        name: 'Drawdown Control',
        description: `Keep maximum drawdown below ${this.config.maxDrawdown}%`,
        achieved: Math.abs(performance.maxDrawdown) <= this.config.maxDrawdown,
        requiredMetric: 'maxDrawdown',
        requiredValue: this.config.maxDrawdown,
        currentValue: Math.abs(performance.maxDrawdown)
      },
      {
        name: 'Sharpe Ratio',
        description: `Achieve minimum ${this.config.minSharpeRatio} Sharpe ratio`,
        achieved: performance.sharpeRatio >= this.config.minSharpeRatio,
        requiredMetric: 'sharpeRatio',
        requiredValue: this.config.minSharpeRatio,
        currentValue: performance.sharpeRatio
      },
      {
        name: 'Evaluation Period',
        description: `Complete ${this.config.evaluationPeriodDays} days of trading`,
        achieved: performance.tradingDays >= this.config.evaluationPeriodDays,
        requiredMetric: 'tradingDays',
        requiredValue: this.config.evaluationPeriodDays,
        currentValue: performance.tradingDays
      }
    ];

    // Mark achieved milestones with dates
    milestones.forEach(milestone => {
      if (milestone.achieved && !milestone.achievedDate) {
        milestone.achievedDate = new Date();
      }
    });

    return milestones;
  }

  // Calculate readiness score
  private calculateReadinessScore(performance: PerformanceMetrics, milestones: TransitionMilestone[]): number {
    let score = 0;
    
    // Milestone completion (40% of score)
    const completedMilestones = milestones.filter(m => m.achieved).length;
    score += (completedMilestones / milestones.length) * 40;
    
    // Performance quality (60% of score)
    if (performance.totalTrades > 0) {
      // Success rate contribution
      const successRateScore = Math.min(performance.successRate / 100, 1) * 15;
      score += successRateScore;
      
      // Profit factor contribution
      const profitFactorScore = Math.min(performance.profitFactor / 3, 1) * 15;
      score += profitFactorScore;
      
      // Drawdown control contribution
      const drawdownScore = Math.max(0, 1 - Math.abs(performance.maxDrawdown) / 20) * 15;
      score += drawdownScore;
      
      // Consistency contribution (Sharpe ratio)
      const consistencyScore = Math.min(performance.sharpeRatio / 2, 1) * 15;
      score += consistencyScore;
    }

    return Math.min(Math.round(score), 100);
  }

  // Generate recommendation
  private generateRecommendation(performance: PerformanceMetrics, milestones: TransitionMilestone[], score: number): string {
    if (score >= 85) {
      return '🟢 READY: All criteria met. Recommended for live trading transition.';
    } else if (score >= 70) {
      return '🟡 PARTIAL: Most criteria met. Consider gradual transition with reduced capital.';
    } else if (score >= 50) {
      return '🟠 DEVELOPING: Some progress made. Continue paper trading and focus on weak areas.';
    } else {
      return '🔴 NOT READY: Significant improvements needed before considering live trading.';
    }
  }

  // Initiate transition to live trading
  async initiateTransition(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Initiating transition to live trading');

      // Evaluate readiness
      const status = await this.evaluateTransitionReadiness();
      
      if (status.readinessScore < 70) {
        return {
          success: false,
          message: `Readiness score ${status.readinessScore}% is below minimum threshold of 70%`
        };
      }

      // Check if manual approval is required
      if (this.config.requireManualApproval && this.approvalStatus !== 'approved') {
        this.approvalStatus = 'pending';
        this.emit('approvalRequired', status);
        
        return {
          success: false,
          message: 'Manual approval required before transition to live trading'
        };
      }

      // Verify credentials for live trading
      const binanceCredentials = await credentialManager.getCredential('binance', 'live');
      const alpacaCredentials = await credentialManager.getCredential('alpaca', 'live');
      
      if (!binanceCredentials && !alpacaCredentials) {
        return {
          success: false,
          message: 'No live trading credentials configured. Please set up live trading credentials first.'
        };
      }

      // Switch to live mode
      this.currentMode = 'transitioning';
      this.transitionStartDate = new Date();
      
      // Update risk management for live trading
      advancedRiskManager.updateConfig({
        maxDailyLoss: this.currentLiveCapital * 0.02, // 2% of live capital
        maxPositionSize: this.currentLiveCapital * 0.1, // 10% of live capital
        riskPerTrade: 0.5 // Reduced risk for live trading
      });

      // Start live monitoring
      this.startLiveMonitoring();

      console.log(`✅ Transition to live trading initiated with $${this.currentLiveCapital} capital`);
      
      this.emit('transitionStarted', {
        timestamp: new Date(),
        initialCapital: this.currentLiveCapital,
        readinessScore: status.readinessScore
      });

      return {
        success: true,
        message: `Live trading started with $${this.currentLiveCapital} capital`
      };

    } catch (error) {
      console.error('❌ Transition initiation failed:', error);
      return {
        success: false,
        message: `Transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Start live trading monitoring
  private startLiveMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.currentMode = 'live';
    
    console.log('🔍 Starting live trading monitoring');

    // Monitor performance frequently during live trading
    const monitoringInterval = setInterval(async () => {
      try {
        await this.performLiveMonitoring();
      } catch (error) {
        console.error('❌ Live monitoring error:', error);
      }
    }, this.config.liveMonitoringInterval);

    // Stop monitoring if mode changes
    this.once('revertToPaper', () => {
      clearInterval(monitoringInterval);
      this.isMonitoring = false;
    });
  }

  // Perform live monitoring checks
  private async performLiveMonitoring(): Promise<void> {
    if (this.currentMode !== 'live') return;

    const livePerformance = this.calculatePerformance(this.liveTrades);
    
    // Check for emergency revert conditions
    const lossPercent = (Math.abs(livePerformance.netProfit) / this.currentLiveCapital) * 100;
    
    if (livePerformance.netProfit < 0 && lossPercent >= this.config.emergencyRevertThreshold) {
      console.log(`🚨 Emergency revert triggered: ${lossPercent.toFixed(2)}% loss exceeds threshold`);
      await this.revertToPaperTrading('Emergency loss threshold exceeded');
      return;
    }

    // Check for milestone achievements and capital scaling
    if (this.config.transitionMode === 'gradual') {
      await this.evaluateCapitalScaling(livePerformance);
    }

    this.emit('liveMonitoringUpdate', {
      performance: livePerformance,
      currentCapital: this.currentLiveCapital,
      lossPercent
    });
  }

  // Evaluate capital scaling for gradual transition
  private async evaluateCapitalScaling(performance: PerformanceMetrics): Promise<void> {
    // Scale up capital if performing well
    if (performance.totalTrades >= 10 && 
        performance.successRate >= this.config.minSuccessRate &&
        performance.netProfit > 0) {
      
      const newCapital = Math.min(
        this.currentLiveCapital * (1 + this.config.capitalIncrementPercent / 100),
        this.config.maxLiveCapital
      );

      if (newCapital > this.currentLiveCapital) {
        const oldCapital = this.currentLiveCapital;
        this.currentLiveCapital = newCapital;
        
        console.log(`📈 Capital scaled up: $${oldCapital} → $${newCapital}`);
        
        this.emit('capitalScaled', {
          oldCapital,
          newCapital,
          reason: 'Performance milestone achieved'
        });
      }
    }
  }

  // Revert to paper trading
  async revertToPaperTrading(reason: string): Promise<void> {
    console.log(`🔄 Reverting to paper trading: ${reason}`);
    
    try {
      // Close all live positions
      await unifiedExchangeManager.closeAllPositions();
      
      this.currentMode = 'paper';
      this.isMonitoring = false;
      
      // Reset risk management
      advancedRiskManager.updateConfig({
        maxDailyLoss: 1000,
        maxPositionSize: 10000,
        riskPerTrade: 1
      });

      this.emit('revertToPaper', {
        timestamp: new Date(),
        reason,
        finalLiveCapital: this.currentLiveCapital
      });

      console.log('✅ Successfully reverted to paper trading');

    } catch (error) {
      console.error('❌ Failed to revert to paper trading:', error);
      throw error;
    }
  }

  // Manual approval methods
  approveTransition(): void {
    this.approvalStatus = 'approved';
    console.log('✅ Transition to live trading approved');
    this.emit('transitionApproved', { timestamp: new Date() });
  }

  rejectTransition(reason: string): void {
    this.approvalStatus = 'rejected';
    console.log(`❌ Transition to live trading rejected: ${reason}`);
    this.emit('transitionRejected', { timestamp: new Date(), reason });
  }

  // Helper methods
  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      successRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      calmarRatio: 0,
      startDate: new Date(),
      endDate: new Date(),
      tradingDays: 0
    };
  }

  private calculateMaxDrawdown(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    let peak = 0;
    let maxDrawdown = 0;
    let runningProfit = 0;

    for (const trade of trades) {
      runningProfit += trade.profit || 0;
      
      if (runningProfit > peak) {
        peak = runningProfit;
      }
      
      const drawdown = peak - runningProfit;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return -maxDrawdown; // Return as negative value
  }

  private calculateSharpeRatio(trades: Trade[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.profit || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  }

  private calculateTradingDays(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    
    const startDate = trades[0].entryTime;
    const endDate = trades[trades.length - 1].exitTime || new Date();
    
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async evaluatePerformance(): Promise<void> {
    const status = await this.evaluateTransitionReadiness();
    
    console.log(`📊 Performance Update - Score: ${status.readinessScore}%`);
    console.log(`📊 Trades: ${status.paperPerformance.totalTrades}, Success Rate: ${status.paperPerformance.successRate.toFixed(1)}%`);
    
    this.emit('performanceUpdate', status);
  }

  private async performDailyAnalysis(): Promise<void> {
    console.log('📈 Performing daily performance analysis');
    
    const status = await this.evaluateTransitionReadiness();
    
    // Log milestone progress
    status.milestones.forEach(milestone => {
      const progress = (milestone.currentValue / milestone.requiredValue * 100).toFixed(1);
      console.log(`   ${milestone.name}: ${progress}% (${milestone.achieved ? '✅' : '❌'})`);
    });

    this.emit('dailyAnalysis', status);
  }

  // Public API methods
  async getStatus(): Promise<TransitionStatus> {
    return await this.evaluateTransitionReadiness();
  }

  updateConfig(newConfig: Partial<TransitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Transition configuration updated');
    this.emit('configUpdated', this.config);
  }

  getConfig(): TransitionConfig {
    return { ...this.config };
  }

  getTrades(mode?: 'paper' | 'live'): Trade[] {
    if (mode === 'paper') return [...this.paperTrades];
    if (mode === 'live') return [...this.liveTrades];
    return [...this.paperTrades, ...this.liveTrades];
  }

  getCurrentCapital(): number {
    return this.currentLiveCapital;
  }

  isLiveTrading(): boolean {
    return this.currentMode === 'live';
  }
}

// Default transition configuration
export const defaultTransitionConfig: TransitionConfig = {
  minSuccessRate: 60, // 60% win rate
  minProfitFactor: 1.5,
  minSharpeRatio: 1.0,
  minTradeCount: 50,
  maxDrawdown: 10, // 10% max drawdown
  evaluationPeriodDays: 30,
  transitionMode: 'gradual',
  initialLiveCapital: 1000,
  maxLiveCapital: 10000,
  capitalIncrementPercent: 25, // 25% increase on milestones
  requireManualApproval: true,
  emergencyRevertThreshold: 5, // 5% loss triggers revert
  liveMonitoringInterval: 5 * 60 * 1000 // 5 minutes
};

// Export singleton instance
export const paperToLiveManager = new PaperToLiveManager(defaultTransitionConfig);

export { PaperToLiveManager }; 