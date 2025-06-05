// This file is used to declare global types, especially for third-party libraries
// that might extend the global scope, like MetaMask injecting `window.ethereum`.

interface Window {
  ethereum?: import('ethers').Eip1193Provider; // Using a more specific type from ethers
}
