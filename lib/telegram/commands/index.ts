import { TradingBotContext, BotCommand, CommandName } from '../types';
import { startHandler } from './start-handler';
import { statusHandler } from './status-handler';
import { balanceHandler } from './balance-handler';
import { controlHandler } from './control-handler';
import { settingsHandler } from './settings-handler';
import { helpHandler } from './help-handler';

/**
 * Central command registry for the Telegram trading bot
 * Provides mobile-optimized command structure with proper error handling
 */
export class CommandRegistry {
  private commands: Map<CommandName, BotCommand> = new Map();
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.registerCommands();
  }

  /**
   * Register all available commands
   */
  private registerCommands(): void {
    const commands: BotCommand[] = [
      {
        command: 'start',
        description: '🚀 Initialize bot and welcome message',
        handler: startHandler,
        requiredAuth: false,
        cooldown: 10
      },
      {
        command: 'status',
        description: '📊 Current trading status and positions',
        handler: statusHandler,
        requiredAuth: true,
        cooldown: 5
      },
      {
        command: 'balance',
        description: '💰 Portfolio balance and performance',
        handler: balanceHandler,
        requiredAuth: true,
        cooldown: 5
      },
      {
        command: 'pause',
        description: '⏸️ Pause all trading operations',
        handler: controlHandler,
        requiredAuth: true,
        cooldown: 30
      },
      {
        command: 'resume',
        description: '▶️ Resume trading operations',
        handler: controlHandler,
        requiredAuth: true,
        cooldown: 30
      },
      {
        command: 'settings',
        description: '⚙️ User preferences and configuration',
        handler: settingsHandler,
        requiredAuth: true,
        cooldown: 5
      },
      {
        command: 'help',
        description: '❓ Interactive help and documentation',
        handler: helpHandler,
        requiredAuth: false,
        cooldown: 5
      }
    ];

    commands.forEach(cmd => this.commands.set(cmd.command, cmd));
  }

  /**
   * Execute a command with proper validation and error handling
   */
  async executeCommand(
    ctx: TradingBotContext, 
    commandName: CommandName, 
    args: string[] = []
  ): Promise<void> {
    try {
      const command = this.commands.get(commandName);
      if (!command) {
        await this.sendErrorMessage(ctx, 'Unknown command. Use /help to see available commands.');
        return;
      }

      // Check cooldown
      const cooldownKey = `${ctx.from?.id}_${commandName}`;
      const now = Date.now();
      const lastUsed = this.cooldowns.get(cooldownKey) || 0;
      const cooldownTime = (command.cooldown || 0) * 1000;

      if (now - lastUsed < cooldownTime) {
        const remaining = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
        await this.sendErrorMessage(ctx, `⏱️ Please wait ${remaining} seconds before using this command again.`);
        return;
      }

      // Check authentication
      if (command.requiredAuth && !ctx.user?.isAuthenticated) {
        await this.sendAuthRequiredMessage(ctx);
        return;
      }

      // Check subscription tier
      if (command.requiredSubscription && ctx.user?.subscriptionTier !== command.requiredSubscription) {
        await this.sendSubscriptionRequiredMessage(ctx, command.requiredSubscription);
        return;
      }

      // Update cooldown
      this.cooldowns.set(cooldownKey, now);

      // Execute command
      await command.handler(ctx, ...args);

    } catch (error) {
      console.error(`Command execution error for ${commandName}:`, error);
      await this.sendErrorMessage(ctx, 'An error occurred while processing your command. Please try again later.');
    }
  }

  /**
   * Get all available commands for a user
   */
  getAvailableCommands(user?: any): BotCommand[] {
    return Array.from(this.commands.values()).filter(cmd => {
      if (cmd.requiredAuth && !user?.isAuthenticated) return false;
      if (cmd.requiredSubscription && user?.subscriptionTier !== cmd.requiredSubscription) return false;
      return true;
    });
  }

  /**
   * Send error message with consistent formatting
   */
  private async sendErrorMessage(ctx: TradingBotContext, message: string): Promise<void> {
    await ctx.reply(`❌ ${message}`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '❓ Help', callback_data: 'help_main' },
          { text: '🔄 Try Again', callback_data: 'retry_last_command' }
        ]]
      }
    });
  }

  /**
   * Send authentication required message
   */
  private async sendAuthRequiredMessage(ctx: TradingBotContext): Promise<void> {
    await ctx.reply(
      '🔐 <b>Authentication Required</b>\n\n' +
      'This command requires authentication. Please connect your trading account first.\n\n' +
      'Use /start to begin the setup process.',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Get Started', callback_data: 'auth_start' }
          ]]
        }
      }
    );
  }

  /**
   * Send subscription required message
   */
  private async sendSubscriptionRequiredMessage(ctx: TradingBotContext, tier: string): Promise<void> {
    await ctx.reply(
      `💎 <b>${tier} Subscription Required</b>\n\n` +
      `This feature is available for ${tier} subscribers only.\n\n` +
      'Upgrade your subscription to unlock advanced features.',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '💎 Upgrade Now', callback_data: `upgrade_${tier.toLowerCase()}` },
            { text: '📋 View Plans', callback_data: 'subscription_plans' }
          ]]
        }
      }
    );
  }

  /**
   * Clean up old cooldowns (call periodically)
   */
  cleanupCooldowns(): void {
    const now = Date.now();
    const maxCooldown = 5 * 60 * 1000; // 5 minutes max

    for (const [key, timestamp] of this.cooldowns.entries()) {
      if (now - timestamp > maxCooldown) {
        this.cooldowns.delete(key);
      }
    }
  }
}

// Export singleton instance
export const commandRegistry = new CommandRegistry();

/**
 * Middleware to parse commands and execute them
 */
export async function commandMiddleware(ctx: TradingBotContext, next: () => Promise<void>): Promise<void> {
  if (ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/')) {
    const text = ctx.message.text;
    const [commandPart, ...args] = text.slice(1).split(' ');
    const command = commandPart.toLowerCase() as CommandName;

    // Handle command
    await commandRegistry.executeCommand(ctx, command, args);
    return;
  }

  // Continue to next middleware if not a command
  await next();
}

/**
 * Get command suggestions based on partial input
 */
export function getCommandSuggestions(input: string, user?: any): string[] {
  const availableCommands = commandRegistry.getAvailableCommands(user);
  const normalizedInput = input.toLowerCase().replace('/', '');
  
  return availableCommands
    .filter(cmd => 
      cmd.command.includes(normalizedInput) || 
      cmd.description.toLowerCase().includes(normalizedInput)
    )
    .map(cmd => `/${cmd.command} - ${cmd.description}`)
    .slice(0, 5); // Limit to 5 suggestions
}