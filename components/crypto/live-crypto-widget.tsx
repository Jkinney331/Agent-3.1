'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

export function LiveCryptoWidget() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/crypto?action=trending');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setCryptoData(data.data);
        } else {
          // Fallback data if API fails
          setCryptoData([
            { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 67234, price_change_percentage_24h: 2.34, market_cap: 1321000000000 },
            { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 3456, price_change_percentage_24h: -1.23, market_cap: 415000000000 },
            { id: 'binancecoin', symbol: 'BNB', name: 'BNB', current_price: 345, price_change_percentage_24h: 1.87, market_cap: 53000000000 },
            { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 165, price_change_percentage_24h: 4.21, market_cap: 71000000000 },
            { id: 'cardano', symbol: 'ADA', name: 'Cardano', current_price: 0.52, price_change_percentage_24h: -0.87, market_cap: 18000000000 },
            { id: 'polygon', symbol: 'MATIC', name: 'Polygon', current_price: 0.89, price_change_percentage_24h: 3.45, market_cap: 8200000000 },
            { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', current_price: 14.67, price_change_percentage_24h: 2.11, market_cap: 8600000000 },
            { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', current_price: 7.23, price_change_percentage_24h: -1.56, market_cap: 9100000000 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        setError('Failed to fetch crypto data');
        // Use fallback data on error
        setCryptoData([
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 67234, price_change_percentage_24h: 2.34, market_cap: 1321000000000 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 3456, price_change_percentage_24h: -1.23, market_cap: 415000000000 },
          { id: 'binancecoin', symbol: 'BNB', name: 'BNB', current_price: 345, price_change_percentage_24h: 1.87, market_cap: 53000000000 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 165, price_change_percentage_24h: 4.21, market_cap: 71000000000 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 100) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toLocaleString()}`;
    }
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-xs">Loading market data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white py-2 px-4 overflow-hidden h-8">
      <div className="flex items-center gap-4 h-full">
        {/* Ticker Label */}
        <div className="flex items-center gap-2 text-green-400 font-medium text-xs whitespace-nowrap">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          LIVE MARKETS
        </div>
        
        {/* Scrolling Ticker Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-6 animate-scroll-left">
            {cryptoData.concat(cryptoData).map((crypto, index) => (
              <div key={`${crypto.id}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-bold text-yellow-400 text-xs">{crypto.symbol}</span>
                <span className="text-white font-medium text-xs">{formatPrice(crypto.current_price)}</span>
                <span 
                  className={`flex items-center gap-1 text-xs font-medium ${
                    crypto.price_change_percentage_24h >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}
                >
                  {crypto.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {formatPercentage(crypto.price_change_percentage_24h)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 