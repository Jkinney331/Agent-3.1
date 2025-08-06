'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Calendar, 
  Activity, 
  RefreshCw, 
  Settings,
  Power,
  Shield,
  BarChart3,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Globe,
  FileText,
  Download
} from 'lucide-react';

// TypeScript interfaces based on Telegram bot structure
interface BotStatus {
  isRunning: boolean;
  username: string;
  startTime: Date;
  uptime: number;
  mode: 'polling' | 'webhook';
  webhookUrl?: string;
  lastHealthCheck: Date;
}

interface BotMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCommands: number;
  commandsToday: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  popularCommands: Array<{
    command: string;
    count: number;
  }>;
}

interface UserSession {
  userId: number;
  username?: string;
  firstName?: string;
  lastActive: Date;
  commandCount: number;
  currentCommand?: string;
  isBlocked: boolean;
}

interface NotificationSettings {
  tradeAlerts: boolean;
  portfolioUpdates: boolean;
  aiInsights: boolean;
  systemAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  marketNews: boolean;
  riskWarnings: boolean;
}

interface ReportSchedule {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  enabled: boolean;
  lastSent: Date;
  recipients: number[];
  content: string[];
}

interface BotSecurity {
  allowedUsers: number[];
  blacklistedUsers: number[];
  rateLimitEnabled: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
  encryptSessions: boolean;
  requireAuth: boolean;
  webhookSecure: boolean;
}

