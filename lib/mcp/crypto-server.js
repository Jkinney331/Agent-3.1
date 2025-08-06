#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

class CryptoDataServer {
  constructor() {
    this.server = new Server({
      name: "crypto-data-server",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupTools();
  }

  setupTools() {
    // 📊 Get crypto prices from CoinGecko (uses your API key)
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get_crypto_price":
          return await this.getCryptoPrice(args.symbol);
        
        case "get_trending_coins":
          return await this.getTrendingCoins();
        
        case "get_fear_greed_index":
          return await this.getFearGreedIndex();
        
        case "get_global_market_data":
          return await this.getGlobalMarketData();
        
        case "get_top_gainers_losers":
          return await this.getTopGainersLosers();
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "get_crypto_price",
            description: "Get current price and market data for a cryptocurrency",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Cryptocurrency symbol (e.g., bitcoin, ethereum)",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_trending_coins",
            description: "Get currently trending cryptocurrencies",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_fear_greed_index",
            description: "Get current crypto fear & greed index",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_global_market_data",
            description: "Get global cryptocurrency market statistics",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_top_gainers_losers",
            description: "Get top gaining and losing cryptocurrencies today",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });
  }

  async getCryptoPrice(symbol) {
    try {
      const apiKey = process.env.COINGECKO_API_KEY || 'CG-WPEr8xVSSa3wbTHneis6hiZe';
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        {
          headers: {
            'X-CG-Demo-API-Key': apiKey
          }
        }
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
            text: `Error fetching price for ${symbol}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getTrendingCoins() {
    try {
      const apiKey = process.env.COINGECKO_API_KEY || 'CG-WPEr8xVSSa3wbTHneis6hiZe';
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/search/trending',
        {
          headers: {
            'X-CG-Demo-API-Key': apiKey
          }
        }
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
            text: `Error fetching trending coins: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getFearGreedIndex() {
    try {
      // Free Fear & Greed Index API (no key required)
      const response = await axios.get(
        'https://api.alternative.me/fng/'
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
            text: `Error fetching fear & greed index: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getGlobalMarketData() {
    try {
      const apiKey = process.env.COINGECKO_API_KEY || 'CG-WPEr8xVSSa3wbTHneis6hiZe';
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/global',
        {
          headers: {
            'X-CG-Demo-API-Key': apiKey
          }
        }
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
            text: `Error fetching global market data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getTopGainersLosers() {
    try {
      const apiKey = process.env.COINGECKO_API_KEY || 'CG-WPEr8xVSSa3wbTHneis6hiZe';
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=50&page=1',
        {
          headers: {
            'X-CG-Demo-API-Key': apiKey
          }
        }
      );

      const data = response.data;
      const gainers = data.slice(0, 10);
      const losers = data.slice(-10).reverse();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ gainers, losers }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching gainers/losers: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Crypto Data MCP Server running on stdio");
  }
}

const server = new CryptoDataServer();
server.run().catch(console.error); 