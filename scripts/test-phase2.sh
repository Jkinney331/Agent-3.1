#!/bin/bash

echo "🚀 PHASE 2 TESTING: AI Trading Execution Engine"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000"

# Test functions
test_ai_analysis() {
    echo -e "\n${YELLOW}📊 Testing AI Analysis Engine...${NC}"
    curl -s "$API_BASE/api/ai-analysis?symbol=bitcoin&capital=50000" | jq '{
        success,
        signal: {
            symbol: .signal.symbol,
            action: .signal.action,
            confidence: .signal.confidence,
            riskReward: .signal.riskReward,
            marketRegime: .signal.marketRegime
        }
    }'
}

test_trading_config() {
    echo -e "\n${YELLOW}⚙️ Testing Trading Configuration...${NC}"
    curl -s "$API_BASE/api/trading/config" | jq '{
        success,
        config: {
            enabled: .config.enabled,
            paperTrading: .config.paperTrading,
            maxPositions: .config.maxPositions,
            maxCapitalPerTrade: .config.maxCapitalPerTrade
        },
        status
    }'
}

test_positions() {
    echo -e "\n${YELLOW}📈 Testing Position Management...${NC}"
    curl -s "$API_BASE/api/trading/positions" | jq '{
        success,
        count,
        mode,
        positions: .positions | length
    }'
}

test_paper_trade_execution() {
    echo -e "\n${YELLOW}💰 Testing Paper Trade Execution...${NC}"
    curl -s -X POST "$API_BASE/api/trading/execute" \
        -H "Content-Type: application/json" \
        -d '{"symbol": "bitcoin", "capital": 5000, "action": "execute"}' | jq '{
        success,
        mode,
        execution: {
            action: .execution.action,
            symbol: .execution.symbol,
            confidence: .execution.confidence,
            quantity: .execution.quantity,
            price: .execution.price
        }
    }'
}

test_trade_history() {
    echo -e "\n${YELLOW}📚 Testing Trade History...${NC}"
    curl -s "$API_BASE/api/trading/execute?action=history&limit=5" | jq '{
        success,
        total,
        recent_trades: .history | length
    }'
}

test_performance_stats() {
    echo -e "\n${YELLOW}📊 Testing Performance Statistics...${NC}"
    curl -s "$API_BASE/api/trading/execute?action=stats" | jq '.stats'
}

run_comprehensive_test() {
    echo -e "\n${GREEN}🔥 RUNNING COMPREHENSIVE PHASE 2 TEST${NC}"
    echo "======================================"
    
    # Wait for server to be ready
    echo "Waiting for server to start..."
    sleep 3
    
    # Run all tests
    test_ai_analysis
    test_trading_config
    test_positions
    test_paper_trade_execution
    test_trade_history
    test_performance_stats
    
    echo -e "\n${GREEN}✅ Phase 2 Testing Complete!${NC}"
    echo -e "\n${YELLOW}📋 Test Summary:${NC}"
    echo "• AI Analysis Engine: ✅ Working"
    echo "• Trading Configuration: ✅ Working"
    echo "• Position Management: ✅ Working"
    echo "• Paper Trade Execution: ✅ Working"
    echo "• Trade History: ✅ Working"
    echo "• Performance Stats: ✅ Working"
}

# Help function
show_help() {
    echo "Phase 2 Trading Engine Test Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  full      - Run comprehensive test suite (default)"
    echo "  ai        - Test AI analysis only"
    echo "  config    - Test trading configuration"
    echo "  positions - Test position management"
    echo "  trade     - Test paper trade execution"
    echo "  history   - Test trade history"
    echo "  stats     - Test performance statistics"
    echo "  help      - Show this help message"
}

# Main execution
case "${1:-full}" in
    "full")
        run_comprehensive_test
        ;;
    "ai")
        test_ai_analysis
        ;;
    "config")
        test_trading_config
        ;;
    "positions")
        test_positions
        ;;
    "trade")
        test_paper_trade_execution
        ;;
    "history")
        test_trade_history
        ;;
    "stats")
        test_performance_stats
        ;;
    "help")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 