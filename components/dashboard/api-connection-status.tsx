'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Zap,
  Database
} from 'lucide-react';
import { useN8NData } from '@/hooks/use-n8n-data';

export function APIConnectionStatus() {
  const {
    apiConnections,
    isLoading,
    error,
    refreshData
  } = useN8NData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('alpaca')) return '📈';
    if (name.includes('coingecko')) return '🪙';
    if (name.includes('alpha vantage')) return '📊';
    if (name.includes('binance')) return '🟡';
    if (name.includes('supabase')) return '🗃️';
    return '🔗';
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return '--';
    if (time < 100) return `${time}ms`;
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const getResponseTimeColor = (time?: number) => {
    if (!time) return 'text-gray-500';
    if (time < 200) return 'text-green-600';
    if (time < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatRateLimit = (rateLimitUsage?: { used: number; remaining: number; resetTime: string }) => {
    if (!rateLimitUsage) return null;
    
    const total = rateLimitUsage.used + rateLimitUsage.remaining;
    const percentage = total > 0 ? (rateLimitUsage.used / total) * 100 : 0;
    
    return {
      used: rateLimitUsage.used,
      remaining: rateLimitUsage.remaining,
      percentage: percentage,
      resetTime: new Date(rateLimitUsage.resetTime).toLocaleTimeString()
    };
  };

  const connectedCount = apiConnections.filter(conn => conn.status === 'connected').length;
  const totalCount = apiConnections.length;

  if (isLoading && apiConnections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API Connection Status
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API Connection Status
            <Badge 
              variant="outline" 
              className={connectedCount === totalCount ? 
                'bg-green-100 text-green-800' : 
                connectedCount > 0 ? 
                  'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
              }
            >
              {connectedCount}/{totalCount} Connected
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button onClick={refreshData} variant="outline" size="sm" className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {apiConnections.map((connection, index) => {
            const rateLimit = formatRateLimit(connection.rateLimitUsage);
            
            return (
              <div 
                key={index} 
                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getServiceIcon(connection.service)}</span>
                    <div>
                      <h3 className="font-medium text-sm">{connection.service}</h3>
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(connection.lastCheck).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(connection.status)}
                    >
                      {getStatusIcon(connection.status)}
                      <span className="ml-1 capitalize">{connection.status}</span>
                    </Badge>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Response Time</div>
                    <div className={`font-medium ${getResponseTimeColor(connection.responseTime)}`}>
                      {formatResponseTime(connection.responseTime)}
                    </div>
                  </div>
                  
                  {rateLimit && (
                    <>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">API Usage</div>
                        <div className={`font-medium ${rateLimit.percentage > 80 ? 'text-red-600' : rateLimit.percentage > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {rateLimit.used}/{rateLimit.used + rateLimit.remaining}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Reset Time</div>
                        <div className="font-medium text-xs">
                          {rateLimit.resetTime}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {!rateLimit && (
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className={`font-medium ${connection.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                        {connection.status === 'connected' ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rate Limit Progress Bar */}
                {rateLimit && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Rate Limit Usage</span>
                      <span>{rateLimit.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={rateLimit.percentage} 
                      className={`h-2 ${
                        rateLimit.percentage > 80 ? 'bg-red-100' : 
                        rateLimit.percentage > 60 ? 'bg-yellow-100' : 'bg-green-100'
                      }`}
                    />
                  </div>
                )}

                {/* Error Message */}
                {connection.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Error:</span>
                    </div>
                    <div className="mt-1 ml-4">{connection.error}</div>
                  </div>
                )}

                {/* Success Indicator for Connected Services */}
                {connection.status === 'connected' && !connection.error && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <Activity className="h-3 w-3" />
                    <span>Service operational</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {apiConnections.length === 0 && !isLoading && !error && (
          <div className="text-center text-muted-foreground py-8">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No API Connections</p>
            <p className="text-sm">API connection status will appear here once configured.</p>
          </div>
        )}

        {/* Overall System Health Summary */}
        {apiConnections.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectedCount === totalCount ? 'bg-green-500' :
                  connectedCount > totalCount * 0.5 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="font-medium">System Health:</span>
                <span className={
                  connectedCount === totalCount ? 'text-green-600' :
                  connectedCount > totalCount * 0.5 ? 'text-yellow-600' :
                  'text-red-600'
                }>
                  {connectedCount === totalCount ? 'All Systems Operational' :
                   connectedCount > totalCount * 0.5 ? 'Partial Service Available' :
                   'Service Disruption'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}