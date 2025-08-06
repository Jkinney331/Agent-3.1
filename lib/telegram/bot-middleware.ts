import { 
  TelegramBotConfig, 
  TelegramUser, 
  TelegramCommand,
  TelegramRateLimitState 
} from '../../types/trading';

export interface MiddlewareResult {
  allowed: boolean;
  message?: string;
  user?: TelegramUser;
}

export class BotMiddleware {
  private config: TelegramBotConfig;
  private supabase: any;
  private rateLimitMap: Map<number, TelegramRateLimitState>;
  private blockedUsers: Set<number>;

  constructor(config: TelegramBotConfig, supabase: any) {
    this.config = config;
    this.supabase = supabase;
    this.rateLimitMap = new Map();
    this.blockedUsers = new Set();

    // Clean up rate limit data periodically
    setInterval(() => this.cleanupRateLimit(), 60000); // Every minute
  }

  public async processMessage(msg: any): Promise<MiddlewareResult> {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // 1. Check if user is allowed
    const userValidation = await this.validateUser(userId, msg.from);
    if (!userValidation.allowed) {
      return userValidation;
    }

    // 2. Check rate limiting
    const rateLimitResult = this.checkRateLimit(userId, 'message');
    if (!rateLimitResult.allowed) {
      return rateLimitResult;
    }

    // 3. Check if user is blocked
    if (this.blockedUsers.has(userId)) {
      return {
        allowed: false,
        message: 'You are currently blocked from using this bot.'
      };
    }

    // 4. Validate chat type (only allow private chats for sensitive operations)
    if (msg.chat.type !== 'private' && this.isTradeCommand(msg.text)) {
      return {
        allowed: false,
        message: 'Trading commands can only be used in private chats.'
      };
    }

    return {
      allowed: true,
      user: userValidation.user
    };
  }

