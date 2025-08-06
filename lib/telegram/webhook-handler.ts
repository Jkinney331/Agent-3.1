import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import { TelegramBotConfig, TelegramWebhookPayload } from '../../types/trading';

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export class WebhookHandler {
  private bot: TelegramBot;
  private config: TelegramBotConfig;
  private webhookStats: {
    totalRequests: number;
    validRequests: number;
    invalidRequests: number;
    lastRequest?: Date;
    errors: string[];
  };

  constructor(bot: TelegramBot, config: TelegramBotConfig) {
    this.bot = bot;
    this.config = config;
    this.webhookStats = {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      errors: []
    };
  }

  /**
   * Process incoming webhook request
   */
  public async processWebhook(
    body: any, 
    headers: { [key: string]: string | string[] | undefined }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.webhookStats.totalRequests++;
      this.webhookStats.lastRequest = new Date();

      // Validate the webhook request
      const validation = this.validateWebhookRequest(body, headers);
      if (!validation.isValid) {
        this.webhookStats.invalidRequests++;
        this.addError(`Webhook validation failed: ${validation.error}`);
        return { success: false, error: validation.error };
      }

      // Parse the webhook payload
      const update = this.parseUpdate(body);
      if (!update) {
        this.webhookStats.invalidRequests++;
        this.addError('Failed to parse webhook update');
        return { success: false, error: 'Invalid update format' };
      }

      // Process the update through the bot
      await this.processUpdate(update);
      
      this.webhookStats.validRequests++;
      return { success: true };

    } catch (error) {
      this.webhookStats.invalidRequests++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addError(`Webhook processing error: ${errorMessage}`);
      console.error('Webhook processing error:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate incoming webhook request
   */
  private validateWebhookRequest(
    body: any, 
    headers: { [key: string]: string | string[] | undefined }
  ): WebhookValidationResult {
    // Check if body exists
    if (!body) {
      return { isValid: false, error: 'Empty request body' };
    }

    // Validate secret token if configured
    if (this.config.security.secretToken) {
      const providedToken = headers['x-telegram-bot-api-secret-token'];
      if (!providedToken) {
        return { isValid: false, error: 'Missing secret token header' };
      }

      if (providedToken !== this.config.security.secretToken) {
        return { isValid: false, error: 'Invalid secret token' };
      }
    }

    // Validate content type
    const contentType = headers['content-type'];
    if (!contentType || !contentType.toString().includes('application/json')) {
      return { isValid: false, error: 'Invalid content type' };
    }

    // Basic structure validation
    if (typeof body !== 'object' || !body.update_id) {
      return { isValid: false, error: 'Invalid update structure' };
    }

    // Validate update ID is a number
    if (typeof body.update_id !== 'number') {
      return { isValid: false, error: 'Invalid update_id format' };
    }

    return { isValid: true };
  }

  /**
   * Parse the webhook update payload
   */
  private parseUpdate(body: any): TelegramWebhookPayload | null {
    try {
      // Ensure the body has the expected structure
      if (!body.update_id) {
        return null;
      }

      const update: TelegramWebhookPayload = {
        update_id: body.update_id,
        message: body.message,
        callback_query: body.callback_query
      };

      // Validate message structure if present
      if (update.message) {
        if (!update.message.message_id || !update.message.from || !update.message.chat) {
          console.warn('Invalid message structure in update');
          return null;
        }
      }

      // Validate callback query structure if present
      if (update.callback_query) {
        if (!update.callback_query.id || !update.callback_query.from) {
          console.warn('Invalid callback_query structure in update');
          return null;
        }
      }

      return update;
    } catch (error) {
      console.error('Error parsing update:', error);
      return null;
    }
  }

  /**
   * Process the parsed update
   */
  private async processUpdate(update: TelegramWebhookPayload): Promise<void> {
    try {
      // Create update object that matches node-telegram-bot-api format
      const botUpdate: any = {
        update_id: update.update_id
      };

      // Handle message updates
      if (update.message) {
        botUpdate.message = update.message;
        // Emit message event to trigger bot's message handlers
        this.bot.emit('message', update.message);
      }

      // Handle callback query updates
      if (update.callback_query) {
        botUpdate.callback_query = update.callback_query;
        // Emit callback_query event
        this.bot.emit('callback_query', update.callback_query);
      }

      // Handle other update types if needed
      // (edited_message, channel_post, etc.)

    } catch (error) {
      console.error('Error processing update:', error);
      throw error; // Re-throw to be handled by the main webhook handler
    }
  }

  /**
   * Set up webhook with Telegram
   */
  public async setupWebhook(): Promise<{ success: boolean; error?: string }> {
    try {
      const webhookOptions: any = {
        url: this.config.webhookUrl,
        max_connections: 40,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false
      };

      // Add secret token if configured
      if (this.config.security.secretToken) {
        webhookOptions.secret_token = this.config.security.secretToken;
      }

      const result = await this.bot.setWebHook(
        this.config.webhookUrl,
        webhookOptions
      );

      if (result) {
        console.log(`Webhook successfully set to: ${this.config.webhookUrl}`);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to set webhook' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error setting up webhook:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Remove webhook
   */
  public async removeWebhook(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.bot.deleteWebHook({ drop_pending_updates: true });
      
      if (result) {
        console.log('Webhook successfully removed');
        return { success: true };
      } else {
        return { success: false, error: 'Failed to remove webhook' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error removing webhook:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get webhook info
   */
  public async getWebhookInfo(): Promise<any> {
    try {
      const info = await this.bot.getWebHookInfo();
      return {
        success: true,
        data: {
          url: info.url,
          has_custom_certificate: info.has_custom_certificate,
          pending_update_count: info.pending_update_count,
          last_error_date: info.last_error_date,
          last_error_message: info.last_error_message,
          max_connections: info.max_connections,
          allowed_updates: info.allowed_updates
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error getting webhook info:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate webhook URL format
   */
  public static validateWebhookUrl(url: string): WebhookValidationResult {
    if (!url) {
      return { isValid: false, error: 'Webhook URL is required' };
    }

    try {
      const parsedUrl = new URL(url);
      
      // Must be HTTPS
      if (parsedUrl.protocol !== 'https:') {
        return { isValid: false, error: 'Webhook URL must use HTTPS' };
      }

      // Check if it looks like a valid webhook endpoint
      if (!parsedUrl.pathname.includes('/webhook') && 
          !parsedUrl.pathname.includes('/telegram')) {
        console.warn('Webhook URL does not contain expected path segments');
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Create webhook URL with proper path
   */
  public static createWebhookUrl(baseUrl: string, token: string): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const botToken = crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    return `${cleanBaseUrl}/api/telegram/webhook/${botToken}`;
  }

  /**
   * Health check for webhook
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'warning';
    details: any;
  }> {
    try {
      const info = await this.getWebhookInfo();
      
      if (!info.success) {
        return {
          status: 'unhealthy',
          details: { error: info.error }
        };
      }

      const { data } = info;
      let status: 'healthy' | 'unhealthy' | 'warning' = 'healthy';
      const issues: string[] = [];

      // Check if webhook is set
      if (!data.url) {
        status = 'unhealthy';
        issues.push('Webhook URL not set');
      }

      // Check for pending updates
      if (data.pending_update_count > 100) {
        status = 'warning';
        issues.push(`High pending updates: ${data.pending_update_count}`);
      }

      // Check for recent errors
      if (data.last_error_date) {
        const errorDate = new Date(data.last_error_date * 1000);
        const hoursSinceError = (Date.now() - errorDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceError < 1) {
          status = 'unhealthy';
          issues.push(`Recent error: ${data.last_error_message}`);
        } else if (hoursSinceError < 24) {
          status = 'warning';
          issues.push(`Error within 24h: ${data.last_error_message}`);
        }
      }

      return {
        status,
        details: {
          webhook: data,
          stats: this.webhookStats,
          issues: issues.length > 0 ? issues : undefined
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Get webhook statistics
   */
  public getStats() {
    return {
      ...this.webhookStats,
      uptime: this.webhookStats.lastRequest 
        ? Date.now() - this.webhookStats.lastRequest.getTime()
        : null,
      successRate: this.webhookStats.totalRequests > 0 
        ? (this.webhookStats.validRequests / this.webhookStats.totalRequests) * 100
        : 0
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.webhookStats = {
      totalRequests: 0,
      validRequests: 0,
      invalidRequests: 0,
      errors: []
    };
  }

  /**
   * Add error to stats
   */
  private addError(error: string): void {
    this.webhookStats.errors.push(error);
    
    // Keep only last 10 errors
    if (this.webhookStats.errors.length > 10) {
      this.webhookStats.errors = this.webhookStats.errors.slice(-10);
    }
  }

  /**
   * Middleware for Express.js webhook endpoint
   */
  public createExpressMiddleware() {
    return async (req: any, res: any, next?: any) => {
      try {
        const result = await this.processWebhook(req.body, req.headers);
        
        if (result.success) {
          res.status(200).json({ ok: true });
        } else {
          res.status(400).json({ 
            ok: false, 
            error: result.error 
          });
        }
      } catch (error) {
        console.error('Webhook middleware error:', error);
        res.status(500).json({ 
          ok: false, 
          error: 'Internal server error' 
        });
      }
    };
  }

  /**
   * Middleware for Next.js API routes
   */
  public createNextMiddleware() {
    return async (req: any, res: any) => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ error: 'Method not allowed' });
          return;
        }

        const result = await this.processWebhook(req.body, req.headers);
        
        if (result.success) {
          res.status(200).json({ ok: true });
        } else {
          res.status(400).json({ 
            ok: false, 
            error: result.error 
          });
        }
      } catch (error) {
        console.error('Webhook Next.js middleware error:', error);
        res.status(500).json({ 
          ok: false, 
          error: 'Internal server error' 
        });
      }
    };
  }
}