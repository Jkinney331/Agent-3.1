export interface BaseOrderRequest {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  price?: number;
  stopPrice?: number;
  timeInForce?: string;
}

export interface BaseOrderResult {
  orderId: string;
  status: string;
  filledQty: number;
  avgFillPrice: number;
  symbol: string;
  side: string;
  timestamp: Date;
  exchange: string;
}

export interface BasePosition {
  symbol: string;
  quantity: number;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice?: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  marketValue: number;
}

export interface BaseAccount {
  totalBalance: number;
  availableBalance: number;
  equity: number;
  margin?: number;
  portfolioValue: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export abstract class BaseExchangeClient {
  protected exchangeName: string;
  protected connected: boolean = false;

  constructor(exchangeName: string) {
    this.exchangeName = exchangeName;
  }

  // Abstract methods that all exchanges must implement
  abstract testConnection(): Promise<boolean>;
  abstract placeOrder(orderReq: BaseOrderRequest): Promise<BaseOrderResult>;
  abstract getAccount(): Promise<BaseAccount>;
  abstract getPositions(): Promise<BasePosition[]>;
  abstract getPosition(symbol: string): Promise<BasePosition | null>;
  abstract closePosition(symbol: string): Promise<BaseOrderResult>;
  abstract closeAllPositions(): Promise<BaseOrderResult[]>;
  abstract getLastPrice(symbol: string): Promise<number>;
  abstract formatSymbol(symbol: string): string;
  abstract calculatePositionSize(
    accountBalance: number, 
    riskPercentage: number, 
    entryPrice: number, 
    stopLossPrice: number
  ): number;

  // Common methods with default implementations
  async validateOrder(orderReq: BaseOrderRequest): Promise<ValidationResult> {
    // Basic validation
    if (!orderReq.symbol) {
      return { valid: false, reason: 'Symbol is required' };
    }

    if (orderReq.quantity <= 0) {
      return { valid: false, reason: 'Quantity must be positive' };
    }

    if (!['buy', 'sell'].includes(orderReq.side)) {
      return { valid: false, reason: 'Side must be buy or sell' };
    }

    if (orderReq.type === 'limit' && !orderReq.price) {
      return { valid: false, reason: 'Limit orders require a price' };
    }

    if (orderReq.type === 'stop' && !orderReq.stopPrice) {
      return { valid: false, reason: 'Stop orders require a stop price' };
    }

    return { valid: true };
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ ${this.exchangeName}: Retrying operation in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  getExchangeName(): string {
    return this.exchangeName;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Helper method to standardize position data
  protected standardizePosition(position: any, exchange: string): BasePosition {
    return {
      symbol: position.symbol,
      quantity: Math.abs(position.quantity || position.qty || position.size),
      side: (position.side || (position.quantity >= 0 ? 'long' : 'short')) as 'long' | 'short',
      entryPrice: position.entryPrice || position.cost_basis || position.entry_price,
      currentPrice: position.currentPrice || position.mark_price,
      unrealizedPnL: position.unrealizedPnL || position.unrealized_pl || position.unRealizedProfit,
      unrealizedPnLPercent: position.unrealizedPnLPercent || position.unrealized_plpc || position.percentage,
      marketValue: position.marketValue || position.market_value || position.notional
    };
  }

  // Helper method to standardize order results
  protected standardizeOrderResult(order: any, exchange: string): BaseOrderResult {
    return {
      orderId: order.orderId || order.id || order.order_id,
      status: order.status,
      filledQty: parseFloat(order.filledQty || order.filled_qty || order.executedQty || '0'),
      avgFillPrice: parseFloat(order.avgFillPrice || order.filled_avg_price || order.avgPrice || order.price || '0'),
      symbol: order.symbol,
      side: order.side,
      timestamp: new Date(order.timestamp || order.created_at || order.time || Date.now()),
      exchange
    };
  }

  // Helper method to standardize account data
  protected standardizeAccount(account: any, exchange: string): BaseAccount {
    return {
      totalBalance: parseFloat(account.totalBalance || account.portfolio_value || account.totalWalletBalance || '0'),
      availableBalance: parseFloat(account.availableBalance || account.buying_power || account.availableBalance || '0'),
      equity: parseFloat(account.equity || account.totalWalletBalance || account.portfolio_value || '0'),
      margin: account.margin ? parseFloat(account.margin) : undefined,
      portfolioValue: parseFloat(account.portfolioValue || account.portfolio_value || account.totalWalletBalance || '0')
    };
  }
} 