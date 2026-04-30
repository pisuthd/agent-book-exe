pragma solidity ^0.8.20;

/// @notice Trade parameters for settlement
/// @dev User signs Permit2, agents use ERC20 approval (no signatures needed for agents)
struct TradeParams {
    address user;
    address baseToken;
    address quoteToken;
    bool isBuy;
    uint256 minBaseAmount;
    uint256 maxBaseAmount;
    uint256 deadline;
    uint256 userNonce;
    bytes userSignature;
    AgentFill[] fills;
}

/// @notice Individual agent fill
/// @dev agentSignature removed - agents use ERC20 approval instead of signatures
struct AgentFill {
    address agent;
    uint256 baseAmount;
    uint256 quoteAmount;
}
