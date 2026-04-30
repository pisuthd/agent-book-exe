import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { getPeerId } from "../../config";
import { addOrder } from "../../agent-orders";

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
            const order = addOrder(peerId, side, price, size);

            return {
                status: "success",
                message: `✅ Order submitted: ${side.toUpperCase()} ${size} BTC @ ${price} USDT`,
                order_id: order.id,
                order: {
                    id: order.id,
                    side: order.side,
                    price: order.price,
                    size: order.size,
                    created_at: order.createdAt
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to submit order: ${error.message}`);
        }
    }
};
