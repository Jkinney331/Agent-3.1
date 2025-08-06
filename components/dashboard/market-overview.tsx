'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MarketData {
  global: any;
  fearGreed: any;
  gainers: any[];
  trending: any[];
  topCryptos: any[];
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all market data in parallel
        const [globalRes, fearGreedRes, gainersRes, trendingRes] = await Promise.all([
          fetch('/api/crypto?action=global'),
          fetch('/api/crypto?action=fear-greed'),
          fetch('/api/crypto?action=gainers&limit=5'),
          fetch('/api/crypto?action=trending')
        ]);

        const [global, fearGreed, gainers, trending] = await Promise.all([
          globalRes.json(),
          fearGreedRes.json(),
          gainersRes.json(),
          trendingRes.json()
        ]);

        // Fetch top crypto prices
        const topCryptoSymbols = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'];
        const topCryptoPromises = topCryptoSymbols.map(symbol =>
          fetch(`/api/crypto?action=price&symbol=${symbol}`).then(res => res.json())
        );
        const topCryptos = await Promise.all(topCryptoPromises);

        setMarketData({
          global,
          fearGreed,
          gainers,
          trending,
          topCryptos
        });
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Overview
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return 'text-red-500 bg-red-100';
    if (value <= 45) return 'text-orange-500 bg-orange-100';
    if (value <= 55) return 'text-yellow-500 bg-yellow-100';
    if (value <= 75) return 'text-green-500 bg-green-100';
    return 'text-emerald-500 bg-emerald-100';
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Global Market Stats - Fixed Responsive Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Activity className="h-5 w-5" />
            Global Market Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {marketData?.global?.data && (
              <>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                  <div className="text-lg md:text-2xl font-bold text-blue-700 mb-1">
                    {formatLargeNumber(marketData.global.data.total_market_cap?.usd || 0)}
                  </div>
                  <div className="text-xs md:text-sm text-blue-600 font-medium">Total Market Cap</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                  <div className="text-lg md:text-2xl font-bold text-purple-700 mb-1">
                    {formatLargeNumber(marketData.global.data.total_volume?.usd || 0)}
                  </div>
                  <div className="text-xs md:text-sm text-purple-600 font-medium">24h Volume</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                  <div className="text-lg md:text-2xl font-bold text-green-700 mb-1">
                    {(marketData.global.data.active_cryptocurrencies || 0).toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-green-600 font-medium">Active Cryptos</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
                  <div className="text-lg md:text-2xl font-bold text-orange-700 mb-1">
                    {(marketData.global.data.market_cap_percentage?.btc || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs md:text-sm text-orange-600 font-medium">BTC Dominance</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout - Improved Mobile Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Fear & Greed Index - Enhanced Design */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fear & Greed Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketData?.fearGreed && marketData.fearGreed.value !== undefined ? (
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="text-4xl md:text-6xl font-bold mb-2">
                    {marketData.fearGreed.value}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full h-2 mt-2 opacity-20"></div>
                </div>
                <Badge className={`${getFearGreedColor(parseInt(marketData.fearGreed.value))} px-3 py-1 text-sm font-medium`}>
                  {marketData.fearGreed.value_classification}
                </Badge>
                <div className="mt-3 text-sm text-muted-foreground">
                  Market Sentiment Indicator
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm text-muted-foreground">
                  Fear & Greed data unavailable
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Gainers - Enhanced List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Gainers (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(marketData?.gainers) && marketData.gainers.length > 0 ? (
                marketData.gainers.slice(0, 5).map((coin: any, index: number) => (
                  <div key={coin.id} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-700">#{index + 1}</span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{coin.symbol?.toUpperCase()}</span>
                        <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {coin.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(coin.current_price, 'USD')}
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                        +{coin.price_change_percentage_24h?.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-muted-foreground">
                    {marketData?.gainers && !Array.isArray(marketData.gainers) 
                      ? 'Failed to load gainers data' 
                      : 'No gainers data available'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Coins - Improved Grid Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Cryptocurrencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.isArray(marketData?.trending) && marketData.trending.length > 0 ? (
              marketData.trending.slice(0, 10).map((trending: any, index: number) => (
                <div key={trending.id} className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg text-center border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="font-semibold text-sm text-slate-800 mb-1">
                    {trending.symbol?.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-600 mb-2 truncate">
                    {trending.name}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{trending.market_cap_rank}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm text-muted-foreground">
                  {marketData?.trending && !Array.isArray(marketData.trending)
                    ? 'Failed to load trending data'
                    : 'No trending data available'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 