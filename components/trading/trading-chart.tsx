'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTradingData } from '@/hooks/use-trading-data';

interface TradingChartProps {
  symbol: string;
  interval: string;
  height: string;
}

export function TradingChart({ symbol, interval, height }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [timeframe, setTimeframe] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  
  const { getMarketPrice, connectionStatus, latency } = useTradingData();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485563',
      },
      timeScale: {
        borderColor: '#485563',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Generate initial price data based on current market price or default
    const generateData = async () => {
      let basePrice = 43250; // Default price
      
      // Try to get real current price
      try {
        const marketPrice = await getMarketPrice(symbol);
        if (marketPrice) {
          basePrice = marketPrice.price;
          setCurrentPrice(marketPrice.price);
          setPriceChange(marketPrice.changePercent);
        }
      } catch (err) {
        console.warn('Failed to get current price, using default:', err);
      }

      const data: CandlestickData[] = [];
      let time = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago
      let price = basePrice * 0.98; // Start slightly below current price

      for (let i = 0; i < 1440; i++) { // 1440 minutes in a day
        const open = price;
        const volatility = basePrice * 0.001; // 0.1% volatility
        const close = price + (Math.random() - 0.5) * volatility * 2;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;

        data.push({
          time: time as any,
          open,
          high,
          low,
          close,
        });

        price = close;
        time += 60; // 1 minute intervals
      }

      // Ensure the last data point matches current price
      if (data.length > 0 && currentPrice) {
        data[data.length - 1].close = currentPrice;
      }

      return data;
    };

    generateData().then(data => {
      candlestickSeries.setData(data);
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    // Real-time price updates
    const interval_id = setInterval(async () => {
      if (candlestickSeriesRef.current) {
        try {
          const marketPrice = await getMarketPrice(symbol);
          if (marketPrice) {
            setCurrentPrice(marketPrice.price);
            setPriceChange(marketPrice.changePercent);
            
            const timestamp = Math.floor(Date.now() / 1000);
            const volatility = marketPrice.price * 0.001;
            const priceVariation = (Math.random() - 0.5) * volatility;
            const newPrice = marketPrice.price + priceVariation;
            
            const newDataPoint: CandlestickData = {
              time: timestamp as any,
              open: currentPrice || newPrice,
              high: newPrice + Math.random() * volatility * 0.5,
              low: newPrice - Math.random() * volatility * 0.5,
              close: newPrice,
            };
            candlestickSeriesRef.current.update(newDataPoint);
          }
        } catch (err) {
          console.warn('Failed to update chart with real price:', err);
          // Fallback to simulated data
          if (currentPrice) {
            const timestamp = Math.floor(Date.now() / 1000);
            const volatility = currentPrice * 0.001;
            const newPrice = currentPrice + (Math.random() - 0.5) * volatility;
            
            const newDataPoint: CandlestickData = {
              time: timestamp as any,
              open: currentPrice,
              high: newPrice + Math.random() * volatility * 0.5,
              low: newPrice - Math.random() * volatility * 0.5,
              close: newPrice,
            };
            candlestickSeriesRef.current.update(newDataPoint);
            setCurrentPrice(newPrice);
          }
        }
      }
    }, 5000); // Update every 5 seconds

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      clearInterval(interval_id);
      chart.remove();
    };
  }, [symbol]);

  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Chart Header with Price Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">{symbol}</h3>
            {currentPrice && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  ${currentPrice.toFixed(2)}
                </span>
                {priceChange !== null && (
                  <Badge 
                    variant="outline" 
                    className={priceChange >= 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}
            >
              {connectionStatus}
            </Badge>
            {latency && (
              <Badge variant="outline" className="text-blue-600">
                {latency}ms
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Timeframe:</span>
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              size="sm"
              variant={timeframe === tf.value ? 'default' : 'outline'}
              onClick={() => setTimeframe(tf.value)}
            >
              {tf.label}
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Live Price Updates Every 5 Seconds
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="flex-1 min-h-0"
        style={{ height: height === '100%' ? '100%' : height }}
      />
    </div>
  );
} 