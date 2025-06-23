import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Simple INK Token with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  // Deploy the token with initial supply
  const initialSupply = ethers.parseUnits("10000", 18); // 10,000 INK tokens
  
  console.log("📦 Deploying SimpleINKToken...");
  const SimpleINKToken = await ethers.getContractFactory("SimpleINKToken");
  const inkToken = await SimpleINKToken.deploy(initialSupply);
  
  await inkToken.waitForDeployment();
  const tokenAddress = await inkToken.getAddress();
  
  console.log("✅ SimpleINKToken deployed to:", tokenAddress);
  console.log("👑 Owner:", deployer.address);
  console.log("💎 Initial Supply:", ethers.formatUnits(initialSupply, 18), "INK");
  
  console.log("\n🔗 To update your frontend, use this address:");
  console.log("Token Address:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
