pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title MockToken
 * @notice Mock ERC-20 token with EIP-2612 permit functionality for Permit2
 */
contract MockToken is ERC20Permit {
    uint8 private _decimals;

    /**
     * @param name_ Token name (e.g., "Wrapped Bitcoin")
     * @param symbol_ Token symbol (e.g., "WBTC")
     * @param decimals_ Token decimals (6 for USDT)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        _decimals = decimals_;
    }

    /**
     * @dev Returns the number of decimals the token uses
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint new tokens 
     * @param to Address to receive tokens
     * @param amount Amount to mint (in smallest unit)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Burn tokens from specified address
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
