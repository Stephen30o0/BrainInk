import { ethers } from "hardhat";

async function main() {
  try {
    console.log("🔍 Checking wallet configuration...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    
    const network = await deployer.provider.getNetwork();
    console.log("Network:", network.name, "(Chain ID:", network.chainId, ")");
    
    if (balance > 0) {
      console.log("✅ Wallet has funds and is ready for deployment!");
    } else {
      console.log("❌ Wallet has no funds. Need testnet ETH.");
    }
    
  } catch (error) {
    console.error("Error checking wallet:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
