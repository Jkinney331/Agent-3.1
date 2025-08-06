/**
 * Telegram Bot Security Configuration
 * Central security configuration and policy enforcement for financial trading bot
 * 
 * Security Configuration Features:
 * - Centralized security policy management
 * - Role-based access control configuration
 * - Security thresholds and limits
 * - Compliance requirements
 * - Emergency response settings
 * - Monitoring and alerting configuration
 * - Environment-specific security profiles
 */

import { UserRole, Permission } from './auth-middleware';
import { SecuritySeverity } from './audit-logger';
import { IncidentType, IncidentSeverity } from './emergency-response';

export interface SecurityPolicy {
  // Authentication settings
  authentication: {
    requireMfa: boolean;
    mfaCodeExpiry: number; // seconds
    maxFailedAttempts: number;
    lockoutDuration: number; // minutes
    sessionTimeout: number; // minutes
    emergencyLockdownEnabled: boolean;
  };

  // Authorization settings
  authorization: {
    strictRoleEnforcement: boolean;
    allowPrivilegeEscalation: boolean;
    tradingRequiresConfirmation: boolean;
    maxTradingAmount: Record<UserRole, number>;
    emergencyStopUsers: number[]; // Users who can trigger emergency stop
  };

  // Rate limiting settings
  rateLimiting: {
    messagesPerMinute: number;
    messagesPerHour: number;
    messagesPerDay: number;
    tradingCommandsPerMinute: number;
    tradingCommandsPerHour: number;
    burstLimit: number;
    emergencyThrottleLimit: number;
  };

  // Input validation settings
  inputValidation: {
    maxMessageLength: number;
    maxParameterLength: number;
    enableSqlInjectionDetection: boolean;
    enableCommandInjectionDetection: boolean;
    enableXssDetection: boolean;
    blockSuspiciousPatterns: boolean;
    tradingSymbolWhitelist: string[];
    maxTradingAmount: number;
  };

  // Webhook security settings
  webhookSecurity: {
    requireHttps: boolean;
    validateSignature: boolean;
    maxRequestSize: number; // bytes
    maxTimestampAge: number; // seconds
    strictOriginValidation: boolean;
    allowedIpRanges: string[];
    replayProtectionWindow: number; // seconds
  };

  // Monitoring and logging settings
  monitoring: {
    enableSecurityLogging: boolean;
    logLevel: SecuritySeverity;
    enableRealTimeAlerts: boolean;
    enableFileLogging: boolean;
    enableRemoteLogging: boolean;
    sensitiveDataMasking: boolean;
    gdprCompliant: boolean;
    logRetentionDays: number;
  };

  // Incident response settings
  incidentResponse: {
    autoResponseEnabled: boolean;
    emergencyStopThreshold: IncidentSeverity;
    systemLockdownThreshold: IncidentSeverity;
    maxResponseTime: Record<IncidentSeverity, number>; // seconds
    escalationEnabled: boolean;
    complianceReportingEnabled: boolean;
  };

  // Compliance requirements
  compliance: {
    gdprEnabled: boolean;
    soxCompliance: boolean;
    auditTrailRequired: boolean;
    dataRetentionPeriod: number; // days
    encryptionRequired: boolean;
    regulatoryReporting: boolean;
  };
}

export interface SecurityProfile {
  name: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
  policy: SecurityPolicy;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityThresholds {
  // Risk scoring thresholds
  riskScores: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  // Financial thresholds
  financial: {
    smallTrade: number;
    mediumTrade: number;
    largeTrade: number;
    criticalTrade: number;
  };

  // Activity thresholds
  activity: {
    normalCommandsPerHour: number;
    suspiciousCommandsPerHour: number;
    maliciousCommandsPerHour: number;
  };

  // System thresholds
  system: {
    maxConcurrentUsers: number;
    maxSystemLoad: number;
    maxMemoryUsage: number;
    maxDiskUsage: number;
  };
}

class TelegramSecurityConfig {
  private currentProfile: SecurityProfile;
  private profiles: Map<string, SecurityProfile> = new Map();
  private thresholds: SecurityThresholds;

