'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Power, Settings } from 'lucide-react';

interface PortfolioData {
  totalBalance: number;
  availableBalance: number;
  dailyPnL: number;
}

interface TradingHeaderProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  portfolio: PortfolioData | null;
}

const TRADING_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
  'SOLUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT'
];

// Default portfolio data for when portfolio is null
const DEFAULT_PORTFOLIO: PortfolioData = {
  totalBalance: 0,
  availableBalance: 0,
  dailyPnL: 0,
};

export function TradingHeader({ 
  selectedPair, 
  onPairChange, 
  connectionStatus, 
  portfolio 
}: TradingHeaderProps) {
  // Use default values if portfolio is null
  const portfolioData = portfolio || DEFAULT_PORTFOLIO;

  return (
    <div className="border-b bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Pair Selection */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-mono text-lg">
                {selectedPair}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {TRADING_PAIRS.map((pair) => (
                <DropdownMenuItem
                  key={pair}
                  onClick={() => onPairChange(pair)}
                  className="font-mono"
                >
                  {pair}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            <div className={`h-2 w-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {connectionStatus}
          </Badge>
        </div>

        {/* Center Section - Quick Portfolio Info */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Portfolio Value</div>
            <div className="font-mono font-semibold">
              ${portfolioData.totalBalance.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Available</div>
            <div className="font-mono font-semibold">
              ${portfolioData.availableBalance.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">P&L Today</div>
            <div className={`font-mono font-semibold ${
              portfolioData.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {portfolioData.dailyPnL >= 0 ? '+' : ''}${portfolioData.dailyPnL.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive">
            <Power className="h-4 w-4" />
            Emergency Stop
          </Button>
        </div>
      </div>
    </div>
  );
} 