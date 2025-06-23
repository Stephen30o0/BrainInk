import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Original INK Token to Base Sepolia with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the original INK token with initial supply
  const initialSupply = ethers.parseUnits("1000000", 18); // 1 million INK tokens (same as original)
  
  console.log("📦 Deploying InkToken (Original)...");
  const InkToken = await ethers.getContractFactory("InkToken");
  const inkToken = await InkToken.deploy(initialSupply);
  
  await inkToken.waitForDeployment();
  const tokenAddress = await inkToken.getAddress();
  
  console.log("✅ Original InkToken deployed to Base Sepolia:", tokenAddress);
  console.log("👑 Owner:", deployer.address);
  console.log("💎 Initial Supply:", ethers.formatUnits(initialSupply, 18), "INK");
  
  console.log("\n🔗 Update your WalletContext with this address:");
  console.log("Token Address:", tokenAddress);
  console.log("\n🌐 Networks:");
  console.log("- Ethereum Sepolia INK: 0xe3CAF39D7BdeCd039EA5a42A328335115dd05153");
  console.log("- Base Sepolia INK:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
