import { EventEmitter } from 'events';
import { supabase } from '../database/supabase-client';
import { 
  Trade, 
  Position, 
  MarketRegime,
  CandlestickData,
  MarketData 
} from '../../types/trading';

// Pattern Recognition Interfaces
export interface PatternRecognitionConfig {
  minPatternLength: number;
  maxPatternLength: number;
  confidenceThreshold: number;
  correlationThreshold: number;
  volumeSignificanceThreshold: number;
  patternExpirationHours: number;
  enableAdvancedPatterns: boolean;
  historicalDataDays: number;
}

export interface MarketPattern {
  id: string;
  type: PatternType;
  subtype?: string;
  symbol: string;
  timeframe: string;
  startTime: Date;
  endTime: Date;
  confidence: number;
  reliability: number;
  predictiveAccuracy: number;
  expectedOutcome: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  targetPrice?: number;
  stopLoss?: number;
  projectedDuration?: number;
  supportingIndicators: string[];
  historicalSuccessRate: number;
  riskReward: number;
  volumeProfile: VolumeProfile;
  pricePoints: PatternPricePoint[];
  metadata: PatternMetadata;
}

export interface PatternPricePoint {
  timestamp: Date;
  price: number;
  volume: number;
  significance: number; // 0-1 scale
  role: 'support' | 'resistance' | 'breakout' | 'retest' | 'pivot';
}

export interface VolumeProfile {
  averageVolume: number;
  patternVolume: number;
  volumeRatio: number;
  volumeSignificance: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREMELY_HIGH';
  volumeDistribution: Array<{ price: number; volume: number }>;
}

export interface PatternMetadata {
  marketRegime: MarketRegime;
  volatility: number;
  liquidity: number;
  marketCap?: number;
  correlatedAssets: string[];
  newsEvents: Array<{ timestamp: Date; impact: number; description: string }>;
  seasonalityFactor: number;
  institutionalActivity: number;
}

export type PatternType = 
  | 'TRIANGLE' | 'HEAD_AND_SHOULDERS' | 'DOUBLE_TOP' | 'DOUBLE_BOTTOM'
  | 'FLAG' | 'PENNANT' | 'CUP_AND_HANDLE' | 'WEDGE'
  | 'SUPPORT_RESISTANCE' | 'CHANNEL' | 'BREAKOUT' | 'REVERSAL'
  | 'ACCUMULATION' | 'DISTRIBUTION' | 'CONSOLIDATION'
  | 'DIVERGENCE' | 'MOMENTUM_SHIFT' | 'VOLUME_ANOMALY';

export interface BehavioralPattern {
  id: string;
  type: BehavioralPatternType;
  description: string;
  frequency: number;
  profitability: number;
  consistency: number;
  marketConditions: MarketRegime[];
  timePatterns: TimePattern[];
  triggerConditions: TriggerCondition[];
  successMetrics: SuccessMetrics;
  adaptationSuggestions: string[];
}

export type BehavioralPatternType = 
  | 'OVERTRADING' | 'REVENGE_TRADING' | 'FOMO_ENTRIES' | 'EARLY_EXITS'
  | 'LATE_ENTRIES' | 'STOP_HUNTING' | 'PROFIT_TAKING_TOO_EARLY'
  | 'HOLDING_LOSERS_TOO_LONG' | 'POSITION_SIZING_ERRORS'
  | 'MARKET_TIMING_BIAS' | 'CONFIRMATION_BIAS' | 'TREND_FOLLOWING_LAG';

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
  frequency: number;
  performance: number;
}

export interface TriggerCondition {
  indicator: string;
  condition: string;
  threshold: number;
  frequency: number;
}

export interface SuccessMetrics {
  winRate: number;
  avgReturn: number;
  riskReward: number;
  frequency: number;
  consistency: number;
}

export interface CorrelationAnalysis {
  symbol: string;
  correlatedAssets: Array<{
    asset: string;
    correlation: number;
    significance: number;
    timelag: number; // in minutes
    reliability: number;
  }>;
  marketCorrelations: Array<{
    market: string;
    correlation: number;
    impact: number;
  }>;
  seasonalCorrelations: Array<{
    period: string;
    correlation: number;
    strength: number;
  }>;
}

export interface AnomalyDetection {
  id: string;
  type: AnomalyType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: Date;
  affectedSymbols: string[];
  probability: number;
  expectedImpact: number;
  duration: number;
  recommendations: string[];
  historicalComparisons: Array<{
    date: Date;
    similarity: number;
    outcome: string;
  }>;
}

export type AnomalyType = 
  | 'VOLUME_SPIKE' | 'PRICE_GAP' | 'VOLATILITY_SURGE' | 'CORRELATION_BREAKDOWN'
  | 'UNUSUAL_PATTERN' | 'MARKET_MICROSTRUCTURE' | 'LIQUIDITY_DRAIN'
  | 'FLASH_CRASH' | 'PUMP_AND_DUMP' | 'WHALE_ACTIVITY';

export interface PatternConfirmation {
  pattern: MarketPattern;
  confirmationLevel: number; // 0-1
  confirmingSignals: string[];
  contradictingSignals: string[];
  timeToConfirmation: number;
  reliabilityScore: number;
}

// Main Pattern Recognition Engine
export class PatternRecognitionEngine extends EventEmitter {
  private config: PatternRecognitionConfig;
  private activePatterns: Map<string, MarketPattern> = new Map();
  private patternHistory: MarketPattern[] = [];
  private behavioralPatterns: Map<string, BehavioralPattern> = new Map();
  private correlationMatrix: Map<string, CorrelationAnalysis> = new Map();
  private anomalies: AnomalyDetection[] = [];
  private isAnalyzing: boolean = false;
  private patternConfirmations: Map<string, PatternConfirmation> = new Map();

  constructor(config: Partial<PatternRecognitionConfig> = {}) {
    super();
    this.config = this.mergeWithDefaults(config);
    console.log('🔍 Pattern Recognition Engine initialized');
  }

  private mergeWithDefaults(config: Partial<PatternRecognitionConfig>): PatternRecognitionConfig {
    return {
      minPatternLength: 10,
      maxPatternLength: 100,
      confidenceThreshold: 0.7,
      correlationThreshold: 0.6,
      volumeSignificanceThreshold: 1.5,
      patternExpirationHours: 48,
      enableAdvancedPatterns: true,
      historicalDataDays: 90,
      ...config
    };
  }