  public async validateUser(userId: number, telegramData: any): Promise<MiddlewareResult> {
    // Check if user validation is enabled
    if (!this.config.security.validateUser) {
      return { allowed: true };
    }

    // Check if user is in allowed list (if configured)
    if (this.config.allowedUsers.length > 0 && !this.config.allowedUsers.includes(userId)) {
      return {
        allowed: false,
        message: 'You are not authorized to use this bot. Please contact an administrator.'
      };
    }

    // Check if user exists in database
    try {
      const { data: user, error } = await this.supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error checking user:', error);
        return {
          allowed: false,
          message: 'Database error. Please try again later.'
        };
      }

      if (!user) {
        // New user - create if registration is open
        return { allowed: true }; // Let the main bot handle user creation
      }

      // Check if user is active
      if (!user.is_active) {
        return {
          allowed: false,
          message: 'Your account has been deactivated. Please contact an administrator.'
        };
      }

      return {
        allowed: true,
        user: user
      };
    } catch (error) {
      console.error('Error validating user:', error);
      return {
        allowed: false,
        message: 'System error. Please try again later.'
      };
    }
  }

  public checkRateLimit(userId: number, endpoint: string): MiddlewareResult {
    if (!this.config.rateLimiting.enabled) {
      return { allowed: true };
    }

    const now = new Date();
    let userState = this.rateLimitMap.get(userId);

    if (!userState) {
      userState = {
        userId,
        requests: [],
        isBlocked: false,
        warningsSent: 0
      };
      this.rateLimitMap.set(userId, userState);
    }

    // Check if user is currently blocked
    if (userState.isBlocked && userState.blockedUntil && now < userState.blockedUntil) {
      const remainingTime = Math.ceil((userState.blockedUntil.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        message: `Rate limit exceeded. Please wait ${remainingTime} seconds before trying again.`
      };
    }

    // Remove expired requests
    const windowMs = this.config.rateLimiting.windowMs;
    userState.requests = userState.requests.filter(
      req => now.getTime() - req.timestamp.getTime() < windowMs
    );

    // Check rate limit
    if (userState.requests.length >= this.config.rateLimiting.maxRequests) {
      // Block user temporarily
      userState.isBlocked = true;
      userState.blockedUntil = new Date(now.getTime() + windowMs);
      userState.warningsSent++;

      // Escalate blocks for repeated violations
      const blockDuration = Math.min(windowMs * Math.pow(2, userState.warningsSent - 1), 3600000); // Max 1 hour
      userState.blockedUntil = new Date(now.getTime() + blockDuration);

      return {
        allowed: false,
        message: `Rate limit exceeded. You are temporarily blocked for ${Math.ceil(blockDuration / 1000)} seconds.`
      };
    }

    // Add current request
    userState.requests.push({
      timestamp: now,
      endpoint
    });

    // Reset block status if user is behaving well
    if (userState.isBlocked && (!userState.blockedUntil || now >= userState.blockedUntil)) {
      userState.isBlocked = false;
      userState.blockedUntil = undefined;
    }

    return { allowed: true };
  }

  public async checkCommandPermissions(user: TelegramUser, command: TelegramCommand): Promise<boolean> {
    // Admin users can use all commands
    if (user.permissions.isAdmin) {
      return true;
    }

    // Check each required permission
    for (const permission of command.permissions) {
      if (!this.hasPermission(user, permission)) {
        return false;
      }
    }

    return true;
  }

  private hasPermission(user: TelegramUser, permission: string): boolean {
    switch (permission) {
      case 'canReceiveReports':
        return user.permissions.canReceiveReports;
      case 'canExecuteTrades':
        return user.permissions.canExecuteTrades;
      case 'canViewPortfolio':
        return user.permissions.canViewPortfolio;
      case 'canModifySettings':
        return user.permissions.canModifySettings;
      case 'canAccessAnalytics':
        return user.permissions.canAccessAnalytics;
      case 'isAdmin':
        return user.permissions.isAdmin;
      default:
        return false;
    }
  }

  private isTradeCommand(text?: string): boolean {
    if (!text) return false;
    
    const tradeCommands = ['/trade', '/buy', '/sell', '/close'];
    return tradeCommands.some(cmd => text.toLowerCase().startsWith(cmd));
  }

  private cleanupRateLimit(): void {
    const now = new Date();
    const staleTime = 3600000; // 1 hour

    for (const [userId, state] of this.rateLimitMap.entries()) {
      // Remove old requests
      state.requests = state.requests.filter(
        req => now.getTime() - req.timestamp.getTime() < staleTime
      );

      // Remove stale entries
      if (state.requests.length === 0 && 
          (!state.blockedUntil || now >= state.blockedUntil)) {
        this.rateLimitMap.delete(userId);
      }
    }
  }

  public blockUser(userId: number, duration?: number): void {
    if (duration) {
      const state = this.rateLimitMap.get(userId) || {
        userId,
        requests: [],
        isBlocked: false,
        warningsSent: 0
      };

      state.isBlocked = true;
      state.blockedUntil = new Date(Date.now() + duration);
      this.rateLimitMap.set(userId, state);
    } else {
      this.blockedUsers.add(userId);
    }
  }

  public unblockUser(userId: number): void {
    this.blockedUsers.delete(userId);
    
    const state = this.rateLimitMap.get(userId);
    if (state) {
      state.isBlocked = false;
      state.blockedUntil = undefined;
    }
  }

  public getUserRateLimitState(userId: number): TelegramRateLimitState | undefined {
    return this.rateLimitMap.get(userId);
  }

  public async logSecurityEvent(userId: number, event: string, details: any): Promise<void> {
    try {
      await this.supabase
        .from('telegram_security_events')
        .insert({
          user_id: userId,
          event_type: event,
          details: details,
          timestamp: new Date(),
          ip_address: null, // Could be added if available
          user_agent: null
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  public async isUserAdmin(userId: number): Promise<boolean> {
    return this.config.adminUsers.includes(userId);
  }

  public async validateBotFeature(feature: string): Promise<boolean> {
    switch (feature) {
      case 'trading':
        return this.config.features.tradingEnabled;
      case 'reporting':
        return this.config.features.reportingEnabled;
      case 'analytics':
        return this.config.features.analyticsEnabled;
      case 'admin':
        return this.config.features.adminCommandsEnabled;
      default:
        return false;
    }
  }

  public async updateUserActivity(userId: number): Promise<void> {
    try {
      await this.supabase
        .from('telegram_users')
        .update({ last_active: new Date() })
        .eq('telegram_id', userId);
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }

  public getRateLimitStats(): { totalUsers: number; blockedUsers: number; activeRequests: number } {
    let totalRequests = 0;
    let blockedCount = 0;

    for (const state of this.rateLimitMap.values()) {
      totalRequests += state.requests.length;
      if (state.isBlocked) blockedCount++;
    }

    return {
      totalUsers: this.rateLimitMap.size,
      blockedUsers: blockedCount + this.blockedUsers.size,
      activeRequests: totalRequests
    };
  }
}