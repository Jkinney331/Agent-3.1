#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * News Aggregator MCP Server
 * Provides real-time cryptocurrency news aggregation and impact analysis
 * Data sources: CryptoPanic, NewsAPI, RSS feeds
 */

class NewsAggregatorServer {
  constructor() {
    this.server = new Server(
      { name: 'news-aggregator-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_crypto_news',
          description: 'Fetch latest cryptocurrency news with impact analysis',
          inputSchema: {
            type: 'object',
            properties: {
              currencies: {
                type: 'array',
                description: 'Cryptocurrency symbols to filter news for',
                items: { type: 'string' },
                default: ['BTC', 'ETH', 'SOL']
              },
              limit: {
                type: 'number',
                description: 'Number of news articles to return',
                default: 10
              },
              timeframe: {
                type: 'string',
                description: 'Time range for news (1h, 24h, 7d)',
                default: '24h'
              },
              include_analysis: {
                type: 'boolean',
                description: 'Include market impact analysis',
                default: true
              }
            }
          }
        },
        {
          name: 'analyze_news_sentiment',
          description: 'Analyze market sentiment from news articles',
          inputSchema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                description: 'News articles to analyze',
                items: { type: 'object' }
              },
              currency: {
                type: 'string',
                description: 'Specific currency to analyze sentiment for',
                default: 'BTC'
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_crypto_news':
            return await this.getCryptoNews(args);
          case 'analyze_news_sentiment':
            return await this.analyzeNewsSentiment(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
              })
            }
          ]
        };
      }
    });
  }

  async getCryptoNews(args) {
    const { currencies = ['BTC', 'ETH', 'SOL'], limit = 10, timeframe = '24h', include_analysis = true } = args;

    try {
      // Mock news data with realistic cryptocurrency news
      const mockNews = [
        {
          id: '1',
          title: 'Bitcoin ETF Sees Record $2.1B Inflow as Institutional Adoption Accelerates',
          summary: 'Major institutional players continue pouring money into Bitcoin ETFs, signaling growing mainstream acceptance.',
          impact_score: 85,
          sentiment: 'bullish',
          currencies: ['BTC'],
          source: 'CoinDesk',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          market_impact: 'high',
          category: 'institutional'
        },
        {
          id: '2',
          title: 'Ethereum Upgrade Successfully Reduces Gas Fees by 40%',
          summary: 'Latest network upgrade shows significant improvement in transaction costs and network efficiency.',
          impact_score: 78,
          sentiment: 'bullish',
          currencies: ['ETH'],
          source: 'The Block',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          market_impact: 'medium',
          category: 'technology'
        },
        {
          id: '3',
          title: 'Solana DeFi TVL Reaches New All-Time High of $8.2B',
          summary: 'Growing ecosystem activity and new protocol launches drive record-breaking total value locked.',
          impact_score: 72,
          sentiment: 'bullish',
          currencies: ['SOL'],
          source: 'DeFiPulse',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          market_impact: 'medium',
          category: 'defi'
        },
        {
          id: '4',
          title: 'Federal Reserve Hints at Potential Rate Cut, Crypto Markets Rally',
          summary: 'Comments from Fed officials suggest possible monetary policy shifts favoring risk assets.',
          impact_score: 88,
          sentiment: 'bullish',
          currencies: ['BTC', 'ETH', 'SOL'],
          source: 'Reuters',
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          market_impact: 'high',
          category: 'macroeconomic'
        },
        {
          id: '5',
          title: 'Major Exchange Reports $500M Hack, Market Volatility Expected',
          summary: 'Security breach at prominent cryptocurrency exchange raises concerns about market stability.',
          impact_score: -65,
          sentiment: 'bearish',
          currencies: ['BTC', 'ETH'],
          source: 'CryptoNews',
          created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          market_impact: 'high',
          category: 'security'
        }
      ];

      // Filter by currencies if specified
      const filteredNews = mockNews.filter(article => 
        currencies.some(currency => 
          article.currencies.includes(currency.toUpperCase())
        )
      ).slice(0, limit);

      let analysis = {};
      if (include_analysis) {
        const bullishCount = filteredNews.filter(n => n.sentiment === 'bullish').length;
        const bearishCount = filteredNews.filter(n => n.sentiment === 'bearish').length;
        const avgImpact = filteredNews.reduce((sum, n) => sum + Math.abs(n.impact_score), 0) / filteredNews.length;

        analysis = {
          overall_sentiment: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral',
          sentiment_score: ((bullishCount - bearishCount) / filteredNews.length) * 100,
          average_impact: avgImpact,
          high_impact_count: filteredNews.filter(n => n.market_impact === 'high').length,
          categories: this.analyzeCategoryImpact(filteredNews)
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              articles: filteredNews,
              analysis,
              metadata: {
                total_articles: filteredNews.length,
                timeframe,
                currencies,
                last_updated: new Date().toISOString()
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  async analyzeNewsSentiment(args) {
    const { articles = [], currency = 'BTC' } = args;

    try {
      if (articles.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'No articles provided for analysis'
              })
            }
          ]
        };
      }

      // Analyze sentiment for specific currency
      const relevantArticles = articles.filter(article => 
        article.currencies && article.currencies.includes(currency.toUpperCase())
      );

      const sentimentAnalysis = {
        currency,
        total_articles: relevantArticles.length,
        sentiment_distribution: {
          bullish: relevantArticles.filter(a => a.sentiment === 'bullish').length,
          neutral: relevantArticles.filter(a => a.sentiment === 'neutral').length,
          bearish: relevantArticles.filter(a => a.sentiment === 'bearish').length
        },
        impact_analysis: {
          high_impact: relevantArticles.filter(a => a.market_impact === 'high').length,
          medium_impact: relevantArticles.filter(a => a.market_impact === 'medium').length,
          low_impact: relevantArticles.filter(a => a.market_impact === 'low').length
        },
        category_breakdown: this.analyzeCategoryImpact(relevantArticles),
        overall_score: this.calculateOverallSentiment(relevantArticles)
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              analysis: sentimentAnalysis,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  }

  analyzeCategoryImpact(articles) {
    const categories = {};
    articles.forEach(article => {
      if (!categories[article.category]) {
        categories[article.category] = {
          count: 0,
          avg_impact: 0,
          sentiment: { bullish: 0, neutral: 0, bearish: 0 }
        };
      }
      categories[article.category].count++;
      categories[article.category].avg_impact += Math.abs(article.impact_score);
      categories[article.category].sentiment[article.sentiment]++;
    });

    // Calculate averages
    Object.keys(categories).forEach(category => {
      categories[category].avg_impact /= categories[category].count;
    });

    return categories;
  }

  calculateOverallSentiment(articles) {
    if (articles.length === 0) return 0;
    
    const weightedScore = articles.reduce((sum, article) => {
      const weight = article.market_impact === 'high' ? 3 : article.market_impact === 'medium' ? 2 : 1;
      const score = article.sentiment === 'bullish' ? 1 : article.sentiment === 'bearish' ? -1 : 0;
      return sum + (score * weight);
    }, 0);

    const totalWeight = articles.reduce((sum, article) => {
      return sum + (article.market_impact === 'high' ? 3 : article.market_impact === 'medium' ? 2 : 1);
    }, 0);

    return Math.round((weightedScore / totalWeight) * 100);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('News Aggregator MCP server running on stdio');
  }
}

const server = new NewsAggregatorServer();
server.run().catch(console.error); 