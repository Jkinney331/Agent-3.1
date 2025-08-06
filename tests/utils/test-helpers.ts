/**
 * Test utility functions and helpers
 */

import {
  DynamicTrailingStopConfig,
  TrailingStopState,
  Position,
  MarketRegime,
  ATRCalculation,
  MarketVolatilityMetrics,
  CandlestickData,
  PositionSide
} from '../../types/trading';

/**
 * Creates a default Dynamic Trailing Stop configuration for testing
 */
export const createDefaultTrailingStopConfig = (overrides: Partial<DynamicTrailingStopConfig> = {}): DynamicTrailingStopConfig => {
  return {
    enabled: true,
    baseTrailingPercent: 2.0,
    atrMultiplier: 1.5,
    minTrailingPercent: 0.5,
    maxTrailingPercent: 5.0,
    confidenceThreshold: 70,
    updateInterval: 5000,
    marketRegimeAdjustment: {
      bull: 1.2,
      bear: 0.8,
      range: 1.0,
      volatile: 0.7
    },
    ...overrides
  };
};

/**
 * Creates a mock trailing stop state for testing
 */
export const createMockTrailingStopState = (
  positionId: string,
  symbol: string,
  side: PositionSide,
  overrides: Partial<TrailingStopState> = {}
): TrailingStopState => {
  return {
    id: `ts_${positionId}`,
    positionId,
    symbol,
    side,
    currentStopPrice: side === 'LONG' ? 48000 : 52000,
    highestPrice: side === 'LONG' ? 50000 : 48000,
    lowestPrice: side === 'LONG' ? 52000 : 50000,
    trailingPercent: 2.0,
    lastUpdated: new Date(),
    isActive: true,
    triggerCount: 0,
    atrValue: 1200,
    aiConfidence: 75,
    marketRegime: 'BULL',
    reasoningChain: ['Initial trailing stop set'],
    ...overrides
  };
};

/**
 * Creates a mock position for testing
 */
export const createMockPosition = (
  symbol: string,
  side: PositionSide,
  overrides: Partial<Position> = {}
): Position => {
  return {
    id: `pos_${Date.now()}`,
    symbol,
    side,
    size: 0.1,
    entryPrice: 50000,
    currentPrice: 50000,
    markPrice: 50000,
    unrealizedPnL: 0,
    unrealizedPnLPercentage: 0,
    leverage: 2,
    margin: 2500,
    liquidationPrice: side === 'LONG' ? 25000 : 75000,
    createdAt: new Date(),
    strategy: 'AI_DYNAMIC',
    stopLoss: side === 'LONG' ? 48000 : 52000,
    takeProfit: side === 'LONG' ? 55000 : 45000,
    ...overrides
  };
};

/**
 * Creates mock candlestick data for testing
 */
export const createMockCandlestickData = (
  basePrice: number,
  count: number,
  volatility: number = 0.02
): CandlestickData[] => {
  const candles: CandlestickData[] = [];
  let currentPrice = basePrice;
  const baseTime = Date.now() - (count * 60000); // 1 minute intervals

  for (let i = 0; i < count; i++) {
    const open = currentPrice;
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
    const volume = 100 + Math.random() * 900;

    candles.push({
      openTime: baseTime + (i * 60000),
      open,
      high,
      low,
      close,
      volume,
      closeTime: baseTime + ((i + 1) * 60000) - 1,
      quoteAssetVolume: volume * ((open + close) / 2),
      numberOfTrades: Math.floor(volume / 10),
      takerBuyBaseAssetVolume: volume * 0.6,
      takerBuyQuoteAssetVolume: volume * 0.6 * ((open + close) / 2)
    });

    currentPrice = close;
  }

  return candles;
};

/**
 * Creates mock ATR calculation for testing
 */
export const createMockATRCalculation = (
  period: number = 14,
  currentValue: number = 1200
): ATRCalculation => {
  const values = Array.from({ length: period }, (_, i) => 
    currentValue * (0.8 + Math.random() * 0.4)
  );
  
  return {
    period,
    values,
    current: currentValue,
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    normalized: currentValue / 50000 // Normalized against base price
  };
};

/**
 * Creates mock volatility metrics for testing
 */
export const createMockVolatilityMetrics = (
  regime: MarketVolatilityMetrics['volatilityRegime'] = 'NORMAL'
): MarketVolatilityMetrics => {
  const baseAtr = regime === 'LOW' ? 800 : regime === 'HIGH' ? 2000 : regime === 'EXTREME' ? 3500 : 1200;
  
  return {
    atr14: baseAtr,
    atr21: baseAtr * 1.1,
    historicalVolatility: baseAtr * 0.8,
    impliedVolatility: baseAtr * 1.2,
    volatilityRank: regime === 'LOW' ? 20 : regime === 'HIGH' ? 80 : regime === 'EXTREME' ? 95 : 50,
    volatilityRegime: regime
  };
};

/**
 * Generates price movement scenarios for testing
 */
