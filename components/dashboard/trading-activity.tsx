'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TradingOrder {
  id: string;
  order_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  order_type: string;
  status: string;
  filled_quantity?: number;
  filled_price?: number;
  fees?: number;
  strategy_used?: string;
  reasoning?: string;
  confidence_score?: number;
  created_at: string;
  filled_at?: string;
}

export function TradingActivity() {
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealTradingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🎯 FETCH REAL ORDERS FROM SUPABASE DATABASE
        const ordersResponse = await fetch('/api/trading/enhanced-paper-trading?action=orders&limit=10');
        const ordersResult = await ordersResponse.json();
        
        console.log('Orders API Response:', ordersResult);

        if (ordersResult.success && ordersResult.data) {
          setOrders(ordersResult.data);
        } else {
          // No orders yet - this is normal for a fresh $50k account
          setOrders([]);
        }

      } catch (err) {
        console.error('Error fetching real trading data:', err);
        setError('Failed to fetch trading activity');
        setOrders([]); // Empty array for fresh account
      } finally {
        setLoading(false);
      }
    };

    fetchRealTradingData();
    
    // Refresh real trading data every 15 seconds
    const interval = setInterval(fetchRealTradingData, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const calculateProfit = (order: TradingOrder) => {
    if (order.status !== 'filled' || !order.filled_price) return null;
    
    const totalValue = (order.filled_quantity || order.quantity) * order.filled_price;
    const fees = order.fees || 0;
    const netValue = totalValue - fees;
    
    // This is a simplified profit calculation
    // In a real scenario, you'd calculate against the current market price
    return order.side === 'buy' ? null : `+${formatCurrency(netValue * 0.02, 'USD')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Trading Activity
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Trading Activity
          <Badge variant="outline" className="ml-auto">
            {orders.length} Orders
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center text-red-500 py-4">
            {error}
          </div>
        )}
        
        {orders.length === 0 && !error && (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Trading Activity Yet</p>
            <p className="text-sm">Your $50,000 paper trading account is ready!</p>
            <p className="text-sm">Orders will appear here once AI trading begins.</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const profit = calculateProfit(order);
              const isProfit = profit && profit.includes('+');
              
              return (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={order.side === 'buy' ? 'default' : 'secondary'}
                      className={order.side === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                    >
                      {order.side.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{order.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.quantity} @ {formatCurrency(order.filled_price || order.price, 'USD')}
                      </div>
                      {order.strategy_used && (
                        <div className="text-xs text-blue-600">
                          Strategy: {order.strategy_used}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {formatTimeAgo(order.filled_at || order.created_at)}
                    </div>
                    {profit && (
                      <div className={`flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {profit}
                      </div>
                    )}
                    <Badge 
                      variant={order.status === 'filled' ? 'default' : 'outline'}
                      className={order.status === 'filled' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {order.status}
                    </Badge>
                    {order.confidence_score && (
                      <div className="text-xs text-muted-foreground">
                        Confidence: {Math.round(order.confidence_score * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 