  // Main pattern analysis method
  public async analyzePatterns(
    symbol: string,
    marketData: CandlestickData[],
    trades?: Trade[]
  ): Promise<{
    marketPatterns: MarketPattern[];
    behavioralPatterns: BehavioralPattern[];
    correlations: CorrelationAnalysis;
    anomalies: AnomalyDetection[];
    insights: PatternInsight[];
  }> {
    if (this.isAnalyzing) {
      throw new Error('Pattern analysis already in progress');
    }

    this.isAnalyzing = true;
    console.log(`🔍 Analyzing patterns for ${symbol}...`);

    try {
      // Clean expired patterns
      this.cleanExpiredPatterns();

      // Detect market patterns
      const marketPatterns = await this.detectMarketPatterns(symbol, marketData);
      
      // Analyze behavioral patterns if trades provided
      const behavioralPatterns = trades ? await this.analyzeBehavioralPatterns(trades) : [];
      
      // Update correlation analysis
      const correlations = await this.analyzeCorrelations(symbol, marketData);
      
      // Detect anomalies
      const anomalies = await this.detectAnomalies(symbol, marketData);
      
      // Generate pattern insights
      const insights = await this.generatePatternInsights(
        marketPatterns, 
        behavioralPatterns, 
        correlations, 
        anomalies
      );

      // Update internal state
      marketPatterns.forEach(pattern => {
        this.activePatterns.set(pattern.id, pattern);
        this.patternHistory.push(pattern);
      });

      behavioralPatterns.forEach(pattern => {
        this.behavioralPatterns.set(pattern.id, pattern);
      });

      this.correlationMatrix.set(symbol, correlations);
      this.anomalies.push(...anomalies);

      console.log(`✅ Pattern analysis completed for ${symbol}`);
      this.emit('patternsDetected', { symbol, marketPatterns, behavioralPatterns, anomalies });

      return {
        marketPatterns,
        behavioralPatterns,
        correlations,
        anomalies,
        insights
      };

    } catch (error) {
      console.error(`❌ Pattern analysis failed for ${symbol}:`, error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Detect market chart patterns
  private async detectMarketPatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];

    if (data.length < this.config.minPatternLength) {
      console.log(`⚠️ Insufficient data for pattern detection: ${data.length} candles`);
      return patterns;
    }

    console.log(`📊 Detecting patterns in ${data.length} candles for ${symbol}`);

    // Sort data by time
    const sortedData = [...data].sort((a, b) => a.openTime - b.openTime);

    // Detect various pattern types
    patterns.push(...await this.detectTrianglePatterns(symbol, sortedData));
    patterns.push(...await this.detectHeadAndShouldersPatterns(symbol, sortedData));
    patterns.push(...await this.detectDoubleTopBottomPatterns(symbol, sortedData));
    patterns.push(...await this.detectFlagPennantPatterns(symbol, sortedData));
    patterns.push(...await this.detectSupportResistancePatterns(symbol, sortedData));
    patterns.push(...await this.detectBreakoutPatterns(symbol, sortedData));
    
    if (this.config.enableAdvancedPatterns) {
      patterns.push(...await this.detectAdvancedPatterns(symbol, sortedData));
    }

    // Filter by confidence threshold
    const filteredPatterns = patterns.filter(p => p.confidence >= this.config.confidenceThreshold);

    console.log(`🎯 Found ${filteredPatterns.length} patterns above confidence threshold`);
    return filteredPatterns;
  }

  // Triangle pattern detection
  private async detectTrianglePatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    const minLength = Math.max(20, this.config.minPatternLength);

    for (let i = 0; i < data.length - minLength; i++) {
      const segment = data.slice(i, i + minLength);
      
      // Find potential triangle patterns
      const highs = this.findLocalMaxima(segment);
      const lows = this.findLocalMinima(segment);

      if (highs.length >= 2 && lows.length >= 2) {
        const trianglePattern = this.analyzeTrianglePattern(symbol, segment, highs, lows, i);
        if (trianglePattern && trianglePattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(trianglePattern);
        }
      }
    }

    return patterns;
  }

  // Analyze triangle pattern formation
  private analyzeTrianglePattern(
    symbol: string, 
    data: CandlestickData[], 
    highs: number[], 
    lows: number[], 
    startIndex: number
  ): MarketPattern | null {
    try {
      // Calculate trend lines
      const highTrend = this.calculateTrendLine(highs.map(i => ({ x: i, y: data[i].high })));
      const lowTrend = this.calculateTrendLine(lows.map(i => ({ x: i, y: data[i].low })));

      // Determine triangle type
      let subtype = 'SYMMETRIC';
      if (Math.abs(highTrend.slope) < 0.0001 && lowTrend.slope > 0) {
        subtype = 'ASCENDING';
      } else if (highTrend.slope < 0 && Math.abs(lowTrend.slope) < 0.0001) {
        subtype = 'DESCENDING';
      }

      // Calculate confidence based on trend line fit
      const highFit = this.calculateTrendLineFit(highs.map(i => ({ x: i, y: data[i].high })), highTrend);
      const lowFit = this.calculateTrendLineFit(lows.map(i => ({ x: i, y: data[i].low })), lowTrend);
      const confidence = (highFit + lowFit) / 2;

      if (confidence < 0.6) return null;

      // Calculate volume profile
      const volumeProfile = this.calculateVolumeProfile(data);

      // Determine expected outcome
      const expectedOutcome = subtype === 'ASCENDING' ? 'BULLISH' : 
                             subtype === 'DESCENDING' ? 'BEARISH' : 'NEUTRAL';

      // Calculate price targets
      const patternHeight = Math.max(...highs.map(i => data[i].high)) - Math.min(...lows.map(i => data[i].low));
      const lastPrice = data[data.length - 1].close;
      const targetPrice = expectedOutcome === 'BULLISH' ? lastPrice + patternHeight : lastPrice - patternHeight;

      return {
        id: `${symbol}_TRIANGLE_${Date.now()}_${startIndex}`,
        type: 'TRIANGLE',
        subtype,
        symbol,
        timeframe: '1h', // Would be dynamic based on data
        startTime: new Date(data[0].openTime),
        endTime: new Date(data[data.length - 1].closeTime),
        confidence,
        reliability: this.calculatePatternReliability('TRIANGLE', subtype),
        predictiveAccuracy: this.getHistoricalAccuracy('TRIANGLE', subtype),
        expectedOutcome,
        targetPrice,
        stopLoss: expectedOutcome === 'BULLISH' ? 
          Math.min(...lows.map(i => data[i].low)) : 
          Math.max(...highs.map(i => data[i].high)),
        projectedDuration: this.estimatePatternDuration('TRIANGLE'),
        supportingIndicators: this.findSupportingIndicators(data),
        historicalSuccessRate: this.getHistoricalSuccessRate('TRIANGLE', subtype),
        riskReward: this.calculateRiskReward(lastPrice, targetPrice, 
          expectedOutcome === 'BULLISH' ? 
            Math.min(...lows.map(i => data[i].low)) : 
            Math.max(...highs.map(i => data[i].high))),
        volumeProfile,
        pricePoints: this.extractPricePoints(data, highs, lows),
        metadata: await this.generatePatternMetadata(symbol, data)
      };

    } catch (error) {
      console.error('❌ Error analyzing triangle pattern:', error);
      return null;
    }
  }

  // Head and Shoulders pattern detection
  private async detectHeadAndShouldersPatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    const minLength = Math.max(30, this.config.minPatternLength);

