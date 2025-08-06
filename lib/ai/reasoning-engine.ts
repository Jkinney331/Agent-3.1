interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string[];
  riskReward: number;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: Date;
  marketRegime: 'BULL' | 'BEAR' | 'RANGE';
  indicators: IndicatorData;
  advancedData?: AdvancedMarketData;
}

interface IndicatorData {
  rsi: number;
  macd: { signal: number; histogram: number };
  volume: { profile: number; surge: boolean };
  sentiment: { fearGreed: number };
}

interface AdvancedMarketData {
  whaleAlerts?: WhaleAlertData[];
  newsAnalysis?: NewsAnalysisData;
  optionsFlow?: OptionsFlowData;
  arbitrageOpps?: ArbitrageOpportunity[];
  defiYields?: DeFiYieldData;
  nftTrends?: NFTTrendData;
}

interface WhaleAlertData {
  amount: number;
  direction: 'inflow' | 'outflow';
  exchange?: string;
  timestamp: string;
  impact: 'low' | 'medium' | 'high';
}

interface NewsAnalysisData {
  sentiment: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  relevantNews: number;
  marketMoving: boolean;
}

interface OptionsFlowData {
  putCallRatio: number;
  largeFlows: number;
  unusualActivity: boolean;
  impliedVolatility: number;
  gammaExposure: number;
}

interface ArbitrageOpportunity {
  exchange1: string;
  exchange2: string;
  priceDiff: number;
  profitPotential: number;
}

interface DeFiYieldData {
  averageYield: number;
  topOpportunities: number;
  riskAdjustedYield: number;
  liquidityMigration: 'in' | 'out' | 'stable';
}

interface NFTTrendData {
  floorPriceMovement: number;
  volumeChange: number;
  whaleActivity: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface FundingRateData {
  currentRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  extremeRates: boolean;
  carryOpportunity: number;
}

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  prices: number[];
  fearGreed: number;
  capital: number;
}

export class AIReasoningEngine {
  // AI Configuration
  private confidenceThreshold: number = 55; // LOWERED from 70 to 55 for more active trading
  private minRiskReward: number = 1.5; // LOWERED from 2.0 to 1.5 for more opportunities
  private maxPositionSize: number = 0.10; // 10%

  async analyzeMarket(data: MarketData): Promise<TradingSignal> {
    console.log(`🧠 AI Reasoning Engine: Analyzing ${data.symbol}`);
    
    // Step 1: Market regime detection
    const regime = await this.detectMarketRegime(data);
    console.log(`📊 Market Regime: ${regime}`);
    
    // Step 2: Multi-indicator validation
    const indicators = await this.crossValidateIndicators(data);
    console.log(`📈 Indicators analyzed:`, indicators);
    
    // Step 3: Advanced market intelligence gathering
    const advancedData = await this.gatherAdvancedMarketIntelligence(data.symbol);
    console.log(`🔍 Advanced intelligence gathered`);
    
    // Step 4: Risk-reward calculation with advanced data
    const riskReward = this.calculateAdvancedRiskReward(indicators, data.price, advancedData);
    console.log(`⚖️ Risk-Reward Ratio: ${riskReward}`);
    
    // Step 5: Generate enhanced reasoning chain
    const reasoning = this.generateEnhancedReasoningChain(regime, indicators, riskReward, advancedData);
    
    // Step 6: Calculate enhanced confidence score
    const confidence = this.calculateEnhancedConfidence(indicators, regime, riskReward, advancedData);
    console.log(`🎯 Confidence Score: ${confidence}%`);
    
    // Step 7: Make trading decision with advanced intelligence
    const action = this.makeEnhancedDecision(indicators, riskReward, confidence, advancedData);
    console.log(`🎲 Trading Decision: ${action}`);
    
    // Step 8: Calculate position details
    const positionSize = this.calculatePositionSize(data.capital, riskReward, confidence);
    const { stopLoss, takeProfit } = this.calculateStopTakeProfit(data.price, action, riskReward);
    
    return {
      symbol: data.symbol,
      action,
      confidence,
      reasoning,
      riskReward,
      positionSize,
      stopLoss,
      takeProfit,
      timestamp: new Date(),
      marketRegime: regime,
      indicators,
      advancedData
    };
  }

