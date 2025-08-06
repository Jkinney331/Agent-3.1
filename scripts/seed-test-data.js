#!/usr/bin/env node

/**
 * Test Data Seeding Script
 * Generates realistic market data, trading history, and user interactions
 */

const fs = require('fs').promises;
require('dotenv').config({ path: '.env.local' });

// Crypto symbols for realistic testing
const CRYPTO_SYMBOLS = [
  'BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'XRP-USD',
  'SOL-USD', 'DOT-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD'
];

// Trading strategies
const STRATEGIES = [
  'momentum', 'mean_reversion', 'breakout', 'scalping', 'swing_trading',
  'arbitrage', 'pairs_trading', 'news_based', 'technical_analysis'
];

// AI decision types
const DECISION_TYPES = [
  'buy_signal', 'sell_signal', 'hold_position', 'risk_assessment',
  'market_analysis', 'portfolio_rebalance', 'stop_loss_adjustment'
];

class TestDataGenerator {
  constructor() {
    this.db = null;
    this.accountId = null;
  }

  async initialize() {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      const { SQLiteClient } = await import('../lib/database/sqlite-client.js');
      this.db = SQLiteClient.getInstance();
      await this.db.connect();
    } else {
      const { createClient } = await import('../lib/database/supabase-client.js');
      this.db = createClient();
    }

    // Get demo account ID
    if (dbType === 'sqlite') {
      const account = await this.db.get(
        'SELECT id FROM trading_accounts WHERE user_id = ?',
        ['demo-user']
      );
      this.accountId = account?.id;
    } else {
      const { data } = await this.db
        .from('trading_accounts')
        .select('id')
        .eq('user_id', 'demo-user')
        .single();
      this.accountId = data?.id;
    }

