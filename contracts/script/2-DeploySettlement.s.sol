// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Settlement} from "../src/Settlement.sol";

/**
 * @title DeploySettlement
 * @notice Deploy the Settlement contract
 * @dev Uses Permit2 on Sepolia: 0x000000000022D473030F116dDEE9F6B43aC78BA3
 * @dev Usage:
 *   forge script script/2-DeploySettlement.s.sol --rpc-url $RPC_URL --broadcast 
 */
contract DeploySettlement is Script {
    // Uniswap Permit2 on Sepolia testnet
    address constant PERMIT2_SEPOLIA = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    // Local/Anvil permit2 (if using local testing)
    // address constant PERMIT2_ANVIL = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // For Sepolia deployment
        address permit2Address = PERMIT2_SEPOLIA;

        // Check if we're on local chain (chainid 31337 = Anvil)
        if (block.chainid == 31337) {
            console.log("Detected local chain - ensure Permit2 is deployed");
            // For local testing, you would deploy or reference a local Permit2
            // permit2Address = PERMIT2_ANVIL;
        }

        vm.startBroadcast(deployerPrivateKey);

        Settlement settlement = new Settlement(permit2Address);

        vm.stopBroadcast();

        console.log("Settlement deployed at:", address(settlement));
        console.log("Permit2 address used:", permit2Address);
    }
}