  private async gatherAdvancedMarketIntelligence(symbol: string): Promise<AdvancedMarketData> {
    // In production, these would call the actual MCP servers
    // For now, we'll simulate the data structure and intelligence
    
    const advancedData: AdvancedMarketData = {};

    try {
      // Simulate whale alerts data
      advancedData.whaleAlerts = this.generateMockWhaleAlerts();
      
      // Simulate news analysis
      advancedData.newsAnalysis = this.generateMockNewsAnalysis();
      

      
      // Simulate options flow
      advancedData.optionsFlow = this.generateMockOptionsFlow();
      
      // Simulate arbitrage opportunities
      advancedData.arbitrageOpps = this.generateMockArbitrageOpportunities();
      
      // Simulate DeFi yields
      advancedData.defiYields = this.generateMockDeFiYields();
      
      // Simulate NFT trends
      advancedData.nftTrends = this.generateMockNFTTrends();
      

      
    } catch (error) {
      console.warn(`⚠️ Could not gather some advanced market intelligence: ${error}`);
    }

    return advancedData;
  }

  private calculateAdvancedRiskReward(
    indicators: IndicatorData, 
    price: number, 
    advancedData: AdvancedMarketData
  ): number {
    let baseRiskReward = this.calculateRiskReward(indicators, price);
    
    // Enhance with advanced data
    if (advancedData.whaleAlerts?.some(alert => alert.impact === 'high')) {
      baseRiskReward *= 0.8; // Reduce due to whale volatility
    }
    
    if (advancedData.newsAnalysis?.marketMoving) {
      baseRiskReward *= advancedData.newsAnalysis.sentiment > 0 ? 1.2 : 0.7;
    }
    
    if (advancedData.optionsFlow?.unusualActivity) {
      baseRiskReward *= 0.9; // Slightly reduce due to unusual activity
    }
    
    if (advancedData.arbitrageOpps && advancedData.arbitrageOpps.length > 3) {
      baseRiskReward *= 1.1; // Increase due to market inefficiencies
    }
    
    return Math.max(0.5, Math.min(5.0, baseRiskReward));
  }

  private calculateEnhancedConfidence(
    indicators: IndicatorData,
    regime: 'BULL' | 'BEAR' | 'RANGE',
    riskReward: number,
    advancedData: AdvancedMarketData
  ): number {
    let baseConfidence = this.calculateConfidence(indicators, regime, riskReward);
    
    // Enhance confidence with advanced data
    
    if (advancedData.newsAnalysis) {
      const newsBoost = advancedData.newsAnalysis.sentiment > 0 ? 5 : -5;
      baseConfidence += newsBoost;
    }
    
    if (advancedData.optionsFlow) {
      const optionsConfidence = this.calculateOptionsConfidence(advancedData.optionsFlow);
      baseConfidence += optionsConfidence;
    }
    
    if (advancedData.whaleAlerts && advancedData.whaleAlerts.length > 0) {
      const whaleConfidence = this.calculateWhaleConfidence(advancedData.whaleAlerts);
      baseConfidence += whaleConfidence;
    }
    
    return Math.max(0, Math.min(100, baseConfidence));
  }

  private makeEnhancedDecision(
    indicators: IndicatorData,
    riskReward: number,
    confidence: number,
    advancedData: AdvancedMarketData
  ): 'BUY' | 'SELL' | 'HOLD' {
    const baseDecision = this.makeDecision(indicators, riskReward, confidence);
    
    // Check for override conditions based on advanced data
    if (advancedData.newsAnalysis?.urgency === 'critical') {
      return 'HOLD'; // Don't trade on critical news uncertainty
    }
    
    if (advancedData.whaleAlerts?.some(alert => alert.impact === 'high' && alert.direction === 'outflow')) {
      return baseDecision === 'BUY' ? 'HOLD' : baseDecision; // Be cautious on whale outflows
    }
    
    if (advancedData.optionsFlow?.unusualActivity && confidence < 80) {
      return 'HOLD'; // Hold on unusual options activity with low confidence
    }
    
    return baseDecision;
  }

