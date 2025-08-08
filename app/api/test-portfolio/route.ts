import { NextResponse } from 'next/server'
import { tradingDB } from '@/lib/database/supabase-client'

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  value: number;
}

export async function GET() {
  try {
    // Get real account data from database
    const userId = 'demo-user'
    const account = await tradingDB.getAccount(userId)
    
    if (!account) {
      return NextResponse.json({
        success: false,
        error: 'No trading account found'
      }, { status: 404 });
    }

    // Get real positions from database
    const positions = await tradingDB.getPositions(account.id)
    
    // Calculate real portfolio metrics
    const totalPositionsValue = positions.reduce((sum, pos) => sum + pos.market_value, 0)
    const totalValue = account.balance + totalPositionsValue
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0)
    const totalPnLPercent = account.initial_balance > 0 ? (totalPnL / account.initial_balance) * 100 : 0

    const portfolioData = {
      totalValue: totalValue,
      balance: account.balance,
      initialBalance: account.initial_balance,
      dayPnL: 0, // TODO: Calculate from daily snapshots
      dayPnLPercent: 0, // TODO: Calculate from daily snapshots
      totalPnL: totalPnL,
      totalPnLPercent: totalPnLPercent
    };

    const formattedPositions: Position[] = positions.map(pos => ({
      id: pos.id,
      symbol: pos.symbol,
      quantity: pos.quantity,
      value: pos.market_value
    }));

    return NextResponse.json({
      success: true,
      data: {
        portfolio: portfolioData,
        positions: formattedPositions,
        message: "Real portfolio data from Supabase database"
      }
    });
  } catch (error) {
    console.error('Test portfolio API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch portfolio data'
    }, { status: 500 });
  }
} 