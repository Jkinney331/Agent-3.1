import { EventEmitter } from 'events';
import { unifiedExchangeManager } from '../unified-exchange-manager';
import { BaseOrderRequest, BasePosition, BaseAccount } from '../exchanges/base-exchange';

export interface RiskConfig {
  maxDailyLoss: number;
  maxPositionSize: number;
  maxLeverage: number;
  maxCorrelatedPositions: number;
  maxOrderSize: number;
  minAccountBalance: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  riskPerTrade: number; // % of account to risk per trade
  allowedSymbols: string[];
  blockedSymbols: string[];
  tradingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  emergencyStop: boolean;
}

export interface PositionSizingParams {
  accountBalance: number;
  riskPerTrade: number;
  entryPrice: number;
  stopLossPrice: number;
  symbol: string;
}

export interface RiskMetrics {
  dailyPnL: number;
  totalExposure: number;
  portfolioValue: number;
  utilisedMargin: number;
  freeMargin: number;
  marginLevel: number;
  openPositions: number;
  correlatedExposure: Map<string, number>;
  riskScore: number; // 0-100
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface RiskAlert {
  type: 'warning' | 'critical' | 'emergency';
  severity: number; // 1-10
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  recommendedAction: string;
  timestamp: Date;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  adjustedQuantity?: number;
  suggestedStopLoss?: number;
  suggestedTakeProfit?: number;
  riskScore?: number;
}

class AdvancedRiskManager extends EventEmitter {
  private config: RiskConfig;
  private positions: Map<string, BasePosition> = new Map();
  private accounts: Map<string, BaseAccount> = new Map();
  private dailyPnL: Map<string, number> = new Map(); // date -> PnL
  private alerts: RiskAlert[] = [];
  private isActive: boolean = true;
  private priceHistory: Map<string, number[]> = new Map();

  constructor(config: RiskConfig) {
    super();
    this.config = config;
    this.startRiskMonitoring();
  }

