import { NextRequest, NextResponse } from 'next/server';
import { aiReasoningEngine } from '../../../lib/ai/reasoning-engine';

interface AnalysisRequest {
  symbol: string;
  timeframe?: string;
  includeAdvancedData?: boolean;
  analysisType?: 'quick' | 'detailed' | 'comprehensive';
}

interface AdvancedMarketIntelligence {
  whaleAlerts?: any[];
  newsAnalysis?: any;
  optionsFlow?: any;
  arbitrageOpportunities?: any[];
  defiYields?: any;
  nftTrends?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { symbol, timeframe = '1d', includeAdvancedData = true, analysisType = 'detailed' } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 AI Analysis Request: ${symbol} (${analysisType})`);

    // Gather market data
    const marketData = await gatherMarketData(symbol, timeframe);
    
    // Gather advanced market intelligence based on analysis type
    let advancedIntelligence: AdvancedMarketIntelligence = {};
    if (includeAdvancedData && analysisType !== 'quick') {
      advancedIntelligence = await gatherAdvancedMarketIntelligence(symbol, analysisType);
    }

    // Run AI analysis
    const analysis = await aiReasoningEngine.analyzeMarket(marketData);

    // Enhanced response with advanced data
    const response = {
      success: true,
      symbol,
      timeframe,
      analysisType,
      timestamp: new Date().toISOString(),
      analysis: {
        action: analysis.action,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        riskReward: analysis.riskReward,
        positionSize: analysis.positionSize,
        stopLoss: analysis.stopLoss,
        takeProfit: analysis.takeProfit,
        marketRegime: analysis.marketRegime,
        indicators: analysis.indicators,
        advancedIntelligence: includeAdvancedData ? advancedIntelligence : undefined
      },
      marketSummary: generateMarketSummary(analysis, advancedIntelligence),
      riskAssessment: generateRiskAssessment(analysis, advancedIntelligence),
      executionPlan: generateExecutionPlan(analysis),
      confidence: {
        overall: analysis.confidence,
        breakdown: analyzeConfidenceBreakdown(analysis, advancedIntelligence)
      }
    };

    console.log(`✅ AI Analysis Complete: ${analysis.action} (${analysis.confidence}% confidence)`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'bitcoin';
    const capital = parseFloat(searchParams.get('capital') || '10000');
    const timeframe = searchParams.get('timeframe') || '1d';
    const analysisType = searchParams.get('analysisType') || 'detailed';

    console.log(`🔍 AI Analysis GET Request: ${symbol} with $${capital} capital`);

    // Gather market data
    const marketData = await gatherMarketData(symbol, timeframe);
    marketData.capital = capital; // Include capital in analysis
    
    // Gather advanced market intelligence
    const advancedIntelligence = await gatherAdvancedMarketIntelligence(symbol, analysisType);

    // Run AI analysis
    const analysis = await aiReasoningEngine.analyzeMarket(marketData);

    // Response structure compatible with the chat panel
    const response = {
      success: true,
      symbol,
      timeframe,
      analysisType,
      timestamp: new Date().toISOString(),
      analysis: {
        action: analysis.action,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        riskReward: analysis.riskReward,
        positionSize: analysis.positionSize,
        stopLoss: analysis.stopLoss,
        takeProfit: analysis.takeProfit,
        marketRegime: analysis.marketRegime,
        indicators: analysis.indicators,
        advancedIntelligence: advancedIntelligence
      },
      marketSummary: generateMarketSummary(analysis, advancedIntelligence),
      riskAssessment: generateRiskAssessment(analysis, advancedIntelligence),
      executionPlan: generateExecutionPlan(analysis),
      confidence: {
        overall: analysis.confidence,
        breakdown: analyzeConfidenceBreakdown(analysis, advancedIntelligence)
      }
    };

    console.log(`✅ AI Analysis Complete: ${analysis.action} (${analysis.confidence}% confidence)`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ AI Analysis GET Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function gatherMarketData(symbol: string, timeframe: string) {
  // Mock market data - in production, integrate with actual crypto APIs
  const basePrice = 50000;
  const prices = Array.from({ length: 100 }, (_, i) => 
    basePrice + (Math.random() - 0.5) * basePrice * 0.1
  );

  return {
    symbol,
    price: prices[prices.length - 1],
    volume: 1000000 + Math.random() * 10000000,
    prices: prices,
    fearGreed: Math.floor(Math.random() * 100),
    capital: 100000 // Default capital
  };
}

async function gatherAdvancedMarketIntelligence(
  symbol: string, 
  analysisType: string
): Promise<AdvancedMarketIntelligence> {
  const intelligence: AdvancedMarketIntelligence = {};

  try {
    // In production, these would call the actual MCP servers
    // For now, we simulate the calls and data structure

    if (analysisType === 'comprehensive') {
      // Comprehensive analysis includes all data sources
      intelligence.whaleAlerts = await mockMCPCall('whale-alerts-server', {
        method: 'get_whale_alerts',
        params: { symbols: [symbol], timeframe: '24h' }
      });

      intelligence.newsAnalysis = await mockMCPCall('news-aggregator-server', {
        method: 'get_market_news',
        params: { symbols: [symbol], priority: 'high' }
      });

      intelligence.optionsFlow = await mockMCPCall('options-flow-server', {
        method: 'get_options_flow',
        params: { symbols: [symbol] }
      });

      intelligence.arbitrageOpportunities = await mockMCPCall('arbitrage-scanner-server', {
        method: 'scan_cex_arbitrage',
        params: { symbols: [`${symbol}/USDT`] }
      });

      intelligence.defiYields = await mockMCPCall('defi-yields-server', {
        method: 'scan_yield_opportunities',
        params: { min_apy: 5.0 }
      });

      intelligence.nftTrends = await mockMCPCall('nft-analytics-server', {
        method: 'analyze_volume_trends',
        params: { timeframe: '24h' }
      });

    } else if (analysisType === 'detailed') {
      // Detailed analysis includes key data sources
      intelligence.whaleAlerts = await mockMCPCall('whale-alerts-server', {
        method: 'get_whale_alerts',
        params: { symbols: [symbol] }
      });

      intelligence.newsAnalysis = await mockMCPCall('news-aggregator-server', {
        method: 'get_market_news',
        params: { symbols: [symbol] }
      });

      intelligence.optionsFlow = await mockMCPCall('options-flow-server', {
        method: 'get_options_flow',
        params: { symbols: [symbol] }
      });
    }

  } catch (error) {
    console.warn(`⚠️ Could not gather some advanced intelligence: ${error}`);
  }

  return intelligence;
}

async function mockMCPCall(server: string, request: any): Promise<any> {
  // Mock MCP server calls for development
  // In production, these would be actual calls to the MCP servers
  
  const mockData = {
    'whale-alerts-server': {
      alerts: Array.from({ length: 3 }, () => ({
        amount: 100 + Math.random() * 10000,
        direction: Math.random() > 0.5 ? 'inflow' : 'outflow',
        exchange: ['binance', 'coinbase', 'kraken'][Math.floor(Math.random() * 3)],
        impact: Math.random() > 0.7 ? 'high' : 'medium'
      }))
    },
    'news-aggregator-server': {
      sentiment: (Math.random() - 0.5) * 2,
      urgency: Math.random() > 0.8 ? 'critical' : 'medium',
      relevantNews: Math.floor(Math.random() * 10),
      marketMoving: Math.random() > 0.7
    },
    'social-analytics-server': {
      twitterSentiment: Math.random() * 100,
      redditSentiment: Math.random() * 100,
      influencerSentiment: Math.random() * 100,
      viralContent: Math.random() > 0.8
    },
    'options-flow-server': {
      putCallRatio: 0.3 + Math.random() * 1.4,
      largeFlows: Math.floor(Math.random() * 15),
      unusualActivity: Math.random() > 0.7
    },
    'arbitrage-scanner-server': {
      opportunities: Array.from({ length: 2 }, () => ({
        exchange1: 'binance',
        exchange2: 'coinbase',
        priceDiff: Math.random() * 500,
        profitPotential: Math.random() * 3
      }))
    },
    'defi-yields-server': {
      averageYield: 5 + Math.random() * 15,
      topOpportunities: Math.floor(Math.random() * 8)
    },
    'nft-analytics-server': {
      volumeChange: (Math.random() - 0.5) * 40,
      sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish'
    },
    'futures-data-server': {
      currentRate: (Math.random() - 0.5) * 0.002,
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
    }
  };

  return mockData[server as keyof typeof mockData] || {};
}

function generateMarketSummary(analysis: any, intelligence: AdvancedMarketIntelligence): any {
  const summary = {
    marketRegime: analysis.marketRegime,
    overallSentiment: calculateOverallSentiment(analysis, intelligence),
    keyFactors: extractKeyFactors(analysis, intelligence),
    marketEfficiency: assessMarketEfficiency(intelligence),
    volatilityExpectation: assessVolatilityExpectation(analysis, intelligence)
  };

  return summary;
}

function generateRiskAssessment(analysis: any, intelligence: AdvancedMarketIntelligence): any {
  let riskScore = 50; // Base risk score
  
  // Adjust based on analysis
  if (analysis.confidence < 70) riskScore += 20;
  if (analysis.riskReward < 2) riskScore += 15;
  
  // Adjust based on advanced intelligence
  if (intelligence.whaleAlerts && intelligence.whaleAlerts.length > 2) {
    riskScore += 10; // Higher risk with whale activity
  }
  
  if (intelligence.newsAnalysis?.urgency === 'critical') {
    riskScore += 25; // Critical news increases risk
  }
  
  if (intelligence.optionsFlow?.unusualActivity) {
    riskScore += 15; // Unusual options activity increases risk
  }

  return {
    riskScore: Math.min(100, riskScore),
    riskLevel: riskScore > 75 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW',
    riskFactors: identifyRiskFactors(analysis, intelligence),
    mitigationStrategies: generateMitigationStrategies(riskScore, analysis)
  };
}

function generateExecutionPlan(analysis: any): any {
  if (analysis.action === 'HOLD') {
    return {
      action: 'HOLD',
      reasoning: 'Market conditions not favorable for trading',
      nextEvaluation: '1h'
    };
  }

  return {
    action: analysis.action,
    entryPrice: analysis.action === 'BUY' ? 'market' : 'limit',
    positionSize: `${(analysis.positionSize * 100).toFixed(1)}%`,
    stopLoss: analysis.stopLoss,
    takeProfit: analysis.takeProfit,
    timeInForce: 'IOC',
    urgency: analysis.confidence > 80 ? 'HIGH' : 'MEDIUM',
    executionStrategy: analysis.confidence > 85 ? 'aggressive' : 'conservative'
  };
}

function analyzeConfidenceBreakdown(analysis: any, intelligence: AdvancedMarketIntelligence): any {
  return {
    technical: Math.min(100, 40 + (analysis.indicators?.rsi > 30 && analysis.indicators?.rsi < 70 ? 20 : 0)),
    sentiment: calculateSentimentConfidence(intelligence),
    fundamental: calculateFundamentalConfidence(intelligence),
    onChain: calculateOnChainConfidence(intelligence),
    marketStructure: calculateMarketStructureConfidence(intelligence)
  };
}

function calculateOverallSentiment(analysis: any, intelligence: AdvancedMarketIntelligence): string {
  let sentimentScore = 50; // Neutral base
  
  // Add analysis sentiment
  if (analysis.action === 'BUY') sentimentScore += 20;
  if (analysis.action === 'SELL') sentimentScore -= 20;
  

  
  // Add news sentiment
  if (intelligence.newsAnalysis?.sentiment) {
    sentimentScore += intelligence.newsAnalysis.sentiment * 10;
  }
  
  if (sentimentScore > 70) return 'BULLISH';
  if (sentimentScore < 30) return 'BEARISH';
  return 'NEUTRAL';
}

function extractKeyFactors(analysis: any, intelligence: AdvancedMarketIntelligence): string[] {
  const factors: string[] = [];
  
  // Add technical factors
  if (analysis.indicators?.rsi > 70) factors.push('RSI Overbought');
  if (analysis.indicators?.rsi < 30) factors.push('RSI Oversold');
  if (analysis.indicators?.volume?.surge) factors.push('Volume Surge');
  
  // Add advanced factors
  if (intelligence.whaleAlerts && intelligence.whaleAlerts.length > 2) factors.push('High Whale Activity');
  if (intelligence.newsAnalysis?.marketMoving) factors.push('Market-Moving News');
  if (intelligence.optionsFlow?.unusualActivity) factors.push('Unusual Options Flow');
  if (intelligence.arbitrageOpportunities && intelligence.arbitrageOpportunities.length > 2) factors.push('Arbitrage Opportunities');
  
  return factors.slice(0, 5); // Top 5 factors
}

function assessMarketEfficiency(intelligence: AdvancedMarketIntelligence): string {
  let inefficiencyScore = 0;
  
  if (intelligence.arbitrageOpportunities && intelligence.arbitrageOpportunities.length > 3) inefficiencyScore += 30;
  if (intelligence.optionsFlow?.unusualActivity) inefficiencyScore += 20;
  if (intelligence.whaleAlerts && intelligence.whaleAlerts.length > 3) inefficiencyScore += 15;
  
  if (inefficiencyScore > 40) return 'LOW_EFFICIENCY';
  if (inefficiencyScore > 20) return 'MODERATE_EFFICIENCY';
  return 'HIGH_EFFICIENCY';
}

function assessVolatilityExpectation(analysis: any, intelligence: AdvancedMarketIntelligence): string {
  let volatilityScore = 50;
  
  if (intelligence.optionsFlow?.unusualActivity) volatilityScore += 20;
  if (intelligence.newsAnalysis?.urgency === 'critical') volatilityScore += 30;
  if (intelligence.whaleAlerts && intelligence.whaleAlerts.length > 2) volatilityScore += 15;
  
  if (volatilityScore > 80) return 'HIGH';
  if (volatilityScore > 60) return 'MODERATE';
  return 'LOW';
}

function identifyRiskFactors(analysis: any, intelligence: AdvancedMarketIntelligence): string[] {
  const risks: string[] = [];
  
  if (analysis.confidence < 70) risks.push('Low Confidence Signal');
  if (intelligence.newsAnalysis?.urgency === 'critical') risks.push('Critical News Events');
  if (intelligence.whaleAlerts && intelligence.whaleAlerts.length > 3) risks.push('High Whale Activity');
  if (intelligence.optionsFlow?.unusualActivity) risks.push('Unusual Derivatives Activity');
  
  return risks;
}

function generateMitigationStrategies(riskScore: number, analysis: any): string[] {
  const strategies: string[] = [];
  
  if (riskScore > 75) {
    strategies.push('Reduce position size by 50%');
    strategies.push('Use tighter stop losses');
    strategies.push('Consider waiting for better entry');
  } else if (riskScore > 50) {
    strategies.push('Use standard position sizing');
    strategies.push('Monitor news closely');
    strategies.push('Set trailing stops');
  } else {
    strategies.push('Can use larger position sizes');
    strategies.push('Standard risk management');
  }
  
  return strategies;
}

function calculateSentimentConfidence(intelligence: AdvancedMarketIntelligence): number {
  // Base sentiment confidence on news analysis when available
  if (intelligence.newsAnalysis?.sentiment) {
    return Math.min(100, Math.max(30, Math.abs(intelligence.newsAnalysis.sentiment) * 100));
  }
  return 50;
}

function calculateFundamentalConfidence(intelligence: AdvancedMarketIntelligence): number {
  let confidence = 50;
  
  if (intelligence.newsAnalysis?.relevantNews > 5) confidence += 15;
  if (intelligence.defiYields?.averageYield > 10) confidence += 10;
  
  return Math.min(100, confidence);
}

function calculateOnChainConfidence(intelligence: AdvancedMarketIntelligence): number {
  let confidence = 50;
  
  if (intelligence.whaleAlerts && intelligence.whaleAlerts.length > 0) {
    const highImpactAlerts = intelligence.whaleAlerts.filter(
      (alert: any) => alert.impact === 'high'
    ).length;
    confidence += highImpactAlerts * 10;
  }
  
  return Math.min(100, confidence);
}

function calculateMarketStructureConfidence(intelligence: AdvancedMarketIntelligence): number {
  let confidence = 50;
  
  if (intelligence.arbitrageOpportunities && intelligence.arbitrageOpportunities.length > 2) confidence -= 15; // Lower confidence with arbitrage
  if (intelligence.optionsFlow?.largeFlows && intelligence.optionsFlow.largeFlows > 10) confidence += 10;
  
  return Math.max(20, Math.min(100, confidence));
}