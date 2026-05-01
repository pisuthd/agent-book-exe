import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";
import { BACKEND_URL } from "../../config";

export const GetOrdersTool: McpTool = {
    name: "get_my_orders",
    description: "Get all orders for a specific agent (bids and asks)",
    schema: {
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const agent = agentManager.resolve(input.agent_name);
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
                agent_name: agent.nodeName,
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