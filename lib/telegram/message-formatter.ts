import { 
  TelegramUser, 
  TelegramCommand,
  TelegramDailyReport,
  PortfolioData,
  Position,
  Trade,
  AIAnalysis,
  RiskAlert,
  MarketRegime
} from '../../types/trading';

export class MessageFormatter {
  
  public formatWelcomeMessage(user: TelegramUser): string {
    const name = user.firstName || user.username || 'Trader';
    
    return `
🤖 *Welcome to AI Trading Bot, ${name}!*

I'm your personal AI trading assistant. Here's what I can help you with:

📊 *Portfolio Management*
• View portfolio status
• Monitor active positions
• Track recent trades

🧠 *AI Insights*
• Get market analysis
• Receive trading recommendations
• Access daily reports

⚙️ *Settings*
• Configure notifications
• Manage trading preferences
• Set report schedules

Type /help to see all available commands or /portfolio to get started!

⚠️ *Important:* This bot is for paper trading only. Always verify trades before execution.
    `.trim();
  }

  public formatHelpMessage(user: TelegramUser, commands: TelegramCommand[]): string {
    const availableCommands = commands.filter(cmd => 
      cmd.permissions.length === 0 || 
      cmd.permissions.some(perm => this.userHasPermission(user, perm))
    );

    let helpText = '*Available Commands:*\n\n';

    const categories = {
      'General': ['start', 'help', 'status'],
      'Portfolio': ['portfolio', 'positions', 'trades'],
      'Analysis': ['ai_analysis', 'report'],
      'Settings': ['settings'],
      'Trading': ['trade']
    };

    for (const [category, commandNames] of Object.entries(categories)) {
      const categoryCommands = availableCommands.filter(cmd => 
        commandNames.includes(cmd.command)
      );

      if (categoryCommands.length > 0) {
        helpText += `*${category}:*\n`;
        for (const cmd of categoryCommands) {
          helpText += `/${cmd.command} - ${cmd.description}\n`;
        }
        helpText += '\n';
      }
    }

    helpText += '*Examples:*\n';
    helpText += '• `/portfolio` - View your current portfolio\n';
    helpText += '• `/trades 10` - Show last 10 trades\n';
    helpText += '• `/ai_analysis` - Get AI market insights\n';
    helpText += '• `/report` - Generate daily report\n\n';

    helpText += '*Tips:*\n';
    helpText += '• Use /settings to configure notifications\n';
    helpText += '• Daily reports are sent automatically if enabled\n';
    helpText += '• All trading operations require confirmation\n';

    return helpText;
  }

  public formatPortfolioSummary(portfolio: PortfolioData): string {
    const changeIcon = portfolio.dailyPnL >= 0 ? '📈' : '📉';
    const changeColor = portfolio.dailyPnL >= 0 ? '🟢' : '🔴';
    
    return `
${changeIcon} *Portfolio Summary*

💰 *Total Balance:* $${this.formatNumber(portfolio.totalBalance)}
💵 *Available:* $${this.formatNumber(portfolio.availableBalance)}
📊 *Total Equity:* $${this.formatNumber(portfolio.totalEquity)}

${changeColor} *Daily P&L:* $${this.formatNumber(portfolio.dailyPnL)} (${this.formatPercentage(portfolio.dailyPnLPercentage)})

📈 *Total Return:* $${this.formatNumber(portfolio.totalReturn)} (${this.formatPercentage(portfolio.totalReturnPercentage)})

🎯 *Active Positions:* ${portfolio.activePositions}
💎 *Positions Value:* $${this.formatNumber(portfolio.totalPositionsValue)}

🔒 *Margin Used:* $${this.formatNumber(portfolio.marginUsed)}
🔓 *Margin Available:* $${this.formatNumber(portfolio.marginAvailable)}

🕐 *Last Updated:* ${this.formatDateTime(portfolio.lastUpdated)}
    `.trim();
  }

