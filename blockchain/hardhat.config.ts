import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"; // To load .env file

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";
const BASE_PRIVATE_KEY = process.env.BASE_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: SEPOLIA_PRIVATE_KEY !== 'your-sepolia-private-key' ? [SEPOLIA_PRIVATE_KEY] : [],
      chainId: 11155111, // Sepolia's chain ID
    },
    base: {
      url: BASE_RPC_URL,
      accounts: BASE_PRIVATE_KEY !== '' ? [BASE_PRIVATE_KEY] : [],
      chainId: 8453, // Base mainnet chain ID
    },    "base-sepolia": {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: BASE_PRIVATE_KEY !== '' ? [BASE_PRIVATE_KEY] : [],
      chainId: 84532, // Base Sepolia testnet chain ID
      gasPrice: 1000000000, // 1 gwei for faster testnet transactions
    },
  },
};

export default config;
