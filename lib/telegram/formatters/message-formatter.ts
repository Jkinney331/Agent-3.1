import {
  TelegramMessage,
  TelegramMessageChunk,
  TelegramParseMode,
  DailyReportTemplate,
  TemplateContext,
  FormattingOptions,
  ReportSection,
  InlineKeyboardMarkup,
  InlineKeyboardButton
} from '../types';

/**
 * Telegram Message Formatter
 * Handles all message formatting for Telegram delivery including:
 * - Text formatting (Markdown/HTML)
 * - Message splitting for length limits
 * - Emoji integration
 * - Interactive elements
 * - Multi-message sequences
 */

// Telegram message length limits
export const TELEGRAM_LIMITS = {
  MAX_MESSAGE_LENGTH: 4096,
  MAX_CAPTION_LENGTH: 1024,
  MAX_BUTTONS_PER_ROW: 8,
  MAX_BUTTONS_TOTAL: 100
};

// Escape special characters for different parse modes
const MARKDOWN_V2_ESCAPE_CHARS = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
};

/**
 * Escape text for specific Telegram parse modes
 */
export function escapeText(text: string, parseMode: TelegramParseMode): string {
  switch (parseMode) {
    case 'MarkdownV2':
      return MARKDOWN_V2_ESCAPE_CHARS.reduce(
        (escaped, char) => escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`),
        text
      );
    case 'HTML':
      return Object.entries(HTML_ESCAPE_MAP).reduce(
        (escaped, [char, entity]) => escaped.replace(new RegExp(char, 'g'), entity),
        text
      );
    case 'Markdown':
      // Basic Markdown - only escape *, _, `, [
      return text.replace(/([*_`\[])/g, '\\$1');
    default:
      return text;
  }
}

/**
 * Format text with bold styling
 */
export function formatBold(text: string, parseMode: TelegramParseMode): string {
  const escapedText = escapeText(text, parseMode);
  switch (parseMode) {
    case 'MarkdownV2':
    case 'Markdown':
      return `*${escapedText}*`;
    case 'HTML':
      return `<b>${escapedText}</b>`;
    default:
      return text;
  }
}

/**
 * Format text with italic styling
 */
export function formatItalic(text: string, parseMode: TelegramParseMode): string {
  const escapedText = escapeText(text, parseMode);
  switch (parseMode) {
    case 'MarkdownV2':
    case 'Markdown':
      return `_${escapedText}_`;
    case 'HTML':
      return `<i>${escapedText}</i>`;
    default:
      return text;
  }
}

/**
 * Format text as code block
 */
export function formatCode(text: string, parseMode: TelegramParseMode, language?: string): string {
  const escapedText = escapeText(text, parseMode);
  switch (parseMode) {
    case 'MarkdownV2':
    case 'Markdown':
      return language ? `\`\`\`${language}\n${escapedText}\n\`\`\`` : `\`${escapedText}\``;
    case 'HTML':
      return language ? `<pre><code class="language-${language}">${escapedText}</code></pre>` : `<code>${escapedText}</code>`;
    default:
      return text;
  }
}

/**
 * Format a link
 */
export function formatLink(text: string, url: string, parseMode: TelegramParseMode): string {
  const escapedText = escapeText(text, parseMode);
  const escapedUrl = escapeText(url, parseMode);
  
  switch (parseMode) {
    case 'MarkdownV2':
    case 'Markdown':
      return `[${escapedText}](${escapedUrl})`;
    case 'HTML':
      return `<a href="${escapedUrl}">${escapedText}</a>`;
    default:
      return `${text}: ${url}`;
  }
}

/**
 * Format a report section with proper styling
 */
export function formatReportSection(
  section: ReportSection,
  options: FormattingOptions
): string {
  const { parseMode = 'MarkdownV2', useEmojis = true, boldHeaders = true } = options;
  
  let formatted = '';
  
  // Add emoji if enabled
  if (useEmojis && section.emoji) {
    formatted += `${section.emoji} `;
  }
  
  // Add title
  const title = boldHeaders ? formatBold(section.title, parseMode) : section.title;
  formatted += `${title}\n\n`;
  
  // Add content (already formatted in the template)
  formatted += section.content;
  
  return formatted;
}

/**
 * Create inline keyboard markup from interactive elements
 */
export function createInlineKeyboard(
  buttons: InlineKeyboardButton[],
  buttonsPerRow: number = 2
): InlineKeyboardMarkup {
  const keyboard: InlineKeyboardButton[][] = [];
  
  for (let i = 0; i < buttons.length; i += buttonsPerRow) {
    keyboard.push(buttons.slice(i, i + buttonsPerRow));
  }
  
  return { inlineKeyboard: keyboard };
}

/**
 * Split long messages into chunks
 */
export function splitMessage(
  text: string,
  maxLength: number = TELEGRAM_LIMITS.MAX_MESSAGE_LENGTH,
  parseMode: TelegramParseMode = 'MarkdownV2'
): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    const testChunk = currentChunk + (currentChunk ? '\n' : '') + line;
    
    if (testChunk.length <= maxLength) {
      currentChunk = testChunk;
    } else {
      // Current chunk is full, start a new one
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If single line is too long, split it further
      if (line.length > maxLength) {
        const words = line.split(' ');
        let wordChunk = '';
        
        for (const word of words) {
          const testWordChunk = wordChunk + (wordChunk ? ' ' : '') + word;
          
          if (testWordChunk.length <= maxLength) {
            wordChunk = testWordChunk;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk);
            }
            wordChunk = word;
          }
        }
        
        currentChunk = wordChunk;
      } else {
        currentChunk = line;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Format a complete daily report template into Telegram messages
 */
export function formatDailyReport(
  template: DailyReportTemplate,
  context: TemplateContext,
  options: FormattingOptions = {}
): TelegramMessageChunk {
  const {
    parseMode = template.formatting.parseMode,
    useEmojis = template.formatting.useEmojis,
    boldHeaders = template.formatting.boldHeaders,
    splitLongMessages = true,
    includeActions = true
  } = options;
  
  // Format header
  const marketTemplate = template.marketRegime !== 'ALL' 
    ? require('../templates/daily-report-template').MARKET_CONDITION_TEMPLATES[template.marketRegime]
    : null;
  
  let reportText = '';
  
  // Add greeting and date
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: context.user.timeZone
  }).format(context.data.date);
  
  reportText += formatBold(`📊 Trading Report - ${date}`, parseMode) + '\n';
  if (marketTemplate) {
    reportText += `${marketTemplate.emojis.trend} ${marketTemplate.messaging.greeting}\n\n`;
  }
  
  // Add sections
  const formattingOptions: FormattingOptions = {
    parseMode,
    useEmojis,
    boldHeaders
  };
  
  template.sections.forEach((section, index) => {
    if (index > 0) reportText += '\n\n';
    reportText += formatReportSection(section, formattingOptions);
  });
  
  // Add footer
  reportText += `\n\n📱 *Generated at ${new Date().toLocaleTimeString('en-US', { 
    timeZone: context.user.timeZone,
    hour12: false 
  })}*`;
  
  // Split into chunks if needed
  const chunks = splitLongMessages 
    ? splitMessage(reportText, template.maxMessageLength, parseMode)
    : [reportText];
  
  // Create messages
  const messages: TelegramMessage[] = chunks.map((chunk, index) => {
    const message: TelegramMessage = {
      text: chunk,
      parseMode,
      disableWebPagePreview: !template.formatting.linkPreviews
    };
    
    // Add interactive elements to the last message
    if (includeActions && index === chunks.length - 1 && template.interactiveElements.length > 0) {
      const availableButtons = template.interactiveElements
        .filter(element => {
          if (!element.condition) return true;
          try {
            // Simple condition evaluation (in production, use a proper evaluator)
            return new Function('data', 'user', `return ${element.condition}`)(context.data, context.user);
          } catch {
            return false;
          }
        })
        .map(element => ({
          text: element.text,
          callbackData: element.callbackData
        }));
      
      if (availableButtons.length > 0) {
        message.replyMarkup = createInlineKeyboard(availableButtons);
      }
    }
    
    return message;
  });
  
  return {
    messages,
    totalLength: reportText.length,
    chunkCount: chunks.length
  };
}

/**
 * Format alert messages
 */
export function formatAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'critical' | 'emergency',
  actions?: InlineKeyboardButton[],
  options: FormattingOptions = {}
): TelegramMessage {
  const { parseMode = 'MarkdownV2', useEmojis = true } = options;
  
  const severityConfig = {
    info: { emoji: 'ℹ️', prefix: 'INFO' },
    warning: { emoji: '⚠️', prefix: 'WARNING' },
    critical: { emoji: '🚨', prefix: 'CRITICAL' },
    emergency: { emoji: '🚨', prefix: 'EMERGENCY' }
  };
  
  const config = severityConfig[severity];
  let alertText = '';
  
  if (useEmojis) {
    alertText += `${config.emoji} `;
  }
  
  alertText += formatBold(`${config.prefix}: ${title}`, parseMode) + '\n\n';
  alertText += message;
  
  const telegramMessage: TelegramMessage = {
    text: alertText,
    parseMode,
    disableWebPagePreview: true
  };
  
  if (actions && actions.length > 0) {
    telegramMessage.replyMarkup = createInlineKeyboard(actions);
  }
  
  return telegramMessage;
}

/**
 * Format quick performance summary
 */
export function formatQuickSummary(
  context: TemplateContext,
  options: FormattingOptions = {}
): TelegramMessage {
  const { parseMode = 'MarkdownV2', useEmojis = true } = options;
  const { portfolio, aiAnalysis } = context.data;
  
  const pnlEmoji = portfolio.dailyPnL >= 0 ? '📈' : '📉';
  const confidenceEmoji = aiAnalysis.confidence >= 0.8 ? '🎯' : '🤔';
  
  let text = '';
  if (useEmojis) {
    text += `${pnlEmoji} `;
  }
  
  text += formatBold('Quick Update', parseMode) + '\n\n';
  text += `P&L: ${portfolio.dailyPnL >= 0 ? '+' : ''}$${portfolio.dailyPnL.toFixed(2)} (${portfolio.dailyPnLPercentage >= 0 ? '+' : ''}${portfolio.dailyPnLPercentage.toFixed(2)}%)\n`;
  text += `${confidenceEmoji} AI: ${(aiAnalysis.confidence * 100).toFixed(0)}% → ${aiAnalysis.nextAction}`;
  
  return {
    text,
    parseMode,
    disableWebPagePreview: true,
    replyMarkup: createInlineKeyboard([
      { text: '📊 Full Report', callbackData: 'show_full_report' },
      { text: '⚙️ Settings', callbackData: 'show_settings' }
    ])
  };
}

/**
 * Utility function to validate message format
 */
export function validateMessage(message: TelegramMessage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!message.text) {
    errors.push('Message text is required');
  } else if (message.text.length > TELEGRAM_LIMITS.MAX_MESSAGE_LENGTH) {
    errors.push(`Message text exceeds ${TELEGRAM_LIMITS.MAX_MESSAGE_LENGTH} characters`);
  }
  
  if (message.parseMode && !['Markdown', 'MarkdownV2', 'HTML'].includes(message.parseMode)) {
    errors.push('Invalid parse mode');
  }
  
  if (message.replyMarkup?.inlineKeyboard) {
    const totalButtons = message.replyMarkup.inlineKeyboard.flat().length;
    if (totalButtons > TELEGRAM_LIMITS.MAX_BUTTONS_TOTAL) {
      errors.push(`Too many buttons: ${totalButtons} > ${TELEGRAM_LIMITS.MAX_BUTTONS_TOTAL}`);
    }
    
    for (const row of message.replyMarkup.inlineKeyboard) {
      if (row.length > TELEGRAM_LIMITS.MAX_BUTTONS_PER_ROW) {
        errors.push(`Too many buttons per row: ${row.length} > ${TELEGRAM_LIMITS.MAX_BUTTONS_PER_ROW}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format data tables for mobile display
 */
export function formatDataTable(
  data: Array<Record<string, any>>,
  columns: string[],
  options: FormattingOptions = {}
): string {
  const { parseMode = 'MarkdownV2', compactMode = false } = options;
  
  if (data.length === 0) return 'No data available';
  
  let table = '';
  
  if (compactMode) {
    // Compact vertical format for mobile
    data.forEach((row, index) => {
      if (index > 0) table += '\n';
      columns.forEach(col => {
        const value = row[col] ?? 'N/A';
        table += `${col}: ${formatCode(String(value), parseMode)}\n`;
      });
    });
  } else {
    // Simple aligned format
    const maxWidths = columns.map(col => 
      Math.max(col.length, ...data.map(row => String(row[col] ?? 'N/A').length))
    );
    
    // Header
    table += formatCode(
      columns.map((col, i) => col.padEnd(maxWidths[i])).join(' | '),
      parseMode
    ) + '\n';
    
    // Separator
    table += formatCode(
      columns.map((_, i) => '-'.repeat(maxWidths[i])).join('-+-'),
      parseMode
    ) + '\n';
    
    // Data rows
    data.forEach(row => {
      table += formatCode(
        columns.map((col, i) => String(row[col] ?? 'N/A').padEnd(maxWidths[i])).join(' | '),
        parseMode
      ) + '\n';
    });
  }
  
  return table;
}