  public formatPositions(positions: Position[]): string {
    if (positions.length === 0) {
      return '📭 *No Active Positions*\n\nYou currently have no open positions.';
    }

    let message = `📈 *Active Positions* (${positions.length})\n\n`;

    for (const position of positions.slice(0, 10)) { // Limit to 10 positions
      const pnlIcon = position.unrealizedPnL >= 0 ? '🟢' : '🔴';
      const sideIcon = position.side === 'LONG' ? '📈' : '📉';
      
      message += `${sideIcon} *${position.symbol}* (${position.side})\n`;
      message += `💰 Size: ${this.formatNumber(position.size)}\n`;
      message += `💵 Entry: $${this.formatNumber(position.entryPrice)}\n`;
      message += `📊 Current: $${this.formatNumber(position.currentPrice)}\n`;
      message += `${pnlIcon} P&L: $${this.formatNumber(position.unrealizedPnL)} (${this.formatPercentage(position.unrealizedPnLPercentage)})\n`;
      message += `🎚️ Leverage: ${position.leverage}x\n`;
      
      if (position.stopLoss) {
        message += `🛑 Stop Loss: $${this.formatNumber(position.stopLoss)}\n`;
      }
      if (position.takeProfit) {
        message += `🎯 Take Profit: $${this.formatNumber(position.takeProfit)}\n`;
      }
      
      message += `📅 Opened: ${this.formatDate(position.createdAt)}\n\n`;
    }

    if (positions.length > 10) {
      message += `\n... and ${positions.length - 10} more positions`;
    }

    return message.trim();
  }

  public formatTrades(trades: Trade[]): string {
    if (trades.length === 0) {
      return '📭 *No Recent Trades*\n\nNo trades found for the specified period.';
    }

    let message = `📋 *Recent Trades* (${trades.length})\n\n`;

    for (const trade of trades) {
      const sideIcon = trade.side === 'BUY' ? '🟢' : '🔴';
      const statusIcon = this.getTradeStatusIcon(trade.status);
      
      message += `${sideIcon} ${statusIcon} *${trade.symbol}*\n`;
      message += `📊 ${trade.side} ${this.formatNumber(trade.quantity)} @ $${this.formatNumber(trade.executedPrice || trade.price)}\n`;
      message += `💰 Value: $${this.formatNumber((trade.executedPrice || trade.price) * trade.quantity)}\n`;
      message += `📈 Status: ${trade.status}\n`;
      
      if (trade.realizedPnL) {
        const pnlIcon = trade.realizedPnL >= 0 ? '💚' : '💔';
        message += `${pnlIcon} P&L: $${this.formatNumber(trade.realizedPnL)}\n`;
      }
      
      message += `🤖 Strategy: ${trade.strategy}\n`;
      message += `🎯 Confidence: ${this.formatPercentage(trade.confidence)}\n`;
      message += `📅 ${this.formatDateTime(trade.createdAt)}\n\n`;
    }

    return message.trim();
  }

  public formatAIAnalysis(analysis: AIAnalysis): string {
    const regimeIcon = this.getMarketRegimeIcon(analysis.marketRegime);
    const actionIcon = this.getActionIcon(analysis.nextAction);
    const confidenceIcon = this.getConfidenceIcon(analysis.confidence);
    
    let message = `🧠 *AI Market Analysis*\n\n`;
    message += `${regimeIcon} *Market Regime:* ${analysis.marketRegime}\n`;
    message += `${confidenceIcon} *Confidence:* ${this.formatPercentage(analysis.confidence)}\n`;
    message += `📊 *Sentiment:* ${this.formatSentiment(analysis.sentiment)}\n`;
    message += `😰 *Fear & Greed:* ${analysis.fearGreedIndex}/100\n\n`;
    
    message += `${actionIcon} *Recommended Action:* ${analysis.nextAction}\n`;
    
    if (analysis.recommendedSymbol) {
      message += `🎯 *Symbol:* ${analysis.recommendedSymbol}\n`;
    }
    if (analysis.entryPrice) {
      message += `💵 *Entry Price:* $${this.formatNumber(analysis.entryPrice)}\n`;
    }
    if (analysis.targetPrice) {
      message += `🎯 *Target:* $${this.formatNumber(analysis.targetPrice)}\n`;
    }
    if (analysis.stopLoss) {
      message += `🛑 *Stop Loss:* $${this.formatNumber(analysis.stopLoss)}\n`;
    }
    
    message += '\n*AI Reasoning:*\n';
    for (let i = 0; i < analysis.reasoning.length && i < 5; i++) {
      message += `• ${analysis.reasoning[i]}\n`;
    }
    
    message += `\n🕐 *Last Updated:* ${this.formatDateTime(analysis.lastUpdated)}`;
    
    return message;
  }

