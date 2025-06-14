import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying BrainInk to Base Mainnet ===");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.001")) {
      throw new Error("Insufficient ETH balance for deployment. Need at least 0.001 ETH on Base mainnet.");
    }

    console.log("\n=== Deploying INK Token ===");
    const InkTokenFactory = await ethers.getContractFactory("InkToken");
    const initialSupply = ethers.parseUnits("1000000", 18); // 1M tokens
    
    console.log(`Deploying InkToken with initial supply: ${ethers.formatUnits(initialSupply, 18)} INK`);
    const inkToken = await InkTokenFactory.deploy(initialSupply);
    
    console.log("Transaction sent, waiting for confirmation...");
    await inkToken.waitForDeployment();
    
    const inkTokenAddress = await inkToken.getAddress();
    console.log("✅ INK Token deployed to:", inkTokenAddress);

    // Verify the deployment
    const tokenName = await inkToken.name();
    const tokenSymbol = await inkToken.symbol();
    const totalSupply = await inkToken.totalSupply();
    const deployerBalance = await inkToken.balanceOf(deployer.address);

    console.log("\n=== Deployment Summary ===");
    console.log("Network: Base Mainnet (Chain ID: 8453)");
    console.log("Contract: INK Token");
    console.log("Address:", inkTokenAddress);
    console.log("Name:", tokenName);
    console.log("Symbol:", tokenSymbol);
    console.log("Total Supply:", ethers.formatUnits(totalSupply, 18), "INK");
    console.log("Deployer Balance:", ethers.formatUnits(deployerBalance, 18), "INK");

    console.log("\n=== Next Steps ===");
    console.log("1. Update frontend WalletContext.tsx with new contract address");
    console.log("2. Update contract address:", inkTokenAddress);
    console.log("3. Verify contract on BaseScan (optional)");
    console.log("4. Test token transfers on mainnet");

    // Save deployment info
    const deploymentInfo = {
      network: "base-mainnet",
      chainId: 8453,
      contracts: {
        InkToken: {
          address: inkTokenAddress,
          deployer: deployer.address,
          deploymentTx: inkToken.deploymentTransaction()?.hash,
          timestamp: new Date().toISOString()
        }
      }
    };

    console.log("\n=== Deployment Info (Save This!) ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));

  } catch (error: any) {
    console.error("❌ Deployment failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Solution: Add ETH to your wallet on Base mainnet");
      console.error("   - Use the Base bridge: https://bridge.base.org");
      console.error("   - Or buy ETH directly on Base via exchanges");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
