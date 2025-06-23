# Chainlink Testnet Setup Guide

## 1. Install Dependencies
```bash
cd blockchain
npm install @chainlink/contracts
```

## 2. Update hardhat.config.ts
Add Base Sepolia configuration with Chainlink support

## 3. Environment Variables Needed (.env)
```env
# Existing variables
BASE_PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://sepolia.base.org

# New Chainlink variables (testnet - FREE)
CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID=your_subscription_id
CHAINLINK_VRF_SUBSCRIPTION_ID=your_vrf_subscription_id
CHAINLINK_AUTOMATION_LINK_AMOUNT=5000000000000000000  # 5 LINK in wei
```

## 4. Testnet Resources
- Base Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia
- Testnet LINK: https://faucets.chain.link/base-sepolia
- Functions Subscription: https://functions.chain.link/base-sepolia
- VRF Subscription: https://vrf.chain.link/base-sepolia
- Automation Upkeep: https://automation.chain.link/base-sepolia

## 5. Development Workflow
1. Get testnet tokens (FREE)
2. Create subscriptions (FREE with testnet LINK)
3. Deploy contracts to Base Sepolia (minimal gas fees)
4. Test all functionality
5. Build frontend integration
6. Record demo video

## 6. No Real Money Required
- All development on testnet
- Free testnet tokens
- Minimal gas fees (~$2-5 total)
- Full Chainlink functionality available
