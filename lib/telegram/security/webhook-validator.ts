/**
 * Telegram Webhook Security Validator
 * Comprehensive webhook validation for secure Telegram bot communication
 * 
 * Security Features:
 * - HMAC-SHA256 signature verification
 * - Request origin validation
 * - Replay attack prevention
 * - HTTPS enforcement
 * - Content-Type validation
 * - Request size limits
 * - IP whitelist validation
 * - Timestamp verification
 */

import crypto from 'crypto';

export interface WebhookValidationConfig {
  botToken: string;
  maxRequestSize: number; // bytes
  maxTimestampAge: number; // seconds
  requireHttps: boolean;
  allowedIPs: string[]; // Telegram IP ranges
  strictOriginValidation: boolean;
  replayProtectionWindow: number; // seconds
}

export interface WebhookValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityFlags: WebhookSecurityFlag[];
  metadata: {
    requestId: string;
    timestamp: number;
    origin?: string;
    userAgent?: string;
    contentLength: number;
  };
}

export interface WebhookSecurityFlag {
  type: WebhookSecurityFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details?: any;
}

export enum WebhookSecurityFlagType {
  INVALID_SIGNATURE = 'invalid_signature',
  INVALID_ORIGIN = 'invalid_origin',
  REPLAY_ATTACK = 'replay_attack',
  SUSPICIOUS_TIMESTAMP = 'suspicious_timestamp',
  OVERSIZED_REQUEST = 'oversized_request',
  INVALID_CONTENT_TYPE = 'invalid_content_type',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent',
  BLOCKED_IP = 'blocked_ip',
  INSECURE_CONNECTION = 'insecure_connection',
  MALFORMED_JSON = 'malformed_json'
}

export interface TelegramUpdate {
  update_id: number;
  message?: any;
  edited_message?: any;
  channel_post?: any;
  edited_channel_post?: any;
  inline_query?: any;
  chosen_inline_result?: any;
  callback_query?: any;
  shipping_query?: any;
  pre_checkout_query?: any;
  poll?: any;
  poll_answer?: any;
}

class TelegramWebhookValidator {
  private config: WebhookValidationConfig;
  private processedRequests: Set<string> = new Set(); // For replay protection
  private suspiciousIPs: Map<string, number> = new Map(); // IP -> timestamp
  private requestHistory: Map<string, number> = new Map(); // request_id -> timestamp

  // Telegram's official IP ranges (as of 2024)
  private readonly telegramIPRanges = [
    '149.154.160.0/20',
    '91.108.4.0/22',
    '91.108.8.0/22',
    '91.108.12.0/22',
    '91.108.16.0/22',
    '91.108.56.0/22',
    '149.154.164.0/22',
    '149.154.168.0/22',
    '149.154.172.0/22'
  ];

  constructor(config: WebhookValidationConfig) {
    this.config = {
      maxRequestSize: 1024 * 1024, // 1MB default
      maxTimestampAge: 300, // 5 minutes default
      requireHttps: true,
      allowedIPs: this.telegramIPRanges,
      strictOriginValidation: true,
      replayProtectionWindow: 3600, // 1 hour default
      ...config
    };

    this.startCleanupTimer();
    console.log('🔐 Telegram Webhook Validator initialized with enterprise security');
  }

