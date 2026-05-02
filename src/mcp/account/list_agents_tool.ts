import { type McpTool } from "../../types";
import { type WalletAgent } from "../../agent/wallet";
import { BACKEND_URL } from "../../config";

export const ListAgentsTool: McpTool = {
    name: "list_agents",
    description: "Get all agents registered in the system",
    schema: {},
    handler: async (_agent: WalletAgent, _input: Record<string, any>) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/agents`);
            if (!response.ok) {
                throw new Error(`Backend error: ${response.statusText}`);
            }
            const agents: any = await response.json();

            return {
                status: "success",
                total_agents: agents.length,
                agents: agents.map((a: any) => ({
                    peer_id: a.peer_id,
                    name: a.name,
                    wallet_address: a.wallet_address,
                    created_at: a.created_at,
                    stats: a.stats
                }))
            };
        } catch (error: any) {
            throw new Error(`Failed to list agents: ${error.message}`);
        }
    }
};