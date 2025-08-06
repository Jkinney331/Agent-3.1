import { TradingBotContext, StatusDisplay } from '../types';
import { formatters } from '../utils/formatters';
import { getTradingStatus, getPositions, getAIAnalysis } from '../services/trading-service';

/**
 * Status command handler - Real-time trading status display
 * Mobile-optimized with interactive elements and live updates
 */
export async function statusHandler(ctx: TradingBotContext): Promise<void> {
  try {
    // Show loading message
    const loadingMsg = await ctx.reply('📊 Loading trading status...', {
      reply_markup: { inline_keyboard: [[{ text: '⏳ Loading...', callback_data: 'loading' }]] }
    });

    // Fetch real-time status data
    const [statusData, positions, aiAnalysis] = await Promise.all([
      getTradingStatus(ctx.user?.id),
      getPositions(ctx.user?.id),
      getAIAnalysis()
    ]);

    // Build comprehensive status display
    const statusDisplay: StatusDisplay = {
      overview: {
        tradingStatus: statusData.isActive ? 'ACTIVE' : 'PAUSED',
        totalPositions: positions.length,
        totalPnL: positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
        totalPnLPercentage: calculateTotalPnLPercentage(positions),
        dayPnL: statusData.dayPnL || 0,
        dayPnLPercentage: statusData.dayPnLPercentage || 0
      },
      activeStrategies: statusData.strategies || [],
      marketConditions: {
        regime: aiAnalysis.marketRegime,
        sentiment: aiAnalysis.sentiment,
        volatility: getVolatilityLevel(aiAnalysis.confidence),
        recommendation: aiAnalysis.nextAction
      },
      lastUpdated: new Date()
    };

    // Format and send status message
    const statusMessage = formatters.formatStatusDisplay(statusDisplay);
    
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      loadingMsg.message_id,
      undefined,
      statusMessage,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Refresh', callback_data: 'status_refresh' },
              { text: '📊 Positions', callback_data: 'status_positions' }
            ],
            [
              { text: '💰 Balance', callback_data: 'status_balance' },
              { text: '⚠️ Risk', callback_data: 'status_risk' }
            ],
            [
              { text: '🤖 AI Insights', callback_data: 'status_ai' },
              { text: '📈 Charts', callback_data: 'status_charts' }
            ],
            [
              { text: statusData.isActive ? '⏸️ Pause Trading' : '▶️ Resume Trading', 
                callback_data: statusData.isActive ? 'trading_pause' : 'trading_resume' }
            ],
            [
              { text: '📱 Share Status', callback_data: 'status_share' },
              { text: '⚙️ Settings', callback_data: 'open_settings' }
            ]
          ]
        }
      }
    );

    // Update session
    ctx.session.currentCommand = 'status';
    ctx.session.lastMessageId = loadingMsg.message_id;

    // Schedule auto-refresh if enabled
    if (ctx.user?.settings?.display?.autoRefresh) {
      scheduleAutoRefresh(ctx, loadingMsg.message_id);
    }

  } catch (error) {
    console.error('Status handler error:', error);
    await ctx.reply('❌ Failed to load trading status. Please try again.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'status_retry' },
          { text: '📞 Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Handle status refresh callback
 */
export async function handleStatusRefresh(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🔄 Refreshing status...');
  
  // Update the loading indicator
  await ctx.editMessageText('📊 Refreshing trading status...', {
    reply_markup: { inline_keyboard: [[{ text: '⏳ Loading...', callback_data: 'loading' }]] }
  });

  // Re-run status handler
  await statusHandler(ctx);
}

/**
 * Handle positions view callback
 */
export async function handleStatusPositions(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📊 Loading positions...');
  
  try {
    const positions = await getPositions(ctx.user?.id);
    const positionsMessage = formatters.formatPositions(positions);
    
    await ctx.editMessageText(positionsMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Position Details', callback_data: 'positions_details' },
            { text: '📈 P&L History', callback_data: 'positions_history' }
          ],
          [
            { text: '🎯 Set Stop Loss', callback_data: 'positions_set_sl' },
            { text: '💰 Set Take Profit', callback_data: 'positions_set_tp' }
          ],
          [
            { text: '❌ Close Position', callback_data: 'positions_close' }
          ],
          [
            { text: '⬅️ Back to Status', callback_data: 'back_to_status' }
          ]
        ]
      }
    });

  } catch (error) {
    await ctx.editMessageText('❌ Failed to load positions.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'status_positions' },
          { text: '⬅️ Back', callback_data: 'back_to_status' }
        ]]
      }
    });
  }
}

/**
 * Handle AI insights callback
 */
