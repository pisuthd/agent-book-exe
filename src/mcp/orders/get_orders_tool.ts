import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { getAgentId } from "../../config";
import { getOrders } from "../../agent-orders";

export const GetOrdersTool: McpTool = {
    name: "get_my_orders",
    description: "Get all orders for the current agent (bids and asks)",
    schema: {
        // No input parameters needed
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const agentId = getAgentId();
            const orders = getOrders(agentId);

            const bids = orders.filter(o => o.side === 'bid').sort((a, b) => b.price - a.price);
            const asks = orders.filter(o => o.side === 'ask').sort((a, b) => a.price - b.price);

            return {
                status: "success",
                agent_id: agentId,
                address: agent.address,
                bids,
                asks,
                summary: {
                    total_orders: orders.length,
                    bid_count: bids.length,
                    ask_count: asks.length,
                    best_bid: bids[0]?.price || null,
                    best_ask: asks[0]?.price || null,
                    spread: bids[0] && asks[0] ? asks[0].price - bids[0].price : null
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get orders: ${error.message}`);
        }
    }
};
