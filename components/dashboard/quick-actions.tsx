'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  BarChart3, 
  Bot, 
  AlertTriangle,
  X,
  DollarSign,
  Target,
  Shield
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QuickBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  side: 'buy' | 'sell';
}

function QuickTradeModal({ isOpen, onClose, side }: QuickBuyModalProps) {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [amount, setAmount] = useState('1000');
  const [orderType, setOrderType] = useState('market');
  const [isExecuting, setIsExecuting] = useState(false);

  const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];

  const handleExecuteTrade = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/trading/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toLowerCase().replace('usdt', ''),
          capital: parseInt(amount),
          action: 'execute',
          side: side
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${side.toUpperCase()} order executed successfully!\n\nMode: ${result.mode}\nExecution: ${result.execution.message}`);
      } else {
        alert(`❌ Trade execution failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error executing trade: ${error}`);
    } finally {
      setIsExecuting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {side === 'buy' ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            Quick {side.charAt(0).toUpperCase() + side.slice(1)} Order
          </DialogTitle>
          <DialogDescription>
            Execute a {side} order with AI risk management and position sizing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Symbol Selection */}
          <div className="space-y-2">
            <Label htmlFor="symbol">Trading Pair</Label>
            <div className="grid grid-cols-3 gap-2">
              {popularSymbols.map((sym) => (
                <Button
                  key={sym}
                  variant={symbol === sym ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSymbol(sym)}
                  className="text-xs"
                >
                  {sym}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="font-mono"
            />
            <div className="flex gap-2">
              {['500', '1000', '2500', '5000'].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt)}
                  className="text-xs"
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderType === 'market' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('market')}
              >
                Market Order
              </Button>
              <Button
                variant={orderType === 'ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('ai')}
              >
                AI Optimized
              </Button>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Risk Notice</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              This will execute a {side} order for {symbol} with ${amount} using {orderType === 'ai' ? 'AI-optimized' : 'market'} execution.
              Currently in {orderType === 'ai' ? 'paper trading' : 'demo'} mode.
            </p>
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleExecuteTrade}
            disabled={isExecuting || !amount || !symbol}
            className={`w-full ${
              side === 'buy' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isExecuting ? (
              'Executing...'
            ) : (
              `Execute ${side.toUpperCase()} Order`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Additional Modal Components
function AIStrategyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [confidence, setConfidence] = useState('70');
  const [maxPositions, setMaxPositions] = useState('3');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Strategy Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your AI trading strategy parameters and risk settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Risk Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {['conservative', 'moderate', 'aggressive'].map((level) => (
                <Button
                  key={level}
                  variant={riskLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRiskLevel(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Confidence Threshold (%)</Label>
            <Input
              id="confidence"
              type="number"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              min="50"
              max="95"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPositions">Max Concurrent Positions</Label>
            <Input
              id="maxPositions"
              type="number"
              value={maxPositions}
              onChange={(e) => setMaxPositions(e.target.value)}
              min="1"
              max="10"
            />
          </div>

          <Button className="w-full">
            Update AI Strategy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RiskManagementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [stopLoss, setStopLoss] = useState('5');
  const [takeProfit, setTakeProfit] = useState('10');
  const [maxDrawdown, setMaxDrawdown] = useState('15');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Risk Management Settings
          </DialogTitle>
          <DialogDescription>
            Configure your risk management parameters and safety limits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stopLoss">Default Stop Loss (%)</Label>
            <Input
              id="stopLoss"
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              min="1"
              max="20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takeProfit">Default Take Profit (%)</Label>
            <Input
              id="takeProfit"
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              min="5"
              max="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDrawdown">Maximum Drawdown (%)</Label>
            <Input
              id="maxDrawdown"
              type="number"
              value={maxDrawdown}
              onChange={(e) => setMaxDrawdown(e.target.value)}
              min="5"
              max="25"
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Current Risk Settings</span>
            </div>
            <div className="text-xs text-orange-700 mt-1 space-y-1">
              <div>• Stop Loss: {stopLoss}% per trade</div>
              <div>• Take Profit: {takeProfit}% per trade</div>
              <div>• Max Portfolio Drawdown: {maxDrawdown}%</div>
            </div>
          </div>

          <Button className="w-full">
            Update Risk Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuickActions() {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [aiStrategyModalOpen, setAiStrategyModalOpen] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);

  const actions = [
    {
      title: 'Quick Buy',
      description: 'Execute market buy order',
      icon: TrendingUp,
      variant: 'default' as const,
      color: 'bg-green-600 hover:bg-green-700 text-white',
      onClick: () => setBuyModalOpen(true),
    },
    {
      title: 'Quick Sell',
      description: 'Execute market sell order',
      icon: TrendingDown,
      variant: 'destructive' as const,
      color: 'bg-red-600 hover:bg-red-700 text-white',
      onClick: () => setSellModalOpen(true),
    },
    {
      title: 'AI Strategy',
      description: 'Configure AI trading',
      icon: Bot,
      variant: 'outline' as const,
      color: '',
      onClick: () => setAiStrategyModalOpen(true),
    },
    {
      title: 'Analytics',
      description: 'View performance',
      icon: BarChart3,
      variant: 'outline' as const,
      color: '',
      onClick: () => window.location.href = '/analytics',
    },
    {
      title: 'Risk Management',
      description: 'Set stop losses',
      icon: AlertTriangle,
      variant: 'outline' as const,
      color: '',
      onClick: () => setRiskModalOpen(true),
    },
    {
      title: 'Settings',
      description: 'Adjust preferences',
      icon: Settings,
      variant: 'outline' as const,
      color: '',
      onClick: () => alert('Settings panel coming soon! 🚀'),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
            <Badge variant="outline" className="ml-auto text-xs">
              AI Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant={action.variant}
                  className={`h-auto p-4 flex-col items-start ${action.color} transition-all hover:scale-105`}
                  onClick={action.onClick}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{action.title}</span>
                  </div>
                  <span className="text-xs opacity-80">{action.description}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <QuickTradeModal 
        isOpen={buyModalOpen} 
        onClose={() => setBuyModalOpen(false)} 
        side="buy" 
      />
      <QuickTradeModal 
        isOpen={sellModalOpen} 
        onClose={() => setSellModalOpen(false)} 
        side="sell" 
      />
      <AIStrategyModal 
        isOpen={aiStrategyModalOpen} 
        onClose={() => setAiStrategyModalOpen(false)} 
      />
      <RiskManagementModal 
        isOpen={riskModalOpen} 
        onClose={() => setRiskModalOpen(false)} 
      />
    </>
  );
} 