export async function handleStatusAI(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('🤖 Loading AI insights...');
  
  try {
    const aiAnalysis = await getAIAnalysis();
    const aiMessage = formatAIInsights(aiAnalysis);
    
    await ctx.editMessageText(aiMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Market Analysis', callback_data: 'ai_market' },
            { text: '🎯 Trade Signals', callback_data: 'ai_signals' }
          ],
          [
            { text: '⚠️ Risk Assessment', callback_data: 'ai_risk' },
            { text: '💡 Recommendations', callback_data: 'ai_recommendations' }
          ],
          [
            { text: '🔄 Refresh Analysis', callback_data: 'ai_refresh' }
          ],
          [
            { text: '⬅️ Back to Status', callback_data: 'back_to_status' }
          ]
        ]
      }
    });

  } catch (error) {
    await ctx.editMessageText('❌ Failed to load AI insights.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'status_ai' },
          { text: '⬅️ Back', callback_data: 'back_to_status' }
        ]]
      }
    });
  }
}

/**
 * Handle status share callback
 */
export async function handleStatusShare(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📱 Preparing status share...');
  
  try {
    const statusData = await getTradingStatus(ctx.user?.id);
    const positions = await getPositions(ctx.user?.id);
    
    // Create anonymized status for sharing
    const shareMessage = createShareableStatus(statusData, positions);
    
    await ctx.editMessageText(shareMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📤 Share Public', callback_data: 'share_public' },
            { text: '👥 Share Private', callback_data: 'share_private' }
          ],
          [
            { text: '📊 Generate Image', callback_data: 'share_image' }
          ],
          [
            { text: '⬅️ Back to Status', callback_data: 'back_to_status' }
          ]
        ]
      }
    });

  } catch (error) {
    await ctx.editMessageText('❌ Failed to prepare status share.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'status_share' },
          { text: '⬅️ Back', callback_data: 'back_to_status' }
        ]]
      }
    });
  }
}

/**
 * Handle back to status callback
 */
export async function handleBackToStatus(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery();
  await statusHandler(ctx);
}

// Helper functions

function calculateTotalPnLPercentage(positions: any[]): number {
  if (positions.length === 0) return 0;
  
  const totalInvested = positions.reduce((sum, pos) => sum + (pos.size * pos.entryPrice), 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  
  return totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
}

function getVolatilityLevel(confidence: number): string {
  if (confidence > 0.8) return 'LOW';
  if (confidence > 0.6) return 'MEDIUM';
  if (confidence > 0.4) return 'HIGH';
  return 'EXTREME';
}

function formatAIInsights(aiAnalysis: any): string {
  return `
🤖 <b>AI Market Insights</b>

🎯 <b>Current Analysis:</b>
• Market Regime: <b>${aiAnalysis.marketRegime}</b>
• Confidence: <b>${(aiAnalysis.confidence * 100).toFixed(1)}%</b>
• Sentiment Score: <b>${aiAnalysis.sentiment.toFixed(2)}</b>
• Fear & Greed: <b>${aiAnalysis.fearGreedIndex}/100</b>

💡 <b>Recommendation:</b>
<b>${aiAnalysis.nextAction}</b>
${aiAnalysis.recommendedSymbol ? `Symbol: ${aiAnalysis.recommendedSymbol}` : ''}
${aiAnalysis.entryPrice ? `Entry: $${aiAnalysis.entryPrice}` : ''}
${aiAnalysis.targetPrice ? `Target: $${aiAnalysis.targetPrice}` : ''}

🧠 <b>AI Reasoning:</b>
${aiAnalysis.reasoning.slice(0, 3).map((reason: string) => `• ${reason}`).join('\n')}

🕐 <i>Updated: ${formatters.formatTime(aiAnalysis.lastUpdated)}</i>`;
}

function createShareableStatus(statusData: any, positions: any[]): string {
  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const totalPnLPercentage = calculateTotalPnLPercentage(positions);
  
  return `
📊 <b>My Trading Performance</b>

🎯 <b>Status:</b> ${statusData.isActive ? 'Active' : 'Paused'}
📈 <b>Total P&L:</b> ${totalPnL >= 0 ? '+' : ''}${totalPnLPercentage.toFixed(2)}%
📊 <b>Active Positions:</b> ${positions.length}
🤖 <b>AI-Powered:</b> Smart Trading Bot

<i>Powered by AI Crypto Trading Bot</i>
<i>Start your journey: t.me/YourBotUsername</i>`;
}

function scheduleAutoRefresh(ctx: TradingBotContext, messageId: number): void {
  // Schedule refresh in 30 seconds
  setTimeout(async () => {
    try {
      if (ctx.session.currentCommand === 'status' && ctx.session.lastMessageId === messageId) {
        await handleStatusRefresh(ctx);
      }
    } catch (error) {
      console.error('Auto-refresh error:', error);
    }
  }, 30000);
}