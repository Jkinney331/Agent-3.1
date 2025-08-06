#!/bin/bash

# Start n8n AI Trading Bot Setup
echo "🚀 Starting n8n AI Trading Bot Environment..."

# Check if n8n is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm first."
    exit 1
fi

# Create n8n data directory
mkdir -p ~/.n8n

# Set environment variables for n8n
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=trading123
export N8N_HOST=0.0.0.0
export N8N_PORT=5678
export N8N_PROTOCOL=http

# Start n8n in background
echo "🔧 Starting n8n server on http://localhost:5678..."
echo "📊 Username: admin | Password: trading123"

npx n8n start &
N8N_PID=$!

echo "✅ n8n started with PID: $N8N_PID"
echo "🌐 Access n8n at: http://localhost:5678"
echo ""
echo "📋 To import AI Trading workflow:"
echo "   1. Go to http://localhost:5678"
echo "   2. Login with admin/trading123"
echo "   3. Import the workflow from: n8n-workflows/ai-trading-master.json"
echo ""
echo "🛑 To stop n8n: kill $N8N_PID"
echo ""

# Wait for user input to stop
read -p "Press Enter to stop n8n server..."
kill $N8N_PID
echo "🛑 n8n server stopped." 