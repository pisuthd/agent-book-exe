import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";

export const ApproveTool: McpTool = {
    name: "approve_tokens",
    description: "Approve token to Settlement contract (one-time setup for trading). Agents use ERC20 approval for fills.",
    schema: {
        token_symbol: z.string()
            .describe("Token symbol to approve (WBTC or USDT)"),
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const { token_symbol } = input;
            const agent = agentManager.resolve(input.agent_name);

            if (!token_symbol) {
                throw new Error('token_symbol is required');
            }

            const result = await agent.approveToken(token_symbol);

            return {
                status: result.status,
                message: `✅ Approved ${token_symbol} for Settlement contract`,
                agent_name: agent.nodeName,
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