  constructor() {
    this.initializeDefaultProfiles();
    this.initializeThresholds();
    this.currentProfile = this.getDefaultProfile();
    
    console.log('🔧 Security Configuration initialized');
    console.log(`📋 Active profile: ${this.currentProfile.name} (${this.currentProfile.environment})`);
    console.log(`⚡ Risk level: ${this.currentProfile.riskLevel}`);
  }

  /**
   * Initialize default security profiles
   */
  private initializeDefaultProfiles(): void {
    // Development profile - more permissive for testing
    const developmentProfile: SecurityProfile = {
      name: 'Development',
      description: 'Permissive security profile for development and testing',
      environment: 'development',
      riskLevel: 'low',
      policy: {
        authentication: {
          requireMfa: false,
          mfaCodeExpiry: 300, // 5 minutes
          maxFailedAttempts: 10,
          lockoutDuration: 5, // 5 minutes
          sessionTimeout: 120, // 2 hours
          emergencyLockdownEnabled: true
        },
        authorization: {
          strictRoleEnforcement: false,
          allowPrivilegeEscalation: false,
          tradingRequiresConfirmation: false,
          maxTradingAmount: {
            [UserRole.ADMIN]: 100000,
            [UserRole.TRADER]: 10000,
            [UserRole.OBSERVER]: 0,
            [UserRole.GUEST]: 0
          },
          emergencyStopUsers: [0] // Admin user ID
        },
        rateLimiting: {
          messagesPerMinute: 30,
          messagesPerHour: 500,
          messagesPerDay: 2000,
          tradingCommandsPerMinute: 10,
          tradingCommandsPerHour: 100,
          burstLimit: 10,
          emergencyThrottleLimit: 5
        },
        inputValidation: {
          maxMessageLength: 4096,
          maxParameterLength: 1024,
          enableSqlInjectionDetection: true,
          enableCommandInjectionDetection: true,
          enableXssDetection: true,
          blockSuspiciousPatterns: true,
          tradingSymbolWhitelist: ['BTC/USD', 'ETH/USD', 'ADA/USD'],
          maxTradingAmount: 50000
        },
        webhookSecurity: {
          requireHttps: false, // Flexible for local development
          validateSignature: true,
          maxRequestSize: 1024 * 1024, // 1MB
          maxTimestampAge: 600, // 10 minutes
          strictOriginValidation: false,
          allowedIpRanges: ['0.0.0.0/0'], // Allow all for development
          replayProtectionWindow: 3600 // 1 hour
        },
        monitoring: {
          enableSecurityLogging: true,
          logLevel: SecuritySeverity.LOW,
          enableRealTimeAlerts: false,
          enableFileLogging: true,
          enableRemoteLogging: false,
          sensitiveDataMasking: true,
          gdprCompliant: false,
          logRetentionDays: 30
        },
        incidentResponse: {
          autoResponseEnabled: true,
          emergencyStopThreshold: IncidentSeverity.CRITICAL,
          systemLockdownThreshold: IncidentSeverity.CRITICAL,
          maxResponseTime: {
            [IncidentSeverity.LOW]: 3600, // 1 hour
            [IncidentSeverity.MEDIUM]: 1800, // 30 minutes
            [IncidentSeverity.HIGH]: 900, // 15 minutes
            [IncidentSeverity.CRITICAL]: 300 // 5 minutes
          },
          escalationEnabled: false,
          complianceReportingEnabled: false
        },
        compliance: {
          gdprEnabled: false,
          soxCompliance: false,
          auditTrailRequired: true,
          dataRetentionPeriod: 30,
          encryptionRequired: false,
          regulatoryReporting: false
        }
      }
    };

    // Production profile - strict security
    const productionProfile: SecurityProfile = {
      name: 'Production',
      description: 'High-security profile for production financial trading',
      environment: 'production',
      riskLevel: 'critical',
      policy: {
        authentication: {
          requireMfa: true,
          mfaCodeExpiry: 180, // 3 minutes
          maxFailedAttempts: 3,
          lockoutDuration: 30, // 30 minutes
          sessionTimeout: 60, // 1 hour
          emergencyLockdownEnabled: true
        },
        authorization: {
          strictRoleEnforcement: true,
          allowPrivilegeEscalation: false,
          tradingRequiresConfirmation: true,
          maxTradingAmount: {
            [UserRole.ADMIN]: 1000000,
            [UserRole.TRADER]: 100000,
            [UserRole.OBSERVER]: 0,
            [UserRole.GUEST]: 0
          },
          emergencyStopUsers: [0] // Admin user ID
        },
        rateLimiting: {
          messagesPerMinute: 10,
          messagesPerHour: 100,
          messagesPerDay: 500,
          tradingCommandsPerMinute: 3,
          tradingCommandsPerHour: 20,
          burstLimit: 5,
          emergencyThrottleLimit: 1
        },
        inputValidation: {
          maxMessageLength: 2048,
          maxParameterLength: 256,
          enableSqlInjectionDetection: true,
          enableCommandInjectionDetection: true,
          enableXssDetection: true,
          blockSuspiciousPatterns: true,
          tradingSymbolWhitelist: [
            'BTC/USD', 'ETH/USD', 'ADA/USD', 'DOT/USD', 'LINK/USD',
            'UNI/USD', 'AAVE/USD', 'SUSHI/USD', 'YFI/USD', 'COMP/USD'
          ],
          maxTradingAmount: 1000000
        },
        webhookSecurity: {
          requireHttps: true,
          validateSignature: true,
          maxRequestSize: 512 * 1024, // 512KB
          maxTimestampAge: 300, // 5 minutes
          strictOriginValidation: true,
          allowedIpRanges: [
            '149.154.160.0/20',
            '91.108.4.0/22',
            '91.108.8.0/22',
            '91.108.12.0/22',
            '91.108.16.0/22',
            '91.108.56.0/22',
            '149.154.164.0/22',
            '149.154.168.0/22',
            '149.154.172.0/22'
          ],
          replayProtectionWindow: 1800 // 30 minutes
        },
        monitoring: {
          enableSecurityLogging: true,
          logLevel: SecuritySeverity.LOW,
          enableRealTimeAlerts: true,
          enableFileLogging: true,
          enableRemoteLogging: true,
          sensitiveDataMasking: true,
          gdprCompliant: true,
          logRetentionDays: 90
        },
        incidentResponse: {
          autoResponseEnabled: true,
          emergencyStopThreshold: IncidentSeverity.HIGH,
          systemLockdownThreshold: IncidentSeverity.CRITICAL,
          maxResponseTime: {
            [IncidentSeverity.LOW]: 1800, // 30 minutes
            [IncidentSeverity.MEDIUM]: 900, // 15 minutes
            [IncidentSeverity.HIGH]: 300, // 5 minutes
            [IncidentSeverity.CRITICAL]: 60 // 1 minute
          },
          escalationEnabled: true,
          complianceReportingEnabled: true
        },
        compliance: {
          gdprEnabled: true,
          soxCompliance: true,
          auditTrailRequired: true,
          dataRetentionPeriod: 90,
          encryptionRequired: true,
          regulatoryReporting: true
        }
      }
    };

    // Staging profile - balanced security for testing
    const stagingProfile: SecurityProfile = {
      name: 'Staging',
      description: 'Balanced security profile for staging environment',
      environment: 'staging',
      riskLevel: 'medium',
      policy: {
        ...productionProfile.policy,
        authentication: {
          ...productionProfile.policy.authentication,
          requireMfa: false,
          maxFailedAttempts: 5,
          lockoutDuration: 15
        },
        rateLimiting: {
          ...productionProfile.policy.rateLimiting,
          messagesPerMinute: 20,
          messagesPerHour: 200,
          tradingCommandsPerMinute: 5
        },
        webhookSecurity: {
          ...productionProfile.policy.webhookSecurity,
          requireHttps: false,
          strictOriginValidation: false,
          allowedIpRanges: ['0.0.0.0/0']
        },
        compliance: {
          ...productionProfile.policy.compliance,
          gdprEnabled: false,
          soxCompliance: false,
          regulatoryReporting: false
        }
      }
    };

    // Register profiles
    this.profiles.set('development', developmentProfile);
    this.profiles.set('staging', stagingProfile);
    this.profiles.set('production', productionProfile);
  }

