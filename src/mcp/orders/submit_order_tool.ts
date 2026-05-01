import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";
import { BACKEND_URL } from "../../config";

export const SubmitOrderTool: McpTool = {
    name: "submit_order",
    description: "Submit a new order (bid or ask) to the order book for a specific agent",
    schema: {
        side: z.string()
            .describe("Order side: 'bid' (buy) or 'ask' (sell)"),
        price: z.string()
            .describe("Price in USDT per WBTC (e.g., '85000')"),
        size: z.string()
            .describe("Size in WBTC (e.g., '0.1')"),
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const { side, price, size } = input;
            const agent = agentManager.resolve(input.agent_name);

            if (!side || !price || !size) {
                throw new Error('side, price, and size are required');
            }

            if (!['bid', 'ask'].includes(side.toLowerCase())) {
                throw new Error('side must be "bid" or "ask"');
            }

            const peerId = agent.peerId;
            const timestamp = Date.now().toString();

            // Sign the order
            const message = JSON.stringify({ action: 'submit_order', side, price, size, timestamp });
            const signature = await agent.signMessage(message);

            // Submit to backend
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: agent.address,
                    peer_id: peerId,
                    side: side.toLowerCase(),
                    price: parseFloat(price),
                    size: parseFloat(size),
                    signature,
                    timestamp
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json();
                throw new Error(errorData.error || `Backend error: ${response.statusText}`);
            }

            const order: any = await response.json();

            return {
                status: "success",
                message: `✅ Order submitted: ${side.toUpperCase()} ${size} WBTC @ $${price}`,
                agent_name: agent.nodeName,
                order: {
                    id: order.id,
                    side: order.side,
                    price: order.price,
                    size: order.size,
                    address: order.address,
                    peer_id: order.peer_id,
                    created_at: order.created_at
                },
                peer_id: peerId
            };
        } catch (error: any) {
            throw new Error(`Failed to submit order: ${error.message}`);
        }
    }
};