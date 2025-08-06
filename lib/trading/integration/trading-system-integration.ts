import { EventEmitter } from 'events';
import { dynamicStopCalculator, DynamicStopConfig } from '../dynamic-trailing-stops';
import { aiReasoningEngine } from '../../ai/reasoning-engine';
import { advancedRiskManager } from '../risk/advanced-risk-manager';
import { TradingBotServer } from '../../telegram/bot-server';
import { Position, TradingSignal, CandlestickData } from '../../../types/trading';

/**
 * Central Integration System for Trading Bot Components
 * Coordinates between AI, Trading Engines, Dynamic Stops, and Telegram Bot
 */
export class TradingSystemIntegration extends EventEmitter {
  private isRunning: boolean = false;
  private telegramBot?: TradingBotServer;
  private dynamicStopsEnabled: boolean = true;
  private aiLearningEnabled: boolean = true;
  private notificationsEnabled: boolean = true;
  
  // Performance metrics
  private metrics = {
    tradesExecuted: 0,
    stopUpdates: 0,
    aiSignals: 0,
    notifications: 0,
    startTime: new Date(),
    lastActivity: new Date()
  };

  constructor() {
    super();
    this.setupEventListeners();
    console.log('🔗 Trading System Integration initialized');
  }

  /**
   * Initialize the complete trading system
   */
  async initialize(config?: {
    telegramBot?: TradingBotServer;
    dynamicStopsConfig?: Partial<DynamicStopConfig>;
    enableAILearning?: boolean;
    enableNotifications?: boolean;
  }): Promise<void> {
    try {
      console.log('🚀 Initializing Trading System Integration...');
      
      // Store configuration
      if (config?.telegramBot) {
        this.telegramBot = config.telegramBot;
      }
      
      this.aiLearningEnabled = config?.enableAILearning ?? true;
      this.notificationsEnabled = config?.enableNotifications ?? true;
      
      // Configure dynamic stops
      if (config?.dynamicStopsConfig) {
        dynamicStopCalculator.updateConfig(config.dynamicStopsConfig);
      }

      // Initialize AI reasoning engine if enabled
      if (this.aiLearningEnabled) {
        await this.initializeAIIntegration();
      }

      // Initialize dynamic stops
      await this.initializeDynamicStops();
      
      // Initialize risk management integration
      await this.initializeRiskManagement();
      
      // Initialize notification system
      if (this.notificationsEnabled && this.telegramBot) {
        await this.initializeNotifications();
      }

      this.isRunning = true;
      this.metrics.startTime = new Date();
      
      console.log('✅ Trading System Integration initialized successfully');
      this.emit('initialized', { timestamp: new Date() });
      
    } catch (error) {
      console.error('❌ Failed to initialize Trading System Integration:', error);
      throw error;
    }
  }

  /**
   * Process a trading signal through the complete pipeline
   */
  async processTradingSignal(signal: TradingSignal, marketData?: CandlestickData[]): Promise<{
    shouldExecute: boolean;
    adjustedSignal: TradingSignal;
    riskAssessment: any;
    stopLossPrice?: number;
  }> {
    try {
      console.log(`📊 Processing trading signal for ${signal.symbol}: ${signal.action}`);
      this.metrics.aiSignals++;
      this.metrics.lastActivity = new Date();

      // Step 1: Risk assessment
      const riskAssessment = await this.assessTradeRisk(signal);
      
      // Step 2: AI confidence validation
      const aiValidation = await this.validateWithAI(signal, marketData);
      
      // Step 3: Calculate optimal stop loss with dynamic stops
      let stopLossPrice: number | undefined;
      if (this.dynamicStopsEnabled && signal.action !== 'HOLD') {
        stopLossPrice = await this.calculateOptimalStopLoss(signal, marketData);
      }

      // Step 4: Adjust signal based on assessments
      const adjustedSignal = await this.adjustSignalBasedOnRisk(signal, riskAssessment, aiValidation);
      
      // Step 5: Final execution decision
      const shouldExecute = this.makeExecutionDecision(adjustedSignal, riskAssessment, aiValidation);

      // Step 6: Send notifications if enabled
      if (this.notificationsEnabled) {
        await this.sendTradingNotification(adjustedSignal, shouldExecute, riskAssessment);
      }

      console.log(`🎯 Signal processed: ${shouldExecute ? 'EXECUTE' : 'REJECT'} ${adjustedSignal.action} for ${signal.symbol}`);
      
      this.emit('signalProcessed', {
        originalSignal: signal,
        adjustedSignal,
        shouldExecute,
        riskAssessment,
        stopLossPrice,
        timestamp: new Date()
      });

      return {
        shouldExecute,
        adjustedSignal,
        riskAssessment,
        stopLossPrice
      };

    } catch (error) {
      console.error(`❌ Failed to process trading signal for ${signal.symbol}:`, error);
      throw error;
    }
  }

