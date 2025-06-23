import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔍 Checking XP Token contract details...");
  console.log("Checking with account:", deployer.address);

  // Contract addresses on Base Sepolia
  const XP_TOKEN_ADDRESS = "0x8273A230b80C9621e767bC2154455b297CEC5BD6";
  
  try {
    // Get the contract
    const XPToken = await ethers.getContractAt("XPToken", XP_TOKEN_ADDRESS);
    
    // Check basic token info
    const name = await XPToken.name();
    const symbol = await XPToken.symbol();
    const totalSupply = await XPToken.totalSupply();
    console.log("📝 Token Name:", name);
    console.log("📝 Token Symbol:", symbol);
    console.log("📊 Total Supply:", ethers.formatUnits(totalSupply, 18));
    
    // Check owner
    const owner = await XPToken.owner();
    console.log("👑 Contract Owner:", owner);
    console.log("👤 Your Address:", deployer.address);
    console.log("🔒 Are you owner?", owner.toLowerCase() === deployer.address.toLowerCase());
    
    // Check balance
    const balance = await XPToken.balanceOf(deployer.address);
    console.log("💰 Your XP Balance:", ethers.formatUnits(balance, 18));
    
    // Check constants
    const dailyXpBase = await XPToken.DAILY_XP_BASE();
    const maxDailyXp = await XPToken.MAX_DAILY_XP();
    console.log("📈 Daily XP Base:", dailyXpBase.toString());
    console.log("📈 Max Daily XP:", maxDailyXp.toString());
    
  } catch (error) {
    console.error("❌ Error checking contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
