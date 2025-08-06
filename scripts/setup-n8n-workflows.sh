#!/bin/bash

# 🚀 Comprehensive n8n Workflow Setup for AI Trading Bot
# This script sets up all n8n workflows and integrations

echo "🎯 AI Trading Bot - n8n Workflow Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
N8N_PORT=5678
N8N_HOST="localhost"
N8N_URL="http://${N8N_HOST}:${N8N_PORT}"
WORKFLOW_DIR="./n8n-workflows"
API_BASE="http://localhost:3000"

# Check if n8n is installed
check_n8n_installation() {
    echo -e "${BLUE}🔍 Checking n8n installation...${NC}"
    
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx not found. Please install Node.js and npm first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js and npx found${NC}"
}

# Start n8n server
start_n8n_server() {
    echo -e "${BLUE}🚀 Starting n8n server...${NC}"
    
    # Set environment variables
    export N8N_BASIC_AUTH_ACTIVE=true
    export N8N_BASIC_AUTH_USER=admin
    export N8N_BASIC_AUTH_PASSWORD=trading123
    export N8N_HOST=0.0.0.0
    export N8N_PORT=${N8N_PORT}
    export N8N_PROTOCOL=http
    export N8N_EDITOR_BASE_URL=${N8N_URL}
    
    # Create n8n directory
    mkdir -p ~/.n8n
    
    # Check if n8n is already running
    if curl -s "${N8N_URL}" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ n8n is already running on port ${N8N_PORT}${NC}"
    else
        echo -e "${CYAN}🔧 Starting n8n in background...${NC}"
        nohup npx n8n start > n8n.log 2>&1 &
        N8N_PID=$!
        echo $N8N_PID > n8n.pid
        
        # Wait for n8n to start
        echo -e "${YELLOW}⏳ Waiting for n8n to start...${NC}"
        for i in {1..30}; do
            if curl -s "${N8N_URL}" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ n8n started successfully!${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done
        
        if ! curl -s "${N8N_URL}" > /dev/null 2>&1; then
            echo -e "${RED}❌ Failed to start n8n after 60 seconds${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}🌐 n8n is running at: ${N8N_URL}${NC}"
    echo -e "${GREEN}👤 Username: admin${NC}"
    echo -e "${GREEN}🔑 Password: trading123${NC}"
    echo ""
}

# Import workflow function
import_workflow() {
    local workflow_file=$1
    local workflow_name=$2
    
    if [ ! -f "$workflow_file" ]; then
        echo -e "${RED}❌ Workflow file not found: $workflow_file${NC}"
        return 1
    fi
    
    echo -e "${CYAN}📥 Importing workflow: $workflow_name${NC}"
    
    # For now, we'll display import instructions since n8n doesn't have a CLI import command
    echo -e "${YELLOW}📋 To import this workflow:${NC}"
    echo -e "   1. Go to ${N8N_URL}"
    echo -e "   2. Click 'New' -> 'Import from file'"
    echo -e "   3. Select: $workflow_file"
    echo -e "   4. Click 'Import'"
    echo ""
}

# Test API endpoints
test_api_endpoints() {
    echo -e "${BLUE}🧪 Testing API endpoints...${NC}"
    
    local endpoints=(
        "/api/ai-analysis?symbol=bitcoin&capital=5000"
        "/api/trading/config"
        "/api/trading/positions"
        "/api/crypto?action=fear-greed"
        "/api/crypto?action=trending"
    )
    
    local success_count=0
    local total_count=${#endpoints[@]}
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "Testing ${endpoint}... "
        if curl -s "${API_BASE}${endpoint}" > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC}"
            ((success_count++))
        else
            echo -e "${RED}❌${NC}"
        fi
    done
    
    echo ""
    echo -e "${CYAN}📊 API Test Results: ${success_count}/${total_count} endpoints working${NC}"
    
    if [ $success_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 All API endpoints are working!${NC}"
    else
        echo -e "${YELLOW}⚠️ Some API endpoints are not responding. Make sure your trading bot is running.${NC}"
    fi
    echo ""
}

# Create workflow summary
create_workflow_summary() {
    echo -e "${PURPLE}📋 Creating workflow summary...${NC}"
    
    cat > n8n-workflow-summary.md << EOF
# 🎯 AI Trading Bot - n8n Workflow Suite

## 📊 Workflow Overview

### 1. 🎯 Master Trading Orchestrator
- **File**: \`01-master-trading-orchestrator.json\`
- **Purpose**: Main coordination workflow for AI trading decisions
- **Schedule**: Every 30 seconds
- **Features**:
  - Multi-symbol analysis (7 cryptocurrencies)
  - AI-driven trading decisions
  - Safety checks and emergency stops
  - Position monitoring
  - Risk management integration

### 2. 🛡️ Risk Management Monitor
- **File**: \`02-risk-management-monitor.json\`
- **Purpose**: Continuous portfolio risk monitoring
- **Schedule**: Every 15 seconds
- **Features**:
  - Real-time risk calculation
  - Leverage monitoring
  - Emergency stop triggers
  - Position concentration analysis
  - Risk alerts and reporting

### 3. 📈 Market Intelligence Center
- **File**: \`03-market-intelligence.json\`
- **Purpose**: Advanced market analysis and sentiment tracking
- **Schedule**: Every 5 minutes
- **Features**:
  - Multi-indicator analysis
  - Sentiment tracking (Fear & Greed)
  - Trend identification
  - Opportunity scoring
  - Market regime detection

### 4. 📊 Portfolio Performance Monitor
- **File**: \`04-portfolio-performance.json\`
- **Purpose**: Comprehensive portfolio tracking and analytics
- **Schedule**: Every 2 minutes
- **Features**:
  - Performance grading (A-F scale)
  - Win rate tracking
  - Sharpe ratio calculation
  - Daily reporting
  - Performance alerts

### 5. 🔔 Notification Manager
- **File**: \`05-notification-manager.json\`
- **Purpose**: Central notification hub and error handling
- **Trigger**: Webhook-based
- **Features**:
  - Multi-channel notifications
  - Priority-based routing
  - Error handling and recovery
  - Notification analytics
  - Alert formatting

## 🔧 Setup Instructions

1. **Start n8n**: Run \`./scripts/setup-n8n-workflows.sh\`
2. **Access n8n**: Go to http://localhost:5678
3. **Login**: admin / trading123
4. **Import Workflows**: Use the import feature for each JSON file
5. **Activate Workflows**: Enable all imported workflows
6. **Test Integration**: Run the test scripts

## 🎯 Integration Points

- **Trading API**: http://localhost:3000/api/trading/*
- **AI Analysis**: http://localhost:3000/api/ai-analysis
- **Market Data**: http://localhost:3000/api/crypto
- **Webhook URL**: http://localhost:5678/webhook/trading-notification

## 📈 Expected Benefits

- **24/7 Automation**: Continuous trading and monitoring
- **Risk Management**: Real-time risk assessment and protection
- **Intelligence**: Advanced market analysis and insights
- **Notifications**: Instant alerts for important events
- **Performance**: Comprehensive tracking and reporting

## 🔄 Workflow Dependencies

\`\`\`
Master Orchestrator → AI Analysis API → Trading Execution
        ↓
Risk Monitor → Portfolio Monitor → Notification Manager
        ↓
Market Intelligence → Opportunity Alerts
\`\`\`

Generated: $(date)
EOF
    
    echo -e "${GREEN}✅ Workflow summary created: n8n-workflow-summary.md${NC}"
}

# Main execution flow
main() {
    echo -e "${CYAN}🎯 Starting n8n workflow setup...${NC}"
    echo ""
    
    # Step 1: Check prerequisites
    check_n8n_installation
    
    # Step 2: Start n8n server
    start_n8n_server
    
    # Step 3: Test API endpoints
    test_api_endpoints
    
    # Step 4: List available workflows
    echo -e "${PURPLE}📁 Available workflows:${NC}"
    if [ -d "$WORKFLOW_DIR" ]; then
        ls -la "$WORKFLOW_DIR"/*.json 2>/dev/null | while read -r line; do
            echo -e "   ${CYAN}$(basename "${line}")${NC}"
        done
    else
        echo -e "${YELLOW}⚠️ Workflow directory not found: $WORKFLOW_DIR${NC}"
    fi
    echo ""
    
    # Step 5: Display import instructions
    echo -e "${YELLOW}📋 MANUAL IMPORT REQUIRED:${NC}"
    echo -e "Due to n8n's architecture, workflows must be imported manually:"
    echo ""
    echo -e "1. 🌐 Open: ${GREEN}${N8N_URL}${NC}"
    echo -e "2. 👤 Login: ${GREEN}admin / trading123${NC}"
    echo -e "3. 📥 Import each workflow from ${CYAN}${WORKFLOW_DIR}/${NC}"
    echo -e "4. ✅ Activate all workflows"
    echo -e "5. 🧪 Test by triggering the master orchestrator"
    echo ""
    
    # Step 6: Create documentation
    create_workflow_summary
    
    # Step 7: Final status
    echo -e "${GREEN}🎉 n8n setup complete!${NC}"
    echo ""
    echo -e "${CYAN}📋 Next steps:${NC}"
    echo -e "   1. Import workflows manually in n8n UI"
    echo -e "   2. Activate all workflows"
    echo -e "   3. Monitor execution logs"
    echo -e "   4. Review n8n-workflow-summary.md for details"
    echo ""
    echo -e "${BLUE}📊 Status:${NC}"
    echo -e "   • n8n Server: ${GREEN}RUNNING${NC} (${N8N_URL})"
    echo -e "   • Trading Bot: $(curl -s "$API_BASE/api/trading/config" > /dev/null 2>&1 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${YELLOW}CHECK STATUS${NC}")"
    echo -e "   • Workflows: ${YELLOW}IMPORT REQUIRED${NC}"
    echo ""
    
    # Step 8: Keep n8n running message
    echo -e "${PURPLE}💡 Tip: Keep this terminal open to maintain n8n server${NC}"
    echo -e "${PURPLE}📝 Logs: tail -f n8n.log${NC}"
    echo -e "${PURPLE}🛑 Stop: pkill -f n8n${NC}"
}

# Script execution
case "${1:-setup}" in
    "setup")
        main
        ;;
    "start")
        start_n8n_server
        ;;
    "test")
        test_api_endpoints
        ;;
    "stop")
        echo -e "${YELLOW}🛑 Stopping n8n server...${NC}"
        pkill -f n8n
        if [ -f n8n.pid ]; then
            rm n8n.pid
        fi
        echo -e "${GREEN}✅ n8n stopped${NC}"
        ;;
    "status")
        if curl -s "${N8N_URL}" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ n8n is running at ${N8N_URL}${NC}"
        else
            echo -e "${RED}❌ n8n is not running${NC}"
        fi
        ;;
    *)
        echo "Usage: $0 {setup|start|test|stop|status}"
        echo ""
        echo "Commands:"
        echo "  setup  - Complete setup (default)"
        echo "  start  - Start n8n server only"
        echo "  test   - Test API endpoints"
        echo "  stop   - Stop n8n server"
        echo "  status - Check n8n status"
        exit 1
        ;;
esac 