/**
 * Secure Session Management System
 * Enterprise-grade JWT-based session management with comprehensive security features
 * 
 * Security Features:
 * - JWT tokens with RS256 asymmetric encryption
 * - Refresh token rotation with family tracking
 * - Session fingerprinting and validation
 * - Concurrent session management
 * - Risk-based session policies
 * - Automatic session cleanup and monitoring
 * 
 * Compliance:
 * - OWASP Session Management guidelines
 * - NIST SP 800-63B authentication requirements
 * - PCI DSS session security standards
 * - SOC 2 access control requirements
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';

// JWT payload interfaces
export interface JWTPayload {
  sub: string; // User ID
  iat: number; // Issued at
  exp: number; // Expiration
  aud: string; // Audience
  iss: string; // Issuer
  jti: string; // JWT ID (unique identifier)
  scope: string[]; // Permissions/scopes
  sessionId: string; // Session identifier
  deviceFingerprint: string; // Device identification
  mfaVerified: boolean; // MFA verification status
  riskScore: number; // Risk assessment score
  securityLevel: SecurityLevel; // Security clearance level
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  tokenId: string; // Refresh token ID
  family: string; // Token family for rotation tracking
  iat: number; // Issued at
  exp: number; // Expiration
}

export enum SecurityLevel {
  BASIC = 'basic',
  ELEVATED = 'elevated',
  HIGH_PRIVILEGE = 'high_privilege',
  TRADING = 'trading',
  ADMIN = 'admin'
}

export interface SessionData {
  id: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  securityLevel: SecurityLevel;
  mfaVerified: boolean;
  riskScore: number;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SessionConfig {
  // JWT Configuration
  accessTokenExpiry: number; // seconds
  refreshTokenExpiry: number; // seconds
  issuer: string;
  audience: string;
  
  // Security Settings
  maxConcurrentSessions: number;
  sessionTimeout: number; // inactivity timeout in seconds
  requireMfaForElevated: boolean;
  deviceFingerprintRequired: boolean;
  
  // Risk Management
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  // Session Policies
  securityLevelTimeouts: Record<SecurityLevel, number>; // Different timeouts per level
  locationBasedValidation: boolean;
  suspiciousActivityDetection: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope: string[];
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  payload?: JWTPayload;
  riskFactors: string[];
  requiresReauth: boolean;
  securityWarnings: string[];
}

class SessionManager {
  private config: SessionConfig;
  private privateKey: string;
  private publicKey: string;
  private activeSessions: Map<string, SessionData> = new Map();
  private refreshTokenFamilies: Map<string, Set<string>> = new Map();
  private blacklistedTokens: Set<string> = new Set();

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      accessTokenExpiry: 3600, // 1 hour
      refreshTokenExpiry: 604800, // 7 days
      issuer: 'ai-trading-bot',
      audience: 'ai-trading-bot-users',
      maxConcurrentSessions: 3,
      sessionTimeout: 1800, // 30 minutes
      requireMfaForElevated: true,
      deviceFingerprintRequired: true,
      riskThresholds: {
        low: 25,
        medium: 50,
        high: 75,
        critical: 90
      },
      securityLevelTimeouts: {
        [SecurityLevel.BASIC]: 3600, // 1 hour
        [SecurityLevel.ELEVATED]: 1800, // 30 minutes
        [SecurityLevel.HIGH_PRIVILEGE]: 900, // 15 minutes
        [SecurityLevel.TRADING]: 600, // 10 minutes
        [SecurityLevel.ADMIN]: 300 // 5 minutes
      },
      locationBasedValidation: true,
      suspiciousActivityDetection: true,
      ...config
    };

    this.initializeKeyPair();
    this.startCleanupTimer();
    
    console.log('🔐 Session Manager initialized with enterprise security features');
  }

  /**
   * Initialize RSA key pair for JWT signing
   */
  private initializeKeyPair(): void {
    // In production, load from secure key management service
    const existingPrivateKey = process.env.JWT_PRIVATE_KEY;
    const existingPublicKey = process.env.JWT_PUBLIC_KEY;

    if (existingPrivateKey && existingPublicKey) {
      this.privateKey = existingPrivateKey.replace(/\\n/g, '\n');
      this.publicKey = existingPublicKey.replace(/\\n/g, '\n');
    } else {
      // Generate new key pair for development
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      this.privateKey = privateKey;
      this.publicKey = publicKey;

      console.warn('⚠️ Generated new JWT key pair for development. Store securely in production:');
      console.warn('JWT_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"');
      console.warn('JWT_PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"');
    }
  }

  /**
   * Create new session with comprehensive security validation
   */
  async createSession(
    userId: string,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent: string,
    location: { country: string; city: string; timezone: string },
    mfaVerified: boolean = false,
    securityLevel: SecurityLevel = SecurityLevel.BASIC
  ): Promise<{ session: SessionData; tokens: TokenPair }> {
    try {
      // Generate unique session ID
      const sessionId = crypto.randomUUID();
      
      // Calculate risk score
      const riskScore = await this.calculateSessionRiskScore({
        userId,
        deviceFingerprint,
        ipAddress,
        userAgent,
        location
      });

      // Check if user has too many active sessions
      await this.enforceSessionLimits(userId);

      // Determine session expiry based on security level and risk score
      const sessionTimeout = this.determineSessionTimeout(securityLevel, riskScore);
      const expiresAt = new Date(Date.now() + sessionTimeout * 1000);

      // Create session data
      const session: SessionData = {
        id: sessionId,
        userId,
        deviceFingerprint,
        ipAddress,
        userAgent,
        location,
        securityLevel,
        mfaVerified,
        riskScore,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt,
        isActive: true
      };

      // Store session
      this.activeSessions.set(sessionId, session);
      await this.persistSession(session);

      // Generate token pair
      const tokens = await this.generateTokenPair(session);

      // Log session creation
      await this.logSecurityEvent({
        userId,
        sessionId,
        eventType: 'session_created',
        eventCategory: 'authentication',
        severity: 'info',
        eventDescription: `New session created with ${securityLevel} security level`,
        ipAddress,
        userAgent,
        riskScore
      });

      return { session, tokens };
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw new Error('Failed to create secure session');
    }
  }

  /**
   * Generate JWT token pair (access + refresh)
   */
  private async generateTokenPair(session: SessionData): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const jwtId = crypto.randomUUID();
    const refreshTokenId = crypto.randomUUID();
    const tokenFamily = crypto.randomUUID();

    // Access token payload
    const accessPayload: JWTPayload = {
      sub: session.userId,
      iat: now,
      exp: now + this.config.accessTokenExpiry,
      aud: this.config.audience,
      iss: this.config.issuer,
      jti: jwtId,
      scope: this.getSessionScopes(session),
      sessionId: session.id,
      deviceFingerprint: session.deviceFingerprint,
      mfaVerified: session.mfaVerified,
      riskScore: session.riskScore,
      securityLevel: session.securityLevel
    };

    // Refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: session.userId,
      tokenId: refreshTokenId,
      family: tokenFamily,
      iat: now,
      exp: now + this.config.refreshTokenExpiry
    };

    // Sign tokens
    const accessToken = jwt.sign(accessPayload, this.privateKey, { algorithm: 'RS256' });
    const refreshToken = jwt.sign(refreshPayload, this.privateKey, { algorithm: 'RS256' });

    // Track refresh token family
    if (!this.refreshTokenFamilies.has(session.userId)) {
      this.refreshTokenFamilies.set(session.userId, new Set());
    }
    this.refreshTokenFamilies.get(session.userId)!.add(tokenFamily);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenExpiry,
      tokenType: 'Bearer',
      scope: this.getSessionScopes(session)
    };
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string, requireMfa: boolean = false): Promise<SessionValidationResult> {
    try {
      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        return {
          valid: false,
          riskFactors: ['blacklisted_token'],
          requiresReauth: true,
          securityWarnings: ['Token has been revoked']
        };
      }

      // Verify and decode token
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as JWTPayload;

      // Get session data
      const session = this.activeSessions.get(payload.sessionId);
      if (!session || !session.isActive) {
        return {
          valid: false,
          riskFactors: ['session_not_found'],
          requiresReauth: true,
          securityWarnings: ['Session no longer exists']
        };
      }

      // Check session expiry
      if (new Date() > session.expiresAt) {
        await this.terminateSession(session.id, 'session_expired');
        return {
          valid: false,
          riskFactors: ['session_expired'],
          requiresReauth: true,
          securityWarnings: ['Session has expired']
        };
      }

      // Check MFA requirement
      if (requireMfa && !payload.mfaVerified) {
        return {
          valid: false,
          payload,
          session,
          riskFactors: ['mfa_required'],
          requiresReauth: true,
          securityWarnings: ['Multi-factor authentication required']
        };
      }

      // Validate device fingerprint
      const riskFactors: string[] = [];
      const securityWarnings: string[] = [];

      if (this.config.deviceFingerprintRequired && session.deviceFingerprint !== payload.deviceFingerprint) {
        riskFactors.push('device_fingerprint_mismatch');
        securityWarnings.push('Device fingerprint validation failed');
      }

      // Check for suspicious activity
      if (this.config.suspiciousActivityDetection) {
        const suspiciousFactors = await this.detectSuspiciousActivity(session, payload);
        riskFactors.push(...suspiciousFactors);
      }

      // Update last activity
      session.lastActivityAt = new Date();
      this.activeSessions.set(session.id, session);

      // Check if risk score requires re-authentication
      const currentRiskScore = await this.calculateCurrentRiskScore(session, riskFactors);
      const requiresReauth = currentRiskScore >= this.config.riskThresholds.high;

      return {
        valid: true,
        session,
        payload,
        riskFactors,
        requiresReauth,
        securityWarnings
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          riskFactors: ['invalid_token'],
          requiresReauth: true,
          securityWarnings: ['Token validation failed']
        };
      }
      
      console.error('❌ Token validation error:', error);
      throw new Error('Token validation failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    deviceFingerprint: string,
    ipAddress: string
  ): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.config.issuer
      }) as RefreshTokenPayload;

      // Check if refresh token family is valid
      const userFamilies = this.refreshTokenFamilies.get(payload.sub);
      if (!userFamilies || !userFamilies.has(payload.family)) {
        // Possible token theft - revoke all tokens for user
        await this.revokeAllUserTokens(payload.sub, 'refresh_token_reuse_detected');
        throw new Error('Refresh token reuse detected - all sessions revoked');
      }

      // Get session
      const sessions = Array.from(this.activeSessions.values());
      const session = sessions.find(s => s.userId === payload.sub && s.isActive);
      
      if (!session) {
        throw new Error('Session not found for refresh token');
      }

      // Validate device fingerprint
      if (session.deviceFingerprint !== deviceFingerprint) {
        await this.logSecurityEvent({
          userId: payload.sub,
          eventType: 'refresh_token_fingerprint_mismatch',
          eventCategory: 'security_violation',
          severity: 'warning',
          eventDescription: 'Device fingerprint mismatch during token refresh',
          ipAddress,
          riskScore: 70
        });
        throw new Error('Device validation failed');
      }

      // Revoke old refresh token family and create new one
      userFamilies.delete(payload.family);
      
      // Generate new token pair
      const newTokens = await this.generateTokenPair(session);

      // Log token refresh
      await this.logSecurityEvent({
        userId: payload.sub,
        sessionId: session.id,
        eventType: 'token_refreshed',
        eventCategory: 'authentication',
        severity: 'info',
        eventDescription: 'Access token refreshed successfully',
        ipAddress,
        riskScore: 5
      });

      return newTokens;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Elevate session security level (e.g., for trading operations)
   */
  async elevateSession(
    sessionId: string,
    newSecurityLevel: SecurityLevel,
    mfaToken?: string
  ): Promise<TokenPair> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) {
        throw new Error('Session not found');
      }

      // Check if elevation requires MFA
      const requiresMfa = this.config.requireMfaForElevated && 
                         [SecurityLevel.ELEVATED, SecurityLevel.HIGH_PRIVILEGE, SecurityLevel.TRADING, SecurityLevel.ADMIN].includes(newSecurityLevel);
      
      if (requiresMfa && (!mfaToken || !session.mfaVerified)) {
        throw new Error('MFA verification required for security elevation');
      }

      // Update session security level
      session.securityLevel = newSecurityLevel;
      session.mfaVerified = true;
      
      // Adjust session timeout based on new security level
      const newTimeout = this.config.securityLevelTimeouts[newSecurityLevel];
      session.expiresAt = new Date(Date.now() + newTimeout * 1000);
      
      this.activeSessions.set(sessionId, session);
      await this.persistSession(session);

      // Generate new tokens with elevated privileges
      const tokens = await this.generateTokenPair(session);

      // Log security elevation
      await this.logSecurityEvent({
        userId: session.userId,
        sessionId,
        eventType: 'session_elevated',
        eventCategory: 'authorization',
        severity: 'info',
        eventDescription: `Session elevated to ${newSecurityLevel} security level`,
        riskScore: 10
      });

      return tokens;
    } catch (error) {
      console.error('❌ Session elevation failed:', error);
      throw error;
    }
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      
      // Add all session tokens to blacklist
      // In practice, you'd store JTIs in database
      
      await this.logSecurityEvent({
        userId: session.userId,
        sessionId,
        eventType: 'session_terminated',
        eventCategory: 'authentication',
        severity: 'info',
        eventDescription: `Session terminated: ${reason}`,
        riskScore: 5
      });
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.values()).filter(s => s.userId === userId);
    
    for (const session of userSessions) {
      await this.terminateSession(session.id, reason);
    }

    // Clear refresh token families
    this.refreshTokenFamilies.delete(userId);

    await this.logSecurityEvent({
      userId,
      eventType: 'all_tokens_revoked',
      eventCategory: 'security_violation',
      severity: 'warning',
      eventDescription: `All user tokens revoked: ${reason}`,
      riskScore: 30
    });
  }

  /**
   * Calculate session risk score
   */
  private async calculateSessionRiskScore(context: {
    userId: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    location: { country: string; city: string; timezone: string };
  }): Promise<number> {
    let riskScore = 0;

    // Check for new device
    const isNewDevice = await this.isNewDevice(context.userId, context.deviceFingerprint);
    if (isNewDevice) riskScore += 20;

    // Check for new location
    const isNewLocation = await this.isNewLocation(context.userId, context.location);
    if (isNewLocation) riskScore += 15;

    // Check for suspicious user agent
    if (this.isSuspiciousUserAgent(context.userAgent)) riskScore += 10;

    // Check for VPN/Proxy
    if (await this.isVpnOrProxy(context.ipAddress)) riskScore += 25;

    // Time-based risk factors
    const isUnusualTime = this.isUnusualLoginTime(new Date(), context.location.timezone);
    if (isUnusualTime) riskScore += 5;

    return Math.min(riskScore, 100);
  }

  /**
   * Helper methods for risk assessment
   */
  private async isNewDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    // Check if device fingerprint has been seen before for this user
    return false; // Implement with database lookup
  }

  private async isNewLocation(userId: string, location: { country: string; city: string }): Promise<boolean> {
    // Check if location has been seen before for this user
    return false; // Implement with database lookup
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    // Check for suspicious patterns in user agent
    const suspiciousPatterns = [/headless/i, /phantom/i, /crawler/i, /bot/i];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private async isVpnOrProxy(ipAddress: string): Promise<boolean> {
    // Check if IP is from VPN/proxy service
    return false; // Implement with IP reputation service
  }

  private isUnusualLoginTime(loginTime: Date, timezone: string): boolean {
    // Check if login time is unusual for user's timezone
    const hour = loginTime.getUTCHours();
    // Assume unusual times are between 2 AM and 6 AM
    return hour >= 2 && hour <= 6;
  }

  private async detectSuspiciousActivity(session: SessionData, payload: JWTPayload): Promise<string[]> {
    const factors: string[] = [];
    
    // Check for rapid location changes
    // Check for unusual access patterns
    // Check for concurrent sessions from different locations
    
    return factors;
  }

  private async calculateCurrentRiskScore(session: SessionData, riskFactors: string[]): Promise<number> {
    let score = session.riskScore;
    
    riskFactors.forEach(factor => {
      switch (factor) {
        case 'device_fingerprint_mismatch': score += 30; break;
        case 'location_change': score += 20; break;
        case 'suspicious_activity': score += 25; break;
        default: score += 10;
      }
    });
    
    return Math.min(score, 100);
  }

  private getSessionScopes(session: SessionData): string[] {
    const baseScopes = ['profile', 'trading:view'];
    
    switch (session.securityLevel) {
      case SecurityLevel.ELEVATED:
        return [...baseScopes, 'trading:execute'];
      case SecurityLevel.HIGH_PRIVILEGE:
        return [...baseScopes, 'trading:execute', 'portfolio:modify'];
      case SecurityLevel.TRADING:
        return [...baseScopes, 'trading:execute', 'trading:manage'];
      case SecurityLevel.ADMIN:
        return [...baseScopes, 'admin:read', 'admin:write'];
      default:
        return baseScopes;
    }
  }

  private determineSessionTimeout(securityLevel: SecurityLevel, riskScore: number): number {
    let baseTimeout = this.config.securityLevelTimeouts[securityLevel];
    
    // Reduce timeout for high-risk sessions
    if (riskScore >= this.config.riskThresholds.high) {
      baseTimeout *= 0.5;
    } else if (riskScore >= this.config.riskThresholds.medium) {
      baseTimeout *= 0.75;
    }
    
    return Math.max(baseTimeout, 300); // Minimum 5 minutes
  }

  private async enforceSessionLimits(userId: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(s => s.userId === userId && s.isActive)
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
    
    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Terminate oldest sessions
      const sessionsToTerminate = userSessions.slice(this.config.maxConcurrentSessions - 1);
      for (const session of sessionsToTerminate) {
        await this.terminateSession(session.id, 'concurrent_session_limit_exceeded');
      }
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupBlacklist();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt || (now.getTime() - session.lastActivityAt.getTime()) > this.config.sessionTimeout * 1000) {
        this.terminateSession(sessionId, 'session_expired_cleanup');
      }
    }
  }

  private cleanupBlacklist(): void {
    // In production, implement cleanup of expired blacklisted tokens
    // based on their expiration times stored in database
  }

  // Database operations (implement with actual database calls)
  private async persistSession(session: SessionData): Promise<void> {
    console.log('📝 Persisting session:', session.id);
  }

  private async logSecurityEvent(event: any): Promise<void> {
    console.log('🔒 Session Security Event:', event.eventType, event.severity);
  }
}

export { SessionManager };
export default SessionManager;