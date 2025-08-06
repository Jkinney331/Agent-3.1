/**
 * Market data fixtures for testing Dynamic Trailing Stops
 */

import { CandlestickData, MarketRegime } from '../../types/trading';

/**
 * Bitcoin historical price data scenarios
 */
export const BTC_BULL_RUN_DATA: CandlestickData[] = [
  { openTime: 1704067200000, open: 42000, high: 43500, low: 41800, close: 43200, volume: 1250, closeTime: 1704070799999, quoteAssetVolume: 53550000, numberOfTrades: 125, takerBuyBaseAssetVolume: 750, takerBuyQuoteAssetVolume: 32130000 },
  { openTime: 1704070800000, open: 43200, high: 44800, low: 43000, close: 44500, volume: 1380, closeTime: 1704074399999, quoteAssetVolume: 61410000, numberOfTrades: 138, takerBuyBaseAssetVolume: 828, takerBuyQuoteAssetVolume: 36846000 },
  { openTime: 1704074400000, open: 44500, high: 46200, low: 44300, close: 45800, volume: 1520, closeTime: 1704077999999, quoteAssetVolume: 69616000, numberOfTrades: 152, takerBuyBaseAssetVolume: 912, takerBuyQuoteAssetVolume: 41769600 },
  { openTime: 1704078000000, open: 45800, high: 47500, low: 45600, close: 47200, volume: 1680, closeTime: 1704081599999, quoteAssetVolume: 78624000, numberOfTrades: 168, takerBuyBaseAssetVolume: 1008, takerBuyQuoteAssetVolume: 47174400 },
  { openTime: 1704081600000, open: 47200, high: 48900, low: 47000, close: 48600, volume: 1820, closeTime: 1704085199999, quoteAssetVolume: 87412000, numberOfTrades: 182, takerBuyBaseAssetVolume: 1092, takerBuyQuoteAssetVolume: 52447200 },
];

export const BTC_BEAR_MARKET_DATA: CandlestickData[] = [
  { openTime: 1704067200000, open: 48000, high: 48200, low: 46500, close: 46800, volume: 1450, closeTime: 1704070799999, quoteAssetVolume: 68220000, numberOfTrades: 145, takerBuyBaseAssetVolume: 580, takerBuyQuoteAssetVolume: 27288000 },
  { openTime: 1704070800000, open: 46800, high: 47000, low: 45200, close: 45500, volume: 1680, closeTime: 1704074399999, quoteAssetVolume: 77280000, numberOfTrades: 168, takerBuyBaseAssetVolume: 588, takerBuyQuoteAssetVolume: 27081600 },
  { openTime: 1704074400000, open: 45500, high: 45800, low: 43800, close: 44200, volume: 1920, closeTime: 1704077999999, quoteAssetVolume: 85632000, numberOfTrades: 192, takerBuyBaseAssetVolume: 576, takerBuyQuoteAssetVolume: 25459200 },
  { openTime: 1704078000000, open: 44200, high: 44500, low: 42600, close: 43000, volume: 2150, closeTime: 1704081599999, quoteAssetVolume: 93425000, numberOfTrades: 215, takerBuyBaseAssetVolume: 645, takerBuyQuoteAssetVolume: 27727500 },
  { openTime: 1704081600000, open: 43000, high: 43300, low: 41200, close: 41800, volume: 2380, closeTime: 1704085199999, quoteAssetVolume: 101204000, numberOfTrades: 238, takerBuyBaseAssetVolume: 714, takerBuyQuoteAssetVolume: 30361200 },
];