  private generateEnhancedReasoningChain(
    regime: 'BULL' | 'BEAR' | 'RANGE',
    indicators: IndicatorData,
    riskReward: number,
    advancedData: AdvancedMarketData
  ): string[] {
    const baseReasoning = this.generateReasoningChain(regime, indicators, riskReward);
    
    // Add advanced reasoning
    const advancedReasoning: string[] = [];
    
    if (advancedData.whaleAlerts && advancedData.whaleAlerts.length > 0) {
      const whaleDirection = advancedData.whaleAlerts[0]?.direction;
      advancedReasoning.push(`Whale activity detected: ${whaleDirection} movements suggest ${whaleDirection === 'inflow' ? 'accumulation' : 'distribution'}`);
    }
    

    
    if (advancedData.newsAnalysis?.marketMoving) {
      advancedReasoning.push(`Market-moving news detected with ${advancedData.newsAnalysis.sentiment > 0 ? 'positive' : 'negative'} sentiment`);
    }
    
    if (advancedData.optionsFlow && advancedData.optionsFlow.largeFlows > 5) {
      advancedReasoning.push(`Significant options flow detected: ${advancedData.optionsFlow.largeFlows} large transactions`);
    }
    
    if (advancedData.arbitrageOpps && advancedData.arbitrageOpps.length > 2) {
      advancedReasoning.push(`Multiple arbitrage opportunities suggest market inefficiencies`);
    }
    
    return [...baseReasoning, ...advancedReasoning];
  }

  // Helper methods for advanced data generation (mock data for development)
  private generateMockWhaleAlerts(): WhaleAlertData[] {
    const alerts: WhaleAlertData[] = [];
    const alertCount = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < alertCount; i++) {
      alerts.push({
        amount: 100 + Math.random() * 10000,
        direction: Math.random() > 0.5 ? 'inflow' : 'outflow',
        exchange: ['binance', 'coinbase', 'kraken'][Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        impact: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      });
    }
    
    return alerts;
  }

  private generateMockNewsAnalysis(): NewsAnalysisData {
    return {
      sentiment: (Math.random() - 0.5) * 2, // -1 to 1
      urgency: Math.random() > 0.8 ? 'critical' : Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
      relevantNews: Math.floor(Math.random() * 20),
      marketMoving: Math.random() > 0.7
    };
  }

  private generateMockSocialSentiment(): { twitterSentiment: number; redditSentiment: number; discordActivity: number; influencerSentiment: number; viralContent: boolean } {
    return {
      twitterSentiment: Math.random() * 100,
      redditSentiment: Math.random() * 100,
      discordActivity: Math.random() * 100,
      influencerSentiment: Math.random() * 100,
      viralContent: Math.random() > 0.8
    };
  }

  private generateMockOptionsFlow(): OptionsFlowData {
    return {
      putCallRatio: 0.3 + Math.random() * 1.4,
      largeFlows: Math.floor(Math.random() * 15),
      unusualActivity: Math.random() > 0.7,
      impliedVolatility: 0.3 + Math.random() * 0.7,
      gammaExposure: Math.random() * 1000000
    };
  }

