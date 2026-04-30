pragma solidity ^0.8.20;

import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";
import {ERC20} from "permit2/lib/solmate/src/tokens/ERC20.sol";
import {SafeTransferLib} from "permit2/lib/solmate/src/utils/SafeTransferLib.sol";
import {INonces} from "./interfaces/INonces.sol";
import {TradeParams, AgentFill} from "./types/SettlementTypes.sol";

/**
 * @title Settlement
 * @notice Atomic settlement for AgentBook.exe
 * @dev Non-custodial: agents, users keep tokens in their own wallets
 *      - User side: uses Permit2 signature (EIP-712) (now updated to ERC-20 approval)
 *      - Agent side: uses ERC20 approval 
 */
contract Settlement {
    using SafeTransferLib for ERC20;

    ISignatureTransfer public immutable permit2;

    event TradeExecuted(
        address indexed user,
        address indexed baseToken,
        address indexed quoteToken,
        uint256 totalBaseAmount,
        uint256 totalQuoteAmount,
        uint256 fillCount
    );

    event AgentFillRecorded(
        address indexed user,
        address indexed agent,
        uint256 baseAmount,
        uint256 quoteAmount
    );

    /**
     * @param _permit2 Permit2 address (Sepolia: 0x000000000022D473030F116dDEE9F6B43aC78BA3)
     */
    constructor(address _permit2) {
        permit2 = ISignatureTransfer(_permit2);
    }

    /**
     * @notice Settle a trade using ERC20 approval for both user and agents
     *      - User approves Settlement contract (no Permit2 signature)
     *      - Agents approve Settlement contract (no Permit2 signature)
     *
     * @param params Trade parameters
     */
    function settleTrade(TradeParams calldata params) external {
        uint256 totalBase;
        uint256 totalQuote;

        // Phase 1: User's tokens → Agent (user uses ERC20 approval to Settlement)
        for (uint256 i = 0; i < params.fills.length; i++) {
            AgentFill calldata fill = params.fills[i];

            if (params.isBuy) {
                // User sells USDT, buys WBTC
                ERC20(params.quoteToken).transferFrom(params.user, fill.agent, fill.quoteAmount);
            } else {
                // User sells WBTC, buys USDT
                ERC20(params.baseToken).transferFrom(params.user, fill.agent, fill.baseAmount);
            }
        }

        // Phase 2: Agent's tokens → User (agents use ERC20 approval to Settlement)
        for (uint256 i = 0; i < params.fills.length; i++) {
            AgentFill calldata fill = params.fills[i];

            if (params.isBuy) {
                // Agent transfers WBTC to user
                ERC20(params.baseToken).transferFrom(fill.agent, params.user, fill.baseAmount);
            } else {
                // Agent transfers USDT to user
                ERC20(params.quoteToken).transferFrom(fill.agent, params.user, fill.quoteAmount);
            }

            totalBase += fill.baseAmount;
            totalQuote += fill.quoteAmount;

            emit AgentFillRecorded(params.user, fill.agent, fill.baseAmount, fill.quoteAmount);
        }

        require(totalBase >= params.minBaseAmount, "insufficient fill");
        require(totalBase <= params.maxBaseAmount, "excessive fill");

        emit TradeExecuted(
            params.user,
            params.baseToken,
            params.quoteToken,
            totalBase,
            totalQuote,
            params.fills.length
        );
    }

    /**
     * @notice Query the current nonce for a given owner via Permit2
     */
    function getNonce(address owner, address token) external view returns (uint256) {
        return INonces(token).nonces(owner);
    }
}
