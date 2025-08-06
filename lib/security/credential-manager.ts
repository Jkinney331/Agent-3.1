// Credential Management System
// Note: For deployment demo, external dependencies are optional
let crypto: any = null;
let NodeVault: any = null;
let Joi: any = null;

try {
  crypto = require('crypto');
} catch (error) {
  console.log('Crypto module not available in deployment environment');
}

try {
  // @ts-ignore
  NodeVault = require('node-vault');
} catch (error) {
  console.log('node-vault not available in deployment environment');
}

try {
  // @ts-ignore
  Joi = require('joi');
} catch (error) {
  console.log('joi not available in deployment environment');
}

export interface CredentialConfig {
  exchange: string;
  environment: 'testnet' | 'live';
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  encrypted: boolean;
  lastRotated: Date;
  expiresAt?: Date;
  permissions?: string[];
}

export interface VaultConfig {
  endpoint: string;
  token: string;
  mount: string;
  namespace?: string;
}

export interface EncryptionOptions {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

class CredentialManager {
  private vault: any = null;
  private encryptionKey: Buffer | null = null;
  private credentials: Map<string, CredentialConfig> = new Map();
  private readonly defaultEncryption: EncryptionOptions = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  };

  constructor() {
    this.initializeEncryption();
    console.log('🔐 Credential Manager initialized');
  }