  private generateMockArbitrageOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const oppCount = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < oppCount; i++) {
      opportunities.push({
        exchange1: ['binance', 'coinbase', 'kraken'][Math.floor(Math.random() * 3)],
        exchange2: ['bybit', 'okx', 'gate'][Math.floor(Math.random() * 3)],
        priceDiff: Math.random() * 500,
        profitPotential: Math.random() * 5
      });
    }
    
    return opportunities;
  }

  private generateMockDeFiYields(): DeFiYieldData {
    return {
      averageYield: 5 + Math.random() * 20,
      topOpportunities: Math.floor(Math.random() * 10),
      riskAdjustedYield: 3 + Math.random() * 15,
      liquidityMigration: Math.random() > 0.6 ? 'in' : Math.random() > 0.3 ? 'out' : 'stable'
    };
  }

  private generateMockNFTTrends(): NFTTrendData {
    return {
      floorPriceMovement: (Math.random() - 0.5) * 40,
      volumeChange: (Math.random() - 0.5) * 60,
      whaleActivity: Math.random() * 100,
      sentiment: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral'
    };
  }

  private generateMockFundingRates(): FundingRateData {
    return {
      currentRate: (Math.random() - 0.5) * 0.002,
      trend: Math.random() > 0.6 ? 'increasing' : Math.random() > 0.3 ? 'decreasing' : 'stable',
      extremeRates: Math.random() > 0.8,
      carryOpportunity: Math.random() * 10
    };
  }

  // Analysis helper methods
  private calculateSocialAlignment(social: { twitterSentiment: number; redditSentiment: number; discordActivity: number; influencerSentiment: number; viralContent: boolean }): number {
    const avgSentiment = (social.twitterSentiment + social.redditSentiment + social.influencerSentiment) / 3;
    const alignment = Math.abs(avgSentiment - 50) / 50; // 0 to 1
    return social.viralContent ? alignment * 1.5 : alignment;
  }

  private calculateOptionsConfidence(options: OptionsFlowData): number {
    let confidence = 0;
    
    if (options.putCallRatio < 0.7 || options.putCallRatio > 1.3) {
      confidence += 5; // Extreme P/C ratios add confidence
    }
    
    if (options.largeFlows > 10) {
      confidence += 3; // Large flows add confidence
    }
    
    if (options.unusualActivity) {
      confidence -= 2; // Unusual activity reduces confidence
    }
    
    return confidence;
  }

  private calculateWhaleConfidence(whales: WhaleAlertData[]): number {
    const highImpactAlerts = whales.filter(w => w.impact === 'high').length;
    const inflowCount = whales.filter(w => w.direction === 'inflow').length;
    const outflowCount = whales.filter(w => w.direction === 'outflow').length;
    
    let confidence = 0;
    
    if (highImpactAlerts > 0) {
      confidence += Math.abs(inflowCount - outflowCount) * 2;
    }
    
    return Math.min(10, confidence);
  }

  private interpretSocialSentiment(social: { twitterSentiment: number; redditSentiment: number; discordActivity: number; influencerSentiment: number; viralContent: boolean }): string {
    const avgSentiment = (social.twitterSentiment + social.redditSentiment + social.influencerSentiment) / 3;
    
    if (avgSentiment > 70) return 'strongly bullish';
    if (avgSentiment > 55) return 'moderately bullish';
    if (avgSentiment > 45) return 'neutral';
    if (avgSentiment > 30) return 'moderately bearish';
    return 'strongly bearish';
  }

  // Existing methods continue here...
  private async detectMarketRegime(data: MarketData): Promise<'BULL' | 'BEAR' | 'RANGE'> {
    const priceChange = (data.price - data.prices[0]) / data.prices[0];
    const volatility = this.calculateVolatility(data.prices);
    
    if (Math.abs(priceChange) < 0.02 && volatility < 0.05) {
      return 'RANGE';
    } else if (priceChange > 0.05) {
      return 'BULL';
    } else if (priceChange < -0.05) {
      return 'BEAR';
    } else {
      return 'RANGE';
    }
  }

  private async crossValidateIndicators(data: MarketData): Promise<IndicatorData> {
    // RSI Calculation
    const rsi = this.calculateRSI(data.prices);
    
    // MACD Calculation
    const macd = this.calculateMACD(data.prices);
    
    // Volume Analysis
    const volume = this.analyzeVolume(data.volume, data.prices);
    
    // Sentiment Analysis
    const sentiment = {
      fearGreed: data.fearGreed,
      social: this.calculateSocialSentiment(data.fearGreed)
    };
    
    // Mock on-chain data (in real implementation, fetch from APIs)
    const onChain = {
      whaleActivity: Math.random() * 100,
      networkActivity: Math.random() * 100
    };
    
    return { rsi, macd, volume, sentiment };
  }

  private calculateRiskReward(indicators: IndicatorData, price: number): number {
    // Enhanced risk-reward calculation
    let baseRR = 2.0;
    
    // RSI adjustments
    if (indicators.rsi > 70) baseRR *= 0.8; // Overbought
    if (indicators.rsi < 30) baseRR *= 1.2; // Oversold
    
    // MACD adjustments
    if (indicators.macd.histogram > 0) baseRR *= 1.1; // Bullish momentum
    
    // Volume adjustments
    if (indicators.volume.surge) baseRR *= 1.1; // High volume
    
    // Sentiment adjustments
    const sentimentScore = indicators.sentiment.fearGreed;
    if (sentimentScore > 80) baseRR *= 0.9; // Extreme greed
    if (sentimentScore < 20) baseRR *= 1.1; // Extreme fear
    
    return Math.max(1.0, Math.min(5.0, baseRR));
  }

  private generateReasoningChain(
    regime: 'BULL' | 'BEAR' | 'RANGE',
    indicators: IndicatorData,
    riskReward: number
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Market regime identified as ${regime}`);
    
    if (indicators.rsi > 70) {
      reasoning.push(`RSI at ${indicators.rsi.toFixed(1)} indicates overbought conditions`);
    } else if (indicators.rsi < 30) {
      reasoning.push(`RSI at ${indicators.rsi.toFixed(1)} indicates oversold conditions`);
    }
    
    if (indicators.macd.histogram > 0) {
      reasoning.push(`MACD histogram positive, indicating bullish momentum`);
    } else {
      reasoning.push(`MACD histogram negative, indicating bearish momentum`);
    }
    
    if (indicators.volume.surge) {
      reasoning.push(`Volume surge detected, confirming price movement`);
    }
    
    const avgSentiment = indicators.sentiment.fearGreed;
    if (avgSentiment > 80) {
      reasoning.push(`Extreme greed detected (${avgSentiment.toFixed(1)}), potential reversal risk`);
    } else if (avgSentiment < 20) {
      reasoning.push(`Extreme fear detected (${avgSentiment.toFixed(1)}), potential buying opportunity`);
    }
    
    reasoning.push(`Risk-reward ratio calculated at ${riskReward.toFixed(2)}`);
    
    return reasoning;
  }

  private calculateConfidence(
    indicators: IndicatorData,
    regime: 'BULL' | 'BEAR' | 'RANGE',
    riskReward: number
  ): number {
    let confidence = 50; // Base confidence
    
    // RSI confidence
    if (indicators.rsi > 70 || indicators.rsi < 30) confidence += 10;
    if (indicators.rsi > 40 && indicators.rsi < 60) confidence += 5;
    
    // MACD confidence
    if (Math.abs(indicators.macd.histogram) > 500) confidence += 10;
    
    // Volume confidence
    if (indicators.volume.surge) confidence += 15;
    
    // Sentiment confidence
    const avgSentiment = indicators.sentiment.fearGreed;
    if (avgSentiment > 80 || avgSentiment < 20) confidence += 10;
    
    // Risk-reward confidence
    if (riskReward > 2.5) confidence += 10;
    
    // Regime confidence
    if (regime !== 'RANGE') confidence += 5;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private makeDecision(
    indicators: IndicatorData,
    riskReward: number,
    confidence: number
  ): 'BUY' | 'SELL' | 'HOLD' {
    console.log(`🎯 DECISION ANALYSIS:
      Confidence: ${confidence}% (threshold: ${this.confidenceThreshold}%)
      Risk/Reward: ${riskReward} (minimum: ${this.minRiskReward})
    `);
    
    if (confidence < this.confidenceThreshold || riskReward < this.minRiskReward) {
      console.log(`❌ TRADE REJECTED: ${confidence < this.confidenceThreshold ? 'Low confidence' : ''} ${riskReward < this.minRiskReward ? 'Poor risk/reward' : ''}`);
      return 'HOLD';
    }
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI signals
    if (indicators.rsi < 30) bullishSignals++;
    if (indicators.rsi > 70) bearishSignals++;
    
    // MACD signals
    if (indicators.macd.histogram > 0) bullishSignals++;
    else bearishSignals++;
    
    // Sentiment signals  
    const avgSentiment = indicators.sentiment.fearGreed;
    if (avgSentiment < 30) bullishSignals++; // Fear = buy opportunity
    if (avgSentiment > 70) bearishSignals++; // Greed = sell signal
    
    console.log(`📊 SIGNAL ANALYSIS:
      Bullish signals: ${bullishSignals}
      Bearish signals: ${bearishSignals}
      RSI: ${indicators.rsi}
      MACD: ${indicators.macd.histogram}
      Sentiment: ${avgSentiment}
    `);
    
    if (bullishSignals > bearishSignals && bullishSignals >= 2) {
      console.log(`✅ BUY SIGNAL GENERATED: ${bullishSignals} bullish vs ${bearishSignals} bearish signals`);
      return 'BUY';
    } else if (bearishSignals > bullishSignals && bearishSignals >= 2) {
      console.log(`✅ SELL SIGNAL GENERATED: ${bearishSignals} bearish vs ${bullishSignals} bullish signals`);
      return 'SELL';
    } else {
      console.log(`⚖️ HOLD - SIGNAL CONFLICT: ${bullishSignals} bullish vs ${bearishSignals} bearish signals (need 2+ clear signals)`);
      return 'HOLD';
    }
  }

  private calculatePositionSize(
    capital: number,
    riskReward: number,
    confidence: number
  ): number {
    let baseSize = 0.05; // 5% base position
    
    // Adjust based on confidence
    baseSize *= (confidence / 100);
    
    // Adjust based on risk-reward
    if (riskReward > 3.0) baseSize *= 1.5;
    
    // Cap at maximum position size
    return Math.min(baseSize, this.maxPositionSize);
  }

  private calculateStopTakeProfit(
    price: number,
    action: 'BUY' | 'SELL' | 'HOLD',
    riskReward: number
  ): { stopLoss: number; takeProfit: number } {
    if (action === 'HOLD') {
      return { stopLoss: 0, takeProfit: 0 };
    }
    
    const riskPercent = 0.02; // 2% risk
    const rewardPercent = riskPercent * riskReward;
    
    if (action === 'BUY') {
      return {
        stopLoss: price * (1 - riskPercent),
        takeProfit: price * (1 + rewardPercent)
      };
    } else {
      return {
        stopLoss: price * (1 + riskPercent),
        takeProfit: price * (1 - rewardPercent)
      };
    }
  }

  // Technical indicator calculations
  private calculateRSI(prices: number[]): number {
    if (prices.length < 14) return 50;
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-14).reduce((sum, gain) => sum + gain, 0) / 14;
    const avgLoss = losses.slice(-14).reduce((sum, loss) => sum + loss, 0) / 14;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { signal: number; histogram: number } {
    if (prices.length < 26) {
      return { signal: 0, histogram: 0 };
    }
    
    // Simplified MACD calculation
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
         // Mock signal line (should be EMA of MACD)
     const signalLine = macdLine * 0.9;
     const histogram = macdLine - signalLine;
    
    return { signal: signalLine, histogram: histogram };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private analyzeVolume(volume: number, prices: number[]): { profile: number; surge: boolean } {
    // Mock volume analysis
    const avgVolume = 1000000; // Assume average volume
    const volumeRatio = volume / avgVolume;
    
    return {
      profile: Math.min(100, volumeRatio * 50),
      surge: volumeRatio > 2.0
    };
  }

  private calculateSocialSentiment(fearGreed: number): number {
    // Mock social sentiment based on fear & greed with some randomness
    return fearGreed + (Math.random() - 0.5) * 20;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // Configuration methods
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(100, threshold));
  }

  setMinRiskReward(minRR: number): void {
    this.minRiskReward = Math.max(1.0, minRR);
  }

  setMaxPositionSize(maxSize: number): void {
    this.maxPositionSize = Math.max(0.01, Math.min(1.0, maxSize));
  }
}

export const aiReasoningEngine = new AIReasoningEngine(); 