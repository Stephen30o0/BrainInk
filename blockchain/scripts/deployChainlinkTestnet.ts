import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Deploying Brain Ink Chainlink Integration to Base Sepolia Testnet...");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Check testnet balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Low balance. Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia");
    }

    // Deploy existing contracts first (if not already deployed)
    console.log("\n📄 Deploying XPToken...");
    const XPToken = await ethers.getContractFactory("XPToken");
    const xpToken = await XPToken.deploy();
    await xpToken.waitForDeployment();
    const xpTokenAddress = await xpToken.getAddress();
    console.log("✅ XPToken deployed to:", xpTokenAddress);

    console.log("\n🏆 Deploying BadgeNFT...");
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    const badgeNFT = await BadgeNFT.deploy();
    await badgeNFT.waitForDeployment();
    const badgeNFTAddress = await badgeNFT.getAddress();
    console.log("✅ BadgeNFT deployed to:", badgeNFTAddress);

    // Deploy Chainlink integration
    console.log("\n🔗 Deploying Chainlink Integration...");
    const ChainlinkIntegration = await ethers.getContractFactory("BrainInkChainlinkTestnet");
    const chainlinkIntegration = await ChainlinkIntegration.deploy(
      xpTokenAddress,
      badgeNFTAddress
    );
    await chainlinkIntegration.waitForDeployment();
    const chainlinkAddress = await chainlinkIntegration.getAddress();
    console.log("✅ Chainlink Integration deployed to:", chainlinkAddress);

    // Set up permissions
    console.log("\n⚙️ Setting up permissions...");
    
    // Transfer XPToken ownership to Chainlink contract for minting
    await xpToken.transferOwnership(chainlinkAddress);
    console.log("✅ XPToken ownership transferred to Chainlink contract");

    // Transfer BadgeNFT ownership to Chainlink contract for minting
    await badgeNFT.transferOwnership(chainlinkAddress);
    console.log("✅ BadgeNFT ownership transferred to Chainlink contract");

    console.log("\n🎉 Deployment completed successfully!");
    
    console.log("\n📋 Contract Addresses (save these!):");
    console.log("XPToken:", xpTokenAddress);
    console.log("BadgeNFT:", badgeNFTAddress);
    console.log("ChainlinkIntegration:", chainlinkAddress);

    console.log("\n🔗 Next Steps:");
    console.log("1. Get testnet LINK tokens: https://faucets.chain.link/base-sepolia");
    console.log("2. Create Functions subscription: https://functions.chain.link/base-sepolia");
    console.log("3. Create VRF subscription: https://vrf.chain.link/base-sepolia");
    console.log("4. Call setSubscriptionIds() with your subscription IDs");
    console.log("5. Add contract as consumer to both subscriptions");
    console.log("6. Fund subscriptions with testnet LINK");

    console.log("\n📝 Verification Commands:");
    console.log(`npx hardhat verify --network base-sepolia ${xpTokenAddress}`);
    console.log(`npx hardhat verify --network base-sepolia ${badgeNFTAddress}`);
    console.log(`npx hardhat verify --network base-sepolia ${chainlinkAddress} ${xpTokenAddress} ${badgeNFTAddress}`);

    // Save deployment info
    const deploymentInfo = {
      network: "base-sepolia",
      chainId: 84532,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        XPToken: xpTokenAddress,
        BadgeNFT: badgeNFTAddress,
        ChainlinkIntegration: chainlinkAddress
      },
      chainlinkServices: {
        functionsRouter: "0xf9B8fc078197181C841c296C876945aaa425B278",
        vrfCoordinator: "0x5CE8D5A2BC84beb22a398CCA51996F7930313D61",
        automationRegistry: "0xE16Df59B887e3Caa439E0b29B42bA2e7976FD8b2",
        ethUsdPriceFeed: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1"
      },
      nextSteps: [
        "Get testnet LINK from faucet",
        "Create Chainlink subscriptions",
        "Set subscription IDs in contract",
        "Add contract as consumer",
        "Test daily quiz generation",
        "Test tournament randomness",
        "Integrate with frontend"
      ]
    };

    console.log("\n💾 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

  } catch (error: any) {
    console.error("❌ Deployment failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Solution: Get testnet ETH from Base Sepolia faucet");
      console.error("   - Faucet: https://www.alchemy.com/faucets/base-sepolia");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n🎯 Ready for Chainlink competition demo!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