  private initializeEncryption(): void {
    if (!crypto) {
      console.log('📝 Credential Manager running in demo mode');
      return;
    }

    try {
      // Generate or load encryption key
      const keyString = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
      this.encryptionKey = Buffer.from(keyString, 'hex');
      
      console.log('✅ Encryption system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
      this.encryptionKey = null;
    }
  }

  private generateEncryptionKey(): string {
    if (!crypto) {
      return 'demo_key_' + Date.now().toString();
    }
    
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated new encryption key - store this securely:');
    console.log(`ENCRYPTION_KEY=${key}`);
    return key;
  }

  async initializeVault(config: VaultConfig): Promise<void> {
    if (!NodeVault) {
      console.log('📝 Vault integration not available in demo mode');
      return;
    }

    try {
      this.vault = NodeVault({
        endpoint: config.endpoint,
        token: config.token
      });

      // Test vault connection
      await this.vault.read('sys/health');
      console.log('✅ HashiCorp Vault connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Vault:', error);
      this.vault = null;
    }
  }

  private encrypt(text: string): string {
    if (!crypto || !this.encryptionKey) {
      return `demo_encrypted_${text}`;
    }

    try {
      const iv = crypto.randomBytes(this.defaultEncryption.ivLength);
      const cipher = crypto.createCipher(this.defaultEncryption.algorithm, this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Failed to encrypt credential');
    }
  }

  private decrypt(encryptedData: string): string {
    if (!crypto || !this.encryptionKey) {
      return encryptedData.replace('demo_encrypted_', '');
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.defaultEncryption.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Failed to decrypt credential');
    }
  }

  async storeCredential(config: Omit<CredentialConfig, 'encrypted' | 'lastRotated'>): Promise<void> {
    try {
      this.validateCredentialConfig(config);

      const credentialKey = `${config.exchange}_${config.environment}`;
      
      const encryptedConfig: CredentialConfig = {
        ...config,
        apiKey: this.encrypt(config.apiKey),
        apiSecret: this.encrypt(config.apiSecret),
        passphrase: config.passphrase ? this.encrypt(config.passphrase) : undefined,
        encrypted: true,
        lastRotated: new Date()
      };

      if (this.vault) {
        await this.storeInVault(credentialKey, encryptedConfig);
      } else {
        this.credentials.set(credentialKey, encryptedConfig);
      }

      console.log(`✅ Credential stored for ${config.exchange} ${config.environment}`);
    } catch (error) {
      console.error('❌ Failed to store credential:', error);
      throw error;
    }
  }

  async getCredential(exchange: string, environment: 'testnet' | 'live'): Promise<CredentialConfig | null> {
    try {
      const credentialKey = `${exchange}_${environment}`;
      
      let encryptedConfig: CredentialConfig | null = null;
      
      if (this.vault) {
        encryptedConfig = await this.getFromVault(credentialKey);
      } else {
        encryptedConfig = this.credentials.get(credentialKey) || null;
      }

      if (!encryptedConfig) {
        return null;
      }

      // Decrypt sensitive fields
      const decryptedConfig: CredentialConfig = {
        ...encryptedConfig,
        apiKey: this.decrypt(encryptedConfig.apiKey),
        apiSecret: this.decrypt(encryptedConfig.apiSecret),
        passphrase: encryptedConfig.passphrase ? this.decrypt(encryptedConfig.passphrase) : undefined,
        encrypted: false
      };

      return decryptedConfig;
    } catch (error) {
      console.error(`❌ Failed to get credential for ${exchange} ${environment}:`, error);
      return null;
    }
  }

  private async storeInVault(key: string, config: CredentialConfig): Promise<void> {
    if (!this.vault) {
      throw new Error('Vault not initialized');
    }

    try {
      await this.vault.write(`secret/data/trading-credentials/${key}`, {
        data: config
      });
    } catch (error) {
      console.error('❌ Failed to store in Vault:', error);
      throw error;
    }
  }

  private async getFromVault(key: string): Promise<CredentialConfig | null> {
    if (!this.vault) {
      return null;
    }

    try {
      const result = await this.vault.read(`secret/data/trading-credentials/${key}`);
      return result.data.data as CredentialConfig;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('❌ Failed to read from Vault:', error);
      throw error;
    }
  }

  private validateCredentialConfig(config: any): void {
    if (!Joi) {
      // Basic validation without Joi
      if (!config.exchange || !config.environment || !config.apiKey || !config.apiSecret) {
        throw new Error('Missing required credential fields');
      }
      return;
    }

    const schema = Joi.object({
      exchange: Joi.string().required(),
      environment: Joi.string().valid('testnet', 'live').required(),
      apiKey: Joi.string().required(),
      apiSecret: Joi.string().required(),
      passphrase: Joi.string().optional(),
      expiresAt: Joi.date().optional(),
      permissions: Joi.array().items(Joi.string()).optional()
    });

    const { error } = schema.validate(config);
    if (error) {
      throw new Error(`Invalid credential configuration: ${error.message}`);
    }
  }

  async rotateCredential(exchange: string, environment: 'testnet' | 'live', newApiKey: string, newApiSecret: string, newPassphrase?: string): Promise<void> {
    try {
      const existingConfig = await this.getCredential(exchange, environment);
      if (!existingConfig) {
        throw new Error('Credential not found for rotation');
      }

      const rotatedConfig = {
        ...existingConfig,
        apiKey: newApiKey,
        apiSecret: newApiSecret,
        passphrase: newPassphrase
      };

      await this.storeCredential(rotatedConfig);
      console.log(`✅ Credential rotated for ${exchange} ${environment}`);
    } catch (error) {
      console.error('❌ Failed to rotate credential:', error);
      throw error;
    }
  }

  async deleteCredential(exchange: string, environment: 'testnet' | 'live'): Promise<void> {
    try {
      const credentialKey = `${exchange}_${environment}`;
      
      if (this.vault) {
        await this.vault.delete(`secret/data/trading-credentials/${credentialKey}`);
      } else {
        this.credentials.delete(credentialKey);
      }

      console.log(`✅ Credential deleted for ${exchange} ${environment}`);
    } catch (error) {
      console.error('❌ Failed to delete credential:', error);
      throw error;
    }
  }

  async listCredentials(): Promise<string[]> {
    try {
      if (this.vault) {
        const result = await this.vault.list('secret/metadata/trading-credentials');
        return result.data.keys || [];
      } else {
        return Array.from(this.credentials.keys());
      }
    } catch (error) {
      console.error('❌ Failed to list credentials:', error);
      return [];
    }
  }

  async validateCredential(exchange: string, environment: 'testnet' | 'live'): Promise<boolean> {
    try {
      const config = await this.getCredential(exchange, environment);
      if (!config) {
        return false;
      }

      // Check if credential is expired
      if (config.expiresAt && config.expiresAt < new Date()) {
        console.warn(`⚠️ Credential for ${exchange} ${environment} has expired`);
        return false;
      }

      // TODO: Implement exchange-specific validation
      // This would test the credentials against the actual exchange API
      
      return true;
    } catch (error) {
      console.error('❌ Failed to validate credential:', error);
      return false;
    }
  }

  getEncryptionStatus(): { enabled: boolean; vaultConnected: boolean; keyLoaded: boolean } {
    return {
      enabled: !!crypto && !!this.encryptionKey,
      vaultConnected: !!this.vault,
      keyLoaded: !!this.encryptionKey
    };
  }

  // Demo/fallback methods
  getDemoCredentials(exchange: string, environment: 'testnet' | 'live'): CredentialConfig {
    return {
      exchange,
      environment,
      apiKey: `demo_api_key_${exchange}`,
      apiSecret: `demo_api_secret_${exchange}`,
      passphrase: `demo_passphrase_${exchange}`,
      encrypted: false,
      lastRotated: new Date(),
      permissions: ['read', 'trade']
    };
  }
}

export const credentialManager = new CredentialManager();
export { CredentialManager }; 