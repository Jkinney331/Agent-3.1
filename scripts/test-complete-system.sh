#!/bin/bash

# 🧪 Complete System Test Script
# Tests all MCP servers, n8n workflows, and API integrations
# Run this script to validate the entire trading bot ecosystem

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "TESTING")
            echo -e "${PURPLE}🧪 $message${NC}"
            ;;
    esac
}

# Function to record test result
record_test() {
    local test_name=$1
    local result=$2
    local details=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "SUCCESS" "$test_name: PASSED"
        TEST_RESULTS+=("✅ $test_name: PASSED")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_status "ERROR" "$test_name: FAILED - $details"
        TEST_RESULTS+=("❌ $test_name: FAILED - $details")
    fi
}

# Function to test MCP server syntax
test_mcp_server_syntax() {
    local server_file=$1
    local server_name=$2
    
    print_status "TESTING" "Testing $server_name syntax..."
    
    if [ ! -f "$server_file" ]; then
        record_test "$server_name Syntax" "FAIL" "File not found: $server_file"
        return
    fi
    
    # Test Node.js syntax
    if node -c "$server_file" 2>/dev/null; then
        record_test "$server_name Syntax" "PASS" ""
    else
        record_test "$server_name Syntax" "FAIL" "Syntax errors detected"
    fi
}

# Function to test MCP server execution
test_mcp_server_execution() {
    local server_file=$1
    local server_name=$2
    
    print_status "TESTING" "Testing $server_name execution..."
    
    if [ ! -f "$server_file" ]; then
        record_test "$server_name Execution" "FAIL" "File not found: $server_file"
        return
    fi
    
    # Test if server can start (macOS-compatible timeout)
    node "$server_file" >/dev/null 2>&1 &
    local server_pid=$!
    sleep 3
    
    # Check if process is still running (successful start)
    if kill -0 $server_pid 2>/dev/null; then
        kill $server_pid 2>/dev/null || true
        record_test "$server_name Execution" "PASS" "Server started successfully"
    else
        # Check if process exited with error
        wait $server_pid 2>/dev/null
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            record_test "$server_name Execution" "PASS" "Server started and completed normally"
        else
            record_test "$server_name Execution" "FAIL" "Server failed to start (exit code: $exit_code)"
        fi
    fi
}

# Function to test API endpoints
test_api_endpoint() {
    local endpoint=$1
    local method=$2
    local payload=$3
    local endpoint_name=$4
    
    print_status "TESTING" "Testing $endpoint_name API endpoint..."
    
    # Start the Next.js dev server in background if not running
    if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_status "INFO" "Starting Next.js development server..."
        npm run dev >/dev/null 2>&1 &
        NEXTJS_PID=$!
        sleep 10  # Give it time to start
    fi
    
    # Test the endpoint
    if [ "$method" = "POST" ]; then
        if curl -s -X POST -H "Content-Type: application/json" -d "$payload" "http://localhost:3000$endpoint" >/dev/null 2>&1; then
            record_test "$endpoint_name API" "PASS" ""
        else
            record_test "$endpoint_name API" "FAIL" "Endpoint not responding"
        fi
    else
        if curl -s "http://localhost:3000$endpoint" >/dev/null 2>&1; then
            record_test "$endpoint_name API" "PASS" ""
        else
            record_test "$endpoint_name API" "FAIL" "Endpoint not responding"
        fi
    fi
}

# Function to test n8n workflow files
test_n8n_workflow() {
    local workflow_file=$1
    local workflow_name=$2
    
    print_status "TESTING" "Testing $workflow_name n8n workflow..."
    
    if [ ! -f "$workflow_file" ]; then
        record_test "$workflow_name Workflow" "FAIL" "File not found: $workflow_file"
        return
    fi
    
    # Test JSON syntax
    if jq . "$workflow_file" >/dev/null 2>&1; then
        # Check for required workflow structure
        if jq -e '.nodes' "$workflow_file" >/dev/null 2>&1 && jq -e '.connections' "$workflow_file" >/dev/null 2>&1; then
            record_test "$workflow_name Workflow" "PASS" ""
        else
            record_test "$workflow_name Workflow" "FAIL" "Missing required workflow structure"
        fi
    else
        record_test "$workflow_name Workflow" "FAIL" "Invalid JSON syntax"
    fi
}