  public formatDailyReport(report: TelegramDailyReport): string {
    const dateStr = this.formatDate(report.date);
    const portfolioPnL = report.portfolioSummary.dailyPnL;
    const pnlIcon = portfolioPnL >= 0 ? '📈' : '📉';
    const pnlColor = portfolioPnL >= 0 ? '🟢' : '🔴';
    
    let message = `📊 *Daily Trading Report - ${dateStr}*\n\n`;
    
    // Portfolio Summary
    message += `💰 *Portfolio Summary*\n`;
    message += `Total Balance: $${this.formatNumber(report.portfolioSummary.totalBalance)}\n`;
    message += `${pnlColor} Daily P&L: $${this.formatNumber(portfolioPnL)} (${this.formatPercentage(report.portfolioSummary.dailyPnLPercentage)})\n`;
    message += `📈 Total Return: $${this.formatNumber(report.portfolioSummary.totalReturn)} (${this.formatPercentage(report.portfolioSummary.totalReturnPercentage)})\n`;
    message += `🎯 Active Positions: ${report.portfolioSummary.activePositions}\n\n`;
    
    // Trading Summary
    message += `📋 *Trading Activity*\n`;
    message += `Total Trades: ${report.tradingSummary.totalTrades}\n`;
    message += `Win Rate: ${this.formatPercentage(report.tradingSummary.winRate)}\n`;
    if (report.tradingSummary.bestTrade > 0) {
      message += `💚 Best Trade: $${this.formatNumber(report.tradingSummary.bestTrade)}\n`;
    }
    if (report.tradingSummary.worstTrade < 0) {
      message += `💔 Worst Trade: $${this.formatNumber(report.tradingSummary.worstTrade)}\n`;
    }
    message += '\n';
    
    // AI Insights
    const regimeIcon = this.getMarketRegimeIcon(report.aiInsights.marketRegime);
    const actionIcon = this.getActionIcon(report.aiInsights.nextAction);
    
    message += `🧠 *AI Insights*\n`;
    message += `${regimeIcon} Market: ${report.aiInsights.marketRegime}\n`;
    message += `${actionIcon} Next Action: ${report.aiInsights.nextAction}\n`;
    if (report.aiInsights.recommendedSymbol) {
      message += `🎯 Symbol: ${report.aiInsights.recommendedSymbol}\n`;
    }
    message += `🎯 Confidence: ${this.formatPercentage(report.aiInsights.confidence)}\n\n`;
    
    // Key Insights
    if (report.aiInsights.reasoning.length > 0) {
      message += `💡 *Key Insights:*\n`;
      for (let i = 0; i < Math.min(3, report.aiInsights.reasoning.length); i++) {
        message += `• ${report.aiInsights.reasoning[i]}\n`;
      }
      message += '\n';
    }
    
    // Risk Metrics
    message += `⚠️ *Risk Status*\n`;
    message += `Drawdown: ${this.formatPercentage(report.riskMetrics.currentDrawdown)}\n`;
    message += `Risk Score: ${report.riskMetrics.riskScore}/100\n`;
    
    if (report.riskMetrics.alerts.length > 0) {
      message += `🚨 Active Alerts: ${report.riskMetrics.alerts.length}\n`;
    }
    
    // Upcoming Events
    if (report.upcomingEvents.length > 0) {
      message += `\n📅 *Upcoming Events:*\n`;
      for (const event of report.upcomingEvents.slice(0, 3)) {
        message += `• ${event}\n`;
      }
    }
    
    message += `\n🕐 *Generated:* ${this.formatDateTime(report.generatedAt)}`;
    
    return message;
  }

  public formatRiskAlert(alert: RiskAlert): string {
    const alertIcon = this.getRiskAlertIcon(alert.type);
    const categoryIcon = this.getRiskCategoryIcon(alert.category);
    
    let message = `${alertIcon} *Risk Alert*\n\n`;
    message += `${categoryIcon} *Category:* ${alert.category}\n`;
    message += `📊 *Type:* ${alert.type}\n`;
    message += `📋 *Message:* ${alert.message}\n\n`;
    message += `📝 *Details:*\n${alert.details}\n\n`;
    
    if (alert.action) {
      message += `⚡ *Recommended Action:*\n${alert.action}\n\n`;
    }
    
    message += `🕐 *Time:* ${this.formatDateTime(alert.timestamp)}`;
    
    return message;
  }

