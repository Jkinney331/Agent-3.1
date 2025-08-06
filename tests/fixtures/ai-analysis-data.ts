/**
 * AI Analysis Test Fixtures
 * Comprehensive test data for AI reasoning engine and market analysis
 */

import { TradingSignal, IndicatorData, AdvancedMarketData } from '../../lib/ai/reasoning-engine';

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  prices: number[];
  fearGreed: number;
  capital: number;
}

/**
 * Market Data Scenarios for Different Conditions
 */
export const MARKET_DATA_SCENARIOS = {
  BULL_MARKET: {
    symbol: 'BTC/USD',
    price: 50000,
    volume: 2500000,
    prices: [42000, 43200, 44500, 45800, 47200, 48600, 49800, 50000],
    fearGreed: 75, // Greed
    capital: 100000
  } as MarketData,

  BEAR_MARKET: {
    symbol: 'BTC/USD',
    price: 40000,
    volume: 3200000,
    prices: [48000, 46800, 45500, 44200, 43000, 41800, 40500, 40000],
    fearGreed: 25, // Fear
    capital: 100000
  } as MarketData,

  EXTREME_FEAR: {
    symbol: 'BTC/USD',
    price: 35000,
    volume: 5000000,
    prices: [45000, 42000, 39000, 37000, 36000, 35500, 35200, 35000],
    fearGreed: 10, // Extreme Fear
    capital: 100000
  } as MarketData,

  EXTREME_GREED: {
    symbol: 'BTC/USD',
    price: 65000,
    volume: 1800000,
    prices: [55000, 57000, 59000, 61000, 62500, 63800, 64500, 65000],
    fearGreed: 90, // Extreme Greed
    capital: 100000
  } as MarketData,

  RANGING_MARKET: {
    symbol: 'BTC/USD',
    price: 50000,
    volume: 1200000,
    prices: [49500, 50200, 49800, 50100, 49900, 50300, 49700, 50000],
    fearGreed: 50, // Neutral
    capital: 100000
  } as MarketData,

  HIGH_VOLATILITY: {
    symbol: 'ETH/USD',
    price: 2500,
    volume: 8000000,
    prices: [2200, 2600, 2300, 2700, 2400, 2800, 2300, 2500],
    fearGreed: 45,
    capital: 100000
  } as MarketData,

  LOW_VOLATILITY: {
    symbol: 'BTC/USD',
    price: 50000,
    volume: 800000,
    prices: [49800, 49900, 50000, 50100, 49950, 50050, 49975, 50000],
    fearGreed: 55,
    capital: 100000
  } as MarketData
};

/**
 * Expected Trading Signals for Test Scenarios
 */
export const EXPECTED_SIGNALS = {
  BULL_MARKET: {
    action: 'BUY',
    confidenceRange: [65, 85],
    riskRewardMin: 1.8,
    marketRegime: 'BULL'
  },

  BEAR_MARKET: {
    action: 'SELL',
    confidenceRange: [60, 80], 
    riskRewardMin: 1.5,
    marketRegime: 'BEAR'
  },

  EXTREME_FEAR: {
    action: 'BUY', // Contrarian signal
    confidenceRange: [70, 90],
    riskRewardMin: 2.0,
    marketRegime: 'BEAR'
  },

  EXTREME_GREED: {
    action: 'SELL', // Contrarian signal
    confidenceRange: [65, 85],
    riskRewardMin: 1.5,
    marketRegime: 'BULL'
  },

  RANGING_MARKET: {
    action: 'HOLD',
    confidenceRange: [40, 60],
    riskRewardMin: 1.0,
    marketRegime: 'RANGE'
  }
};

/**
 * Mock Indicator Data for Different Market Conditions
 */
export const INDICATOR_SCENARIOS = {
  OVERSOLD_BULLISH: {
    rsi: 25,
    macd: { signal: 500, histogram: 300 },
    volume: { profile: 85, surge: true },
    sentiment: { fearGreed: 20 }
  } as IndicatorData,

  OVERBOUGHT_BEARISH: {
    rsi: 75,
    macd: { signal: -200, histogram: -400 },
    volume: { profile: 70, surge: true },
    sentiment: { fearGreed: 85 }
  } as IndicatorData,

  NEUTRAL_MIXED: {
    rsi: 50,
    macd: { signal: 50, histogram: -20 },
    volume: { profile: 45, surge: false },
    sentiment: { fearGreed: 55 }
  } as IndicatorData,

  STRONG_BULLISH: {
    rsi: 35,
    macd: { signal: 800, histogram: 600 },
    volume: { profile: 95, surge: true },
    sentiment: { fearGreed: 30 }
  } as IndicatorData,

  STRONG_BEARISH: {
    rsi: 80,
    macd: { signal: -600, histogram: -800 },
    volume: { profile: 90, surge: true },
    sentiment: { fearGreed: 15 }
  } as IndicatorData,

  WEAK_SIGNALS: {
    rsi: 55,
    macd: { signal: 50, histogram: 30 },
    volume: { profile: 30, surge: false },
    sentiment: { fearGreed: 60 }
  } as IndicatorData
};