export const BTC_FLASH_CRASH_DATA: CandlestickData[] = [
  { openTime: 1704067200000, open: 50000, high: 50200, low: 49800, close: 50000, volume: 800, closeTime: 1704067259999, quoteAssetVolume: 40000000, numberOfTrades: 80, takerBuyBaseAssetVolume: 400, takerBuyQuoteAssetVolume: 20000000 },
  { openTime: 1704067260000, open: 50000, high: 50100, low: 47500, close: 48000, volume: 2500, closeTime: 1704067319999, quoteAssetVolume: 122500000, numberOfTrades: 250, takerBuyBaseAssetVolume: 750, takerBuyQuoteAssetVolume: 36750000 },
  { openTime: 1704067320000, open: 48000, high: 48200, low: 44000, close: 45000, volume: 3800, closeTime: 1704067379999, quoteAssetVolume: 175400000, numberOfTrades: 380, takerBuyBaseAssetVolume: 950, takerBuyQuoteAssetVolume: 43850000 },
  { openTime: 1704067380000, open: 45000, high: 45500, low: 38000, close: 40000, volume: 5200, closeTime: 1704067439999, quoteAssetVolume: 218400000, numberOfTrades: 520, takerBuyBaseAssetVolume: 1040, takerBuyQuoteAssetVolume: 43680000 },
  { openTime: 1704067440000, open: 40000, high: 42000, low: 35000, close: 38500, volume: 6500, closeTime: 1704067499999, quoteAssetVolume: 250250000, numberOfTrades: 650, takerBuyBaseAssetVolume: 1300, takerBuyQuoteAssetVolume: 50050000 },
];

export const BTC_SIDEWAYS_DATA: CandlestickData[] = [
  { openTime: 1704067200000, open: 50000, high: 50800, low: 49200, close: 50300, volume: 1200, closeTime: 1704070799999, quoteAssetVolume: 60240000, numberOfTrades: 120, takerBuyBaseAssetVolume: 600, takerBuyQuoteAssetVolume: 30120000 },
  { openTime: 1704070800000, open: 50300, high: 51000, low: 49800, close: 49900, volume: 1150, closeTime: 1704074399999, quoteAssetVolume: 57385000, numberOfTrades: 115, takerBuyBaseAssetVolume: 575, takerBuyQuoteAssetVolume: 28692500 },
  { openTime: 1704074400000, open: 49900, high: 50600, low: 49400, close: 50200, volume: 1300, closeTime: 1704077999999, quoteAssetVolume: 65260000, numberOfTrades: 130, takerBuyBaseAssetVolume: 650, takerBuyQuoteAssetVolume: 32630000 },
  { openTime: 1704078000000, open: 50200, high: 50900, low: 49600, close: 49800, volume: 1180, closeTime: 1704081599999, quoteAssetVolume: 58764000, numberOfTrades: 118, takerBuyBaseAssetVolume: 590, takerBuyQuoteAssetVolume: 29382000 },
  { openTime: 1704081600000, open: 49800, high: 50500, low: 49300, close: 50100, volume: 1250, closeTime: 1704085199999, quoteAssetVolume: 62625000, numberOfTrades: 125, takerBuyBaseAssetVolume: 625, takerBuyQuoteAssetVolume: 31312500 },
];

/**
 * ETH scenarios for testing alt-coin behavior
 */
export const ETH_HIGH_VOLATILITY_DATA: CandlestickData[] = [
  { openTime: 1704067200000, open: 2500, high: 2650, low: 2350, close: 2600, volume: 15000, closeTime: 1704070799999, quoteAssetVolume: 37500000, numberOfTrades: 1500, takerBuyBaseAssetVolume: 9000, takerBuyQuoteAssetVolume: 22500000 },
  { openTime: 1704070800000, open: 2600, high: 2800, low: 2450, close: 2480, volume: 18000, closeTime: 1704074399999, quoteAssetVolume: 46440000, numberOfTrades: 1800, takerBuyBaseAssetVolume: 7200, takerBuyQuoteAssetVolume: 18576000 },
  { openTime: 1704074400000, open: 2480, high: 2520, low: 2200, close: 2300, volume: 22000, closeTime: 1704077999999, quoteAssetVolume: 53240000, numberOfTrades: 2200, takerBuyBaseAssetVolume: 8800, takerBuyQuoteAssetVolume: 21296000 },
  { openTime: 1704078000000, open: 2300, high: 2450, low: 2100, close: 2400, volume: 25000, closeTime: 1704081599999, quoteAssetVolume: 57500000, numberOfTrades: 2500, takerBuyBaseAssetVolume: 12500, takerBuyQuoteAssetVolume: 28750000 },
  { openTime: 1704081600000, open: 2400, high: 2650, low: 2350, close: 2620, volume: 20000, closeTime: 1704085199999, quoteAssetVolume: 50200000, numberOfTrades: 2000, takerBuyBaseAssetVolume: 12000, takerBuyQuoteAssetVolume: 30120000 },
];

