#!/usr/bin/env node

/**
 * 📈 Futures Data MCP Server
 * Provides funding rates, perpetuals data, and derivatives analytics
 * Data sources: Binance, Bybit, OKX, Deribit APIs
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class FuturesDataServer {
  constructor() {
    this.server = new Server(
      {
        name: 'futures-data-server',
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
          name: 'get_funding_rates',
          description: 'Get current and historical funding rates for perpetual futures',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Trading pair symbol (e.g., BTCUSDT, ETHUSDT)',
                default: 'BTCUSDT'
              },
              exchange: {
                type: 'string',
                description: 'Exchange name (binance, bybit, okx, all)',
                default: 'all'
              },
              timeframe: {
                type: 'string',
                description: 'Historical timeframe (1h, 8h, 24h, 7d)',
                default: '24h'
              }
            }
          }
        },
        {
          name: 'get_open_interest',
          description: 'Get open interest data across exchanges',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Trading pair symbol',
                default: 'BTCUSDT'
              },
              timeframe: {
                type: 'string',
                description: 'Data timeframe (1h, 4h, 24h)',
                default: '24h'
              }
            }
          }
        },
        {
          name: 'get_liquidations',
          description: 'Get recent liquidation data and heatmaps',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Trading pair symbol',
                default: 'BTCUSDT'
              },
              timeframe: {
                type: 'string',
                description: 'Liquidation timeframe (5m, 1h, 24h)',
                default: '1h'
              },
              side: {
                type: 'string',
                description: 'Liquidation side (long, short, both)',
                default: 'both'
              }
            }
          }
        },
        {
          name: 'analyze_futures_sentiment',
          description: 'Analyze futures market sentiment using derivatives data',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Trading pair symbol',
                default: 'BTCUSDT'
              },
              metrics: {
                type: 'array',
                description: 'Metrics to include in analysis',
                items: { type: 'string' },
                default: ['funding_rate', 'open_interest', 'liquidations', 'long_short_ratio']
              }
            }
          }
        },
        {
          name: 'get_options_flow',
          description: 'Get options flow and volatility data',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Underlying asset symbol',
                default: 'BTC'
              },
              expiry: {
                type: 'string',
                description: 'Options expiry (weekly, monthly, quarterly)',
                default: 'weekly'
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
          case 'get_funding_rates':
            return await this.getFundingRates(args);
          case 'get_open_interest':
            return await this.getOpenInterest(args);
          case 'get_liquidations':
            return await this.getLiquidations(args);
          case 'analyze_futures_sentiment':
            return await this.analyzeFuturesSentiment(args);
          case 'get_options_flow':
            return await this.getOptionsFlow(args);
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

  async getFundingRates(args) {
    const { symbol = 'BTCUSDT', exchange = 'all', timeframe = '24h' } = args;

    try {
      const fundingData = await this.fetchFundingRatesData(symbol, exchange, timeframe);
      const analysis = this.analyzeFundingRatesTrend(fundingData);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol,
              exchange,
              timeframe,
              current_funding_rates: fundingData.current,
              historical_data: fundingData.historical,
              analysis: {
                trend: analysis.trend,
                average_rate: analysis.averageRate,
                volatility: analysis.volatility,
                extreme_events: analysis.extremeEvents,
                next_funding_time: analysis.nextFundingTime,
                sentiment_indicator: analysis.sentimentIndicator
              },
              market_impact: {
                bullish_pressure: analysis.bullishPressure,
                bearish_pressure: analysis.bearishPressure,
                squeeze_potential: analysis.squeezePotential
              },
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

  async getOpenInterest(args) {
    const { symbol = 'BTCUSDT', timeframe = '24h' } = args;

    try {
      const oiData = await this.fetchOpenInterestData(symbol, timeframe);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol,
              timeframe,
              open_interest: oiData.current,
              historical_oi: oiData.historical,
              analysis: {
                trend: oiData.trend,
                change_24h: oiData.change24h,
                change_percentage: oiData.changePercentage,
                market_cap_ratio: oiData.marketCapRatio,
                dominance_by_exchange: oiData.exchangeDominance
              },
              signals: {
                buildup_signal: oiData.buildupSignal,
                divergence_signal: oiData.divergenceSignal,
                strength: oiData.signalStrength
              },
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

  async getLiquidations(args) {
    const { symbol = 'BTCUSDT', timeframe = '1h', side = 'both' } = args;

    try {
      const liquidationData = await this.fetchLiquidationData(symbol, timeframe, side);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol,
              timeframe,
              side,
              total_liquidations_usd: liquidationData.totalUsd,
              liquidation_events: liquidationData.events,
              summary: {
                long_liquidations: liquidationData.longLiquidations,
                short_liquidations: liquidationData.shortLiquidations,
                largest_liquidation: liquidationData.largestLiquidation,
                liquidation_rate: liquidationData.liquidationRate
              },
              heatmap: liquidationData.priceHeatmap,
              analysis: {
                cascade_risk: liquidationData.cascadeRisk,
                support_resistance: liquidationData.supportResistance,
                momentum_signals: liquidationData.momentumSignals
              },
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

  async analyzeFuturesSentiment(args) {
    const { symbol = 'BTCUSDT', metrics = ['funding_rate', 'open_interest', 'liquidations', 'long_short_ratio'] } = args;

    try {
      const sentimentData = await this.calculateFuturesSentiment(symbol, metrics);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol,
              metrics_analyzed: metrics,
              overall_sentiment: sentimentData.overallSentiment,
              sentiment_score: sentimentData.sentimentScore, // -100 to +100
              component_scores: sentimentData.componentScores,
              signals: {
                funding_rate_signal: sentimentData.signals.fundingRate,
                open_interest_signal: sentimentData.signals.openInterest,
                liquidation_signal: sentimentData.signals.liquidations,
                long_short_signal: sentimentData.signals.longShort
              },
              recommendations: sentimentData.recommendations,
              risk_assessment: {
                volatility_risk: sentimentData.volatilityRisk,
                liquidity_risk: sentimentData.liquidityRisk,
                leverage_risk: sentimentData.leverageRisk
              },
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

  async getOptionsFlow(args) {
    const { symbol = 'BTC', expiry = 'weekly' } = args;

    try {
      const optionsData = await this.fetchOptionsFlowData(symbol, expiry);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              symbol,
              expiry,
              options_flow: optionsData.flow,
              volatility_surface: optionsData.volatilitySurface,
              max_pain: optionsData.maxPain,
              put_call_ratio: optionsData.putCallRatio,
              gamma_exposure: optionsData.gammaExposure,
              analysis: {
                sentiment: optionsData.sentiment,
                expected_move: optionsData.expectedMove,
                volatility_skew: optionsData.volatilitySkew,
                dealer_positioning: optionsData.dealerPositioning
              },
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

  // Mock data generation methods (replace with real API calls in production)
  
  async fetchFundingRatesData(symbol, exchange, timeframe) {
    const exchanges = exchange === 'all' ? ['binance', 'bybit', 'okx'] : [exchange];
    const current = {};
    const historical = [];

    exchanges.forEach(ex => {
      current[ex] = {
        rate: (Math.random() - 0.5) * 0.001, // -0.05% to +0.05%
        next_funding: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        predicted_rate: (Math.random() - 0.5) * 0.001
      };
    });

    // Generate historical data
    for (let i = 0; i < 24; i++) {
      historical.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        average_rate: (Math.random() - 0.5) * 0.001,
        volume_weighted_rate: (Math.random() - 0.5) * 0.001
      });
    }

    return { current, historical };
  }

  async fetchOpenInterestData(symbol, timeframe) {
    const currentOI = Math.floor(Math.random() * 10000000000) + 5000000000; // $5B - $15B
    const historical = [];

    for (let i = 0; i < 24; i++) {
      historical.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        open_interest: currentOI + (Math.random() - 0.5) * 1000000000,
        change: (Math.random() - 0.5) * 500000000
      });
    }

    return {
      current: currentOI,
      historical,
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      change24h: (Math.random() - 0.5) * 1000000000,
      changePercentage: (Math.random() - 0.5) * 20,
      marketCapRatio: Math.random() * 0.3 + 0.1,
      exchangeDominance: {
        binance: Math.random() * 40 + 30,
        bybit: Math.random() * 30 + 20,
        okx: Math.random() * 20 + 10
      },
      buildupSignal: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)],
      divergenceSignal: Math.random() > 0.7 ? 'divergence_detected' : 'no_divergence',
      signalStrength: Math.floor(Math.random() * 100)
    };
  }

  async fetchLiquidationData(symbol, timeframe, side) {
    const events = [];
    const eventCount = Math.floor(Math.random() * 50) + 10;

    for (let i = 0; i < eventCount; i++) {
      events.push({
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        side: side === 'both' ? (Math.random() > 0.5 ? 'long' : 'short') : side,
        amount_usd: Math.floor(Math.random() * 5000000) + 100000,
        price: Math.floor(Math.random() * 10000) + 90000,
        exchange: ['binance', 'bybit', 'okx'][Math.floor(Math.random() * 3)]
      });
    }

    const totalUsd = events.reduce((sum, e) => sum + e.amount_usd, 0);
    const longLiqs = events.filter(e => e.side === 'long').reduce((sum, e) => sum + e.amount_usd, 0);
    const shortLiqs = events.filter(e => e.side === 'short').reduce((sum, e) => sum + e.amount_usd, 0);

    return {
      totalUsd,
      events: events.sort((a, b) => b.amount_usd - a.amount_usd).slice(0, 20),
      longLiquidations: longLiqs,
      shortLiquidations: shortLiqs,
      largestLiquidation: Math.max(...events.map(e => e.amount_usd)),
      liquidationRate: events.length / (parseInt(timeframe) || 1),
      priceHeatmap: this.generateLiquidationHeatmap(events),
      cascadeRisk: Math.floor(Math.random() * 100),
      supportResistance: this.identifyLiquidationClusters(events),
      momentumSignals: this.analyzeLiquidationMomentum(events)
    };
  }

  async calculateFuturesSentiment(symbol, metrics) {
    const componentScores = {};
    
    if (metrics.includes('funding_rate')) {
      componentScores.funding_rate = (Math.random() - 0.5) * 100;
    }
    if (metrics.includes('open_interest')) {
      componentScores.open_interest = (Math.random() - 0.5) * 100;
    }
    if (metrics.includes('liquidations')) {
      componentScores.liquidations = (Math.random() - 0.5) * 100;
    }
    if (metrics.includes('long_short_ratio')) {
      componentScores.long_short_ratio = (Math.random() - 0.5) * 100;
    }

    const sentimentScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0) / Object.keys(componentScores).length;
    
    return {
      overallSentiment: sentimentScore > 20 ? 'BULLISH' : sentimentScore < -20 ? 'BEARISH' : 'NEUTRAL',
      sentimentScore,
      componentScores,
      signals: {
        fundingRate: componentScores.funding_rate > 0 ? 'BULLISH' : 'BEARISH',
        openInterest: componentScores.open_interest > 0 ? 'INCREASING' : 'DECREASING',
        liquidations: componentScores.liquidations > 0 ? 'LONG_SQUEEZE' : 'SHORT_SQUEEZE',
        longShort: componentScores.long_short_ratio > 0 ? 'LONG_HEAVY' : 'SHORT_HEAVY'
      },
      recommendations: this.generateTradingRecommendations(sentimentScore, componentScores),
      volatilityRisk: Math.floor(Math.random() * 100),
      liquidityRisk: Math.floor(Math.random() * 100),
      leverageRisk: Math.floor(Math.random() * 100)
    };
  }

  async fetchOptionsFlowData(symbol, expiry) {
    return {
      flow: {
        total_volume: Math.floor(Math.random() * 1000000000),
        call_volume: Math.floor(Math.random() * 500000000),
        put_volume: Math.floor(Math.random() * 500000000),
        net_flow: (Math.random() - 0.5) * 200000000
      },
      volatilitySurface: this.generateVolatilitySurface(),
      maxPain: Math.floor(Math.random() * 20000) + 90000,
      putCallRatio: Math.random() * 2 + 0.5,
      gammaExposure: (Math.random() - 0.5) * 1000000000,
      sentiment: ['BULLISH', 'BEARISH', 'NEUTRAL'][Math.floor(Math.random() * 3)],
      expectedMove: Math.random() * 10 + 2,
      volatilitySkew: Math.random() * 20 - 10,
      dealerPositioning: Math.random() > 0.5 ? 'LONG_GAMMA' : 'SHORT_GAMMA'
    };
  }

  // Helper methods
  
  analyzeFundingRatesTrend(fundingData) {
    const rates = fundingData.historical.map(h => h.average_rate);
    const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const volatility = Math.sqrt(rates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rates.length);
    
    return {
      trend: rates[0] > rates[rates.length - 1] ? 'increasing' : 'decreasing',
      averageRate: avgRate,
      volatility,
      extremeEvents: rates.filter(r => Math.abs(r) > 0.01).length,
      nextFundingTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      sentimentIndicator: avgRate > 0.001 ? 'BULLISH' : avgRate < -0.001 ? 'BEARISH' : 'NEUTRAL',
      bullishPressure: Math.max(0, avgRate * 10000),
      bearishPressure: Math.max(0, -avgRate * 10000),
      squeezePotential: Math.abs(avgRate) > 0.005 ? 'HIGH' : 'LOW'
    };
  }

  generateLiquidationHeatmap(events) {
    const priceRanges = {};
    events.forEach(event => {
      const priceRange = Math.floor(event.price / 1000) * 1000;
      priceRanges[priceRange] = (priceRanges[priceRange] || 0) + event.amount_usd;
    });
    return Object.entries(priceRanges).map(([price, volume]) => ({ price: parseInt(price), volume }));
  }

  identifyLiquidationClusters(events) {
    const clusters = [];
    const sortedEvents = events.sort((a, b) => a.price - b.price);
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      if (Math.abs(current.price - next.price) < 1000) { // Within $1000
        clusters.push({
          price_range: `${current.price}-${next.price}`,
          total_volume: current.amount_usd + next.amount_usd,
          level_type: current.amount_usd > 1000000 ? 'major' : 'minor'
        });
      }
    }
    
    return clusters.slice(0, 10); // Top 10 clusters
  }

  analyzeLiquidationMomentum(events) {
    const timeWindows = [300000, 900000, 1800000]; // 5min, 15min, 30min
    const momentum = {};
    
    timeWindows.forEach(window => {
      const recentEvents = events.filter(e => new Date(e.timestamp) > new Date(Date.now() - window));
      const totalVolume = recentEvents.reduce((sum, e) => sum + e.amount_usd, 0);
      const acceleration = totalVolume / (window / 1000); // Volume per second
      
      momentum[`${window/60000}min`] = {
        volume: totalVolume,
        acceleration,
        trend: acceleration > 1000 ? 'ACCELERATING' : 'DECELERATING'
      };
    });
    
    return momentum;
  }

  generateTradingRecommendations(sentimentScore, componentScores) {
    const recommendations = [];
    
    if (Math.abs(sentimentScore) > 50) {
      recommendations.push(sentimentScore > 0 ? 'Consider long positions' : 'Consider short positions');
    }
    
    if (componentScores.funding_rate && Math.abs(componentScores.funding_rate) > 30) {
      recommendations.push('Monitor funding rate arbitrage opportunities');
    }
    
    if (componentScores.liquidations && Math.abs(componentScores.liquidations) > 40) {
      recommendations.push('High liquidation activity - exercise caution with leverage');
    }
    
    recommendations.push('Use proper risk management');
    
    return recommendations;
  }

  generateVolatilitySurface() {
    const strikes = [90000, 95000, 100000, 105000, 110000];
    const expiries = ['1w', '2w', '1m', '3m'];
    const surface = {};
    
    expiries.forEach(expiry => {
      surface[expiry] = {};
      strikes.forEach(strike => {
        surface[expiry][strike] = Math.random() * 50 + 20; // 20-70% implied volatility
      });
    });
    
    return surface;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('📈 Futures Data MCP server running on stdio');
  }
}

const server = new FuturesDataServer();
server.run().catch(console.error); 