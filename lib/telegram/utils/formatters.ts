import { User } from 'telegraf/typings/core/types/typegram';
import { PortfolioData, Position, StatusDisplay, BalanceDisplay, RiskDisplay } from '../types';

/**
 * Message formatting utilities for mobile-optimized Telegram display
 * Handles emoji, HTML formatting, and responsive layout
 */
export class MessageFormatters {
  
  /**
   * Build welcome message for new users
   */
  buildWelcomeMessage(user: User): string {
    const firstName = user.first_name || 'Trader';
    const time = this.getTimeOfDay();
    
    return `
🚀 <b>Welcome${firstName ? ` ${firstName}` : ''}!</b> ${time}

🤖 I'm your <b>AI Crypto Trading Assistant</b> - your personal trading companion optimized for mobile trading.

<b>🎯 What I do for you:</b>
• 📊 Monitor markets 24/7
• 🤖 Execute smart trades automatically  
• ⚠️ Protect your capital with risk management
• 📱 Keep you updated in real-time
• 📈 Maximize your trading performance

<b>🔥 Key Features:</b>
• Lightning-fast mobile interface
• AI-powered market analysis
• Automated trading strategies
• Real-time portfolio tracking
• Advanced risk protection

Ready to start your trading journey?`;
  }

  /**
   * Build onboarding message for new users
   */
  buildOnboardingMessage(): string {
    return `
🎯 <b>Quick Setup Guide</b>

<b>Step 1:</b> 🔐 Connect your exchange account
<b>Step 2:</b> ⚙️ Configure your trading preferences  
<b>Step 3:</b> 🚀 Start automated trading!

<b>💡 Pro Tips:</b>
• Start with paper trading to test strategies
• Set conservative risk limits initially
• Monitor your first few trades closely
• Use our AI insights for better decisions

<b>🛡️ Security:</b> Your credentials are encrypted and never shared. We use bank-level security to protect your data.

Ready to begin? It only takes 2 minutes!`;
  }

  /**
   * Format portfolio status display
   */
  formatStatusDisplay(status: StatusDisplay): string {
    const { overview, activeStrategies, marketConditions } = status;
    
    const statusEmoji = this.getStatusEmoji(overview.tradingStatus);
    const pnlEmoji = overview.totalPnL >= 0 ? '📈' : '📉';
    const dayPnlEmoji = overview.dayPnL >= 0 ? '🟢' : '🔴';
    
    let message = `
📊 <b>Trading Status</b> ${statusEmoji}

💼 <b>Overview:</b>
• Status: <b>${overview.tradingStatus}</b>
• Positions: <b>${overview.totalPositions}</b>
${pnlEmoji} Total P&L: <b>${this.formatCurrency(overview.totalPnL)} (${this.formatPercentage(overview.totalPnLPercentage)})</b>
${dayPnlEmoji} Today: <b>${this.formatCurrency(overview.dayPnL)} (${this.formatPercentage(overview.dayPnLPercentage)})</b>

🤖 <b>Active Strategies:</b>`;

    activeStrategies.slice(0, 3).forEach(strategy => {
      const strategyEmoji = strategy.status === 'ACTIVE' ? '🟢' : '⏸️';
      message += `\n${strategyEmoji} ${strategy.name}: ${this.formatPercentage(strategy.performance)} (${strategy.positions} pos)`;
    });

    if (activeStrategies.length > 3) {
      message += `\n... and ${activeStrategies.length - 3} more`;
    }

    message += `

🌍 <b>Market Conditions:</b>
• Regime: <b>${marketConditions.regime}</b>
• Sentiment: ${this.formatSentiment(marketConditions.sentiment)}
• Volatility: <b>${marketConditions.volatility}</b>
• AI Rec: <b>${marketConditions.recommendation}</b>

🕐 <i>Updated: ${this.formatTime(status.lastUpdated)}</i>`;

    return message.trim();
  }

