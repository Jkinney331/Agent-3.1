#!/bin/bash

echo "🚀 AI Trading Bot - Netlify Environment Setup"
echo "============================================="
echo ""
echo "This script will help you set up environment variables in Netlify."
echo "You can either use the Netlify CLI (if available) or manual setup."
echo ""

# Check if netlify CLI is available
if command -v netlify &> /dev/null; then
    echo "✅ Netlify CLI found! Setting up environment variables..."
    echo ""
    
    # Set all environment variables
    netlify env:set ALPACA_API_KEY "PK6V8YP89R7JPD2O5BA4"
    netlify env:set ALPACA_SECRET_KEY "XfjX2P0pvowkkQP0fkkwbhMJBBcDnMorBW5e73DZ"
    netlify env:set BINANCE_API_KEY "428pEV4wB7JeFNUS8w5v0QBw7ed12L7A7pCpUwkSSsfnRtPWvJr1lgrFeoqpCpLB"
    netlify env:set BINANCE_SECRET "1okFLhLHRoqY7NEbzvITSJOautdcyXKyiwWCxgNVFMtsmNlbjQtzlLxwwrkmZHiU"
    netlify env:set ALPHA_VANTAGE_API_KEY "1YZPQXQ5D1919XNT"
    netlify env:set COINGECKO_API_KEY "CG-WPEr8xVSSa3wbTHneis6hiZe"
    netlify env:set NEWS_API_KEY "465fadae01e44557ad45ca934fad0f4e"
    netlify env:set FINNHUB_API_KEY "d1vff7hr01qqgeel8ba0d1vff7hr01qqgeel8bag"
    netlify env:set COINDESK_API_KEY "69ef02647a9b613d010c9b092443451b841b46ce1514a73e96b57574e2d3cc38"
    netlify env:set TELEGRAM_BOT_TOKEN "7730550123:AAEKTBWefQD5vMIN96tqXAqFxxMm0xc0x5g"
    netlify env:set TELEGRAM_CHAT_ID "@nosleeptradingbot"
    netlify env:set NOTIFICATION_EMAIL "damiano.hillary@gmail.com"
    netlify env:set ENCRYPTION_KEY "trading-bot-secure-key-2024"
    netlify env:set NEXT_PUBLIC_ENCRYPTION_KEY "trading-bot-secure-key-2024"
    
    echo ""
    echo "✅ All environment variables have been set!"
    echo "🚀 Triggering a new deployment..."
    netlify deploy --prod --build
    
else
    echo "❌ Netlify CLI not found. Please set up manually:"
    echo ""
    echo "📋 Go to: https://app.netlify.com/sites/ai-trading-bot-enhanced-v2/settings/deploys#environment-variables"
    echo ""
    echo "🔑 Add these environment variables:"
    echo ""
    echo "ALPACA_API_KEY=PK6V8YP89R7JPD2O5BA4"
    echo "ALPACA_SECRET_KEY=XfjX2P0pvowkkQP0fkkwbhMJBBcDnMorBW5e73DZ"
    echo "BINANCE_API_KEY=428pEV4wB7JeFNUS8w5v0QBw7ed12L7A7pCpUwkSSsfnRtPWvJr1lgrFeoqpCpLB"
    echo "BINANCE_SECRET=1okFLhLHRoqY7NEbzvITSJOautdcyXKyiwWCxgNVFMtsmNlbjQtzlLxwwrkmZHiU"
    echo "ALPHA_VANTAGE_API_KEY=1YZPQXQ5D1919XNT"
    echo "COINGECKO_API_KEY=CG-WPEr8xVSSa3wbTHneis6hiZe"
    echo "NEWS_API_KEY=465fadae01e44557ad45ca934fad0f4e"
    echo "FINNHUB_API_KEY=d1vff7hr01qqgeel8ba0d1vff7hr01qqgeel8bag"
    echo "COINDESK_API_KEY=69ef02647a9b613d010c9b092443451b841b46ce1514a73e96b57574e2d3cc38"
    echo "TELEGRAM_BOT_TOKEN=7730550123:AAEKTBWefQD5vMIN96tqXAqFxxMm0xc0x5g"
    echo "TELEGRAM_CHAT_ID=@nosleeptradingbot"
    echo "NOTIFICATION_EMAIL=damiano.hillary@gmail.com"
    echo "ENCRYPTION_KEY=trading-bot-secure-key-2024"
    echo "NEXT_PUBLIC_ENCRYPTION_KEY=trading-bot-secure-key-2024"
    echo ""
    echo "💡 After adding all variables, trigger a new deployment."
fi

echo ""
echo "🎯 Your AI Trading Bot will be live at:"
echo "   https://ai-trading-bot-enhanced-v2.netlify.app/dashboard"
echo ""
echo "�� Setup complete!" 