  /**
   * Initialize security thresholds
   */
  private initializeThresholds(): void {
    this.thresholds = {
      riskScores: {
        low: 25,
        medium: 50,
        high: 75,
        critical: 90
      },
      financial: {
        smallTrade: 1000,
        mediumTrade: 10000,
        largeTrade: 100000,
        criticalTrade: 1000000
      },
      activity: {
        normalCommandsPerHour: 10,
        suspiciousCommandsPerHour: 50,
        maliciousCommandsPerHour: 100
      },
      system: {
        maxConcurrentUsers: 100,
        maxSystemLoad: 80, // percentage
        maxMemoryUsage: 80, // percentage
        maxDiskUsage: 90 // percentage
      }
    };
  }

  /**
   * Get default profile based on environment
   */
  private getDefaultProfile(): SecurityProfile {
    const environment = process.env.NODE_ENV || 'development';
    
    switch (environment) {
      case 'production':
        return this.profiles.get('production')!;
      case 'staging':
        return this.profiles.get('staging')!;
      default:
        return this.profiles.get('development')!;
    }
  }

  /**
   * Get current security policy
   */
  getSecurityPolicy(): SecurityPolicy {
    return this.currentProfile.policy;
  }

  /**
   * Get security thresholds
   */
  getSecurityThresholds(): SecurityThresholds {
    return this.thresholds;
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): SecurityProfile {
    return this.currentProfile;
  }

