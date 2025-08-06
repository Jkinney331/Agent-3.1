#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

class AlphaVantageServer {
  constructor() {
    this.server = new Server({
      name: "alpha-vantage-server",
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
        case "get_crypto_daily":
          return await this.getCryptoDaily(args.symbol, args.market);
        
        case "get_crypto_intraday":
          return await this.getCryptoIntraday(args.symbol, args.market, args.interval);
        
        case "get_stock_quote":
          return await this.getStockQuote(args.symbol);
        
        case "get_forex_rate":
          return await this.getForexRate(args.from_currency, args.to_currency);
        
        case "get_market_sentiment":
          return await this.getMarketSentiment(args.tickers);
        
        case "get_economic_indicators":
          return await this.getEconomicIndicators(args.function, args.interval);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "get_crypto_daily",
            description: "Get daily crypto prices from Alpha Vantage",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Cryptocurrency symbol (e.g., BTC, ETH)",
                },
                market: {
                  type: "string",
                  description: "Market currency (default: USD)",
                  default: "USD",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_crypto_intraday",
            description: "Get intraday crypto prices from Alpha Vantage",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Cryptocurrency symbol (e.g., BTC, ETH)",
                },
                market: {
                  type: "string",
                  description: "Market currency (default: USD)",
                  default: "USD",
                },
                interval: {
                  type: "string",
                  description: "Time interval (5min, 15min, 30min, 60min)",
                  default: "60min",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_stock_quote",
            description: "Get real-time stock quote",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Stock symbol (e.g., AAPL, GOOGL)",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "get_forex_rate",
            description: "Get forex exchange rate",
            inputSchema: {
              type: "object",
              properties: {
                from_currency: {
                  type: "string",
                  description: "From currency code (e.g., USD)",
                },
                to_currency: {
                  type: "string",
                  description: "To currency code (e.g., EUR)",
                },
              },
              required: ["from_currency", "to_currency"],
            },
          },
          {
            name: "get_market_sentiment",
            description: "Get market sentiment for news and social media",
            inputSchema: {
              type: "object",
              properties: {
                tickers: {
                  type: "string",
                  description: "Comma-separated ticker symbols",
                },
              },
            },
          },
          {
            name: "get_economic_indicators",
            description: "Get economic indicators (GDP, inflation, unemployment)",
            inputSchema: {
              type: "object",
              properties: {
                function: {
                  type: "string",
                  description: "Indicator function (REAL_GDP, CPI, UNEMPLOYMENT)",
                },
                interval: {
                  type: "string",
                  description: "Data interval (annual, quarterly, monthly)",
                  default: "quarterly",
                },
              },
              required: ["function"],
            },
          },
        ],
      };
    });
  }

  async getCryptoDaily(symbol, market = 'USD') {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '1YZPQXQ5D1919XNT';
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=${market}&apikey=${apiKey}`
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
            text: `Error fetching crypto daily data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getCryptoIntraday(symbol, market = 'USD', interval = '60min') {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '1YZPQXQ5D1919XNT';
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=CRYPTO_INTRADAY&symbol=${symbol}&market=${market}&interval=${interval}&apikey=${apiKey}`
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
            text: `Error fetching crypto intraday data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getStockQuote(symbol) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '1YZPQXQ5D1919XNT';
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
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
            text: `Error fetching stock quote: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getForexRate(fromCurrency, toCurrency) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '1YZPQXQ5D1919XNT';
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`
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
            text: `Error fetching forex rate: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getMarketSentiment(tickers) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '1YZPQXQ5D1919XNT';
      let url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${apiKey}`;
      
      if (tickers) {
        url += `&tickers=${tickers}`;
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
            text: `Error fetching market sentiment: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getEconomicIndicators(functionName, interval = 'quarterly') {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || '1YZPQXQ5D1919XNT';
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=${functionName}&interval=${interval}&apikey=${apiKey}`
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
            text: `Error fetching economic indicators: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Alpha Vantage MCP Server running on stdio");
  }
}

const server = new AlphaVantageServer();
server.run().catch(console.error); 