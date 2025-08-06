import { NextRequest, NextResponse } from 'next/server';
import { cryptoAPI } from '@/lib/mcp/crypto-api-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const symbol = searchParams.get('symbol');
  const tickers = searchParams.get('tickers');

  try {
    switch (action) {
      case 'stock-quote':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter required for stock quote' },
            { status: 400 }
          );
        }
        const quote = await cryptoAPI.getStockQuote(symbol);
        return NextResponse.json(quote);

      case 'sentiment':
        const sentiment = await cryptoAPI.getMarketSentiment(tickers || undefined);
        return NextResponse.json(sentiment);

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action',
            available_actions: [
              'stock-quote',
              'sentiment'
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 