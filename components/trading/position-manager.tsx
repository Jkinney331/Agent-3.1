'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  margin: number;
}

export function PositionManager() {
  const [positions] = useState<Position[]>([
    {
      id: '1',
      symbol: 'BTCUSDT',
      side: 'long',
      size: 0.25,
      entryPrice: 42800.50,
      markPrice: 43250.75,
      pnl: 112.56,
      pnlPercent: 1.05,
      leverage: 3,
      margin: 3566.71
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      side: 'short',
      size: 2.5,
      entryPrice: 2685.40,
      markPrice: 2642.18,
      pnl: 108.05,
      pnlPercent: 1.61,
      leverage: 2,
      margin: 3356.75
    }
  ]);

  const handleClosePosition = (positionId: string) => {
    console.log('Closing position:', positionId);
  };

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  if (positions.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
        <div className="text-center text-muted-foreground py-8">
          No open positions
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Open Positions</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total P&L:</span>
          <Badge 
            variant={totalPnL >= 0 ? 'default' : 'destructive'}
            className="font-mono"
          >
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {positions.map((position) => (
          <div
            key={position.id}
            className="grid grid-cols-8 gap-4 p-3 bg-muted/30 rounded-lg text-sm"
          >
            {/* Symbol & Side */}
            <div className="flex flex-col">
              <span className="font-mono font-semibold">{position.symbol}</span>
              <Badge 
                variant={position.side === 'long' ? 'default' : 'destructive'}
                className="w-fit text-xs"
              >
                {position.side.toUpperCase()} {position.leverage}x
              </Badge>
            </div>

            {/* Size */}
            <div className="flex flex-col">
              <span className="text-muted-foreground">Size</span>
              <span className="font-mono">{position.size}</span>
            </div>

            {/* Entry Price */}
            <div className="flex flex-col">
              <span className="text-muted-foreground">Entry</span>
              <span className="font-mono">${position.entryPrice.toFixed(2)}</span>
            </div>

            {/* Mark Price */}
            <div className="flex flex-col">
              <span className="text-muted-foreground">Mark</span>
              <span className="font-mono">${position.markPrice.toFixed(2)}</span>
            </div>

            {/* Margin */}
            <div className="flex flex-col">
              <span className="text-muted-foreground">Margin</span>
              <span className="font-mono">${position.margin.toFixed(2)}</span>
            </div>

            {/* P&L */}
            <div className="flex flex-col">
              <span className="text-muted-foreground">P&L</span>
              <span className={`font-mono ${
                position.pnl >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
              </span>
            </div>

            {/* P&L % */}
            <div className="flex flex-col">
              <span className="text-muted-foreground">P&L %</span>
              <span className={`font-mono ${
                position.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleClosePosition(position.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Position Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Total Margin</div>
            <div className="font-mono font-semibold">
              ${positions.reduce((sum, pos) => sum + pos.margin, 0).toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Unrealized P&L</div>
            <div className={`font-mono font-semibold ${
              totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Open Positions</div>
            <div className="font-mono font-semibold">{positions.length}</div>
          </div>
        </div>
      </div>
    </Card>
  );
} 