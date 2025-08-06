import { TradingBotContext, UserSession, TradingUser } from '../types';
import { Middleware } from 'telegraf';

/**
 * Session management middleware for Telegram trading bot
 * Handles user sessions, authentication, and state persistence
 */
export class SessionManager {
  private sessions: Map<number, UserSession> = new Map();
  private users: Map<number, TradingUser> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Session middleware
   */
  middleware(): Middleware<TradingBotContext> {
    return async (ctx, next) => {
      if (!ctx.from) {
        await next();
        return;
      }

      const telegramId = ctx.from.id;
      
      // Load or create session
      ctx.session = await this.getOrCreateSession(telegramId);
      
      // Load or create user
      ctx.user = await this.getOrCreateUser(ctx.from);
      
      // Update last activity
      ctx.session.lastActivity = new Date();
      ctx.user.lastActivity = new Date();
      
      // Save session after request
      await next();
      
      // Persist session changes
      await this.saveSession(telegramId, ctx.session);
      await this.saveUser(telegramId, ctx.user);
    };
  }

  /**
   * Get or create user session
   */
  private async getOrCreateSession(telegramId: number): Promise<UserSession> {
    let session = this.sessions.get(telegramId);
    
    if (!session || this.isSessionExpired(session)) {
      session = {
        userId: telegramId.toString(),
        telegramId,
        isAuthenticated: false,
        activeMenus: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        lastActivity: new Date()
      };
      
      this.sessions.set(telegramId, session);
    }
    
    return session;
  }

  /**
   * Get or create trading user
   */
  private async getOrCreateUser(telegramUser: any): Promise<TradingUser> {
    const telegramId = telegramUser.id;
    let user = this.users.get(telegramId);
    
    if (!user) {
      // Try to load from database
      user = await this.loadUserFromDatabase(telegramId);
      
      if (!user) {
        // Create new user
        user = {
          id: telegramId.toString(),
          telegramId,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          languageCode: telegramUser.language_code,
          isActive: true,
          isAuthenticated: false,
          tradingEnabled: false,
          subscriptionTier: 'FREE',
          joinedAt: new Date(),
          lastActivity: new Date(),
          settings: this.getDefaultSettings()
        };
        
        // Save to database
        await this.saveUserToDatabase(user);
      }
      
      this.users.set(telegramId, user);
    } else {
      // Update user info from Telegram
      user.username = telegramUser.username;
      user.firstName = telegramUser.first_name;
      user.lastName = telegramUser.last_name;
      user.languageCode = telegramUser.language_code;
    }
    
    return user;
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: UserSession): boolean {
    return new Date() > session.expiresAt;
  }

  /**
   * Save session to memory/cache
   */
  private async saveSession(telegramId: number, session: UserSession): Promise<void> {
    this.sessions.set(telegramId, { ...session });
    
    // In production, also save to Redis or database for persistence
    // await this.saveSessionToDatabase(session);
  }

  /**
   * Save user to memory and database
   */
  private async saveUser(telegramId: number, user: TradingUser): Promise<void> {
    this.users.set(telegramId, { ...user });
    await this.saveUserToDatabase(user);
  }