  // Real-time risk monitoring
  private startRiskMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      if (this.isActive) {
        this.performRiskChecks();
      }
    }, 30000);

    // Daily reset at midnight
    setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  // Pre-trade validation
  async validateOrder(orderReq: BaseOrderRequest, exchange: string): Promise<ValidationResult> {
    try {
      console.log(`🔍 Validating order: ${orderReq.symbol} ${orderReq.side} ${orderReq.quantity}`);

      // Emergency stop check
      if (this.config.emergencyStop) {
        return {
          allowed: false,
          reason: 'Emergency stop is active. All trading is suspended.'
        };
      }

      // Trading hours check
      if (!this.isWithinTradingHours()) {
        return {
          allowed: false,
          reason: 'Outside of allowed trading hours'
        };
      }

      // Symbol validation
      if (!this.isSymbolAllowed(orderReq.symbol)) {
        return {
          allowed: false,
          reason: `Symbol ${orderReq.symbol} is not in allowed list or is blocked`
        };
      }

      // Get current account and positions
      await this.updateAccountData(exchange);
      const account = this.accounts.get(exchange);
      if (!account) {
        return {
          allowed: false,
          reason: 'Unable to retrieve account information'
        };
      }

      // Account balance check
      if (account.availableBalance < this.config.minAccountBalance) {
        return {
          allowed: false,
          reason: `Account balance below minimum threshold (${this.config.minAccountBalance})`
        };
      }

      // Daily loss limit check
      const todaysPnL = this.getDailyPnL();
      if (todaysPnL <= -this.config.maxDailyLoss) {
        return {
          allowed: false,
          reason: `Daily loss limit reached: ${todaysPnL}`
        };
      }

      // Order size validation
      const orderValue = orderReq.quantity * (orderReq.price || 0);
      if (orderValue > this.config.maxOrderSize) {
        const adjustedQuantity = this.config.maxOrderSize / (orderReq.price || 1);
        return {
          allowed: true,
          adjustedQuantity,
          reason: `Order size adjusted to comply with maximum order size limit`
        };
      }

      // Position sizing validation
      const positionSizing = await this.calculatePositionSize({
        accountBalance: account.totalBalance,
        riskPerTrade: this.config.riskPerTrade,
        entryPrice: orderReq.price || 0,
        stopLossPrice: orderReq.stopPrice || 0,
        symbol: orderReq.symbol
      });



      // Calculate risk score
      const riskScore = this.calculateOrderRiskScore(orderReq, account);

      const result: ValidationResult = {
        allowed: true,
        riskScore,
        suggestedStopLoss: positionSizing.stopLoss,
        suggestedTakeProfit: positionSizing.takeProfit
      };

      console.log(`✅ Order validation passed. Risk score: ${riskScore}`);
      return result;

    } catch (error) {
      console.error('❌ Order validation failed:', error);
      return {
        allowed: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Advanced position sizing
  async calculatePositionSize(params: PositionSizingParams): Promise<{
    quantity: number;
    stopLoss: number;
    takeProfit: number;
    riskAmount: number;
  }> {
    const { accountBalance, riskPerTrade, entryPrice, stopLossPrice, symbol } = params;

    // Calculate risk amount
    const riskAmount = accountBalance * (riskPerTrade / 100);

    // Calculate stop loss if not provided
    let stopLoss = stopLossPrice;
    if (!stopLoss) {
      stopLoss = entryPrice * (1 - this.config.stopLossPercentage / 100);
    }

    // Calculate take profit
    const takeProfit = entryPrice * (1 + this.config.takeProfitPercentage / 100);

    // Calculate position size based on risk
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    const quantity = riskAmount / riskPerUnit;

    // Apply maximum position size limit
    const maxQuantity = this.config.maxPositionSize;
    const finalQuantity = Math.min(quantity, maxQuantity);

    console.log(`📊 Position sizing for ${symbol}:`);
    console.log(`  Risk amount: $${riskAmount.toFixed(2)}`);
    console.log(`  Calculated quantity: ${finalQuantity.toFixed(6)}`);
    console.log(`  Stop loss: $${stopLoss.toFixed(4)}`);
    console.log(`  Take profit: $${takeProfit.toFixed(4)}`);

    return {
      quantity: finalQuantity,
      stopLoss,
      takeProfit,
      riskAmount
    };
  }

  // Risk metrics calculation
  async calculateRiskMetrics(): Promise<RiskMetrics> {
    try {
      await this.updateAllData();

      let totalExposure = 0;
      let portfolioValue = 0;
      let utilisedMargin = 0;
      let freeMargin = 0;
      let openPositions = 0;

             // Aggregate metrics across all exchanges
       for (const [exchange, account] of Array.from(this.accounts.entries())) {
         portfolioValue += account.portfolioValue;
         freeMargin += account.availableBalance;
         
         if (account.margin) {
           utilisedMargin += account.margin;
         }
       }

             // Calculate position metrics
       for (const [symbol, position] of Array.from(this.positions.entries())) {
         totalExposure += Math.abs(position.marketValue);
         openPositions++;
       }

      const marginLevel = utilisedMargin > 0 ? (freeMargin / utilisedMargin) * 100 : 100;
      const dailyPnL = this.getDailyPnL();



      // Calculate risk score (0-100)
      const riskScore = this.calculatePortfolioRiskScore({
        totalExposure,
        portfolioValue,
        marginLevel,
        openPositions,
        dailyPnL
      });

      // Calculate performance metrics
      const maxDrawdown = this.calculateMaxDrawdown();
      const sharpeRatio = this.calculateSharpeRatio();

      return {
        dailyPnL,
        totalExposure,
        portfolioValue,
        utilisedMargin,
        freeMargin,
        marginLevel,
        openPositions,
        correlatedExposure: new Map<string, number>(), // Empty since correlation functionality was removed
        riskScore,
        maxDrawdown,
        sharpeRatio
      };
    } catch (error) {
      console.error('❌ Failed to calculate risk metrics:', error);
      throw error;
    }
  }

  // Real-time risk monitoring
  private async performRiskChecks(): Promise<void> {
    try {
      const metrics = await this.calculateRiskMetrics();
      const alerts: RiskAlert[] = [];

      // Daily loss check
      if (metrics.dailyPnL <= -this.config.maxDailyLoss * 0.8) {
        alerts.push({
          type: metrics.dailyPnL <= -this.config.maxDailyLoss ? 'critical' : 'warning',
          severity: 8,
          message: `Daily loss approaching/exceeding limit`,
          metric: 'dailyPnL',
          currentValue: metrics.dailyPnL,
          threshold: -this.config.maxDailyLoss,
          recommendedAction: 'Consider stopping trading or reducing position sizes',
          timestamp: new Date()
        });
      }

      // Exposure check
      const exposureRatio = metrics.totalExposure / metrics.portfolioValue;
      if (exposureRatio > 0.8) {
        alerts.push({
          type: exposureRatio > 1.0 ? 'critical' : 'warning',
          severity: 7,
          message: `Portfolio exposure is high`,
          metric: 'exposure',
          currentValue: exposureRatio,
          threshold: 1.0,
          recommendedAction: 'Reduce position sizes or close some positions',
          timestamp: new Date()
        });
      }

      // Margin level check
      if (metrics.marginLevel < 200) {
        alerts.push({
          type: metrics.marginLevel < 150 ? 'critical' : 'warning',
          severity: 9,
          message: `Margin level is low`,
          metric: 'marginLevel',
          currentValue: metrics.marginLevel,
          threshold: 200,
          recommendedAction: 'Add funds or close positions to increase margin level',
          timestamp: new Date()
        });
      }

      // Risk score check
      if (metrics.riskScore > 70) {
        alerts.push({
          type: metrics.riskScore > 85 ? 'critical' : 'warning',
          severity: 6,
          message: `Portfolio risk score is elevated`,
          metric: 'riskScore',
          currentValue: metrics.riskScore,
          threshold: 70,
          recommendedAction: 'Review and reduce high-risk positions',
          timestamp: new Date()
        });
      }

      // Process alerts
      if (alerts.length > 0) {
        this.processAlerts(alerts);
      }

      // Emit metrics update
      this.emit('riskMetricsUpdate', metrics);

    } catch (error) {
      console.error('❌ Risk monitoring error:', error);
    }
  }

  // Helper methods
     private async updateAccountData(exchange: string): Promise<void> {
     try {
       // For now, simulate account data - will be implemented with actual API calls
       const mockAccount: BaseAccount = {
         totalBalance: 10000,
         availableBalance: 8000,
         equity: 10000,
         portfolioValue: 10000
       };
       this.accounts.set(exchange, mockAccount);

       const positions = await unifiedExchangeManager.getPositions(exchange);
       for (const position of positions) {
         this.positions.set(`${exchange}_${position.symbol}`, position);
       }
     } catch (error) {
       console.error(`❌ Failed to update account data for ${exchange}:`, error);
     }
   }

  private async updateAllData(): Promise<void> {
    const exchanges = ['binance', 'alpaca']; // Get from config
    await Promise.all(exchanges.map(exchange => this.updateAccountData(exchange)));
  }

  private isWithinTradingHours(): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= this.config.tradingHours.start && 
           currentTime <= this.config.tradingHours.end;
  }

  private isSymbolAllowed(symbol: string): boolean {
    if (this.config.blockedSymbols.includes(symbol)) {
      return false;
    }
    
    if (this.config.allowedSymbols.length > 0) {
      return this.config.allowedSymbols.includes(symbol);
    }
    
    return true;
  }

  private getDailyPnL(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyPnL.get(today) || 0;
  }



  private calculateOrderRiskScore(order: BaseOrderRequest, account: BaseAccount): number {
    let score = 0;

    // Order size relative to account
    const orderValue = order.quantity * (order.price || 0);
    const sizeRatio = orderValue / account.totalBalance;
    score += Math.min(sizeRatio * 50, 30);

    // Leverage factor (if applicable)
    score += Math.min(this.config.maxLeverage * 2, 20);

    // Symbol volatility (simplified)
    const volatilityScore = this.getSymbolVolatility(order.symbol);
    score += volatilityScore;

    // Time of day factor
    const hourOfDay = new Date().getHours();
    if (hourOfDay < 8 || hourOfDay > 20) { // Outside major market hours
      score += 10;
    }

    return Math.min(Math.round(score), 100);
  }

  private getSymbolVolatility(symbol: string): number {
    // Simplified volatility calculation
    const highVolSymbols = ['BTCUSDT', 'ETHUSDT', 'DOGEUSD'];
    return highVolSymbols.includes(symbol) ? 15 : 5;
  }



  private calculatePortfolioRiskScore(params: {
    totalExposure: number;
    portfolioValue: number;
    marginLevel: number;
    openPositions: number;
    dailyPnL: number;
  }): number {
    let score = 0;

    // Exposure ratio
    const exposureRatio = params.totalExposure / params.portfolioValue;
    score += Math.min(exposureRatio * 40, 40);

    // Margin level
    if (params.marginLevel < 300) {
      score += (300 - params.marginLevel) / 5;
    }

    // Position count
    score += Math.min(params.openPositions * 2, 20);

    // Daily PnL impact
    if (params.dailyPnL < 0) {
      const lossRatio = Math.abs(params.dailyPnL) / params.portfolioValue;
      score += Math.min(lossRatio * 100, 30);
    }

    return Math.min(Math.round(score), 100);
  }

  private calculateMaxDrawdown(): number {
    // Simplified calculation - would use historical equity curve
    return 5.2; // Example value
  }

  private calculateSharpeRatio(): number {
    // Simplified calculation - would use returns history
    return 1.8; // Example value
  }

  private processAlerts(alerts: RiskAlert[]): void {
    for (const alert of alerts) {
      this.alerts.push(alert);
      
      console.log(`🚨 ${alert.type.toUpperCase()} ALERT: ${alert.message}`);
      console.log(`   Current: ${alert.currentValue}, Threshold: ${alert.threshold}`);
      console.log(`   Action: ${alert.recommendedAction}`);

      // Emit alert event
      this.emit('riskAlert', alert);

      // Auto-actions for critical alerts
      if (alert.type === 'critical' && alert.severity >= 9) {
        this.handleCriticalAlert(alert);
      }
    }

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
  }

  private async handleCriticalAlert(alert: RiskAlert): Promise<void> {
    console.log(`🚨 Handling critical alert: ${alert.message}`);

    switch (alert.metric) {
      case 'marginLevel':
        if (alert.currentValue < 120) {
          console.log('🚨 EMERGENCY: Initiating emergency position closure');
          await this.emergencyStop();
        }
        break;
      case 'dailyPnL':
        if (Math.abs(alert.currentValue) > this.config.maxDailyLoss) {
          console.log('🚨 EMERGENCY: Daily loss limit exceeded, stopping trading');
          this.config.emergencyStop = true;
        }
        break;
    }
  }

  private resetDailyMetrics(): void {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.dailyPnL.delete(yesterday);
    
    console.log('📊 Daily metrics reset');
  }

  // Public control methods
  async emergencyStop(): Promise<void> {
    console.log('🚨 EMERGENCY STOP ACTIVATED');
    this.config.emergencyStop = true;
    
    try {
      await unifiedExchangeManager.closeAllPositions();
      this.emit('emergencyStop', { timestamp: new Date(), reason: 'Risk management emergency stop' });
    } catch (error) {
      console.error('❌ Emergency stop failed:', error);
    }
  }

  resumeTrading(): void {
    console.log('✅ Trading resumed');
    this.config.emergencyStop = false;
    this.emit('tradingResumed', { timestamp: new Date() });
  }

  updateConfig(newConfig: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Risk management configuration updated');
    this.emit('configUpdated', this.config);
  }

  getConfig(): RiskConfig {
    return { ...this.config };
  }

  getAlerts(): RiskAlert[] {
    return [...this.alerts];
  }

  async getStatus(): Promise<{ active: boolean; metrics: RiskMetrics; alerts: RiskAlert[] }> {
    const metrics = await this.calculateRiskMetrics();
    return {
      active: this.isActive,
      metrics,
      alerts: this.alerts
    };
  }
}

// Default risk configuration
export const defaultRiskConfig: RiskConfig = {
  maxDailyLoss: 1000,
  maxPositionSize: 10000,
  maxLeverage: 3,
  maxCorrelatedPositions: 50000,
  maxOrderSize: 5000,
  minAccountBalance: 1000,
  stopLossPercentage: 2,
  takeProfitPercentage: 4,
  riskPerTrade: 1, // 1% of account per trade
  allowedSymbols: [], // Empty means all allowed
  blockedSymbols: ['DOGEUSD'], // Example blocked symbol
  tradingHours: {
    start: '09:00',
    end: '16:00',
    timezone: 'America/New_York'
  },
  emergencyStop: false
};

// Export singleton instance
export const advancedRiskManager = new AdvancedRiskManager(defaultRiskConfig);

export { AdvancedRiskManager }; 