  /**
   * Switch security profile
   */
  switchProfile(profileName: string): boolean {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      console.error(`❌ Security profile '${profileName}' not found`);
      return false;
    }

    this.currentProfile = profile;
    console.log(`🔄 Switched to security profile: ${profile.name} (${profile.environment})`);
    console.log(`⚡ Risk level: ${profile.riskLevel}`);
    
    return true;
  }

  /**
   * Create custom security profile
   */
  createCustomProfile(
    name: string,
    description: string,
    environment: 'development' | 'staging' | 'production',
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    policyOverrides: Partial<SecurityPolicy>
  ): void {
    const baseProfile = this.profiles.get(environment)!;
    
    const customProfile: SecurityProfile = {
      name,
      description,
      environment,
      riskLevel,
      policy: {
        ...baseProfile.policy,
        ...policyOverrides
      }
    };

    this.profiles.set(name, customProfile);
    console.log(`✅ Created custom security profile: ${name}`);
  }

  /**
   * Update current policy
   */
  updatePolicy(policyUpdates: Partial<SecurityPolicy>): void {
    this.currentProfile.policy = {
      ...this.currentProfile.policy,
      ...policyUpdates
    };
    
    console.log(`🔄 Updated security policy for profile: ${this.currentProfile.name}`);
  }

  /**
   * Validate security configuration
   */
  validateConfiguration(): {
    valid: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    const policy = this.currentProfile.policy;

    // Validate authentication settings
    if (!policy.authentication.requireMfa && this.currentProfile.environment === 'production') {
      warnings.push('MFA is disabled in production environment');
      recommendations.push('Enable MFA for production environments');
    }

    if (policy.authentication.maxFailedAttempts > 5) {
      warnings.push('High maximum failed attempts threshold');
      recommendations.push('Consider lowering maximum failed attempts to 3-5');
    }

    // Validate authorization settings
    if (policy.authorization.allowPrivilegeEscalation) {
      errors.push('Privilege escalation is enabled - security risk');
      recommendations.push('Disable privilege escalation');
    }

    // Validate rate limiting
    if (policy.rateLimiting.messagesPerMinute > 60) {
      warnings.push('High message rate limit may allow spam attacks');
      recommendations.push('Consider lowering message rate limits');
    }

    // Validate webhook security
    if (!policy.webhookSecurity.requireHttps && this.currentProfile.environment === 'production') {
      errors.push('HTTPS not required for webhooks in production');
      recommendations.push('Require HTTPS for all webhook communications');
    }

    if (!policy.webhookSecurity.validateSignature) {
      errors.push('Webhook signature validation is disabled');
      recommendations.push('Enable webhook signature validation');
    }

    // Validate monitoring
    if (!policy.monitoring.enableSecurityLogging) {
      errors.push('Security logging is disabled');
      recommendations.push('Enable comprehensive security logging');
    }

    // Validate compliance
    if (this.currentProfile.environment === 'production' && !policy.compliance.auditTrailRequired) {
      warnings.push('Audit trail not required in production');
      recommendations.push('Enable audit trail for production environments');
    }

    const valid = errors.length === 0;

    return { valid, warnings, errors, recommendations };
  }