export function TelegramBotControls() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [reports, setReports] = useState<ReportSchedule[]>([]);
  const [security, setSecurity] = useState<BotSecurity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'status' | 'users' | 'notifications' | 'reports' | 'security'>('status');

  useEffect(() => {
    fetchBotData();
    
    // Set up real-time updates
    const interval = setInterval(fetchBotData, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchBotData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data based on the Telegram bot server structure
      // In production, these would be real API calls to /api/telegram/*

      // Mock bot status
      const mockStatus: BotStatus = {
        isRunning: true,
        username: 'ai_trading_bot',
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        uptime: 7200000,
        mode: 'polling',
        lastHealthCheck: new Date(Date.now() - 60000)
      };

      // Mock metrics
      const mockMetrics: BotMetrics = {
        totalUsers: 1247,
        activeUsers: 89,
        totalCommands: 15834,
        commandsToday: 342,
        averageResponseTime: 450,
        errorRate: 2.1,
        memoryUsage: 128,
        popularCommands: [
          { command: 'status', count: 4521 },
          { command: 'balance', count: 3890 },
          { command: 'help', count: 2134 },
          { command: 'settings', count: 1876 },
          { command: 'start', count: 1247 }
        ]
      };

      // Mock active sessions
      const mockSessions: UserSession[] = [
        {
          userId: 123456789,
          username: 'trader_alice',
          firstName: 'Alice',
          lastActive: new Date(Date.now() - 300000),
          commandCount: 15,
          currentCommand: 'settings',
          isBlocked: false
        },
        {
          userId: 987654321,
          username: 'crypto_bob',
          firstName: 'Bob',
          lastActive: new Date(Date.now() - 600000),
          commandCount: 8,
          isBlocked: false
        },
        {
          userId: 456789123,
          firstName: 'Charlie',
          lastActive: new Date(Date.now() - 1200000),
          commandCount: 23,
          isBlocked: false
        }
      ];

      // Mock notification settings
      const mockNotifications: NotificationSettings = {
        tradeAlerts: true,
        portfolioUpdates: true,
        aiInsights: true,
        systemAlerts: true,
        dailyReports: true,
        weeklyReports: true,
        marketNews: false,
        riskWarnings: true
      };

      // Mock report schedules
      const mockReports: ReportSchedule[] = [
        {
          id: 'daily_001',
          type: 'daily',
          time: '09:00',
          timezone: 'UTC',
          enabled: true,
          lastSent: new Date(Date.now() - 86400000),
          recipients: [123456789, 987654321],
          content: ['portfolio', 'trades', 'pnl', 'ai_insights']
        },
        {
          id: 'weekly_001',
          type: 'weekly',
          time: '08:00',
          timezone: 'UTC',
          enabled: true,
          lastSent: new Date(Date.now() - 7 * 86400000),
          recipients: [123456789],
          content: ['performance', 'trades', 'analytics', 'recommendations']
        }
      ];

      // Mock security settings
      const mockSecurity: BotSecurity = {
        allowedUsers: [123456789, 987654321, 456789123],
        blacklistedUsers: [],
        rateLimitEnabled: true,
        rateLimitWindow: 60,
        rateLimitMax: 30,
        encryptSessions: true,
        requireAuth: true,
        webhookSecure: false
      };

      setBotStatus(mockStatus);
      setMetrics(mockMetrics);
      setActiveSessions(mockSessions);
      setNotifications(mockNotifications);
      setReports(mockReports);
      setSecurity(mockSecurity);

    } catch (err) {
      console.error('Error fetching bot data:', err);
      setError('Failed to load Telegram bot data');
    } finally {
      setLoading(false);
    }
  };

  const handleBotToggle = async () => {
    if (!botStatus) return;
    
    try {
      // In production, this would call the actual bot start/stop API
      const newStatus = !botStatus.isRunning;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBotStatus({
        ...botStatus,
        isRunning: newStatus,
        startTime: newStatus ? new Date() : botStatus.startTime,
        uptime: newStatus ? 0 : botStatus.uptime
      });
      
    } catch (err) {
      console.error('Failed to toggle bot:', err);
      setError('Failed to toggle bot status');
    }
  };

  const handleNotificationToggle = async (setting: keyof NotificationSettings) => {
    if (!notifications) return;
    
    try {
      const updatedSettings = {
        ...notifications,
        [setting]: !notifications[setting]
      };
      
      setNotifications(updatedSettings);
      
      // In production, this would call the API to update settings
      
    } catch (err) {
      console.error('Failed to update notification setting:', err);
    }
  };

  const handleSendTestMessage = async () => {
    try {
      // In production, this would call the broadcast API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message or update UI
      console.log('Test message sent to all active users');
      
    } catch (err) {
      console.error('Failed to send test message:', err);
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && !botStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Bot Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bot Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Telegram Bot Control Panel
              {botStatus && (
                <Badge 
                  variant={botStatus.isRunning ? "default" : "destructive"}
                  className={botStatus.isRunning ? "bg-green-600" : ""}
                >
                  {botStatus.isRunning ? 'Online' : 'Offline'}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {botStatus && (
                <Button 
                  variant={botStatus.isRunning ? "destructive" : "default"} 
                  size="sm" 
                  onClick={handleBotToggle}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {botStatus.isRunning ? 'Stop Bot' : 'Start Bot'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchBotData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {botStatus && metrics && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.commandsToday}</div>
                <div className="text-sm text-muted-foreground">Commands Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.averageResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatUptime(botStatus.uptime)}</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {[
              { key: 'status', label: 'Status & Metrics', icon: Activity },
              { key: 'users', label: 'User Management', icon: Users },
              { key: 'notifications', label: 'Notifications', icon: Bell },
              { key: 'reports', label: 'Reports', icon: Calendar },
              { key: 'security', label: 'Security', icon: Shield }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === tab.key
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {selectedTab === 'status' && botStatus && metrics && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Bot Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Users</span>
                    <span className="font-semibold">{metrics.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Commands</span>
                    <span className="font-semibold">{metrics.totalCommands.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className={`font-semibold ${metrics.errorRate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.errorRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="font-semibold">{metrics.memoryUsage}MB</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bot Username</span>
                    <span className="font-semibold">@{botStatus.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Mode</span>
                    <Badge variant="outline">{botStatus.mode}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Started</span>
                    <span className="text-sm text-muted-foreground">
                      {botStatus.startTime.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Health Check</span>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(botStatus.lastHealthCheck)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Commands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.popularCommands.map((cmd, index) => (
                  <div key={cmd.command} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">/{cmd.command}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{cmd.count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">uses</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Active User Sessions ({activeSessions.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleSendTestMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Message
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div 
                  key={session.userId} 
                  className="p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {session.firstName} {session.username && `(@${session.username})`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {session.userId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.currentCommand && (
                        <Badge variant="outline">/{session.currentCommand}</Badge>
                      )}
                      <Badge variant={session.isBlocked ? 'destructive' : 'default'}>
                        {session.isBlocked ? 'Blocked' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Last Active:</span>
                      <div>{formatTimestamp(session.lastActive)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Commands Used:</span>
                      <div>{session.commandCount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'notifications' && notifications && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getNotificationDescription(key)}
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleNotificationToggle(key as keyof NotificationSettings)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className="p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold capitalize">{report.type} Report</div>
                        <div className="text-sm text-muted-foreground">
                          {report.time} {report.timezone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.enabled ? 'default' : 'secondary'}>
                        {report.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Recipients:</span>
                      <div>{report.recipients.length} users</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Sent:</span>
                      <div>{formatTimestamp(report.lastSent)}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground">Content: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.content.map((item) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'security' && security && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Authentication Required</span>
                    <Badge variant={security.requireAuth ? 'default' : 'secondary'}>
                      {security.requireAuth ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Encryption</span>
                    <Badge variant={security.encryptSessions ? 'default' : 'secondary'}>
                      {security.encryptSessions ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limiting</span>
                    <Badge variant={security.rateLimitEnabled ? 'default' : 'secondary'}>
                      {security.rateLimitEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Webhook Security</span>
                    <Badge variant={security.webhookSecure ? 'default' : 'secondary'}>
                      {security.webhookSecure ? 'Secure' : 'Basic'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Allowed Users</span>
                    <span className="font-semibold">{security.allowedUsers.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Blacklisted Users</span>
                    <span className="font-semibold text-red-600">{security.blacklistedUsers.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limit</span>
                    <span className="font-semibold">
                      {security.rateLimitMax}/{security.rateLimitWindow}s
                    </span>
                  </div>
                </div>
              </div>

              {security.blacklistedUsers.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <div>
                    <strong>Security Alert:</strong> {security.blacklistedUsers.length} users are currently blacklisted.
                  </div>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function for notification descriptions
function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    tradeAlerts: 'Notifications when trades are executed',
    portfolioUpdates: 'Regular portfolio performance updates',
    aiInsights: 'AI-generated trading insights and analysis',
    systemAlerts: 'System status and error notifications',
    dailyReports: 'Daily trading performance reports',
    weeklyReports: 'Weekly performance summaries',
    marketNews: 'Breaking market news and events',
    riskWarnings: 'Risk management alerts and warnings'
  };
  
  return descriptions[key] || 'Notification setting';
}