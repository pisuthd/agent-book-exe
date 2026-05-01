import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";
import { BACKEND_URL } from "../../config";

interface Order {
    id: string;
    address: string;
    peer_id: string;
    side: 'bid' | 'ask';
    price: number;
    size: number;
    signature: string;
    created_at: string;
}

// Public order
interface PublicOrder {
    id: string;
    address: string;
    peer_id: string;
    side: 'bid' | 'ask';
    price: number;
    size: number;
    created_at: string;
}

function toPublicOrder(order: Order): PublicOrder {
    return {
        id: order.id,
        address: order.address,
        peer_id: order.peer_id,
        side: order.side,
        price: order.price,
        size: order.size,
        created_at: order.created_at
    };
}

export const GetMarketOrdersTool: McpTool = {
    name: "get_market_orders",
    description: "Get all orders across the entire system (all peers). Returns the full order book with bids and asks from all agents.",
    schema: {
        // No input parameters needed - shows all peers' orders
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const agent = agentManager.getDefault();

            // Get all orders from backend (system-wide)
            const response = await fetch(`${BACKEND_URL}/api/orders`);
            if (!response.ok) {
                throw new Error(`Backend error: ${response.statusText}`);
            }
            const orders: any = await response.json();

            // Convert to public orders (remove signature)
            const publicOrders = orders.map(toPublicOrder);

            const bids = publicOrders
                .filter((o: any) => o.side === 'bid')
                .sort((a: any, b: any) => b.price - a.price);
            const asks = publicOrders
                .filter((o: any) => o.side === 'ask')
                .sort((a: any, b: any) => a.price - b.price);

            // Group by peer for better visualization
            const ordersByPeer: Record<string, { bids: PublicOrder[], asks: PublicOrder[] }> = {};
            for (const order of publicOrders) {
                if (!ordersByPeer[order.peer_id]) {
                    ordersByPeer[order.peer_id] = { bids: [], asks: [] };
                }
                if (order.side === 'bid') {
                    ordersByPeer[order.peer_id].bids.push(order);
                } else {
                    ordersByPeer[order.peer_id].asks.push(order);
                }
            }

            return {
                status: "success",
                total_orders: publicOrders.length,
                bids,
                asks,
                orders_by_peer: ordersByPeer,
                summary: {
                    total_orders: publicOrders.length,
                    bid_count: bids.length,
                    ask_count: asks.length,
                    best_bid: bids[0]?.price || null,
                    best_ask: asks[0]?.price || null,
                    spread: bids[0] && asks[0] ? asks[0].price - bids[0].price : null,
                    peer_count: Object.keys(ordersByPeer).length
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get market orders: ${error.message}`);
        }
    }
};