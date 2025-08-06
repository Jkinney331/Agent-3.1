import { EventEmitter } from 'events';
import { aiReasoningEngine } from '../ai/reasoning-engine';
import { advancedRiskManager } from './risk/advanced-risk-manager';
import { CandlestickData, Position, MarketRegime } from '../../types/trading';

// Core interfaces for Dynamic Trailing Stops
export interface DynamicStopConfig {
  // Base configuration
  baseTrailingPercentage: number; // Default trailing percentage (e.g., 2%)
  
  // Volatility-based adjustments
  volatilityMultiplier: number; // Multiplier for ATR-based adjustments (e.g., 1.5)
  atrPeriod: number; // Period for ATR calculation (e.g., 14)
  minStopDistance: number; // Minimum stop distance as percentage (e.g., 0.5%)
  maxStopDistance: number; // Maximum stop distance as percentage (e.g., 10%)
  
  // AI confidence integration
  aiConfidenceThresholds: {
    high: number; // e.g., 80% - tighten stops
    medium: number; // e.g., 60% - normal stops
    low: number; // e.g., 40% - widen stops
  };
  confidenceMultipliers: {
    high: number; // e.g., 0.8 - reduce stop distance by 20%
    medium: number; // e.g., 1.0 - no change
    low: number; // e.g., 1.3 - increase stop distance by 30%
  };
  
  // Market regime sensitivity
  regimeAdjustments: {
    BULL: number; // e.g., 0.9 - tighter stops in bull market
    BEAR: number; // e.g., 1.1 - wider stops in bear market
    RANGE: number; // e.g., 1.2 - wider stops in ranging market
    VOLATILE: number; // e.g., 1.4 - much wider stops in volatile market
  };
  
  // Position-specific settings
  enablePositionSpecific: boolean;
  positionSizeMultiplier: number; // Adjust stops based on position size
  holdingTimeMultiplier: number; // Adjust stops based on how long position is held
  
  // Advanced features
  enableAcceleration: boolean; // Accelerate stops when in profit
  accelerationFactor: number; // Factor to accelerate stops (e.g., 1.1)
  profitAccelerationThreshold: number; // Profit % to start acceleration (e.g., 5%)
  
  // Risk management integration
  maxStopAdjustmentPerUpdate: number; // Max % change per update (e.g., 0.5%)
  updateFrequency: number; // Update frequency in milliseconds (e.g., 30000)
}

export interface StopLevelData {
  symbol: string;
  currentPrice: number;
  stopPrice: number;
  originalStopPrice: number;
  trailingDistance: number;
  trailingPercentage: number;
  lastUpdated: Date;
  updateCount: number;
  
  // Analysis data
  atr: number;
  volatility: number;
  aiConfidence: number;
  marketRegime: MarketRegime;
  
  // Position context
  positionId: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPnL: number;
  currentPnLPercentage: number;
  holdingTime: number; // milliseconds
  
  // Stop history for analysis
  stopHistory: StopHistoryEntry[];
}

export interface StopHistoryEntry {
  timestamp: Date;
  price: number;
  stopPrice: number;
  reason: string;
  atr: number;
  confidence: number;
  regime: MarketRegime;
}

export interface TrailingStopUpdate {
  symbol: string;
  positionId: string;
  oldStop: number;
  newStop: number;
  reason: string;
  confidence: number;
  timestamp: Date;
}

export interface MarketContext {
  symbol: string;
  currentPrice: number;
  priceHistory: number[];
  volume: number;
  volatility: number;
  atr: number;
  regime: MarketRegime;
  timestamp: Date;
}

export interface PositionContext {
  position: Position;
  entryTime: Date;
  holdingTime: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  maxProfit: number;
  maxLoss: number;
  averageVolume: number;
}

// Main Dynamic Stop Calculator Class
export class DynamicStopCalculator extends EventEmitter {
  private config: DynamicStopConfig;
  private activeStops: Map<string, StopLevelData> = new Map();
  private priceData: Map<string, number[]> = new Map();
  private isRunning: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly MAX_PRICE_HISTORY = 200; // Keep last 200 price points
  