  /**
   * Handle position opening and integrate with dynamic stops
   */
  async handlePositionOpened(position: Position, marketData?: CandlestickData[]): Promise<void> {
    try {
      console.log(`📈 New position opened: ${position.symbol} (${position.side})`);
      this.metrics.tradesExecuted++;
      this.metrics.lastActivity = new Date();

      // Add to dynamic stops management
      if (this.dynamicStopsEnabled && position.stopLoss) {
        await dynamicStopCalculator.addPosition(position, position.stopLoss, marketData);
        console.log(`🎯 Position ${position.id} added to dynamic stops management`);
      }

      // Send notification
      if (this.notificationsEnabled && this.telegramBot) {
        await this.sendPositionNotification('opened', position);
      }

      // Update AI learning system
      if (this.aiLearningEnabled) {
        await this.updateAILearning('position_opened', position);
      }

      this.emit('positionOpened', position);

    } catch (error) {
      console.error(`❌ Failed to handle position opening for ${position.id}:`, error);
    }
  }

  /**
   * Handle position closing and cleanup
   */
  async handlePositionClosed(position: Position, reason: string = 'manual'): Promise<void> {
    try {
      console.log(`📉 Position closed: ${position.symbol} (${reason})`);
      this.metrics.lastActivity = new Date();

      // Remove from dynamic stops
      if (this.dynamicStopsEnabled) {
        dynamicStopCalculator.removePosition(position.id);
        console.log(`🗑️ Position ${position.id} removed from dynamic stops`);
      }

      // Send notification
      if (this.notificationsEnabled && this.telegramBot) {
        await this.sendPositionNotification('closed', position, reason);
      }

      // Update AI learning system
      if (this.aiLearningEnabled) {
        await this.updateAILearning('position_closed', position, { reason });
      }

      this.emit('positionClosed', { position, reason });

    } catch (error) {
      console.error(`❌ Failed to handle position closing for ${position.id}:`, error);
    }
  }

