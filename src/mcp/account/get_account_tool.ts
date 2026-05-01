import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";

export const GetAccountTool: McpTool = {
    name: "get_account",
    description: "Get account information for a specific agent (or default agent). Returns peer ID, wallet address, and ENS name.",
    schema: {
        agent_name: z.string().optional()
            .describe("Agent name from NODE_IDS (e.g., 'agentbook-one.eth'). Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const agent = agentManager.resolve(input.agent_name);
            const peerId = agent.peerId;
            const address = agent.address;

            // Try to resolve ENS name
            let ensName: string | null = null;
            try {
                ensName = await agent.publicClient.getEnsName({ address });
            } catch {
                // ENS resolution failed
                ensName = null;
            }

            return {
                status: "success",
                agent_name: agent.nodeName,
                peer_id: peerId,
                address: address,
                ens_name: ensName,
                display_name: ensName || address,
                network: {
                    chain_id: 11155111,
                    name: "Sepolia"
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get account: ${error.message}`);
        }
    }
};