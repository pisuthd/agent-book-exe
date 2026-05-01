import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";

export const GetTokenBalancesTool: McpTool = {
    name: "get_token_balances",
    description: "Get ETH and ERC20 token balances for a specific agent's wallet",
    schema: {
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const agent = agentManager.resolve(input.agent_name);
            const balances = await agent.getTokenBalances();

            return {
                status: "success",
                agent_name: agent.nodeName,
                address: balances.address,
                native_balance: balances.nativeBalanceFormatted,
                tokens: balances.tokens.map((token: any) => ({
                    symbol: token.symbol,
                    address: token.address,
                    balance: token.balanceFormatted,
                    decimals: token.decimals
                })),
                network: balances.network,
                message: `ETH balance: ${balances.nativeBalanceFormatted}\n` +
                    `WBTC balance: ${balances.tokens.find((t: any) => t.symbol === 'WBTC')?.balanceFormatted || '0'}\n` +
                    `USDT balance: ${balances.tokens.find((t: any) => t.symbol === 'USDT')?.balanceFormatted || '0'}`
            };
        } catch (error: any) {
            throw new Error(`Failed to get token balances: ${error.message}`);
        }
    }
};