  /**
   * Start the integrated trading system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Trading System Integration is already running');
      return;
    }

    try {
      console.log('🚀 Starting Trading System Integration...');

      // Start dynamic stops calculator
      if (this.dynamicStopsEnabled) {
        dynamicStopCalculator.start();
        console.log('✅ Dynamic stops calculator started');
      }

      // Start Telegram bot if configured
      if (this.telegramBot && this.notificationsEnabled) {
        await this.telegramBot.start();
        console.log('✅ Telegram bot started');
      }

      this.isRunning = true;
      console.log('✅ Trading System Integration started successfully');
      
      this.emit('started', { timestamp: new Date() });

    } catch (error) {
      console.error('❌ Failed to start Trading System Integration:', error);
      throw error;
    }
  }

  /**
   * Stop the integrated trading system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Trading System Integration is not running');
      return;
    }

    try {
      console.log('🛑 Stopping Trading System Integration...');

      // Stop dynamic stops calculator
      if (this.dynamicStopsEnabled) {
        dynamicStopCalculator.stop();
        console.log('✅ Dynamic stops calculator stopped');
      }

      // Stop Telegram bot
      if (this.telegramBot) {
        await this.telegramBot.stop();
        console.log('✅ Telegram bot stopped');
      }

      this.isRunning = false;
      console.log('✅ Trading System Integration stopped successfully');
      
      this.emit('stopped', { timestamp: new Date() });

    } catch (error) {
      console.error('❌ Failed to stop Trading System Integration:', error);
      throw error;
    }
  }

  // Private implementation methods

  private setupEventListeners(): void {
    // Dynamic stops events
    dynamicStopCalculator.on('stopUpdated', this.handleStopUpdate.bind(this));
    dynamicStopCalculator.on('positionAdded', this.handleDynamicStopAdded.bind(this));
    dynamicStopCalculator.on('positionRemoved', this.handleDynamicStopRemoved.bind(this));
  }

  private async initializeAIIntegration(): Promise<void> {
    console.log('🧠 Initializing AI integration...');
    // AI reasoning engine is already initialized globally
    // Additional setup can be added here if needed
  }

  private async initializeDynamicStops(): Promise<void> {
    console.log('🎯 Initializing dynamic stops integration...');
    // Dynamic stops calculator is already initialized globally
    // Additional setup can be added here if needed
  }

  private async initializeRiskManagement(): Promise<void> {
    console.log('⚖️ Initializing risk management integration...');
    // Risk manager integration is already available
    // Additional setup can be added here if needed
  }

  private async initializeNotifications(): Promise<void> {
    console.log('📱 Initializing notification system...');
    // Telegram bot initialization is handled in start() method
  }

  private async assessTradeRisk(signal: TradingSignal): Promise<any> {
    try {
      // Basic risk assessment
      const riskAssessment = {
        riskLevel: 'LOW',
        maxPositionSize: 0.05, // 5%
        requiredConfidence: 60,
        stopLossRequired: true,
        takeProfitRecommended: true,
        warnings: [] as string[]
      };

      // Adjust based on signal characteristics
      if (signal.confidence < 70) {
        riskAssessment.riskLevel = 'MEDIUM';
        riskAssessment.maxPositionSize = 0.03; // 3%
        riskAssessment.requiredConfidence = 70;
        riskAssessment.warnings.push('Low confidence signal');
      }

      if (signal.riskReward < 2.0) {
        riskAssessment.riskLevel = 'HIGH';
        riskAssessment.maxPositionSize = 0.02; // 2%
        riskAssessment.warnings.push('Poor risk/reward ratio');
      }

      if (signal.marketRegime === 'VOLATILE') {
        riskAssessment.maxPositionSize *= 0.7; // Reduce position size in volatile markets
        riskAssessment.warnings.push('High market volatility detected');
      }

      return riskAssessment;

    } catch (error) {
      console.error('❌ Failed to assess trade risk:', error);
      return {
        riskLevel: 'HIGH',
        maxPositionSize: 0.01,
        requiredConfidence: 80,
        stopLossRequired: true,
        warnings: ['Risk assessment failed - using conservative defaults']
      };
    }
  }

  private async validateWithAI(signal: TradingSignal, marketData?: CandlestickData[]): Promise<any> {
    try {
      // Re-validate signal with current market conditions
      const validation = {
        aiApproved: true,
        confidenceAdjustment: 0,
        recommendations: [] as string[]
      };

      // Check if market conditions have changed significantly
      if (marketData && marketData.length > 0) {
        const latestPrice = marketData[marketData.length - 1].close;
        const priceChange = Math.abs(latestPrice - signal.indicators.macd.signal) / signal.indicators.macd.signal;
        
        if (priceChange > 0.02) { // 2% price change
          validation.confidenceAdjustment = -10;
          validation.recommendations.push('Significant price movement since signal generation');
        }
      }

      // Additional AI validation logic can be added here
      return validation;

    } catch (error) {
      console.error('❌ Failed to validate with AI:', error);
      return {
        aiApproved: false,
        confidenceAdjustment: -20,
        recommendations: ['AI validation failed - proceed with caution']
      };
    }
  }

  private async calculateOptimalStopLoss(signal: TradingSignal, marketData?: CandlestickData[]): Promise<number> {
    try {
      // Use dynamic stops calculator to get optimal stop distance
      const optimalDistance = await dynamicStopCalculator.getOptimalStopDistance(
        signal.symbol,
        signal.indicators.macd.signal, // Use current price approximation
        signal.action === 'BUY' ? 'LONG' : 'SHORT',
        signal.confidence,
        signal.marketRegime
      );

      // Calculate stop price based on optimal distance
      const currentPrice = signal.indicators.macd.signal; // Approximation
      if (signal.action === 'BUY') {
        return currentPrice * (1 - optimalDistance / 100);
      } else {
        return currentPrice * (1 + optimalDistance / 100);
      }

    } catch (error) {
      console.error('❌ Failed to calculate optimal stop loss:', error);
      return signal.stopLoss; // Fallback to original stop loss
    }
  }

  private async adjustSignalBasedOnRisk(
    signal: TradingSignal, 
    riskAssessment: any, 
    aiValidation: any
  ): Promise<TradingSignal> {
    const adjustedSignal = { ...signal };

    // Adjust confidence
    adjustedSignal.confidence += aiValidation.confidenceAdjustment;
    adjustedSignal.confidence = Math.max(0, Math.min(100, adjustedSignal.confidence));

    // Adjust position size based on risk
    adjustedSignal.positionSize = Math.min(
      adjustedSignal.positionSize,
      riskAssessment.maxPositionSize
    );

    // Add risk-based reasoning
    adjustedSignal.reasoning.push(...riskAssessment.warnings);
    adjustedSignal.reasoning.push(...aiValidation.recommendations);

    return adjustedSignal;
  }

  private makeExecutionDecision(
    signal: TradingSignal, 
    riskAssessment: any, 
    aiValidation: any
  ): boolean {
    // Check minimum confidence
    if (signal.confidence < riskAssessment.requiredConfidence) {
      console.log(`❌ Signal rejected: Confidence ${signal.confidence}% < required ${riskAssessment.requiredConfidence}%`);
      return false;
    }

    // Check AI approval
    if (!aiValidation.aiApproved) {
      console.log('❌ Signal rejected: AI validation failed');
      return false;
    }

    // Check if action is HOLD
    if (signal.action === 'HOLD') {
      console.log('⏸️ Signal is HOLD - no execution needed');
      return false;
    }

    console.log('✅ Signal approved for execution');
    return true;
  }

  private async handleStopUpdate(update: any): Promise<void> {
    try {
      console.log(`🎯 Stop updated for ${update.symbol}: ${update.oldStop} -> ${update.newStop}`);
      this.metrics.stopUpdates++;
      this.metrics.lastActivity = new Date();

      // Send notification about stop update
      if (this.notificationsEnabled && this.telegramBot) {
        const message = `🎯 <b>Stop Loss Updated</b>\n\n` +
          `Symbol: ${update.symbol}\n` +
          `Old Stop: $${update.oldStop.toFixed(2)}\n` +
          `New Stop: $${update.newStop.toFixed(2)}\n` +
          `Reason: ${update.reason}\n` +
          `Confidence: ${update.confidence.toFixed(1)}%`;

        // This would need actual user IDs in production
        await this.sendBroadcastNotification(message);
      }

      this.emit('stopUpdated', update);

    } catch (error) {
      console.error('❌ Failed to handle stop update:', error);
    }
  }

  private async handleDynamicStopAdded(event: any): Promise<void> {
    console.log(`📊 Position ${event.positionId} added to dynamic stops`);
    this.emit('dynamicStopAdded', event);
  }

  private async handleDynamicStopRemoved(event: any): Promise<void> {
    console.log(`🗑️ Position ${event.positionId} removed from dynamic stops`);
    this.emit('dynamicStopRemoved', event);
  }

  private async sendTradingNotification(
    signal: TradingSignal, 
    shouldExecute: boolean, 
    riskAssessment: any
  ): Promise<void> {
    try {
      if (!this.telegramBot) return;

      const status = shouldExecute ? '✅ APPROVED' : '❌ REJECTED';
      const emoji = signal.action === 'BUY' ? '📈' : signal.action === 'SELL' ? '📉' : '⏸️';
      
      const message = `${emoji} <b>Trading Signal ${status}</b>\n\n` +
        `Symbol: ${signal.symbol}\n` +
        `Action: ${signal.action}\n` +
        `Confidence: ${signal.confidence.toFixed(1)}%\n` +
        `Risk/Reward: ${signal.riskReward.toFixed(2)}\n` +
        `Position Size: ${(signal.positionSize * 100).toFixed(1)}%\n` +
        `Risk Level: ${riskAssessment.riskLevel}\n\n` +
        `<b>Reasoning:</b>\n${signal.reasoning.slice(-3).join('\n')}`;

      await this.sendBroadcastNotification(message);
      this.metrics.notifications++;

    } catch (error) {
      console.error('❌ Failed to send trading notification:', error);
    }
  }

  private async sendPositionNotification(
    action: 'opened' | 'closed', 
    position: Position, 
    reason?: string
  ): Promise<void> {
    try {
      if (!this.telegramBot) return;

      const emoji = action === 'opened' ? '🚀' : '🏁';
      const actionText = action === 'opened' ? 'OPENED' : 'CLOSED';
      
      let message = `${emoji} <b>Position ${actionText}</b>\n\n` +
        `Symbol: ${position.symbol}\n` +
        `Side: ${position.side}\n` +
        `Size: ${position.quantity}\n` +
        `Entry: $${position.entryPrice.toFixed(2)}\n`;

      if (action === 'closed' && reason) {
        message += `Reason: ${reason}\n`;
      }

      if (position.unrealizedPnL !== 0) {
        const pnlEmoji = position.unrealizedPnL > 0 ? '💰' : '💸';
        message += `P&L: ${pnlEmoji} $${position.unrealizedPnL.toFixed(2)} (${position.unrealizedPnLPercentage.toFixed(2)}%)`;
      }

      await this.sendBroadcastNotification(message);
      this.metrics.notifications++;

    } catch (error) {
      console.error('❌ Failed to send position notification:', error);
    }
  }

  private async sendBroadcastNotification(message: string): Promise<void> {
    try {
      if (!this.telegramBot) return;
      
      // In a real implementation, this would broadcast to authorized users
      // For now, we'll just log the message
      console.log('📱 Broadcast notification:', message.replace(/<[^>]*>/g, ''));
      
      // Actual broadcast would be:
      // await this.telegramBot.broadcastMessage(message);
      
    } catch (error) {
      console.error('❌ Failed to send broadcast notification:', error);
    }
  }

  private async updateAILearning(event: string, data: any, metadata?: any): Promise<void> {
    try {
      if (!this.aiLearningEnabled) return;

      // AI learning integration would be implemented here
      // This would feed trading results back to the AI system for learning
      console.log(`🧠 AI Learning update: ${event}`, { data: data.symbol || data.id, metadata });
      
      // In a real implementation, this would:
      // 1. Store trading results
      // 2. Analyze success/failure patterns
      // 3. Update AI model parameters
      // 4. Improve future predictions

    } catch (error) {
      console.error('❌ Failed to update AI learning:', error);
    }
  }

  // Public getter methods

  public getMetrics(): typeof this.metrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime.getTime(),
      isRunning: this.isRunning
    };
  }

  public getStatus(): {
    isRunning: boolean;
    dynamicStopsEnabled: boolean;
    aiLearningEnabled: boolean;
    notificationsEnabled: boolean;
    activeStops: number;
    metrics: any;
  } {
    return {
      isRunning: this.isRunning,
      dynamicStopsEnabled: this.dynamicStopsEnabled,
      aiLearningEnabled: this.aiLearningEnabled,
      notificationsEnabled: this.notificationsEnabled,
      activeStops: dynamicStopCalculator.getActiveStops().length,
      metrics: this.getMetrics()
    };
  }

  public updateConfiguration(config: {
    dynamicStopsEnabled?: boolean;
    aiLearningEnabled?: boolean;
    notificationsEnabled?: boolean;
  }): void {
    if (config.dynamicStopsEnabled !== undefined) {
      this.dynamicStopsEnabled = config.dynamicStopsEnabled;
    }
    if (config.aiLearningEnabled !== undefined) {
      this.aiLearningEnabled = config.aiLearningEnabled;
    }
    if (config.notificationsEnabled !== undefined) {
      this.notificationsEnabled = config.notificationsEnabled;
    }

    console.log('⚙️ Trading system configuration updated:', config);
    this.emit('configurationUpdated', config);
  }
}

// Export singleton instance
export const tradingSystemIntegration = new TradingSystemIntegration();