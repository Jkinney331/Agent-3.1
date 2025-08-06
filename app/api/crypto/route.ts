import { NextRequest, NextResponse } from 'next/server';
import { cryptoAPI } from '@/lib/mcp/crypto-api-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const symbol = searchParams.get('symbol');
  const limit = searchParams.get('limit');

  try {
    switch (action) {
      case 'price':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter required for price action' },
            { status: 400 }
          );
        }
        const price = await cryptoAPI.getCryptoPrice(symbol);
        return NextResponse.json(price);

      case 'trending':
        const trending = await cryptoAPI.getTrendingCoins();
        return NextResponse.json(trending);

      case 'fear-greed':
        const fearGreed = await cryptoAPI.getFearGreedIndex();
        return NextResponse.json(fearGreed);

      case 'global':
        const global = await cryptoAPI.getGlobalMarketData();
        return NextResponse.json(global);

      case 'gainers':
        const gainers = await cryptoAPI.getTopGainers(
          limit ? parseInt(limit) : 10
        );
        return NextResponse.json(gainers);

      case 'losers':
        const losers = await cryptoAPI.getTopLosers(
          limit ? parseInt(limit) : 10
        );
        return NextResponse.json(losers);

      case 'news':
        const currencies = searchParams.get('currencies');
        const news = await cryptoAPI.getCryptoNews(currencies || undefined);
        return NextResponse.json(news);

      case 'binance-ticker':
        const ticker = await cryptoAPI.getBinance24hrTicker(symbol || undefined);
        return NextResponse.json(ticker);

      case 'orderbook':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter required for orderbook action' },
            { status: 400 }
          );
        }
        const orderbook = await cryptoAPI.getBinanceOrderbook(
          symbol,
          limit ? parseInt(limit) : 100
        );
        return NextResponse.json(orderbook);

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action',
            available_actions: [
              'price',
              'trending', 
              'fear-greed',
              'global',
              'gainers',
              'losers',
              'news',
              'binance-ticker',
              'orderbook'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Crypto API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 