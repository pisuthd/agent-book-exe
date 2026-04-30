import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";

export const GetInventoryTool: McpTool = {
    name: "get_inventory",
    description: "Get current BTC/USDT inventory with skew calculation",
    schema: {
        // No input parameters needed
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const result = await agent.getInventory();

            const skewMessage = result.preference === 'neutral' 
                ? 'Inventory is balanced'
                : result.preference === 'want_to_sell'
                    ? 'Long BTC - should sell to balance'
                    : 'Short BTC - should buy to balance';

            return {
                status: result.status,
                address: result.address,
                btc: result.btc,
                usdt: result.usdt,
                inventory_skew: result.inventory_skew,
                preference: result.preference,
                message: `BTC: ${result.btc.balance_formatted}, USDT: ${result.usdt.balance_formatted}\nSkew: ${(result.inventory_skew * 100).toFixed(1)}% (${result.preference.replace('_', ' ')})`,
                recommendations: result.preference !== 'neutral' 
                    ? [skewMessage]
                    : ['Inventory is balanced - no rebalancing needed']
            };
        } catch (error: any) {
            throw new Error(`Failed to get inventory: ${error.message}`);
        }
    }
};
