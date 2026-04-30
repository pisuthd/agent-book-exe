import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const ApproveTool: McpTool = {
    name: "approve_tokens",
    description: "Approve token to Settlement contract (one-time setup for trading). Agents use ERC20 approval for fills.",
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

            const result = await agent.approveToken(token_symbol);

            return {
                status: result.status,
                message: `✅ Approved ${token_symbol} for Settlement contract`,
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
                    "You can now fill orders as an agent"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to approve token: ${error.message}`);
        }
    }
};
