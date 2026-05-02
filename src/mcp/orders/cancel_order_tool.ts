import { z } from "zod";
import { type McpTool } from "../../types";
import { type WalletAgent } from "../../agent/wallet";
import { BACKEND_URL } from "../../config";

export const CancelOrderTool: McpTool = {
    name: "cancel_order",
    description: "Cancel an existing order by its ID",
    schema: {
        order_id: z.string()
            .describe("The ID of the order to cancel"),
    },
    handler: async (agent: WalletAgent, input: Record<string, any>) => {
        try {
            const { order_id } = input;

            if (!order_id) {
                throw new Error('order_id is required');
            }

            const peerId = agent.peerId;
            const timestamp = Date.now().toString();

            // Sign the cancel message
            const message = JSON.stringify({ action: 'cancel_order', order_id, timestamp });
            const signature = await agent.signMessage(message);

            // Cancel on backend
            const response = await fetch(`${BACKEND_URL}/api/orders/${order_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: agent.address,
                    signature,
                    timestamp
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json();
                throw new Error(errorData.error || `Backend error: ${response.statusText}`);
            }

            return {
                status: "success",
                message: `✅ Order cancelled: ${order_id}`,
                cancelled_order_id: order_id,
                peer_id: peerId
            };
        } catch (error: any) {
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    }
};