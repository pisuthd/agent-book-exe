import { z } from "zod";
import { type McpTool } from "../../types";
import { type AgentManager } from "../../agent/agent-manager";
import { P2P_NODE_URL } from "../../config";

interface P2PRequest {
    jsonrpc: string;
    method: string;
    id: number;
    params: {
        agent: string;
        "session-id": string;
        message: string;
    };
}

interface P2PResponse {
    jsonrpc: string;
    id: number;
    result?: {
        content?: Array<{ type: string; text: string }>;
    };
    error?: {
        code: number;
        message: string;
    };
}

export const SendMessageTool: McpTool = {
    name: "send_message",
    description: "Send a message to another agent via P2P network. The message will be prefixed with your agent name.",
    schema: {
        peer_id: z.string()
            .describe("The target agent's peer ID (64 hex characters)"),
        agent: z.string()
            .describe("The target agent's ENS name (e.g., 'agentbook-one.eth')"),
        message: z.string()
            .describe("The message to send to the target agent"),
        agent_name: z.string().optional()
            .describe("Your agent name from NODE_IDS. Defaults to first agent if not provided.")
    },
    handler: async (agentManager: AgentManager, input: Record<string, any>) => {
        try {
            const { peer_id: targetPeerId, agent: targetAgent, message } = input;
            const agent = agentManager.resolve(input.agent_name);
            const address = agent.address;

            // Try to resolve ENS name
            let myName: string;
            try {
                const ensName = await agent.publicClient.getEnsName({ address });
                myName = ensName || address;
            } catch {
                // ENS resolution failed, use address
                myName = address;
            }

            // Prefix message with sender name
            const prefixedMessage = `[${myName}] ${message}`;

            // Build P2P request
            const p2pRequest: P2PRequest = {
                jsonrpc: "2.0",
                method: "tools/call",
                id: 1,
                params: {
                    agent: targetAgent,
                    "session-id": "1234", // any ID will be routed to each agent's default session
                    message: prefixedMessage
                }
            };

            // Send to P2P gateway using target peer ID for routing
            const response = await fetch(`${P2P_NODE_URL}/mcp/${targetPeerId}/openclaw-gateway`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p2pRequest)
            });

            if (!response.ok) {
                throw new Error(`P2P gateway error: ${response.statusText}`);
            }

            const p2pResponse = await response.json() as P2PResponse;

            // Extract response text
            let responseText = "No response";
            if (p2pResponse.result?.content) {
                responseText = p2pResponse.result.content.map(c => c.text).join('\n');
            } else if (p2pResponse.error) {
                responseText = `Error: ${p2pResponse.error.message}`;
            }

            return {
                status: "success",
                from: myName,
                from_agent_name: agent.nodeName,
                to: targetAgent,
                target_peer_id: targetPeerId,
                message: prefixedMessage,
                response: responseText
            };
        } catch (error: any) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }
};