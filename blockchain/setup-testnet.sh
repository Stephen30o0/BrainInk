#!/bin/bash

# Brain Ink Chainlink Testnet Setup Script
echo "🧪 Brain Ink Chainlink Testnet Setup"
echo "====================================="

# Check if we're in the blockchain directory
if [ ! -f "hardhat.config.ts" ]; then
    echo "❌ Please run this script from the blockchain directory"
    exit 1
fi

echo "📦 Installing Chainlink dependencies..."
npm install @chainlink/contracts

echo "⚙️ Environment setup checklist:"
echo "1. ✅ Base Sepolia RPC configured in hardhat.config.ts"
echo "2. ⚠️  Add your private key to .env file"
echo "3. ⚠️  Get Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia"
echo "4. ⚠️  Get testnet LINK: https://faucets.chain.link/base-sepolia"

echo ""
echo "🚀 Ready to deploy? Run:"
echo "npx hardhat run scripts/deployChainlinkTestnet.ts --network base-sepolia"

echo ""
echo "📋 After deployment, you'll need to:"
echo "1. Create Chainlink Functions subscription"
echo "2. Create Chainlink VRF subscription" 
echo "3. Fund subscriptions with testnet LINK"
echo "4. Add deployed contract as consumer"
echo "5. Call setSubscriptionIds() on your contract"

echo ""
echo "🎯 Competition demo features:"
echo "✅ Daily quiz generation (Chainlink Functions + VRF)"
echo "✅ Automated daily challenges (Chainlink Automation)"
echo "✅ Dynamic tournament pricing (Chainlink Price Feeds)"
echo "✅ Provably fair randomness (Chainlink VRF)"

echo ""
echo "💰 Total costs: ~$2-5 in testnet gas fees (FREE LINK tokens)"
echo "🏆 Ready for $35,000 Grand Prize + $16,500 DeFi Prize!"
