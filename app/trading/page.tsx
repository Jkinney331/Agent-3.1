'use client';

import { useState } from 'react';
import { TradingChart } from '@/components/trading/trading-chart';
import { OrderBook } from '@/components/trading/order-book';
import { OrderEntry } from '@/components/trading/order-entry';
import { PositionManager } from '@/components/trading/position-manager';
import { PriceTicker } from '@/components/trading/price-ticker';
import { TradingHeader } from '@/components/trading/trading-header';
import { Navigation } from '@/components/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { useTradingData } from '@/hooks/use-trading-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TradingPage() {
  const { user } = useAuthStore();
  const { portfolioData, connectionStatus } = useTradingData();
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('limit');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            Please log in to access the trading interface.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex flex-col h-screen bg-background">
        {/* Trading Header */}
        <TradingHeader 
          selectedPair={selectedPair}
          onPairChange={setSelectedPair}
          connectionStatus={connectionStatus}
          portfolio={portfolioData}
        />

        {/* Price Ticker */}
        <PriceTicker selectedPair={selectedPair} />

        {/* Main Trading Interface */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
          {/* Chart Area - Takes up most space */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 p-4">
              <div className="h-full">
                <TradingChart 
                  symbol={selectedPair}
                  interval="1m"
                  height="100%"
                />
              </div>
            </Card>

            {/* Position Manager */}
            <div className="mt-4">
              <PositionManager />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            {/* Order Entry */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Order Entry
                <Badge 
                  variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {connectionStatus}
                </Badge>
              </h3>
              <OrderEntry 
                symbol={selectedPair}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
              />
            </Card>

            {/* Order Book */}
            <Card className="flex-1 p-4">
              <h3 className="text-lg font-semibold mb-4">Order Book</h3>
              <OrderBook symbol={selectedPair} />
            </Card>
          </div>
        </div>

        {/* Bottom Panel - Trading History/Orders */}
        <div className="border-t bg-card">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders">Open Orders</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
              <TabsTrigger value="fills">Order Fills</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="p-4">
              <div className="text-sm text-muted-foreground">
                No open orders
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="p-4">
              <div className="text-sm text-muted-foreground">
                No recent trades
              </div>
            </TabsContent>
            
            <TabsContent value="fills" className="p-4">
              <div className="text-sm text-muted-foreground">
                No order fills
              </div>
            </TabsContent>
            
            <TabsContent value="balances" className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">USDT</div>
                  <div className="font-mono">25,430.50</div>
                </div>
                <div>
                  <div className="text-muted-foreground">BTC</div>
                  <div className="font-mono">0.25684</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ETH</div>
                  <div className="font-mono">3.4567</div>
                </div>
                <div>
                  <div className="text-muted-foreground">BNB</div>
                  <div className="font-mono">12.45</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 