import { TradingBotContext } from '../types';
import { formatters } from '../utils/formatters';
import { toggleTrading, getTradingStatus, getPositions } from '../services/trading-service';

/**
 * Control command handler - Pause/Resume trading operations
 * Mobile-optimized with safety confirmations and status updates
 */
export async function controlHandler(ctx: TradingBotContext, command: string): Promise<void> {
  try {
    const isPauseCommand = command === 'pause';
    const action = isPauseCommand ? 'pause' : 'resume';
    
    // Get current trading status
    const currentStatus = await getTradingStatus(ctx.user?.id);
    
    // Check if action is already in the desired state
    if ((isPauseCommand && !currentStatus.isActive) || (!isPauseCommand && currentStatus.isActive)) {
      const statusText = isPauseCommand ? 'already paused' : 'already active';
      await ctx.reply(`ℹ️ Trading is ${statusText}.`, {
        reply_markup: {
          inline_keyboard: [[
            { text: '📊 View Status', callback_data: 'view_current_status' },
            { text: '⚙️ Settings', callback_data: 'open_settings' }
          ]]
        }
      });
      return;
    }

    // Show confirmation message with current state
    await showControlConfirmation(ctx, action, currentStatus);

  } catch (error) {
    console.error('Control handler error:', error);
    await ctx.reply('❌ Failed to process trading control command. Please try again.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: `control_${command}` },
          { text: '📞 Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Show control confirmation with safety checks
 */
async function showControlConfirmation(ctx: TradingBotContext, action: string, currentStatus: any): Promise<void> {
  const isPause = action === 'pause';
  const positions = await getPositions(ctx.user?.id);
  
  let confirmationMessage: string;
  let confirmationButtons: any[][];

  if (isPause) {
    confirmationMessage = `
⏸️ <b>Pause Trading Confirmation</b>

<b>⚠️ Current Status:</b>
• Trading: <b>ACTIVE</b>
• Active Positions: <b>${positions.length}</b>
• Active Strategies: <b>${currentStatus.strategies.filter((s: any) => s.status === 'ACTIVE').length}</b>

<b>🛑 What will happen:</b>
• All new trades will be blocked
• Existing positions will remain open
• Stop losses and take profits will still work
• Risk management will continue monitoring
• You can resume trading anytime

<b>💡 Recommendation:</b>
Consider closing risky positions before pausing if you expect high volatility.`;

    confirmationButtons = [
      [
        { text: '⏸️ Confirm Pause', callback_data: 'confirm_pause_trading' },
        { text: '❌ Cancel', callback_data: 'cancel_control_action' }
      ]
    ];

    if (positions.length > 0) {
      confirmationButtons.unshift([
        { text: '📊 Review Positions First', callback_data: 'review_positions_before_pause' }
      ]);
    }

  } else {
    confirmationMessage = `
▶️ <b>Resume Trading Confirmation</b>

<b>⚠️ Current Status:</b>
• Trading: <b>PAUSED</b>
• Dormant Positions: <b>${positions.length}</b>
• Available Strategies: <b>${currentStatus.strategies.length}</b>

<b>🚀 What will happen:</b>
• All strategies will become active
• New trade signals will be processed
• AI analysis will resume full operations
• Risk limits will be enforced
• Automatic position management resumes

<b>💡 Safety Check:</b>
Ensure your risk settings are appropriate for current market conditions.`;

    confirmationButtons = [
      [
        { text: '▶️ Confirm Resume', callback_data: 'confirm_resume_trading' },
        { text: '❌ Cancel', callback_data: 'cancel_control_action' }
      ],
      [
        { text: '⚙️ Check Settings First', callback_data: 'check_settings_before_resume' }
      ]
    ];
  }

  await ctx.reply(confirmationMessage, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: confirmationButtons }
  });
}

/**
 * Handle pause trading confirmation
 */
export async function handleConfirmPause(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('⏸️ Pausing trading...');
  
  try {
    // Show processing message
    await ctx.editMessageText('⏸️ <b>Pausing Trading Operations...</b>\n\n⏳ Please wait while we safely pause all trading activities.', {
      parse_mode: 'HTML'
    });

    // Execute pause
    const success = await toggleTrading(ctx.user?.id || '', false);
    
    if (success) {
      const positions = await getPositions(ctx.user?.id);
      const pauseSuccessMessage = `
✅ <b>Trading Successfully Paused</b>

🛑 <b>Current Status:</b>
• Trading: <b>PAUSED</b>
• New trades: <b>BLOCKED</b>
• Active positions: <b>${positions.length} (still monitored)</b>
• Risk management: <b>ACTIVE</b>

<b>📱 Next Steps:</b>
• Monitor your existing positions
• Adjust risk settings if needed
• Resume when ready to trade again

<b>⏰ Paused at:</b> ${new Date().toLocaleString()}`;

      await ctx.editMessageText(pauseSuccessMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 View Positions', callback_data: 'view_paused_positions' },
              { text: '⚠️ Risk Status', callback_data: 'view_risk_status' }
            ],
            [
              { text: '▶️ Resume Trading', callback_data: 'control_resume' },
              { text: '⚙️ Adjust Settings', callback_data: 'open_settings' }
            ],
            [
              { text: '📊 Main Status', callback_data: 'back_to_status' }
            ]
          ]
        }
      });

      // Send notification about pause
      await sendPauseNotification(ctx);

    } else {
      throw new Error('Failed to pause trading');
    }

  } catch (error) {
    console.error('Pause confirmation error:', error);
    await ctx.editMessageText('❌ <b>Failed to Pause Trading</b>\n\nThere was an error pausing your trading operations. Please try again or contact support.', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Try Again', callback_data: 'confirm_pause_trading' },
          { text: '📞 Contact Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Handle resume trading confirmation
 */
export async function handleConfirmResume(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('▶️ Resuming trading...');
  
  try {
    // Show processing message
    await ctx.editMessageText('▶️ <b>Resuming Trading Operations...</b>\n\n⏳ Please wait while we activate all trading systems.', {
      parse_mode: 'HTML'
    });

    // Execute resume
    const success = await toggleTrading(ctx.user?.id || '', true);
    
    if (success) {
      const statusData = await getTradingStatus(ctx.user?.id);
      const resumeSuccessMessage = `
✅ <b>Trading Successfully Resumed</b>

🚀 <b>Current Status:</b>
• Trading: <b>ACTIVE</b>
• New trades: <b>ENABLED</b>
• Active strategies: <b>${statusData.strategies.filter((s: any) => s.status === 'ACTIVE').length}</b>
• AI analysis: <b>RUNNING</b>

<b>📱 What's Happening Now:</b>
• Scanning for new opportunities
• Monitoring existing positions
• Risk management active
• Ready to execute trades

<b>⏰ Resumed at:</b> ${new Date().toLocaleString()}`;

      await ctx.editMessageText(resumeSuccessMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Live Status', callback_data: 'view_live_status' },
              { text: '🎯 Active Strategies', callback_data: 'view_strategies' }
            ],
            [
              { text: '⏸️ Pause Trading', callback_data: 'control_pause' },
              { text: '⚙️ Trading Settings', callback_data: 'open_settings' }
            ],
            [
              { text: '📊 Main Dashboard', callback_data: 'back_to_status' }
            ]
          ]
        }
      });

      // Send notification about resume
      await sendResumeNotification(ctx);

    } else {
      throw new Error('Failed to resume trading');
    }

  } catch (error) {
    console.error('Resume confirmation error:', error);
    await ctx.editMessageText('❌ <b>Failed to Resume Trading</b>\n\nThere was an error resuming your trading operations. Please try again or contact support.', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Try Again', callback_data: 'confirm_resume_trading' },
          { text: '📞 Contact Support', callback_data: 'contact_support' }
        ]]
      }
    });
  }
}

