import { BaseExchangeClient, BaseOrderRequest, BaseOrderResult, BasePosition, BaseAccount, ValidationResult } from './exchanges/base-exchange';
import { alpacaClient } from './exchanges/alpaca-client';
import { binanceClient } from './binance-client';

export interface ExchangeConfig {
  name: string;
  enabled: boolean;
  paperTrading: boolean;
  maxPositions: number;
  maxCapitalPerTrade: number;
  priority: number; // Higher number = higher priority
}

export interface UnifiedOrderRequest extends BaseOrderRequest {
  preferredExchange?: string;
  allowFallback?: boolean;
  capital?: number;
}

export interface ExecutionResult {
  success: boolean;
  exchange: string;
  orderResult?: BaseOrderResult;
  error?: string;
  fallbackUsed?: boolean;
  originalExchange?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: BasePosition[];
  accounts: Record<string, BaseAccount>;
  exposureBySymbol: Record<string, number>;
  exposureByExchange: Record<string, number>;
}

export class UnifiedExchangeManager {
  private exchanges: Map<string, BaseExchangeClient> = new Map();
  private configs: Map<string, ExchangeConfig> = new Map();
  private connectionStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, Date> = new Map();

  constructor() {
    this.initializeExchanges();
    console.log('🔄 Unified Exchange Manager initialized');
  }

