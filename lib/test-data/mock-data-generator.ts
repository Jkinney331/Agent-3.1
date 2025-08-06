/**
 * Mock Data Generator for Testing the Complete AI Trading Bot Pipeline
 * Generates realistic test data for all system components
 */

import { Position, CandlestickData, TradingSignal } from '../../types/trading';

export interface MockDataConfig {
  marketCondition: 'BULL' | 'BEAR' | 'RANGE' | 'VOLATILE';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  symbolCount: number;
  candleCount: number;
  positionCount: number;
  basePrice: number;
  volatility: number; // 0.01 = 1%
}

export interface MockMarketScenario {
  name: string;
  description: string;
  config: MockDataConfig;
  expectedSignals: number;
  expectedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class MockDataGenerator {
  private symbols = [
    'BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD',
    'LINK/USD', 'AVAX/USD', 'MATIC/USD', 'ATOM/USD', 'NEAR/USD'
  ];

  private scenarios: MockMarketScenario[] = [
    {
      name: 'Bull Market Rally',
      description: 'Strong upward trend with increasing volume',
      config: {
        marketCondition: 'BULL',
        timeframe: '1h',
        symbolCount: 5,
        candleCount: 100,
        positionCount: 3,
        basePrice: 50000,
        volatility: 0.015
      },
      expectedSignals: 4,
      expectedRisk: 'LOW'
    },
    {
      name: 'Bear Market Decline',
      description: 'Sustained downward pressure with high volume',
      config: {
        marketCondition: 'BEAR',
        timeframe: '1h',
        symbolCount: 5,
        candleCount: 100,
        positionCount: 2,
        basePrice: 45000,
        volatility: 0.025
      },
      expectedSignals: 3,
      expectedRisk: 'HIGH'
    },
    {
      name: 'Range-bound Market',
      description: 'Sideways price action with low volatility',
      config: {
        marketCondition: 'RANGE',
        timeframe: '1h',
        symbolCount: 5,
        candleCount: 100,
        positionCount: 1,
        basePrice: 48000,
        volatility: 0.008
      },
      expectedSignals: 1,
      expectedRisk: 'MEDIUM'
    },
    {
      name: 'High Volatility Chaos',
      description: 'Extreme price swings in both directions',
      config: {
        marketCondition: 'VOLATILE',
        timeframe: '15m',
        symbolCount: 3,
        candleCount: 200,
        positionCount: 4,
        basePrice: 52000,
        volatility: 0.04
      },
      expectedSignals: 6,
      expectedRisk: 'HIGH'
    }
  ];

  /**
   * Generate complete mock data set for testing
   */
  generateMockDataSet(scenarioName?: string): {
    scenario: MockMarketScenario;
    marketData: Map<string, CandlestickData[]>;
    positions: Position[];
    signals: TradingSignal[];
    metadata: any;
  } {
    const scenario = scenarioName 
      ? this.scenarios.find(s => s.name === scenarioName) || this.scenarios[0]
      : this.getRandomScenario();

    console.log(`📊 Generating mock data for scenario: ${scenario.name}`);

    // Generate market data for multiple symbols
    const marketData = new Map<string, CandlestickData[]>();
    const selectedSymbols = this.symbols.slice(0, scenario.config.symbolCount);

    selectedSymbols.forEach((symbol, index) => {
      const basePrice = scenario.config.basePrice + (index * 1000); // Vary base prices
      const candleData = this.generateCandlestickData(
        scenario.config.candleCount,
        basePrice,
        scenario.config
      );
      marketData.set(symbol, candleData);
    });

    // Generate positions
    const positions = this.generatePositions(
      selectedSymbols,
      scenario.config.positionCount,
      marketData
    );

    // Generate trading signals
    const signals = this.generateTradingSignals(
      selectedSymbols,
      scenario.expectedSignals,
      marketData,
      scenario.config
    );

    const metadata = {
      scenario: scenario.name,
      generatedAt: new Date(),
      symbolCount: selectedSymbols.length,
      candleCount: scenario.config.candleCount,
      positionCount: positions.length,
      signalCount: signals.length,
      totalCandles: Array.from(marketData.values()).reduce((sum, data) => sum + data.length, 0)
    };

    console.log(`✅ Mock data generated:`, metadata);

    return {
      scenario,
      marketData,
      positions,
      signals,
      metadata
    };
  }

  /**
   * Generate realistic candlestick data based on market conditions
   */
  generateCandlestickData(
    count: number, 
    basePrice: number, 
    config: MockDataConfig
  ): CandlestickData[] {
    const data: CandlestickData[] = [];
    let currentPrice = basePrice;
    let trend = 0;

    // Set trend based on market condition
    switch (config.marketCondition) {
      case 'BULL':
        trend = 0.0005; // 0.05% upward bias per candle
        break;
      case 'BEAR':
        trend = -0.0005; // 0.05% downward bias per candle
        break;
      case 'RANGE':
        trend = 0; // No bias
        break;
      case 'VOLATILE':
        trend = 0; // No bias but high volatility
        break;
    }

    const timeframeMinutes = this.getTimeframeMinutes(config.timeframe);
    const baseVolume = 1000000;

    for (let i = 0; i < count; i++) {
      const open = currentPrice;
      
      // Calculate price movement
      let priceMovement = (Math.random() - 0.5) * 2 * config.volatility * currentPrice;
      
      // Add trend bias
      priceMovement += trend * currentPrice;
      
      // Add some momentum (trending behavior)
      if (i > 10) {
        const recentTrend = (data[i - 1].close - data[i - 10].close) / data[i - 10].close;
        priceMovement += recentTrend * 0.1 * currentPrice; // 10% momentum factor
      }

      const close = open + priceMovement;
      
      // Generate high and low with realistic wicks
      const wickRange = Math.abs(priceMovement) * (0.5 + Math.random());
      const high = Math.max(open, close) + Math.random() * wickRange;
      const low = Math.min(open, close) - Math.random() * wickRange;

      // Generate volume (higher volume on larger moves)
      const volumeMultiplier = 1 + Math.abs(priceMovement / currentPrice) * 5;
      const volume = baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4);

      data.push({
        timestamp: new Date(Date.now() - (count - i) * timeframeMinutes * 60000),
        open,
        high,
        low,
        close,
        volume
      });

      currentPrice = close;
    }

    return data;
  }

