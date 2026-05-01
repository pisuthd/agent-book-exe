import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";

export const MintTokensTool: McpTool = {
    name: "mint_mock_tokens",
    description: "Mint mock ERC20 tokens (WBTC or USDT) to a specific agent's wallet",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to mint (WBTC or USDT)"),
        amount: z.string()
            .describe("Amount to mint in human-readable format (e.g., '1000' for 1000 WBTC)"),
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const { token_symbol, amount } = input;
            const agent = agentManager.resolve(input.agent_name);

            if (!token_symbol || !amount) {
                throw new Error('token_symbol and amount are required');
            }

            const result = await agent.mintTokens(token_symbol, amount);

            return {
                status: result.status,
                message: `✅ Minted ${result.amountFormatted} ${result.token_symbol} to ${result.recipient}`,
                agent_name: agent.nodeName,
                transaction_hash: result.transaction_hash,
                explorer_url: result.explorer_url,
                details: {
                    token_symbol: result.token_symbol,
                    amount: result.amountFormatted,
                    recipient: result.recipient
                },
                recommendations: [
                    "Save the transaction hash for reference",
                    "Wait for transaction confirmation (usually ~15 seconds on Sepolia)",
                    "Check your token balance to confirm receipt"
                ]
            };
        } catch (error: any) {
            throw new Error(`Failed to mint tokens: ${error.message}`);
        }
    }
};