  private initializeExchanges() {
    // Add Alpaca Paper Trading
    this.exchanges.set('alpaca', alpacaClient as any);
    this.configs.set('alpaca', {
      name: 'Alpaca Paper Trading',
      enabled: true,
      paperTrading: true,
      maxPositions: 5,
      maxCapitalPerTrade: 10000,
      priority: 1
    });

    // Add Binance (can be testnet or live)
    this.exchanges.set('binance', binanceClient as any);
    this.configs.set('binance', {
      name: 'Binance Futures',
      enabled: true,
      paperTrading: true, // Start with testnet
      maxPositions: 3,
      maxCapitalPerTrade: 5000,
      priority: 2
    });

    console.log(`📡 Initialized ${this.exchanges.size} exchanges`);
  }

  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, exchange] of Array.from(this.exchanges.entries())) {
      try {
        const connected = await exchange.testConnection();
        results[name] = connected;
        this.connectionStatus.set(name, connected);
        this.lastHealthCheck.set(name, new Date());
        
        console.log(`${connected ? '✅' : '❌'} ${name}: ${connected ? 'Connected' : 'Failed'}`);
      } catch (error) {
        results[name] = false;
        this.connectionStatus.set(name, false);
        console.error(`❌ ${name} connection failed:`, error);
      }
    }

    return results;
  }

  async executeOrder(orderReq: UnifiedOrderRequest): Promise<ExecutionResult> {
    console.log(`🎯 Executing unified order: ${orderReq.side.toUpperCase()} ${orderReq.symbol}`);

    // Determine target exchange
    const targetExchange = await this.selectOptimalExchange(orderReq);
    if (!targetExchange) {
      return {
        success: false,
        exchange: 'none',
        error: 'No suitable exchange available'
      };
    }

    const exchange = this.exchanges.get(targetExchange);
    if (!exchange) {
      return {
        success: false,
        exchange: targetExchange,
        error: `Exchange ${targetExchange} not found`
      };
    }

    try {
      // Pre-execution validation
      const validation = await this.validateUnifiedOrder(orderReq, targetExchange);
      if (!validation.valid) {
        return {
          success: false,
          exchange: targetExchange,
          error: validation.reason
        };
      }

      // Execute with retry logic
      const orderResult = await this.retryWithBackoff(
        () => exchange.placeOrder(orderReq),
        3,
        1000
      );

      console.log(`✅ Order executed on ${targetExchange}: ${orderResult.orderId}`);

      return {
        success: true,
        exchange: targetExchange,
        orderResult
      };

    } catch (error) {
      console.error(`❌ Order failed on ${targetExchange}:`, error);

      // Try fallback if enabled
      if (orderReq.allowFallback) {
        const fallbackResult = await this.tryFallbackExchange(orderReq, targetExchange);
        if (fallbackResult.success) {
          return {
            ...fallbackResult,
            fallbackUsed: true,
            originalExchange: targetExchange
          };
        }
      }

      return {
        success: false,
        exchange: targetExchange,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async selectOptimalExchange(orderReq: UnifiedOrderRequest): Promise<string | null> {
    // If preferred exchange is specified and available, use it
    if (orderReq.preferredExchange) {
      const config = this.configs.get(orderReq.preferredExchange);
      const connected = this.connectionStatus.get(orderReq.preferredExchange);
      
      if (config?.enabled && connected) {
        return orderReq.preferredExchange;
      }
    }

    // Select based on priority and availability
    const availableExchanges = Array.from(this.configs.entries())
      .filter(([name, config]) => {
        const connected = this.connectionStatus.get(name);
        return config.enabled && connected;
      })
      .sort((a, b) => b[1].priority - a[1].priority); // Sort by priority desc

    if (availableExchanges.length === 0) {
      return null;
    }

    // Additional selection criteria could be added here:
    // - Lowest fees for the symbol
    // - Best liquidity
    // - Fastest execution
    // - Current load balancing

    return availableExchanges[0][0];
  }

  private async tryFallbackExchange(orderReq: UnifiedOrderRequest, excludeExchange: string): Promise<ExecutionResult> {
    const fallbackExchange = await this.selectOptimalExchange({
      ...orderReq,
      preferredExchange: undefined // Clear preference for fallback
    });

    if (!fallbackExchange || fallbackExchange === excludeExchange) {
      return {
        success: false,
        exchange: 'none',
        error: 'No fallback exchange available'
      };
    }

    const exchange = this.exchanges.get(fallbackExchange);
    if (!exchange) {
      return {
        success: false,
        exchange: fallbackExchange,
        error: 'Fallback exchange not found'
      };
    }

    try {
      console.log(`🔄 Attempting fallback to ${fallbackExchange}`);
      
      const orderResult = await exchange.placeOrder(orderReq);
      
      console.log(`✅ Fallback successful on ${fallbackExchange}: ${orderResult.orderId}`);
      
      return {
        success: true,
        exchange: fallbackExchange,
        orderResult
      };
    } catch (error) {
      return {
        success: false,
        exchange: fallbackExchange,
        error: error instanceof Error ? error.message : 'Fallback failed'
      };
    }
  }

  private async validateUnifiedOrder(orderReq: UnifiedOrderRequest, exchange: string): Promise<ValidationResult> {
    const config = this.configs.get(exchange);
    if (!config) {
      return { valid: false, reason: `Exchange ${exchange} not configured` };
    }

    // Check if exchange is enabled
    if (!config.enabled) {
      return { valid: false, reason: `Exchange ${exchange} is disabled` };
    }

    // Check capital limits
    if (orderReq.capital && orderReq.capital > config.maxCapitalPerTrade) {
      return { 
        valid: false, 
        reason: `Order capital ${orderReq.capital} exceeds limit ${config.maxCapitalPerTrade} for ${exchange}` 
      };
    }

    // Check position limits
    const positions = await this.getPositions(exchange);
    if (positions.length >= config.maxPositions) {
      return { 
        valid: false, 
        reason: `Maximum positions (${config.maxPositions}) reached on ${exchange}` 
      };
    }

    // Delegate to exchange-specific validation
    const exchangeClient = this.exchanges.get(exchange);
    if (exchangeClient) {
      return await exchangeClient.validateOrder(orderReq);
    }

    return { valid: true };
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const allPositions: BasePosition[] = [];
    const accounts: Record<string, BaseAccount> = {};
    const exposureBySymbol: Record<string, number> = {};
    const exposureByExchange: Record<string, number> = {};

    for (const [name, exchange] of Array.from(this.exchanges.entries())) {
      try {
        if (!this.connectionStatus.get(name)) continue;

        // Get positions
        const positions = await exchange.getPositions();
        allPositions.push(...positions);

        // Get account info
        const account = await exchange.getAccount();
        accounts[name] = account;

        // Calculate exposures
        let exchangeExposure = 0;
        for (const position of positions) {
          const exposure = position.marketValue;
          exposureBySymbol[position.symbol] = (exposureBySymbol[position.symbol] || 0) + exposure;
          exchangeExposure += exposure;
        }
        exposureByExchange[name] = exchangeExposure;

      } catch (error) {
        console.error(`❌ Failed to get portfolio data from ${name}:`, error);
      }
    }

    const totalValue = Object.values(accounts).reduce((sum, acc) => sum + acc.portfolioValue, 0);
    const totalPnL = allPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    const totalPnLPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

    return {
      totalValue,
      totalPnL,
      totalPnLPercent,
      positions: allPositions,
      accounts,
      exposureBySymbol,
      exposureByExchange
    };
  }

  async getPositions(exchange?: string): Promise<BasePosition[]> {
    if (exchange) {
      const client = this.exchanges.get(exchange);
      return client ? await client.getPositions() : [];
    }

    const allPositions: BasePosition[] = [];
    for (const [name, client] of Array.from(this.exchanges.entries())) {
      try {
        if (this.connectionStatus.get(name)) {
          const positions = await client.getPositions();
          allPositions.push(...positions);
        }
      } catch (error) {
        console.error(`❌ Failed to get positions from ${name}:`, error);
      }
    }

    return allPositions;
  }

  async closePosition(symbol: string, exchange?: string): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    if (exchange) {
      // Close position on specific exchange
      const client = this.exchanges.get(exchange);
      if (!client) {
        return [{
          success: false,
          exchange,
          error: `Exchange ${exchange} not found`
        }];
      }

      try {
        const orderResult = await client.closePosition(symbol);
        results.push({
          success: true,
          exchange,
          orderResult
        });
      } catch (error) {
        results.push({
          success: false,
          exchange,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      // Close position on all exchanges
      for (const [name, client] of Array.from(this.exchanges.entries())) {
        try {
          if (!this.connectionStatus.get(name)) continue;

          const position = await client.getPosition(symbol);
          if (position) {
            const orderResult = await client.closePosition(symbol);
            results.push({
              success: true,
              exchange: name,
              orderResult
            });
          }
        } catch (error) {
          results.push({
            success: false,
            exchange: name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  async closeAllPositions(): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const [name, client] of Array.from(this.exchanges.entries())) {
      try {
        if (!this.connectionStatus.get(name)) continue;

        console.log(`🚨 Closing all positions on ${name}`);
        const orderResults = await client.closeAllPositions();
        
        for (const orderResult of orderResults) {
          results.push({
            success: true,
            exchange: name,
            orderResult
          });
        }
      } catch (error) {
        console.error(`❌ Failed to close all positions on ${name}:`, error);
        results.push({
          success: false,
          exchange: name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Configuration management
  updateExchangeConfig(exchange: string, config: Partial<ExchangeConfig>): void {
    const currentConfig = this.configs.get(exchange);
    if (currentConfig) {
      this.configs.set(exchange, { ...currentConfig, ...config });
      console.log(`⚙️ Updated config for ${exchange}:`, config);
    }
  }

  getExchangeConfig(exchange: string): ExchangeConfig | undefined {
    return this.configs.get(exchange);
  }

  getAllConfigs(): Record<string, ExchangeConfig> {
    const configs: Record<string, ExchangeConfig> = {};
    for (const [name, config] of Array.from(this.configs.entries())) {
      configs[name] = config;
    }
    return configs;
  }

  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, connected] of Array.from(this.connectionStatus.entries())) {
      status[name] = connected;
    }
    return status;
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) break;
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export const unifiedExchangeManager = new UnifiedExchangeManager(); 