'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { Button } from '@/components/ui/button';

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

    // Generate sample data
    const generateData = () => {
      const data: CandlestickData[] = [];
      let time = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago
      let price = 43250;

      for (let i = 0; i < 1440; i++) { // 1440 minutes in a day
        const open = price;
        const close = price + (i % 2 === 0 ? 1 : -1) * ((i % 200) / 2);
        const high = Math.max(open, close) + (i % 100) / 2;
        const low = Math.min(open, close) - (i % 100) / 2;

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

      return data;
    };

    const data = generateData();
    candlestickSeries.setData(data);

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

    // Simulate real-time updates
    const interval_id = setInterval(() => {
      if (candlestickSeriesRef.current) {
        const lastDataPoint = data[data.length - 1];
        const timestamp = Date.now();
        const newDataPoint: CandlestickData = {
          time: (Math.floor(timestamp / 1000)) as any,
          open: lastDataPoint.close,
          high: lastDataPoint.close + (timestamp % 50),
          low: lastDataPoint.close - (timestamp % 50),
          close: lastDataPoint.close + (timestamp % 2 === 0 ? 1 : -1) * (timestamp % 100),
        };
        candlestickSeriesRef.current.update(newDataPoint);
      }
    }, 2000);

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