/**
 * Market condition scenarios mapped to regimes
 */
export const MARKET_SCENARIOS = {
  BULL_MARKET: {
    regime: 'BULL' as MarketRegime,
    data: BTC_BULL_RUN_DATA,
    description: 'Strong upward trend with increasing volume',
    expectedTrailingAdjustment: 1.2,
    volatilityLevel: 'NORMAL' as const
  },
  BEAR_MARKET: {
    regime: 'BEAR' as MarketRegime,
    data: BTC_BEAR_MARKET_DATA,
    description: 'Consistent downward pressure with high selling volume',
    expectedTrailingAdjustment: 0.8,
    volatilityLevel: 'HIGH' as const
  },
  FLASH_CRASH: {
    regime: 'VOLATILE' as MarketRegime,
    data: BTC_FLASH_CRASH_DATA,
    description: 'Rapid price collapse with extreme volume',
    expectedTrailingAdjustment: 0.7,
    volatilityLevel: 'EXTREME' as const
  },
  SIDEWAYS: {
    regime: 'RANGE' as MarketRegime,
    data: BTC_SIDEWAYS_DATA,
    description: 'Price consolidation within tight range',
    expectedTrailingAdjustment: 1.0,
    volatilityLevel: 'LOW' as const
  },
  HIGH_VOLATILITY: {
    regime: 'VOLATILE' as MarketRegime,
    data: ETH_HIGH_VOLATILITY_DATA,
    description: 'High volatility with frequent direction changes',
    expectedTrailingAdjustment: 0.7,
    volatilityLevel: 'EXTREME' as const
  }
};

/**
 * Real-time price update sequences for testing
 */
export const PRICE_UPDATE_SEQUENCES = {
  GRADUAL_RISE: [50000, 50100, 50250, 50400, 50600, 50800, 51000, 51300, 51500, 51800],
  SHARP_DROP: [50000, 49500, 48800, 47900, 46800, 45500, 44000, 42500, 41000, 39500],
  VOLATILE_SWING: [50000, 51000, 49500, 52000, 48000, 53000, 47000, 54000, 46000, 55000],
  CONSOLIDATION: [50000, 50050, 49980, 50020, 49990, 50030, 49970, 50040, 49960, 50010],
  WHIPSAW: [50000, 52000, 48000, 53000, 47000, 54000, 46000, 55000, 45000, 56000]
};

/**
 * ATR historical data for different volatility regimes
 */
export const ATR_SCENARIOS = {
  LOW_VOLATILITY: {
    period: 14,
    values: [800, 820, 790, 810, 795, 805, 815, 825, 800, 790, 785, 805, 810, 800],
    average: 803.5,
    normalized: 0.016
  },
  NORMAL_VOLATILITY: {
    period: 14,
    values: [1200, 1250, 1180, 1220, 1190, 1210, 1240, 1260, 1200, 1180, 1170, 1210, 1230, 1200],
    average: 1210.7,
    normalized: 0.024
  },
  HIGH_VOLATILITY: {
    period: 14,
    values: [2000, 2100, 1950, 2050, 1980, 2030, 2080, 2120, 2000, 1960, 1940, 2020, 2060, 2000],
    average: 2021.4,
    normalized: 0.040
  },
  EXTREME_VOLATILITY: {
    period: 14,
    values: [3500, 3800, 3200, 3600, 3400, 3700, 3900, 4000, 3500, 3300, 3100, 3600, 3800, 3500],
    average: 3642.8,
    normalized: 0.073
  }
};

export default {
  MARKET_SCENARIOS,
  PRICE_UPDATE_SEQUENCES,
  ATR_SCENARIOS,
  BTC_BULL_RUN_DATA,
  BTC_BEAR_MARKET_DATA,
  BTC_FLASH_CRASH_DATA,
  BTC_SIDEWAYS_DATA,
  ETH_HIGH_VOLATILITY_DATA
};