/**
 * Handle review positions before pause
 */
export async function handleReviewPositionsBeforePause(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('📊 Loading positions...');
  
  try {
    const positions = await getPositions(ctx.user?.id);
    const reviewMessage = formatPositionsForReview(positions);
    
    await ctx.editMessageText(reviewMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ Close All Positions', callback_data: 'close_all_positions' },
            { text: '❌ Close Losing Only', callback_data: 'close_losing_positions' }
          ],
          [
            { text: '🎯 Adjust Stop Losses', callback_data: 'adjust_stop_losses' },
            { text: '💰 Adjust Take Profits', callback_data: 'adjust_take_profits' }
          ],
          [
            { text: '⏸️ Pause With Positions', callback_data: 'confirm_pause_trading' }
          ],
          [
            { text: '⬅️ Back', callback_data: 'control_pause' }
          ]
        ]
      }
    });

  } catch (error) {
    await ctx.editMessageText('❌ Failed to load positions for review.', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔄 Retry', callback_data: 'review_positions_before_pause' },
          { text: '⬅️ Back', callback_data: 'control_pause' }
        ]]
      }
    });
  }
}

/**
 * Handle cancel control action
 */
export async function handleCancelControlAction(ctx: TradingBotContext): Promise<void> {
  await ctx.answerCbQuery('Operation cancelled');
  
  await ctx.editMessageText('❌ <b>Operation Cancelled</b>\n\nNo changes have been made to your trading status.', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '📊 View Status', callback_data: 'back_to_status' },
        { text: '⚙️ Settings', callback_data: 'open_settings' }
      ]]
    }
  });
}