  /**
   * Format balance display
   */
  formatBalanceDisplay(balance: BalanceDisplay): string {
    const totalEmoji = balance.totalEquity >= balance.totalBalance ? '📈' : '📉';
    
    let message = `
💰 <b>Portfolio Balance</b>

${totalEmoji} <b>Total Equity:</b> ${this.formatCurrency(balance.totalEquity)}
💵 <b>Available:</b> ${this.formatCurrency(balance.availableBalance)}
📊 <b>In Positions:</b> ${this.formatCurrency(balance.totalPositionsValue)}

📊 <b>Breakdown:</b>
• Cash: ${this.formatCurrency(balance.breakdown.cash)}
• Positions: ${this.formatCurrency(balance.breakdown.positions)}
• Margin: ${this.formatCurrency(balance.breakdown.margin)}

📈 <b>Performance:</b>
• Today: ${this.formatPercentageChange(balance.performance.today)}
• Week: ${this.formatPercentageChange(balance.performance.week)}
• Month: ${this.formatPercentageChange(balance.performance.month)}
• Year: ${this.formatPercentageChange(balance.performance.year)}`;

    if (balance.topPositions.length > 0) {
      message += '\n\n🏆 <b>Top Positions:</b>';
      balance.topPositions.slice(0, 3).forEach(pos => {
        const emoji = pos.pnl >= 0 ? '🟢' : '🔴';
        message += `\n${emoji} ${pos.symbol}: ${this.formatCurrency(pos.value)} (${this.formatPercentage(pos.pnlPercentage)})`;
      });
    }

    message += `\n\n🕐 <i>Updated: ${this.formatTime(balance.lastUpdated)}</i>`;
    
    return message.trim();
  }

  /**
   * Format risk display
   */
  formatRiskDisplay(risk: RiskDisplay): string {
    const riskLevel = this.getRiskLevel(risk.portfolioDrawdown, risk.maxDrawdownLimit);
    const riskEmoji = this.getRiskEmoji(riskLevel);
    
    let message = `
⚠️ <b>Risk Management</b> ${riskEmoji}

🎯 <b>Current Risk Level:</b> <b>${riskLevel}</b>

📊 <b>Key Metrics:</b>
• Portfolio DD: ${this.formatPercentage(risk.portfolioDrawdown)}/${this.formatPercentage(risk.maxDrawdownLimit)}
• Daily P&L: ${this.formatCurrency(risk.dailyPnL)}/${this.formatCurrency(risk.dailyPnLLimit)}
• Leverage: ${risk.leverage.toFixed(2)}x/${risk.maxLeverage.toFixed(2)}x

🔔 <b>Active Alerts:</b>
• 🚨 Critical: <b>${risk.alerts.critical}</b>
• ⚠️ Warnings: <b>${risk.alerts.warnings}</b>
• ℹ️ Info: <b>${risk.alerts.active - risk.alerts.critical - risk.alerts.warnings}</b>

📈 <b>Performance Metrics:</b>
• Sharpe Ratio: <b>${risk.sharpeRatio.toFixed(2)}</b>
• Sortino Ratio: <b>${risk.sortinoRatio.toFixed(2)}</b>
• VaR (95%): <b>${this.formatCurrency(risk.var95)}</b>`;

    // Add limit usage bars
    message += '\n\n📊 <b>Limit Usage:</b>';
    message += `\n• Drawdown: ${this.formatUsageBar(risk.limits.maxDrawdown.usage)}`;
    message += `\n• Daily Loss: ${this.formatUsageBar(risk.limits.dailyLoss.usage)}`;
    message += `\n• Leverage: ${this.formatUsageBar(risk.limits.leverage.usage)}`;

    message += `\n\n🕐 <i>Updated: ${this.formatTime(risk.lastUpdated)}</i>`;
    
    return message.trim();
  }

