import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🎯 Minting more INK tokens with account:", deployer.address);

  // Your new Simple INK Token address
  const SIMPLE_INK_ADDRESS = "0x7E40388377D7e4FA235757b769679dF6894dCC26";
  
  // Get the contract
  const SimpleINK = await ethers.getContractAt("SimpleINKToken", SIMPLE_INK_ADDRESS);
  
  // Check current balance
  const currentBalance = await SimpleINK.balanceOf(deployer.address);
  console.log("📊 Current INK balance:", ethers.formatUnits(currentBalance, 18), "INK");
  
  // Mint more tokens
  const amountToMint = ethers.parseUnits("5000", 18); // Mint 5000 more INK tokens
  
  console.log("🔄 Minting", ethers.formatUnits(amountToMint, 18), "INK tokens...");
  
  try {
    const tx = await SimpleINK.mint(deployer.address, amountToMint);
    
    console.log("📝 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    await tx.wait();
    console.log("✅ Transaction confirmed!");
    
    // Check new balance
    const newBalance = await SimpleINK.balanceOf(deployer.address);
    console.log("🎉 New INK balance:", ethers.formatUnits(newBalance, 18), "INK");
    
    // Check total supply
    const totalSupply = await SimpleINK.totalSupply();
    console.log("🌟 Total INK supply:", ethers.formatUnits(totalSupply, 18), "INK");
    
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
