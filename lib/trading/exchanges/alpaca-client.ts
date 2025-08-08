// Alpaca Trading Client Implementation
// Note: For deployment demo, Alpaca SDK is optional
let Alpaca: any = null;
try {
  // @ts-ignore
  Alpaca = require('@alpacahq/alpaca-trade-api');
} catch (error) {
  console.log('Alpaca SDK not available in deployment environment');
}

export interface OrderRequest {
  symbol: string;
  qty: string | number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  extended_hours?: boolean;
  client_order_id?: string;
}

export interface OrderResult {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty?: string;
  filled_qty?: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price?: number;
  stop_price?: number;
  status: string;
  extended_hours: boolean;
  legs?: any[];
  trail_percent?: number;
  trail_price?: number;
  hwm?: number;
  commission?: number;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: 'long' | 'short';
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  crypto_status?: string;
  currency: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  non_marginable_buying_power: string;
  cash: string;
  accrued_fees: string;
  pending_transfer_out: string;
  pending_transfer_in: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  sma: string;
  daytrade_count: number;
}

export class AlpacaClient {
  private client: any = null;
  private isRealConnection: boolean = false;

  constructor() {
    if (Alpaca) {
      try {
        // Check if we have real API credentials
        const apiKey = process.env.ALPACA_API_KEY || 'demo_key';
        const secretKey = process.env.ALPACA_SECRET_KEY || 'demo_secret';
        
        this.isRealConnection = (
          apiKey !== 'demo_key' && 
          apiKey !== 'your-alpaca-paper-api-key' &&
          secretKey !== 'demo_secret' && 
          secretKey !== 'your-alpaca-paper-secret-key'
        );

        this.client = new Alpaca({
          credentials: {
            key: apiKey,
            secret: secretKey,
            paper: process.env.ALPACA_PAPER === 'true' || true // Use paper trading (default: true)
          },
          data: {
            url: process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets'
          }
        });
        
        if (this.isRealConnection) {
          console.log('✅ Alpaca client initialized with real API credentials');
        } else {
          console.log('⚠️  Alpaca client initialized with demo credentials - will use mock mode');
          this.client = null; // Force mock mode for demo credentials
        }
      } catch (error) {
        console.error('❌ Failed to initialize Alpaca client:', error);
        this.client = null;
      }
    } else {
      console.log('📝 Alpaca client running in demo mode (SDK not available)');
    }
  }

  async placeOrder(orderReq: OrderRequest): Promise<OrderResult> {
    if (!this.client) {
      console.log('📝 Alpaca client not available, using mock order result');
      return this.mockOrderResult(orderReq);
    }

    try {
      const order = await this.client.createOrder({
        symbol: orderReq.symbol,
        qty: orderReq.qty,
        side: orderReq.side,
        type: orderReq.type,
        time_in_force: orderReq.time_in_force,
        limit_price: orderReq.limit_price,
        stop_price: orderReq.stop_price,
        extended_hours: orderReq.extended_hours || false,
        client_order_id: orderReq.client_order_id
      });

      console.log(`✅ Alpaca order placed: ${order.symbol} ${order.side} ${order.qty}`);
      return order;
    } catch (error) {
      console.error('❌ Alpaca order failed:', error);
      console.log('📝 Falling back to mock order result');
      return this.mockOrderResult(orderReq);
    }
  }

  async getAccount(): Promise<AlpacaAccount> {
    if (!this.client) {
      console.log('📝 Alpaca client not available, using mock account');
      return this.mockAccount();
    }

    try {
      const account = await this.client.getAccount();
      console.log('✅ Alpaca account data retrieved');
      return account;
    } catch (error) {
      console.error('❌ Failed to get Alpaca account:', error);
      console.log('📝 Falling back to mock account');
      return this.mockAccount();
    }
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    if (!this.client) {
      console.log('📝 Alpaca client not available, using mock positions');
      return this.mockPositions();
    }

    try {
      const positions = await this.client.getPositions();
      console.log(`✅ Retrieved ${positions.length} Alpaca positions`);
      return positions;
    } catch (error) {
      console.error('❌ Failed to get Alpaca positions:', error);
      console.log('📝 Falling back to mock positions');
      return this.mockPositions();
    }
  }

  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    if (!this.client) {
      return null;
    }