  /**
   * Format position list
   */
  formatPositions(positions: Position[]): string {
    if (positions.length === 0) {
      return '📊 <b>Active Positions</b>\n\n📭 No active positions';
    }

    let message = `📊 <b>Active Positions</b> (${positions.length})\n`;
    
    positions.slice(0, 8).forEach(pos => {
      const sideEmoji = pos.side === 'LONG' ? '📈' : '📉';
      const pnlEmoji = pos.unrealizedPnL >= 0 ? '🟢' : '🔴';
      
      message += `\n${sideEmoji} <b>${pos.symbol}</b>`;
      message += `\n   Size: ${this.formatNumber(pos.size)} @ ${this.formatCurrency(pos.entryPrice)}`;
      message += `\n   ${pnlEmoji} P&L: ${this.formatCurrency(pos.unrealizedPnL)} (${this.formatPercentage(pos.unrealizedPnLPercentage)})`;
      
      if (pos.stopLoss) message += `\n   🛑 SL: ${this.formatCurrency(pos.stopLoss)}`;
      if (pos.takeProfit) message += `\n   🎯 TP: ${this.formatCurrency(pos.takeProfit)}`;
      message += '\n';
    });

    if (positions.length > 8) {
      message += `\n... and ${positions.length - 8} more positions`;
    }

    return message.trim();
  }

  /**
   * Format help menu
   */
  formatHelpMenu(): string {
    return `
❓ <b>Help & Commands</b>

📱 <b>Main Commands:</b>
• /start - Initialize bot and welcome
• /status - Current trading status
• /balance - Portfolio overview
• /pause - Pause trading
• /resume - Resume trading
• /settings - Configure preferences
• /help - This help menu

🎯 <b>Quick Actions:</b>
• Tap any button for instant actions
• Use inline menus for navigation
• Get real-time updates automatically

💡 <b>Tips:</b>
• Commands work in any chat with the bot
• Use buttons for faster navigation
• Set up notifications for important events
• Monitor your risk levels regularly

🆘 <b>Need Help?</b>
Our support team is available 24/7 to assist you with any questions or issues.`;
  }

  // Utility formatting methods

  private formatCurrency(amount: number): string {
    if (amount === 0) return '$0.00';
    
    const absAmount = Math.abs(amount);
    let formatted: string;
    
    if (absAmount >= 1000000) {
      formatted = `$${(amount / 1000000).toFixed(2)}M`;
    } else if (absAmount >= 1000) {
      formatted = `$${(amount / 1000).toFixed(2)}K`;
    } else {
      formatted = `$${amount.toFixed(2)}`;
    }
    
    return formatted;
  }

  private formatPercentage(percentage: number): string {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  }

  private formatPercentageChange(percentage: number): string {
    const emoji = percentage >= 0 ? '🟢' : '🔴';
    return `${emoji} ${this.formatPercentage(percentage)}`;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  private formatSentiment(sentiment: number): string {
    if (sentiment > 0.3) return '😊 Bullish';
    if (sentiment < -0.3) return '😰 Bearish';
    return '😐 Neutral';
  }

  private formatUsageBar(usage: number): string {
    const percent = Math.round(usage * 100);
    const filledBars = Math.round((usage * 10));
    const emptyBars = 10 - filledBars;
    
    let color = '🟢';
    if (percent > 80) color = '🔴';
    else if (percent > 60) color = '🟡';
    
    return `${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)} ${percent}% ${color}`;
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    if (hour < 21) return '🌆';
    return '🌙';
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'ACTIVE': return '🟢';
      case 'PAUSED': return '⏸️';
      case 'DISABLED': return '🔴';
      default: return '⚪';
    }
  }

  private getRiskLevel(current: number, limit: number): string {
    const usage = current / limit;
    if (usage > 0.8) return 'HIGH';
    if (usage > 0.6) return 'MEDIUM';
    return 'LOW';
  }

  private getRiskEmoji(level: string): string {
    switch (level) {
      case 'HIGH': return '🚨';
      case 'MEDIUM': return '⚠️';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  }
}

// Export singleton instance
export const formatters = new MessageFormatters();