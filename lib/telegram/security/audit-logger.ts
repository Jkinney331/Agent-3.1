/**
 * Telegram Bot Security Audit Logger
 * Comprehensive logging and monitoring for financial trading bot security
 * 
 * Security Features:
 * - Real-time security event logging
 * - Structured audit trails
 * - Sensitive data masking
 * - GDPR-compliant logging
 * - Security incident correlation
 * - Log integrity protection
 * - Automated threat detection
 * - Performance monitoring
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: number;
  username?: string;
  ip?: string;
  userAgent?: string;
  command?: string;
  parameters?: Record<string, any>;
  result: 'success' | 'failure' | 'blocked' | 'warning';
  message: string;
  details?: Record<string, any>;
  riskScore: number;
  tags: string[];
  sessionId?: string;
  correlationId?: string;
}

export enum SecurityEventType {
  // Authentication events
  AUTH_SUCCESS = 'auth.success',
  AUTH_FAILURE = 'auth.failure',
  AUTH_LOCKOUT = 'auth.lockout',
  MFA_SUCCESS = 'mfa.success',
  MFA_FAILURE = 'mfa.failure',
  
  // Authorization events
  ACCESS_GRANTED = 'access.granted',
  ACCESS_DENIED = 'access.denied',
  PERMISSION_ESCALATION = 'permission.escalation',
  
  // Trading events
  TRADE_EXECUTED = 'trade.executed',
  TRADE_BLOCKED = 'trade.blocked',
  TRADE_CANCELLED = 'trade.cancelled',
  LARGE_TRADE_ALERT = 'trade.large_amount',
  
  // Rate limiting events
  RATE_LIMIT_HIT = 'rate_limit.hit',
  RATE_LIMIT_BLOCKED = 'rate_limit.blocked',
  SUSPICIOUS_ACTIVITY = 'activity.suspicious',
  
  // Input validation events
  INPUT_VALIDATION_FAILED = 'input.validation_failed',
  MALICIOUS_INPUT_DETECTED = 'input.malicious',
  INJECTION_ATTEMPT = 'input.injection_attempt',
  
  // System events
  SYSTEM_START = 'system.start',
  SYSTEM_STOP = 'system.stop',
  EMERGENCY_LOCKDOWN = 'system.emergency_lockdown',
  CONFIG_CHANGED = 'system.config_changed',
  
  // Webhook events
  WEBHOOK_VALIDATION_FAILED = 'webhook.validation_failed',
  WEBHOOK_SIGNATURE_INVALID = 'webhook.signature_invalid',
  WEBHOOK_REPLAY_ATTACK = 'webhook.replay_attack',
  
  // Security events
  SECURITY_BREACH_DETECTED = 'security.breach_detected',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'security.unauthorized_access',
  DATA_EXFILTRATION_ATTEMPT = 'security.data_exfiltration'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogConfig {
  logDirectory: string;
  maxLogFileSize: number; // bytes
  maxLogFiles: number;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  remoteLogEndpoint?: string;
  logLevel: SecuritySeverity;
  enableLogIntegrity: boolean;
  encryptLogs: boolean;
  encryptionKey?: string;
  sensitiveDataMask: boolean;
  gdprCompliant: boolean;
  retentionDays: number;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  averageRiskScore: number;
  topRiskUsers: Array<{ userId: number; riskScore: number; eventCount: number }>;
  recentHighRiskEvents: SecurityEvent[];
  securityTrends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

class TelegramSecurityAuditLogger {
  private config: AuditLogConfig;
  private eventBuffer: SecurityEvent[] = [];
  private logFileHandle: any = null;
  private currentLogFile: string = '';
  private logIntegrityHash: string = '';
  private eventHistory: SecurityEvent[] = [];
  private metrics: SecurityMetrics;
  
  // Real-time threat detection patterns
  private threatPatterns: Map<string, number> = new Map();
  private userRiskScores: Map<number, number> = new Map();
  private correlationWindows: Map<string, SecurityEvent[]> = new Map();

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = {
      logDirectory: './logs/security',
      maxLogFileSize: 100 * 1024 * 1024, // 100MB
      maxLogFiles: 10,
      enableFileLogging: true,
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      logLevel: SecuritySeverity.LOW,
      enableLogIntegrity: true,
      encryptLogs: false,
      sensitiveDataMask: true,
      gdprCompliant: true,
      retentionDays: 90,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.initializeLogger();
    console.log('📋 Security Audit Logger initialized with enterprise-grade monitoring');
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): SecurityMetrics {
    return {
      totalEvents: 0,
      eventsByType: Object.values(SecurityEventType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<SecurityEventType, number>),
      eventsBySeverity: Object.values(SecuritySeverity).reduce((acc, severity) => {
        acc[severity] = 0;
        return acc;
      }, {} as Record<SecuritySeverity, number>),
      averageRiskScore: 0,
      topRiskUsers: [],
      recentHighRiskEvents: [],
      securityTrends: {
        hourly: new Array(24).fill(0),
        daily: new Array(7).fill(0),
        weekly: new Array(52).fill(0)
      }
    };
  }

  /**
   * Initialize logging system
   */
  private async initializeLogger(): Promise<void> {
    try {
      if (this.config.enableFileLogging) {
        await this.createLogDirectory();
        await this.initializeLogFile();
      }

      // Start periodic tasks
      this.startPeriodicTasks();
      
    } catch (error) {
      console.error('❌ Failed to initialize audit logger:', error);
    }
  }

  /**
   * Create log directory if it doesn't exist
   */
  private async createLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create log directory:', error);
    }
  }

  /**
   * Initialize log file
   */
  private async initializeLogFile(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.config.logDirectory, `security-${timestamp}.log`);
    
    // Rotate log file if it's too large
    await this.rotateLogFileIfNeeded();
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: this.generateEventId(),
        timestamp: Date.now(),
        ...event
      };

      // Mask sensitive data if enabled
      if (this.config.sensitiveDataMask) {
        this.maskSensitiveData(securityEvent);
      }

      // Update metrics
      this.updateMetrics(securityEvent);

      // Update user risk scores
      if (securityEvent.userId) {
        this.updateUserRiskScore(securityEvent.userId, securityEvent.riskScore);
      }

      // Store in event history
      this.eventHistory.push(securityEvent);
      
      // Correlate with recent events
      await this.correlateEvent(securityEvent);

      // Log to configured outputs
      await this.writeToOutputs(securityEvent);

      // Check for security alerts
      await this.checkSecurityAlerts(securityEvent);

      // Clean up old events
      this.cleanupOldEvents();

    } catch (error) {
      console.error('❌ Failed to log security event:', error);
    }
  }

  /**
   * Mask sensitive data in event
   */
  private maskSensitiveData(event: SecurityEvent): void {
    // Mask sensitive fields in parameters
    if (event.parameters) {
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey', 'apiSecret'];
      
      for (const field of sensitiveFields) {
        if (event.parameters[field]) {
          event.parameters[field] = this.maskValue(event.parameters[field]);
        }
      }
    }

    // Mask sensitive details
    if (event.details) {
      const sensitiveDetailFields = ['credentials', 'authorization', 'signature'];
      
      for (const field of sensitiveDetailFields) {
        if (event.details[field]) {
          event.details[field] = this.maskValue(event.details[field]);
        }
      }
    }

    // GDPR compliance - mask IP if required
    if (this.config.gdprCompliant && event.ip) {
      event.ip = this.maskIP(event.ip);
    }
  }

  /**
   * Mask sensitive value
   */
  private maskValue(value: any): string {
    const str = String(value);
    if (str.length <= 4) return '****';
    return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
  }

  /**
   * Mask IP address for GDPR compliance
   */
  private maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.***`;
    }
    return '***.***.***.***.***';
  }

  /**
   * Update security metrics
   */
  private updateMetrics(event: SecurityEvent): void {
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.type]++;
    this.metrics.eventsBySeverity[event.severity]++;
    
    // Update average risk score
    const totalRiskScore = this.eventHistory.reduce((sum, e) => sum + e.riskScore, 0);
    this.metrics.averageRiskScore = totalRiskScore / this.eventHistory.length;

    // Update trends
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const week = this.getWeekOfYear(now);
    
    this.metrics.securityTrends.hourly[hour]++;
    this.metrics.securityTrends.daily[day]++;
    this.metrics.securityTrends.weekly[week % 52]++;

    // Track high-risk events
    if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
      this.metrics.recentHighRiskEvents.unshift(event);
      this.metrics.recentHighRiskEvents = this.metrics.recentHighRiskEvents.slice(0, 50); // Keep last 50
    }
  }

  /**
   * Update user risk score
   */
  private updateUserRiskScore(userId: number, eventRiskScore: number): void {
    const currentScore = this.userRiskScores.get(userId) || 0;
    const newScore = Math.min(100, currentScore + eventRiskScore * 0.1); // Gradual increase
    this.userRiskScores.set(userId, newScore);

    // Decay risk scores over time
    setTimeout(() => {
      const decayedScore = Math.max(0, this.userRiskScores.get(userId)! * 0.95);
      this.userRiskScores.set(userId, decayedScore);
    }, 60 * 60 * 1000); // Decay after 1 hour
  }

  /**
   * Correlate event with recent events for pattern detection
   */
  private async correlateEvent(event: SecurityEvent): Promise<void> {
    const correlationWindow = 5 * 60 * 1000; // 5 minutes
    const correlationKey = `${event.userId || 'anonymous'}_${event.type}`;
    
    // Get recent events for correlation
    if (!this.correlationWindows.has(correlationKey)) {
      this.correlationWindows.set(correlationKey, []);
    }
    
    const recentEvents = this.correlationWindows.get(correlationKey)!;
    
    // Add current event
    recentEvents.push(event);
    
    // Remove old events outside correlation window
    const cutoff = Date.now() - correlationWindow;
    const filteredEvents = recentEvents.filter(e => e.timestamp > cutoff);
    this.correlationWindows.set(correlationKey, filteredEvents);

    // Detect patterns
    if (filteredEvents.length >= 5) {
      await this.detectSecurityPatterns(filteredEvents, event);
    }
  }

  /**
   * Detect security patterns in correlated events
   */
  private async detectSecurityPatterns(events: SecurityEvent[], currentEvent: SecurityEvent): Promise<void> {
    // Pattern 1: Rapid failed authentications
    const failedAuths = events.filter(e => 
      e.type === SecurityEventType.AUTH_FAILURE && e.result === 'failure'
    );
    
    if (failedAuths.length >= 3) {
      await this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
        userId: currentEvent.userId,
        result: 'warning',
        message: 'Pattern detected: Multiple failed authentication attempts',
        riskScore: 75,
        tags: ['pattern_detection', 'brute_force_attempt'],
        details: { pattern: 'rapid_failed_auth', eventCount: failedAuths.length }
      });
    }

    // Pattern 2: Command injection attempts
    const injectionAttempts = events.filter(e => 
      e.type === SecurityEventType.INJECTION_ATTEMPT
    );
    
    if (injectionAttempts.length >= 2) {
      await this.logSecurityEvent({
        type: SecurityEventType.SECURITY_BREACH_DETECTED,
        severity: SecuritySeverity.CRITICAL,
        userId: currentEvent.userId,
        ip: currentEvent.ip,
        result: 'blocked',
        message: 'Security breach detected: Multiple injection attempts',
        riskScore: 95,
        tags: ['security_breach', 'injection_attack'],
        details: { pattern: 'injection_attempts', eventCount: injectionAttempts.length }
      });
    }

    // Pattern 3: Unusual trading activity
    const tradingEvents = events.filter(e => 
      e.type === SecurityEventType.TRADE_EXECUTED || e.type === SecurityEventType.LARGE_TRADE_ALERT
    );
    
    if (tradingEvents.length >= 10) {
      await this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        userId: currentEvent.userId,
        result: 'warning',
        message: 'Pattern detected: Unusual trading activity volume',
        riskScore: 50,
        tags: ['pattern_detection', 'trading_anomaly'],
        details: { pattern: 'high_trading_volume', eventCount: tradingEvents.length }
      });
    }
  }

  /**
   * Write event to configured outputs
   */
  private async writeToOutputs(event: SecurityEvent): Promise<void> {
    const logEntry = this.formatLogEntry(event);

    // Console logging
    if (this.config.enableConsoleLogging && this.shouldLog(event.severity)) {
      this.logToConsole(event, logEntry);
    }

    // File logging
    if (this.config.enableFileLogging && this.shouldLog(event.severity)) {
      await this.logToFile(logEntry);
    }

    // Remote logging
    if (this.config.enableRemoteLogging && this.config.remoteLogEndpoint) {
      await this.logToRemote(event);
    }
  }

  /**
   * Check if event should be logged based on severity
   */
  private shouldLog(eventSeverity: SecuritySeverity): boolean {
    const severityLevels = {
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.MEDIUM]: 1,
      [SecuritySeverity.HIGH]: 2,
      [SecuritySeverity.CRITICAL]: 3
    };

    return severityLevels[eventSeverity] >= severityLevels[this.config.logLevel];
  }

  /**
   * Format log entry
   */
  private formatLogEntry(event: SecurityEvent): string {
    const timestamp = new Date(event.timestamp).toISOString();
    const logObject = {
      timestamp,
      id: event.id,
      type: event.type,
      severity: event.severity,
      result: event.result,
      message: event.message,
      userId: event.userId,
      username: event.username,
      ip: event.ip,
      command: event.command,
      riskScore: event.riskScore,
      tags: event.tags,
      ...(event.details && { details: event.details }),
      ...(event.parameters && { parameters: event.parameters })
    };

    return JSON.stringify(logObject);
  }

  /**
   * Log to console with colors
   */
  private logToConsole(event: SecurityEvent, logEntry: string): void {
    const colors = {
      [SecuritySeverity.LOW]: '\x1b[32m',      // Green
      [SecuritySeverity.MEDIUM]: '\x1b[33m',   // Yellow
      [SecuritySeverity.HIGH]: '\x1b[35m',     // Magenta
      [SecuritySeverity.CRITICAL]: '\x1b[31m'  // Red
    };

    const reset = '\x1b[0m';
    const color = colors[event.severity];
    
    console.log(`${color}[SECURITY ${event.severity.toUpperCase()}]${reset} ${logEntry}`);
  }

  /**
   * Log to file
   */
  private async logToFile(logEntry: string): Promise<void> {
    try {
      await this.rotateLogFileIfNeeded();
      
      let finalEntry = logEntry;
      
      // Encrypt if enabled
      if (this.config.encryptLogs && this.config.encryptionKey) {
        finalEntry = this.encryptLogEntry(logEntry);
      }

      // Add to buffer
      this.eventBuffer.push(finalEntry + '\n');
      
      // Write buffer if it's large enough
      if (this.eventBuffer.length >= 10) {
        await this.flushBuffer();
      }

    } catch (error) {
      console.error('❌ Failed to log to file:', error);
    }
  }

  /**
   * Encrypt log entry
   */
  private encryptLogEntry(entry: string): string {
    if (!this.config.encryptionKey) return entry;
    
    try {
      const cipher = crypto.createCipher('aes-256-gcm', this.config.encryptionKey);
      let encrypted = cipher.update(entry, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag();
      
      return `${encrypted}:${tag.toString('hex')}`;
    } catch (error) {
      console.error('❌ Failed to encrypt log entry:', error);
      return entry;
    }
  }

  /**
   * Flush buffer to file
   */
  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const content = this.eventBuffer.join('');
      await fs.appendFile(this.currentLogFile, content);
      
      // Update integrity hash
      if (this.config.enableLogIntegrity) {
        this.updateLogIntegrity(content);
      }
      
      this.eventBuffer = [];
    } catch (error) {
      console.error('❌ Failed to flush buffer:', error);
    }
  }

  /**
   * Update log integrity hash
   */
  private updateLogIntegrity(content: string): void {
    const hash = crypto.createHash('sha256');
    hash.update(this.logIntegrityHash + content);
    this.logIntegrityHash = hash.digest('hex');
  }

  /**
   * Rotate log file if needed
   */
  private async rotateLogFileIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile).catch(() => null);
      
      if (stats && stats.size > this.config.maxLogFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      // File doesn't exist, no rotation needed
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLogFile(): Promise<void> {
    try {
      // Flush remaining buffer
      await this.flushBuffer();
      
      // Create new log file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newLogFile = path.join(this.config.logDirectory, `security-${timestamp}.log`);
      
      this.currentLogFile = newLogFile;
      this.logIntegrityHash = '';
      
      // Clean up old log files
      await this.cleanupOldLogFiles();
      
    } catch (error) {
      console.error('❌ Failed to rotate log file:', error);
    }
  }

  /**
   * Clean up old log files
   */
  private async cleanupOldLogFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files
        .filter(file => file.startsWith('security-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDirectory, file)
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort by name (newest first)

      // Remove excess files
      if (logFiles.length > this.config.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.config.maxLogFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️ Deleted old log file: ${file.name}`);
        }
      }

      // Remove files older than retention period
      const retentionCutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      for (const file of logFiles) {
        const stats = await fs.stat(file.path);
        if (stats.mtime.getTime() < retentionCutoff) {
          await fs.unlink(file.path);
          console.log(`🗑️ Deleted expired log file: ${file.name}`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to cleanup old log files:', error);
    }
  }

  /**
   * Log to remote endpoint
   */
  private async logToRemote(event: SecurityEvent): Promise<void> {
    if (!this.config.remoteLogEndpoint) return;

    try {
      const response = await fetch(this.config.remoteLogEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TelegramBot-SecurityLogger/1.0'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        console.warn(`⚠️ Remote logging failed: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Failed to log to remote endpoint:', error);
    }
  }

  /**
   * Check for security alerts
   */
  private async checkSecurityAlerts(event: SecurityEvent): Promise<void> {
    // Critical severity events trigger immediate alerts
    if (event.severity === SecuritySeverity.CRITICAL) {
      await this.triggerSecurityAlert(event);
    }

    // High risk score events
    if (event.riskScore >= 80) {
      await this.triggerSecurityAlert(event);
    }

    // Multiple high-severity events from same user
    if (event.userId) {
      const userHighSeverityEvents = this.eventHistory
        .filter(e => 
          e.userId === event.userId && 
          e.severity === SecuritySeverity.HIGH &&
          (Date.now() - e.timestamp) < (10 * 60 * 1000) // Last 10 minutes
        ).length;

      if (userHighSeverityEvents >= 3) {
        await this.triggerSecurityAlert({
          ...event,
          type: SecurityEventType.SECURITY_BREACH_DETECTED,
          severity: SecuritySeverity.CRITICAL,
          message: `Multiple high-severity security events from user ${event.userId}`,
          riskScore: 90
        });
      }
    }
  }

  /**
   * Trigger security alert
   */
  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    console.error(`🚨 SECURITY ALERT: ${event.message}`);
    
    // In production, this would:
    // - Send notifications to security team
    // - Trigger incident response workflows
    // - Update security dashboards
    // - Possibly trigger automated countermeasures
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    // Update top risk users
    const userRiskEntries = Array.from(this.userRiskScores.entries())
      .map(([userId, riskScore]) => ({
        userId,
        riskScore,
        eventCount: this.eventHistory.filter(e => e.userId === userId).length
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    this.metrics.topRiskUsers = userRiskEntries;
    
    return { ...this.metrics };
  }

  /**
   * Search security events
   */
  searchEvents(criteria: {
    userId?: number;
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    startTime?: number;
    endTime?: number;
    riskScoreMin?: number;
    tags?: string[];
  }): SecurityEvent[] {
    return this.eventHistory.filter(event => {
      if (criteria.userId && event.userId !== criteria.userId) return false;
      if (criteria.type && event.type !== criteria.type) return false;
      if (criteria.severity && event.severity !== criteria.severity) return false;
      if (criteria.startTime && event.timestamp < criteria.startTime) return false;
      if (criteria.endTime && event.timestamp > criteria.endTime) return false;
      if (criteria.riskScoreMin && event.riskScore < criteria.riskScoreMin) return false;
      if (criteria.tags && !criteria.tags.some(tag => event.tags.includes(tag))) return false;
      
      return true;
    });
  }

  /**
   * Generate security report
   */
  generateSecurityReport(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    period: string;
    summary: SecurityMetrics;
    topEvents: SecurityEvent[];
    recommendations: string[];
  } {
    const now = Date.now();
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - timeframes[timeframe];
    const periodEvents = this.eventHistory.filter(e => e.timestamp > cutoff);

    // Generate recommendations based on recent events
    const recommendations: string[] = [];
    const criticalEvents = periodEvents.filter(e => e.severity === SecuritySeverity.CRITICAL).length;
    const highRiskUsers = new Set(periodEvents.filter(e => e.riskScore > 70).map(e => e.userId)).size;

    if (criticalEvents > 0) {
      recommendations.push(`🚨 ${criticalEvents} critical security events detected - immediate investigation required`);
    }

    if (highRiskUsers > 3) {
      recommendations.push(`⚠️ ${highRiskUsers} users showing high-risk behavior - consider access review`);
    }

    const failedAuths = periodEvents.filter(e => e.type === SecurityEventType.AUTH_FAILURE).length;
    if (failedAuths > 10) {
      recommendations.push(`🔐 High number of authentication failures (${failedAuths}) - consider MFA enforcement`);
    }

    return {
      period: `Last ${timeframe}`,
      summary: this.getSecurityMetrics(),
      topEvents: periodEvents
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10),
      recommendations
    };
  }

  /**
   * Clean up old events from memory
   */
  private cleanupOldEvents(): void {
    const retentionTime = 24 * 60 * 60 * 1000; // 24 hours in memory
    const cutoff = Date.now() - retentionTime;
    
    this.eventHistory = this.eventHistory.filter(e => e.timestamp > cutoff);
    
    // Clean up correlation windows
    for (const [key, events] of this.correlationWindows.entries()) {
      const filteredEvents = events.filter(e => e.timestamp > cutoff);
      if (filteredEvents.length === 0) {
        this.correlationWindows.delete(key);
      } else {
        this.correlationWindows.set(key, filteredEvents);
      }
    }
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    // Flush buffer every 30 seconds
    setInterval(async () => {
      await this.flushBuffer();
    }, 30 * 1000);

    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);

    // Generate security report every 6 hours
    setInterval(() => {
      const report = this.generateSecurityReport('day');
      console.log('📊 Security Report Generated:', report.summary);
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Get week of year
   */
  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  }

  /**
   * Shutdown logger gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔒 Shutting down security audit logger...');
    
    await this.logSecurityEvent({
      type: SecurityEventType.SYSTEM_STOP,
      severity: SecuritySeverity.LOW,
      result: 'success',
      message: 'Security audit logger shutdown',
      riskScore: 0,
      tags: ['system', 'shutdown']
    });

    await this.flushBuffer();
    console.log('✅ Security audit logger shutdown complete');
  }
}

export const telegramSecurityLogger = new TelegramSecurityAuditLogger();
export { TelegramSecurityAuditLogger };
export type { SecurityEvent, SecurityEventType, SecuritySeverity, AuditLogConfig, SecurityMetrics };