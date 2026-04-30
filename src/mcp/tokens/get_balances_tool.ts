import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetTokenBalancesTool: McpTool = {
    name: "get_token_balances",
    description: "Get ETH and ERC20 token balances for the agent's wallet",
    schema: {
        // No input parameters needed
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const balances = await agent.getTokenBalances();

            return {
                status: "success",
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
