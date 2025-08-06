import { NextRequest, NextResponse } from 'next/server';

// Environment variables for notification services
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || '';

interface NotificationRequest {
  type: 'trade' | 'alert' | 'strategy' | 'risk' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: ('telegram' | 'email' | 'dashboard')[];
  subject: string;
  message: string;
  data?: any;
  timestamp?: string;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

async function sendTelegramMessage(message: string, priority: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const emoji = getPriorityEmoji(priority);
    const formattedMessage = formatTelegramMessage(message, priority, emoji);

    const telegramData: TelegramMessage = {
      chat_id: TELEGRAM_CHAT_ID,
      text: formattedMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      return false;
    }

    console.log('Telegram message sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

async function sendEmail(subject: string, message: string, priority: string): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS || !NOTIFICATION_EMAIL) {
    console.warn('Email credentials not configured');
    return false;
  }

  try {
    // For demo purposes, we'll use a simple fetch to a mail service
    // In production, you'd use nodemailer or similar
    const emailData = {
      to: NOTIFICATION_EMAIL,
      subject: `[${priority.toUpperCase()}] ${subject}`,
      html: formatEmailMessage(message, priority),
      from: SMTP_USER
    };

    // Mock email sending - replace with actual email service
    console.log('Email would be sent:', emailData);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Email sent successfully (simulated)');
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '📊';
    case 'low': return '💡';
    default: return '📈';
  }
}

function formatTelegramMessage(message: string, priority: string, emoji: string): string {
  const timestamp = new Date().toLocaleString();
  const priorityTag = priority.toUpperCase();
  
  return `${emoji} <b>${priorityTag} ALERT</b>\n\n${message}\n\n<i>🕐 ${timestamp}</i>\n<i>🤖 AI Trading Bot</i>`;
}

function formatEmailMessage(message: string, priority: string): string {
  const timestamp = new Date().toLocaleString();
  const priorityColor = getPriorityColor(priority);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>AI Trading Bot Alert</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${priorityColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
            .message { line-height: 1.6; margin-bottom: 20px; }
            .timestamp { color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 AI Trading Bot Alert</h1>
            </div>
            <div class="content">
                <div class="priority-badge" style="background-color: ${priorityColor}; color: white;">
                    ${priority.toUpperCase()} PRIORITY
                </div>
                <div class="message">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <div class="timestamp">
                    📅 ${timestamp}
                </div>
            </div>
            <div class="footer">
                This message was sent by your AI Trading Bot system.<br>
                For support, contact your system administrator.
            </div>
        </div>
    </body>
    </html>
  `;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#dc3545';
    case 'high': return '#fd7e14';
    case 'medium': return '#0d6efd';
    case 'low': return '#198754';
    default: return '#6c757d';
  }
}

function formatTradeNotification(data: any): string {
  return `
🔄 <b>Trade Executed</b>

📊 <b>Symbol:</b> ${data.symbol}
💰 <b>Action:</b> ${data.side.toUpperCase()}
💵 <b>Amount:</b> $${data.amount.toLocaleString()}
📈 <b>Price:</b> $${data.price.toLocaleString()}
⚡ <b>Status:</b> ${data.status}
🎯 <b>Strategy:</b> ${data.strategy || 'Manual'}

${data.confidence ? `🎲 <b>Confidence:</b> ${data.confidence}%` : ''}
  `.trim();
}

function formatAlertNotification(data: any): string {
  return `
🔔 <b>Alert Triggered</b>

📊 <b>Symbol:</b> ${data.symbol}
⚠️ <b>Alert Type:</b> ${data.alertType}
📈 <b>Current Price:</b> $${data.currentPrice.toLocaleString()}
🎯 <b>Target Price:</b> $${data.targetPrice.toLocaleString()}
📉 <b>Change:</b> ${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%

💬 <b>Message:</b> ${data.message}
  `.trim();
}

function formatStrategyNotification(data: any): string {
  return `
🎯 <b>Strategy Update</b>

📝 <b>Strategy:</b> ${data.strategyName}
📊 <b>Action:</b> ${data.action}
⚡ <b>Status:</b> ${data.status}

${data.performance ? `
📈 <b>Performance:</b>
• Return: ${data.performance.return > 0 ? '+' : ''}${data.performance.return.toFixed(2)}%
• Win Rate: ${data.performance.winRate.toFixed(1)}%
• Trades: ${data.performance.tradesCount}
` : ''}

💬 <b>Details:</b> ${data.message}
  `.trim();
}

function formatRiskNotification(data: any): string {
  return `
🛡️ <b>Risk Alert</b>

⚠️ <b>Risk Level:</b> ${data.riskLevel.toUpperCase()}
📊 <b>Risk Score:</b> ${data.riskScore}/10
💼 <b>Portfolio Exposure:</b> ${data.exposure.toFixed(1)}%

${data.maxDrawdown ? `📉 <b>Max Drawdown:</b> ${data.maxDrawdown.toFixed(2)}%` : ''}

💡 <b>Recommendation:</b> ${data.recommendation}
💬 <b>Details:</b> ${data.message}
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const notification: NotificationRequest = await request.json();
    
    const {
      type,
      priority = 'medium',
      channels = ['dashboard'],
      subject,
      message,
      data,
    } = notification;

    const results: { [key: string]: boolean } = {};
    let formattedMessage = message;

    // Format message based on notification type
    if (data) {
      switch (type) {
        case 'trade':
          formattedMessage = formatTradeNotification(data);
          break;
        case 'alert':
          formattedMessage = formatAlertNotification(data);
          break;
        case 'strategy':
          formattedMessage = formatStrategyNotification(data);
          break;
        case 'risk':
          formattedMessage = formatRiskNotification(data);
          break;
        default:
          formattedMessage = message;
      }
    }

    // Send to each requested channel
    const promises = channels.map(async (channel) => {
      switch (channel) {
        case 'telegram':
          results.telegram = await sendTelegramMessage(formattedMessage, priority);
          break;
        
        case 'email':
          results.email = await sendEmail(subject, formattedMessage, priority);
          break;
        
        case 'dashboard':
          // Store notification in database/cache for dashboard display
          results.dashboard = true;
          console.log('Dashboard notification stored:', { type, priority, message: formattedMessage });
          break;
        
        default:
          console.warn(`Unknown notification channel: ${channel}`);
      }
    });

    await Promise.all(promises);

    const successCount = Object.values(results).filter(success => success).length;
    const totalChannels = channels.length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Notification sent to ${successCount}/${totalChannels} channels`,
      results,
      channels: channels,
      type,
      priority,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'test':
        // Test notification functionality
        const testResults = await Promise.all([
          sendTelegramMessage('🧪 Test notification from AI Trading Bot', 'low'),
          sendEmail('Test Notification', '🧪 Test notification from AI Trading Bot', 'low')
        ]);

        return NextResponse.json({
          success: true,
          message: 'Test notifications sent',
          results: {
            telegram: testResults[0],
            email: testResults[1]
          },
          timestamp: new Date().toISOString()
        });

      case 'status':
        // Check notification service status
        return NextResponse.json({
          success: true,
          status: {
            telegram: {
              configured: !!TELEGRAM_BOT_TOKEN && !!TELEGRAM_CHAT_ID,
              botToken: !!TELEGRAM_BOT_TOKEN,
              chatId: !!TELEGRAM_CHAT_ID
            },
            email: {
              configured: !!SMTP_USER && !!SMTP_PASS && !!NOTIFICATION_EMAIL,
              smtp: !!SMTP_USER && !!SMTP_PASS,
              recipient: !!NOTIFICATION_EMAIL
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified. Use "test" or "status".'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Notification GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 