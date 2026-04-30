import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { getPeerId, BACKEND_URL } from "../../config";
 

export const SubmitOrderTool: McpTool = {
    name: "submit_order",
    description: "Submit a new order (bid or ask) for the current peer",
    schema: {
        side: z.enum(['bid', 'ask'])
            .describe("Order side: 'bid' (buy) or 'ask' (sell)"),
        price: z.number()
            .describe("Price in USDT per BTC"),
        size: z.number()
            .describe("Order size in BTC")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const { side, price, size } = input;

            if (!side || price === undefined || size === undefined) {
                throw new Error('side, price, and size are required');
            }

            if (price <= 0) {
                throw new Error('Price must be positive');
            }

            if (size <= 0) {
                throw new Error('Size must be positive');
            }

            const peerId = getPeerId();
            const timestamp = Date.now().toString();

            // Sign the order message
            const message = JSON.stringify({ action: 'submit_order', side, price, size, timestamp, peer_id });
            const signature = await agent.signMessage(message);

            // Submit to backend
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: agent.address,
                    peer_id: peerId,
                    side,
                    price,
                    size,
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
                message: `✅ Order submitted: ${side.toUpperCase()} ${size} BTC @ ${price} USDT`,
                order_id: order.id,
                peer_id: peerId,
                order: {
                    id: order.id,
                    side: order.side,
                    price: order.price,
                    size: order.size,
                    created_at: order.created_at
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to submit order: ${error.message}`);
        }
    }
};