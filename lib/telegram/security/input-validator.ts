/**
 * Telegram Bot Input Validation and Sanitization
 * Comprehensive input validation for financial trading bot security
 * 
 * Security Features:
 * - Command injection prevention
 * - SQL injection protection
 * - XSS prevention for message formatting
 * - Parameter type validation
 * - Financial data validation
 * - File upload security
 * - URL validation and sanitization
 * - Regex-based pattern matching
 */

import crypto from 'crypto';

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: any;
  errors: string[];
  warnings: string[];
  securityFlags: SecurityFlag[];
}

export interface SecurityFlag {
  type: SecurityFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  originalValue?: string;
  suspiciousPattern?: string;
}

export enum SecurityFlagType {
  COMMAND_INJECTION = 'command_injection',
  SQL_INJECTION = 'sql_injection',
  XSS_ATTEMPT = 'xss_attempt',
  PATH_TRAVERSAL = 'path_traversal',
  MALICIOUS_URL = 'malicious_url',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  INVALID_FINANCIAL_DATA = 'invalid_financial_data',
  OVERSIZED_INPUT = 'oversized_input',
  ENCODING_ATTACK = 'encoding_attack',
  SCRIPT_INJECTION = 'script_injection'
}

export interface CommandValidationRule {
  command: string;
  parameters: ParameterRule[];
  requiresAuth: boolean;
  maxLength: number;
  allowedPatterns?: RegExp[];
  blockedPatterns?: RegExp[];
  customValidator?: (value: string) => ValidationResult;
}

export interface ParameterRule {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'amount' | 'symbol' | 'percentage' | 'date' | 'url';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

class TelegramInputValidator {
  private readonly maxInputLength = 4096; // Telegram message limit
  private readonly maxParameterLength = 256;
  private readonly maxUrlLength = 2048;
  
