import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TournamentManager contract to Base Sepolia...");

  // Contract addresses on Base Sepolia
  const VRF_COORDINATOR = "0x5CE8D5A2BC84beb22a398CCA51996F7930313D61"; // Base Sepolia VRF Coordinator
  const INK_TOKEN_ADDRESS = "0x3400d455aC4d50dF70E581b96f980516Af63Fa1c"; // Our INK token on Base Sepolia
  const SUBSCRIPTION_ID = 1; // You'll need to create a VRF subscription
  const KEY_HASH = "0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899"; // Base Sepolia 200 gwei key hash

  // Get the contract factory
  const TournamentManager = await ethers.getContractFactory("TournamentManager");

  // Deploy the contract
  const tournamentManager = await TournamentManager.deploy(
    VRF_COORDINATOR,
    INK_TOKEN_ADDRESS,
    SUBSCRIPTION_ID,
    KEY_HASH
  );

  await tournamentManager.waitForDeployment();

  const contractAddress = await tournamentManager.getAddress();
  console.log("TournamentManager deployed to:", contractAddress);

  // Verify contract on Base Sepolia
  console.log("Waiting for block confirmations...");
  await tournamentManager.deploymentTransaction()?.wait(5);

  console.log("Contract deployment completed!");
  console.log("Tournament Manager Address:", contractAddress);
  console.log("VRF Coordinator:", VRF_COORDINATOR);
  console.log("INK Token:", INK_TOKEN_ADDRESS);
  console.log("Subscription ID:", SUBSCRIPTION_ID);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "base-sepolia",
    vrfCoordinator: VRF_COORDINATOR,
    inkToken: INK_TOKEN_ADDRESS,
    subscriptionId: SUBSCRIPTION_ID,
    keyHash: KEY_HASH,
    deployedAt: new Date().toISOString()
  };

  console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
