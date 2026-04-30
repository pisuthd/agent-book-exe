import { z } from "zod";
import { WalletAgent } from "../../agent/wallet";
import { type McpTool } from "../../types";
import { getPeerId } from "../../config";
import { cancelOrder, getOrders } from "../../agent-orders";

export const CancelOrderTool: McpTool = {
    name: "cancel_order",
    description: "Cancel an existing order by its ID",
    schema: {
        order_id: z.string()
            .describe("The ID of the order to cancel")
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const { order_id } = input;

            if (!order_id) {
                throw new Error('order_id is required');
            }

            const peerId = getPeerId();
            
            // Check if order exists
            const orders = getOrders(peerId);
            const order = orders.find(o => o.id === order_id);
            
            if (!order) {
                throw new Error(`Order ${order_id} not found`);
            }

            const success = cancelOrder(peerId, order_id);

            if (!success) {
                throw new Error('Failed to cancel order');
            }

            return {
                status: "success",
                message: `✅ Order cancelled: ${order.side.toUpperCase()} ${order.size} BTC @ ${order.price} USDT`,
                cancelled_order_id: order_id
            };
        } catch (error: any) {
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    }
};
