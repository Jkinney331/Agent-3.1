import { TradingBotContext, BalanceDisplay } from '../types';
import { formatters } from '../utils/formatters';
import { getPortfolioData, getPositions } from '../services/trading-service';

/**
 * Balance command handler - Portfolio balance and performance overview
 * Mobile-optimized display with interactive performance analytics
 */
export async function balanceHandler(ctx: TradingBotContext): Promise<void> {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('💰 Loading portfolio balance...', {
      reply_markup: { inline_keyboard: [[{ text: '⏳ Loading...', callback_data: 'loading' }]] }
    });

    // Fetch portfolio data
    const [portfolioData, positions] = await Promise.all([
      getPortfolioData(ctx.user?.id),
      getPositions(ctx.user?.id)
    ]);

    // Calculate performance metrics
    const performanceMetrics = await calculatePerformanceMetrics(ctx.user?.id);
    
    // Build balance display
    const balanceDisplay: BalanceDisplay = {
      ...portfolioData,
      breakdown: {
        cash: portfolioData.availableBalance,
        positions: portfolioData.totalPositionsValue,
        margin: portfolioData.marginUsed
      },
      performance: performanceMetrics,
      topPositions: getTopPositions(positions)
    };

    // Format and send balance message
    const balanceMessage = formatters.formatBalanceDisplay(balanceDisplay);
    
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      loadingMsg.message_id,
      undefined,
      balanceMessage,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'balance_refresh' },
              { text: '📊 Detailed Breakdown', callback_data: 'balance_breakdown' }
            ],
            [
              { text: '📈 Performance Chart', callback_data: 'balance_chart' },
              { text: '📊 Asset Allocation', callback_data: 'balance_allocation' }
            ],
            [
              { text: '💰 Deposit', callback_data: 'balance_deposit' },
              { text: '💸 Withdraw', callback_data: 'balance_withdraw' }
            ],
            [
              { text: '📄 Export Report', callback_data: 'balance_export' },
              { text: '📱 Share Performance', callback_data: 'balance_share' }
            ],
            [
              { text: '⚠️ Risk Analysis', callback_data: 'balance_risk' },
              { text: '📊 Back to Status', callback_data: 'back_to_status' }
            ]
          ]
        }
      }
    );

    // Update session
    ctx.session.currentCommand = 'balance';
    ctx.session.lastMessageId = loadingMsg.message_id;

  } catch (error) {
    console.error('Balance handler error:', error);
    await ctx.reply('❌ Failed to load portfolio balance. Please try again.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'balance_retry' },
          { text: '📞 Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Handle balance refresh callback
 */
export async function handleBalanceRefresh(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🔄 Refreshing balance...');
  
  await ctx.editMessageText('💰 Refreshing portfolio balance...', {
    reply_markup: { inline_keyboard: [[{ text: '⏳ Loading...', callback_data: 'loading' }]] }
  });

  await balanceHandler(ctx);
}

/**
 * Handle detailed breakdown callback
 */
export async function handleBalanceBreakdown(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📊 Loading detailed breakdown...');
  
  try {
    const portfolioData = await getPortfolioData(ctx.user?.id);
    const positions = await getPositions(ctx.user?.id);
    
    const breakdownMessage = formatDetailedBreakdown(portfolioData, positions);
    
    await ctx.editMessageText(breakdownMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 By Asset', callback_data: 'breakdown_asset' },
            { text: '📊 By Strategy', callback_data: 'breakdown_strategy' }
          ],
          [
            { text: '⏰ By Time Period', callback_data: 'breakdown_time' },
            { text: '🎯 By Risk Level', callback_data: 'breakdown_risk' }
          ],
          [
            { text: '📈 P&L Analysis', callback_data: 'breakdown_pnl' }
          ],
          [
            { text: '⬅️ Back to Balance', callback_data: 'back_to_balance' }
          ]
        ]
      }
    });

  } catch (error) {
    await ctx.editMessageText('❌ Failed to load detailed breakdown.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'balance_breakdown' },
          { text: '⬅️ Back', callback_data: 'back_to_balance' }
        ]]
      }
    });
  }
}

/**
 * Handle performance chart callback
 */
