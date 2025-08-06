#!/usr/bin/env node

/**
 * 📊 Options Flow MCP Server
 * Derivatives and options flow data for market direction analysis
 * Data sources: Options chains, put/call ratios, gamma exposure, flow analysis
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class OptionsFlowServer {
  constructor() {
    this.server = new Server(
      {
        name: 'options-flow-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_options_flow',
          description: 'Get real-time options flow data and unusual activity',
          inputSchema: {
            type: 'object',
            properties: {
              symbols: {
                type: 'array',
                description: 'Crypto symbols to analyze options flow for',
                items: { type: 'string' },
                default: ['BTC', 'ETH', 'SOL']
              },
              timeframe: {
                type: 'string',
                description: 'Analysis timeframe (1h, 4h, 1d, 1w)',
                default: '1d'
              },
              flow_threshold: {
                type: 'number',
                description: 'Minimum flow size to consider significant',
                default: 1000000
              }
            }
          }
        },
        {
          name: 'analyze_put_call_ratio',
          description: 'Analyze put/call ratios for market sentiment',
          inputSchema: {
            type: 'object',
            properties: {
              symbols: {
                type: 'array',
                description: 'Symbols to analyze put/call ratios for',
                items: { type: 'string' },
                default: ['BTC', 'ETH']
              },
              lookback_period: {
                type: 'string',
                description: 'Historical period for comparison (7d, 30d, 90d)',
                default: '30d'
              }
            }
          }
        },
        {
          name: 'track_gamma_exposure',
          description: 'Track gamma exposure and dealer positioning',
          inputSchema: {
            type: 'object',
            properties: {
              symbols: {
                type: 'array',
                description: 'Symbols to track gamma exposure for',
                items: { type: 'string' },
                default: ['BTC', 'ETH']
              },
              expiry_dates: {
                type: 'array',
                description: 'Option expiry dates to focus on',
                items: { type: 'string' },
                default: ['weekly', 'monthly', 'quarterly']
              }
            }
          }
        },
        {
          name: 'detect_unusual_options_activity',
          description: 'Detect unusual options activity and large flow',
          inputSchema: {
            type: 'object',
            properties: {
              detection_sensitivity: {
                type: 'string',
                description: 'Sensitivity level for unusual activity detection',
                enum: ['low', 'medium', 'high'],
                default: 'medium'
              },
              min_volume_multiplier: {
                type: 'number',
                description: 'Minimum volume multiplier vs average',
                default: 3.0
              }
            }
          }
        },
        {
          name: 'analyze_options_skew',
          description: 'Analyze options volatility skew and market expectations',
          inputSchema: {
            type: 'object',
            properties: {
              symbols: {
                type: 'array',
                description: 'Symbols to analyze skew for',
                items: { type: 'string' },
                default: ['BTC', 'ETH']
              },
              skew_type: {
                type: 'string',
                description: 'Type of skew analysis',
                enum: ['term_structure', 'volatility_smile', 'risk_reversal'],
                default: 'volatility_smile'
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_options_flow':
            return await this.getOptionsFlow(args);
          case 'analyze_put_call_ratio':
            return await this.analyzePutCallRatio(args);
          case 'track_gamma_exposure':
            return await this.trackGammaExposure(args);
          case 'detect_unusual_options_activity':
            return await this.detectUnusualActivity(args);
          case 'analyze_options_skew':
            return await this.analyzeOptionsSkew(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async getOptionsFlow(args) {
    const { symbols = ['BTC', 'ETH', 'SOL'], timeframe = '1d', flow_threshold = 1000000 } = args;

    try {
      const flowData = await this.fetchOptionsFlowData(symbols, timeframe, flow_threshold);
      const analysis = this.analyzeFlowData(flowData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbols,
              timeframe,
              flow_threshold,
              options_flow: flowData,
              flow_analysis: analysis,
              significant_flows: flowData.filter(flow => flow.notional >= flow_threshold),
              flow_direction: this.calculateFlowDirection(flowData),
              market_impact: this.assessMarketImpact(flowData),
              flow_concentration: this.analyzeFlowConcentration(flowData),
              institutional_activity: this.detectInstitutionalActivity(flowData),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  async analyzePutCallRatio(args) {
    const { symbols = ['BTC', 'ETH'], lookback_period = '30d' } = args;

    try {
      const putCallData = await this.fetchPutCallData(symbols, lookback_period);
      const analysis = this.analyzePutCallTrends(putCallData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbols,
              lookback_period,
              put_call_ratios: putCallData,
              analysis: analysis,
              current_sentiment: this.interpretPutCallSentiment(putCallData),
              historical_percentiles: this.calculateHistoricalPercentiles(putCallData),
              sentiment_extremes: this.identifySentimentExtremes(putCallData),
              market_prediction: this.predictFromPutCall(analysis),
              contrarian_signals: this.identifyContrarianSignals(putCallData),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  async trackGammaExposure(args) {
    const { symbols = ['BTC', 'ETH'], expiry_dates = ['weekly', 'monthly', 'quarterly'] } = args;

    try {
      const gammaData = await this.fetchGammaExposureData(symbols, expiry_dates);
      const gammaAnalysis = this.analyzeGammaLevels(gammaData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbols,
              expiry_dates,
              gamma_exposure: gammaData,
              gamma_analysis: gammaAnalysis,
              dealer_positioning: this.analyzeDealerPositioning(gammaData),
              gamma_levels: this.identifyKeyGammaLevels(gammaData),
              volatility_impact: this.assessVolatilityImpact(gammaData),
              price_magnetism: this.calculatePriceMagnetism(gammaData),
              hedging_flows: this.predictHedgingFlows(gammaData),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  async detectUnusualActivity(args) {
    const { detection_sensitivity = 'medium', min_volume_multiplier = 3.0 } = args;

    try {
      const unusualActivity = await this.scanForUnusualActivity(detection_sensitivity, min_volume_multiplier);
      const riskAssessment = this.assessUnusualActivityRisk(unusualActivity);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              detection_sensitivity,
              min_volume_multiplier,
              unusual_activity: unusualActivity,
              risk_assessment: riskAssessment,
              activity_patterns: this.analyzeActivityPatterns(unusualActivity),
              potential_catalysts: this.identifyPotentialCatalysts(unusualActivity),
              flow_urgency: this.assessFlowUrgency(unusualActivity),
              recommended_actions: this.recommendActions(riskAssessment),
              monitoring_alerts: this.setupActivityAlerts(unusualActivity),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  async analyzeOptionsSkew(args) {
    const { symbols = ['BTC', 'ETH'], skew_type = 'volatility_smile' } = args;

    try {
      const skewData = await this.fetchOptionsSkewData(symbols, skew_type);
      const skewAnalysis = this.analyzeSkewPatterns(skewData, skew_type);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbols,
              skew_type,
              skew_data: skewData,
              skew_analysis: skewAnalysis,
              market_expectations: this.interpretMarketExpectations(skewData),
              volatility_forecast: this.forecastVolatility(skewData),
              skew_extremes: this.identifySkewExtremes(skewData),
              trading_opportunities: this.identifySkewOpportunities(skewAnalysis),
              risk_indicators: this.extractRiskIndicators(skewData),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  // Mock data generation methods for development/testing
  async fetchOptionsFlowData(symbols, timeframe, threshold) {
    // In production, replace with real API calls to options data providers
    return symbols.map(symbol => ({
      symbol,
      timestamp: new Date().toISOString(),
      flows: Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        type: Math.random() > 0.5 ? 'call' : 'put',
        strike: Math.round(50000 + Math.random() * 20000),
        expiry: this.generateExpiry(),
        volume: Math.round(100 + Math.random() * 5000),
        notional: Math.round(1000000 + Math.random() * 50000000),
        direction: Math.random() > 0.5 ? 'buy' : 'sell',
        iv: 0.4 + Math.random() * 0.6,
        delta: Math.random() * 0.5,
        gamma: Math.random() * 0.1
      }))
    }));
  }

  async fetchPutCallData(symbols, period) {
    return symbols.map(symbol => ({
      symbol,
      period,
      current_ratio: 0.6 + Math.random() * 0.8,
      historical_average: 0.7 + Math.random() * 0.3,
      percentile: Math.random() * 100,
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      daily_ratios: Array.from({ length: 30 }, () => 0.4 + Math.random() * 1.2)
    }));
  }

  async fetchGammaExposureData(symbols, expiries) {
    return symbols.map(symbol => ({
      symbol,
      total_gamma: Math.random() * 1000000000,
      net_gamma: (Math.random() - 0.5) * 500000000,
      gamma_by_strike: this.generateGammaByStrike(),
      dealer_positioning: Math.random() > 0.5 ? 'long_gamma' : 'short_gamma',
      gamma_levels: this.generateGammaLevels(),
      expiry_breakdown: expiries.map(exp => ({
        expiry: exp,
        gamma_exposure: Math.random() * 100000000,
        percentage: Math.random() * 100
      }))
    }));
  }

  async scanForUnusualActivity(sensitivity, multiplier) {
    const alerts = [];
    const now = new Date();
    
    for (let i = 0; i < 15; i++) {
      if (Math.random() < 0.3) { // 30% chance of unusual activity
        alerts.push({
          timestamp: new Date(now.getTime() - Math.random() * 24 * 3600000).toISOString(),
          symbol: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
          type: Math.random() > 0.5 ? 'call' : 'put',
          activity_type: ['large_flow', 'volume_spike', 'open_interest_surge'][Math.floor(Math.random() * 3)],
          volume_multiplier: multiplier + Math.random() * 10,
          unusual_score: Math.random() * 100,
          confidence: 0.7 + Math.random() * 0.3,
          potential_impact: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        });
      }
    }
    
    return alerts;
  }

  async fetchOptionsSkewData(symbols, skewType) {
    return symbols.map(symbol => ({
      symbol,
      skew_type: skewType,
      skew_value: -10 + Math.random() * 20,
      historical_percentile: Math.random() * 100,
      volatility_surface: this.generateVolatilitySurface(),
      risk_reversal: this.generateRiskReversal(),
      term_structure: this.generateTermStructure()
    }));
  }

  // Helper methods for mock data generation
  generateExpiry() {
    const expiryDates = ['2024-12-29', '2025-01-31', '2025-03-28', '2025-06-27'];
    return expiryDates[Math.floor(Math.random() * expiryDates.length)];
  }

  generateGammaByStrike() {
    const strikes = [];
    for (let strike = 40000; strike <= 80000; strike += 5000) {
      strikes.push({
        strike,
        gamma: Math.random() * 1000000
      });
    }
    return strikes;
  }

  generateGammaLevels() {
    return {
      positive_gamma: 60000 + Math.random() * 20000,
      negative_gamma: 45000 + Math.random() * 20000,
      zero_gamma: 52500 + Math.random() * 5000
    };
  }

  generateVolatilitySurface() {
    const surface = [];
    [0.9, 1.0, 1.1].forEach(moneyness => {
      [7, 30, 90].forEach(dte => {
        surface.push({
          moneyness,
          days_to_expiry: dte,
          implied_volatility: 0.3 + Math.random() * 0.7
        });
      });
    });
    return surface;
  }

  generateRiskReversal() {
    return [
      { expiry: '1w', value: -2 + Math.random() * 4 },
      { expiry: '1m', value: -3 + Math.random() * 6 },
      { expiry: '3m', value: -2 + Math.random() * 4 }
    ];
  }

  generateTermStructure() {
    return [
      { expiry: '1w', iv: 0.4 + Math.random() * 0.3 },
      { expiry: '1m', iv: 0.35 + Math.random() * 0.3 },
      { expiry: '3m', iv: 0.3 + Math.random() * 0.3 },
      { expiry: '6m', iv: 0.32 + Math.random() * 0.3 }
    ];
  }

  // Analysis methods
  analyzeFlowData(flowData) {
    return {
      total_flows: flowData.reduce((sum, s) => sum + s.flows.length, 0),
      call_put_ratio: this.calculateCallPutRatio(flowData),
      average_iv: this.calculateAverageIV(flowData),
      flow_bias: this.determineFlowBias(flowData)
    };
  }

  calculateFlowDirection(flowData) {
    const totalBuyFlow = flowData.reduce((sum, s) => 
      sum + s.flows.filter(f => f.direction === 'buy').reduce((fSum, f) => fSum + f.notional, 0), 0);
    const totalSellFlow = flowData.reduce((sum, s) => 
      sum + s.flows.filter(f => f.direction === 'sell').reduce((fSum, f) => fSum + f.notional, 0), 0);
    
    return {
      buy_flow: totalBuyFlow,
      sell_flow: totalSellFlow,
      net_flow: totalBuyFlow - totalSellFlow,
      flow_ratio: totalBuyFlow / (totalSellFlow || 1)
    };
  }

  assessMarketImpact(flowData) {
    const totalNotional = flowData.reduce((sum, s) => 
      sum + s.flows.reduce((fSum, f) => fSum + f.notional, 0), 0);
    
    return {
      total_notional: totalNotional,
      impact_level: totalNotional > 100000000 ? 'high' : totalNotional > 50000000 ? 'medium' : 'low',
      volatility_impact: this.predictVolatilityImpact(totalNotional),
      price_pressure: this.calculatePricePressure(flowData)
    };
  }

  analyzeFlowConcentration(flowData) {
    return {
      concentrated_strikes: this.findConcentratedStrikes(flowData),
      expiry_concentration: this.analyzeExpiryConcentration(flowData),
      institutional_concentration: Math.random() * 100
    };
  }

  detectInstitutionalActivity(flowData) {
    return {
      institutional_probability: Math.random() * 100,
      large_block_trades: flowData.reduce((sum, s) => 
        sum + s.flows.filter(f => f.notional > 10000000).length, 0),
      activity_pattern: Math.random() > 0.5 ? 'coordinated' : 'random'
    };
  }

  calculateCallPutRatio(flowData) {
    const calls = flowData.reduce((sum, s) => sum + s.flows.filter(f => f.type === 'call').length, 0);
    const puts = flowData.reduce((sum, s) => sum + s.flows.filter(f => f.type === 'put').length, 0);
    return calls / (puts || 1);
  }

  calculateAverageIV(flowData) {
    const allFlows = flowData.reduce((acc, s) => [...acc, ...s.flows], []);
    return allFlows.reduce((sum, f) => sum + f.iv, 0) / allFlows.length;
  }

  determineFlowBias(flowData) {
    const analysis = this.analyzeFlowData(flowData);
    if (analysis.call_put_ratio > 1.5) return 'bullish';
    if (analysis.call_put_ratio < 0.7) return 'bearish';
    return 'neutral';
  }

  predictVolatilityImpact(notional) {
    if (notional > 500000000) return 'very_high';
    if (notional > 200000000) return 'high';
    if (notional > 100000000) return 'medium';
    return 'low';
  }

  calculatePricePressure(flowData) {
    const netDelta = flowData.reduce((sum, s) => 
      sum + s.flows.reduce((fSum, f) => fSum + (f.direction === 'buy' ? f.delta : -f.delta), 0), 0);
    
    return {
      net_delta_exposure: netDelta,
      pressure_direction: netDelta > 0 ? 'upward' : 'downward',
      pressure_magnitude: Math.abs(netDelta)
    };
  }

  findConcentratedStrikes(flowData) {
    const strikeVolume = {};
    flowData.forEach(s => {
      s.flows.forEach(f => {
        strikeVolume[f.strike] = (strikeVolume[f.strike] || 0) + f.volume;
      });
    });
    
    return Object.entries(strikeVolume)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([strike, volume]) => ({ strike: parseInt(strike), volume }));
  }

  analyzeExpiryConcentration(flowData) {
    const expiryVolume = {};
    flowData.forEach(s => {
      s.flows.forEach(f => {
        expiryVolume[f.expiry] = (expiryVolume[f.expiry] || 0) + f.volume;
      });
    });
    
    return Object.entries(expiryVolume)
      .sort(([,a], [,b]) => b - a)
      .map(([expiry, volume]) => ({ expiry, volume }));
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🚀 Options Flow MCP Server running on stdio');
  }
}

const server = new OptionsFlowServer();
server.start().catch(console.error); 