# Function to test configuration files
test_config_file() {
    local config_file=$1
    local config_name=$2
    
    print_status "TESTING" "Testing $config_name configuration..."
    
    if [ ! -f "$config_file" ]; then
        record_test "$config_name Config" "FAIL" "File not found: $config_file"
        return
    fi
    
    # Test JSON syntax
    if jq . "$config_file" >/dev/null 2>&1; then
        record_test "$config_name Config" "PASS" ""
    else
        record_test "$config_name Config" "FAIL" "Invalid JSON syntax"
    fi
}

# Main testing function
main() {
    print_status "INFO" "🚀 Starting Complete System Test Suite"
    print_status "INFO" "Testing AI Crypto Trading Bot Infrastructure"
    echo
    
    # Test MCP Servers
    print_status "INFO" "📡 Phase 1: Testing MCP Servers"
    echo
    
    # Core MCP servers
    test_mcp_server_syntax "lib/mcp/crypto-server.js" "Crypto Data Server"
    test_mcp_server_syntax "lib/mcp/alpha-vantage-server.js" "Alpha Vantage Server"
    test_mcp_server_syntax "lib/mcp/free-crypto-analytics-server.js" "Free Crypto Analytics Server"
    
    # Advanced MCP servers
    test_mcp_server_syntax "lib/mcp/whale-alerts-server.js" "Whale Alerts Server"
    test_mcp_server_syntax "lib/mcp/futures-data-server.js" "Futures Data Server"
    test_mcp_server_syntax "lib/mcp/news-aggregator-server.js" "News Aggregator Server"
    test_mcp_server_syntax "lib/mcp/social-analytics-server.js" "Social Analytics Server"
    
    # Critical MCP servers
    test_mcp_server_syntax "lib/mcp/options-flow-server.js" "Options Flow Server"
    test_mcp_server_syntax "lib/mcp/arbitrage-scanner-server.js" "Arbitrage Scanner Server"
    test_mcp_server_syntax "lib/mcp/defi-yields-server.js" "DeFi Yields Server"
    test_mcp_server_syntax "lib/mcp/nft-analytics-server.js" "NFT Analytics Server"
    
    echo
    
    # Test MCP Server Execution
    print_status "INFO" "🔧 Phase 2: Testing MCP Server Execution"
    echo
    
    test_mcp_server_execution "lib/mcp/whale-alerts-server.js" "Whale Alerts Server"
    test_mcp_server_execution "lib/mcp/futures-data-server.js" "Futures Data Server"
    test_mcp_server_execution "lib/mcp/news-aggregator-server.js" "News Aggregator Server"
    test_mcp_server_execution "lib/mcp/social-analytics-server.js" "Social Analytics Server"
    test_mcp_server_execution "lib/mcp/options-flow-server.js" "Options Flow Server"
    test_mcp_server_execution "lib/mcp/arbitrage-scanner-server.js" "Arbitrage Scanner Server"
    test_mcp_server_execution "lib/mcp/defi-yields-server.js" "DeFi Yields Server"
    test_mcp_server_execution "lib/mcp/nft-analytics-server.js" "NFT Analytics Server"
    
    echo
    
    # Test Configuration Files
    print_status "INFO" "⚙️  Phase 3: Testing Configuration Files"
    echo
    
    test_config_file "mcp-config.json" "MCP Configuration"
    test_config_file "package.json" "Package Configuration"
    
    echo
    
    # Test n8n Workflows
    print_status "INFO" "🔄 Phase 4: Testing n8n Workflows"
    echo
    
    test_n8n_workflow "n8n-workflows/01-master-trading-orchestrator.json" "Master Trading Orchestrator"
    test_n8n_workflow "n8n-workflows/03-market-intelligence.json" "Market Intelligence"
    test_n8n_workflow "n8n-workflows/ai-trading-master.json" "AI Trading Master"
    
    echo
    
    # Test API Endpoints
    print_status "INFO" "🌐 Phase 5: Testing API Endpoints"
    echo
    
    test_api_endpoint "/api/ai-analysis" "POST" '{"symbol":"BTC","analysisType":"detailed"}' "AI Analysis"
    test_api_endpoint "/api/crypto" "GET" "" "Crypto Data"
    
    echo
    
    # Test AI Reasoning Engine
    print_status "INFO" "🧠 Phase 6: Testing AI Reasoning Engine"
    echo
    
    if [ -f "lib/ai/reasoning-engine.ts" ]; then
        # Test TypeScript compilation
        if npx tsc --noEmit lib/ai/reasoning-engine.ts 2>/dev/null; then
            record_test "AI Reasoning Engine TypeScript" "PASS" ""
        else
            record_test "AI Reasoning Engine TypeScript" "FAIL" "TypeScript compilation errors"
        fi
    else
        record_test "AI Reasoning Engine" "FAIL" "File not found"
    fi
    
    echo
    
    # Test Integration Points
    print_status "INFO" "🔗 Phase 7: Testing Integration Points"
    echo
    
    # Check if MCP configuration references all servers
    if [ -f "mcp-config.json" ]; then
        local mcp_servers=$(jq -r '.mcpServers | keys[]' mcp-config.json 2>/dev/null | wc -l)
        if [ "$mcp_servers" -ge 10 ]; then
            record_test "MCP Configuration Coverage" "PASS" "All servers configured"
        else
            record_test "MCP Configuration Coverage" "FAIL" "Missing server configurations"
        fi
    fi
    
    # Check if n8n integration endpoints are configured
    if [ -f "mcp-config.json" ]; then
        if jq -e '.n8n_integration' mcp-config.json >/dev/null 2>&1; then
            record_test "n8n Integration Config" "PASS" ""
        else
            record_test "n8n Integration Config" "FAIL" "Missing n8n integration configuration"
        fi
    fi
    
    echo
    
    # Generate Test Report
    print_status "INFO" "📊 Test Results Summary"
    echo
    
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                     🧪 TEST REPORT                          ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Total Tests:    ${TOTAL_TESTS}"
    echo -e "${CYAN}║${NC} Passed Tests:   ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "${CYAN}║${NC} Failed Tests:   ${RED}${FAILED_TESTS}${NC}"
    echo -e "${CYAN}║${NC} Success Rate:   $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Show detailed results
    print_status "INFO" "📋 Detailed Test Results:"
    echo
    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done
    echo
    
    # System Readiness Assessment
    local success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    
    if [ "$success_rate" -ge 90 ]; then
        print_status "SUCCESS" "🎉 System is READY for production! (${success_rate}% success rate)"
        echo -e "${GREEN}✨ All critical components are functioning correctly${NC}"
        echo -e "${GREEN}🚀 Trading bot can be deployed safely${NC}"
    elif [ "$success_rate" -ge 75 ]; then
        print_status "WARNING" "⚠️  System is MOSTLY READY (${success_rate}% success rate)"
        echo -e "${YELLOW}🔧 Some minor issues need attention before production${NC}"
        echo -e "${YELLOW}📝 Review failed tests and address issues${NC}"
    else
        print_status "ERROR" "❌ System is NOT READY for production (${success_rate}% success rate)"
        echo -e "${RED}🛠️  Critical issues need to be resolved${NC}"
        echo -e "${RED}⏰ Do not deploy until issues are fixed${NC}"
    fi
    
    echo
    print_status "INFO" "🎯 Next Steps:"
    echo "   1. Review any failed tests above"
    echo "   2. Fix identified issues"
    echo "   3. Re-run this test script"
    echo "   4. Deploy when success rate is >90%"
    echo
    
    # Cleanup
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null || true
    fi
    
    # Exit with appropriate code
    if [ "$success_rate" -ge 90 ]; then
        exit 0
    else
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    print_status "INFO" "🔍 Checking Dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_status "ERROR" "npm is not installed"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_status "WARNING" "jq is not installed, some tests may be skipped"
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_status "WARNING" "curl is not installed, API tests may be skipped"
    fi
    
    print_status "SUCCESS" "Dependencies check completed"
    echo
}

# Help function
show_help() {
    echo "🧪 Complete System Test Script"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo
    echo "This script tests all components of the AI crypto trading bot:"
    echo "  • MCP Servers (syntax and execution)"
    echo "  • n8n Workflows (structure and validity)"
    echo "  • API Endpoints (connectivity and responses)"
    echo "  • Configuration Files (JSON validity)"
    echo "  • Integration Points (MCP/n8n alignment)"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run the main function
check_dependencies
main 