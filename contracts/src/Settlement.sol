pragma solidity ^0.8.20;

import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";
import {ERC20} from "permit2/lib/solmate/src/tokens/ERC20.sol";
import {SafeTransferLib} from "permit2/lib/solmate/src/utils/SafeTransferLib.sol";
import {INonces} from "./interfaces/INonces.sol";
import {TradeParams, AgentFill} from "./types/SettlementTypes.sol";

/**
 * @title Settlement
 * @notice Permit2-based atomic settlement for BTC/USDT trading
 * @dev Non-custodial: agents, users keep tokens in their own wallets
 *      Uses Uniswap Permit2 for off-chain signature verification
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
     * @param _permit2 Address of Permit2 contract (Sepolia: 0x000000000022D473030F116dDEE9F6B43aC78BA3)
     */
    constructor(address _permit2) {
        permit2 = ISignatureTransfer(_permit2);
    }

    /**
     * @notice Settle a trade atomically using Permit2 signatures from user AND agents
     * @dev Two-phase transfer per fill:
     *      Phase 1: Transfer user's token to agent (verified by user's Permit2 sig)
     *      Phase 2: Transfer agent's token to user (verified by agent's Permit2 sig)
     *
     * @param params Trade parameters including user sig, fills, and amounts
     */
    function settleTrade(TradeParams calldata params) external {
        uint256 totalBase;
        uint256 totalQuote;

        // Phase 1: Transfer user's tokens to each agent
        for (uint256 i = 0; i < params.fills.length; i++) {
            AgentFill calldata fill = params.fills[i];

            if (params.isBuy) {
                permit2.permitTransferFrom(
                    ISignatureTransfer.PermitTransferFrom({
                        permitted: ISignatureTransfer.TokenPermissions({
                            token: params.quoteToken,
                            amount: fill.quoteAmount
                        }),
                        nonce: params.userNonce + i,
                        deadline: params.deadline
                    }),
                    ISignatureTransfer.SignatureTransferDetails({
                        to: fill.agent,
                        requestedAmount: fill.quoteAmount
                    }),
                    params.user,
                    params.userSignature
                );
            } else {
                permit2.permitTransferFrom(
                    ISignatureTransfer.PermitTransferFrom({
                        permitted: ISignatureTransfer.TokenPermissions({
                            token: params.baseToken,
                            amount: fill.baseAmount
                        }),
                        nonce: params.userNonce + i,
                        deadline: params.deadline
                    }),
                    ISignatureTransfer.SignatureTransferDetails({
                        to: fill.agent,
                        requestedAmount: fill.baseAmount
                    }),
                    params.user,
                    params.userSignature
                );
            }
        }

        // Phase 2: Transfer each agent's tokens to user
        for (uint256 i = 0; i < params.fills.length; i++) {
            AgentFill calldata fill = params.fills[i];

            if (params.isBuy) {
                permit2.permitTransferFrom(
                    ISignatureTransfer.PermitTransferFrom({
                        permitted: ISignatureTransfer.TokenPermissions({
                            token: params.baseToken,
                            amount: fill.baseAmount
                        }),
                        nonce: fill.agentNonce,
                        deadline: params.deadline
                    }),
                    ISignatureTransfer.SignatureTransferDetails({
                        to: params.user,
                        requestedAmount: fill.baseAmount
                    }),
                    fill.agent,
                    fill.agentSignature
                );
            } else {
                permit2.permitTransferFrom(
                    ISignatureTransfer.PermitTransferFrom({
                        permitted: ISignatureTransfer.TokenPermissions({
                            token: params.quoteToken,
                            amount: fill.quoteAmount
                        }),
                        nonce: fill.agentNonce,
                        deadline: params.deadline
                    }),
                    ISignatureTransfer.SignatureTransferDetails({
                        to: params.user,
                        requestedAmount: fill.quoteAmount
                    }),
                    fill.agent,
                    fill.agentSignature
                );
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
