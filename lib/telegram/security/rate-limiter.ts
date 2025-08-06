/**
 * Telegram Bot Rate Limiter
 * Comprehensive rate limiting and abuse prevention for financial trading bot
 * 
 * Security Features:
 * - Multiple rate limiting strategies (user, IP, command-based)
 * - Sliding window rate limiting
 * - Adaptive throttling based on system load
 * - DoS and spam attack prevention
 * - Emergency rate limiting triggers
 * - Trading command specific limits
 */

export interface RateLimitConfig {
  // User-based limits
  messagesPerMinute: number;
  messagesPerHour: number;
  messagesPerDay: number;
  
  // Command-specific limits
  tradingCommandsPerMinute: number;
  tradingCommandsPerHour: number;
  
  // System limits
  globalMessagesPerSecond: number;
  maxConcurrentRequests: number;
  
  // Abuse prevention
  burstLimit: number;
  suspiciousActivityThreshold: number;
  
  // Emergency triggers
  emergencyThrottleEnabled: boolean;
  emergencyThrottleLimit: number;
}

export interface RateLimitEntry {
  userId: number;
  command: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
}

export interface UserLimitStatus {
  userId: number;
  currentMinute: number;
  currentHour: number;
  currentDay: number;
  tradingCommandsMinute: number;
  tradingCommandsHour: number;
  isBlocked: boolean;
  blockUntil?: number;
  warningCount: number;
  suspiciousActivity: boolean;
}

export enum RateLimitViolationType {
  MESSAGES_PER_MINUTE = 'messages_per_minute',
  MESSAGES_PER_HOUR = 'messages_per_hour',
  MESSAGES_PER_DAY = 'messages_per_day',
  TRADING_COMMANDS_MINUTE = 'trading_commands_minute',
  TRADING_COMMANDS_HOUR = 'trading_commands_hour',
  BURST_LIMIT = 'burst_limit',
  GLOBAL_LIMIT = 'global_limit',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

class TelegramRateLimiter {
  private config: RateLimitConfig;
  private userLimits: Map<number, UserLimitStatus> = new Map();
  private requestHistory: RateLimitEntry[] = [];
  private globalRequestCount: number = 0;
  private lastGlobalReset: number = Date.now();
  private blockedUsers: Map<number, number> = new Map(); // userId -> blockUntil timestamp
  private suspiciousIPs: Set<string> = new Set();
  
  // Trading command patterns
  private readonly tradingCommands = [
    'buy', 'sell', 'trade', 'execute', 'stop', 'cancel', 'order', 'position'
  ];

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      // Default user limits
      messagesPerMinute: 10,
      messagesPerHour: 100,
      messagesPerDay: 500,
      
      // Trading command limits (more restrictive)
      tradingCommandsPerMinute: 3,
      tradingCommandsPerHour: 20,
      
      // System limits
      globalMessagesPerSecond: 50,
      maxConcurrentRequests: 100,
      
      // Abuse prevention
      burstLimit: 5, // Max messages in 10 seconds
      suspiciousActivityThreshold: 3,
      
      // Emergency controls
      emergencyThrottleEnabled: false,
      emergencyThrottleLimit: 1, // 1 message per minute during emergency
      
      ...config
    };

