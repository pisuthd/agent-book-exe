// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockToken} from "../src/MockToken.sol";

/**
 * @title DeployTokens
 * @notice Deploy mock WBTC and USDT tokens 
 * @dev Usage:
 *   forge script script/1-DeployTokens.s.sol --rpc-url $RPC_URL --broadcast 
 *
 */
contract DeployTokens is Script {
    // Decimals for 6-decimal tokens
    uint8 constant DECIMALS = 6;
 
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock WBTC
        MockToken wbtc = new MockToken("Wrapped Bitcoin", "WBTC", DECIMALS);

        // Deploy Mock USDT
        MockToken usdt = new MockToken("Tether USD", "USDT", DECIMALS);

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("WBTC deployed at:", address(wbtc));
        console.log("USDT deployed at:", address(usdt));
    }
}
