import { 
  TelegramUser, 
  TelegramDailyReport,
  TelegramNotification,
  PortfolioData,
  Trade,
  AIAnalysis,
  RiskAlert,
  Position
} from '../../types/trading';
import { MessageFormatter } from './message-formatter';

export interface ScheduledJob {
  id: string;
  userId: string;
  telegramId: number;
  chatId: number;
  type: 'DAILY_REPORT' | 'WEEKLY_REPORT' | 'MONTHLY_REPORT';
  schedule: string; // Cron expression
  timezone: string;
  lastRun?: Date;
  nextRun: Date;
  enabled: boolean;
  config: any;
}

export class TelegramScheduler {
  private bot: any; // TradingBot instance
  private supabase: any;
  private formatter: MessageFormatter;
  private scheduledJobs: Map<string, ScheduledJob>;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(bot: any, supabase: any) {
    this.bot = bot;
    this.supabase = supabase;
    this.formatter = new MessageFormatter();
    this.scheduledJobs = new Map();
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('Starting Telegram Scheduler...');
    
    // Load scheduled jobs from database
    await this.loadScheduledJobs();
    
    // Start the scheduler loop (check every minute)
    this.intervalId = setInterval(() => {
      this.processScheduledJobs().catch(error => {
        console.error('Error processing scheduled jobs:', error);
      });
    }, 60000); // 60 seconds

    this.isRunning = true;
    console.log('Telegram Scheduler started');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('Stopping Telegram Scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('Telegram Scheduler stopped');
  }

  private async loadScheduledJobs(): Promise<void> {
    try {
      const { data: jobs, error } = await this.supabase
        .from('telegram_scheduled_jobs')
        .select('*')
        .eq('enabled', true);

      if (error) {
        console.error('Error loading scheduled jobs:', error);
        return;
      }

      this.scheduledJobs.clear();
      
      for (const job of jobs || []) {
        this.scheduledJobs.set(job.id, {
          ...job,
          lastRun: job.last_run ? new Date(job.last_run) : undefined,
          nextRun: new Date(job.next_run)
        });
      }

      console.log(`Loaded ${this.scheduledJobs.size} scheduled jobs`);
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error);
    }
  }

