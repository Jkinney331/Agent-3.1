import {
  PortfolioData,
  Position,
  Trade,
  AIAnalysis,
  RiskMetrics,
  RiskAlert,
  PerformanceReport,
  MarketData,
  MarketRegime,
  UserPreferences
} from '../../types/trading';

// Telegram-specific formatting types
export type TelegramParseMode = 'Markdown' | 'MarkdownV2' | 'HTML';

export interface TelegramMessage {
  text: string;
  parseMode?: TelegramParseMode;
  disableWebPagePreview?: boolean;
  replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}

export interface TelegramMessageChunk {
  messages: TelegramMessage[];
  totalLength: number;
  chunkCount: number;
}

// Keyboard types
export interface InlineKeyboardButton {
  text: string;
  callbackData?: string;
  url?: string;
  switchInlineQuery?: string;
}

export interface InlineKeyboardMarkup {
  inlineKeyboard: InlineKeyboardButton[][];
}

export interface KeyboardButton {
  text: string;
  requestContact?: boolean;
  requestLocation?: boolean;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  selective?: boolean;
}

// Report template types
export interface DailyReportData {
  date: Date;
  portfolio: PortfolioData;
  positions: Position[];
  recentTrades: Trade[];
  aiAnalysis: AIAnalysis;
  riskMetrics: RiskMetrics;
  marketData: MarketData[];
  alerts: RiskAlert[];
  performance: PerformanceReport;
  aiConfidence: number;
  tradingDays: number;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  emoji?: string;
  action?: InlineKeyboardButton[];
}

export interface DailyReportTemplate {
  templateId: string;
  name: string;
  description: string;
  marketRegime: MarketRegime | 'ALL';
  sections: ReportSection[];
  maxMessageLength: number;
  formatting: MessageFormatting;
  interactiveElements: InteractiveElement[];
}

export interface MessageFormatting {
  parseMode: TelegramParseMode;
  useEmojis: boolean;
  boldHeaders: boolean;
  codeBlocks: boolean;
  linkPreviews: boolean;
  compactMode: boolean;
}

export interface InteractiveElement {
  type: 'quick_action' | 'details' | 'settings' | 'emergency';
  text: string;
  callbackData: string;
  condition?: string; // JavaScript condition to evaluate
}

// Market condition templates
export interface MarketConditionTemplate {
  regime: MarketRegime;
  tone: 'positive' | 'neutral' | 'cautious' | 'urgent';
  colors: {
    primary: string;
    success: string;
    warning: string;
    danger: string;
  };
  emojis: {
    trend: string;
    performance: string;
    warning: string;
    action: string;
  };
  messaging: {
    greeting: string;
    summary: string;
    callToAction: string;
  };
}

// Personalization types
export interface UserReportPreferences {
  userId: string;
  templateId?: string;
  sections: {
    [sectionId: string]: {
      enabled: boolean;
      priority: number;
      customFormat?: string;
    };
  };
  formatting: {
    parseMode: TelegramParseMode;
    useEmojis: boolean;
    compactMode: boolean;
    language: string;
  };
  notifications: {
    timeZone: string;
    preferredTime: string;
    frequency: 'daily' | 'twice_daily' | 'weekly';
    emergencyOnly: boolean;
  };
  thresholds: {
    significantPnLChange: number;
    riskAlertLevel: 'low' | 'medium' | 'high';
    minimumConfidence: number;
  };
}

// Performance tracking types
export interface MessagePerformance {
  messageId: string;
  templateId: string;
  userId: string;
  sentAt: Date;
  readAt?: Date;
  clickedButtons: string[];
  userRating?: number;
  responseTime?: number;
  engagement: {
    opened: boolean;
    timeSpent: number;
    actionsPerformed: number;
  };
}

export interface TemplatePerformance {
  templateId: string;
  totalSent: number;
  avgReadRate: number;
  avgEngagement: number;
  avgUserRating: number;
  conversionRate: number; // Actions taken / messages sent
  responseTime: number;
  lastOptimized: Date;
}

// A/B Testing types
export interface ABTestVariant {
  id: string;
  name: string;
  templateId: string;
  modifications: {
    sections?: Partial<ReportSection>[];
    formatting?: Partial<MessageFormatting>;
    interactiveElements?: Partial<InteractiveElement>[];
  };
  weight: number; // 0-100 percentage of traffic
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  metrics: {
    [variantId: string]: {
      sent: number;
      read: number;
      engaged: number;
      rated: number;
      avgRating: number;
    };
  };
  winningVariant?: string;
}

// Alert and notification types
export interface AlertTemplate {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  condition: string; // JavaScript condition
  title: string;
  message: string;
  formatting: MessageFormatting;
  actions: InlineKeyboardButton[];
  cooldown: number; // Minutes before same alert can fire again
  escalation?: {
    afterMinutes: number;
    template: string;
  };
}

export interface NotificationQueue {
  id: string;
  userId: string;
  type: 'daily_report' | 'alert' | 'trade_update' | 'emergency';
  priority: number; // Higher = more important
  scheduledFor: Date;
  message: TelegramMessage;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
  sentAt?: Date;
}

// Utility types for template generation
export interface TemplateContext {
  user: {
    id: string;
    preferences: UserReportPreferences;
    timeZone: string;
    language: string;
  };
  data: DailyReportData;
  market: {
    regime: MarketRegime;
    volatility: 'low' | 'medium' | 'high';
    sentiment: number;
  };
  previousReport?: {
    performance: number;
    engagement: number;
    rating: number;
  };
}

export interface FormattingOptions {
  maxLength?: number;
  parseMode?: TelegramParseMode;
  useEmojis?: boolean;
  compactMode?: boolean;
  includeActions?: boolean;
  splitLongMessages?: boolean;
}

// Response types for interactive elements
export interface CallbackData {
  action: string;
  data?: Record<string, any>;
  userId: string;
  timestamp: number;
}

export interface QuickAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Export utility type for template rendering
export type TemplateRenderer = (
  template: DailyReportTemplate,
  context: TemplateContext,
  options?: FormattingOptions
) => Promise<TelegramMessageChunk>;

export type AlertRenderer = (
  template: AlertTemplate,
  context: TemplateContext,
  options?: FormattingOptions
) => Promise<TelegramMessage>;