console.log("--- deployInkToken.ts: Top of file reached ---");
import { ethers } from "hardhat";

async function main() {
  console.log("--- Script execution started ---");

  try {
    console.log("Attempting to get signers...");
    const [deployer] = await ethers.getSigners();
    console.log("Signers obtained. Deployer:", deployer.address);

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Attempting to get ContractFactory for InkToken...");
    const inkTokenFactory = await ethers.getContractFactory("InkToken");
    console.log("ContractFactory for InkToken obtained.");

    const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens with 18 decimals
    console.log(`Attempting to deploy InkToken with initial supply: ${initialSupply.toString()}...`);
    const inkToken = await inkTokenFactory.deploy(initialSupply);
    console.log("InkToken deployment transaction sent. Waiting for deployment...");

    await inkToken.waitForDeployment();
    console.log("InkToken deployment confirmed.");

    const deployedAddress = await inkToken.getAddress();
    // Try forcing output for the address
    process.stdout.write(`InkToken deployed to (via process.stdout.write): ${deployedAddress}\n`); 
    console.log("InkToken deployed to (via console.log):", deployedAddress);

  } catch (e: any) { // Catch any type of error
    console.error("!!! ERROR IN MAIN FUNCTION !!!");
    if (e instanceof Error) {
      console.error("Error message:", e.message);
      console.error("Error name:", e.name);
      console.error("Error stack:", e.stack);
    } else {
      console.error("Caught a non-Error object:", e);
    }
    throw e; // Re-throw to be caught by the outer .catch, ensuring process exits with error
  }
}

main()
  .then(() => {
    console.log("--- Script execution successful --- refueling and preparing for next mission! ---");
    process.exit(0);
  })
  .catch((error) => {
    console.error("!!! SCRIPT FAILED (outer catch) !!! Check error details above. ---");
    // Log details from the error object passed to the outer catch
    if (error instanceof Error) {
        console.error("Outer catch - Error message:", error.message);
        console.error("Outer catch - Error name:", error.name);
        console.error("Outer catch - Error stack:", error.stack);
    } else {
        console.error("Outer catch - Caught a non-Error object:", error);
    }
    process.exit(1);
  });
