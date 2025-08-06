'use client';

import { useState, useEffect } from 'react';

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);

  // Generate mock order book data
  useEffect(() => {
    const generateOrderBook = () => {
      const basePrice = 43250;
      const newBids: OrderBookEntry[] = [];
      const newAsks: OrderBookEntry[] = [];

      // Generate bids (below current price) - deterministic values
      for (let i = 0; i < 10; i++) {
        const price = basePrice - (i + 1) * (i * 0.8 + 5);
        const size = (i + 1) * 0.4 + 0.1;
        const total = i === 0 ? size : newBids[i - 1].total + size;
        newBids.push({ price, size, total });
      }

      // Generate asks (above current price) - deterministic values
      for (let i = 0; i < 10; i++) {
        const price = basePrice + (i + 1) * (i * 0.8 + 5);
        const size = (i + 1) * 0.4 + 0.1;
        const total = i === 0 ? size : newAsks[i - 1].total + size;
        newAsks.push({ price, size, total });
      }

      setBids(newBids);
      setAsks(newAsks.reverse()); // Show asks from lowest to highest
    };

    generateOrderBook();
    const interval = setInterval(generateOrderBook, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  const maxTotal = Math.max(
    Math.max(...bids.map(b => b.total), 0),
    Math.max(...asks.map(a => a.total), 0)
  );

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 py-2 text-muted-foreground border-b">
        <div className="text-right">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="flex-1 space-y-0.5 py-2">
        {asks.map((ask, index) => (
          <div
            key={`ask-${index}`}
            className="grid grid-cols-3 gap-2 relative hover:bg-muted/50 py-0.5"
          >
            {/* Background bar */}
            <div
              className="absolute inset-0 bg-red-500/10"
              style={{ width: `${(ask.total / maxTotal) * 100}%` }}
            />
            
            <div className="text-right text-red-500 font-mono relative z-10">
              {ask.price.toFixed(2)}
            </div>
            <div className="text-right text-foreground font-mono relative z-10">
              {ask.size.toFixed(4)}
            </div>
            <div className="text-right text-muted-foreground font-mono relative z-10">
              {ask.total.toFixed(4)}
            </div>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="py-2 border-y bg-muted/20">
        <div className="text-center">
          <div className="text-muted-foreground">Spread</div>
          <div className="font-mono text-sm">
            {asks.length > 0 && bids.length > 0 
              ? (asks[asks.length - 1].price - bids[0].price).toFixed(2)
              : '0.00'
            }
          </div>
        </div>
      </div>

      {/* Bids (Buy Orders) */}
      <div className="flex-1 space-y-0.5 py-2">
        {bids.map((bid, index) => (
          <div
            key={`bid-${index}`}
            className="grid grid-cols-3 gap-2 relative hover:bg-muted/50 py-0.5"
          >
            {/* Background bar */}
            <div
              className="absolute inset-0 bg-green-500/10"
              style={{ width: `${(bid.total / maxTotal) * 100}%` }}
            />
            
            <div className="text-right text-green-500 font-mono relative z-10">
              {bid.price.toFixed(2)}
            </div>
            <div className="text-right text-foreground font-mono relative z-10">
              {bid.size.toFixed(4)}
            </div>
            <div className="text-right text-muted-foreground font-mono relative z-10">
              {bid.total.toFixed(4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 