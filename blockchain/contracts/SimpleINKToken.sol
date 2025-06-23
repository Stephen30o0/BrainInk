// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleINKToken
 * @dev Simple ERC20 token for testing Brain Ink features
 */
contract SimpleINKToken is ERC20, Ownable {
    
    constructor(uint256 initialSupply) ERC20("Brain Ink Token", "INK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Mint tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from any address (only owner)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev Allow users to burn their own tokens
     */
    function burnOwn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