  public formatTradeNotification(trade: Trade): string {
    const sideIcon = trade.side === 'BUY' ? '🟢' : '🔴';
    const statusIcon = this.getTradeStatusIcon(trade.status);
    
    let message = `${sideIcon} *Trade ${trade.status}*\n\n`;
    message += `${statusIcon} *${trade.symbol}*\n`;
    message += `📊 ${trade.side} ${this.formatNumber(trade.quantity)}\n`;
    message += `💰 Price: $${this.formatNumber(trade.executedPrice || trade.price)}\n`;
    message += `💵 Value: $${this.formatNumber((trade.executedPrice || trade.price) * trade.quantity)}\n`;
    message += `🤖 Strategy: ${trade.strategy}\n`;
    message += `🎯 Confidence: ${this.formatPercentage(trade.confidence)}\n`;
    
    if (trade.realizedPnL) {
      const pnlIcon = trade.realizedPnL >= 0 ? '💚' : '💔';
      message += `${pnlIcon} P&L: $${this.formatNumber(trade.realizedPnL)}\n`;
    }
    
    message += `🕐 ${this.formatDateTime(trade.createdAt)}`;
    
    return message;
  }

  public formatSystemStatus(status: any): string {
    let message = `🤖 *System Status*\n\n`;
    message += `🔌 Bot Status: ${status.botStatus}\n`;
    message += `⚙️ Trading Engine: ${status.tradingEngine}\n`;
    message += `📡 Data Feeds: ${status.dataFeeds}\n`;
    message += `🕐 Last Update: ${this.formatDateTime(status.lastUpdate)}`;
    
    return message;
  }

  // Utility methods
  private formatNumber(num: number): string {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }

  private formatPercentage(num: number): string {
    return (num * 100).toFixed(2) + '%';
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatSentiment(sentiment: number): string {
    if (sentiment > 0.5) return `🟢 Bullish (${this.formatPercentage(sentiment)})`;
    if (sentiment > 0.2) return `🟡 Neutral (${this.formatPercentage(sentiment)})`;
    return `🔴 Bearish (${this.formatPercentage(sentiment)})`;
  }

  private getMarketRegimeIcon(regime: MarketRegime): string {
    switch (regime) {
      case 'BULL': return '🐂';
      case 'BEAR': return '🐻';
      case 'RANGE': return '📊';
      case 'VOLATILE': return '⚡';
      default: return '❓';
    }
  }

  private getActionIcon(action: string): string {
    switch (action) {
      case 'BUY': return '🟢';
      case 'SELL': return '🔴';
      case 'HOLD': return '🟡';
      default: return '❓';
    }
  }

  private getConfidenceIcon(confidence: number): string {
    if (confidence >= 0.8) return '🟢';
    if (confidence >= 0.6) return '🟡';
    return '🔴';
  }

  private getTradeStatusIcon(status: string): string {
    switch (status) {
      case 'FILLED': return '✅';
      case 'PARTIALLY_FILLED': return '🔄';
      case 'NEW': return '🆕';
      case 'CANCELED': return '❌';
      case 'REJECTED': return '🚫';
      default: return '❓';
    }
  }

  private getRiskAlertIcon(type: string): string {
    switch (type) {
      case 'CRITICAL': return '🚨';
      case 'WARNING': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '❓';
    }
  }

  private getRiskCategoryIcon(category: string): string {
    switch (category) {
      case 'DRAWDOWN': return '📉';
      case 'LEVERAGE': return '🎚️';
      case 'EXPOSURE': return '⚖️';
      case 'API': return '🔌';
      default: return '❓';
    }
  }

  private userHasPermission(user: TelegramUser, permission: string): boolean {
    if (user.permissions.isAdmin) return true;
    
    switch (permission) {
      case 'canReceiveReports': return user.permissions.canReceiveReports;
      case 'canExecuteTrades': return user.permissions.canExecuteTrades;
      case 'canViewPortfolio': return user.permissions.canViewPortfolio;
      case 'canModifySettings': return user.permissions.canModifySettings;
      case 'canAccessAnalytics': return user.permissions.canAccessAnalytics;
      case 'isAdmin': return user.permissions.isAdmin;
      default: return false;
    }
  }
}