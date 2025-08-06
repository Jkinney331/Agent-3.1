import { PortfolioData, Position, AIAnalysis, RiskMetrics } from '../../types/trading';

/**
 * Trading service integration for Telegram bot
 * Connects to backend trading systems and provides mobile-optimized data
 */

interface TradingStatusData {
  isActive: boolean;
  dayPnL: number;
  dayPnLPercentage: number;
  strategies: StrategyStatus[];
}

interface StrategyStatus {
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  performance: number;
  positions: number;
}

/**
 * Get current trading status for user
 */
export async function getTradingStatus(userId?: string): Promise<TradingStatusData> {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    // Call backend API - replace with actual implementation
    const response = await fetch(`/api/trading/status?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers as needed
      }
    });

    if (!response.ok) {
      throw new Error(`Trading status API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      isActive: data.tradingEnabled || false,
      dayPnL: data.dailyPnL || 0,
      dayPnLPercentage: data.dailyPnLPercentage || 0,
      strategies: data.activeStrategies?.map((strategy: any) => ({
        name: strategy.name,
        status: strategy.enabled ? 'ACTIVE' : 'PAUSED',
        performance: strategy.performance || 0,
        positions: strategy.activePositions || 0
      })) || []
    };

  } catch (error) {
    console.error('Error fetching trading status:', error);
    
    // Return mock data for development/demo
    return {
      isActive: true,
      dayPnL: 127.50,
      dayPnLPercentage: 1.28,
      strategies: [
        { name: 'AI Momentum', status: 'ACTIVE', performance: 8.5, positions: 2 },
        { name: 'Mean Reversion', status: 'ACTIVE', performance: -2.1, positions: 1 },
        { name: 'Breakout Scanner', status: 'PAUSED', performance: 15.3, positions: 0 }
      ]
    };
  }
}

/**
 * Get user's active positions
 */
export async function getPositions(userId?: string): Promise<Position[]> {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    const response = await fetch(`/api/trading/positions?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Positions API error: ${response.status}`);
    }

    const data = await response.json();
    return data.positions || [];

  } catch (error) {
    console.error('Error fetching positions:', error);
    
    // Return mock data for development/demo
    return [
      {
        id: '1',
        symbol: 'BTCUSDT',
        side: 'LONG',
        size: 0.1,
        entryPrice: 65000,
        currentPrice: 66300,
        markPrice: 66300,
        unrealizedPnL: 130,
        unrealizedPnLPercentage: 2.0,
        leverage: 2,
        margin: 3250,
        liquidationPrice: 32500,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        strategy: 'AI Momentum',
        stopLoss: 63000,
        takeProfit: 70000
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        side: 'LONG',
        size: 2.5,
        entryPrice: 3200,
        currentPrice: 3180,
        markPrice: 3180,
        unrealizedPnL: -50,
        unrealizedPnLPercentage: -0.625,
        leverage: 1,
        margin: 8000,
        liquidationPrice: 0,
        createdAt: new Date('2024-01-15T14:20:00Z'),
        strategy: 'Mean Reversion',
        stopLoss: 3100,
        takeProfit: 3400
      },
      {
        id: '3',
        symbol: 'ADAUSDT',
        side: 'SHORT',
        size: 1000,
        entryPrice: 0.52,
        currentPrice: 0.515,
        markPrice: 0.515,
        unrealizedPnL: 5,
        unrealizedPnLPercentage: 0.96,
        leverage: 3,
        margin: 173.33,
        liquidationPrice: 0.676,
        createdAt: new Date('2024-01-15T16:45:00Z'),
        strategy: 'AI Momentum'
      }
    ];
  }
}

/**
 * Get current AI analysis and market insights
 */
export async function getAIAnalysis(): Promise<AIAnalysis> {
  try {
    const response = await fetch('/api/ai-analysis', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`AI analysis API error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    
    // Return mock data for development/demo
    return {
      marketRegime: 'BULL',
      confidence: 0.78,
      sentiment: 0.45,
      fearGreedIndex: 67,
      nextAction: 'BUY',
      recommendedSymbol: 'BTCUSDT',
      entryPrice: 66500,
      targetPrice: 72000,
      stopLoss: 63000,
      reasoning: [
        'Strong bullish momentum detected across major cryptocurrencies',
        'Breaking above key resistance levels with high volume confirmation',
        'Fear & Greed index showing optimistic but not overheated conditions',
        'Bitcoin showing strength against altcoins indicating healthy market structure'
      ],
      lastUpdated: new Date()
    };
  }
}

/**
 * Get portfolio balance and performance data
 */
export async function getPortfolioData(userId?: string): Promise<PortfolioData> {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    const response = await fetch(`/api/trading/portfolio?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Portfolio API error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    
    // Return mock data for development/demo
    return {
      totalBalance: 10000,
      availableBalance: 6573.33,
      totalEquity: 10127.50,
      dailyPnL: 127.50,
      dailyPnLPercentage: 1.28,
      totalReturn: 127.50,
      totalReturnPercentage: 1.28,
      activePositions: 3,
      totalPositionsValue: 3426.67,
      marginUsed: 3426.67,
      marginAvailable: 6573.33,
      lastUpdated: new Date()
    };
  }
}

/**
 * Get risk metrics and alerts
 */
export async function getRiskMetrics(userId?: string): Promise<RiskMetrics> {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    const response = await fetch(`/api/trading/risk?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Risk metrics API error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching risk metrics:', error);
    
    // Return mock data for development/demo
    return {
      portfolioDrawdown: 2.5,
      maxDrawdownLimit: 15.0,
      dailyPnL: 127.50,
      dailyPnLLimit: 500.0,
      positionSizing: 34.27,
      maxPositionSize: 50.0,
      leverage: 1.8,
      maxLeverage: 5.0,
      var95: -245.50,
      sharpeRatio: 1.45,
      sortinoRatio: 2.12,
      calmarRatio: 0.87,
      lastUpdated: new Date()
    };
  }
}

/**
 * Toggle trading status (pause/resume)
 */
export async function toggleTrading(userId: string, enable: boolean): Promise<boolean> {
  try {
    const response = await fetch('/api/trading/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, enabled: enable })
    });

    if (!response.ok) {
      throw new Error(`Toggle trading API error: ${response.status}`);
    }

    const data = await response.json();
    return data.success;

  } catch (error) {
    console.error('Error toggling trading:', error);
    return false;
  }
}

/**
 * Get user's trading configuration
 */
export async function getTradingConfig(userId: string): Promise<any> {
  try {
    const response = await fetch(`/api/trading/config?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Trading config API error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching trading config:', error);
    
    // Return mock data for development/demo
    return {
      maxDrawdown: 15.0,
      maxPositionSize: 50.0,
      maxDailyLoss: 500.0,
      defaultLeverage: 2.0,
      emergencyStopLoss: 20.0,
      maxConcurrentTrades: 5,
      tradingHours: {
        enabled: false,
        start: '09:00',
        end: '17:00',
        timezone: 'UTC'
      },
      allowedSymbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'],
      blacklistedSymbols: []
    };
  }
}

/**
 * Update user's trading configuration
 */
export async function updateTradingConfig(userId: string, config: any): Promise<boolean> {
  try {
    const response = await fetch('/api/trading/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...config })
    });

    if (!response.ok) {
      throw new Error(`Update config API error: ${response.status}`);
    }

    const data = await response.json();
    return data.success;

  } catch (error) {
    console.error('Error updating trading config:', error);
    return false;
  }
}