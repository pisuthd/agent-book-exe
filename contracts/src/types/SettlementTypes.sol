pragma solidity ^0.8.20;

/// @notice Trade parameters for signature-based settlement
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
struct AgentFill {
    address agent;
    uint256 agentNonce;
    uint256 baseAmount;
    uint256 quoteAmount;
    bytes agentSignature;
}