  constructor(config: Partial<DynamicStopConfig> = {}) {
    super();
    this.config = this.mergeWithDefaults(config);
    console.log('🎯 Dynamic Stop Calculator initialized with config:', this.config);
  }

  private mergeWithDefaults(config: Partial<DynamicStopConfig>): DynamicStopConfig {
    return {
      baseTrailingPercentage: 2.0,
      volatilityMultiplier: 1.5,
      atrPeriod: 14,
      minStopDistance: 0.5,
      maxStopDistance: 10.0,
      aiConfidenceThresholds: {
        high: 80,
        medium: 60,
        low: 40
      },
      confidenceMultipliers: {
        high: 0.8,
        medium: 1.0,
        low: 1.3
      },
      regimeAdjustments: {
        BULL: 0.9,
        BEAR: 1.1,
        RANGE: 1.2,
        VOLATILE: 1.4
      },
      enablePositionSpecific: true,
      positionSizeMultiplier: 0.1,
      holdingTimeMultiplier: 0.05,
      enableAcceleration: true,
      accelerationFactor: 1.1,
      profitAccelerationThreshold: 5.0,
      maxStopAdjustmentPerUpdate: 0.5,
      updateFrequency: 30000,
      ...config
    };
  }

  // Start the dynamic stop management system
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ Dynamic Stop Calculator is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Dynamic Stop Calculator...');

    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.updateAllStops();
    }, this.config.updateFrequency);

    this.emit('started', { timestamp: new Date() });
  }

  // Stop the dynamic stop management system
  public stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Dynamic Stop Calculator is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping Dynamic Stop Calculator...');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.emit('stopped', { timestamp: new Date() });
  }

  // Add a position to be managed by dynamic stops
  public async addPosition(
    position: Position,
    initialStopPrice: number,
    marketData?: CandlestickData[]
  ): Promise<void> {
    try {
      console.log(`📊 Adding position ${position.id} (${position.symbol}) to dynamic stops`);

      // Initialize price history if market data provided
      if (marketData && marketData.length > 0) {
        const prices = marketData.map(candle => candle.close);
        this.priceData.set(position.symbol, prices.slice(-this.MAX_PRICE_HISTORY));
      }

      // Calculate initial ATR and market context
      const atr = await this.calculateATR(position.symbol, this.config.atrPeriod);
      const marketContext = await this.getMarketContext(position.symbol);
      const aiConfidence = await this.getAIConfidence(position.symbol);

      // Create stop level data
      const stopData: StopLevelData = {
        symbol: position.symbol,
        currentPrice: position.currentPrice,
        stopPrice: initialStopPrice,
        originalStopPrice: initialStopPrice,
        trailingDistance: Math.abs(position.currentPrice - initialStopPrice),
        trailingPercentage: this.config.baseTrailingPercentage,
        lastUpdated: new Date(),
        updateCount: 0,
        atr,
        volatility: this.calculateVolatility(position.symbol),
        aiConfidence,
        marketRegime: marketContext.regime,
        positionId: position.id,
        side: position.side,
        entryPrice: position.entryPrice,
        currentPnL: position.unrealizedPnL,
        currentPnLPercentage: position.unrealizedPnLPercentage,
        holdingTime: Date.now() - new Date(position.createdAt).getTime(),
        stopHistory: [{
          timestamp: new Date(),
          price: position.currentPrice,
          stopPrice: initialStopPrice,
          reason: 'Initial stop set',
          atr,
          confidence: aiConfidence,
          regime: marketContext.regime
        }]
      };

      this.activeStops.set(position.id, stopData);
      console.log(`✅ Position ${position.id} added to dynamic stops with initial stop at ${initialStopPrice}`);

      this.emit('positionAdded', {
        positionId: position.id,
        symbol: position.symbol,
        initialStop: initialStopPrice,
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`❌ Failed to add position ${position.id} to dynamic stops:`, error);
      throw error;
    }
  }

  // Remove a position from dynamic stop management
  public removePosition(positionId: string): void {
    const stopData = this.activeStops.get(positionId);
    if (!stopData) {
      console.log(`⚠️ Position ${positionId} not found in dynamic stops`);
      return;
    }

    this.activeStops.delete(positionId);
    console.log(`🗑️ Position ${positionId} removed from dynamic stops`);

    this.emit('positionRemoved', {
      positionId,
      symbol: stopData.symbol,
      finalStop: stopData.stopPrice,
      timestamp: new Date()
    });
  }

  // Main method: Calculate trailing stop for a position
  public async calculateTrailingStop(
    positionId: string,
    currentPrice: number,
    marketData?: CandlestickData[]
  ): Promise<number> {
    const stopData = this.activeStops.get(positionId);
    if (!stopData) {
      throw new Error(`Position ${positionId} not found in dynamic stops`);
    }

    try {
      // Update price data
      this.updatePriceData(stopData.symbol, currentPrice);

      // Calculate base trailing distance using ATR
      const baseDistance = await this.updateStopDistance(stopData, currentPrice);

      // Integrate AI confidence
      const aiAdjustedDistance = this.integrateAIConfidence(baseDistance, stopData);

      // Adapt to market regime
      const regimeAdjustedDistance = this.adaptToMarketRegime(aiAdjustedDistance, stopData);

      // Apply position-specific adjustments
      const finalDistance = this.applyPositionSpecificAdjustments(regimeAdjustedDistance, stopData);

      // Calculate new stop price
      const newStopPrice = this.calculateNewStopPrice(currentPrice, finalDistance, stopData.side);

      // Validate the new stop price
      const validatedStopPrice = this.validateStopPrice(newStopPrice, stopData, currentPrice);

      return validatedStopPrice;

    } catch (error) {
      console.error(`❌ Failed to calculate trailing stop for position ${positionId}:`, error);
      throw error;
    }
  }

  // Update stop distance based on volatility (ATR)
  private async updateStopDistance(stopData: StopLevelData, currentPrice: number): Promise<number> {
    try {
      // Recalculate ATR with latest data
      const atr = await this.calculateATR(stopData.symbol, this.config.atrPeriod);
      stopData.atr = atr;

      // Base distance using ATR
      const atrBasedDistance = atr * this.config.volatilityMultiplier;

      // Convert to percentage
      const atrPercentage = (atrBasedDistance / currentPrice) * 100;

      // Blend with base trailing percentage
      const blendedPercentage = (this.config.baseTrailingPercentage + atrPercentage) / 2;

      // Apply min/max constraints
      const constrainedPercentage = Math.max(
        this.config.minStopDistance,
        Math.min(this.config.maxStopDistance, blendedPercentage)
      );

      console.log(`📊 Stop distance for ${stopData.symbol}: ATR=${atr.toFixed(4)}, ATR%=${atrPercentage.toFixed(2)}%, Final=${constrainedPercentage.toFixed(2)}%`);

      return constrainedPercentage;

    } catch (error) {
      console.error(`❌ Failed to update stop distance for ${stopData.symbol}:`, error);
      // Fallback to base trailing percentage
      return this.config.baseTrailingPercentage;
    }
  }

  // Integrate AI confidence into stop calculations
  private integrateAIConfidence(baseDistance: number, stopData: StopLevelData): number {
    try {
      const confidence = stopData.aiConfidence;
      let multiplier = this.config.confidenceMultipliers.medium;

      if (confidence >= this.config.aiConfidenceThresholds.high) {
        multiplier = this.config.confidenceMultipliers.high;
      } else if (confidence <= this.config.aiConfidenceThresholds.low) {
        multiplier = this.config.confidenceMultipliers.low;
      }

      const adjustedDistance = baseDistance * multiplier;

      console.log(`🧠 AI confidence adjustment for ${stopData.symbol}: confidence=${confidence}%, multiplier=${multiplier}, distance=${baseDistance.toFixed(2)}% -> ${adjustedDistance.toFixed(2)}%`);

      return adjustedDistance;

    } catch (error) {
      console.error(`❌ Failed to integrate AI confidence:`, error);
      return baseDistance;
    }
  }

  // Adapt stops to market regime
  private adaptToMarketRegime(distance: number, stopData: StopLevelData): number {
    try {
      const regime = stopData.marketRegime;
      const adjustment = this.config.regimeAdjustments[regime] || 1.0;
      const adjustedDistance = distance * adjustment;

      console.log(`📈 Market regime adjustment for ${stopData.symbol}: regime=${regime}, adjustment=${adjustment}, distance=${distance.toFixed(2)}% -> ${adjustedDistance.toFixed(2)}%`);

      return adjustedDistance;

    } catch (error) {
      console.error(`❌ Failed to adapt to market regime:`, error);
      return distance;
    }
  }

  // Apply position-specific adjustments
  private applyPositionSpecificAdjustments(distance: number, stopData: StopLevelData): number {
    if (!this.config.enablePositionSpecific) {
      return distance;
    }

    try {
      let adjustedDistance = distance;

      // Holding time adjustment - wider stops for longer-held positions
      const holdingHours = stopData.holdingTime / (1000 * 60 * 60);
      if (holdingHours > 24) {
        const timeMultiplier = 1 + (holdingHours / 24) * this.config.holdingTimeMultiplier;
        adjustedDistance *= timeMultiplier;
      }

      // Profit acceleration - tighten stops when in significant profit
      if (this.config.enableAcceleration && stopData.currentPnLPercentage > this.config.profitAccelerationThreshold) {
        adjustedDistance *= (1 / this.config.accelerationFactor);
      }

      console.log(`⚙️ Position-specific adjustment for ${stopData.symbol}: holding=${holdingHours.toFixed(1)}h, PnL=${stopData.currentPnLPercentage.toFixed(2)}%, distance=${distance.toFixed(2)}% -> ${adjustedDistance.toFixed(2)}%`);

      return adjustedDistance;

    } catch (error) {
      console.error(`❌ Failed to apply position-specific adjustments:`, error);
      return distance;
    }
  }

  // Calculate optimal stop distance for a position
  public async getOptimalStopDistance(
    symbol: string,
    currentPrice: number,
    side: 'LONG' | 'SHORT',
    confidence?: number,
    regime?: MarketRegime
  ): Promise<number> {
    try {
      // Calculate ATR-based distance
      const atr = await this.calculateATR(symbol, this.config.atrPeriod);
      const atrBasedDistance = (atr * this.config.volatilityMultiplier / currentPrice) * 100;

      // Base distance
      let optimalDistance = (this.config.baseTrailingPercentage + atrBasedDistance) / 2;

      // Apply AI confidence if provided
      if (confidence !== undefined) {
        let multiplier = this.config.confidenceMultipliers.medium;
        if (confidence >= this.config.aiConfidenceThresholds.high) {
          multiplier = this.config.confidenceMultipliers.high;
        } else if (confidence <= this.config.aiConfidenceThresholds.low) {
          multiplier = this.config.confidenceMultipliers.low;
        }
        optimalDistance *= multiplier;
      }

      // Apply regime adjustment if provided
      if (regime) {
        optimalDistance *= this.config.regimeAdjustments[regime];
      }

      // Apply constraints
      optimalDistance = Math.max(
        this.config.minStopDistance,
        Math.min(this.config.maxStopDistance, optimalDistance)
      );

      console.log(`🎯 Optimal stop distance for ${symbol}: ${optimalDistance.toFixed(2)}%`);
      return optimalDistance;

    } catch (error) {
      console.error(`❌ Failed to calculate optimal stop distance for ${symbol}:`, error);
      return this.config.baseTrailingPercentage;
    }
  }

  // Calculate new stop price based on distance and side
  private calculateNewStopPrice(currentPrice: number, distancePercentage: number, side: 'LONG' | 'SHORT'): number {
    const distanceDecimal = distancePercentage / 100;

    if (side === 'LONG') {
      return currentPrice * (1 - distanceDecimal);
    } else {
      return currentPrice * (1 + distanceDecimal);
    }
  }

  // Validate new stop price against constraints
  private validateStopPrice(newStopPrice: number, stopData: StopLevelData, currentPrice: number): number {
    let validatedStop = newStopPrice;

    // For LONG positions, stop should not move down
    if (stopData.side === 'LONG') {
      validatedStop = Math.max(newStopPrice, stopData.stopPrice);
    } else {
      // For SHORT positions, stop should not move up
      validatedStop = Math.min(newStopPrice, stopData.stopPrice);
    }

    // Check maximum adjustment per update
    const currentAdjustment = Math.abs(validatedStop - stopData.stopPrice) / stopData.stopPrice * 100;
    if (currentAdjustment > this.config.maxStopAdjustmentPerUpdate) {
      const maxChange = stopData.stopPrice * (this.config.maxStopAdjustmentPerUpdate / 100);
      
      if (stopData.side === 'LONG') {
        validatedStop = stopData.stopPrice + Math.min(maxChange, validatedStop - stopData.stopPrice);
      } else {
        validatedStop = stopData.stopPrice - Math.min(maxChange, stopData.stopPrice - validatedStop);
      }

      console.log(`⚠️ Stop adjustment capped at ${this.config.maxStopAdjustmentPerUpdate}% for ${stopData.symbol}`);
    }

    return validatedStop;
  }

  // Update all active stops
  private async updateAllStops(): Promise<void> {
    if (this.activeStops.size === 0) {
      return;
    }

    console.log(`🔄 Updating ${this.activeStops.size} dynamic stops...`);

    for (const [positionId, stopData] of Array.from(this.activeStops.entries())) {
      try {
        // Get current market price (this would be replaced with actual market data)
        const currentPrice = await this.getCurrentPrice(stopData.symbol);
        
        // Update AI confidence and market regime
        stopData.aiConfidence = await this.getAIConfidence(stopData.symbol);
        const marketContext = await this.getMarketContext(stopData.symbol);
        stopData.marketRegime = marketContext.regime;
        stopData.volatility = marketContext.volatility;

        // Calculate new stop
        const newStopPrice = await this.calculateTrailingStop(positionId, currentPrice);

        // Check if stop should be updated
        if (Math.abs(newStopPrice - stopData.stopPrice) > 0.0001) {
          const oldStop = stopData.stopPrice;
          stopData.stopPrice = newStopPrice;
          stopData.currentPrice = currentPrice;
          stopData.lastUpdated = new Date();
          stopData.updateCount++;

          // Add to history
          stopData.stopHistory.push({
            timestamp: new Date(),
            price: currentPrice,
            stopPrice: newStopPrice,
            reason: 'Dynamic update',
            atr: stopData.atr,
            confidence: stopData.aiConfidence,
            regime: stopData.marketRegime
          });

          // Keep history manageable
          if (stopData.stopHistory.length > 100) {
            stopData.stopHistory = stopData.stopHistory.slice(-100);
          }

          // Emit update event
          const update: TrailingStopUpdate = {
            symbol: stopData.symbol,
            positionId,
            oldStop,
            newStop: newStopPrice,
            reason: 'Dynamic trailing stop update',
            confidence: stopData.aiConfidence,
            timestamp: new Date()
          };

          this.emit('stopUpdated', update);
          console.log(`📊 Stop updated for ${stopData.symbol}: ${oldStop.toFixed(4)} -> ${newStopPrice.toFixed(4)}`);
        }

      } catch (error) {
        console.error(`❌ Failed to update stop for position ${positionId}:`, error);
      }
    }
  }

  // Helper methods for market data and calculations
  private async calculateATR(symbol: string, period: number): Promise<number> {
    try {
      const prices = this.priceData.get(symbol) || [];
      if (prices.length < period + 1) {
        // Not enough data, return estimated ATR based on recent volatility
        const volatility = this.calculateVolatility(symbol);
        const lastPrice = prices[prices.length - 1] || 50000; // Fallback price
        return lastPrice * volatility * 0.01; // Convert percentage to price
      }

      let atrSum = 0;
      for (let i = prices.length - period; i < prices.length - 1; i++) {
        const trueRange = Math.abs(prices[i + 1] - prices[i]);
        atrSum += trueRange;
      }

      return atrSum / period;

    } catch (error) {
      console.error(`❌ Failed to calculate ATR for ${symbol}:`, error);
      // Fallback to percentage-based estimate
      const lastPrice = this.priceData.get(symbol)?.[0] || 50000;
      return lastPrice * 0.02; // 2% of price as fallback ATR
    }
  }

  private calculateVolatility(symbol: string): number {
    try {
      const prices = this.priceData.get(symbol) || [];
      if (prices.length < 10) {
        return 2.0; // Default 2% volatility
      }

      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }

      const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * 100; // Convert to percentage

      return Math.max(0.5, Math.min(10.0, volatility));

    } catch (error) {
      console.error(`❌ Failed to calculate volatility for ${symbol}:`, error);
      return 2.0; // Default volatility
    }
  }

  private updatePriceData(symbol: string, price: number): void {
    const prices = this.priceData.get(symbol) || [];
    prices.push(price);
    
    // Keep only recent data
    if (prices.length > this.MAX_PRICE_HISTORY) {
      prices.shift();
    }
    
    this.priceData.set(symbol, prices);
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    // In a real implementation, this would fetch from exchange API
    // For now, return the last known price or simulate price movement
    const prices = this.priceData.get(symbol) || [];
    if (prices.length === 0) {
      return 50000; // Fallback price
    }
    
    const lastPrice = prices[prices.length - 1];
    // Simulate small price movement for testing
    const movement = (Math.random() - 0.5) * 0.01; // ±0.5% movement
    return lastPrice * (1 + movement);
  }

  private async getAIConfidence(symbol: string): Promise<number> {
    try {
      // This would integrate with the actual AI reasoning engine
      // For now, simulate based on market conditions
      const volatility = this.calculateVolatility(symbol);
      
      // Higher volatility = lower confidence
      const baseConfidence = Math.max(30, 90 - volatility * 5);
      
      // Add some randomness to simulate AI reasoning
      const variation = (Math.random() - 0.5) * 20;
      
      return Math.max(0, Math.min(100, baseConfidence + variation));
      
    } catch (error) {
      console.error(`❌ Failed to get AI confidence for ${symbol}:`, error);
      return 60; // Default medium confidence
    }
  }

  private async getMarketContext(symbol: string): Promise<MarketContext> {
    try {
      const prices = this.priceData.get(symbol) || [];
      const currentPrice = prices[prices.length - 1] || 50000;
      const volatility = this.calculateVolatility(symbol);
      
      // Determine market regime based on price trend and volatility
      let regime: MarketRegime = 'RANGE';
      if (prices.length >= 20) {
        const recent = prices.slice(-20);
        const older = prices.slice(-40, -20);
        
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
          const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length;
          const change = (recentAvg - olderAvg) / olderAvg;
          
          if (volatility > 5) {
            regime = 'VOLATILE';
          } else if (change > 0.05) {
            regime = 'BULL';
          } else if (change < -0.05) {
            regime = 'BEAR';
          } else {
            regime = 'RANGE';
          }
        }
      }

      return {
        symbol,
        currentPrice,
        priceHistory: [...prices],
        volume: 1000000, // Mock volume
        volatility,
        atr: await this.calculateATR(symbol, this.config.atrPeriod),
        regime,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`❌ Failed to get market context for ${symbol}:`, error);
      // Return default context
      return {
        symbol,
        currentPrice: 50000,
        priceHistory: [],
        volume: 1000000,
        volatility: 2.0,
        atr: 1000,
        regime: 'RANGE',
        timestamp: new Date()
      };
    }
  }

  // Public getter methods
  public getActiveStops(): StopLevelData[] {
    return Array.from(this.activeStops.values());
  }

  public getStopData(positionId: string): StopLevelData | undefined {
    return this.activeStops.get(positionId);
  }

  public getConfig(): DynamicStopConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DynamicStopConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Dynamic Stop Calculator configuration updated');
    this.emit('configUpdated', this.config);
  }

  public getRunningStatus(): boolean {
    return this.isRunning;
  }

  public getStats(): {
    activePositions: number;
    totalUpdates: number;
    averageUpdateFrequency: number;
    systemUptime: number;
  } {
    const totalUpdates = Array.from(this.activeStops.values())
      .reduce((sum, stop) => sum + stop.updateCount, 0);
    
    return {
      activePositions: this.activeStops.size,
      totalUpdates,
      averageUpdateFrequency: this.config.updateFrequency,
      systemUptime: this.isRunning ? Date.now() : 0
    };
  }
}

