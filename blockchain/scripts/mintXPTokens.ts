import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🎯 Minting XP tokens with account:", deployer.address);

  // Contract addresses on Base Sepolia
  const XP_TOKEN_ADDRESS = "0x8273A230b80C9621e767bC2154455b297CEC5BD6";
  
  // Get the contract
  const XPToken = await ethers.getContractAt("XPToken", XP_TOKEN_ADDRESS);
  
  // Check current balance
  const currentBalance = await XPToken.balanceOf(deployer.address);
  console.log("📊 Current XP balance:", ethers.formatUnits(currentBalance, 18), "XP");
    // Mint some tokens for testing (within daily limits)
  const amountToMint = ethers.parseUnits("50", 18); // Mint 50 XP tokens (within daily limit)
  
  console.log("🔄 Minting", ethers.formatUnits(amountToMint, 18), "XP tokens...");
  
  try {
    const tx = await XPToken.mintXP(
      deployer.address,
      amountToMint,
      "Initial token grant for testing"
    );
    
    console.log("📝 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    await tx.wait();
    console.log("✅ Transaction confirmed!");
    
    // Check new balance
    const newBalance = await XPToken.balanceOf(deployer.address);
    console.log("🎉 New XP balance:", ethers.formatUnits(newBalance, 18), "XP");
    
    // Get user stats
    const stats = await XPToken.getUserStats(deployer.address);
    console.log("📈 User Stats:");
    console.log("  - Balance:", ethers.formatUnits(stats[0], 18), "XP");
    console.log("  - Streak:", stats[1].toString());
    console.log("  - Last Activity Day:", stats[2].toString());
    console.log("  - Daily XP Earned:", ethers.formatUnits(stats[3], 18), "XP");
    console.log("  - Agent Drops Received:", stats[4].toString());
    
  } catch (error) {
    console.error("❌ Error minting tokens:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
