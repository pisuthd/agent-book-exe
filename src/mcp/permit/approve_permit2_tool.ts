import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const ApprovePermit2Tool: McpTool = {
    name: "approve_permit2",
    description: "Approve token to Permit2 contract (one-time setup for trading)",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to approve (WBTC or USDT)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const { token_symbol } = input;

            if (!token_symbol) {
                throw new Error('token_symbol is required');
            }

            const result = await agent.approveToPermit2(token_symbol);

            return {
                status: result.status,
                message: `✅ Approved ${token_symbol} for Permit2`,
                transaction_hash: result.transaction_hash,
                explorer_url: result.explorer_url,
                details: {
                    token_symbol: result.token_symbol,
                    spender: result.spender,
                    amount: result.amount
                },
                recommendations: [
                    "Save the transaction hash",
                    "Wait for confirmation (~15 seconds on Sepolia)",
                    "You can now sign trades using Permit2"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to approve token: ${error.message}`);
        }
    }
};
