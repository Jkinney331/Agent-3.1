'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Brain, 
  Zap, 
  Target, 
  Shield, 
  Eye,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTradingData } from '@/hooks/use-trading-data';
import { useN8NData } from '@/hooks/use-n8n-data';

export function TradingActivity() {
  const {
    recentOrders,
    connectionStatus,
    latency,
    isLoading,
    error,
    refreshData
  } = useTradingData();

  const {
    recentExecutions,
    workflows
  } = useN8NData();

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('orders');

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const calculateProfit = (order: any) => {
    if (order.status !== 'filled') return null;
    
    const totalValue = order.quantity * order.price;
    
    // This is a simplified profit calculation
    // In a real scenario, you'd calculate against the current market price
    return order.side === 'buy' ? null : `+${formatCurrency(totalValue * 0.02, 'USD')}`;
  };

  // Find matching n8n execution for an order to show AI decision context
  const findOrderExecution = (orderId: string) => {
    return recentExecutions.find(exec => 
      exec.data?.orderId === orderId || 
      exec.data?.orders?.some((o: any) => o.id === orderId)
    );
  };

  // Get AI decision confidence and reasoning
  const getAIDecisionData = (order: any) => {
    const execution = findOrderExecution(order.id);
    if (!execution || !execution.data) return null;

    return {
      confidence: execution.data.confidence || 0.85,
      reasoning: execution.data.reasoning || 'Technical analysis indicates favorable market conditions',
      signals: execution.data.signals || [],
      riskScore: execution.data.riskScore || 0.3,
      strategy: execution.data.strategy || 'AI Adaptive',
      executionId: execution.id
    };
  };

  // Categorize orders by source (n8n vs manual)
  const enrichedOrders = recentOrders.map(order => ({
    ...order,
    isN8NExecuted: !!findOrderExecution(order.id),
    aiDecision: getAIDecisionData(order)
  }));

  const n8nOrders = enrichedOrders.filter(order => order.isN8NExecuted);
  const manualOrders = enrichedOrders.filter(order => !order.isN8NExecuted);

  const renderOrderCard = (order: any) => {
    const profit = calculateProfit(order);
    const isProfit = profit && profit.includes('+');
    const aiDecision = order.aiDecision;
    const isExpanded = expandedOrder === order.id;
    
    return (
      <div key={order.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Badge 
                variant={order.side === 'buy' ? 'default' : 'secondary'}
                className={order.side === 'buy' ? 'bg-green-600' : 'bg-red-600'}
              >
                {order.side.toUpperCase()}
              </Badge>
              {order.isN8NExecuted && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Zap className="h-2 w-2 mr-1" />
                  AI
                </Badge>
              )}
            </div>
            <div>
              <div className="font-medium">{order.symbol}</div>
              <div className="text-sm text-muted-foreground">
                {order.quantity} @ {formatCurrency(order.price, 'USD')}
              </div>
              <div className="text-xs text-blue-600 flex items-center gap-1">
                Type: {order.orderType}
                {aiDecision && (
                  <span className="text-purple-600">• {aiDecision.strategy}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {formatTimeAgo(order.filledAt || order.createdAt)}
            </div>
            {profit && (
              <div className={`flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {profit}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge 
                variant={order.status === 'filled' ? 'default' : 'outline'}
                className={order.status === 'filled' ? 'bg-green-100 text-green-800' : ''}
              >
                {order.status}
              </Badge>
              {aiDecision && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="h-6 px-2"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* AI Decision Details */}
        {aiDecision && isExpanded && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">AI Decision Analysis</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-blue-600 mb-1">Confidence Score</div>
                  <div className="flex items-center gap-2">
                    <Progress value={aiDecision.confidence * 100} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{(aiDecision.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-1">Risk Score</div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={aiDecision.riskScore * 100} 
                      className={`h-2 flex-1 ${aiDecision.riskScore > 0.7 ? 'bg-red-100' : aiDecision.riskScore > 0.4 ? 'bg-yellow-100' : 'bg-green-100'}`}
                    />
                    <span className="text-sm font-medium">{(aiDecision.riskScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-blue-600 mb-1">Strategy</div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    <Target className="h-3 w-3 mr-1" />
                    {aiDecision.strategy}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-blue-600 mb-1">Execution ID</div>
                  <code className="text-xs bg-white px-2 py-1 rounded border">
                    {aiDecision.executionId.substring(0, 8)}...
                  </code>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className="text-xs text-blue-600 mb-1">AI Reasoning</div>
              <p className="text-sm text-gray-700 bg-white p-2 rounded border italic">
                "{aiDecision.reasoning}"
              </p>
            </div>

            {aiDecision.signals && aiDecision.signals.length > 0 && (
              <div>
                <div className="text-xs text-blue-600 mb-2">Trading Signals</div>
                <div className="flex flex-wrap gap-1">
                  {aiDecision.signals.slice(0, 3).map((signal: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {signal}
                    </Badge>
                  ))}
                  {aiDecision.signals.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{aiDecision.signals.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Trading Activity
            <Badge 
              variant="outline" 
              className={connectionStatus === 'connected' ? 'text-green-600 ml-auto' : 'text-red-600 ml-auto'}
            >
              {connectionStatus}
            </Badge>
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
            <Activity className="h-5 w-5" />
            AI Trading Activity
            <Badge 
              variant="outline" 
              className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}
            >
              {enrichedOrders.length} Total
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Zap className="h-3 w-3 mr-1" />
              {n8nOrders.length} AI
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
          <div className="text-center text-red-500 py-4">
            {error}
            <div className="mt-2">
              <Button onClick={refreshData} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {enrichedOrders.length === 0 && !error && (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Trading Activity Yet</p>
            <p className="text-sm">Your AI trading system is ready!</p>
            <p className="text-sm">n8n workflows will execute trades automatically based on market conditions.</p>
            {connectionStatus === 'connected' && latency && (
              <p className="text-xs mt-2">Connected to Alpaca • Response time: {latency}ms</p>
            )}
          </div>
        )}

        {enrichedOrders.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">All Orders ({enrichedOrders.length})</TabsTrigger>
              <TabsTrigger value="ai">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Trades ({n8nOrders.length})
                </div>
              </TabsTrigger>
              <TabsTrigger value="manual">Manual ({manualOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-4">
              <div className="space-y-3">
                {enrichedOrders.map(renderOrderCard)}
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              {n8nOrders.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Orders executed by n8n workflows with AI decision analysis
                  </div>
                  {n8nOrders.map(renderOrderCard)}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No AI-Executed Trades Yet</p>
                  <p className="text-sm">Trades executed by n8n workflows will appear here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              {manualOrders.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Manually executed orders (non-n8n)
                  </div>
                  {manualOrders.map(renderOrderCard)}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Manual Trades</p>
                  <p className="text-sm">All trading is being handled by AI workflows.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {connectionStatus === 'connected' && latency && enrichedOrders.length > 0 && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between">
            <span>Connected to Alpaca • Response time: {latency}ms</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 