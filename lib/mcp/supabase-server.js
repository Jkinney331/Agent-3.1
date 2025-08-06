#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createClient } = require('@supabase/supabase-js');

class SupabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: 'supabase-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
        },
      }
    );

    this.supabase = null;
    this.setupHandlers();
  }

  setupHandlers() {
    // Initialize Supabase connection
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'initialize_connection':
            return await this.initializeConnection(args);
          case 'get_portfolio_data':
            return await this.getPortfolioData(args);
          case 'save_trade':
            return await this.saveTrade(args);
          case 'update_balance':
            return await this.updateBalance(args);
          case 'get_trading_history':
            return await this.getTradingHistory(args);
          case 'save_ai_analysis':
            return await this.saveAIAnalysis(args);
          case 'get_positions':
            return await this.getPositions(args);
          case 'update_position':
            return await this.updatePosition(args);
          case 'get_market_data':
            return await this.getMarketData(args);
          case 'save_market_data':
            return await this.saveMarketData(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async initializeConnection(args) {
    const { supabase_url, supabase_key } = args;
    
    if (!supabase_url || !supabase_key) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(supabase_url, supabase_key);
    
    // Test connection
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .limit(1);

    if (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully connected to Supabase! Found ${data?.length || 0} portfolio records.`,
        },
      ],
    };
  }

  async getPortfolioData(args) {
    const { user_id = 'default' } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get portfolio: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data || { user_id, balance: 50000, total_pnl: 0 }, null, 2),
        },
      ],
    };
  }

  async saveTrade(args) {
    const { trade_data } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('trades')
      .insert([trade_data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save trade: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Trade saved successfully! Trade ID: ${data.id}`,
        },
      ],
    };
  }

  async updateBalance(args) {
    const { user_id, new_balance, total_pnl } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('portfolios')
      .upsert({
        user_id,
        balance: new_balance,
        total_pnl,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update balance: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Balance updated! New balance: $${new_balance}, Total P&L: $${total_pnl}`,
        },
      ],
    };
  }

  async getTradingHistory(args) {
    const { user_id, limit = 50 } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('trades')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get trading history: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data || [], null, 2),
        },
      ],
    };
  }

  async saveAIAnalysis(args) {
    const { analysis_data } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('ai_analyses')
      .insert([analysis_data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save AI analysis: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ AI analysis saved! Analysis ID: ${data.id}`,
        },
      ],
    };
  }

  async getPositions(args) {
    const { user_id } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('positions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'open');

    if (error) {
      throw new Error(`Failed to get positions: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data || [], null, 2),
        },
      ],
    };
  }

  async updatePosition(args) {
    const { position_data } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('positions')
      .upsert([position_data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update position: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Position updated! Position ID: ${data.id}`,
        },
      ],
    };
  }

  async getMarketData(args) {
    const { symbol, timeframe = '1h' } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Failed to get market data: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data || [], null, 2),
        },
      ],
    };
  }

  async saveMarketData(args) {
    const { market_data } = args;
    
    if (!this.supabase) {
      throw new Error('Supabase connection not initialized');
    }

    const { data, error } = await this.supabase
      .from('market_data')
      .insert([market_data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save market data: ${error.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Market data saved! Data ID: ${data.id}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP Server running on stdio');
  }
}

const server = new SupabaseServer();
server.run().catch(console.error); 