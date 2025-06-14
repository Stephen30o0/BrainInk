import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying BrainInk Smart Contracts...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy XPToken
  console.log("\n📄 Deploying XPToken...");
  const XPToken = await ethers.getContractFactory("XPToken");
  const xpToken = await XPToken.deploy();
  await xpToken.waitForDeployment();
  console.log("✅ XPToken deployed to:", await xpToken.getAddress());

  // Deploy BadgeNFT
  console.log("\n🏆 Deploying BadgeNFT...");
  const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
  const badgeNFT = await BadgeNFT.deploy();
  await badgeNFT.waitForDeployment();
  console.log("✅ BadgeNFT deployed to:", await badgeNFT.getAddress());

  // Deploy SquadScore
  console.log("\n👥 Deploying SquadScore...");
  const SquadScore = await ethers.getContractFactory("SquadScore");
  const squadScore = await SquadScore.deploy(await xpToken.getAddress());
  await squadScore.waitForDeployment();
  console.log("✅ SquadScore deployed to:", await squadScore.getAddress());

  // Deploy BountyVault
  console.log("\n💰 Deploying BountyVault...");
  const BountyVault = await ethers.getContractFactory("BountyVault");
  const bountyVault = await BountyVault.deploy(await xpToken.getAddress());
  await bountyVault.waitForDeployment();
  console.log("✅ BountyVault deployed to:", await bountyVault.getAddress());

  // Set up contract interactions
  console.log("\n⚙️ Setting up contract permissions...");
  
  // Grant minting permissions to SquadScore and BountyVault for XP rewards
  console.log("Setting up XPToken permissions...");
  await xpToken.transferOwnership(deployer.address); // Ensure deployer is owner
  
  // Update BadgeNFT ownership for AI agent interactions
  console.log("Setting up BadgeNFT permissions...");
  await badgeNFT.transferOwnership(deployer.address);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("XPToken:", await xpToken.getAddress());
  console.log("BadgeNFT:", await badgeNFT.getAddress());
  console.log("SquadScore:", await squadScore.getAddress());
  console.log("BountyVault:", await bountyVault.getAddress());

  // Save deployment info
  const deploymentInfo = {
    network: "base",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      XPToken: await xpToken.getAddress(),
      BadgeNFT: await badgeNFT.getAddress(),
      SquadScore: await squadScore.getAddress(),
      BountyVault: await bountyVault.getAddress()
    }
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