  /**
   * Get security configuration summary
   */
  getConfigurationSummary(): {
    profile: string;
    environment: string;
    riskLevel: string;
    keySettings: Record<string, any>;
    securityScore: number;
  } {
    const policy = this.currentProfile.policy;
    
    const keySettings = {
      mfaRequired: policy.authentication.requireMfa,
      httpsRequired: policy.webhookSecurity.requireHttps,
      signatureValidation: policy.webhookSecurity.validateSignature,
      strictRoleEnforcement: policy.authorization.strictRoleEnforcement,
      securityLogging: policy.monitoring.enableSecurityLogging,
      encryptionRequired: policy.compliance.encryptionRequired,
      autoIncidentResponse: policy.incidentResponse.autoResponseEnabled
    };

    const securityScore = this.calculateSecurityScore();

    return {
      profile: this.currentProfile.name,
      environment: this.currentProfile.environment,
      riskLevel: this.currentProfile.riskLevel,
      keySettings,
      securityScore
    };
  }

  /**
   * Calculate security score based on current configuration
   */
  private calculateSecurityScore(): number {
    let score = 0;
    const policy = this.currentProfile.policy;

    // Authentication (25 points)
    if (policy.authentication.requireMfa) score += 10;
    if (policy.authentication.maxFailedAttempts <= 3) score += 5;
    if (policy.authentication.sessionTimeout <= 60) score += 5;
    if (policy.authentication.emergencyLockdownEnabled) score += 5;

    // Authorization (20 points)
    if (policy.authorization.strictRoleEnforcement) score += 10;
    if (!policy.authorization.allowPrivilegeEscalation) score += 10;

    // Input Validation (15 points)
    if (policy.inputValidation.enableSqlInjectionDetection) score += 5;
    if (policy.inputValidation.enableCommandInjectionDetection) score += 5;
    if (policy.inputValidation.blockSuspiciousPatterns) score += 5;

    // Webhook Security (15 points)
    if (policy.webhookSecurity.requireHttps) score += 5;
    if (policy.webhookSecurity.validateSignature) score += 5;
    if (policy.webhookSecurity.strictOriginValidation) score += 5;

    // Monitoring (15 points)
    if (policy.monitoring.enableSecurityLogging) score += 5;
    if (policy.monitoring.enableRealTimeAlerts) score += 5;
    if (policy.monitoring.sensitiveDataMasking) score += 5;

    // Compliance (10 points)
    if (policy.compliance.encryptionRequired) score += 5;
    if (policy.compliance.auditTrailRequired) score += 5;

    return score;
  }

  /**
   * Export security configuration
   */
  exportConfiguration(): string {
    return JSON.stringify({
      profile: this.currentProfile,
      thresholds: this.thresholds,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import security configuration
   */
  importConfiguration(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.profile) {
        this.profiles.set(config.profile.name, config.profile);
        this.currentProfile = config.profile;
      }
      
      if (config.thresholds) {
        this.thresholds = config.thresholds;
      }

      console.log('✅ Security configuration imported successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to import security configuration:', error);
      return false;
    }
  }

  /**
   * Get available profiles
   */
  getAvailableProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * Reset to default configuration
   */
  resetToDefault(): void {
    this.currentProfile = this.getDefaultProfile();
    console.log(`🔄 Reset to default security profile: ${this.currentProfile.name}`);
  }
}

// Export singleton instance
export const telegramSecurityConfig = new TelegramSecurityConfig();

// Export types and classes
export { TelegramSecurityConfig };
export type { SecurityPolicy, SecurityProfile, SecurityThresholds };