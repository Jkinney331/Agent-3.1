/**
 * Mock Exchange Client for Local Testing
 * Simulates real exchange behavior for comprehensive testing
 */

import { EventEmitter } from 'events';

export interface MockOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filled_quantity: number;
  filled_price?: number;
  fees: number;
  created_at: Date;
  filled_at?: Date;
}

export interface MockPosition {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  margin_used: number;
}

export interface MockBalance {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

export interface MockTicker {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  change_24h: number;
  change_percent_24h: number;
  high_24h: number;
  low_24h: number;
  timestamp: Date;
}

export class MockExchangeClient extends EventEmitter {
  private orders: Map<string, MockOrder> = new Map();
  private positions: Map<string, MockPosition> = new Map();
  private balances: Map<string, MockBalance> = new Map();
  private tickers: Map<string, MockTicker> = new Map();
  private orderIdCounter = 1000;
  private isConnected = false;
  private latency = { min: 50, max: 200 }; // Simulate network latency
  private slippage = 0.001; // 0.1% slippage
  private feeRate = 0.001; // 0.1% trading fee
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  // Market conditions simulation
  private marketConditions = {
    volatility: 0.02, // 2% volatility
    trend: 0, // -1 = bearish, 0 = neutral, 1 = bullish
    liquidity: 1.0 // 1.0 = high liquidity, 0.5 = low liquidity
  };

  constructor() {
    super();
    this.initializeDefaultData();
  }

  /**
   * Initialize with default balances and market data
   */
  private initializeDefaultData() {
    // Initialize balances
    this.balances.set('USD', {
      currency: 'USD',
      available: 50000,
      locked: 0,
      total: 50000
    });

    this.balances.set('BTC', {
      currency: 'BTC',
      available: 0,
      locked: 0,
      total: 0
    });

    this.balances.set('ETH', {
      currency: 'ETH',
      available: 0,
      locked: 0,
      total: 0
    });

    // Initialize market tickers with realistic prices
    const initialPrices = {
      'BTC-USD': 45000,
      'ETH-USD': 3000,
      'BNB-USD': 350,
      'ADA-USD': 0.5,
      'XRP-USD': 0.6,
      'SOL-USD': 100,
      'DOT-USD': 7,
      'DOGE-USD': 0.08,
      'AVAX-USD': 18,
      'MATIC-USD': 0.9
    };

    for (const [symbol, price] of Object.entries(initialPrices)) {
      this.tickers.set(symbol, {
        symbol,
        price,
        bid: price * 0.999,
        ask: price * 1.001,
        volume: Math.random() * 1000000 + 100000,
        change_24h: (Math.random() - 0.5) * price * 0.1,
        change_percent_24h: (Math.random() - 0.5) * 10,
        high_24h: price * (1 + Math.random() * 0.05),
        low_24h: price * (1 - Math.random() * 0.05),
        timestamp: new Date()
      });
    }
  }

  /**
   * Connect to mock exchange
   */
  async connect(): Promise<void> {
    await this.simulateLatency();
    
    this.isConnected = true;
    this.startPriceUpdates();
    
    this.emit('connected');
    console.log('🔗 Mock exchange connected');
  }

