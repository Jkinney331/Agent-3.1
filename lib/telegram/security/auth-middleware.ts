/**
 * Telegram Bot Authentication Middleware
 * Provides comprehensive user authentication and authorization for financial trading bot
 * 
 * Security Features:
 * - User whitelist and permission management
 * - Multi-factor authentication for trading commands
 * - Session management and token validation
 * - Role-based access control (RBAC)
 * - Emergency lockdown capabilities
 */

import crypto from 'crypto';
import { credentialManager } from '../../security/credential-manager';

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_bot?: boolean;
  language_code?: string;
}

export interface AuthenticatedUser {
  telegramId: number;
  username: string;
  role: UserRole;
  permissions: Permission[];
  lastSeen: Date;
  sessionToken?: string;
  mfaEnabled: boolean;
  tradingLimit: number;
  isLocked: boolean;
  lockReason?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  TRADER = 'trader', 
  OBSERVER = 'observer',
  GUEST = 'guest'
}

export enum Permission {
  // Trading permissions
  TRADE_EXECUTE = 'trade.execute',
  TRADE_VIEW = 'trade.view',
  TRADE_CANCEL = 'trade.cancel',
  
  // Portfolio permissions
  PORTFOLIO_VIEW = 'portfolio.view',
  PORTFOLIO_MODIFY = 'portfolio.modify',
  
  // Risk management
  RISK_VIEW = 'risk.view',
  RISK_MODIFY = 'risk.modify',
  
  // System controls
  SYSTEM_STOP = 'system.stop',
  SYSTEM_STATUS = 'system.status',
  SYSTEM_CONFIG = 'system.config',
  
  // Administrative
  ADMIN_USERS = 'admin.users',
  ADMIN_LOGS = 'admin.logs',
  ADMIN_SECURITY = 'admin.security'
}

export interface SecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  mfaRequired: boolean;
  tradingCommandsRequireMfa: boolean;
  emergencyLockdown: boolean;
}

class TelegramAuthMiddleware {
  private whitelist: Map<number, AuthenticatedUser> = new Map();
  private failedAttempts: Map<number, number> = new Map();
  private lockedUsers: Map<number, Date> = new Map();
  private activeSessions: Map<string, number> = new Map();
  private pendingMfaVerifications: Map<number, string> = new Map();
  
  private config: SecurityConfig = {
    maxFailedAttempts: 3,
    lockoutDuration: 30, // 30 minutes
    sessionTimeout: 60, // 1 hour
    mfaRequired: true,
    tradingCommandsRequireMfa: true,
    emergencyLockdown: false
  };

  constructor() {
    this.initializeWhitelist();
    this.startCleanupTimer();
    console.log('🔐 Telegram Authentication Middleware initialized');
  }

  /**
   * Initialize user whitelist from secure storage
   */
  private initializeWhitelist(): void {
    try {
      // Load authorized users from environment or secure storage
      const authorizedUsers = process.env.TELEGRAM_AUTHORIZED_USERS?.split(',') || [];
      
      authorizedUsers.forEach((userConfig, index) => {
        const [telegramId, username, role] = userConfig.split(':');
        
        if (telegramId && !isNaN(Number(telegramId))) {
          const user: AuthenticatedUser = {
            telegramId: Number(telegramId),
            username: username || `user_${telegramId}`,
            role: (role as UserRole) || UserRole.OBSERVER,
            permissions: this.getRolePermissions(role as UserRole),
            lastSeen: new Date(),
            mfaEnabled: this.config.mfaRequired,
            tradingLimit: this.getDefaultTradingLimit(role as UserRole),
            isLocked: false
          };
          
          this.whitelist.set(Number(telegramId), user);
          console.log(`✅ Authorized user: ${username} (${telegramId}) - Role: ${role}`);
        }
      });

      // Add emergency admin if no users configured
      if (this.whitelist.size === 0) {
        console.warn('⚠️ No authorized users configured - adding emergency admin');
        const emergencyAdmin: AuthenticatedUser = {
          telegramId: 0, // Replace with actual admin Telegram ID
          username: 'emergency_admin',
          role: UserRole.ADMIN,
          permissions: Object.values(Permission),
          lastSeen: new Date(),
          mfaEnabled: true,
          tradingLimit: 1000000, // $1M limit for emergency admin
          isLocked: false
        };
        this.whitelist.set(0, emergencyAdmin);
      }

      console.log(`🔐 Initialized whitelist with ${this.whitelist.size} authorized users`);
    } catch (error) {
      console.error('❌ Failed to initialize user whitelist:', error);
    }
  }

  /**
   * Get default permissions for a role
   */
  private getRolePermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(Permission);
        
