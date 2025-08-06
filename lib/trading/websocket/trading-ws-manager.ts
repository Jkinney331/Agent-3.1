// Trading WebSocket Manager Implementation
// Note: For deployment demo, WebSocket dependencies are optional
import { EventEmitter } from 'events';

let SocketIOServer: any = null;
let WebsocketClient: any = null;

try {
  // @ts-ignore
  const socketIO = require('socket.io');
  SocketIOServer = socketIO.Server;
} catch (error) {
  console.log('socket.io not available in deployment environment');
}

try {
  // @ts-ignore
  const binance = require('binance');
  WebsocketClient = binance.WebsocketClient;
} catch (error) {
  console.log('binance WebSocket client not available in deployment environment');
}

// Import our trading components - make optional too
let unifiedExchangeManager: any = null;
try {
  unifiedExchangeManager = require('../unified-exchange-manager');
} catch (error) {
  console.log('unified exchange manager not available');
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  percentage: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: Date;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: Date;
}

export interface TradingEvent {
  type: 'POSITION_UPDATE' | 'ORDER_UPDATE' | 'PRICE_UPDATE' | 'ACCOUNT_UPDATE';
  data: Position | Order | PriceUpdate | any;
  timestamp: Date;
}

class TradingWSManager extends EventEmitter {
  private socketIO: any = null;
  private exchanges: Map<string, any> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  public isActive: boolean = false;

