pragma solidity ^0.8.20;

/// @notice Interface for querying ERC-20 nonces (used by Permit2)
interface INonces {
    function nonces(address owner) external view returns (uint256);
}