// Helper functions

function formatPositionsForReview(positions: any[]): string {
  if (positions.length === 0) {
    return '📊 <b>Position Review</b>\n\n📭 No active positions to review.\n\nYou can safely pause trading.';
  }

  let message = `📊 <b>Position Review Before Pause</b>\n\n<b>⚠️ You have ${positions.length} active position${positions.length > 1 ? 's' : ''}:</b>\n`;
  
  let totalPnL = 0;
  let profitableCount = 0;
  let losingCount = 0;

  positions.forEach(pos => {
    const pnlEmoji = pos.unrealizedPnL >= 0 ? '🟢' : '🔴';
    const sideEmoji = pos.side === 'LONG' ? '📈' : '📉';
    
    message += `\n${pnlEmoji}${sideEmoji} <b>${pos.symbol}</b>`;
    message += `\n   P&L: ${formatters.formatCurrency(pos.unrealizedPnL)} (${formatters.formatPercentage(pos.unrealizedPnLPercentage)})`;
    message += `\n   Size: ${pos.size} @ ${formatters.formatCurrency(pos.entryPrice)}`;
    
    if (pos.stopLoss) message += `\n   🛑 SL: ${formatters.formatCurrency(pos.stopLoss)}`;
    if (pos.takeProfit) message += `\n   🎯 TP: ${formatters.formatCurrency(pos.takeProfit)}`;
    
    message += '\n';
    
    totalPnL += pos.unrealizedPnL;
    if (pos.unrealizedPnL >= 0) profitableCount++;
    else losingCount++;
  });

  const totalEmoji = totalPnL >= 0 ? '🟢' : '🔴';
  message += `\n${totalEmoji} <b>Total Unrealized P&L:</b> ${formatters.formatCurrency(totalPnL)}`;
  message += `\n📊 <b>Summary:</b> ${profitableCount} profitable, ${losingCount} losing`;
  
  return message.trim();
}

async function sendPauseNotification(ctx: TradingBotContext): Promise<void> {
  // In a real implementation, this would send notifications to other channels
  // or update external systems about the pause status
  console.log(`Trading paused for user ${ctx.user?.id} at ${new Date().toISOString()}`);
}

async function sendResumeNotification(ctx: TradingBotContext): Promise<void> {
  // In a real implementation, this would send notifications to other channels
  // or update external systems about the resume status
  console.log(`Trading resumed for user ${ctx.user?.id} at ${new Date().toISOString()}`);
}