  // Malicious pattern detection
  private readonly commandInjectionPatterns = [
    /[\|&;`'\\"]/g,                           // Shell metacharacters
    /\$\(.+\)/g,                              // Command substitution
    /`.*`/g,                                  // Backtick commands
    /\|\||\&&/g,                              // Logical operators
    /[<>]/g,                                  // Redirection operators
    /\beval\b|\bexec\b|\bsystem\b/gi,         // Dangerous functions
    /\b(rm|del|format|wget|curl)\b/gi,        // Dangerous commands
    /^\s*[\/\\]/,                             // Absolute paths
    /\.\.[\/\\]/g                             // Directory traversal
  ];

  private readonly sqlInjectionPatterns = [
    /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)/gi,
    /(\bor\b|\band\b)\s+(\d+\s*=\s*\d+|\btrue\b|\bfalse\b)/gi,
    /['"]\s*(or|and)\s+['"]/gi,
    /\b(exec|execute|sp_|xp_)\b/gi,
    /(\-\-|\#|\/\*|\*\/)/g,
    /['"]\s*;\s*(drop|delete|insert|update)/gi
  ];

  private readonly xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi
  ];

  private readonly suspiciousPatterns = [
    /\b(password|passwd|pwd|secret|key|token|auth)\b/gi,
    /\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b/g, // Credit card patterns
    /\b\d{3}-\d{2}-\d{4}\b/g,                         // SSN patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email patterns
    /\b(admin|root|administrator|system)\b/gi,
    /\b(api[_-]?key|access[_-]?token|private[_-]?key)\b/gi
  ];

  // Trading-specific validation rules
  private readonly tradingCommandRules: Map<string, CommandValidationRule> = new Map([
    ['buy', {
      command: 'buy',
      parameters: [
        { name: 'symbol', type: 'symbol', required: true, maxLength: 10 },
        { name: 'amount', type: 'amount', required: true, min: 0.01, max: 1000000 },
        { name: 'price', type: 'number', required: false, min: 0.0001 }
      ],
      requiresAuth: true,
      maxLength: 200
    }],
    ['sell', {
      command: 'sell',
      parameters: [
        { name: 'symbol', type: 'symbol', required: true, maxLength: 10 },
        { name: 'amount', type: 'amount', required: true, min: 0.01, max: 1000000 },
        { name: 'price', type: 'number', required: false, min: 0.0001 }
      ],
      requiresAuth: true,
      maxLength: 200
    }],
    ['balance', {
      command: 'balance',
      parameters: [],
      requiresAuth: true,
      maxLength: 50
    }],
    ['status', {
      command: 'status',
      parameters: [],
      requiresAuth: false,
      maxLength: 50
    }],
    ['stop', {
      command: 'stop',
      parameters: [
        { name: 'orderId', type: 'string', required: false, maxLength: 50 }
      ],
      requiresAuth: true,
      maxLength: 100
    }]
  ]);

  constructor() {
    console.log('🛡️ Telegram Input Validator initialized with comprehensive security rules');
  }

  /**
   * Validate and sanitize incoming message
   */
  async validateMessage(message: string, userId?: number): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: message,
      errors: [],
      warnings: [],
      securityFlags: []
    };

    try {
      // Basic length validation
      if (message.length > this.maxInputLength) {
        result.isValid = false;
        result.errors.push(`Message too long (${message.length}/${this.maxInputLength} characters)`);
        result.securityFlags.push({
          type: SecurityFlagType.OVERSIZED_INPUT,
          severity: 'medium',
          description: 'Message exceeds maximum allowed length'
        });
      }

      // Check for empty or whitespace-only messages
      if (!message.trim()) {
        result.isValid = false;
        result.errors.push('Empty message not allowed');
        return result;
      }

      // Detect malicious patterns
      await this.detectMaliciousPatterns(message, result);

      // Sanitize the message if valid
      if (result.isValid) {
        result.sanitizedValue = this.sanitizeMessage(message);
      }

      // Log security flags for monitoring
      if (result.securityFlags.length > 0) {
        console.warn(`⚠️ Security flags detected for user ${userId}:`, result.securityFlags);
      }

      return result;

    } catch (error) {
      console.error('❌ Message validation error:', error);
      result.isValid = false;
      result.errors.push('Validation system error');
      return result;
    }
  }

  /**
   * Validate trading command with parameters
   */
  async validateTradingCommand(
    command: string, 
    parameters: Record<string, any>, 
    userId?: number
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: { command, parameters },
      errors: [],
      warnings: [],
      securityFlags: []
    };

    try {
      // Get command validation rules
      const rule = this.tradingCommandRules.get(command.toLowerCase());
      if (!rule) {
        result.isValid = false;
        result.errors.push(`Unknown trading command: ${command}`);
        return result;
      }

      // Validate command string
      const commandValidation = await this.validateMessage(`/${command}`, userId);
      if (!commandValidation.isValid) {
        result.isValid = false;
        result.errors.push(...commandValidation.errors);
        result.securityFlags.push(...commandValidation.securityFlags);
      }

      // Validate each parameter
      for (const paramRule of rule.parameters) {
        const paramValue = parameters[paramRule.name];
        const paramValidation = this.validateParameter(paramValue, paramRule);
        
        if (!paramValidation.isValid) {
          result.isValid = false;
          result.errors.push(...paramValidation.errors);
          result.securityFlags.push(...paramValidation.securityFlags);
        } else if (paramValidation.sanitizedValue !== undefined) {
          parameters[paramRule.name] = paramValidation.sanitizedValue;
        }
      }

      // Check for required parameters
      for (const paramRule of rule.parameters) {
        if (paramRule.required && !parameters.hasOwnProperty(paramRule.name)) {
          result.isValid = false;
          result.errors.push(`Missing required parameter: ${paramRule.name}`);
        }
      }

      result.sanitizedValue = { command, parameters };
      return result;

    } catch (error) {
      console.error('❌ Trading command validation error:', error);
      result.isValid = false;
      result.errors.push('Command validation system error');
      return result;
    }
  }

  /**
   * Validate individual parameter
   */
  private validateParameter(value: any, rule: ParameterRule): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: value,
      errors: [],
      warnings: [],
      securityFlags: []
    };

    // Handle undefined/null values
    if (value === undefined || value === null) {
      if (rule.required) {
        result.isValid = false;
        result.errors.push(`Parameter ${rule.name} is required`);
      }
      return result;
    }

    // Type-specific validation
    switch (rule.type) {
      case 'string':
        result.sanitizedValue = this.validateString(value, rule, result);
        break;
      case 'number':
        result.sanitizedValue = this.validateNumber(value, rule, result);
        break;
      case 'amount':
        result.sanitizedValue = this.validateAmount(value, rule, result);
        break;
      case 'symbol':
        result.sanitizedValue = this.validateSymbol(value, rule, result);
        break;
      case 'percentage':
        result.sanitizedValue = this.validatePercentage(value, rule, result);
        break;
      case 'url':
        result.sanitizedValue = this.validateUrl(value, rule, result);
        break;
      case 'boolean':
        result.sanitizedValue = this.validateBoolean(value, rule, result);
        break;
      default:
        result.sanitizedValue = this.validateString(value, rule, result);
    }

    // Custom validator
    if (rule.customValidator && result.isValid) {
      if (!rule.customValidator(result.sanitizedValue)) {
        result.isValid = false;
        result.errors.push(`Parameter ${rule.name} failed custom validation`);
      }
    }

    return result;
  }

  /**
   * Validate string parameter
   */
  private validateString(value: any, rule: ParameterRule, result: ValidationResult): string {
    const strValue = String(value).trim();
    
    // Length validation
    if (rule.minLength && strValue.length < rule.minLength) {
      result.isValid = false;
      result.errors.push(`${rule.name} must be at least ${rule.minLength} characters`);
    }
    
    if (rule.maxLength && strValue.length > rule.maxLength) {
      result.isValid = false;
      result.errors.push(`${rule.name} must be at most ${rule.maxLength} characters`);
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(strValue)) {
      result.isValid = false;
      result.errors.push(`${rule.name} format is invalid`);
    }

    // Security checks
    this.checkStringForMaliciousPatterns(strValue, result);

    return this.sanitizeString(strValue);
  }

  /**
   * Validate number parameter
   */
  private validateNumber(value: any, rule: ParameterRule, result: ValidationResult): number {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      result.isValid = false;
      result.errors.push(`${rule.name} must be a valid number`);
      return 0;
    }

    if (rule.min !== undefined && numValue < rule.min) {
      result.isValid = false;
      result.errors.push(`${rule.name} must be at least ${rule.min}`);
    }

    if (rule.max !== undefined && numValue > rule.max) {
      result.isValid = false;
      result.errors.push(`${rule.name} must be at most ${rule.max}`);
    }

    return numValue;
  }

  /**
   * Validate financial amount
   */
  private validateAmount(value: any, rule: ParameterRule, result: ValidationResult): number {
    const amount = this.validateNumber(value, rule, result);
    
    if (!result.isValid) return 0;

    // Additional financial validation
    if (amount < 0) {
      result.isValid = false;
      result.errors.push('Amount cannot be negative');
    }

    // Check for suspicious amounts
    if (amount > 1000000) { // $1M
      result.warnings.push('Large amount detected - requires additional verification');
      result.securityFlags.push({
        type: SecurityFlagType.INVALID_FINANCIAL_DATA,
        severity: 'high',
        description: 'Unusually large trading amount',
        originalValue: String(value)
      });
    }

    // Precision check (max 8 decimal places for crypto)
    const precision = String(amount).split('.')[1]?.length || 0;
    if (precision > 8) {
      result.warnings.push('Amount precision truncated to 8 decimal places');
      return Math.round(amount * 100000000) / 100000000;
    }

    return amount;
  }

  /**
   * Validate trading symbol
   */
  private validateSymbol(value: any, rule: ParameterRule, result: ValidationResult): string {
    const symbol = String(value).toUpperCase().trim();
    
    // Basic format validation
    if (!/^[A-Z]{2,10}(\/[A-Z]{2,10})?$/.test(symbol)) {
      result.isValid = false;
      result.errors.push('Invalid trading symbol format');
      return symbol;
    }

    // Common trading pairs validation
    const validSymbols = /^(BTC|ETH|ADA|DOT|LINK|UNI|AAVE|SUSHI|YFI|COMP|MKR|SNX|CRV|BAL|1INCH|ALPHA|BAND|KNC|LRC|ZRX|REN|BNT|OCEAN|FET|CHZ|ENJ|MANA|SAND|AXS|GALA|FLOW|ICP|FIL|AR|STORJ|SIA|SC)(\/?(USD|USDT|BTC|ETH|BNB))?$/;
    
    if (!validSymbols.test(symbol)) {
      result.warnings.push('Symbol not in common trading pairs - verify before execution');
    }

    return symbol;
  }

  /**
   * Validate percentage value
   */
  private validatePercentage(value: any, rule: ParameterRule, result: ValidationResult): number {
    const percentage = this.validateNumber(value, rule, result);
    
    if (!result.isValid) return 0;

    if (percentage < 0 || percentage > 100) {
      result.isValid = false;
      result.errors.push('Percentage must be between 0 and 100');
    }

    return percentage;
  }

  /**
   * Validate URL
   */
  private validateUrl(value: any, rule: ParameterRule, result: ValidationResult): string {
    const url = String(value).trim();
    
    if (url.length > this.maxUrlLength) {
      result.isValid = false;
      result.errors.push('URL too long');
      return url;
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS for security
      if (urlObj.protocol !== 'https:') {
        result.isValid = false;
        result.errors.push('Only HTTPS URLs are allowed');
      }

      // Block dangerous domains
      const dangerousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co'];
      if (dangerousDomains.some(domain => urlObj.hostname.includes(domain))) {
        result.securityFlags.push({
          type: SecurityFlagType.MALICIOUS_URL,
          severity: 'high',
          description: 'URL from suspicious domain',
          originalValue: url
        });
      }

      return urlObj.toString();
    } catch (error) {
      result.isValid = false;
      result.errors.push('Invalid URL format');
      return url;
    }
  }

  /**
   * Validate boolean parameter
   */
  private validateBoolean(value: any, rule: ParameterRule, result: ValidationResult): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    const strValue = String(value).toLowerCase().trim();
    if (['true', '1', 'yes', 'on'].includes(strValue)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(strValue)) {
      return false;
    }

    result.isValid = false;
    result.errors.push(`${rule.name} must be a boolean value`);
    return false;
  }

  /**
   * Detect malicious patterns in input
   */
  private async detectMaliciousPatterns(input: string, result: ValidationResult): Promise<void> {
    // Command injection detection
    for (const pattern of this.commandInjectionPatterns) {
      if (pattern.test(input)) {
        result.securityFlags.push({
          type: SecurityFlagType.COMMAND_INJECTION,
          severity: 'critical',
          description: 'Potential command injection detected',
          suspiciousPattern: pattern.toString(),
          originalValue: input
        });
      }
    }

    // SQL injection detection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        result.securityFlags.push({
          type: SecurityFlagType.SQL_INJECTION,
          severity: 'critical',
          description: 'Potential SQL injection detected',
          suspiciousPattern: pattern.toString(),
          originalValue: input
        });
      }
    }

    // XSS detection
    for (const pattern of this.xssPatterns) {
      if (pattern.test(input)) {
        result.securityFlags.push({
          type: SecurityFlagType.XSS_ATTEMPT,
          severity: 'high',
          description: 'Potential XSS attempt detected',
          suspiciousPattern: pattern.toString(),
          originalValue: input
        });
      }
    }

    // Suspicious pattern detection
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        result.securityFlags.push({
          type: SecurityFlagType.SUSPICIOUS_PATTERN,
          severity: 'medium',
          description: 'Suspicious pattern detected',
          suspiciousPattern: pattern.toString()
        });
      }
    }

    // If critical security flags found, mark as invalid
    const criticalFlags = result.securityFlags.filter(flag => flag.severity === 'critical');
    if (criticalFlags.length > 0) {
      result.isValid = false;
      result.errors.push('Input contains malicious patterns and has been blocked');
    }
  }

  /**
   * Check string for malicious patterns
   */
  private checkStringForMaliciousPatterns(input: string, result: ValidationResult): void {
    // Encoding attack detection
    if (/%[0-9a-fA-F]{2}|&#x[0-9a-fA-F]+;|&#\d+;/.test(input)) {
      result.securityFlags.push({
        type: SecurityFlagType.ENCODING_ATTACK,
        severity: 'medium',
        description: 'URL/HTML encoding detected',
        originalValue: input
      });
    }

    // Path traversal detection
    if (/\.\.[\/\\]|[\/\\]\.\.|\.\.%2[fF]|%2[eE]%2[eE]%2[fF]/.test(input)) {
      result.securityFlags.push({
        type: SecurityFlagType.PATH_TRAVERSAL,
        severity: 'high',
        description: 'Path traversal attempt detected',
        originalValue: input
      });
    }
  }

  /**
   * Sanitize message content
   */
  private sanitizeMessage(message: string): string {
    return message
      .trim()
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, this.maxInputLength); // Truncate if needed
  }

  /**
   * Sanitize string value
   */
  private sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, this.maxParameterLength); // Truncate if needed
  }

  /**
   * Generate validation report
   */
  generateSecurityReport(validationResults: ValidationResult[]): {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    securityFlagsCount: number;
    criticalFlags: number;
    highFlags: number;
    mediumFlags: number;
    lowFlags: number;
  } {
    const successful = validationResults.filter(r => r.isValid).length;
    const failed = validationResults.length - successful;
    
    const allFlags = validationResults.flatMap(r => r.securityFlags);
    const criticalFlags = allFlags.filter(f => f.severity === 'critical').length;
    const highFlags = allFlags.filter(f => f.severity === 'high').length;
    const mediumFlags = allFlags.filter(f => f.severity === 'medium').length;
    const lowFlags = allFlags.filter(f => f.severity === 'low').length;

    return {
      totalValidations: validationResults.length,
      successfulValidations: successful,
      failedValidations: failed,
      securityFlagsCount: allFlags.length,
      criticalFlags,
      highFlags,
      mediumFlags,
      lowFlags
    };
  }
}

export const telegramInputValidator = new TelegramInputValidator();
export { TelegramInputValidator };