#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

class FreeCryptoAnalyticsServer {
  constructor() {
    this.server = new Server({
      name: "free-crypto-analytics-server",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get_coincap_assets":
          return await this.getCoinCapAssets(args.limit, args.offset);
        
        case "get_coincap_markets":
          return await this.getCoinCapMarkets(args.exchange_id);
        
        case "get_crypto_panic_news":
          return await this.getCryptoPanicNews(args.currencies, args.kind);
        
        case "get_binance_24hr_ticker":
          return await this.getBinance24hrTicker(args.symbol);
        
        case "get_binance_orderbook":
          return await this.getBinanceOrderbook(args.symbol, args.limit);
        
        case "get_blockchain_stats":
          return await this.getBlockchainStats();
        
        case "get_defi_pulse_index":
          return await this.getDefiPulseIndex();
        
        case "get_mempool_stats":
          return await this.getMempoolStats();
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "get_coincap_assets",
            description: "Get cryptocurrency assets from CoinCap (no API key required)",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Number of assets to return (default: 50)",
                  default: 50,
                },
                offset: {
                  type: "number",
                  description: "Offset for pagination (default: 0)",
                  default: 0,
                },
              },
            },
          },
          {
            name: "get_coincap_markets",
            description: "Get market data from CoinCap",
            inputSchema: {
              type: "object",
              properties: {
                exchange_id: {
                  type: "string",
                  description: "Exchange ID to filter by (optional)",
                },
              },
            },
          },
          {
            name: "get_crypto_panic_news",
            description: "Get cryptocurrency news from CryptoPanic (free tier)",
            inputSchema: {
              type: "object",
              properties: {
                currencies: {
                  type: "string",
                  description: "Comma-separated currency codes (e.g., BTC,ETH)",
                },
                kind: {
                  type: "string",
                  description: "News kind (news, media)",
                  default: "news",
                },
              },
            },
          },
          {
            name: "get_binance_24hr_ticker",
            description: "Get 24hr ticker statistics from Binance (no API key required)",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol (e.g., BTCUSDT) - leave empty for all",
                },
              },
            },
          },
          {
            name: "get_binance_orderbook",
            description: "Get order book from Binance (no API key required)",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading pair symbol (e.g., BTCUSDT)",
                },
                limit: {
                  type: "number",
                  description: "Number of orders to return (default: 100)",
                  default: 100,
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_blockchain_stats",
            description: "Get blockchain network statistics (free)",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_defi_pulse_index",
            description: "Get DeFi Pulse Index data (free)",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_mempool_stats",
            description: "Get Bitcoin mempool statistics (free)",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });
  }

  async getCoinCapAssets(limit = 50, offset = 0) {
    try {
      const response = await axios.get(
        `https://api.coincap.io/v2/assets?limit=${limit}&offset=${offset}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching CoinCap assets: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getCoinCapMarkets(exchangeId) {
    try {
      let url = 'https://api.coincap.io/v2/markets';
      if (exchangeId) {
        url += `?exchangeId=${exchangeId}`;
      }

      const response = await axios.get(url);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching CoinCap markets: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getCryptoPanicNews(currencies, kind = 'news') {
    try {
      let url = `https://cryptopanic.com/api/v1/posts/?auth_token=free&kind=${kind}`;
      if (currencies) {
        url += `&currencies=${currencies}`;
      }

      const response = await axios.get(url);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching CryptoPanic news: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getBinance24hrTicker(symbol) {
    try {
      let url = 'https://api.binance.com/api/v3/ticker/24hr';
      if (symbol) {
        url += `?symbol=${symbol}`;
      }

      const response = await axios.get(url);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching Binance 24hr ticker: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getBinanceOrderbook(symbol, limit = 100) {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching Binance orderbook: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getBlockchainStats() {
    try {
      // Multiple free blockchain APIs
      const [btcStats, ethStats] = await Promise.all([
        axios.get('https://blockstream.info/api/blocks/tip/height'),
        axios.get('https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=YourApiKeyToken')
      ]);

      const stats = {
        bitcoin: {
          latest_block: btcStats.data,
          timestamp: new Date().toISOString()
        },
        ethereum: {
          latest_block: parseInt(ethStats.data.result, 16),
          timestamp: new Date().toISOString()
        }
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching blockchain stats: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getDefiPulseIndex() {
    try {
      // Free DeFi data from various sources
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=defipulse-index&vs_currencies=usd&include_24hr_change=true'
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching DeFi Pulse Index: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getMempoolStats() {
    try {
      const response = await axios.get(
        'https://mempool.space/api/mempool'
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching mempool stats: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Free Crypto Analytics MCP Server running on stdio");
  }
}

const server = new FreeCryptoAnalyticsServer();
server.run().catch(console.error); 