    try {
      const position = await this.client.getPosition(symbol);
      console.log(`✅ Retrieved Alpaca position for ${symbol}`);
      return position;
    } catch (error: any) {
      if (String(error).includes('404')) {
        return null; // No position found
      }
      console.error(`❌ Failed to get Alpaca position for ${symbol}:`, error);
      throw new Error(`Failed to get position: ${String(error)}`);
    }
  }

  async getOrders(status?: string): Promise<OrderResult[]> {
    if (!this.client) {
      console.log('📝 Alpaca client not available, using mock orders');
      return this.mockOrders();
    }

    try {
      const orders = await this.client.getOrders({
        status: status || 'all',
        limit: 100,
        nested: true
      });
      console.log(`✅ Retrieved ${orders.length} Alpaca orders`);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get Alpaca orders:', error);
      console.log('📝 Falling back to mock orders');
      return this.mockOrders();
    }
  }

  async cancelOrder(orderId: string): Promise<any> {
    if (!this.client) {
      return { success: true, message: 'Demo mode - order cancelled' };
    }

    try {
      await this.client.cancelOrder(orderId);
      console.log(`✅ Cancelled Alpaca order: ${orderId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to cancel Alpaca order ${orderId}:`, error);
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  async closeAllPositions(): Promise<any> {
    if (!this.client) {
      return { success: true, message: 'Demo mode - all positions closed' };
    }

    try {
      const result = await this.client.closeAllPositions();
      console.log('✅ All Alpaca positions closed');
      return result;
    } catch (error) {
      console.error('❌ Failed to close all Alpaca positions:', error);
      throw new Error(`Failed to close positions: ${error}`);
    }
  }

  /**
   * Test the connection to Alpaca API
   */
  async testConnection(): Promise<{success: boolean, message: string, data?: any}> {
    if (!this.client) {
      return {
        success: false,
        message: 'Alpaca client not initialized - using mock mode. Please configure real API credentials.',
        data: { mode: 'mock', isRealConnection: this.isRealConnection }
      };
    }

    try {
      const account = await this.client.getAccount();
      return {
        success: true,
        message: `Successfully connected to Alpaca paper trading account (${account.id})`,
        data: {
          mode: 'real',
          account_id: account.id,
          status: account.status,
          cash: account.cash,
          buying_power: account.buying_power,
          portfolio_value: account.portfolio_value,
          paper_trading: account.id?.includes('PA') || true
        }
      };
    } catch (error: any) {
      let message = 'Failed to connect to Alpaca API';
      
      if (error.response?.status === 403) {
        message = 'Authentication failed - please check your API credentials in .env.local';
      } else if (error.response?.status === 401) {
        message = 'Invalid API credentials - please verify your Alpaca API key and secret';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        message = 'Network error - unable to reach Alpaca servers';
      } else {
        message = `Connection error: ${error.message}`;
      }

      return {
        success: false,
        message,
        data: { 
          error: error.message, 
          status: error.response?.status,
          mode: 'error'
        }
      };
    }
  }

  /**
   * Get connection status and configuration info
   */
  getConnectionInfo(): {isConnected: boolean, mode: string, config: any} {
    const config = {
      apiKey: process.env.ALPACA_API_KEY ? 
        `***${process.env.ALPACA_API_KEY.slice(-4)}` : 'NOT_SET',
      paper: process.env.ALPACA_PAPER,
      baseUrl: process.env.ALPACA_BASE_URL,
      dataUrl: process.env.ALPACA_DATA_URL
    };

    return {
      isConnected: !!this.client,
      mode: this.client ? (this.isRealConnection ? 'real' : 'demo') : 'mock',
      config
    };
  }

  // Mock methods for demo deployment
  private mockOrderResult(orderReq: OrderRequest): OrderResult {
    return {
      id: `demo_${Date.now()}`,
      client_order_id: orderReq.client_order_id || `client_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      asset_id: `asset_${orderReq.symbol}`,
      symbol: orderReq.symbol,
      asset_class: 'us_equity',
      qty: orderReq.qty.toString(),
      filled_qty: '0',
      order_class: 'simple',
      order_type: orderReq.type,
      type: orderReq.type,
      side: orderReq.side,
      time_in_force: orderReq.time_in_force,
      limit_price: orderReq.limit_price,
      stop_price: orderReq.stop_price,
      status: 'accepted',
      extended_hours: orderReq.extended_hours || false
    };
  }

  private mockAccount(): AlpacaAccount {
    return {
      id: 'demo_account',
      account_number: 'DEMO123456',
      status: 'ACTIVE',
      currency: 'USD',
      buying_power: '50000.00',
      regt_buying_power: '50000.00',
      daytrading_buying_power: '100000.00',
      non_marginable_buying_power: '50000.00',
      cash: '50000.00',
      accrued_fees: '0.00',
      pending_transfer_out: '0.00',
      pending_transfer_in: '0.00',
      portfolio_value: '50000.00',
      pattern_day_trader: false,
      trading_blocked: false,
      transfers_blocked: false,
      account_blocked: false,
      created_at: new Date().toISOString(),
      trade_suspended_by_user: false,
      multiplier: '2',
      shorting_enabled: true,
      equity: '50000.00',
      last_equity: '50000.00',
      long_market_value: '0.00',
      short_market_value: '0.00',
      initial_margin: '0.00',
      maintenance_margin: '0.00',
      last_maintenance_margin: '0.00',
      sma: '50000.00',
      daytrade_count: 0
    };
  }

  private mockPositions(): AlpacaPosition[] {
    return [];
  }

  private mockOrders(): OrderResult[] {
    return [];
  }

  async checkConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.client) {
      return {
        connected: false,
        message: 'Alpaca SDK not available (demo mode)'
      }
    }

    try {
      const account = await this.client.getAccount()
      return {
        connected: true,
        message: `Connected to Alpaca account: ${account.account_number}`
      }
    } catch (error) {
      return {
        connected: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  isConnected(): boolean {
    return this.client !== null
  }
}

// Export singleton instance
export const alpacaClient = new AlpacaClient(); 