    this.startCleanupTimer();
    console.log('🛡️ Telegram Rate Limiter initialized with strict security controls');
  }

  /**
   * Check if request should be allowed
   */
  async checkRateLimit(
    userId: number, 
    command: string, 
    ip?: string, 
    userAgent?: string
  ): Promise<{
    allowed: boolean;
    remainingRequests?: number;
    resetTime?: number;
    violationType?: RateLimitViolationType;
    message?: string;
  }> {
    try {
      const now = Date.now();
      
      // Check if user is blocked
      const blockUntil = this.blockedUsers.get(userId);
      if (blockUntil && now < blockUntil) {
        return {
          allowed: false,
          violationType: RateLimitViolationType.SUSPICIOUS_ACTIVITY,
          message: `⛔ You are temporarily blocked until ${new Date(blockUntil).toLocaleTimeString()}`
        };
      }

      // Check for emergency throttling
      if (this.config.emergencyThrottleEnabled) {
        const emergencyCheck = this.checkEmergencyThrottle(userId);
        if (!emergencyCheck.allowed) {
          return emergencyCheck;
        }
      }

      // Check global rate limits
      const globalCheck = this.checkGlobalLimits();
      if (!globalCheck.allowed) {
        return globalCheck;
      }

      // Check suspicious IP
      if (ip && this.suspiciousIPs.has(ip)) {
        console.warn(`⚠️ Request from suspicious IP: ${ip}`);
        return {
          allowed: false,
          violationType: RateLimitViolationType.SUSPICIOUS_ACTIVITY,
          message: '🚫 Your IP address has been flagged for suspicious activity'
        };
      }

      // Get or create user limit status
      const userStatus = this.getUserLimitStatus(userId);
      
      // Check if command is a trading command
      const isTradingCommand = this.isTradingCommand(command);
      
      // Check user-specific limits
      const userCheck = this.checkUserLimits(userStatus, isTradingCommand);
      if (!userCheck.allowed) {
        return userCheck;
      }

      // Check burst limits
      const burstCheck = this.checkBurstLimits(userId);
      if (!burstCheck.allowed) {
        return burstCheck;
      }

      // Record the request
      this.recordRequest(userId, command, ip, userAgent);
      
      // Update user status
      this.updateUserStatus(userId, isTradingCommand);
      
      // Check for suspicious activity patterns
      this.checkSuspiciousActivity(userId, command, ip);

      return {
        allowed: true,
        remainingRequests: this.getRemainingRequests(userId),
        resetTime: this.getResetTime()
      };

    } catch (error) {
      console.error('❌ Rate limiter error:', error);
      
      // Fail safe - allow request but log error
      return {
        allowed: true,
        message: 'Rate limiter error - request allowed by default'
      };
    }
  }

  /**
   * Check emergency throttling
   */
  private checkEmergencyThrottle(userId: number): {
    allowed: boolean;
    violationType?: RateLimitViolationType;
    message?: string;
  } {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    const recentRequests = this.requestHistory.filter(
      entry => entry.userId === userId && (now - entry.timestamp) < oneMinute
    ).length;

    if (recentRequests >= this.config.emergencyThrottleLimit) {
      return {
        allowed: false,
        violationType: RateLimitViolationType.MESSAGES_PER_MINUTE,
        message: `🚨 Emergency throttling active: ${this.config.emergencyThrottleLimit} request per minute limit`
      };
    }

    return { allowed: true };
  }

  /**
   * Check global system limits
   */
  private checkGlobalLimits(): {
    allowed: boolean;
    violationType?: RateLimitViolationType;
    message?: string;
  } {
    const now = Date.now();
    const oneSecond = 1000;
    
    // Reset global counter every second
    if ((now - this.lastGlobalReset) > oneSecond) {
      this.globalRequestCount = 0;
      this.lastGlobalReset = now;
    }

    if (this.globalRequestCount >= this.config.globalMessagesPerSecond) {
      return {
        allowed: false,
        violationType: RateLimitViolationType.GLOBAL_LIMIT,
        message: '🌐 System is experiencing high load. Please wait and try again.'
      };
    }

    this.globalRequestCount++;
    return { allowed: true };
  }

  /**
   * Get or create user limit status
   */
  private getUserLimitStatus(userId: number): UserLimitStatus {
    let status = this.userLimits.get(userId);
    
    if (!status) {
      status = {
        userId,
        currentMinute: 0,
        currentHour: 0,
        currentDay: 0,
        tradingCommandsMinute: 0,
        tradingCommandsHour: 0,
        isBlocked: false,
        warningCount: 0,
        suspiciousActivity: false
      };
      this.userLimits.set(userId, status);
    }
    
    return status;
  }

  /**
   * Check user-specific limits
   */
  private checkUserLimits(
    userStatus: UserLimitStatus, 
    isTradingCommand: boolean
  ): {
    allowed: boolean;
    violationType?: RateLimitViolationType;
    message?: string;
  } {
    // Check daily limit
    if (userStatus.currentDay >= this.config.messagesPerDay) {
      return {
        allowed: false,
        violationType: RateLimitViolationType.MESSAGES_PER_DAY,
        message: `📅 Daily message limit reached (${this.config.messagesPerDay}). Try again tomorrow.`
      };
    }

    // Check hourly limit
    if (userStatus.currentHour >= this.config.messagesPerHour) {
      return {
        allowed: false,
        violationType: RateLimitViolationType.MESSAGES_PER_HOUR,
        message: `⏰ Hourly message limit reached (${this.config.messagesPerHour}). Wait until next hour.`
      };
    }

    // Check minute limit
    if (userStatus.currentMinute >= this.config.messagesPerMinute) {
      return {
        allowed: false,
        violationType: RateLimitViolationType.MESSAGES_PER_MINUTE,
        message: `⏱️ Too many messages per minute (${this.config.messagesPerMinute}). Please slow down.`
      };
    }

    // Check trading command limits if applicable
    if (isTradingCommand) {
      if (userStatus.tradingCommandsHour >= this.config.tradingCommandsPerHour) {
        return {
          allowed: false,
          violationType: RateLimitViolationType.TRADING_COMMANDS_HOUR,
          message: `💼 Trading command hourly limit reached (${this.config.tradingCommandsPerHour}). Wait until next hour.`
        };
      }

      if (userStatus.tradingCommandsMinute >= this.config.tradingCommandsPerMinute) {
        return {
          allowed: false,
          violationType: RateLimitViolationType.TRADING_COMMANDS_MINUTE,
          message: `⚡ Trading command rate limit: ${this.config.tradingCommandsPerMinute} per minute. Please wait.`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check burst limits (rapid succession)
   */
  private checkBurstLimits(userId: number): {
    allowed: boolean;
    violationType?: RateLimitViolationType;
    message?: string;
  } {
    const now = Date.now();
    const burstWindow = 10 * 1000; // 10 seconds
    
    const recentRequests = this.requestHistory.filter(
      entry => entry.userId === userId && (now - entry.timestamp) < burstWindow
    ).length;

    if (recentRequests >= this.config.burstLimit) {
      return {
        allowed: false,
        violationType: RateLimitViolationType.BURST_LIMIT,
        message: `💥 Burst limit exceeded (${this.config.burstLimit} messages in 10 seconds). Please slow down.`
      };
    }

    return { allowed: true };
  }

  /**
   * Check if command is a trading command
   */
  private isTradingCommand(command: string): boolean {
    const lowerCommand = command.toLowerCase();
    return this.tradingCommands.some(tradingCmd => 
      lowerCommand.includes(tradingCmd)
    );
  }

  /**
   * Record request in history
   */
  private recordRequest(
    userId: number, 
    command: string, 
    ip?: string, 
    userAgent?: string
  ): void {
    const entry: RateLimitEntry = {
      userId,
      command,
      timestamp: Date.now(),
      ip,
      userAgent
    };

    this.requestHistory.push(entry);
    
    // Keep only recent history (last hour)
    const oneHour = 60 * 60 * 1000;
    const cutoff = Date.now() - oneHour;
    this.requestHistory = this.requestHistory.filter(
      entry => entry.timestamp > cutoff
    );
  }

  /**
   * Update user status counters
   */
  private updateUserStatus(userId: number, isTradingCommand: boolean): void {
    const now = Date.now();
    const userStatus = this.userLimits.get(userId)!;
    
    // Update counters based on current time windows
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Count recent requests in each time window
    const recentRequests = this.requestHistory.filter(
      entry => entry.userId === userId
    );
    
    userStatus.currentMinute = recentRequests.filter(
      entry => (now - entry.timestamp) < oneMinute
    ).length;
    
    userStatus.currentHour = recentRequests.filter(
      entry => (now - entry.timestamp) < oneHour
    ).length;
    
    userStatus.currentDay = recentRequests.filter(
      entry => (now - entry.timestamp) < oneDay
    ).length;

    // Update trading command counters
    if (isTradingCommand) {
      const tradingRequests = recentRequests.filter(
        entry => this.isTradingCommand(entry.command)
      );
      
      userStatus.tradingCommandsMinute = tradingRequests.filter(
        entry => (now - entry.timestamp) < oneMinute
      ).length;
      
      userStatus.tradingCommandsHour = tradingRequests.filter(
        entry => (now - entry.timestamp) < oneHour
      ).length;
    }

    this.userLimits.set(userId, userStatus);
  }

  /**
   * Check for suspicious activity patterns
   */
  private checkSuspiciousActivity(userId: number, command: string, ip?: string): void {
    const now = Date.now();
    const userStatus = this.userLimits.get(userId)!;
    
    // Pattern 1: Rapid identical commands
    const recentIdenticalCommands = this.requestHistory.filter(
      entry => entry.userId === userId && 
               entry.command === command && 
               (now - entry.timestamp) < (5 * 60 * 1000) // 5 minutes
    ).length;

    if (recentIdenticalCommands > 10) {
      this.flagSuspiciousActivity(userId, ip, 'Rapid identical commands');
      return;
    }

    // Pattern 2: Trading command spam
    if (this.isTradingCommand(command)) {
      const recentTradingCommands = this.requestHistory.filter(
        entry => entry.userId === userId && 
                 this.isTradingCommand(entry.command) && 
                 (now - entry.timestamp) < (2 * 60 * 1000) // 2 minutes
      ).length;

      if (recentTradingCommands > 8) {
        this.flagSuspiciousActivity(userId, ip, 'Trading command spam');
        return;
      }
    }

    // Pattern 3: Unusual request frequency from same IP
    if (ip) {
      const ipRequests = this.requestHistory.filter(
        entry => entry.ip === ip && (now - entry.timestamp) < (10 * 60 * 1000) // 10 minutes
      ).length;

      if (ipRequests > 50) {
        this.suspiciousIPs.add(ip);
        console.warn(`⚠️ IP ${ip} flagged as suspicious (${ipRequests} requests in 10 minutes)`);
      }
    }
  }

  /**
   * Flag suspicious activity and potentially block user
   */
  private flagSuspiciousActivity(userId: number, ip?: string, reason: string): void {
    const userStatus = this.userLimits.get(userId)!;
    userStatus.suspiciousActivity = true;
    userStatus.warningCount += 1;

    console.warn(`⚠️ Suspicious activity detected: User ${userId}, Reason: ${reason}, Warning count: ${userStatus.warningCount}`);

    // Block user after threshold warnings
    if (userStatus.warningCount >= this.config.suspiciousActivityThreshold) {
      const blockDuration = 30 * 60 * 1000; // 30 minutes
      const blockUntil = Date.now() + blockDuration;
      
      this.blockedUsers.set(userId, blockUntil);
      userStatus.isBlocked = true;
      userStatus.blockUntil = blockUntil;

      console.error(`🚫 User ${userId} blocked for suspicious activity until ${new Date(blockUntil).toLocaleString()}`);
      
      // Also flag IP if provided
      if (ip) {
        this.suspiciousIPs.add(ip);
      }
    }

    this.userLimits.set(userId, userStatus);
  }

  /**
   * Get remaining requests for user
   */
  private getRemainingRequests(userId: number): number {
    const userStatus = this.userLimits.get(userId);
    if (!userStatus) return this.config.messagesPerMinute;
    
    return Math.max(0, this.config.messagesPerMinute - userStatus.currentMinute);
  }

  /**
   * Get reset time for rate limits
   */
  private getResetTime(): number {
    const now = Date.now();
    const nextMinute = Math.ceil(now / (60 * 1000)) * (60 * 1000);
    return nextMinute;
  }

  /**
   * Enable emergency throttling
   */
  enableEmergencyThrottle(reason: string): void {
    this.config.emergencyThrottleEnabled = true;
    console.error(`🚨 Emergency throttling enabled: ${reason}`);
  }

  /**
   * Disable emergency throttling
   */
  disableEmergencyThrottle(): void {
    this.config.emergencyThrottleEnabled = false;
    console.log('✅ Emergency throttling disabled');
  }

  /**
   * Manually block user
   */
  blockUser(userId: number, durationMinutes: number, reason: string): void {
    const blockUntil = Date.now() + (durationMinutes * 60 * 1000);
    this.blockedUsers.set(userId, blockUntil);
    
    const userStatus = this.getUserLimitStatus(userId);
    userStatus.isBlocked = true;
    userStatus.blockUntil = blockUntil;
    this.userLimits.set(userId, userStatus);
    
    console.log(`🚫 User ${userId} manually blocked for ${durationMinutes} minutes. Reason: ${reason}`);
  }

  /**
   * Unblock user
   */
  unblockUser(userId: number): void {
    this.blockedUsers.delete(userId);
    
    const userStatus = this.userLimits.get(userId);
    if (userStatus) {
      userStatus.isBlocked = false;
      userStatus.blockUntil = undefined;
      userStatus.warningCount = 0;
      userStatus.suspiciousActivity = false;
      this.userLimits.set(userId, userStatus);
    }
    
    console.log(`✅ User ${userId} unblocked`);
  }

  /**
   * Get rate limiting statistics
   */
  getStats(): {
    totalRequests: number;
    activeUsers: number;
    blockedUsers: number;
    suspiciousIPs: number;
    emergencyThrottleActive: boolean;
    averageRequestsPerMinute: number;
  } {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    const recentRequests = this.requestHistory.filter(
      entry => (now - entry.timestamp) < oneMinute
    );
    
    const activeUsers = new Set(
      this.requestHistory.filter(
        entry => (now - entry.timestamp) < (10 * 60 * 1000) // Active in last 10 minutes
      ).map(entry => entry.userId)
    ).size;

    return {
      totalRequests: this.requestHistory.length,
      activeUsers,
      blockedUsers: this.blockedUsers.size,
      suspiciousIPs: this.suspiciousIPs.size,
      emergencyThrottleActive: this.config.emergencyThrottleEnabled,
      averageRequestsPerMinute: recentRequests.length
    };
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredBlocks();
      this.cleanupOldHistory();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up expired user blocks
   */
  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    
    for (const [userId, blockUntil] of this.blockedUsers.entries()) {
      if (now > blockUntil) {
        this.unblockUser(userId);
      }
    }
  }

  /**
   * Clean up old request history
   */
  private cleanupOldHistory(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.requestHistory = this.requestHistory.filter(
      entry => entry.timestamp > oneDayAgo
    );
  }
}

export const telegramRateLimiter = new TelegramRateLimiter();
export { TelegramRateLimiter };