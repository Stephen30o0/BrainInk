#!/bin/bash

# Quiz Service Integration Test Script
echo "🚀 Starting Quiz Service Integration Test"
echo "========================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "💡 Please create a .env file with GOOGLE_API_KEY"
    exit 1
fi

# Check if GOOGLE_API_KEY is set
if grep -q "GOOGLE_API_KEY=" .env; then
    echo "✅ GOOGLE_API_KEY found in .env"
else
    echo "❌ GOOGLE_API_KEY not found in .env"
    echo "💡 Please add GOOGLE_API_KEY=your_api_key to .env file"
    exit 1
fi

# Navigate to kana-backend directory
cd kana-backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🔧 Starting Quiz Service Integration Test..."
echo "Press Ctrl+C to stop the test"
echo ""

# Start the server in background and test
node index.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Run the quiz service test
cd ..
node test-quiz-service.js

# Stop the server
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Quiz Service Integration Test Complete!"