  /**
   * Disconnect from mock exchange
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    
    this.emit('disconnected');
    console.log('❌ Mock exchange disconnected');
  }

  /**
   * Get account balances
   */
  async getBalances(): Promise<MockBalance[]> {
    await this.simulateLatency();
    
    if (!this.isConnected) {
      throw new Error('Exchange not connected');
    }
    
    return Array.from(this.balances.values());
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<MockPosition[]> {
    await this.simulateLatency();
    
    if (!this.isConnected) {
      throw new Error('Exchange not connected');
    }
    
    return Array.from(this.positions.values());
  }

  /**
   * Get ticker for symbol
   */
  async getTicker(symbol: string): Promise<MockTicker | null> {
    await this.simulateLatency();
    
    if (!this.isConnected) {
      throw new Error('Exchange not connected');
    }
    
    return this.tickers.get(symbol) || null;
  }

  /**
   * Get all tickers
   */
  async getTickers(): Promise<MockTicker[]> {
    await this.simulateLatency();
    
    if (!this.isConnected) {
      throw new Error('Exchange not connected');
    }
    
    return Array.from(this.tickers.values());
  }

  /**
   * Place a trading order
   */
  async placeOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price?: number,
    type: 'market' | 'limit' | 'stop' | 'stop_limit' = 'market'
  ): Promise<MockOrder> {
    await this.simulateLatency();
    
    if (!this.isConnected) {
      throw new Error('Exchange not connected');
    }

    const orderId = `mock-order-${this.orderIdCounter++}`;
    const ticker = this.tickers.get(symbol);
    
    if (!ticker) {
      throw new Error(`Symbol ${symbol} not found`);
    }

    // Validate sufficient balance
    const baseCurrency = symbol.split('-')[1] || 'USD';
    const quoteCurrency = symbol.split('-')[0] || symbol;
    
    if (side === 'buy') {
      const requiredBalance = quantity * (price || ticker.price);
      const balance = this.balances.get(baseCurrency);
      
      if (!balance || balance.available < requiredBalance) {
        throw new Error('Insufficient balance for buy order');
      }
    } else {
      const balance = this.balances.get(quoteCurrency);
      
      if (!balance || balance.available < quantity) {
        throw new Error('Insufficient balance for sell order');
      }
    }

    const order: MockOrder = {
      id: orderId,
      symbol,
      side,
      quantity,
      price,
      type,
      status: 'pending',
      filled_quantity: 0,
      fees: 0,
      created_at: new Date()
    };

    this.orders.set(orderId, order);

    // Simulate order processing
    setTimeout(() => {
      this.processOrder(orderId);
    }, Math.random() * 1000 + 500); // 500-1500ms processing time

    this.emit('orderCreated', order);
    return order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<MockOrder> {
    await this.simulateLatency();
    
    const order = this.orders.get(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status === 'filled') {
      throw new Error('Cannot cancel filled order');
    }
    
    order.status = 'cancelled';
    this.emit('orderCancelled', order);
    
    return order;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<MockOrder | null> {
    await this.simulateLatency();
    return this.orders.get(orderId) || null;
  }

  /**
   * Get all orders
   */
  async getOrders(symbol?: string): Promise<MockOrder[]> {
    await this.simulateLatency();
    
    let orders = Array.from(this.orders.values());
    
    if (symbol) {
      orders = orders.filter(order => order.symbol === symbol);
    }
    
    return orders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Process pending order (simulate order matching)
   */
  private processOrder(orderId: string) {
    const order = this.orders.get(orderId);
    
    if (!order || order.status !== 'pending') {
      return;
    }

    const ticker = this.tickers.get(order.symbol);
    
    if (!ticker) {
      order.status = 'rejected';
      this.emit('orderRejected', order);
      return;
    }

    // Simulate order rejection (5% chance)
    if (Math.random() < 0.05) {
      order.status = 'rejected';
      this.emit('orderRejected', order);
      return;
    }

    // Calculate fill price with slippage
    let fillPrice: number;
    
    if (order.type === 'market') {
      fillPrice = order.side === 'buy' 
        ? ticker.ask * (1 + this.slippage * this.marketConditions.liquidity)
        : ticker.bid * (1 - this.slippage * this.marketConditions.liquidity);
    } else {
      fillPrice = order.price || ticker.price;
    }

    // Calculate fees
    const fees = order.quantity * fillPrice * this.feeRate;

    // Fill the order
    order.status = 'filled';
    order.filled_quantity = order.quantity;
    order.filled_price = fillPrice;
    order.fees = fees;
    order.filled_at = new Date();

    // Update balances and positions
    this.updateBalancesAndPositions(order);

    this.emit('orderFilled', order);
  }

  /**
   * Update balances and positions after order fill
   */
  private updateBalancesAndPositions(order: MockOrder) {
    const baseCurrency = order.symbol.split('-')[1] || 'USD';
    const quoteCurrency = order.symbol.split('-')[0] || order.symbol;
    
    const baseBalance = this.balances.get(baseCurrency);
    const quoteBalance = this.balances.get(quoteCurrency);

    if (!baseBalance || !quoteBalance) {
      console.error('Balance not found for currencies');
      return;
    }

    if (order.side === 'buy') {
      // Decrease base currency (USD)
      const totalCost = order.filled_quantity * order.filled_price! + order.fees;
      baseBalance.available -= totalCost;
      baseBalance.total -= totalCost;

      // Increase quote currency (BTC, ETH, etc.)
      quoteBalance.available += order.filled_quantity;
      quoteBalance.total += order.filled_quantity;

      // Update or create position
      const existingPosition = this.positions.get(order.symbol);
      
      if (existingPosition) {
        // Average down the position
        const totalQuantity = existingPosition.quantity + order.filled_quantity;
        const avgPrice = (
          (existingPosition.entry_price * existingPosition.quantity) +
          (order.filled_price! * order.filled_quantity)
        ) / totalQuantity;

        existingPosition.quantity = totalQuantity;
        existingPosition.entry_price = avgPrice;
        existingPosition.current_price = order.filled_price!;
        existingPosition.unrealized_pnl = (order.filled_price! - avgPrice) * totalQuantity;
      } else {
        this.positions.set(order.symbol, {
          symbol: order.symbol,
          side: 'long',
          quantity: order.filled_quantity,
          entry_price: order.filled_price!,
          current_price: order.filled_price!,
          unrealized_pnl: 0,
          margin_used: order.filled_quantity * order.filled_price! * 0.1 // 10% margin
        });
      }

    } else { // sell
      // Increase base currency (USD)
      const totalReceived = order.filled_quantity * order.filled_price! - order.fees;
      baseBalance.available += totalReceived;
      baseBalance.total += totalReceived;

      // Decrease quote currency
      quoteBalance.available -= order.filled_quantity;
      quoteBalance.total -= order.filled_quantity;

      // Update or remove position
      const existingPosition = this.positions.get(order.symbol);
      
      if (existingPosition) {
        if (existingPosition.quantity <= order.filled_quantity) {
          // Close position
          this.positions.delete(order.symbol);
        } else {
          // Reduce position size
          existingPosition.quantity -= order.filled_quantity;
          existingPosition.unrealized_pnl = (order.filled_price! - existingPosition.entry_price) * existingPosition.quantity;
        }
      }
    }

    // Ensure balances don't go negative
    baseBalance.available = Math.max(0, baseBalance.available);
    baseBalance.total = Math.max(0, baseBalance.total);
    quoteBalance.available = Math.max(0, quoteBalance.available);
    quoteBalance.total = Math.max(0, quoteBalance.total);
  }

  /**
   * Start real-time price updates
   */
  private startPriceUpdates() {
    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices();
    }, 1000 + Math.random() * 2000); // Update every 1-3 seconds
  }

  /**
   * Update ticker prices with realistic movements
   */
  private updatePrices() {
    for (const [symbol, ticker] of this.tickers) {
      // Generate realistic price movement
      const volatility = this.marketConditions.volatility;
      const trend = this.marketConditions.trend;
      
      // Random walk with trend bias
      const change = (Math.random() - 0.5 + trend * 0.1) * volatility;
      const newPrice = ticker.price * (1 + change);
      
      // Update ticker
      ticker.price = Math.max(0.0001, newPrice); // Prevent negative prices
      ticker.bid = ticker.price * 0.999;
      ticker.ask = ticker.price * 1.001;
      ticker.timestamp = new Date();
      
      // Update 24h change
      const change24h = ticker.price - (ticker.price / (1 + ticker.change_percent_24h / 100));
      ticker.change_24h = change24h;
      
      // Update positions unrealized P&L
      this.updatePositionPnL(symbol, ticker.price);
    }

    this.emit('priceUpdate', Array.from(this.tickers.values()));
  }

  /**
   * Update position unrealized P&L
   */
  private updatePositionPnL(symbol: string, currentPrice: number) {
    const position = this.positions.get(symbol);
    
    if (position) {
      position.current_price = currentPrice;
      position.unrealized_pnl = position.side === 'long'
        ? (currentPrice - position.entry_price) * position.quantity
        : (position.entry_price - currentPrice) * position.quantity;
    }
  }

  /**
   * Simulate network latency
   */
  private async simulateLatency(): Promise<void> {
    const latency = Math.random() * (this.latency.max - this.latency.min) + this.latency.min;
    return new Promise(resolve => setTimeout(resolve, latency));
  }

  /**
   * Set market conditions for testing different scenarios
   */
  setMarketConditions(conditions: Partial<typeof this.marketConditions>) {
    this.marketConditions = { ...this.marketConditions, ...conditions };
    console.log('📊 Market conditions updated:', this.marketConditions);
  }

  /**
   * Get current market conditions
   */
  getMarketConditions() {
    return { ...this.marketConditions };
  }

  /**
   * Simulate market crash (for stress testing)
   */
  simulateMarketCrash(severity: number = 0.2) {
    console.log(`📉 Simulating market crash with ${severity * 100}% drop`);
    
    for (const ticker of this.tickers.values()) {
      ticker.price *= (1 - severity);
      ticker.bid = ticker.price * 0.999;
      ticker.ask = ticker.price * 1.001;
      ticker.change_24h = -ticker.price * severity;
      ticker.change_percent_24h = -severity * 100;
      ticker.timestamp = new Date();
    }

    this.setMarketConditions({
      volatility: 0.1, // High volatility during crash
      trend: -1, // Bearish trend
      liquidity: 0.3 // Low liquidity
    });

    this.emit('marketCrash', { severity });
  }

  /**
   * Reset to normal market conditions
   */
  resetMarketConditions() {
    this.setMarketConditions({
      volatility: 0.02,
      trend: 0,
      liquidity: 1.0
    });
    
    console.log('📈 Market conditions reset to normal');
  }

  /**
   * Generate market summary for testing
   */
  getMarketSummary() {
    const tickers = Array.from(this.tickers.values());
    const totalVolume = tickers.reduce((sum, t) => sum + t.volume, 0);
    const avgChange = tickers.reduce((sum, t) => sum + t.change_percent_24h, 0) / tickers.length;
    
    return {
      totalSymbols: tickers.length,
      totalVolume,
      averageChange24h: avgChange,
      marketConditions: this.marketConditions,
      orderCount: this.orders.size,
      positionCount: this.positions.size,
      connected: this.isConnected
    };
  }
}

export default MockExchangeClient;