  /**
   * Validate incoming webhook request
   */
  async validateWebhookRequest(
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: string | Buffer;
      ip?: string;
      protocol?: string;
    }
  ): Promise<WebhookValidationResult> {
    const requestId = this.generateRequestId();
    const result: WebhookValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityFlags: [],
      metadata: {
        requestId,
        timestamp: Date.now(),
        origin: request.headers['origin'] || request.headers['referer'],
        userAgent: request.headers['user-agent'],
        contentLength: Buffer.byteLength(request.body)
      }
    };

    try {
      // 1. Protocol validation
      await this.validateProtocol(request, result);

      // 2. Method validation
      await this.validateMethod(request, result);

      // 3. IP address validation
      await this.validateIPAddress(request, result);

      // 4. Request size validation
      await this.validateRequestSize(request, result);

      // 5. Content-Type validation
      await this.validateContentType(request, result);

      // 6. Headers validation
      await this.validateHeaders(request, result);

      // 7. Body structure validation
      let parsedBody: TelegramUpdate | null = null;
      if (result.isValid) {
        parsedBody = await this.validateBodyStructure(request, result);
      }

      // 8. Signature verification (if using secret token)
      if (result.isValid && this.config.botToken) {
        await this.validateSignature(request, result);
      }

      // 9. Timestamp validation
      if (result.isValid && parsedBody) {
        await this.validateTimestamp(parsedBody, result);
      }

      // 10. Replay attack protection
      if (result.isValid && parsedBody) {
        await this.validateReplayProtection(parsedBody, result);
      }

      // 11. Content validation
      if (result.isValid && parsedBody) {
        await this.validateUpdateContent(parsedBody, result);
      }

      // Log security events
      if (result.securityFlags.length > 0) {
        console.warn(`⚠️ Webhook security flags for request ${requestId}:`, result.securityFlags);
      }

      // Record request for replay protection
      if (result.isValid && parsedBody) {
        this.recordProcessedRequest(parsedBody.update_id.toString(), requestId);
      }

      return result;

    } catch (error) {
      console.error('❌ Webhook validation error:', error);
      result.isValid = false;
      result.errors.push('Webhook validation system error');
      return result;
    }
  }

  /**
   * Validate HTTPS protocol
   */
  private async validateProtocol(
    request: { protocol?: string; headers: Record<string, string> },
    result: WebhookValidationResult
  ): Promise<void> {
    if (this.config.requireHttps) {
      const isHttps = request.protocol === 'https:' || 
                     request.headers['x-forwarded-proto'] === 'https' ||
                     request.headers['x-forwarded-ssl'] === 'on';

      if (!isHttps) {
        result.isValid = false;
        result.errors.push('HTTPS required for webhook security');
        result.securityFlags.push({
          type: WebhookSecurityFlagType.INSECURE_CONNECTION,
          severity: 'critical',
          description: 'Webhook request received over insecure connection'
        });
      }
    }
  }

  /**
   * Validate HTTP method
   */
  private async validateMethod(
    request: { method: string },
    result: WebhookValidationResult
  ): Promise<void> {
    if (request.method !== 'POST') {
      result.isValid = false;
      result.errors.push('Only POST method allowed for webhooks');
    }
  }

  /**
   * Validate source IP address
   */
  private async validateIPAddress(
    request: { ip?: string; headers: Record<string, string> },
    result: WebhookValidationResult
  ): Promise<void> {
    const clientIP = request.ip || 
                     request.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     request.headers['x-real-ip'] ||
                     'unknown';

    if (clientIP === 'unknown') {
      result.warnings.push('Unable to determine client IP address');
      return;
    }

    // Check if IP is in suspicious list
    if (this.suspiciousIPs.has(clientIP)) {
      result.securityFlags.push({
        type: WebhookSecurityFlagType.BLOCKED_IP,
        severity: 'high',
        description: 'Request from previously flagged IP address',
        details: { ip: clientIP }
      });
    }

    // Validate against Telegram IP ranges (if strict validation enabled)
    if (this.config.strictOriginValidation) {
      const isValidIP = this.isIPInAllowedRanges(clientIP);
      if (!isValidIP) {
        result.isValid = false;
        result.errors.push('Request from unauthorized IP address');
        result.securityFlags.push({
          type: WebhookSecurityFlagType.INVALID_ORIGIN,
          severity: 'critical',
          description: 'Webhook request from non-Telegram IP',
          details: { ip: clientIP }
        });

        // Flag IP as suspicious
        this.suspiciousIPs.set(clientIP, Date.now());
      }
    }
  }

  /**
   * Check if IP is in allowed ranges
   */
  private isIPInAllowedRanges(ip: string): boolean {
    // Simple IP range check (in production, use proper CIDR library)
    for (const range of this.config.allowedIPs) {
      if (this.isIPInRange(ip, range)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Simple CIDR range check
   */
  private isIPInRange(ip: string, cidr: string): boolean {
    try {
      const [rangeIP, prefixLength] = cidr.split('/');
      const ipParts = ip.split('.').map(Number);
      const rangeParts = rangeIP.split('.').map(Number);
      
      const prefixLen = parseInt(prefixLength);
      const mask = (0xFFFFFFFF << (32 - prefixLen)) >>> 0;
      
      const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
      const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];
      
      return (ipInt & mask) === (rangeInt & mask);
    } catch (error) {
      console.error('Error checking IP range:', error);
      return false;
    }
  }

  /**
   * Validate request size
   */
  private async validateRequestSize(
    request: { body: string | Buffer },
    result: WebhookValidationResult
  ): Promise<void> {
    const contentLength = Buffer.byteLength(request.body);
    
    if (contentLength > this.config.maxRequestSize) {
      result.isValid = false;
      result.errors.push(`Request too large: ${contentLength}/${this.config.maxRequestSize} bytes`);
      result.securityFlags.push({
        type: WebhookSecurityFlagType.OVERSIZED_REQUEST,
        severity: 'medium',
        description: 'Webhook request exceeds size limit',
        details: { size: contentLength, limit: this.config.maxRequestSize }
      });
    }
  }

  /**
   * Validate Content-Type header
   */
  private async validateContentType(
    request: { headers: Record<string, string> },
    result: WebhookValidationResult
  ): Promise<void> {
    const contentType = request.headers['content-type']?.toLowerCase();
    
    if (!contentType || !contentType.includes('application/json')) {
      result.isValid = false;
      result.errors.push('Invalid Content-Type: application/json required');
      result.securityFlags.push({
        type: WebhookSecurityFlagType.INVALID_CONTENT_TYPE,
        severity: 'medium',
        description: 'Invalid or missing Content-Type header',
        details: { contentType }
      });
    }
  }

  /**
   * Validate request headers
   */
  private async validateHeaders(
    request: { headers: Record<string, string> },
    result: WebhookValidationResult
  ): Promise<void> {
    const userAgent = request.headers['user-agent'];
    
    // Check for suspicious User-Agent patterns
    if (userAgent) {
      const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /node/i
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
      if (isSuspicious && !userAgent.toLowerCase().includes('telegram')) {
        result.securityFlags.push({
          type: WebhookSecurityFlagType.SUSPICIOUS_USER_AGENT,
          severity: 'medium',
          description: 'Suspicious User-Agent header detected',
          details: { userAgent }
        });
      }
    }
  }

  /**
   * Validate and parse JSON body
   */
  private async validateBodyStructure(
    request: { body: string | Buffer },
    result: WebhookValidationResult
  ): Promise<TelegramUpdate | null> {
    try {
      const bodyString = typeof request.body === 'string' ? request.body : request.body.toString('utf8');
      const parsedBody = JSON.parse(bodyString) as TelegramUpdate;

      // Validate required fields
      if (typeof parsedBody.update_id !== 'number') {
        result.isValid = false;
        result.errors.push('Missing or invalid update_id in webhook payload');
        return null;
      }

      return parsedBody;

    } catch (error) {
      result.isValid = false;
      result.errors.push('Invalid JSON in webhook payload');
      result.securityFlags.push({
        type: WebhookSecurityFlagType.MALFORMED_JSON,
        severity: 'medium',
        description: 'Malformed JSON in webhook body',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      return null;
    }
  }

  /**
   * Validate webhook signature (if secret token is used)
   */
  private async validateSignature(
    request: { headers: Record<string, string>; body: string | Buffer },
    result: WebhookValidationResult
  ): Promise<void> {
    const signature = request.headers['x-telegram-bot-api-secret-token'];
    
    if (!signature) {
      // If no signature provided but token configured, it's suspicious
      result.warnings.push('No signature provided for webhook validation');
      return;
    }

    try {
      const bodyString = typeof request.body === 'string' ? request.body : request.body.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.botToken)
        .update(bodyString)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      )) {
        result.isValid = false;
        result.errors.push('Invalid webhook signature');
        result.securityFlags.push({
          type: WebhookSecurityFlagType.INVALID_SIGNATURE,
          severity: 'critical',
          description: 'Webhook signature verification failed'
        });
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push('Signature validation error');
      result.securityFlags.push({
        type: WebhookSecurityFlagType.INVALID_SIGNATURE,
        severity: 'critical',
        description: 'Error during signature validation',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Validate timestamp to prevent old requests
   */
  private async validateTimestamp(
    update: TelegramUpdate,
    result: WebhookValidationResult
  ): Promise<void> {
    // Extract timestamp from message or use current time
    let messageTimestamp: number | undefined;
    
    if (update.message?.date) {
      messageTimestamp = update.message.date * 1000; // Convert to milliseconds
    } else if (update.edited_message?.edit_date) {
      messageTimestamp = update.edited_message.edit_date * 1000;
    } else if (update.callback_query?.message?.date) {
      messageTimestamp = update.callback_query.message.date * 1000;
    }

    if (messageTimestamp) {
      const now = Date.now();
      const age = (now - messageTimestamp) / 1000; // Age in seconds

      if (age > this.config.maxTimestampAge) {
        result.warnings.push(`Old message detected: ${age} seconds old`);
        result.securityFlags.push({
          type: WebhookSecurityFlagType.SUSPICIOUS_TIMESTAMP,
          severity: 'low',
          description: 'Message timestamp is older than expected',
          details: { age, maxAge: this.config.maxTimestampAge }
        });
      }

      // Check for future timestamps (clock skew)
      if (messageTimestamp > now + 60000) { // 1 minute tolerance
        result.securityFlags.push({
          type: WebhookSecurityFlagType.SUSPICIOUS_TIMESTAMP,
          severity: 'medium',
          description: 'Message timestamp is in the future',
          details: { timestamp: messageTimestamp, currentTime: now }
        });
      }
    }
  }

  /**
   * Validate against replay attacks
   */
  private async validateReplayProtection(
    update: TelegramUpdate,
    result: WebhookValidationResult
  ): Promise<void> {
    const updateKey = update.update_id.toString();
    
    if (this.processedRequests.has(updateKey)) {
      result.isValid = false;
      result.errors.push('Duplicate update_id detected - possible replay attack');
      result.securityFlags.push({
        type: WebhookSecurityFlagType.REPLAY_ATTACK,
        severity: 'critical',
        description: 'Replay attack detected - duplicate update_id',
        details: { updateId: update.update_id }
      });
    }
  }

  /**
   * Validate update content for suspicious patterns
   */
  private async validateUpdateContent(
    update: TelegramUpdate,
    result: WebhookValidationResult
  ): Promise<void> {
    // Check message content if present
    const message = update.message || update.edited_message || update.channel_post || update.edited_channel_post;
    
    if (message?.text) {
      // Check for suspiciously long messages
      if (message.text.length > 4096) {
        result.warnings.push('Unusually long message content');
      }

      // Check for suspicious patterns (basic detection)
      const suspiciousPatterns = [
        /(<script|<iframe|javascript:)/i,
        /(drop table|select \* from|union select)/i,
        /(eval\(|exec\(|system\()/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(message.text)) {
          result.securityFlags.push({
            type: WebhookSecurityFlagType.SUSPICIOUS_TIMESTAMP,
            severity: 'medium',
            description: 'Suspicious pattern detected in message content',
            details: { pattern: pattern.toString() }
          });
        }
      }
    }
  }

  /**
   * Record processed request for replay protection
   */
  private recordProcessedRequest(updateId: string, requestId: string): void {
    this.processedRequests.add(updateId);
    this.requestHistory.set(requestId, Date.now());
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Start cleanup timer for old records
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldRecords();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up old records
   */
  private cleanupOldRecords(): void {
    const now = Date.now();
    const replayWindow = this.config.replayProtectionWindow * 1000;
    
    // Clean up old processed requests
    const expiredRequests = Array.from(this.requestHistory.entries())
      .filter(([_, timestamp]) => (now - timestamp) > replayWindow)
      .map(([requestId]) => requestId);

    for (const requestId of expiredRequests) {
      this.requestHistory.delete(requestId);
    }

    // Clean up suspicious IPs (after 24 hours)
    const ipCleanupTime = 24 * 60 * 60 * 1000; // 24 hours
    const expiredIPs = Array.from(this.suspiciousIPs.entries())
      .filter(([_, timestamp]) => (now - timestamp) > ipCleanupTime)
      .map(([ip]) => ip);

    for (const ip of expiredIPs) {
      this.suspiciousIPs.delete(ip);
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    processedRequests: number;
    suspiciousIPs: number;
    replayProtectionWindow: number;
    averageRequestsPerHour: number;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const recentRequests = Array.from(this.requestHistory.values())
      .filter(timestamp => (now - timestamp) < oneHour).length;

    return {
      processedRequests: this.processedRequests.size,
      suspiciousIPs: this.suspiciousIPs.size,
      replayProtectionWindow: this.config.replayProtectionWindow,
      averageRequestsPerHour: recentRequests
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WebhookValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Webhook validator configuration updated');
  }
}

export { TelegramWebhookValidator };
export type { WebhookValidationConfig, WebhookValidationResult, TelegramUpdate };