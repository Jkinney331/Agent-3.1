'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceTickerProps {
  selectedPair: string;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export function PriceTicker({ selectedPair }: PriceTickerProps) {
  const [priceData, setPriceData] = useState<PriceData>({
    symbol: selectedPair,
    price: 43250.75,
    change24h: 2.45,
    volume24h: 1234567890,
    high24h: 43890.12,
    low24h: 42100.50
  });

  // Simulate real-time price updates with deterministic values
  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = Date.now();
      setPriceData(prev => ({
        ...prev,
        price: prev.price + (timestamp % 2 === 0 ? 1 : -1) * ((timestamp % 100) / 10),
        change24h: prev.change24h + (timestamp % 3 === 0 ? 0.1 : -0.1),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isPositive = priceData.change24h >= 0;

  return (
    <div className="border-b bg-card px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8 text-sm">
          {/* Current Price */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{selectedPair}</span>
            <span className="font-mono text-2xl font-bold">
              ${priceData.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
            <Badge 
              variant={isPositive ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}{priceData.change24h.toFixed(2)}%
            </Badge>
          </div>

          {/* 24h Stats */}
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted-foreground">24h High: </span>
              <span className="font-mono">
                ${priceData.high24h.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">24h Low: </span>
              <span className="font-mono">
                ${priceData.low24h.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">24h Volume: </span>
              <span className="font-mono">
                ${(priceData.volume24h / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Market Open</span>
        </div>
      </div>
    </div>
  );
} 