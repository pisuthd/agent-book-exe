import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";
import { BACKEND_URL } from "../../config";

export const CancelOrderTool: McpTool = {
    name: "cancel_order",
    description: "Cancel an existing order by its ID for a specific agent",
    schema: {
        order_id: z.string()
            .describe("The ID of the order to cancel"),
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const { order_id } = input;
            const agent = agentManager.resolve(input.agent_name);

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
                agent_name: agent.nodeName,
                cancelled_order_id: order_id,
                peer_id: peerId
            };
        } catch (error: any) {
            throw new Error(`Failed to cancel order: ${error.message}`);
        }
    }
};