  /**
   * Load user from database
   */
  private async loadUserFromDatabase(telegramId: number): Promise<TradingUser | null> {
    try {
      // Mock database call - replace with actual implementation
      const response = await fetch(`/api/users/telegram/${telegramId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return {
          ...userData,
          joinedAt: new Date(userData.joinedAt),
          lastActivity: new Date(userData.lastActivity),
          settings: userData.settings || this.getDefaultSettings()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user from database:', error);
      return null;
    }
  }

  /**
   * Save user to database
   */
  private async saveUserToDatabase(user: TradingUser): Promise<void> {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    } catch (error) {
      console.error('Error saving user to database:', error);
    }
  }

  /**
   * Get default user settings
   */
  private getDefaultSettings(): any {
    return {
      notifications: {
        trades: true,
        profits: true,
        losses: true,
        riskAlerts: true,
        dailyReports: false,
        marketUpdates: true
      },
      display: {
        currency: 'USD',
        precision: 2,
        timezone: 'UTC',
        language: 'en'
      },
      alerts: {
        profitThreshold: 100,
        lossThreshold: -50,
        drawdownAlert: 10,
        dailyPnLAlert: true
      },
      privacy: {
        shareStats: false,
        publicProfile: false
      }
    };
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: number[] = [];
    
    for (const [telegramId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        expiredSessions.push(telegramId);
      }
    }
    
    expiredSessions.forEach(telegramId => {
      this.sessions.delete(telegramId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Authenticate user with trading credentials
   */
  async authenticateUser(telegramId: number, credentials: any): Promise<boolean> {
    try {
      // Validate credentials with trading service
      const isValid = await this.validateTradingCredentials(credentials);
      
      if (isValid) {
        const user = this.users.get(telegramId);
        const session = this.sessions.get(telegramId);
        
        if (user && session) {
          user.isAuthenticated = true;
          user.tradingEnabled = true;
          session.isAuthenticated = true;
          
          await this.saveUser(telegramId, user);
          await this.saveSession(telegramId, session);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /**
   * Validate trading credentials
   */
  private async validateTradingCredentials(credentials: any): Promise<boolean> {
    try {
      // Mock validation - replace with actual implementation
      const response = await fetch('/api/trading/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Credential validation error:', error);
      return false;
    }
  }

  /**
   * Log out user
   */
  async logoutUser(telegramId: number): Promise<void> {
    const user = this.users.get(telegramId);
    const session = this.sessions.get(telegramId);
    
    if (user && session) {
      user.isAuthenticated = false;
      user.tradingEnabled = false;
      session.isAuthenticated = false;
      session.currentCommand = undefined;
      session.commandState = undefined;
      
      await this.saveUser(telegramId, user);
      await this.saveSession(telegramId, session);
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(telegramId: number, settings: any): Promise<boolean> {
    try {
      const user = this.users.get(telegramId);
      
      if (user) {
        user.settings = { ...user.settings, ...settings };
        await this.saveUser(telegramId, user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating user settings:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  getSessionStats(): any {
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => !this.isSessionExpired(session)
    );
    
    const authenticatedUsers = Array.from(this.users.values()).filter(
      user => user.isAuthenticated
    );
    
    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      totalUsers: this.users.size,
      authenticatedUsers: authenticatedUsers.length,
      premiumUsers: Array.from(this.users.values()).filter(
        user => user.subscriptionTier === 'PREMIUM'
      ).length,
      proUsers: Array.from(this.users.values()).filter(
        user => user.subscriptionTier === 'PRO'
      ).length
    };
  }

  /**
   * Extend session expiry
   */
  extendSession(telegramId: number, hours: number = 24): void {
    const session = this.sessions.get(telegramId);
    
    if (session) {
      session.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      this.sessions.set(telegramId, session);
    }
  }

  /**
   * Set user command state
   */
  setCommandState(telegramId: number, command: string, state: any): void {
    const session = this.sessions.get(telegramId);
    
    if (session) {
      session.currentCommand = command;
      session.commandState = state;
      this.sessions.set(telegramId, session);
    }
  }

  /**
   * Clear user command state
   */
  clearCommandState(telegramId: number): void {
    const session = this.sessions.get(telegramId);
    
    if (session) {
      session.currentCommand = undefined;
      session.commandState = undefined;
      this.sessions.set(telegramId, session);
    }
  }

  /**
   * Check if user has subscription access
   */
  hasSubscriptionAccess(user: TradingUser, requiredTier: string): boolean {
    const tiers = { 'FREE': 0, 'PREMIUM': 1, 'PRO': 2 };
    const userTierLevel = tiers[user.subscriptionTier as keyof typeof tiers] || 0;
    const requiredTierLevel = tiers[requiredTier as keyof typeof tiers] || 0;
    
    return userTierLevel >= requiredTierLevel;
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(telegramId: number, command: string): boolean {
    const user = this.users.get(telegramId);
    
    if (!user) return false;
    
    // Simple rate limiting based on subscription tier
    const limits = {
      'FREE': 50,
      'PREMIUM': 500,
      'PRO': -1 // unlimited
    };
    
    const dailyLimit = limits[user.subscriptionTier as keyof typeof limits] || 50;
    
    if (dailyLimit === -1) return true; // unlimited
    
    // Check daily command count (would need to track in real implementation)
    // For now, always allow
    return true;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.sessions.clear();
    this.users.clear();
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();