import { aiReasoningEngine } from '../ai/reasoning-engine';
import { binanceClient } from './binance-client';

interface TradeExecutionResult {
  success: boolean;
  orderId?: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity?: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  reasoning: string[];
  confidence: number;
  riskReward: number;
  timestamp: Date;
  error?: string;
}

interface TradingConfig {
  enabled: boolean;
  maxPositions: number;
  maxCapitalPerTrade: number;
  defaultLeverage: number;
  stopLossPercentage: number;
  emergencyStop: boolean;
  paperTrading: boolean;
}

interface ActiveTrade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  orderId: string;
  timestamp: Date;
  confidence: number;
  reasoning: string[];
}

export class TradingExecutionEngine {
  private config: TradingConfig;
  private activeTrades: Map<string, ActiveTrade> = new Map();
  private tradeHistory: TradeExecutionResult[] = [];
  private isRunning: boolean = false;

  constructor(config: Partial<TradingConfig> = {}) {
    this.config = {
      enabled: true,
      maxPositions: 3,
      maxCapitalPerTrade: 5000, // $5000 max per trade
      defaultLeverage: 2, // Conservative 2x leverage
      stopLossPercentage: 2.0, // 2% stop loss
      emergencyStop: false,
      paperTrading: true, // Start with paper trading for safety
      ...config
    };
    
    console.log('🎯 Trading Execution Engine initialized:', this.config);
  }

