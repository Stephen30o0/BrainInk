// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title InkToken
 * @dev A simple ERC20 token for the BrainInk platform.
 */
contract InkToken is ERC20 {
    /**
     * @dev Constructor that sets the token name, symbol, and mints the initial supply.
     * The initial supply is minted to the initialOwner passed to the constructor.
     */
    constructor(uint256 initialSupply) ERC20("Ink Token", "INK") {
        _mint(msg.sender, initialSupply); // We'll pass the full amount (with decimals) from the script
    }
}