    if (!this.accountId) {
      throw new Error('Demo account not found. Run setup-local-database.js first.');
    }
  }

  /**
   * Generate historical market data
   */
  async generateMarketData(days = 30) {
    console.log(`📈 Generating ${days} days of market data...`);
    
    const now = new Date();
    const marketData = [];

    for (const symbol of CRYPTO_SYMBOLS) {
      let basePrice = this.getRandomPrice(symbol);
      
      for (let day = days; day >= 0; day--) {
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(now.getTime() - (day * 24 + (23 - hour)) * 60 * 60 * 1000);
          
          // Generate realistic price movement
          const volatility = this.getVolatility(symbol);
          const change = (Math.random() - 0.5) * volatility;
          basePrice = basePrice * (1 + change);
          
          const high = basePrice * (1 + Math.random() * 0.02);
          const low = basePrice * (1 - Math.random() * 0.02);
          const open = low + Math.random() * (high - low);
          const close = low + Math.random() * (high - low);
          const volume = Math.random() * 1000000 + 100000;

          marketData.push({
            symbol,
            timeframe: '1h',
            open_price: open,
            high_price: high,
            low_price: low,
            close_price: close,
            volume,
            timestamp: timestamp.toISOString()
          });
        }
      }
    }

    // Insert market data
    await this.insertMarketData(marketData);
    console.log(`✅ Generated ${marketData.length} market data points`);
  }

  /**
   * Generate realistic trading history
   */
  async generateTradingHistory(numTrades = 50) {
    console.log(`💰 Generating ${numTrades} trading orders...`);
    
    const orders = [];
    const positions = [];
    let currentBalance = 50000;
    let totalPnL = 0;

    for (let i = 0; i < numTrades; i++) {
      const symbol = CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)];
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
      const price = this.getRandomPrice(symbol);
      const quantity = this.getRandomQuantity(symbol, price, currentBalance);
      const confidence = 0.6 + Math.random() * 0.4; // 60-100% confidence
      
      // Calculate fees (0.1% trading fee)
      const fees = price * quantity * 0.001;
      
      // Simulate some profit/loss
      const priceChange = (Math.random() - 0.45) * 0.1; // Slight bias toward profit
      const exitPrice = price * (1 + priceChange);
      const realizedPnL = side === 'buy' 
        ? (exitPrice - price) * quantity - fees
        : (price - exitPrice) * quantity - fees;
      
      totalPnL += realizedPnL;
      currentBalance += realizedPnL;

      const createdAt = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000));

      orders.push({
        account_id: this.accountId,
        order_id: `test-order-${i + 1000}`,
        symbol,
        side,
        quantity,
        price,
        order_type: 'market',
        status: 'filled',
        filled_quantity: quantity,
        filled_price: price,
        fees,
        strategy_used: strategy,
        reasoning: this.generateReasoning(side, symbol, strategy),
        ai_reasoning: this.generateAIReasoning(side, symbol, confidence),
        confidence_score: confidence,
        realized_pnl: realizedPnL,
        created_at: createdAt.toISOString(),
        filled_at: createdAt.toISOString()
      });

      // Create some current positions (30% of trades)
      if (Math.random() < 0.3 && side === 'buy') {
        const currentPrice = price * (1 + (Math.random() - 0.5) * 0.05);
        const unrealizedPnL = (currentPrice - price) * quantity;
        
        positions.push({
          account_id: this.accountId,
          symbol,
          side,
          quantity,
          entry_price: price,
          current_price: currentPrice,
          market_value: currentPrice * quantity,
          unrealized_pnl: unrealizedPnL,
          strategy_used: strategy,
          confidence_score: confidence,
          created_at: createdAt.toISOString()
        });
      }
    }

    await this.insertTradingOrders(orders);
    await this.insertTradingPositions(positions);
    
    console.log(`✅ Generated ${orders.length} trading orders and ${positions.length} positions`);
    console.log(`💵 Total P&L: $${totalPnL.toFixed(2)}`);
  }

  /**
   * Generate AI decision history
   */
  async generateAIDecisions(numDecisions = 100) {
    console.log(`🤖 Generating ${numDecisions} AI decisions...`);
    
    const decisions = [];

    for (let i = 0; i < numDecisions; i++) {
      const decisionType = DECISION_TYPES[Math.floor(Math.random() * DECISION_TYPES.length)];
      const symbol = Math.random() > 0.3 ? CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)] : null;
      const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
      const confidence = 0.5 + Math.random() * 0.5;
      
      const createdAt = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000));

      decisions.push({
        account_id: this.accountId,
        decision_type: decisionType,
        symbol,
        reasoning: this.generateDetailedReasoning(decisionType, symbol, strategy),
        market_data: JSON.stringify(this.generateMarketContext(symbol)),
        strategy_selected: strategy,
        confidence_score: confidence,
        action_taken: this.generateActionTaken(decisionType),
        outcome: this.generateOutcome(confidence),
        created_at: createdAt.toISOString()
      });
    }

    await this.insertAIDecisions(decisions);
    console.log(`✅ Generated ${decisions.length} AI decisions`);
  }

  /**
   * Generate performance metrics
   */
  async generatePerformanceMetrics(days = 30) {
    console.log(`📊 Generating ${days} days of performance metrics...`);
    
    const metrics = [];
    let balance = 50000;
    let totalReturn = 0;

    for (let day = days; day >= 0; day--) {
      const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      const dailyReturn = (Math.random() - 0.48) * 0.05; // Slight positive bias
      const previousBalance = balance;
      
      balance = balance * (1 + dailyReturn);
      const dailyPnL = balance - previousBalance;
      const dailyReturnPct = dailyReturn * 100;
      
      totalReturn += dailyReturn;

      // Generate some trading activity
      const totalTrades = Math.floor(Math.random() * 10);
      const winningTrades = Math.floor(totalTrades * (0.55 + Math.random() * 0.2)); // 55-75% win rate

      metrics.push({
        account_id: this.accountId,
        date: date.toISOString().split('T')[0],
        starting_balance: previousBalance,
        ending_balance: balance,
        daily_pnl: dailyPnL,
        daily_return_pct: dailyReturnPct,
        total_trades: totalTrades,
        winning_trades: winningTrades,
        max_drawdown: Math.min(0, totalReturn * -0.1),
        sharpe_ratio: this.calculateSharpeRatio(totalReturn, day),
        created_at: date.toISOString()
      });
    }

    await this.insertPerformanceMetrics(metrics);
    console.log(`✅ Generated ${metrics.length} performance records`);
    console.log(`📈 Final balance: $${balance.toFixed(2)} (${(totalReturn * 100).toFixed(2)}% return)`);
  }

  /**
   * Generate portfolio snapshots
   */
  async generatePortfolioSnapshots(count = 50) {
    console.log(`📸 Generating ${count} portfolio snapshots...`);
    
    const snapshots = [];
    let totalValue = 50000;

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      // Simulate portfolio changes
      const change = (Math.random() - 0.48) * 0.03;
      totalValue = totalValue * (1 + change);
      
      const cashBalance = totalValue * (0.2 + Math.random() * 0.3); // 20-50% in cash
      const positionsValue = totalValue - cashBalance;
      const unrealizedPnL = (Math.random() - 0.5) * positionsValue * 0.1;
      const realizedPnL = totalValue - 50000;
      const totalReturnPct = ((totalValue - 50000) / 50000) * 100;

      snapshots.push({
        account_id: this.accountId,
        total_value: totalValue,
        cash_balance: cashBalance,
        positions_value: positionsValue,
        unrealized_pnl: unrealizedPnL,
        realized_pnl: realizedPnL,
        total_return_pct: totalReturnPct,
        snapshot_data: JSON.stringify({
          positions_count: Math.floor(Math.random() * 8) + 2,
          top_performer: CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)],
          risk_score: Math.random() * 10,
          diversification_score: 6 + Math.random() * 4
        }),
        created_at: timestamp.toISOString()
      });
    }

    await this.insertPortfolioSnapshots(snapshots);
    console.log(`✅ Generated ${snapshots.length} portfolio snapshots`);
  }

  // Helper methods for database operations
  async insertMarketData(data) {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      for (const item of data) {
        await this.db.run(`
          INSERT OR REPLACE INTO market_data 
          (symbol, timeframe, open_price, high_price, low_price, close_price, volume, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.symbol, item.timeframe, item.open_price, item.high_price,
          item.low_price, item.close_price, item.volume, item.timestamp
        ]);
      }
    } else {
      const { error } = await this.db
        .from('market_data')
        .upsert(data, { onConflict: 'symbol,timeframe,timestamp' });
      
      if (error) throw error;
    }
  }

  async insertTradingOrders(orders) {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      for (const order of orders) {
        await this.db.run(`
          INSERT OR REPLACE INTO trading_orders 
          (account_id, order_id, symbol, side, quantity, price, order_type, status, 
           filled_quantity, filled_price, fees, strategy_used, reasoning, ai_reasoning, 
           confidence_score, realized_pnl, created_at, filled_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          order.account_id, order.order_id, order.symbol, order.side, order.quantity,
          order.price, order.order_type, order.status, order.filled_quantity,
          order.filled_price, order.fees, order.strategy_used, order.reasoning,
          order.ai_reasoning, order.confidence_score, order.realized_pnl,
          order.created_at, order.filled_at
        ]);
      }
    } else {
      const { error } = await this.db
        .from('trading_orders')
        .upsert(orders, { onConflict: 'order_id' });
      
      if (error) throw error;
    }
  }

  async insertTradingPositions(positions) {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      for (const position of positions) {
        await this.db.run(`
          INSERT OR REPLACE INTO trading_positions 
          (account_id, symbol, side, quantity, entry_price, current_price, 
           market_value, unrealized_pnl, strategy_used, confidence_score, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          position.account_id, position.symbol, position.side, position.quantity,
          position.entry_price, position.current_price, position.market_value,
          position.unrealized_pnl, position.strategy_used, position.confidence_score,
          position.created_at
        ]);
      }
    } else {
      const { error } = await this.db
        .from('trading_positions')
        .upsert(positions, { onConflict: 'account_id,symbol' });
      
      if (error) throw error;
    }
  }

  async insertAIDecisions(decisions) {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      for (const decision of decisions) {
        await this.db.run(`
          INSERT INTO ai_decisions 
          (account_id, decision_type, symbol, reasoning, market_data, strategy_selected, 
           confidence_score, action_taken, outcome, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          decision.account_id, decision.decision_type, decision.symbol, decision.reasoning,
          decision.market_data, decision.strategy_selected, decision.confidence_score,
          decision.action_taken, decision.outcome, decision.created_at
        ]);
      }
    } else {
      const { error } = await this.db
        .from('ai_decisions')
        .insert(decisions);
      
      if (error) throw error;
    }
  }

  async insertPerformanceMetrics(metrics) {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      for (const metric of metrics) {
        await this.db.run(`
          INSERT OR REPLACE INTO performance_metrics 
          (account_id, date, starting_balance, ending_balance, daily_pnl, daily_return_pct,
           total_trades, winning_trades, max_drawdown, sharpe_ratio, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          metric.account_id, metric.date, metric.starting_balance, metric.ending_balance,
          metric.daily_pnl, metric.daily_return_pct, metric.total_trades,
          metric.winning_trades, metric.max_drawdown, metric.sharpe_ratio, metric.created_at
        ]);
      }
    } else {
      const { error } = await this.db
        .from('performance_metrics')
        .upsert(metrics, { onConflict: 'account_id,date' });
      
      if (error) throw error;
    }
  }

  async insertPortfolioSnapshots(snapshots) {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      for (const snapshot of snapshots) {
        await this.db.run(`
          INSERT INTO portfolio_snapshots 
          (account_id, total_value, cash_balance, positions_value, unrealized_pnl,
           realized_pnl, total_return_pct, snapshot_data, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          snapshot.account_id, snapshot.total_value, snapshot.cash_balance,
          snapshot.positions_value, snapshot.unrealized_pnl, snapshot.realized_pnl,
          snapshot.total_return_pct, snapshot.snapshot_data, snapshot.created_at
        ]);
      }
    } else {
      const { error } = await this.db
        .from('portfolio_snapshots')
        .insert(snapshots);
      
      if (error) throw error;
    }
  }

  // Utility methods for generating realistic data
  getRandomPrice(symbol) {
    const basePrices = {
      'BTC-USD': 45000, 'ETH-USD': 3000, 'BNB-USD': 350, 'ADA-USD': 0.5,
      'XRP-USD': 0.6, 'SOL-USD': 100, 'DOT-USD': 7, 'DOGE-USD': 0.08,
      'AVAX-USD': 18, 'MATIC-USD': 0.9
    };
    
    const basePrice = basePrices[symbol] || 100;
    return basePrice * (0.8 + Math.random() * 0.4); // ±20% variation
  }

  getVolatility(symbol) {
    const volatilities = {
      'BTC-USD': 0.03, 'ETH-USD': 0.04, 'BNB-USD': 0.05, 'ADA-USD': 0.06,
      'XRP-USD': 0.06, 'SOL-USD': 0.07, 'DOT-USD': 0.06, 'DOGE-USD': 0.08,
      'AVAX-USD': 0.07, 'MATIC-USD': 0.08
    };
    
    return volatilities[symbol] || 0.05;
  }

  getRandomQuantity(symbol, price, balance) {
    const maxPosition = balance * 0.1; // Max 10% of balance per position
    const maxQuantity = maxPosition / price;
    return Math.random() * maxQuantity * 0.8; // Use up to 80% of max
  }

  generateReasoning(side, symbol, strategy) {
    const reasons = {
      buy: [
        `Strong ${strategy} signal detected for ${symbol}`,
        `Technical indicators show bullish momentum for ${symbol}`,
        `Market conditions favor long position in ${symbol}`,
        `${symbol} showing breakout pattern with ${strategy} confirmation`
      ],
      sell: [
        `Exit signal triggered for ${symbol} position`,
        `Risk management rules suggest closing ${symbol}`,
        `Technical analysis indicates ${symbol} resistance reached`,
        `${strategy} exit conditions met for ${symbol}`
      ]
    };
    
    const sideReasons = reasons[side] || reasons.buy;
    return sideReasons[Math.floor(Math.random() * sideReasons.length)];
  }

  generateAIReasoning(side, symbol, confidence) {
    const confidenceLevel = confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low';
    
    return `AI analysis with ${confidenceLevel} confidence (${(confidence * 100).toFixed(1)}%) ` +
           `recommends ${side} action for ${symbol} based on multi-factor analysis including ` +
           `technical indicators, market sentiment, and risk assessment.`;
  }

  generateDetailedReasoning(decisionType, symbol, strategy) {
    const reasoningTemplates = {
      buy_signal: `Advanced pattern recognition identified strong buy opportunity for ${symbol || 'portfolio'} using ${strategy} strategy. Multiple technical indicators align with bullish sentiment analysis.`,
      sell_signal: `Risk assessment algorithms triggered sell recommendation for ${symbol || 'portfolio'}. Market conditions and technical analysis suggest profit-taking opportunity.`,
      hold_position: `Current market analysis recommends maintaining positions in ${symbol || 'portfolio'}. Volatility levels and trend analysis support hold strategy.`,
      risk_assessment: `Comprehensive risk evaluation performed on ${symbol || 'portfolio'} positions. Risk-reward ratio and portfolio exposure analyzed using ${strategy} methodology.`,
      market_analysis: `Market-wide analysis completed using AI sentiment and technical analysis. Overall market conditions assessed for ${symbol || 'all positions'}.`,
      portfolio_rebalance: `Portfolio optimization algorithm suggests rebalancing ${symbol || 'positions'} to maintain target allocation and risk parameters.`,
      stop_loss_adjustment: `Dynamic stop-loss adjustment recommended for ${symbol || 'positions'} based on volatility analysis and ${strategy} rules.`
    };
    
    return reasoningTemplates[decisionType] || `AI decision analysis for ${decisionType}`;
  }

  generateMarketContext(symbol) {
    return {
      symbol: symbol || 'MARKET',
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 2,
      volume_ratio: 0.5 + Math.random(),
      sentiment_score: -1 + Math.random() * 2,
      support_level: this.getRandomPrice(symbol || 'BTC-USD') * 0.95,
      resistance_level: this.getRandomPrice(symbol || 'BTC-USD') * 1.05,
      trend: ['bullish', 'bearish', 'sideways'][Math.floor(Math.random() * 3)]
    };
  }

  generateActionTaken(decisionType) {
    const actions = {
      buy_signal: 'order_placed',
      sell_signal: 'position_closed',
      hold_position: 'no_action',
      risk_assessment: 'risk_calculated',
      market_analysis: 'analysis_complete',
      portfolio_rebalance: 'rebalance_executed',
      stop_loss_adjustment: 'stops_updated'
    };
    
    return actions[decisionType] || 'analysis_complete';
  }

  generateOutcome(confidence) {
    const random = Math.random();
    if (confidence > 0.8) {
      return random > 0.2 ? 'positive' : 'negative';
    } else if (confidence > 0.6) {
      return random > 0.4 ? 'positive' : 'negative';
    } else {
      return random > 0.5 ? 'positive' : 'negative';
    }
  }

  calculateSharpeRatio(totalReturn, days) {
    const annualizedReturn = totalReturn * (365 / days);
    const riskFreeRate = 0.02; // 2% risk-free rate
    const volatility = 0.15; // Assumed 15% volatility
    
    return (annualizedReturn - riskFreeRate) / volatility;
  }
}

// Main execution
async function main() {
  console.log('🌱 Starting test data generation...');
  
  try {
    const generator = new TestDataGenerator();
    await generator.initialize();
    
    // Generate all test data
    await generator.generateMarketData(30);
    await generator.generateTradingHistory(75);
    await generator.generateAIDecisions(150);
    await generator.generatePerformanceMetrics(30);
    await generator.generatePortfolioSnapshots(60);
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Generated data:');
    console.log('   • 30 days of market data for 10 crypto pairs');
    console.log('   • 75 realistic trading orders with P&L');
    console.log('   • 150 AI decision records');
    console.log('   • 30 days of performance metrics');
    console.log('   • 60 portfolio snapshots');
    
    console.log('\n🚀 Ready for testing! Run:');
    console.log('   • npm run dev (start development server)');
    console.log('   • npm run test:local (test complete system)');
    
  } catch (error) {
    console.error('\n❌ Test data generation failed:', error.message);
    console.log('\n🔧 Make sure to run setup-local-database.js first');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TestDataGenerator };