export interface PriceScenario {
  name: string;
  startPrice: number;
  endPrice: number;
  steps: number;
  volatility: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
}

export const PRICE_SCENARIOS: PriceScenario[] = [
  {
    name: 'Steady Bull Run',
    startPrice: 50000,
    endPrice: 60000,
    steps: 20,
    volatility: 0.01,
    trend: 'UP'
  },
  {
    name: 'Sharp Drop',
    startPrice: 50000,
    endPrice: 40000,
    steps: 10,
    volatility: 0.03,
    trend: 'DOWN'
  },
  {
    name: 'Crypto Flash Crash',
    startPrice: 50000,
    endPrice: 30000,
    steps: 5,
    volatility: 0.05,
    trend: 'DOWN'
  },
  {
    name: 'Sideways Consolidation',
    startPrice: 50000,
    endPrice: 50500,
    steps: 30,
    volatility: 0.015,
    trend: 'SIDEWAYS'
  },
  {
    name: 'High Volatility Range',
    startPrice: 50000,
    endPrice: 51000,
    steps: 15,
    volatility: 0.04,
    trend: 'SIDEWAYS'
  }
];

/**
 * Generates price data based on a scenario
 */
export const generatePriceScenario = (scenario: PriceScenario): number[] => {
  const prices: number[] = [scenario.startPrice];
  const priceChange = (scenario.endPrice - scenario.startPrice) / scenario.steps;
  
  for (let i = 1; i <= scenario.steps; i++) {
    const trendPrice = scenario.startPrice + (priceChange * i);
    const noise = (Math.random() - 0.5) * 2 * scenario.volatility * trendPrice;
    const finalPrice = trendPrice + noise;
    prices.push(Math.max(finalPrice, scenario.startPrice * 0.1)); // Prevent negative prices
  }
  
  return prices;
};

/**
 * Market regime scenarios for testing
 */
export const MARKET_REGIME_SCENARIOS = {
  BULL: {
    regime: 'BULL' as MarketRegime,
    confidenceScores: [75, 80, 85, 90, 88, 92],
    volatilityRegime: 'NORMAL' as const,
    priceDirection: 'UP' as const
  },
  BEAR: {
    regime: 'BEAR' as MarketRegime,
    confidenceScores: [70, 65, 60, 75, 68, 72],
    volatilityRegime: 'HIGH' as const,
    priceDirection: 'DOWN' as const
  },
  RANGE: {
    regime: 'RANGE' as MarketRegime,
    confidenceScores: [55, 60, 58, 62, 59, 61],
    volatilityRegime: 'LOW' as const,
    priceDirection: 'SIDEWAYS' as const
  },
  VOLATILE: {
    regime: 'VOLATILE' as MarketRegime,
    confidenceScores: [45, 50, 40, 55, 48, 52],
    volatilityRegime: 'EXTREME' as const,
    priceDirection: 'SIDEWAYS' as const
  }
};

/**
 * Assert helpers for testing
 */
export const assertTrailingStopWithinBounds = (
  stopPrice: number,
  currentPrice: number,
  side: PositionSide,
  maxPercent: number
) => {
  const maxDistance = currentPrice * (maxPercent / 100);
  
  if (side === 'LONG') {
    expect(stopPrice).toBeLessThanOrEqual(currentPrice);
    expect(currentPrice - stopPrice).toBeLessThanOrEqual(maxDistance);
  } else {
    expect(stopPrice).toBeGreaterThanOrEqual(currentPrice);
    expect(stopPrice - currentPrice).toBeLessThanOrEqual(maxDistance);
  }
};

/**
 * Time utilities for testing
 */
export const advanceTimeBy = (milliseconds: number) => {
  jest.advanceTimersByTime(milliseconds);
};

export const setSystemTime = (date: Date | string) => {
  jest.setSystemTime(new Date(date));
};

/**
 * Mock AI confidence scenarios
 */
export const AI_CONFIDENCE_SCENARIOS = {
  HIGH_CONFIDENCE: {
    score: 85,
    reasoning: ['Strong momentum indicators', 'High volume confirmation', 'Technical breakout confirmed']
  },
  MEDIUM_CONFIDENCE: {
    score: 65,
    reasoning: ['Mixed signals detected', 'Moderate volume', 'Uncertain market direction']
  },
  LOW_CONFIDENCE: {
    score: 45,
    reasoning: ['Conflicting indicators', 'Low volume', 'High market uncertainty']
  }
};

export default {
  createDefaultTrailingStopConfig,
  createMockTrailingStopState,
  createMockPosition,
  createMockCandlestickData,
  createMockATRCalculation,
  createMockVolatilityMetrics,
  generatePriceScenario,
  PRICE_SCENARIOS,
  MARKET_REGIME_SCENARIOS,
  AI_CONFIDENCE_SCENARIOS,
  assertTrailingStopWithinBounds,
  advanceTimeBy,
  setSystemTime
};