import crypto from 'crypto';

interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

interface OrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET';
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  percentage: number;
  leverage: number;
}

interface Balance {
  asset: string;
  free: number;
  locked: number;
}

export class BinanceClient {
  private config: BinanceConfig;
  private baseURL: string;

  constructor(config: BinanceConfig) {
    this.config = config;
    this.baseURL = config.testnet 
      ? 'https://testnet.binancefuture.com'
      : 'https://fapi.binance.com';
  }

  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {},
    signed: boolean = false
  ): Promise<any> {
    const timestamp = Date.now();
    
    if (signed) {
      params.timestamp = timestamp;
      params.recvWindow = 5000;
    }

    const queryString = new URLSearchParams(params).toString();
    const signature = signed ? this.createSignature(queryString) : '';
    
    const url = `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}${signed ? `&signature=${signature}` : ''}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (signed) {
      headers['X-MBX-APIKEY'] = this.config.apiKey;
    }

    console.log(`🔗 Binance API: ${method} ${endpoint}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance API error:', error);
      throw error;
    }
  }

  // Account Information
  async getAccountInfo(): Promise<any> {
    return this.makeRequest('/fapi/v2/account', 'GET', {}, true);
  }

  async getBalances(): Promise<Balance[]> {
    const account = await this.getAccountInfo();
    return account.assets
      .filter((asset: any) => parseFloat(asset.walletBalance) > 0)
      .map((asset: any) => ({
        asset: asset.asset,
        free: parseFloat(asset.availableBalance),
        locked: parseFloat(asset.walletBalance) - parseFloat(asset.availableBalance)
      }));
  }

  async getPositions(): Promise<Position[]> {
    const positions = await this.makeRequest('/fapi/v2/positionRisk', 'GET', {}, true);
    
    return positions
      .filter((pos: any) => parseFloat(pos.positionAmt) !== 0)
      .map((pos: any) => ({
        symbol: pos.symbol,
        side: parseFloat(pos.positionAmt) > 0 ? 'LONG' : 'SHORT',
        size: Math.abs(parseFloat(pos.positionAmt)),
        entryPrice: parseFloat(pos.entryPrice),
        unrealizedPnl: parseFloat(pos.unRealizedProfit),
        percentage: parseFloat(pos.percentage),
        leverage: parseFloat(pos.leverage)
      }));
  }

  // Trading Operations
  async createOrder(params: OrderParams): Promise<any> {
    console.log(`📋 Creating ${params.side} order for ${params.symbol}:`, params);
    
    const orderParams: Record<string, any> = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      timeInForce: params.timeInForce || 'GTC'
    };

    if (params.quantity) orderParams.quantity = params.quantity.toString();
    if (params.quoteOrderQty) orderParams.quoteOrderQty = params.quoteOrderQty.toString();
    if (params.price) orderParams.price = params.price.toString();
    if (params.stopPrice) orderParams.stopPrice = params.stopPrice.toString();

    return this.makeRequest('/fapi/v1/order', 'POST', orderParams, true);
  }

  async createMarketBuy(symbol: string, quantity: number): Promise<any> {
    return this.createOrder({
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity
    });
  }

  async createMarketSell(symbol: string, quantity: number): Promise<any> {
    return this.createOrder({
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity
    });
  }

  async createStopLoss(symbol: string, side: 'BUY' | 'SELL', quantity: number, stopPrice: number): Promise<any> {
    return this.createOrder({
      symbol,
      side,
      type: 'STOP_MARKET',
      quantity,
      stopPrice
    });
  }

  async createTakeProfit(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): Promise<any> {
    return this.createOrder({
      symbol,
      side,
      type: 'LIMIT',
      quantity,
      price,
      timeInForce: 'GTC'
    });
  }

  // Risk Management
  async setLeverage(symbol: string, leverage: number): Promise<any> {
    console.log(`⚖️ Setting leverage for ${symbol}: ${leverage}x`);
    return this.makeRequest('/fapi/v1/leverage', 'POST', {
      symbol,
      leverage
    }, true);
  }

  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<any> {
    console.log(`🔒 Setting margin type for ${symbol}: ${marginType}`);
    return this.makeRequest('/fapi/v1/marginType', 'POST', {
      symbol,
      marginType
    }, true);
  }

  // Market Data
  async getSymbolPrice(symbol: string): Promise<number> {
    const ticker = await this.makeRequest('/fapi/v1/ticker/price', 'GET', { symbol });
    return parseFloat(ticker.price);
  }

  async get24hrTicker(symbol: string): Promise<any> {
    return this.makeRequest('/fapi/v1/ticker/24hr', 'GET', { symbol });
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    return this.makeRequest('/fapi/v1/depth', 'GET', { symbol, limit });
  }

  // Order Management
  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params = symbol ? { symbol } : {};
    return this.makeRequest('/fapi/v1/openOrders', 'GET', params, true);
  }

  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    console.log(`❌ Cancelling order ${orderId} for ${symbol}`);
    return this.makeRequest('/fapi/v1/order', 'DELETE', {
      symbol,
      orderId
    }, true);
  }

  async cancelAllOrders(symbol: string): Promise<any> {
    console.log(`🚫 Cancelling ALL orders for ${symbol}`);
    return this.makeRequest('/fapi/v1/allOpenOrders', 'DELETE', { symbol }, true);
  }

  // Trading Utilities
  async closePosition(symbol: string): Promise<any> {
    const positions = await this.getPositions();
    const position = positions.find(p => p.symbol === symbol);
    
    if (!position) {
      throw new Error(`No open position found for ${symbol}`);
    }

    console.log(`🔄 Closing ${position.side} position for ${symbol}: ${position.size}`);
    
    // Close position by creating opposite market order
    const closeSide = position.side === 'LONG' ? 'SELL' : 'BUY';
    return this.createOrder({
      symbol,
      side: closeSide,
      type: 'MARKET',
      quantity: position.size
    });
  }

  async getAccountBalance(): Promise<number> {
    const account = await this.getAccountInfo();
    const usdtBalance = account.assets.find((asset: any) => asset.asset === 'USDT');
    return usdtBalance ? parseFloat(usdtBalance.walletBalance) : 0;
  }

  // Position Size Calculator
  calculatePositionSize(
    accountBalance: number, 
    riskPercentage: number, 
    entryPrice: number, 
    stopLossPrice: number,
    leverage: number = 1
  ): number {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice) / entryPrice;
    const baseQuantity = riskAmount / (priceRisk * entryPrice);
    
    // Apply leverage
    return baseQuantity * leverage;
  }

  // Utility Methods
  formatSymbol(symbol: string): string {
    // Convert from CoinGecko format to Binance format
    const symbolMap: Record<string, string> = {
      'bitcoin': 'BTCUSDT',
      'ethereum': 'ETHUSDT', 
      'solana': 'SOLUSDT',
      'cardano': 'ADAUSDT',
      'chainlink': 'LINKUSDT',
      'polkadot': 'DOTUSDT',
      'avalanche': 'AVAXUSDT',
      'polygon': 'MATICUSDT'
    };
    
    return symbolMap[symbol.toLowerCase()] || `${symbol.toUpperCase()}USDT`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/fapi/v1/ping');
      console.log('✅ Binance connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Binance connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instances for different environments
export const binanceTestnet = new BinanceClient({
  apiKey: process.env.BINANCE_TESTNET_API_KEY || '',
  apiSecret: process.env.BINANCE_TESTNET_SECRET || '',
  testnet: true
});

export const binanceLive = new BinanceClient({
  apiKey: process.env.BINANCE_API_KEY || '',
  apiSecret: process.env.BINANCE_SECRET || '',
  testnet: false
});

// Export default as testnet for safety
export const binanceClient = binanceTestnet; 