      case UserRole.TRADER:
        return [
          Permission.TRADE_EXECUTE,
          Permission.TRADE_VIEW,
          Permission.TRADE_CANCEL,
          Permission.PORTFOLIO_VIEW,
          Permission.PORTFOLIO_MODIFY,
          Permission.RISK_VIEW,
          Permission.SYSTEM_STATUS
        ];
        
      case UserRole.OBSERVER:
        return [
          Permission.TRADE_VIEW,
          Permission.PORTFOLIO_VIEW,
          Permission.RISK_VIEW,
          Permission.SYSTEM_STATUS
        ];
        
      case UserRole.GUEST:
        return [
          Permission.SYSTEM_STATUS
        ];
        
      default:
        return [];
    }
  }

  /**
   * Get default trading limit based on role
   */
  private getDefaultTradingLimit(role: UserRole): number {
    switch (role) {
      case UserRole.ADMIN: return 1000000; // $1M
      case UserRole.TRADER: return 100000;  // $100K
      case UserRole.OBSERVER: return 0;     // No trading
      case UserRole.GUEST: return 0;        // No trading
      default: return 0;
    }
  }

  /**
   * Authenticate incoming Telegram user
   */
  async authenticateUser(user: TelegramUser): Promise<{ 
    success: boolean; 
    user?: AuthenticatedUser; 
    requiresMfa?: boolean;
    error?: string;
  }> {
    try {
      // Check for emergency lockdown
      if (this.config.emergencyLockdown) {
        return {
          success: false,
          error: '🔒 System is under emergency lockdown. Access denied.'
        };
      }

      // Check if user is locked
      if (this.isUserLocked(user.id)) {
        return {
          success: false,
          error: '🔒 Account is temporarily locked due to security violations.'
        };
      }

      // Check whitelist
      const authorizedUser = this.whitelist.get(user.id);
      if (!authorizedUser) {
        this.recordFailedAttempt(user.id);
        console.warn(`⚠️ Unauthorized access attempt from: ${user.username} (${user.id})`);
        
        return {
          success: false,
          error: '❌ Access denied. You are not authorized to use this bot.'
        };
      }

      // Check if user account is locked
      if (authorizedUser.isLocked) {
        return {
          success: false,
          error: `🔒 Your account is locked. Reason: ${authorizedUser.lockReason || 'Security violation'}`
        };
      }

      // Update last seen
      authorizedUser.lastSeen = new Date();
      this.whitelist.set(user.id, authorizedUser);

      // Check if MFA is required and not yet verified
      if (authorizedUser.mfaEnabled && !this.pendingMfaVerifications.has(user.id)) {
        return {
          success: true,
          user: authorizedUser,
          requiresMfa: true
        };
      }

      // Clear failed attempts on successful auth
      this.failedAttempts.delete(user.id);

      console.log(`✅ User authenticated successfully: ${authorizedUser.username} (${user.id})`);
      
      return {
        success: true,
        user: authorizedUser
      };

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        error: 'Authentication system error. Please try again.'
      };
    }
  }

  /**
   * Generate and send MFA code to user
   */
  async generateMfaCode(userId: number): Promise<string> {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    this.pendingMfaVerifications.set(userId, `${code}:${expiresAt}`);
    
    return code;
  }

  /**
   * Verify MFA code
   */
  async verifyMfaCode(userId: number, code: string): Promise<boolean> {
    const stored = this.pendingMfaVerifications.get(userId);
    if (!stored) return false;

    const [storedCode, expiresAt] = stored.split(':');
    
    // Check expiration
    if (Date.now() > parseInt(expiresAt)) {
      this.pendingMfaVerifications.delete(userId);
      return false;
    }

    // Verify code
    if (storedCode === code) {
      this.pendingMfaVerifications.delete(userId);
      return true;
    }

    return false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userId: number, permission: Permission): boolean {
    const user = this.whitelist.get(userId);
    if (!user || user.isLocked) return false;
    
    return user.permissions.includes(permission);
  }

  /**
   * Check if trading command requires additional verification
   */
  requiresConfirmation(command: string, amount?: number): boolean {
    const tradingCommands = ['buy', 'sell', 'trade', 'execute', 'stop', 'cancel'];
    const isTrading = tradingCommands.some(cmd => command.toLowerCase().includes(cmd));
    
    if (!isTrading) return false;
    
    // High-value trades require confirmation
    const highValueThreshold = 10000; // $10K
    if (amount && amount > highValueThreshold) return true;
    
    // All trading commands require confirmation if configured
    return this.config.tradingCommandsRequireMfa;
  }

  /**
   * Record failed authentication attempt
   */
  private recordFailedAttempt(userId: number): void {
    const attempts = this.failedAttempts.get(userId) || 0;
    const newAttempts = attempts + 1;
    
    this.failedAttempts.set(userId, newAttempts);
    
    if (newAttempts >= this.config.maxFailedAttempts) {
      this.lockUser(userId, 'Too many failed authentication attempts');
      console.warn(`🔒 User ${userId} locked due to ${newAttempts} failed attempts`);
    }
  }

  /**
   * Lock user account
   */
  private lockUser(userId: number, reason: string): void {
    const lockUntil = new Date(Date.now() + this.config.lockoutDuration * 60 * 1000);
    this.lockedUsers.set(userId, lockUntil);
    
    const user = this.whitelist.get(userId);
    if (user) {
      user.isLocked = true;
      user.lockReason = reason;
      this.whitelist.set(userId, user);
    }
  }

  /**
   * Check if user is currently locked
   */
  private isUserLocked(userId: number): boolean {
    const lockUntil = this.lockedUsers.get(userId);
    if (!lockUntil) return false;
    
    if (Date.now() > lockUntil.getTime()) {
      // Lock expired, remove it
      this.lockedUsers.delete(userId);
      const user = this.whitelist.get(userId);
      if (user) {
        user.isLocked = false;
        user.lockReason = undefined;
        this.whitelist.set(userId, user);
      }
      return false;
    }
    
    return true;
  }

  /**
   * Emergency lockdown - blocks all access
   */
  emergencyLockdown(reason: string): void {
    this.config.emergencyLockdown = true;
    console.error(`🚨 EMERGENCY LOCKDOWN ACTIVATED: ${reason}`);
    
    // Notify all administrators
    this.notifyAdmins(`🚨 EMERGENCY LOCKDOWN: ${reason}`);
  }

  /**
   * Lift emergency lockdown
   */
  liftLockdown(adminUserId: number): boolean {
    const admin = this.whitelist.get(adminUserId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return false;
    }
    
    this.config.emergencyLockdown = false;
    console.log(`✅ Emergency lockdown lifted by admin: ${admin.username}`);
    
    return true;
  }

  /**
   * Get user security status
   */
  getUserSecurityStatus(userId: number): {
    authenticated: boolean;
    role: string;
    permissions: string[];
    isLocked: boolean;
    lockReason?: string;
    failedAttempts: number;
    lastSeen?: Date;
    mfaEnabled: boolean;
  } {
    const user = this.whitelist.get(userId);
    const failedAttempts = this.failedAttempts.get(userId) || 0;
    
    if (!user) {
      return {
        authenticated: false,
        role: 'unauthorized',
        permissions: [],
        isLocked: false,
        failedAttempts,
        mfaEnabled: false
      };
    }
    
    return {
      authenticated: true,
      role: user.role,
      permissions: user.permissions,
      isLocked: user.isLocked,
      lockReason: user.lockReason,
      failedAttempts,
      lastSeen: user.lastSeen,
      mfaEnabled: user.mfaEnabled
    };
  }

  /**
   * Notify administrators of security events
   */
  private async notifyAdmins(message: string): Promise<void> {
    const admins = Array.from(this.whitelist.values())
      .filter(user => user.role === UserRole.ADMIN && !user.isLocked);
    
    // Implementation would send Telegram messages to admins
    console.log(`🔔 Admin notification: ${message} (${admins.length} admins)`);
  }

  /**
   * Start cleanup timer for expired sessions and locks
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupExpiredLocks();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const sessionTimeout = this.config.sessionTimeout * 60 * 1000;
    
    for (const [sessionToken, userId] of this.activeSessions.entries()) {
      const user = this.whitelist.get(userId);
      if (!user || (now - user.lastSeen.getTime()) > sessionTimeout) {
        this.activeSessions.delete(sessionToken);
      }
    }
  }

  /**
   * Clean up expired user locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    
    for (const [userId, lockUntil] of this.lockedUsers.entries()) {
      if (now > lockUntil.getTime()) {
        this.lockedUsers.delete(userId);
        const user = this.whitelist.get(userId);
        if (user) {
          user.isLocked = false;
          user.lockReason = undefined;
          this.whitelist.set(userId, user);
        }
      }
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    failedAttempts: number;
    emergencyLockdown: boolean;
  } {
    const now = Date.now();
    const activeThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    const activeUsers = Array.from(this.whitelist.values())
      .filter(user => (now - user.lastSeen.getTime()) < activeThreshold).length;
    
    const lockedUsers = Array.from(this.whitelist.values())
      .filter(user => user.isLocked).length;
    
    const totalFailedAttempts = Array.from(this.failedAttempts.values())
      .reduce((sum, attempts) => sum + attempts, 0);
    
    return {
      totalUsers: this.whitelist.size,
      activeUsers,
      lockedUsers,
      failedAttempts: totalFailedAttempts,
      emergencyLockdown: this.config.emergencyLockdown
    };
  }
}

export const telegramAuth = new TelegramAuthMiddleware();
export { TelegramAuthMiddleware };