// Default configuration
export const defaultDynamicStopConfig: DynamicStopConfig = {
  baseTrailingPercentage: 2.0,
  volatilityMultiplier: 1.5,
  atrPeriod: 14,
  minStopDistance: 0.5,
  maxStopDistance: 8.0,
  aiConfidenceThresholds: {
    high: 80,
    medium: 60,
    low: 40
  },
  confidenceMultipliers: {
    high: 0.8,
    medium: 1.0,
    low: 1.3
  },
  regimeAdjustments: {
    BULL: 0.9,
    BEAR: 1.1,
    RANGE: 1.2,
    VOLATILE: 1.4
  },
  enablePositionSpecific: true,
  positionSizeMultiplier: 0.1,
  holdingTimeMultiplier: 0.05,
  enableAcceleration: true,
  accelerationFactor: 1.1,
  profitAccelerationThreshold: 5.0,
  maxStopAdjustmentPerUpdate: 0.5,
  updateFrequency: 30000
};

// Export singleton instance
export const dynamicStopCalculator = new DynamicStopCalculator(defaultDynamicStopConfig);

// Integration helper functions
export const integrateDynamicStops = {
  // Initialize with trading engine
  async initializeWithTradingEngine(tradingEngine: any): Promise<void> {
    console.log('🔗 Integrating Dynamic Stops with Trading Engine...');
    
    // Listen for new positions
    if (tradingEngine.on) {
      tradingEngine.on('positionOpened', async (position: Position) => {
        if (position.stopLoss) {
          await dynamicStopCalculator.addPosition(position, position.stopLoss);
        }
      });

      tradingEngine.on('positionClosed', (position: Position) => {
        dynamicStopCalculator.removePosition(position.id);
      });
    }
  },

  // Initialize with risk manager
  async initializeWithRiskManager(riskManager: any): Promise<void> {
    console.log('🔗 Integrating Dynamic Stops with Risk Manager...');
    
    // Listen for stop updates and validate with risk manager
    dynamicStopCalculator.on('stopUpdated', async (update: TrailingStopUpdate) => {
      // Validate stop with risk manager
      if (riskManager.validateStopLoss) {
        const validation = await riskManager.validateStopLoss(update.symbol, update.newStop);
        if (!validation.allowed) {
          console.log(`⚠️ Risk manager rejected stop update for ${update.symbol}: ${validation.reason}`);
        }
      }
    });
  },

  // Initialize with AI reasoning engine
  async initializeWithAI(): Promise<void> {
    console.log('🔗 Integrating Dynamic Stops with AI Reasoning Engine...');
    
    // This integration would allow the dynamic stops to get real-time
    // AI confidence scores and market regime assessments
    dynamicStopCalculator.start();
  }
};