  private async processScheduledJobs(): Promise<void> {
    const now = new Date();
    
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      if (!job.enabled || now < job.nextRun) {
        continue;
      }

      try {
        console.log(`Processing scheduled job: ${jobId} (${job.type})`);
        await this.executeScheduledJob(job);
        
        // Update job's last run and next run times
        job.lastRun = now;
        job.nextRun = this.calculateNextRun(job.schedule, job.timezone);
        
        // Update in database
        await this.updateScheduledJob(job);
        
      } catch (error) {
        console.error(`Error executing scheduled job ${jobId}:`, error);
        
        // Log the error but don't stop processing other jobs
        await this.logJobError(jobId, error);
      }
    }
  }

  private async executeScheduledJob(job: ScheduledJob): Promise<void> {
    switch (job.type) {
      case 'DAILY_REPORT':
        await this.sendDailyReport(job);
        break;
      case 'WEEKLY_REPORT':
        await this.sendWeeklyReport(job);
        break;
      case 'MONTHLY_REPORT':
        await this.sendMonthlyReport(job);
        break;
      default:
        console.warn(`Unknown job type: ${job.type}`);
    }
  }

  private async sendDailyReport(job: ScheduledJob): Promise<void> {
    const report = await this.generateDailyReport(job.userId);
    const message = this.formatter.formatDailyReport(report);
    
    await this.bot.sendNotification(job.chatId, message, { parse_mode: 'Markdown' });
    
    // Store the sent report
    await this.storeSentReport(report, job.chatId);
  }

  private async sendWeeklyReport(job: ScheduledJob): Promise<void> {
    // Generate and send weekly report
    const report = await this.generateWeeklyReport(job.userId);
    const message = `📊 *Weekly Trading Report*\n\n${this.formatter.formatDailyReport(report)}`;
    
    await this.bot.sendNotification(job.chatId, message, { parse_mode: 'Markdown' });
  }

  private async sendMonthlyReport(job: ScheduledJob): Promise<void> {
    // Generate and send monthly report
    const report = await this.generateMonthlyReport(job.userId);
    const message = `📊 *Monthly Trading Report*\n\n${this.formatter.formatDailyReport(report)}`;
    
    await this.bot.sendNotification(job.chatId, message, { parse_mode: 'Markdown' });
  }

  public async generateDailyReport(userId: string): Promise<TelegramDailyReport> {
    const today = new Date();
    const reportId = `daily_${userId}_${today.toISOString().split('T')[0]}`;

    try {
      // Fetch all required data in parallel
      const [portfolioData, trades, positions, aiAnalysis, riskAlerts] = await Promise.all([
        this.getPortfolioData(userId),
        this.getTodaysTrades(userId),
        this.getActivePositions(userId),
        this.getAIAnalysis(),
        this.getRiskAlerts(userId)
      ]);

      // Calculate trading summary
      const tradingSummary = this.calculateTradingSummary(trades);
      
      // Get portfolio summary
      const portfolioSummary = {
        totalBalance: portfolioData.totalBalance,
        dailyPnL: portfolioData.dailyPnL,
        dailyPnLPercentage: portfolioData.dailyPnLPercentage,
        totalReturn: portfolioData.totalReturn,
        totalReturnPercentage: portfolioData.totalReturnPercentage,
        activePositions: positions.length
      };

      // Calculate risk metrics
      const riskMetrics = {
        currentDrawdown: portfolioData.totalReturnPercentage < 0 ? Math.abs(portfolioData.totalReturnPercentage) : 0,
        riskScore: this.calculateRiskScore(portfolioData, riskAlerts),
        alerts: riskAlerts
      };

      // Get upcoming events
      const upcomingEvents = await this.getUpcomingEvents();

      const report: TelegramDailyReport = {
        id: reportId,
        userId,
        date: today,
        portfolioSummary,
        tradingSummary,
        aiInsights: {
          marketRegime: aiAnalysis.marketRegime,
          confidence: aiAnalysis.confidence,
          nextAction: aiAnalysis.nextAction,
          recommendedSymbol: aiAnalysis.recommendedSymbol,
          reasoning: aiAnalysis.reasoning.slice(0, 3) // Limit to 3 key points
        },
        riskMetrics,
        upcomingEvents,
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      
      // Return a basic error report
      return {
        id: reportId,
        userId,
        date: today,
        portfolioSummary: {
          totalBalance: 0,
          dailyPnL: 0,
          dailyPnLPercentage: 0,
          totalReturn: 0,
          totalReturnPercentage: 0,
          activePositions: 0
        },
        tradingSummary: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          bestTrade: 0,
          worstTrade: 0
        },
        aiInsights: {
          marketRegime: 'RANGE',
          confidence: 0,
          nextAction: 'HOLD',
          reasoning: ['Unable to generate insights due to system error']
        },
        riskMetrics: {
          currentDrawdown: 0,
          riskScore: 50,
          alerts: []
        },
        upcomingEvents: [],
        generatedAt: new Date()
      };
    }
  }

  private async generateWeeklyReport(userId: string): Promise<TelegramDailyReport> {
    // Similar to daily report but with weekly data
    // This is a simplified version - you can extend it with weekly-specific metrics
    return this.generateDailyReport(userId);
  }

  private async generateMonthlyReport(userId: string): Promise<TelegramDailyReport> {
    // Similar to daily report but with monthly data
    // This is a simplified version - you can extend it with monthly-specific metrics
    return this.generateDailyReport(userId);
  }

  private calculateTradingSummary(trades: Trade[]) {
    const winningTrades = trades.filter(t => t.realizedPnL && t.realizedPnL > 0).length;
    const losingTrades = trades.filter(t => t.realizedPnL && t.realizedPnL < 0).length;
    const winRate = trades.length > 0 ? winningTrades / trades.length : 0;
    
    const pnls = trades.map(t => t.realizedPnL || 0).filter(pnl => pnl !== 0);
    const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
    const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate,
      bestTrade,
      worstTrade
    };
  }

  private calculateRiskScore(portfolio: PortfolioData, alerts: RiskAlert[]): number {
    let riskScore = 50; // Base score

    // Adjust based on drawdown
    const drawdown = portfolio.totalReturnPercentage < 0 ? Math.abs(portfolio.totalReturnPercentage) : 0;
    if (drawdown > 0.2) riskScore += 30; // High risk
    else if (drawdown > 0.1) riskScore += 15; // Medium risk

    // Adjust based on alerts
    const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL').length;
    const warningAlerts = alerts.filter(a => a.type === 'WARNING').length;
    
    riskScore += criticalAlerts * 20;
    riskScore += warningAlerts * 10;

    return Math.min(100, Math.max(0, riskScore));
  }

  private calculateNextRun(schedule: string, timezone: string): Date {
    // This is a simplified scheduler - you might want to use a proper cron library
    const now = new Date();
    
    // For daily reports, schedule for next day at the specified time
    if (schedule.includes('daily')) {
      const [, time] = schedule.split(' ');
      const [hour, minute] = time.split(':').map(Number);
      
      const nextRun = new Date(now);
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(hour, minute, 0, 0);
      
      return nextRun;
    }
    
    // Default: next day at 9 AM
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(9, 0, 0, 0);
    
    return nextRun;
  }

  private async updateScheduledJob(job: ScheduledJob): Promise<void> {
    await this.supabase
      .from('telegram_scheduled_jobs')
      .update({
        last_run: job.lastRun,
        next_run: job.nextRun
      })
      .eq('id', job.id);
  }

  private async logJobError(jobId: string, error: any): Promise<void> {
    await this.supabase
      .from('telegram_job_errors')
      .insert({
        job_id: jobId,
        error_message: error.message || String(error),
        error_stack: error.stack,
        timestamp: new Date()
      });
  }

  private async storeSentReport(report: TelegramDailyReport, chatId: number): Promise<void> {
    await this.supabase
      .from('telegram_sent_reports')
      .insert({
        report_id: report.id,
        user_id: report.userId,
        chat_id: chatId,
        report_type: 'DAILY',
        report_data: report,
        sent_at: new Date()
      });
  }

  // Data fetching methods
  private async getPortfolioData(userId: string): Promise<PortfolioData> {
    try {
      const response = await fetch('/api/trading/positions');
      const data = await response.json();
      return data.portfolio || this.getDefaultPortfolioData();
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      return this.getDefaultPortfolioData();
    }
  }

  private async getTodaysTrades(userId: string): Promise<Trade[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/trading/trades?date=${today}`);
      const data = await response.json();
      return data.trades || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  }

  private async getActivePositions(userId: string): Promise<Position[]> {
    try {
      const response = await fetch('/api/trading/positions');
      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  private async getAIAnalysis(): Promise<AIAnalysis> {
    try {
      const response = await fetch('/api/ai-analysis');
      const data = await response.json();
      return data || this.getDefaultAIAnalysis();
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      return this.getDefaultAIAnalysis();
    }
  }

  private async getRiskAlerts(userId: string): Promise<RiskAlert[]> {
    try {
      const response = await fetch('/api/risk/alerts');
      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      console.error('Error fetching risk alerts:', error);
      return [];
    }
  }

  private async getUpcomingEvents(): Promise<string[]> {
    try {
      // This could fetch from economic calendar API
      return [
        'Fed Interest Rate Decision - Tomorrow',
        'Bitcoin ETF Approval Deadline - Next Week',
        'Major Earnings Reports - This Week'
      ];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  // Default data methods
  private getDefaultPortfolioData(): PortfolioData {
    return {
      totalBalance: 0,
      availableBalance: 0,
      totalEquity: 0,
      dailyPnL: 0,
      dailyPnLPercentage: 0,
      totalReturn: 0,
      totalReturnPercentage: 0,
      activePositions: 0,
      totalPositionsValue: 0,
      marginUsed: 0,
      marginAvailable: 0,
      lastUpdated: new Date()
    };
  }

  private getDefaultAIAnalysis(): AIAnalysis {
    return {
      marketRegime: 'RANGE',
      confidence: 0.5,
      sentiment: 0,
      fearGreedIndex: 50,
      nextAction: 'HOLD',
      reasoning: ['System temporarily unavailable'],
      lastUpdated: new Date()
    };
  }

  // Public methods for manual report generation
  public async scheduleUserReports(user: TelegramUser, chatId: number): Promise<void> {
    const { preferences } = user;
    
    if (preferences.reporting.frequency === 'DAILY' && preferences.notifications.dailyReports) {
      const job: ScheduledJob = {
        id: `daily_${user.telegramId}`,
        userId: user.userId || String(user.telegramId),
        telegramId: user.telegramId,
        chatId,
        type: 'DAILY_REPORT',
        schedule: `daily ${preferences.reporting.time}`,
        timezone: preferences.reporting.timezone,
        nextRun: this.calculateNextRun(`daily ${preferences.reporting.time}`, preferences.reporting.timezone),
        enabled: true,
        config: {
          format: preferences.reporting.format,
          includeCharts: preferences.reporting.includeCharts
        }
      };

      // Save to database
      await this.supabase
        .from('telegram_scheduled_jobs')
        .upsert({
          id: job.id,
          user_id: job.userId,
          telegram_id: job.telegramId,
          chat_id: job.chatId,
          type: job.type,
          schedule: job.schedule,
          timezone: job.timezone,
          next_run: job.nextRun,
          enabled: job.enabled,
          config: job.config
        });

      // Add to memory
      this.scheduledJobs.set(job.id, job);
    }
  }

  public async removeUserReports(telegramId: number): Promise<void> {
    const jobId = `daily_${telegramId}`;
    
    // Remove from database
    await this.supabase
      .from('telegram_scheduled_jobs')
      .delete()
      .eq('telegram_id', telegramId);

    // Remove from memory
    this.scheduledJobs.delete(jobId);
  }

  public getScheduledJobsCount(): number {
    return this.scheduledJobs.size;
  }

  public isRunning(): boolean {
    return this.isRunning;
  }
}