export async function handleBalanceChart(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📈 Generating performance chart...');
  
  try {
    // Generate chart options
    const chartMessage = `
📈 <b>Performance Chart Options</b>

Select the time period and chart type for your performance visualization:

<b>📊 Available Charts:</b>
• Portfolio Value Over Time
• Daily P&L Distribution  
• Asset Allocation Pie Chart
• Drawdown Analysis
• Risk-Return Scatter Plot

<b>⏰ Time Periods:</b>
• Last 24 Hours
• Last 7 Days
• Last 30 Days
• Last 90 Days
• All Time`;

    await ctx.editMessageText(chartMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Portfolio Value', callback_data: 'chart_portfolio' },
            { text: '💰 Daily P&L', callback_data: 'chart_pnl' }
          ],
          [
            { text: '🥧 Asset Allocation', callback_data: 'chart_allocation' },
            { text: '📉 Drawdown', callback_data: 'chart_drawdown' }
          ],
          [
            { text: '🎯 Risk-Return', callback_data: 'chart_risk_return' }
          ],
          [
            { text: '⬅️ Back to Balance', callback_data: 'back_to_balance' }
          ]
        ]
      }
    });

  } catch (error) {
    await ctx.editMessageText('❌ Failed to load chart options.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'balance_chart' },
          { text: '⬅️ Back', callback_data: 'back_to_balance' }
        ]]
      }
    });
  }
}

/**
 * Handle deposit callback
 */
export async function handleBalanceDeposit(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('💰 Loading deposit options...');
  
  const depositMessage = `
💰 <b>Deposit Funds</b>

<b>🔐 Secure Deposit Methods:</b>

<b>📱 Instant Deposits:</b>
• Bank Transfer (ACH) - Free, 1-2 business days
• Wire Transfer - $25 fee, Same day
• Crypto Transfer - Network fees apply

<b>💳 Card Deposits:</b>
• Debit Card - 1.5% fee, Instant
• Credit Card - 3% fee, Instant

<b>⚡ Quick Amounts:</b>
Select a preset amount or enter custom amount:`;

  await ctx.editMessageText(depositMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💵 $100', callback_data: 'deposit_100' },
          { text: '💵 $500', callback_data: 'deposit_500' },
          { text: '💵 $1000', callback_data: 'deposit_1000' }
        ],
        [
          { text: '💵 $5000', callback_data: 'deposit_5000' },
          { text: '💵 $10000', callback_data: 'deposit_10000' }
        ],
        [
          { text: '💰 Custom Amount', callback_data: 'deposit_custom' }
        ],
        [
          { text: '🏦 Bank Transfer', callback_data: 'deposit_bank' },
          { text: '₿ Crypto Transfer', callback_data: 'deposit_crypto' }
        ],
        [
          { text: '⬅️ Back to Balance', callback_data: 'back_to_balance' }
        ]
      ]
    }
  });
}

/**
 * Handle withdraw callback
 */
export async function handleBalanceWithdraw(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('💸 Loading withdrawal options...');
  
  const portfolioData = await getPortfolioData(ctx.user?.id);
  const availableBalance = portfolioData.availableBalance;
  
  const withdrawMessage = `
💸 <b>Withdraw Funds</b>

💰 <b>Available Balance:</b> ${formatters.formatCurrency(availableBalance)}

<b>📤 Withdrawal Methods:</b>
• Bank Transfer (ACH) - Free, 1-2 business days
• Wire Transfer - $25 fee, Same day
• Crypto Transfer - Network fees apply

<b>⚡ Quick Amounts:</b>
Select a preset amount or enter custom amount:

<b>⚠️ Important:</b>
• Minimum withdrawal: $50
• Daily limit: $25,000
• Active positions may affect available balance`;

  const maxQuickWithdraw = Math.min(availableBalance, 10000);
  const quickAmounts = [100, 500, 1000, 5000].filter(amount => amount <= maxQuickWithdraw);

  const keyboard = quickAmounts.map(amount => ({ 
    text: `💵 $${amount}`, 
    callback_data: `withdraw_${amount}` 
  }));

  // Split into rows of 2
  const keyboardRows = [];
  for (let i = 0; i < keyboard.length; i += 2) {
    keyboardRows.push(keyboard.slice(i, i + 2));
  }

  keyboardRows.push([{ text: '💸 Custom Amount', callback_data: 'withdraw_custom' }]);
  keyboardRows.push([
    { text: '🏦 Bank Transfer', callback_data: 'withdraw_bank' },
    { text: '₿ Crypto Transfer', callback_data: 'withdraw_crypto' }
  ]);
  keyboardRows.push([{ text: '⬅️ Back to Balance', callback_data: 'back_to_balance' }]);

  await ctx.editMessageText(withdrawMessage, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboardRows }
  });
}