/**
 * Advanced Market Data Mock Scenarios
 */
export const ADVANCED_DATA_SCENARIOS = {
  WHALE_ACCUMULATION: {
    whaleAlerts: [
      { amount: 5000, direction: 'inflow' as const, exchange: 'binance', timestamp: '2025-01-15T10:00:00Z', impact: 'high' as const },
      { amount: 3200, direction: 'inflow' as const, exchange: 'coinbase', timestamp: '2025-01-15T10:15:00Z', impact: 'medium' as const },
      { amount: 8000, direction: 'inflow' as const, exchange: 'kraken', timestamp: '2025-01-15T10:30:00Z', impact: 'high' as const }
    ],
    newsAnalysis: {
      sentiment: 0.7,
      urgency: 'medium' as const,
      relevantNews: 12,
      marketMoving: true
    },
    optionsFlow: {
      putCallRatio: 0.4,
      largeFlows: 8,
      unusualActivity: false,
      impliedVolatility: 0.45,
      gammaExposure: 2500000
    }
  } as AdvancedMarketData,

  WHALE_DISTRIBUTION: {
    whaleAlerts: [
      { amount: 4500, direction: 'outflow' as const, exchange: 'binance', timestamp: '2025-01-15T10:00:00Z', impact: 'high' as const },
      { amount: 6200, direction: 'outflow' as const, exchange: 'coinbase', timestamp: '2025-01-15T10:15:00Z', impact: 'high' as const },
      { amount: 2800, direction: 'outflow' as const, exchange: 'bybit', timestamp: '2025-01-15T10:30:00Z', impact: 'medium' as const }
    ],
    newsAnalysis: {
      sentiment: -0.5,
      urgency: 'high' as const,
      relevantNews: 8,
      marketMoving: true
    },
    optionsFlow: {
      putCallRatio: 1.8,
      largeFlows: 15,
      unusualActivity: true,
      impliedVolatility: 0.75,
      gammaExposure: -1200000
    }
  } as AdvancedMarketData,

  MARKET_NEWS_CRISIS: {
    newsAnalysis: {
      sentiment: -0.8,
      urgency: 'critical' as const,
      relevantNews: 25,
      marketMoving: true
    },
    optionsFlow: {
      putCallRatio: 2.5,
      largeFlows: 30,
      unusualActivity: true,
      impliedVolatility: 1.2,
      gammaExposure: -5000000
    }
  } as AdvancedMarketData,

  BULLISH_CONFLUENCE: {
    whaleAlerts: [
      { amount: 2000, direction: 'inflow' as const, exchange: 'binance', timestamp: '2025-01-15T10:00:00Z', impact: 'medium' as const }
    ],
    newsAnalysis: {
      sentiment: 0.8,
      urgency: 'high' as const,
      relevantNews: 15,
      marketMoving: true
    },
    optionsFlow: {
      putCallRatio: 0.3,
      largeFlows: 12,
      unusualActivity: false,
      impliedVolatility: 0.35,
      gammaExposure: 3500000
    },
    arbitrageOpps: [
      { exchange1: 'binance', exchange2: 'coinbase', priceDiff: 150, profitPotential: 2.5 },
      { exchange1: 'kraken', exchange2: 'bybit', priceDiff: 120, profitPotential: 1.8 }
    ]
  } as AdvancedMarketData,

  QUIET_MARKET: {
    whaleAlerts: [],
    newsAnalysis: {
      sentiment: 0.1,
      urgency: 'low' as const,
      relevantNews: 3,
      marketMoving: false
    },
    optionsFlow: {
      putCallRatio: 0.9,
      largeFlows: 2,
      unusualActivity: false,
      impliedVolatility: 0.25,
      gammaExposure: 500000
    }
  } as AdvancedMarketData
};

/**
 * Test Trading Signals - Expected Results
 */