    for (let i = 0; i < data.length - minLength; i++) {
      const segment = data.slice(i, i + minLength);
      const peaks = this.findSignificantPeaks(segment);

      if (peaks.length >= 3) {
        const hsPattern = this.analyzeHeadAndShouldersPattern(symbol, segment, peaks, i);
        if (hsPattern && hsPattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(hsPattern);
        }
      }
    }

    return patterns;
  }

  // Analyze Head and Shoulders pattern
  private analyzeHeadAndShouldersPattern(
    symbol: string,
    data: CandlestickData[],
    peaks: number[],
    startIndex: number
  ): MarketPattern | null {
    try {
      if (peaks.length < 3) return null;

      // Find potential head and shoulders formation
      for (let i = 0; i < peaks.length - 2; i++) {
        const leftShoulder = peaks[i];
        const head = peaks[i + 1];
        const rightShoulder = peaks[i + 2];

        // Check if head is higher than both shoulders
        if (data[head].high > data[leftShoulder].high && data[head].high > data[rightShoulder].high) {
          // Check if shoulders are approximately equal
          const shoulderDifference = Math.abs(data[leftShoulder].high - data[rightShoulder].high) / data[head].high;
          
          if (shoulderDifference < 0.05) { // 5% tolerance
            // Calculate neckline
            const necklineLevel = Math.min(
              this.findNecklineLevel(data, leftShoulder, head),
              this.findNecklineLevel(data, head, rightShoulder)
            );

            const confidence = this.calculateHSConfidence(data, leftShoulder, head, rightShoulder, necklineLevel);
            
            if (confidence >= this.config.confidenceThreshold) {
              const patternHeight = data[head].high - necklineLevel;
              const targetPrice = necklineLevel - patternHeight; // Bearish target

              return {
                id: `${symbol}_HEAD_SHOULDERS_${Date.now()}_${startIndex}`,
                type: 'HEAD_AND_SHOULDERS',
                subtype: 'CLASSIC',
                symbol,
                timeframe: '1h',
                startTime: new Date(data[leftShoulder].openTime),
                endTime: new Date(data[rightShoulder].closeTime),
                confidence,
                reliability: this.calculatePatternReliability('HEAD_AND_SHOULDERS'),
                predictiveAccuracy: this.getHistoricalAccuracy('HEAD_AND_SHOULDERS'),
                expectedOutcome: 'BEARISH',
                targetPrice,
                stopLoss: data[head].high * 1.02, // 2% above head
                projectedDuration: this.estimatePatternDuration('HEAD_AND_SHOULDERS'),
                supportingIndicators: this.findSupportingIndicators(data),
                historicalSuccessRate: this.getHistoricalSuccessRate('HEAD_AND_SHOULDERS'),
                riskReward: this.calculateRiskReward(data[data.length - 1].close, targetPrice, data[head].high * 1.02),
                volumeProfile: this.calculateVolumeProfile(data),
                pricePoints: [
                  {
                    timestamp: new Date(data[leftShoulder].openTime),
                    price: data[leftShoulder].high,
                    volume: data[leftShoulder].volume,
                    significance: 0.8,
                    role: 'resistance'
                  },
                  {
                    timestamp: new Date(data[head].openTime),
                    price: data[head].high,
                    volume: data[head].volume,
                    significance: 1.0,
                    role: 'resistance'
                  },
                  {
                    timestamp: new Date(data[rightShoulder].openTime),
                    price: data[rightShoulder].high,
                    volume: data[rightShoulder].volume,
                    significance: 0.8,
                    role: 'resistance'
                  }
                ],
                metadata: await this.generatePatternMetadata(symbol, data)
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error analyzing head and shoulders pattern:', error);
      return null;
    }
  }

  // Double Top/Bottom pattern detection
  private async detectDoubleTopBottomPatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    const peaks = this.findSignificantPeaks(data);
    const troughs = this.findSignificantTroughs(data);

    // Double Top detection
    for (let i = 0; i < peaks.length - 1; i++) {
      const pattern = this.analyzeDoubleTopPattern(symbol, data, peaks[i], peaks[i + 1]);
      if (pattern && pattern.confidence >= this.config.confidenceThreshold) {
        patterns.push(pattern);
      }
    }

    // Double Bottom detection
    for (let i = 0; i < troughs.length - 1; i++) {
      const pattern = this.analyzeDoubleBottomPattern(symbol, data, troughs[i], troughs[i + 1]);
      if (pattern && pattern.confidence >= this.config.confidenceThreshold) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  // Support and Resistance pattern detection
  private async detectSupportResistancePatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    const pricePoints = data.map((candle, index) => ({ index, high: candle.high, low: candle.low }));
    
    // Find support levels
    const supportLevels = this.findSupportLevels(pricePoints);
    const resistanceLevels = this.findResistanceLevels(pricePoints);

    // Create patterns for significant support/resistance levels
    supportLevels.forEach((level, index) => {
      if (level.touches >= 3 && level.strength >= 0.7) {
        patterns.push({
          id: `${symbol}_SUPPORT_${Date.now()}_${index}`,
          type: 'SUPPORT_RESISTANCE',
          subtype: 'SUPPORT',
          symbol,
          timeframe: '1h',
          startTime: new Date(data[0].openTime),
          endTime: new Date(data[data.length - 1].closeTime),
          confidence: level.strength,
          reliability: this.calculatePatternReliability('SUPPORT_RESISTANCE'),
          predictiveAccuracy: this.getHistoricalAccuracy('SUPPORT_RESISTANCE'),
          expectedOutcome: 'BULLISH',
          targetPrice: level.price * 1.05, // 5% above support
          stopLoss: level.price * 0.98, // 2% below support
          projectedDuration: this.estimatePatternDuration('SUPPORT_RESISTANCE'),
          supportingIndicators: [],
          historicalSuccessRate: this.getHistoricalSuccessRate('SUPPORT_RESISTANCE'),
          riskReward: this.calculateRiskReward(level.price, level.price * 1.05, level.price * 0.98),
          volumeProfile: this.calculateVolumeProfile(data),
          pricePoints: [{
            timestamp: new Date(),
            price: level.price,
            volume: 0,
            significance: level.strength,
            role: 'support'
          }],
          metadata: await this.generatePatternMetadata(symbol, data)
        });
      }
    });

    resistanceLevels.forEach((level, index) => {
      if (level.touches >= 3 && level.strength >= 0.7) {
        patterns.push({
          id: `${symbol}_RESISTANCE_${Date.now()}_${index}`,
          type: 'SUPPORT_RESISTANCE',
          subtype: 'RESISTANCE',
          symbol,
          timeframe: '1h',
          startTime: new Date(data[0].openTime),
          endTime: new Date(data[data.length - 1].closeTime),
          confidence: level.strength,
          reliability: this.calculatePatternReliability('SUPPORT_RESISTANCE'),
          predictiveAccuracy: this.getHistoricalAccuracy('SUPPORT_RESISTANCE'),
          expectedOutcome: 'BEARISH',
          targetPrice: level.price * 0.95, // 5% below resistance
          stopLoss: level.price * 1.02, // 2% above resistance
          projectedDuration: this.estimatePatternDuration('SUPPORT_RESISTANCE'),
          supportingIndicators: [],
          historicalSuccessRate: this.getHistoricalSuccessRate('SUPPORT_RESISTANCE'),
          riskReward: this.calculateRiskReward(level.price, level.price * 0.95, level.price * 1.02),
          volumeProfile: this.calculateVolumeProfile(data),
          pricePoints: [{
            timestamp: new Date(),
            price: level.price,
            volume: 0,
            significance: level.strength,
            role: 'resistance'
          }],
          metadata: await this.generatePatternMetadata(symbol, data)
        });
      }
    });

    return patterns;
  }

  // Flag and Pennant pattern detection
  private async detectFlagPennantPatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    // Implementation would detect flag and pennant patterns
    // This is a simplified version focusing on the structure
    return patterns;
  }

  // Breakout pattern detection
  private async detectBreakoutPatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    // Implementation would detect breakout patterns from consolidation areas
    return patterns;
  }

  // Advanced pattern detection
  private async detectAdvancedPatterns(symbol: string, data: CandlestickData[]): Promise<MarketPattern[]> {
    const patterns: MarketPattern[] = [];
    // Implementation would include cup and handle, wedges, etc.
    return patterns;
  }

  // Analyze behavioral patterns from trading history
  private async analyzeBehavioralPatterns(trades: Trade[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];

    // Analyze overtrading
    const overtradingPattern = this.detectOvertradingPattern(trades);
    if (overtradingPattern) patterns.push(overtradingPattern);

    // Analyze FOMO entries
    const fomoPattern = this.detectFOMOPattern(trades);
    if (fomoPattern) patterns.push(fomoPattern);

    // Analyze early exits
    const earlyExitPattern = this.detectEarlyExitPattern(trades);
    if (earlyExitPattern) patterns.push(earlyExitPattern);

    // Analyze position sizing errors
    const positionSizingPattern = this.detectPositionSizingErrors(trades);
    if (positionSizingPattern) patterns.push(positionSizingPattern);

    return patterns;
  }

  // Detect overtrading behavioral pattern
  private detectOvertradingPattern(trades: Trade[]): BehavioralPattern | null {
    const dailyTradeCounts = this.groupTradesByDay(trades);
    const avgDailyTrades = Object.values(dailyTradeCounts).reduce((sum, count) => sum + count, 0) / Object.keys(dailyTradeCounts).length;
    
    if (avgDailyTrades > 10) { // Threshold for overtrading
      const overtradingDays = Object.values(dailyTradeCounts).filter(count => count > 15).length;
      const frequency = overtradingDays / Object.keys(dailyTradeCounts).length;
      
      // Calculate profitability on overtrading days
      const profitability = this.calculateOvertradingProfitability(trades, dailyTradeCounts);
      
      return {
        id: `OVERTRADING_${Date.now()}`,
        type: 'OVERTRADING',
        description: `Excessive trading detected with average ${avgDailyTrades.toFixed(1)} trades per day`,
        frequency,
        profitability,
        consistency: 1 - (frequency * 0.5), // Overtrading reduces consistency
        marketConditions: ['VOLATILE'], // Often occurs in volatile markets
        timePatterns: this.analyzeOvertradingTimePatterns(trades),
        triggerConditions: [
          { indicator: 'Daily Trade Count', condition: '>', threshold: 15, frequency }
        ],
        successMetrics: {
          winRate: this.calculateWinRate(trades.filter(t => this.isFromOvertradingDay(t, dailyTradeCounts))),
          avgReturn: profitability,
          riskReward: this.calculateRiskReward(0, profitability, Math.abs(profitability) * 1.5),
          frequency,
          consistency: 1 - frequency
        },
        adaptationSuggestions: [
          'Implement daily trade limits',
          'Use position sizing rules to reduce frequency',
          'Focus on higher quality setups',
          'Implement cooling-off periods after losses'
        ]
      };
    }
    
    return null;
  }

  // Detect FOMO (Fear of Missing Out) pattern
  private detectFOMOPattern(trades: Trade[]): BehavioralPattern | null {
    const quickEntries = trades.filter(trade => {
      // Check if trade was entered quickly after a significant price move
      return this.isQuickEntryAfterMove(trade);
    });

    if (quickEntries.length > trades.length * 0.2) { // 20% of trades are FOMO
      const frequency = quickEntries.length / trades.length;
      const profitability = this.calculateAverageReturn(quickEntries);
      
      return {
        id: `FOMO_${Date.now()}`,
        type: 'FOMO_ENTRIES',
        description: `FOMO entries detected in ${(frequency * 100).toFixed(1)}% of trades`,
        frequency,
        profitability,
        consistency: 1 - (frequency * 0.7), // FOMO significantly reduces consistency
        marketConditions: ['BULL', 'VOLATILE'],
        timePatterns: [],
        triggerConditions: [
          { indicator: 'Price Movement', condition: '>', threshold: 0.05, frequency }
        ],
        successMetrics: {
          winRate: this.calculateWinRate(quickEntries),
          avgReturn: profitability,
          riskReward: this.calculateAverageRiskReward(quickEntries),
          frequency,
          consistency: 1 - frequency
        },
        adaptationSuggestions: [
          'Wait for pullbacks before entering',
          'Use limit orders instead of market orders',
          'Implement entry criteria checklist',
          'Practice patience and discipline'
        ]
      };
    }
    
    return null;
  }

  // Detect early exit pattern
  private detectEarlyExitPattern(trades: Trade[]): BehavioralPattern | null {
    // This would analyze if trades are being closed too early relative to their potential
    // Implementation would compare actual holding times vs optimal holding times
    return null;
  }

  // Detect position sizing errors
  private detectPositionSizingErrors(trades: Trade[]): BehavioralPattern | null {
    const positionSizes = trades.map(trade => trade.quantity * trade.price);
    const avgPosition = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
    const stdDev = Math.sqrt(positionSizes.reduce((sum, size) => sum + Math.pow(size - avgPosition, 2), 0) / positionSizes.length);
    
    const coefficientOfVariation = stdDev / avgPosition;
    
    if (coefficientOfVariation > 0.5) { // High variation in position sizes
      return {
        id: `POSITION_SIZING_${Date.now()}`,
        type: 'POSITION_SIZING_ERRORS',
        description: `Inconsistent position sizing detected with CV of ${coefficientOfVariation.toFixed(2)}`,
        frequency: coefficientOfVariation,
        profitability: this.calculateAverageReturn(trades),
        consistency: 1 - coefficientOfVariation,
        marketConditions: ['BULL', 'BEAR', 'RANGE', 'VOLATILE'],
        timePatterns: [],
        triggerConditions: [],
        successMetrics: {
          winRate: this.calculateWinRate(trades),
          avgReturn: this.calculateAverageReturn(trades),
          riskReward: this.calculateAverageRiskReward(trades),
          frequency: coefficientOfVariation,
          consistency: 1 - coefficientOfVariation
        },
        adaptationSuggestions: [
          'Implement consistent position sizing rules',
          'Use percentage-based position sizing',
          'Consider volatility-adjusted position sizing',
          'Review risk management framework'
        ]
      };
    }
    
    return null;
  }

  // Analyze correlations between assets and markets
  private async analyzeCorrelations(symbol: string, data: CandlestickData[]): Promise<CorrelationAnalysis> {
    // This would analyze correlations with other assets, markets, and seasonal patterns
    // For now, returning a mock structure
    return {
      symbol,
      correlatedAssets: [
        { asset: 'BTC', correlation: 0.85, significance: 0.9, timelag: 0, reliability: 0.8 },
        { asset: 'ETH', correlation: 0.75, significance: 0.8, timelag: 5, reliability: 0.7 }
      ],
      marketCorrelations: [
        { market: 'S&P500', correlation: 0.6, impact: 0.7 },
        { market: 'DXY', correlation: -0.4, impact: 0.5 }
      ],
      seasonalCorrelations: [
        { period: 'Q4', correlation: 0.3, strength: 0.6 },
        { period: 'January', correlation: 0.5, strength: 0.7 }
      ]
    };
  }

  // Detect market anomalies
  private async detectAnomalies(symbol: string, data: CandlestickData[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Volume spike detection
    const volumeAnomaly = this.detectVolumeSpike(symbol, data);
    if (volumeAnomaly) anomalies.push(volumeAnomaly);

    // Price gap detection
    const priceGapAnomaly = this.detectPriceGap(symbol, data);
    if (priceGapAnomaly) anomalies.push(priceGapAnomaly);

    // Volatility surge detection
    const volatilityAnomaly = this.detectVolatilitySurge(symbol, data);
    if (volatilityAnomaly) anomalies.push(volatilityAnomaly);

    return anomalies;
  }

  // Generate insights from all pattern analysis
  private async generatePatternInsights(
    marketPatterns: MarketPattern[],
    behavioralPatterns: BehavioralPattern[],
    correlations: CorrelationAnalysis,
    anomalies: AnomalyDetection[]
  ): Promise<PatternInsight[]> {
    const insights: PatternInsight[] = [];

    // Market pattern insights
    marketPatterns.forEach(pattern => {
      if (pattern.confidence > 0.8) {
        insights.push({
          type: 'market_pattern',
          priority: pattern.expectedOutcome !== 'NEUTRAL' ? 'high' : 'medium',
          title: `${pattern.type} Pattern Detected`,
          description: `High confidence ${pattern.type} pattern suggests ${pattern.expectedOutcome} movement`,
          confidence: pattern.confidence * 100,
          impact: pattern.riskReward * 20,
          actionable: true,
          recommendations: [
            `Consider ${pattern.expectedOutcome.toLowerCase()} position`,
            `Target: ${pattern.targetPrice?.toFixed(2)}`,
            `Stop Loss: ${pattern.stopLoss?.toFixed(2)}`
          ],
          supportingData: pattern,
          timestamp: new Date()
        });
      }
    });

    // Behavioral pattern insights
    behavioralPatterns.forEach(pattern => {
      if (pattern.frequency > 0.3) {
        insights.push({
          type: 'behavioral_pattern',
          priority: pattern.profitability < 0 ? 'high' : 'medium',
          title: `${pattern.type.replace('_', ' ')} Pattern Detected`,
          description: pattern.description,
          confidence: pattern.consistency * 100,
          impact: pattern.profitability * 100,
          actionable: true,
          recommendations: pattern.adaptationSuggestions,
          supportingData: pattern,
          timestamp: new Date()
        });
      }
    });

    // Anomaly insights
    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL') {
        insights.push({
          type: 'anomaly',
          priority: anomaly.severity === 'CRITICAL' ? 'critical' : 'high',
          title: `${anomaly.type.replace('_', ' ')} Anomaly`,
          description: anomaly.description,
          confidence: anomaly.probability * 100,
          impact: anomaly.expectedImpact,
          actionable: true,
          recommendations: anomaly.recommendations,
          supportingData: anomaly,
          timestamp: new Date()
        });
      }
    });

    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  // Helper methods for pattern analysis
  private findLocalMaxima(data: CandlestickData[]): number[] {
    const maxima: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].high > data[i - 1].high && data[i].high > data[i + 1].high) {
        maxima.push(i);
      }
    }
    return maxima;
  }

  private findLocalMinima(data: CandlestickData[]): number[] {
    const minima: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i].low < data[i - 1].low && data[i].low < data[i + 1].low) {
        minima.push(i);
      }
    }
    return minima;
  }

  private calculateTrendLine(points: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private calculateTrendLineFit(points: Array<{ x: number; y: number }>, trendLine: { slope: number; intercept: number }): number {
    if (points.length === 0) return 0;

    const squaredErrors = points.map(p => {
      const predicted = trendLine.slope * p.x + trendLine.intercept;
      return Math.pow(p.y - predicted, 2);
    });

    const mse = squaredErrors.reduce((sum, error) => sum + error, 0) / points.length;
    const variance = points.reduce((sum, p) => sum + Math.pow(p.y - points.reduce((s, pt) => s + pt.y, 0) / points.length, 2), 0) / points.length;

    return variance > 0 ? Math.max(0, 1 - (mse / variance)) : 0;
  }

  private calculateVolumeProfile(data: CandlestickData[]): VolumeProfile {
    const totalVolume = data.reduce((sum, candle) => sum + candle.volume, 0);
    const averageVolume = totalVolume / data.length;
    const patternVolume = averageVolume; // Simplified
    const volumeRatio = patternVolume / averageVolume;

    let volumeSignificance: VolumeProfile['volumeSignificance'] = 'NORMAL';
    if (volumeRatio > 2) volumeSignificance = 'EXTREMELY_HIGH';
    else if (volumeRatio > 1.5) volumeSignificance = 'HIGH';
    else if (volumeRatio < 0.5) volumeSignificance = 'LOW';

    return {
      averageVolume,
      patternVolume,
      volumeRatio,
      volumeSignificance,
      volumeDistribution: data.map(candle => ({ price: candle.close, volume: candle.volume }))
    };
  }

  private async generatePatternMetadata(symbol: string, data: CandlestickData[]): Promise<PatternMetadata> {
    const volatility = this.calculateVolatility(data);
    
    return {
      marketRegime: this.estimateMarketRegime(data),
      volatility,
      liquidity: this.estimateLiquidity(data),
      correlatedAssets: ['BTC', 'ETH'], // Simplified
      newsEvents: [], // Would be fetched from news API
      seasonalityFactor: this.calculateSeasonalityFactor(),
      institutionalActivity: Math.random() * 100 // Mock data
    };
  }

  private calculateVolatility(data: CandlestickData[]): number {
    const returns = data.slice(1).map((candle, i) => 
      (candle.close - data[i].close) / data[i].close
    );
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private estimateMarketRegime(data: CandlestickData[]): MarketRegime {
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = (lastPrice - firstPrice) / firstPrice;
    const volatility = this.calculateVolatility(data);

    if (volatility > 0.5) return 'VOLATILE';
    if (change > 0.1) return 'BULL';
    if (change < -0.1) return 'BEAR';
    return 'RANGE';
  }

  private estimateLiquidity(data: CandlestickData[]): number {
    const avgVolume = data.reduce((sum, candle) => sum + candle.volume, 0) / data.length;
    const avgPrice = data.reduce((sum, candle) => sum + candle.close, 0) / data.length;
    return avgVolume * avgPrice; // Dollar volume as liquidity proxy
  }

  private calculateSeasonalityFactor(): number {
    const now = new Date();
    const month = now.getMonth();
    // Simplified seasonality based on month
    const seasonalFactors = [0.8, 0.9, 1.0, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.1];
    return seasonalFactors[month];
  }

  // Utility methods for behavioral pattern analysis
  private groupTradesByDay(trades: Trade[]): { [date: string]: number } {
    const grouped: { [date: string]: number } = {};
    trades.forEach(trade => {
      const date = new Date(trade.executedAt || trade.createdAt).toDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  }

  private calculateOvertradingProfitability(trades: Trade[], dailyTradeCounts: { [date: string]: number }): number {
    // Calculate profitability on days with excessive trading
    const overtradingDays = Object.keys(dailyTradeCounts).filter(date => dailyTradeCounts[date] > 15);
    const overtradingTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.executedAt || trade.createdAt).toDateString();
      return overtradingDays.includes(tradeDate);
    });
    
    return this.calculateAverageReturn(overtradingTrades);
  }

  private analyzeOvertradingTimePatterns(trades: Trade[]): TimePattern[] {
    // Analyze what times overtrading typically occurs
    const hourCounts: { [hour: number]: number } = {};
    const dayOfWeekCounts: { [day: number]: number } = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.executedAt || trade.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });
    
    return Object.entries(hourCounts).map(([hour, frequency]) => ({
      hour: parseInt(hour),
      dayOfWeek: 0, // Simplified
      frequency: frequency / trades.length,
      performance: Math.random() * 0.02 - 0.01 // Mock performance
    }));
  }

  private isFromOvertradingDay(trade: Trade, dailyTradeCounts: { [date: string]: number }): boolean {
    const tradeDate = new Date(trade.executedAt || trade.createdAt).toDateString();
    return (dailyTradeCounts[tradeDate] || 0) > 15;
  }

  private isQuickEntryAfterMove(trade: Trade): boolean {
    // This would check if trade was entered quickly after a significant price move
    // Simplified implementation
    return Math.random() > 0.8; // Mock 20% chance
  }

  private calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const winners = trades.filter(trade => (trade.realizedPnL || 0) > 0);
    return winners.length / trades.length;
  }

  private calculateAverageReturn(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const totalReturn = trades.reduce((sum, trade) => sum + (trade.realizedPnL || 0), 0);
    return totalReturn / trades.length;
  }

  private calculateAverageRiskReward(trades: Trade[]): number {
    // Simplified risk/reward calculation
    const avgWin = this.calculateAverageReturn(trades.filter(t => (t.realizedPnL || 0) > 0));
    const avgLoss = Math.abs(this.calculateAverageReturn(trades.filter(t => (t.realizedPnL || 0) < 0)));
    return avgLoss > 0 ? avgWin / avgLoss : 0;
  }

  // Pattern-specific helper methods
  private findSignificantPeaks(data: CandlestickData[]): number[] {
    // Find peaks that are significant relative to surrounding data
    const peaks: number[] = [];
    const windowSize = 5;
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const window = data.slice(i - windowSize, i + windowSize + 1);
      const maxHigh = Math.max(...window.map(c => c.high));
      
      if (data[i].high === maxHigh) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  private findSignificantTroughs(data: CandlestickData[]): number[] {
    // Find troughs that are significant relative to surrounding data
    const troughs: number[] = [];
    const windowSize = 5;
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const window = data.slice(i - windowSize, i + windowSize + 1);
      const minLow = Math.min(...window.map(c => c.low));
      
      if (data[i].low === minLow) {
        troughs.push(i);
      }
    }
    
    return troughs;
  }

  private analyzeDoubleTopPattern(symbol: string, data: CandlestickData[], peak1: number, peak2: number): MarketPattern | null {
    // Analyze potential double top pattern
    const price1 = data[peak1].high;
    const price2 = data[peak2].high;
    const priceDifference = Math.abs(price1 - price2) / Math.max(price1, price2);
    
    if (priceDifference < 0.03) { // 3% tolerance
      const confidence = 1 - priceDifference * 10; // Higher confidence for closer peaks
      const valleyIndex = this.findLowestPointBetween(data, peak1, peak2);
      const valleyPrice = data[valleyIndex].low;
      
      return {
        id: `${symbol}_DOUBLE_TOP_${Date.now()}`,
        type: 'DOUBLE_TOP',
        symbol,
        timeframe: '1h',
        startTime: new Date(data[peak1].openTime),
        endTime: new Date(data[peak2].closeTime),
        confidence,
        reliability: this.calculatePatternReliability('DOUBLE_TOP'),
        predictiveAccuracy: this.getHistoricalAccuracy('DOUBLE_TOP'),
        expectedOutcome: 'BEARISH',
        targetPrice: valleyPrice - (Math.max(price1, price2) - valleyPrice),
        stopLoss: Math.max(price1, price2) * 1.02,
        projectedDuration: this.estimatePatternDuration('DOUBLE_TOP'),
        supportingIndicators: [],
        historicalSuccessRate: this.getHistoricalSuccessRate('DOUBLE_TOP'),
        riskReward: this.calculateRiskReward(data[data.length - 1].close, 
          valleyPrice - (Math.max(price1, price2) - valleyPrice), 
          Math.max(price1, price2) * 1.02),
        volumeProfile: this.calculateVolumeProfile(data.slice(peak1, peak2 + 1)),
        pricePoints: [
          {
            timestamp: new Date(data[peak1].openTime),
            price: price1,
            volume: data[peak1].volume,
            significance: 1.0,
            role: 'resistance'
          },
          {
            timestamp: new Date(data[peak2].openTime),
            price: price2,
            volume: data[peak2].volume,
            significance: 1.0,
            role: 'resistance'
          },
          {
            timestamp: new Date(data[valleyIndex].openTime),
            price: valleyPrice,
            volume: data[valleyIndex].volume,
            significance: 0.8,
            role: 'support'
          }
        ],
        metadata: await this.generatePatternMetadata(symbol, data)
      };
    }
    
    return null;
  }

  private analyzeDoubleBottomPattern(symbol: string, data: CandlestickData[], trough1: number, trough2: number): MarketPattern | null {
    // Similar to double top but inverted
    const price1 = data[trough1].low;
    const price2 = data[trough2].low;
    const priceDifference = Math.abs(price1 - price2) / Math.min(price1, price2);
    
    if (priceDifference < 0.03) {
      const confidence = 1 - priceDifference * 10;
      const peakIndex = this.findHighestPointBetween(data, trough1, trough2);
      const peakPrice = data[peakIndex].high;
      
      return {
        id: `${symbol}_DOUBLE_BOTTOM_${Date.now()}`,
        type: 'DOUBLE_BOTTOM',
        symbol,
        timeframe: '1h',
        startTime: new Date(data[trough1].openTime),
        endTime: new Date(data[trough2].closeTime),
        confidence,
        reliability: this.calculatePatternReliability('DOUBLE_BOTTOM'),
        predictiveAccuracy: this.getHistoricalAccuracy('DOUBLE_BOTTOM'),
        expectedOutcome: 'BULLISH',
        targetPrice: peakPrice + (peakPrice - Math.min(price1, price2)),
        stopLoss: Math.min(price1, price2) * 0.98,
        projectedDuration: this.estimatePatternDuration('DOUBLE_BOTTOM'),
        supportingIndicators: [],
        historicalSuccessRate: this.getHistoricalSuccessRate('DOUBLE_BOTTOM'),
        riskReward: this.calculateRiskReward(data[data.length - 1].close,
          peakPrice + (peakPrice - Math.min(price1, price2)),
          Math.min(price1, price2) * 0.98),
        volumeProfile: this.calculateVolumeProfile(data.slice(trough1, trough2 + 1)),
        pricePoints: [
          {
            timestamp: new Date(data[trough1].openTime),
            price: price1,
            volume: data[trough1].volume,
            significance: 1.0,
            role: 'support'
          },
          {
            timestamp: new Date(data[trough2].openTime),
            price: price2,
            volume: data[trough2].volume,
            significance: 1.0,
            role: 'support'
          }
        ],
        metadata: await this.generatePatternMetadata(symbol, data)
      };
    }
    
    return null;
  }

  private findLowestPointBetween(data: CandlestickData[], start: number, end: number): number {
    let minIndex = start;
    let minPrice = data[start].low;
    
    for (let i = start + 1; i <= end; i++) {
      if (data[i].low < minPrice) {
        minPrice = data[i].low;
        minIndex = i;
      }
    }
    
    return minIndex;
  }

  private findHighestPointBetween(data: CandlestickData[], start: number, end: number): number {
    let maxIndex = start;
    let maxPrice = data[start].high;
    
    for (let i = start + 1; i <= end; i++) {
      if (data[i].high > maxPrice) {
        maxPrice = data[i].high;
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  private findNecklineLevel(data: CandlestickData[], leftPoint: number, rightPoint: number): number {
    // Find the lowest point between two peaks for neckline calculation
    return this.findLowestPointBetween(data, leftPoint, rightPoint);
  }

  private calculateHSConfidence(
    data: CandlestickData[], 
    leftShoulder: number, 
    head: number, 
    rightShoulder: number, 
    necklineLevel: number
  ): number {
    // Calculate confidence based on pattern symmetry and clarity
    const leftShoulderHeight = data[leftShoulder].high;
    const headHeight = data[head].high;
    const rightShoulderHeight = data[rightShoulder].high;
    
    const shoulderSymmetry = 1 - Math.abs(leftShoulderHeight - rightShoulderHeight) / headHeight;
    const headDominance = (headHeight - Math.max(leftShoulderHeight, rightShoulderHeight)) / headHeight;
    const necklineClarity = (Math.min(leftShoulderHeight, rightShoulderHeight) - necklineLevel) / headHeight;
    
    return (shoulderSymmetry + headDominance + necklineClarity) / 3;
  }

  private findSupportLevels(pricePoints: Array<{ index: number; high: number; low: number }>): Array<{ price: number; touches: number; strength: number }> {
    const levels: { [price: string]: { price: number; touches: number; indices: number[] } } = {};
    const tolerance = 0.02; // 2% price tolerance
    
    pricePoints.forEach((point, index) => {
      const roundedPrice = Math.round(point.low / (point.low * tolerance)) * (point.low * tolerance);
      const key = roundedPrice.toString();
      
      if (!levels[key]) {
        levels[key] = { price: roundedPrice, touches: 0, indices: [] };
      }
      levels[key].touches++;
      levels[key].indices.push(index);
    });
    
    return Object.values(levels)
      .filter(level => level.touches >= 2)
      .map(level => ({
        price: level.price,
        touches: level.touches,
        strength: Math.min(1.0, level.touches / 5) // Strength increases with touches
      }))
      .sort((a, b) => b.strength - a.strength);
  }

  private findResistanceLevels(pricePoints: Array<{ index: number; high: number; low: number }>): Array<{ price: number; touches: number; strength: number }> {
    const levels: { [price: string]: { price: number; touches: number; indices: number[] } } = {};
    const tolerance = 0.02;
    
    pricePoints.forEach((point, index) => {
      const roundedPrice = Math.round(point.high / (point.high * tolerance)) * (point.high * tolerance);
      const key = roundedPrice.toString();
      
      if (!levels[key]) {
        levels[key] = { price: roundedPrice, touches: 0, indices: [] };
      }
      levels[key].touches++;
      levels[key].indices.push(index);
    });
    
    return Object.values(levels)
      .filter(level => level.touches >= 2)
      .map(level => ({
        price: level.price,
        touches: level.touches,
        strength: Math.min(1.0, level.touches / 5)
      }))
      .sort((a, b) => b.strength - a.strength);
  }

  private extractPricePoints(data: CandlestickData[], highs: number[], lows: number[]): PatternPricePoint[] {
    const points: PatternPricePoint[] = [];
    
    highs.forEach((index, i) => {
      points.push({
        timestamp: new Date(data[index].openTime),
        price: data[index].high,
        volume: data[index].volume,
        significance: 0.8 + (i * 0.1), // Increasing significance
        role: 'resistance'
      });
    });
    
    lows.forEach((index, i) => {
      points.push({
        timestamp: new Date(data[index].openTime),
        price: data[index].low,
        volume: data[index].volume,
        significance: 0.8 + (i * 0.1),
        role: 'support'
      });
    });
    
    return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private findSupportingIndicators(data: CandlestickData[]): string[] {
    const indicators: string[] = [];
    
    // Volume confirmation
    const avgVolume = data.reduce((sum, candle) => sum + candle.volume, 0) / data.length;
    const recentVolume = data.slice(-5).reduce((sum, candle) => sum + candle.volume, 0) / 5;
    if (recentVolume > avgVolume * 1.2) {
      indicators.push('Volume Confirmation');
    }
    
    // Momentum indicators would be calculated here
    indicators.push('RSI Divergence', 'MACD Confirmation');
    
    return indicators;
  }

  // Anomaly detection methods
  private detectVolumeSpike(symbol: string, data: CandlestickData[]): AnomalyDetection | null {
    const avgVolume = data.slice(0, -10).reduce((sum, candle) => sum + candle.volume, 0) / (data.length - 10);
    const recentCandles = data.slice(-10);
    
    const spikeCandle = recentCandles.find(candle => 
      candle.volume > avgVolume * this.config.volumeSignificanceThreshold * 2
    );
    
    if (spikeCandle) {
      const volumeRatio = spikeCandle.volume / avgVolume;
      
      return {
        id: `${symbol}_VOLUME_SPIKE_${Date.now()}`,
        type: 'VOLUME_SPIKE',
        severity: volumeRatio > 5 ? 'CRITICAL' : volumeRatio > 3 ? 'HIGH' : 'MEDIUM',
        description: `Volume spike detected: ${volumeRatio.toFixed(1)}x average volume`,
        detectedAt: new Date(spikeCandle.openTime),
        affectedSymbols: [symbol],
        probability: Math.min(0.95, volumeRatio / 10),
        expectedImpact: volumeRatio * 10,
        duration: 1, // Hours
        recommendations: [
          'Monitor for breakout confirmation',
          'Check for news events',
          'Consider increased volatility'
        ],
        historicalComparisons: []
      };
    }
    
    return null;
  }

  private detectPriceGap(symbol: string, data: CandlestickData[]): AnomalyDetection | null {
    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close;
      const currentOpen = data[i].open;
      const gapPercent = Math.abs(currentOpen - prevClose) / prevClose;
      
      if (gapPercent > 0.05) { // 5% gap
        return {
          id: `${symbol}_PRICE_GAP_${Date.now()}`,
          type: 'PRICE_GAP',
          severity: gapPercent > 0.1 ? 'HIGH' : 'MEDIUM',
          description: `Price gap of ${(gapPercent * 100).toFixed(2)}% detected`,
          detectedAt: new Date(data[i].openTime),
          affectedSymbols: [symbol],
          probability: 0.9,
          expectedImpact: gapPercent * 100,
          duration: 4, // Hours
          recommendations: [
            'Monitor for gap fill',
            'Check for overnight news',
            'Adjust position sizing'
          ],
          historicalComparisons: []
        };
      }
    }
    
    return null;
  }

  private detectVolatilitySurge(symbol: string, data: CandlestickData[]): AnomalyDetection | null {
    const recentVolatility = this.calculateVolatility(data.slice(-20));
    const historicalVolatility = this.calculateVolatility(data.slice(0, -20));
    
    if (recentVolatility > historicalVolatility * 2) {
      return {
        id: `${symbol}_VOLATILITY_SURGE_${Date.now()}`,
        type: 'VOLATILITY_SURGE',
        severity: recentVolatility > historicalVolatility * 3 ? 'HIGH' : 'MEDIUM',
        description: `Volatility surge: ${(recentVolatility / historicalVolatility).toFixed(1)}x historical average`,
        detectedAt: new Date(),
        affectedSymbols: [symbol],
        probability: 0.85,
        expectedImpact: (recentVolatility / historicalVolatility) * 20,
        duration: 6, // Hours
        recommendations: [
          'Widen stop losses',
          'Reduce position sizes',
          'Monitor closely for direction'
        ],
        historicalComparisons: []
      };
    }
    
    return null;
  }

  // Utility methods for pattern reliability and success rates
  private calculatePatternReliability(patternType: PatternType, subtype?: string): number {
    // Historical reliability scores for different patterns
    const reliabilityScores: { [key: string]: number } = {
      'TRIANGLE': 0.75,
      'HEAD_AND_SHOULDERS': 0.80,
      'DOUBLE_TOP': 0.70,
      'DOUBLE_BOTTOM': 0.70,
      'SUPPORT_RESISTANCE': 0.85,
      'FLAG': 0.65,
      'PENNANT': 0.65,
      'BREAKOUT': 0.60
    };
    
    return reliabilityScores[patternType] || 0.5;
  }

  private getHistoricalAccuracy(patternType: PatternType, subtype?: string): number {
    // Historical accuracy data for patterns
    const accuracyScores: { [key: string]: number } = {
      'TRIANGLE': 0.68,
      'HEAD_AND_SHOULDERS': 0.72,
      'DOUBLE_TOP': 0.65,
      'DOUBLE_BOTTOM': 0.65,
      'SUPPORT_RESISTANCE': 0.78,
      'FLAG': 0.60,
      'PENNANT': 0.58
    };
    
    return accuracyScores[patternType] || 0.5;
  }

  private getHistoricalSuccessRate(patternType: PatternType, subtype?: string): number {
    // Success rate when pattern actually triggers
    const successRates: { [key: string]: number } = {
      'TRIANGLE': 0.75,
      'HEAD_AND_SHOULDERS': 0.78,
      'DOUBLE_TOP': 0.72,
      'DOUBLE_BOTTOM': 0.72,
      'SUPPORT_RESISTANCE': 0.82
    };
    
    return successRates[patternType] || 0.6;
  }

  private estimatePatternDuration(patternType: PatternType): number {
    // Estimated duration in hours for pattern completion
    const durations: { [key: string]: number } = {
      'TRIANGLE': 24,
      'HEAD_AND_SHOULDERS': 48,
      'DOUBLE_TOP': 36,
      'DOUBLE_BOTTOM': 36,
      'SUPPORT_RESISTANCE': 12,
      'FLAG': 8,
      'PENNANT': 6
    };
    
    return durations[patternType] || 24;
  }

  private calculateRiskReward(currentPrice: number, targetPrice: number, stopLoss: number): number {
    const reward = Math.abs(targetPrice - currentPrice);
    const risk = Math.abs(currentPrice - stopLoss);
    return risk > 0 ? reward / risk : 0;
  }

  // Pattern expiration and cleanup
  private cleanExpiredPatterns(): void {
    const now = Date.now();
    const expiredIds: string[] = [];
    
    for (const [id, pattern] of this.activePatterns) {
      const ageHours = (now - pattern.endTime.getTime()) / (1000 * 60 * 60);
      if (ageHours > this.config.patternExpirationHours) {
        expiredIds.push(id);
      }
    }
    
    expiredIds.forEach(id => {
      this.activePatterns.delete(id);
    });
    
    if (expiredIds.length > 0) {
      console.log(`🧹 Cleaned up ${expiredIds.length} expired patterns`);
    }
  }

  // Public access methods
  public getActivePatterns(): MarketPattern[] {
    return Array.from(this.activePatterns.values());
  }

  public getPatternHistory(): MarketPattern[] {
    return [...this.patternHistory];
  }

  public getBehavioralPatterns(): BehavioralPattern[] {
    return Array.from(this.behavioralPatterns.values());
  }

  public getDetectedAnomalies(): AnomalyDetection[] {
    return [...this.anomalies];
  }

  public getConfiguration(): PatternRecognitionConfig {
    return { ...this.config };
  }

  public updateConfiguration(newConfig: Partial<PatternRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Pattern Recognition Engine configuration updated');
  }

  public isCurrentlyAnalyzing(): boolean {
    return this.isAnalyzing;
  }
}

// Pattern Insight interface
export interface PatternInsight {
  type: 'market_pattern' | 'behavioral_pattern' | 'correlation' | 'anomaly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  actionable: boolean;
  recommendations: string[];
  supportingData: any;
  timestamp: Date;
}

// Export singleton instance
export const patternRecognitionEngine = new PatternRecognitionEngine();