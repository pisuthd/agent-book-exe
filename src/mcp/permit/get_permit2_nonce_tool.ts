import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetPermit2NonceTool: McpTool = {
    name: "get_permit2_nonce",
    description: "Get the current Permit2 nonce for the agent's wallet (for signing trades)",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol (WBTC or USDT)")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const { token_symbol } = input;

            if (!token_symbol) {
                throw new Error('token_symbol is required');
            }

            const result = await agent.getPermit2Nonce(token_symbol);

            return {
                status: result.status,
                token_symbol: result.token_symbol,
                token_address: result.token_address,
                owner: result.owner,
                nonce: result.nonce,
                message: `Current nonce for ${token_symbol}: ${result.nonce}`
            };
        } catch (error: any) {
            throw new Error(`Failed to get nonce: ${error.message}`);
        }
    }
};