  constructor(httpServer?: any) {
    super();
    
    if (!SocketIOServer) {
      console.log('📝 Trading WebSocket Manager running in demo mode');
      return;
    }

    try {
      this.socketIO = new SocketIOServer(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      this.setupSocketIO();
      this.initializeExchangeWebsockets();
      
      console.log('🌐 Trading WebSocket Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket manager:', error);
    }
  }

  private setupSocketIO() {
    if (!this.socketIO) return;

    this.socketIO.on('connection', (socket: any) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle price feed subscriptions
      socket.on('subscribe-prices', (symbols: string[]) => {
        symbols.forEach(symbol => {
          this.subscribedSymbols.add(symbol);
          socket.join(`price-${symbol}`);
        });
        console.log(`📊 Client subscribed to prices: ${symbols.join(', ')}`);
      });

      // Handle unsubscribe
      socket.on('unsubscribe-prices', (symbols: string[]) => {
        symbols.forEach(symbol => {
          this.subscribedSymbols.delete(symbol);
          socket.leave(`price-${symbol}`);
        });
        console.log(`📊 Client unsubscribed from prices: ${symbols.join(', ')}`);
      });

      // Handle position updates subscription
      socket.on('subscribe-positions', () => {
        socket.join('positions');
        console.log('📈 Client subscribed to position updates');
      });

      // Handle order updates subscription  
      socket.on('subscribe-orders', () => {
        socket.join('orders');
        console.log('📋 Client subscribed to order updates');
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  private initializeExchangeWebsockets() {
    if (!WebsocketClient) {
      console.log('📝 Exchange WebSocket clients not available in demo mode');
      return;
    }

    try {
      // Initialize Binance WebSocket (when available)
      this.initializeBinanceWS();
      
      // Could add more exchanges here (Alpaca doesn't have a traditional WebSocket for equities)
      this.isActive = true;
      console.log('✅ Exchange WebSocket connections initialized');
    } catch (error) {
      console.error('❌ Failed to initialize exchange WebSockets:', error);
    }
  }

  private initializeBinanceWS() {
    if (!WebsocketClient) return;

    try {
      const binanceWS = new WebsocketClient({
        api_key: process.env.BINANCE_API_KEY,
        api_secret: process.env.BINANCE_API_SECRET,
        beautify: true,
      });

      // Subscribe to price streams
      binanceWS.on('formattedMessage', (data: any) => {
        this.handleBinanceMessage(data);
      });

      binanceWS.on('open', () => {
        console.log('✅ Binance WebSocket connected');
      });

      binanceWS.on('error', (error: any) => {
        console.error('❌ Binance WebSocket error:', error);
      });

      this.exchanges.set('binance', binanceWS);
    } catch (error) {
      console.error('❌ Failed to initialize Binance WebSocket:', error);
    }
  }

  private handleBinanceMessage(data: any) {
    if (!this.socketIO) return;

    try {
      // Handle different message types
      if (data.eventType === '24hrTicker') {
        const priceUpdate: PriceUpdate = {
          symbol: data.symbol,
          price: parseFloat(data.curDayClose),
          change24h: parseFloat(data.priceChangePercent),
          volume24h: parseFloat(data.volume),
          timestamp: new Date()
        };

        // Emit to subscribed clients
        this.socketIO.to(`price-${data.symbol}`).emit('price-update', priceUpdate);
        this.emit('price-update', priceUpdate);
      }

      if (data.eventType === 'outboundAccountPosition') {
        // Handle account position updates
        const positionUpdate = {
          type: 'POSITION_UPDATE',
          data: data,
          timestamp: new Date()
        };

        this.socketIO.to('positions').emit('position-update', positionUpdate);
        this.emit('position-update', positionUpdate);
      }

      if (data.eventType === 'executionReport') {
        // Handle order execution updates
        const orderUpdate: Order = {
          id: data.orderId,
          symbol: data.symbol,
          side: data.side.toLowerCase(),
          type: data.orderType,
          quantity: parseFloat(data.originalQuantity),
          price: parseFloat(data.price || data.lastExecutedPrice || '0'),
          status: data.orderStatus,
          timestamp: new Date(data.transactionTime)
        };

        this.socketIO.to('orders').emit('order-update', orderUpdate);
        this.emit('order-update', orderUpdate);
      }
    } catch (error) {
      console.error('❌ Error handling Binance message:', error);
    }
  }

  // Public methods for managing subscriptions
  subscribeToPrices(symbols: string[]) {
    if (!this.isActive) {
      console.log('📝 Demo mode - price subscription simulated');
      return;
    }

    symbols.forEach(symbol => {
      this.subscribedSymbols.add(symbol);
      // Add exchange-specific subscription logic here
    });

    console.log(`📊 Subscribed to price feeds: ${symbols.join(', ')}`);
  }

  unsubscribeFromPrices(symbols: string[]) {
    if (!this.isActive) {
      console.log('📝 Demo mode - price unsubscription simulated');
      return;
    }

    symbols.forEach(symbol => {
      this.subscribedSymbols.delete(symbol);
      // Add exchange-specific unsubscription logic here
    });

    console.log(`📊 Unsubscribed from price feeds: ${symbols.join(', ')}`);
  }

  broadcastPositionUpdate(position: Position) {
    if (!this.socketIO) {
      console.log('📝 Demo mode - position update would be broadcast');
      return;
    }

    const event: TradingEvent = {
      type: 'POSITION_UPDATE',
      data: position,
      timestamp: new Date()
    };

    this.socketIO.to('positions').emit('position-update', event);
    this.emit('position-update', event);
  }

  broadcastOrderUpdate(order: Order) {
    if (!this.socketIO) {
      console.log('📝 Demo mode - order update would be broadcast');
      return;
    }

    const event: TradingEvent = {
      type: 'ORDER_UPDATE',
      data: order,
      timestamp: new Date()
    };

    this.socketIO.to('orders').emit('order-update', event);
    this.emit('order-update', event);
  }

  broadcastPriceUpdate(priceUpdate: PriceUpdate) {
    if (!this.socketIO) {
      console.log('📝 Demo mode - price update would be broadcast');
      return;
    }

    this.socketIO.to(`price-${priceUpdate.symbol}`).emit('price-update', priceUpdate);
    this.emit('price-update', priceUpdate);
  }

  getConnectionStatus() {
    return {
      isActive: this.isActive,
      connectedExchanges: Array.from(this.exchanges.keys()),
      subscribedSymbols: Array.from(this.subscribedSymbols),
      connectedClients: this.socketIO ? this.socketIO.engine.clientsCount : 0
    };
  }

  shutdown() {
    console.log('🔄 Shutting down Trading WebSocket Manager...');

    // Close exchange connections
    this.exchanges.forEach((ws, exchange) => {
      try {
        if (ws && typeof ws.close === 'function') {
          ws.close();
        }
        console.log(`✅ Closed ${exchange} WebSocket`);
      } catch (error) {
        console.error(`❌ Error closing ${exchange} WebSocket:`, error);
      }
    });

    // Close Socket.IO server
    if (this.socketIO) {
      this.socketIO.close();
      console.log('✅ Socket.IO server closed');
    }

    this.isActive = false;
    this.subscribedSymbols.clear();
    this.exchanges.clear();
  }
}

// Note: Cannot create instance without HTTP server in this module
// Export the class for use in the main application
export { TradingWSManager }; 