  /**
   * Generate realistic trading positions
   */
  generatePositions(
    symbols: string[], 
    count: number, 
    marketData: Map<string, CandlestickData[]>
  ): Position[] {
    const positions: Position[] = [];

    for (let i = 0; i < count; i++) {
      const symbol = symbols[i % symbols.length];
      const candleData = marketData.get(symbol);
      
      if (!candleData || candleData.length === 0) continue;

      // Pick a random entry point from historical data
      const entryIndex = Math.floor(Math.random() * (candleData.length - 20)) + 10;
      const entryCandle = candleData[entryIndex];
      const currentCandle = candleData[candleData.length - 1];

      const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const quantity = 0.1 + Math.random() * 0.9; // 0.1 to 1.0

      // Calculate P&L
      const priceDiff = currentCandle.close - entryCandle.close;
      const unrealizedPnL = priceDiff * quantity * (side === 'LONG' ? 1 : -1);
      const unrealizedPnLPercentage = (priceDiff / entryCandle.close) * 100 * (side === 'LONG' ? 1 : -1);

      // Generate stop loss and take profit
      const stopLossDistance = 0.02 + Math.random() * 0.03; // 2-5%
      const takeProfitDistance = 0.05 + Math.random() * 0.05; // 5-10%

      positions.push({
        id: `pos_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
        symbol,
        side,
        quantity,
        entryPrice: entryCandle.close,
        currentPrice: currentCandle.close,
        stopLoss: side === 'LONG' 
          ? entryCandle.close * (1 - stopLossDistance)
          : entryCandle.close * (1 + stopLossDistance),
        takeProfit: side === 'LONG'
          ? entryCandle.close * (1 + takeProfitDistance)
          : entryCandle.close * (1 - takeProfitDistance),
        unrealizedPnL,
        unrealizedPnLPercentage,
        status: 'OPEN',
        createdAt: entryCandle.timestamp,
        updatedAt: new Date()
      });
    }

    return positions;
  }

  /**
   * Generate trading signals based on market conditions
   */
  generateTradingSignals(
    symbols: string[],
    count: number,
    marketData: Map<string, CandlestickData[]>,
    config: MockDataConfig
  ): TradingSignal[] {
    const signals: TradingSignal[] = [];

    for (let i = 0; i < count; i++) {
      const symbol = symbols[i % symbols.length];
      const candleData = marketData.get(symbol);
      
      if (!candleData || candleData.length === 0) continue;

      const latestCandle = candleData[candleData.length - 1];
      const prices = candleData.map(c => c.close);

      // Determine action based on market condition and technical indicators
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 50;

      switch (config.marketCondition) {
        case 'BULL':
          action = Math.random() > 0.3 ? 'BUY' : 'HOLD';
          confidence = 60 + Math.random() * 30;
          break;
        case 'BEAR':
          action = Math.random() > 0.3 ? 'SELL' : 'HOLD';
          confidence = 55 + Math.random() * 25;
          break;
        case 'RANGE':
          action = Math.random() > 0.6 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'HOLD';
          confidence = 40 + Math.random() * 20;
          break;
        case 'VOLATILE':
          action = Math.random() > 0.4 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'HOLD';
          confidence = 30 + Math.random() * 40;
          break;
      }

      // Generate mock technical indicators
      const rsi = this.calculateMockRSI(prices);
      const macd = this.calculateMockMACD(prices);
      const volume = candleData.slice(-10).reduce((sum, c) => sum + c.volume, 0) / 10;

      // Generate reasoning based on indicators
      const reasoning = this.generateMockReasoning(action, rsi, macd, config.marketCondition);

      signals.push({
        symbol,
        action,
        confidence,
        reasoning,
        riskReward: 1.5 + Math.random() * 2, // 1.5 to 3.5
        positionSize: 0.02 + Math.random() * 0.08, // 2% to 10%
        stopLoss: action === 'BUY' 
          ? latestCandle.close * 0.97 
          : latestCandle.close * 1.03,
        takeProfit: action === 'BUY'
          ? latestCandle.close * 1.05
          : latestCandle.close * 0.95,
        timestamp: new Date(),
        marketRegime: config.marketCondition,
        indicators: {
          rsi,
          macd,
          volume: {
            profile: Math.random() * 100,
            surge: volume > 1500000
          },
          sentiment: {
            fearGreed: 20 + Math.random() * 60
          }
        }
      });
    }

    return signals;
  }

  /**
   * Generate specific test scenarios
   */
  generateTestScenarios(): {
    bullMarket: any;
    bearMarket: any;
    sidewaysMarket: any;
    volatileMarket: any;
    mixedConditions: any;
  } {
    return {
      bullMarket: this.generateMockDataSet('Bull Market Rally'),
      bearMarket: this.generateMockDataSet('Bear Market Decline'),
      sidewaysMarket: this.generateMockDataSet('Range-bound Market'),
      volatileMarket: this.generateMockDataSet('High Volatility Chaos'),
      mixedConditions: this.generateMixedConditionsScenario()
    };
  }

  /**
   * Generate realistic user interaction data for Telegram bot testing
   */
  generateTelegramTestData(): {
    users: Array<{
      id: number;
      username: string;
      isAuthorized: boolean;
      preferences: any;
    }>;
    messages: Array<{
      userId: number;
      command: string;
      timestamp: Date;
      expectedResponse: string;
    }>;
  } {
    const users = [
      {
        id: 123456789,
        username: 'trader_alice',
        isAuthorized: true,
        preferences: {
          notifications: true,
          reportFrequency: 'daily',
          riskTolerance: 'medium'
        }
      },
      {
        id: 987654321,
        username: 'crypto_bob',
        isAuthorized: true,
        preferences: {
          notifications: true,
          reportFrequency: 'hourly',
          riskTolerance: 'high'
        }
      },
      {
        id: 555666777,
        username: 'unauthorized_user',
        isAuthorized: false,
        preferences: {}
      }
    ];

    const messages = [
      {
        userId: 123456789,
        command: '/start',
        timestamp: new Date(),
        expectedResponse: 'Welcome to AI Trading Bot'
      },
      {
        userId: 123456789,
        command: '/status',
        timestamp: new Date(),
        expectedResponse: 'System Status'
      },
      {
        userId: 123456789,
        command: '/balance',
        timestamp: new Date(),
        expectedResponse: 'Portfolio Balance'
      },
      {
        userId: 987654321,
        command: '/help',
        timestamp: new Date(),
        expectedResponse: 'Available Commands'
      },
      {
        userId: 555666777,
        command: '/status',
        timestamp: new Date(),
        expectedResponse: 'Access denied'
      }
    ];

    return { users, messages };
  }

  // Private helper methods

  private getRandomScenario(): MockMarketScenario {
    return this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
  }

  private getTimeframeMinutes(timeframe: string): number {
    const timeframes: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };
    return timeframes[timeframe] || 60;
  }

  private calculateMockRSI(prices: number[]): number {
    if (prices.length < 14) return 50;
    
    // Simplified RSI calculation for mock data
    const recentPrices = prices.slice(-14);
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < recentPrices.length; i++) {
      const change = recentPrices[i] - recentPrices[i - 1];
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }
    
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
    const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMockMACD(prices: number[]): { signal: number; histogram: number } {
    if (prices.length < 26) {
      return { signal: 0, histogram: 0 };
    }
    
    // Simplified MACD for mock data
    const ema12 = prices.slice(-12).reduce((sum, price) => sum + price, 0) / 12;
    const ema26 = prices.slice(-26).reduce((sum, price) => sum + price, 0) / 26;
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9; // Simplified signal line
    
    return {
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  private generateMockReasoning(
    action: string, 
    rsi: number, 
    macd: any, 
    marketRegime: string
  ): string[] {
    const reasoning = [];
    
    reasoning.push(`Market regime identified as ${marketRegime}`);
    
    if (action === 'BUY') {
      reasoning.push('Bullish momentum detected');
      if (rsi < 50) reasoning.push('RSI indicates oversold conditions - potential reversal');
      if (macd.histogram > 0) reasoning.push('MACD histogram positive - confirming upward momentum');
    } else if (action === 'SELL') {
      reasoning.push('Bearish momentum detected');
      if (rsi > 50) reasoning.push('RSI indicates overbought conditions - potential reversal');
      if (macd.histogram < 0) reasoning.push('MACD histogram negative - confirming downward momentum');
    } else {
      reasoning.push('Mixed signals detected - holding position');
      reasoning.push('Waiting for clearer market direction');
    }
    
    return reasoning;
  }

  private generateMixedConditionsScenario(): any {
    // Generate data that transitions between different market conditions
    const transitions = ['BULL', 'RANGE', 'BEAR', 'VOLATILE'];
    const mixedData = {
      scenario: {
        name: 'Mixed Market Conditions',
        description: 'Transitions between different market regimes',
        expectedSignals: 8,
        expectedRisk: 'MEDIUM'
      },
      marketData: new Map(),
      positions: [],
      signals: [],
      metadata: {
        transitions: transitions.length,
        complexityLevel: 'HIGH'
      }
    };

    // This would generate more complex transitional data
    // Implementation details would depend on specific testing needs

    return mixedData;
  }

  // Public utility methods for test scenarios

  public getAvailableScenarios(): MockMarketScenario[] {
    return [...this.scenarios];
  }

  public createCustomScenario(config: Partial<MockDataConfig>): any {
    const defaultConfig: MockDataConfig = {
      marketCondition: 'RANGE',
      timeframe: '1h',
      symbolCount: 3,
      candleCount: 50,
      positionCount: 2,
      basePrice: 50000,
      volatility: 0.02
    };

    const customConfig = { ...defaultConfig, ...config };
    const customScenario: MockMarketScenario = {
      name: 'Custom Test Scenario',
      description: 'User-defined test scenario',
      config: customConfig,
      expectedSignals: Math.floor(customConfig.symbolCount * 1.5),
      expectedRisk: customConfig.volatility > 0.03 ? 'HIGH' : customConfig.volatility > 0.015 ? 'MEDIUM' : 'LOW'
    };

    return this.generateMockDataSet(customScenario.name);
  }
}

// Export singleton instance
export const mockDataGenerator = new MockDataGenerator();

// Export predefined test data sets
export const testDataSets = {
  // Quick test data for unit tests
  quick: {
    symbols: ['BTC/USD', 'ETH/USD'],
    candleCount: 20,
    positionCount: 1
  },
  
  // Comprehensive test data for integration tests
  comprehensive: {
    symbols: ['BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD'],
    candleCount: 100,
    positionCount: 5
  },
  
  // Stress test data
  stress: {
    symbols: ['BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD', 'LINK/USD'],
    candleCount: 500,
    positionCount: 20
  }
};