export const SAMPLE_TRADING_SIGNALS = {
  STRONG_BUY: {
    symbol: 'BTC/USD',
    action: 'BUY' as const,
    confidence: 85,
    reasoning: [
      'Market regime identified as BULL',
      'RSI at 25.0 indicates oversold conditions',
      'MACD histogram positive, indicating bullish momentum',
      'Volume surge detected, confirming price movement',
      'Extreme fear detected (20.0), potential buying opportunity',
      'Risk-reward ratio calculated at 2.50',
      'Whale activity detected: inflow movements suggest accumulation'
    ],
    riskReward: 2.5,
    positionSize: 0.08,
    stopLoss: 49000,
    takeProfit: 55000,
    marketRegime: 'BULL' as const,
    timestamp: new Date('2025-01-15T10:00:00Z')
  } as TradingSignal,

  STRONG_SELL: {
    symbol: 'BTC/USD',
    action: 'SELL' as const,
    confidence: 78,
    reasoning: [
      'Market regime identified as BEAR',
      'RSI at 75.0 indicates overbought conditions', 
      'MACD histogram negative, indicating bearish momentum',
      'Volume surge detected, confirming price movement',
      'Extreme greed detected (85.0), potential reversal risk',
      'Risk-reward ratio calculated at 2.20',
      'Whale activity detected: outflow movements suggest distribution'
    ],
    riskReward: 2.2,
    positionSize: 0.07,
    stopLoss: 51000,
    takeProfit: 45000,
    marketRegime: 'BEAR' as const,
    timestamp: new Date('2025-01-15T10:00:00Z')
  } as TradingSignal,

  HOLD_SIGNAL: {
    symbol: 'BTC/USD',
    action: 'HOLD' as const,
    confidence: 45,
    reasoning: [
      'Market regime identified as RANGE',
      'RSI at 50.0 indicates neutral conditions',
      'MACD histogram mixed signals',
      'Low volume, weak confirmation',
      'Risk-reward ratio below threshold at 1.30'
    ],
    riskReward: 1.3,
    positionSize: 0,
    stopLoss: 0,
    takeProfit: 0,
    marketRegime: 'RANGE' as const,
    timestamp: new Date('2025-01-15T10:00:00Z')
  } as TradingSignal
};

/**
 * Performance Test Data - Large Datasets
 */
export const PERFORMANCE_TEST_DATA = {
  LARGE_PRICE_HISTORY: Array.from({ length: 1000 }, (_, i) => {
    const basePrice = 50000;
    const trend = i * 10; // Upward trend
    const noise = (Math.random() - 0.5) * 1000;
    return basePrice + trend + noise;
  }),

  HIGH_FREQUENCY_UPDATES: Array.from({ length: 10000 }, (_, i) => ({
    timestamp: Date.now() + i * 1000,
    price: 50000 + (Math.random() - 0.5) * 5000,
    volume: 1000000 + Math.random() * 2000000
  })),

  MULTI_SYMBOL_DATA: ['BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD'].map(symbol => ({
    symbol,
    ...MARKET_DATA_SCENARIOS.BULL_MARKET,
    symbol: symbol
  }))
};

/**
 * Edge Case Scenarios
 */
export const EDGE_CASES = {
  ZERO_VOLUME: {
    ...MARKET_DATA_SCENARIOS.BULL_MARKET,
    volume: 0
  },

  EXTREME_PRICE_SPIKE: {
    ...MARKET_DATA_SCENARIOS.BULL_MARKET,
    prices: [50000, 50100, 50200, 50300, 75000], // 50% spike
    price: 75000
  },

  INSUFFICIENT_DATA: {
    symbol: 'NEW/USD',
    price: 1.50,
    volume: 100000,
    prices: [1.45, 1.50], // Only 2 data points
    fearGreed: 50,
    capital: 100000
  },

  NEGATIVE_FEAR_GREED: {
    ...MARKET_DATA_SCENARIOS.BULL_MARKET,
    fearGreed: -10 // Invalid negative value
  },

  EXTREME_VOLATILITY: {
    symbol: 'MEME/USD',
    price: 0.001,
    volume: 50000000,
    prices: [0.0005, 0.002, 0.0003, 0.005, 0.0001, 0.01, 0.0002, 0.001],
    fearGreed: 95,
    capital: 100000
  }
};

/**
 * Time-series Test Data for Pattern Recognition
 */
export const PATTERN_TEST_DATA = {
  DOUBLE_BOTTOM: [100, 95, 85, 90, 95, 100, 110, 105, 85, 88, 95, 105, 115],
  HEAD_SHOULDERS: [100, 110, 105, 125, 115, 110, 105, 100, 95],
  ASCENDING_TRIANGLE: [100, 110, 105, 110, 107, 110, 108, 110, 109, 110, 112],
  BULL_FLAG: [100, 110, 120, 130, 140, 135, 132, 138, 135, 140, 145, 150],
  BEAR_FLAG: [100, 90, 80, 70, 60, 65, 68, 62, 65, 60, 55, 50]
};

export default {
  MARKET_DATA_SCENARIOS,
  EXPECTED_SIGNALS,
  INDICATOR_SCENARIOS,
  ADVANCED_DATA_SCENARIOS,
  SAMPLE_TRADING_SIGNALS,
  PERFORMANCE_TEST_DATA,
  EDGE_CASES,
  PATTERN_TEST_DATA
};