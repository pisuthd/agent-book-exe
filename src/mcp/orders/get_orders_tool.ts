import { type McpTool } from "../../types";
import { type WalletAgent } from "../../agent/wallet";
import { BACKEND_URL } from "../../config";

export const GetOrdersTool: McpTool = {
    name: "get_my_orders",
    description: "Get all orders for the agent (bids and asks)",
    schema: {},
    handler: async (agent: WalletAgent, _input: Record<string, any>) => {
        try {
            const peerId = agent.peerId;

            // Get orders from backend by wallet address
            const response = await fetch(`${BACKEND_URL}/api/orders/${agent.address}`);
            if (!response.ok) {
                throw new Error(`Backend error: ${response.statusText}`);
            }
            const orders: any = await response.json();

            const bids = orders.filter((o: any) => o.side === 'bid').sort((a: any, b: any) => b.price - a.price);
            const asks = orders.filter((o: any) => o.side === 'ask').sort((a: any, b: any) => a.price - b.price);

            return {
                status: "success",
                peer_id: peerId,
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