  async executeAITradeSignal(symbol: string, capital: number): Promise<TradeExecutionResult> {
    console.log(`🚀 Executing AI trade signal for ${symbol} with $${capital} capital`);

    try {
      // Safety checks
      if (!this.config.enabled || this.config.emergencyStop) {
        return this.createTradeResult(false, symbol, 'HOLD', [], 0, 0, 'Trading disabled or emergency stop active');
      }

      if (this.activeTrades.size >= this.config.maxPositions) {
        return this.createTradeResult(false, symbol, 'HOLD', [], 0, 0, `Maximum positions (${this.config.maxPositions}) reached`);
      }

      // Get AI analysis
      const aiAnalysis = await this.getAIAnalysis(symbol, capital);
      if (!aiAnalysis.success) {
        return this.createTradeResult(false, symbol, 'HOLD', [], 0, 0, 'AI analysis failed');
      }

      const signal = aiAnalysis.signal;

      // Check if AI recommends trading
      if (signal.action === 'HOLD') {
        return this.createTradeResult(true, symbol, 'HOLD', signal.reasoning, signal.confidence, signal.riskReward, 'AI recommends HOLD');
      }

      // Execute the trade
      return await this.executeTrade(signal, capital);

    } catch (error) {
      console.error('❌ Trade execution error:', error);
      return this.createTradeResult(false, symbol, 'HOLD', [], 0, 0, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async getAIAnalysis(symbol: string, capital: number): Promise<any> {
    console.log(`🧠 Getting AI analysis for ${symbol} with $${capital} capital`);
    
    try {
      // Call our AI analysis API
      const response = await fetch(`http://localhost:3000/api/ai-analysis?symbol=${symbol}&capital=${capital}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ AI Analysis API error: ${response.status} ${response.statusText}`);
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      console.log(`✅ AI Analysis response:`, data);

      if (!data.success) {
        console.error('❌ AI Analysis failed:', data.error);
        return { success: false, error: data.error };
      }

      // Return the analysis in the expected format
      return {
        success: true,
        signal: {
          symbol: data.symbol,
          action: data.analysis.action,
          confidence: data.analysis.confidence,
          reasoning: data.analysis.reasoning,
          riskReward: data.analysis.riskReward,
          positionSize: data.analysis.positionSize,
          stopLoss: data.analysis.stopLoss,
          takeProfit: data.analysis.takeProfit
        }
      };

    } catch (error) {
      console.error('❌ AI Analysis request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeTrade(signal: any, capital: number): Promise<TradeExecutionResult> {
    const { symbol, action, confidence, riskReward, reasoning, positionSize, stopLoss, takeProfit } = signal;
    
    console.log(`💰 Executing ${action} trade for ${symbol}:`, {
      confidence: `${confidence}%`,
      riskReward: `${riskReward}:1`,
      positionSize: `${(positionSize * 100).toFixed(1)}%`
    });

    try {
      // Convert symbol to Binance format
      const binanceSymbol = binanceClient.formatSymbol(symbol);
      
      // Calculate trade size
      const tradeCapital = Math.min(capital * positionSize, this.config.maxCapitalPerTrade);
      
      if (this.config.paperTrading) {
        // Paper trading simulation
        return await this.executePaperTrade(binanceSymbol, action, tradeCapital, stopLoss, takeProfit, reasoning, confidence, riskReward);
      } else {
        // Live trading
        return await this.executeLiveTrade(binanceSymbol, action, tradeCapital, stopLoss, takeProfit, reasoning, confidence, riskReward);
      }

    } catch (error) {
      console.error('❌ Trade execution failed:', error);
      return this.createTradeResult(false, symbol, action, reasoning, confidence, riskReward, error instanceof Error ? error.message : 'Execution failed');
    }
  }

  private async executePaperTrade(
    symbol: string, 
    action: 'BUY' | 'SELL', 
    capital: number,
    stopLoss: number,
    takeProfit: number,
    reasoning: string[],
    confidence: number,
    riskReward: number
  ): Promise<TradeExecutionResult> {
    console.log(`📝 Paper Trading: ${action} ${symbol} with $${capital}`);

    try {
      // Get current price for simulation
      const currentPrice = await binanceClient.getSymbolPrice(symbol);
      const quantity = capital / currentPrice;

      // Create mock trade entry
      const tradeId = `paper_${Date.now()}`;
      const activeTrade: ActiveTrade = {
        id: tradeId,
        symbol,
        side: action === 'BUY' ? 'LONG' : 'SHORT',
        quantity,
        entryPrice: currentPrice,
        stopLoss,
        takeProfit,
        orderId: tradeId,
        timestamp: new Date(),
        confidence,
        reasoning
      };

      this.activeTrades.set(symbol, activeTrade);

      console.log(`✅ Paper trade executed: ${action} ${quantity.toFixed(6)} ${symbol} at $${currentPrice}`);

      return this.createTradeResult(
        true, 
        symbol, 
        action, 
        reasoning, 
        confidence, 
        riskReward, 
        `Paper trade executed: ${quantity.toFixed(6)} ${symbol} at $${currentPrice}`,
        quantity,
        currentPrice,
        stopLoss,
        takeProfit,
        tradeId
      );

    } catch (error) {
      console.error('❌ Paper trade failed:', error);
      return this.createTradeResult(false, symbol, action, reasoning, confidence, riskReward, error instanceof Error ? error.message : 'Paper trade failed');
    }
  }

  private async executeLiveTrade(
    symbol: string, 
    action: 'BUY' | 'SELL', 
    capital: number,
    stopLoss: number,
    takeProfit: number,
    reasoning: string[],
    confidence: number,
    riskReward: number
  ): Promise<TradeExecutionResult> {
    console.log(`🔴 LIVE Trading: ${action} ${symbol} with $${capital}`);

    try {
      // Test connection first
      const connected = await binanceClient.testConnection();
      if (!connected) {
        throw new Error('Binance connection test failed');
      }

      // Get current price and account info
      const [currentPrice, accountBalance] = await Promise.all([
        binanceClient.getSymbolPrice(symbol),
        binanceClient.getAccountBalance()
      ]);

      if (accountBalance < capital) {
        throw new Error(`Insufficient balance: $${accountBalance} < $${capital}`);
      }

      // Set leverage
      await binanceClient.setLeverage(symbol, this.config.defaultLeverage);

      // Calculate position size
      const quantity = binanceClient.calculatePositionSize(
        accountBalance,
        this.config.stopLossPercentage,
        currentPrice,
        stopLoss,
        this.config.defaultLeverage
      );

      // Execute market order
      let order;
      if (action === 'BUY') {
        order = await binanceClient.createMarketBuy(symbol, quantity);
      } else {
        order = await binanceClient.createMarketSell(symbol, quantity);
      }

      console.log(`✅ Live order executed:`, order);

      // Set stop loss and take profit
      const stopLossOrder = await binanceClient.createStopLoss(
        symbol,
        action === 'BUY' ? 'SELL' : 'BUY',
        quantity,
        stopLoss
      );

      const takeProfitOrder = await binanceClient.createTakeProfit(
        symbol,
        action === 'BUY' ? 'SELL' : 'BUY',
        quantity,
        takeProfit
      );

      // Track active trade
      const activeTrade: ActiveTrade = {
        id: order.orderId.toString(),
        symbol,
        side: action === 'BUY' ? 'LONG' : 'SHORT',
        quantity,
        entryPrice: parseFloat(order.avgPrice || order.price || currentPrice.toString()),
        stopLoss,
        takeProfit,
        orderId: order.orderId.toString(),
        timestamp: new Date(),
        confidence,
        reasoning
      };

      this.activeTrades.set(symbol, activeTrade);

      return this.createTradeResult(
        true,
        symbol,
        action,
        reasoning,
        confidence,
        riskReward,
        `Live trade executed: Order ID ${order.orderId}`,
        quantity,
        activeTrade.entryPrice,
        stopLoss,
        takeProfit,
        order.orderId.toString()
      );

    } catch (error) {
      console.error('❌ Live trade failed:', error);
      return this.createTradeResult(false, symbol, action, reasoning, confidence, riskReward, error instanceof Error ? error.message : 'Live trade failed');
    }
  }

  private createTradeResult(
    success: boolean,
    symbol: string,
    action: 'BUY' | 'SELL' | 'HOLD',
    reasoning: string[],
    confidence: number,
    riskReward: number,
    message: string,
    quantity?: number,
    price?: number,
    stopLoss?: number,
    takeProfit?: number,
    orderId?: string
  ): TradeExecutionResult {
    const result: TradeExecutionResult = {
      success,
      symbol,
      action,
      reasoning,
      confidence,
      riskReward,
      timestamp: new Date(),
      ...(quantity && { quantity }),
      ...(price && { price }),
      ...(stopLoss && { stopLoss }),
      ...(takeProfit && { takeProfit }),
      ...(orderId && { orderId }),
      ...(success ? {} : { error: message })
    };

    // Add to trade history
    this.tradeHistory.push(result);

    // Log result
    if (success) {
      console.log(`✅ Trade Result: ${message}`);
    } else {
      console.log(`❌ Trade Failed: ${message}`);
    }

    return result;
  }

  // Portfolio Management
  async getActivePositions(): Promise<ActiveTrade[]> {
    return Array.from(this.activeTrades.values());
  }

  async closePosition(symbol: string, reason: string = 'Manual close'): Promise<TradeExecutionResult> {
    const activeTrade = this.activeTrades.get(symbol);
    if (!activeTrade) {
      throw new Error(`No active position found for ${symbol}`);
    }

    console.log(`🔄 Closing position for ${symbol}: ${reason}`);

    try {
      if (this.config.paperTrading) {
        // Paper trading - simulate close
        const currentPrice = await binanceClient.getSymbolPrice(symbol);
        const pnl = activeTrade.side === 'LONG' 
          ? (currentPrice - activeTrade.entryPrice) * activeTrade.quantity
          : (activeTrade.entryPrice - currentPrice) * activeTrade.quantity;

        this.activeTrades.delete(symbol);

        return this.createTradeResult(
          true,
          symbol,
          activeTrade.side === 'LONG' ? 'SELL' : 'BUY',
          [`Position closed: ${reason}`, `P&L: $${pnl.toFixed(2)}`],
          100,
          Math.abs(pnl) / (activeTrade.entryPrice * activeTrade.quantity),
          `Paper position closed with P&L: $${pnl.toFixed(2)}`,
          activeTrade.quantity,
          currentPrice
        );
      } else {
        // Live trading - close position
        const closeOrder = await binanceClient.closePosition(symbol);
        this.activeTrades.delete(symbol);

        return this.createTradeResult(
          true,
          symbol,
          activeTrade.side === 'LONG' ? 'SELL' : 'BUY',
          [`Position closed: ${reason}`],
          100,
          1,
          `Live position closed: Order ID ${closeOrder.orderId}`,
          activeTrade.quantity,
          parseFloat(closeOrder.avgPrice || closeOrder.price),
          undefined,
          undefined,
          closeOrder.orderId.toString()
        );
      }
    } catch (error) {
      console.error('❌ Position close failed:', error);
      throw error;
    }
  }

  async closeAllPositions(reason: string = 'Emergency close'): Promise<TradeExecutionResult[]> {
    console.log(`🚨 Closing ALL positions: ${reason}`);
    
    const results: TradeExecutionResult[] = [];
    const symbols = Array.from(this.activeTrades.keys());

    for (const symbol of symbols) {
      try {
        const result = await this.closePosition(symbol, reason);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to close position for ${symbol}:`, error);
        results.push(this.createTradeResult(
          false,
          symbol,
          'HOLD',
          [`Failed to close position: ${reason}`],
          0,
          0,
          error instanceof Error ? error.message : 'Unknown error'
        ));
      }
    }

    return results;
  }

  // Configuration Management
  updateConfig(newConfig: Partial<TradingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Trading config updated:', this.config);
  }

  enableEmergencyStop(): void {
    this.config.emergencyStop = true;
    console.log('🛑 EMERGENCY STOP ACTIVATED');
  }

  disableEmergencyStop(): void {
    this.config.emergencyStop = false;
    console.log('✅ Emergency stop deactivated');
  }

  switchToPaperTrading(): void {
    this.config.paperTrading = true;
    console.log('📝 Switched to paper trading mode');
  }

  switchToLiveTrading(): void {
    this.config.paperTrading = false;
    console.log('🔴 Switched to LIVE trading mode');
  }

  // Statistics and Monitoring
  getTradeHistory(): TradeExecutionResult[] {
    return [...this.tradeHistory];
  }

  getPerformanceStats(): {
    totalTrades: number;
    successfulTrades: number;
    winRate: number;
    activeTrades: number;
    totalPnL: number;
    avgConfidence: number;
  } {
    const successful = this.tradeHistory.filter(t => t.success);
    const totalPnL = this.calculateTotalPnL();
    const avgConfidence = this.tradeHistory.length > 0 
      ? this.tradeHistory.reduce((sum, t) => sum + t.confidence, 0) / this.tradeHistory.length 
      : 0;

    return {
      totalTrades: this.tradeHistory.length,
      successfulTrades: successful.length,
      winRate: this.tradeHistory.length > 0 ? (successful.length / this.tradeHistory.length) * 100 : 0,
      activeTrades: this.activeTrades.size,
      totalPnL,
      avgConfidence
    };
  }

  private calculateTotalPnL(): number {
    // This would calculate P&L from trade history
    // For now, return 0 as we'd need historical price data
    return 0;
  }

  getConfig(): TradingConfig {
    return { ...this.config };
  }

  isEmergencyStopActive(): boolean {
    return this.config.emergencyStop;
  }

  isPaperTrading(): boolean {
    return this.config.paperTrading;
  }
}

// Export singleton instance
export const tradingEngine = new TradingExecutionEngine(); 