/**
 * Handle export report callback
 */
export async function handleBalanceExport(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📄 Preparing export options...');
  
  const exportMessage = `
📄 <b>Export Portfolio Report</b>

<b>📊 Available Reports:</b>
• Complete Portfolio Summary
• Transaction History
• Performance Analytics
• Tax Report (Gains/Losses)
• Risk Analysis Report

<b>📅 Time Periods:</b>
• Last 7 Days
• Last 30 Days
• Last 90 Days
• Year to Date
• All Time

<b>📁 Export Formats:</b>
• PDF Report (Recommended)
• Excel Spreadsheet
• CSV Data
• JSON Raw Data`;

  await ctx.editMessageText(exportMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Portfolio Summary', callback_data: 'export_summary' },
          { text: '💰 Transaction History', callback_data: 'export_transactions' }
        ],
        [
          { text: '📈 Performance Report', callback_data: 'export_performance' },
          { text: '🧾 Tax Report', callback_data: 'export_tax' }
        ],
        [
          { text: '⚠️ Risk Analysis', callback_data: 'export_risk' }
        ],
        [
          { text: '⬅️ Back to Balance', callback_data: 'back_to_balance' }
        ]
      ]
    }
  });
}

/**
 * Handle back to balance callback
 */
export async function handleBackToBalance(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery();
  await balanceHandler(ctx);
}

// Helper functions

async function calculatePerformanceMetrics(userId?: string): Promise<any> {
  // This would integrate with your analytics service
  // Return mock data for now
  return {
    today: 1.28,
    week: 5.42,
    month: -2.15,
    year: 23.67
  };
}

function getTopPositions(positions: any[]): any[] {
  return positions
    .sort((a, b) => Math.abs(b.unrealizedPnL) - Math.abs(a.unrealizedPnL))
    .slice(0, 5)
    .map(pos => ({
      symbol: pos.symbol,
      value: pos.size * pos.currentPrice,
      pnl: pos.unrealizedPnL,
      pnlPercentage: pos.unrealizedPnLPercentage
    }));
}

function formatDetailedBreakdown(portfolioData: any, positions: any[]): string {
  const totalValue = portfolioData.totalEquity;
  const cashPercentage = (portfolioData.availableBalance / totalValue) * 100;
  const positionsPercentage = (portfolioData.totalPositionsValue / totalValue) * 100;
  
  let message = `
📊 <b>Detailed Portfolio Breakdown</b>

💰 <b>Total Portfolio Value:</b> ${formatters.formatCurrency(totalValue)}

<b>💵 Cash Holdings:</b>
• Amount: ${formatters.formatCurrency(portfolioData.availableBalance)}
• Percentage: ${cashPercentage.toFixed(1)}%
• Status: Available for trading

<b>📊 Active Positions:</b>
• Value: ${formatters.formatCurrency(portfolioData.totalPositionsValue)}
• Percentage: ${positionsPercentage.toFixed(1)}%
• Count: ${positions.length} positions

<b>💳 Margin Information:</b>
• Used: ${formatters.formatCurrency(portfolioData.marginUsed)}
• Available: ${formatters.formatCurrency(portfolioData.marginAvailable)}
• Utilization: ${((portfolioData.marginUsed / (portfolioData.marginUsed + portfolioData.marginAvailable)) * 100).toFixed(1)}%`;

  if (positions.length > 0) {
    message += '\n\n<b>🏆 Position Breakdown:</b>';
    positions.forEach(pos => {
      const positionValue = pos.size * pos.currentPrice;
      const positionPercentage = (positionValue / totalValue) * 100;
      const pnlEmoji = pos.unrealizedPnL >= 0 ? '🟢' : '🔴';
      
      message += `\n${pnlEmoji} ${pos.symbol}: ${positionPercentage.toFixed(1)}% (${formatters.formatCurrency(positionValue)})`;
    });
  }

  return message.trim();
}